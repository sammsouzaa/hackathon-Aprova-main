/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Serviço de captura de áudio multi-canal (microfone e monitor de saída da reunião).
 * Utiliza um único AudioContext a 16 kHz para sincronismo de relógio absoluto (D3).
 */

export type CanalAudio = 'microfone' | 'monitor';

export interface BlocoAudioCapturado {
  canal: CanalAudio;
  amostras: Float32Array;
  tempoMs: number;
  rms: number;
}

export interface DispositivoAudioInfo {
  deviceId: string;
  label: string;
  groupId?: string;
}

export interface EstadoCaptura {
  ativo: boolean;
  pausado: boolean;
  modoUmCanal: boolean;
  microfoneLabel: string;
  monitorLabel: string;
  tempoInicioMs: number;
}

export type ListenerBlocoAudio = (bloco: BlocoAudioCapturado) => void;
export type ListenerNivelAudio = (canal: CanalAudio, nivelRms: number) => void;
export type ListenerEstadoCaptura = (estado: EstadoCaptura) => void;

class ServicoCapturaAudio {
  private audioContext: AudioContext | null = null;
  private workletCarregado = false;

  private streamMic: MediaStream | null = null;
  private streamMon: MediaStream | null = null;

  private sourceMic: MediaStreamAudioSourceNode | null = null;
  private sourceMon: MediaStreamAudioSourceNode | null = null;

  private workletMic: AudioWorkletNode | null = null;
  private workletMon: AudioWorkletNode | null = null;
  private gainSilencioso: GainNode | null = null;

  private microfoneDeviceId: string = 'default';
  private monitorDeviceId: string = '';

  private microfoneLabel: string = 'Microfone padrão';
  private monitorLabel: string = 'Áudio da reunião (monitor)';

  private pausado = false;
  private modoUmCanal = false;
  private tempoInicioMs = 0;

  private listenersBloco = new Set<ListenerBlocoAudio>();
  private listenersNivel = new Set<ListenerNivelAudio>();
  private listenersEstado = new Set<ListenerEstadoCaptura>();

  constructor() {
    // Carregar preferências salvas se disponível via IPC
    if (typeof window !== 'undefined' && window.prumoDesktop?.audio?.obterPreferencias) {
      window.prumoDesktop.audio.obterPreferencias().then((prefs) => {
        if (prefs) {
          if (prefs.microfoneId) this.microfoneDeviceId = prefs.microfoneId;
          // 'default' é a entrada padrão (o próprio microfone), não um monitor: vale como automático.
          if (prefs.monitorId && prefs.monitorId !== 'default') this.monitorDeviceId = prefs.monitorId;
        }
      });
    }

    // Ouvir alterações de sink do sistema operacional
    if (typeof window !== 'undefined' && window.prumoDesktop?.audio?.aoMudarSink) {
      window.prumoDesktop.audio.aoMudarSink(async () => {
        if (this.audioContext && !this.pausado) {
          console.log('[prumo:captura] Sink de saída alterado. Reconectando monitor...');
          await this.reconectarMonitor();
        }
      });
    }
  }

  /**
   * Instante (ms, relógio do AudioContext) em que o bloco termina. O worklet informa o `currentTime`
   * do último quantum de 128 amostras do bloco; usar o relógio da thread principal na chegada da
   * mensagem acrescentaria o atraso variável do postMessage e estragaria as fronteiras da fala.
   */
  private fimDoBlocoMs(tempoSegundos: number | undefined): number {
    const taxa = this.audioContext?.sampleRate ?? 16000;
    const base = typeof tempoSegundos === 'number' ? tempoSegundos : (this.audioContext?.currentTime ?? 0);
    return Math.round((base + 128 / taxa) * 1000);
  }

  /** Relógio do AudioContext em ms (mesma base de `BlocoAudioCapturado.tempoMs`); null sem captura. */
  tempoContextoMs(): number | null {
    return this.audioContext ? Math.round(this.audioContext.currentTime * 1000) : null;
  }

  onBloco(fn: ListenerBlocoAudio): () => void {
    this.listenersBloco.add(fn);
    return () => this.listenersBloco.delete(fn);
  }

  onNivel(fn: ListenerNivelAudio): () => void {
    this.listenersNivel.add(fn);
    return () => this.listenersNivel.delete(fn);
  }

  onEstado(fn: ListenerEstadoCaptura): () => void {
    this.listenersEstado.add(fn);
    fn(this.obterEstado());
    return () => this.listenersEstado.delete(fn);
  }

  obterEstado(): EstadoCaptura {
    return {
      ativo: Boolean(this.audioContext && this.audioContext.state === 'running'),
      pausado: this.pausado,
      modoUmCanal: this.modoUmCanal,
      microfoneLabel: this.microfoneLabel,
      monitorLabel: this.monitorLabel,
      tempoInicioMs: this.tempoInicioMs
    };
  }

  private notificarEstado() {
    const estado = this.obterEstado();
    this.listenersEstado.forEach((fn) => fn(estado));
  }

  async listarDispositivos(): Promise<{
    microfones: DispositivoAudioInfo[];
    monitores: DispositivoAudioInfo[];
  }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return { microfones: [], monitores: [] };
    }

    try {
      // Destravar labels solicitando permissão rápida se necessário
      const devs = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devs.filter((d) => d.kind === 'audioinput');

      const microfones: DispositivoAudioInfo[] = [];
      const monitores: DispositivoAudioInfo[] = [];

      for (const dev of audioInputs) {
        const labelLower = dev.label.toLowerCase();
        const info: DispositivoAudioInfo = {
          deviceId: dev.deviceId,
          label: dev.label || `Dispositivo (${dev.deviceId.slice(0, 5)})`,
          groupId: dev.groupId
        };

        if (labelLower.includes('monitor') || labelLower.includes('prumo-reuniao')) {
          monitores.push(info);
        } else {
          microfones.push(info);
        }
      }

      return { microfones, monitores };
    } catch (err) {
      console.warn('[prumo:captura] Erro ao enumerar dispositivos:', err);
      return { microfones: [], monitores: [] };
    }
  }

  async prepararWorklet(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
    }

    if (!this.workletCarregado) {
      try {
        await this.audioContext.audioWorklet.addModule('/worklets/worklet-captura.js');
        this.workletCarregado = true;
      } catch (err) {
        console.error('[prumo:captura] Falha ao carregar AudioWorklet:', err);
        throw err;
      }
    }
  }

  async iniciarCaptura(tempoZeroMs: number = Date.now()): Promise<void> {
    this.tempoInicioMs = tempoZeroMs;
    this.pausado = false;

    await this.prepararWorklet();
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Criar nó de ganho silencioso conectado ao destino para manter o grafo de áudio vivo
    if (!this.gainSilencioso && this.audioContext) {
      this.gainSilencioso = this.audioContext.createGain();
      this.gainSilencioso.gain.value = 0;
      this.gainSilencioso.connect(this.audioContext.destination);
    }

    // 1. Iniciar Microfone
    await this.conectarMicrofone();

    // 2. Iniciar Monitor (Áudio da Reunião)
    await this.conectarMonitor();

    this.notificarEstado();
  }

  private async conectarMicrofone(): Promise<void> {
    if (!this.audioContext) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.microfoneDeviceId && this.microfoneDeviceId !== 'default'
            ? { exact: this.microfoneDeviceId }
            : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      this.streamMic = await navigator.mediaDevices.getUserMedia(constraints);
      const track = this.streamMic.getAudioTracks()[0];
      this.microfoneLabel = track?.label || 'Microfone';

      this.sourceMic = this.audioContext.createMediaStreamSource(this.streamMic);
      this.workletMic = new AudioWorkletNode(this.audioContext, 'captura-audio-processor', {
        processorOptions: { canal: 'microfone' }
      });

      this.workletMic.port.onmessage = (event) => {
        if (this.pausado) return;
        const { canal, amostras, rms } = event.data;
        const f32 = new Float32Array(amostras);
        const agoraMs = this.fimDoBlocoMs(event.data.tempoSegundos);

        this.listenersNivel.forEach((fn) => fn(canal, rms));
        this.listenersBloco.forEach((fn) =>
          fn({
            canal,
            amostras: f32,
            tempoMs: agoraMs,
            rms
          })
        );
      };

      this.sourceMic.connect(this.workletMic);
      if (this.gainSilencioso) {
        this.workletMic.connect(this.gainSilencioso);
      }
    } catch (err) {
      console.error('[prumo:captura] Falha ao capturar microfone:', err);
      throw err;
    }
  }

  private async conectarMonitor(): Promise<void> {
    if (!this.audioContext) return;

    // Se estiver em Electron, ativar o remap sob demanda
    if (typeof window !== 'undefined' && window.prumoDesktop?.audio?.ativarMonitor) {
      try {
        await window.prumoDesktop.audio.ativarMonitor();
      } catch (err) {
        console.warn('[prumo:captura] Falha ao ativar remap no desktop:', err);
      }
    }

    try {
      // Procurar dispositivo de monitor disponível
      const { monitores } = await this.listarDispositivos();
      let targetDeviceId = this.monitorDeviceId === 'default' ? '' : this.monitorDeviceId;

      if (!targetDeviceId && monitores.length > 0) {
        // Preferir o Prumo-Reuniao se existir
        const prumoMon = monitores.find((m) => m.label.includes('Prumo-Reuniao'));
        targetDeviceId = prumoMon ? prumoMon.deviceId : monitores[0].deviceId;
      }

      if (!targetDeviceId && monitores.length === 0) {
        console.warn('[prumo:captura] Nenhum monitor de áudio encontrado. Operando em modo 1 canal.');
        this.modoUmCanal = true;
        this.monitorLabel = 'Sem canal de reunião (só microfone)';
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: { exact: targetDeviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };

      this.streamMon = await navigator.mediaDevices.getUserMedia(constraints);
      const track = this.streamMon.getAudioTracks()[0];
      // Guarda: se o "monitor" é o mesmo dispositivo do microfone, a voz da pessoa entraria como
      // "Prefeitura". Melhor um canal só, avisado, do que dois canais iguais.
      const idMic = this.streamMic?.getAudioTracks()[0]?.getSettings().deviceId;
      const idMon = track?.getSettings().deviceId;
      if (idMic && idMon && idMic === idMon) {
        this.streamMon.getTracks().forEach((t) => t.stop());
        this.streamMon = null;
        this.modoUmCanal = true;
        this.monitorLabel = 'Sem canal de reunião (só microfone)';
        return;
      }
      this.monitorLabel = track?.label || 'Áudio da reunião';
      this.modoUmCanal = false;

      this.sourceMon = this.audioContext.createMediaStreamSource(this.streamMon);
      this.workletMon = new AudioWorkletNode(this.audioContext, 'captura-audio-processor', {
        processorOptions: { canal: 'monitor' }
      });

      this.workletMon.port.onmessage = (event) => {
        if (this.pausado) return;
        const { canal, amostras, rms } = event.data;
        const f32 = new Float32Array(amostras);
        const agoraMs = this.fimDoBlocoMs(event.data.tempoSegundos);

        this.listenersNivel.forEach((fn) => fn(canal, rms));
        this.listenersBloco.forEach((fn) =>
          fn({
            canal,
            amostras: f32,
            tempoMs: agoraMs,
            rms
          })
        );
      };

      this.sourceMon.connect(this.workletMon);
      if (this.gainSilencioso) {
        this.workletMon.connect(this.gainSilencioso);
      }
    } catch (err) {
      console.warn('[prumo:captura] Falha ao conectar monitor. Degradação para 1 canal:', err);
      this.modoUmCanal = true;
      this.monitorLabel = 'Sem canal de reunião (só microfone)';
    }
  }

  private async reconectarMonitor(): Promise<void> {
    if (this.sourceMon) {
      try {
        this.sourceMon.disconnect();
      } catch {}
      this.sourceMon = null;
    }
    if (this.workletMon) {
      try {
        this.workletMon.disconnect();
      } catch {}
      this.workletMon = null;
    }
    if (this.streamMon) {
      this.streamMon.getTracks().forEach((t) => t.stop());
      this.streamMon = null;
    }
    await this.conectarMonitor();
    this.notificarEstado();
  }

  pausarCaptura(): void {
    this.pausado = true;
    this.notificarEstado();
  }

  retomarCaptura(): void {
    this.pausado = false;
    this.notificarEstado();
  }

  async pararCaptura(): Promise<void> {
    this.pausado = false;

    if (this.streamMic) {
      this.streamMic.getTracks().forEach((t) => t.stop());
      this.streamMic = null;
    }
    if (this.streamMon) {
      this.streamMon.getTracks().forEach((t) => t.stop());
      this.streamMon = null;
    }

    if (this.sourceMic) {
      try {
        this.sourceMic.disconnect();
      } catch {}
      this.sourceMic = null;
    }
    if (this.sourceMon) {
      try {
        this.sourceMon.disconnect();
      } catch {}
      this.sourceMon = null;
    }

    if (this.workletMic) {
      try {
        this.workletMic.disconnect();
      } catch {}
      this.workletMic = null;
    }
    if (this.workletMon) {
      try {
        this.workletMon.disconnect();
      } catch {}
      this.workletMon = null;
    }

    // O nó de ganho pertence ao AudioContext que vai fechar: sem descartá-lo, a captura seguinte
    // (segunda reunião na mesma sessão) falha ao conectar nós de contextos diferentes.
    if (this.gainSilencioso) {
      try {
        this.gainSilencioso.disconnect();
      } catch {}
      this.gainSilencioso = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
      this.workletCarregado = false;
    }

    // Desativar remap se estiver no Electron
    if (typeof window !== 'undefined' && window.prumoDesktop?.audio?.desativarMonitor) {
      try {
        await window.prumoDesktop.audio.desativarMonitor();
      } catch {}
    }

    this.notificarEstado();
  }

  async selecionarDispositivo(canal: CanalAudio, deviceId: string): Promise<void> {
    if (canal === 'microfone') {
      this.microfoneDeviceId = deviceId;
      if (this.audioContext && !this.pausado) {
        if (this.sourceMic) this.sourceMic.disconnect();
        if (this.streamMic) this.streamMic.getTracks().forEach((t) => t.stop());
        await this.conectarMicrofone();
      }
    } else {
      this.monitorDeviceId = deviceId;
      if (this.audioContext && !this.pausado) {
        await this.reconectarMonitor();
      }
    }

    // Salvar preferências
    if (typeof window !== 'undefined' && window.prumoDesktop?.audio?.salvarPreferencias) {
      window.prumoDesktop.audio.salvarPreferencias({
        microfoneId: this.microfoneDeviceId,
        monitorId: this.monitorDeviceId
      });
    }

    this.notificarEstado();
  }
}

export const servicoCaptura = new ServicoCapturaAudio();
