/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sessão de Transcrição no Renderer.
 * Orquestra: captura de blocos -> segmentação/VAD -> motor STT -> deduplicação de eco -> persistência em JSON.
 */
import type { BlocoAudioCapturado } from '../audio/captura.ts';
import { CoordenadorDeSegmentacao } from '../audio/segmentacao.ts';
import type { SegmentoClassificado } from '../audio/segmentacao.ts';
import { idsDuplicadosPorEco } from '../audio/eco.ts';
import type { ConfigVad } from '../audio/vad.ts';
import type { MotorSTT } from '../stt/tipos.ts';
import type { PersistenciaTranscricao } from './persistencia.ts';
import type {
  MetaReuniao,
  SegmentoPersistido,
  EventoTranscricao,
  EstatisticasTranscricao,
  TranscricaoCompleta
} from '../../types/transcricao.ts';

export type EstadoSessaoTranscricao = 'inativa' | 'em_andamento' | 'pausada' | 'finalizando' | 'concluida';

export interface DependenciasSessao {
  fonteDeBlocos: { onBloco(fn: (bloco: BlocoAudioCapturado) => void): () => void };
  motor: MotorSTT;
  persistencia: PersistenciaTranscricao;
  relogioMs?: () => number;
  agoraIso?: () => string;
  /** Ajustes da detecção de fala (ex.: tamanho máximo do trecho enviado ao motor). */
  configVad?: Partial<ConfigVad>;
}

interface ItemFilaSTT {
  segmento: SegmentoClassificado;
  amostras: Float32Array;
  horarioChegadaMs: number;
}

interface ItemPendenteDedupeMic {
  segmentoPersistido: SegmentoPersistido;
  fimMsOriginal: number;
  transcritoEmMs: number;
}

export class SessaoDeTranscricao {
  private readonly fonteDeBlocos: DependenciasSessao['fonteDeBlocos'];
  private readonly motor: MotorSTT;
  private readonly persistencia: PersistenciaTranscricao;
  private readonly relogioCustomizado?: () => number;
  private readonly agoraIsoCustomizado?: () => string;
  private readonly configVad?: Partial<ConfigVad>;

  private coordenador: CoordenadorDeSegmentacao | null = null;
  private unsubBlocos: (() => void) | null = null;

  private estado: EstadoSessaoTranscricao = 'inativa';
  private metaAtiva: MetaReuniao | null = null;
  private tempoZeroMs: number | null = null;

  private filaSTT: ItemFilaSTT[] = [];
  private processandoFila = false;
  private itemSendoProcessado: ItemFilaSTT | null = null;

  private falhasConsecutivasMotor = 0;
  private avisoFilaCheiaEmitido = false;

  private historicoSegmentosMonitor: Array<{ id: number; canal: 'monitor'; inicioMs: number; fimMs: number; texto: string }> = [];
  private pendentesMicDedupe: ItemPendenteDedupeMic[] = [];

  private totalInferencias = 0;
  private somaTempoInferenciasMs = 0;
  private somaDuracaoAudioInferenciasMs = 0;
  private segmentosSemTexto = 0;

  private listenersSegmento = new Set<(segmento: SegmentoPersistido) => void>();
  private listenersEstado = new Set<(estado: EstadoSessaoTranscricao) => void>();

  constructor(deps: DependenciasSessao) {
    this.fonteDeBlocos = deps.fonteDeBlocos;
    this.motor = deps.motor;
    this.persistencia = deps.persistencia;
    this.relogioCustomizado = deps.relogioMs;
    this.agoraIsoCustomizado = deps.agoraIso;
    this.configVad = deps.configVad;
  }

  aoSegmento(fn: (segmento: SegmentoPersistido) => void): () => void {
    this.listenersSegmento.add(fn);
    return () => this.listenersSegmento.delete(fn);
  }

  aoEstado(fn: (estado: EstadoSessaoTranscricao) => void): () => void {
    this.listenersEstado.add(fn);
    fn(this.estado);
    return () => this.listenersEstado.delete(fn);
  }

  private setEstado(novo: EstadoSessaoTranscricao): void {
    this.estado = novo;
    this.listenersEstado.forEach((fn) => fn(novo));
  }

  obterRelogioMs(): number {
    if (this.relogioCustomizado) return this.relogioCustomizado();
    if (this.tempoZeroMs === null) return 0;
    return Math.max(0, Date.now() - this.tempoZeroMs);
  }

  private obterDataIso(): string {
    if (this.agoraIsoCustomizado) return this.agoraIsoCustomizado();
    return new Date().toISOString();
  }

  async iniciar(
    meta: MetaReuniao,
    opcoes: { modoUmCanal?: boolean; origemMs?: number } = {}
  ): Promise<{ caminho: string | null; idArquivo: string | null }> {
    if (this.estado === 'em_andamento') {
      throw new Error('Sessão de transcrição já está em andamento');
    }

    if (meta.modoEscuta === 'modo_notas') {
      throw new Error("Modo de escuta 'modo_notas' não realiza transcrição de áudio");
    }

    if (!meta.participantesAvisados) {
      throw new Error('Gravação não autorizada: os participantes devem ser avisados antes de iniciar');
    }

    this.metaAtiva = meta;
    this.tempoZeroMs = Date.now();
    this.filaSTT = [];
    this.pendentesMicDedupe = [];
    this.historicoSegmentosMonitor = [];
    this.totalInferencias = 0;
    this.somaTempoInferenciasMs = 0;
    this.somaDuracaoAudioInferenciasMs = 0;
    this.segmentosSemTexto = 0;
    this.falhasConsecutivasMotor = 0;
    this.avisoFilaCheiaEmitido = false;

    // Configurar metadados do motor a partir do motor.info
    const motorInfo = this.motor.info;
    const metaCompleta: MetaReuniao = {
      ...meta,
      iniciadaEm: meta.iniciadaEm || this.obterDataIso(),
      motor: {
        nome: motorInfo.nome,
        biblioteca: motorInfo.biblioteca,
        idioma: motorInfo.idioma,
        threads: motorInfo.threads,
        rtfMedio: null
      }
    };

    const resInicio = await this.persistencia.iniciar(metaCompleta);

    // Inicializar o coordenador de segmentação
    this.coordenador = new CoordenadorDeSegmentacao({
      aoSegmento: (seg) => this.aoSegmentoDoCoordenador(seg),
      modoUmCanal: opcoes.modoUmCanal ?? false,
      configVad: this.configVad,
      origemMs: opcoes.origemMs ?? (this.relogioCustomizado ? this.relogioCustomizado() : 0)
    });

    // Começar a ouvir a fonte de blocos de áudio
    this.unsubBlocos = this.fonteDeBlocos.onBloco((bloco) => {
      if (this.estado === 'em_andamento' && this.coordenador) {
        this.coordenador.processarBloco(bloco);
      }
    });

    this.setEstado('em_andamento');
    return resInicio;
  }

  definirFalanteManual(falante: 'implantadora' | 'prefeitura' | null): void {
    if (this.coordenador) {
      this.coordenador.definirFalanteManual(falante);
    }
  }

  definirModoUmCanal(modoUmCanal: boolean): void {
    if (this.coordenador) {
      this.coordenador.definirModoUmCanal(modoUmCanal);
    }
  }

  async pausar(): Promise<void> {
    if (this.estado !== 'em_andamento') return;

    if (this.coordenador) {
      this.coordenador.finalizar();
    }
    if (this.unsubBlocos) {
      this.unsubBlocos();
      this.unsubBlocos = null;
    }

    this.setEstado('pausada');
    await this.persistencia.evento({
      tMs: this.obterRelogioMs(),
      tipo: 'pausada',
      detalhe: 'Sessão de transcrição pausada'
    });
  }

  retomar(): void {
    if (this.estado !== 'pausada') return;

    this.unsubBlocos = this.fonteDeBlocos.onBloco((bloco) => {
      if (this.estado === 'em_andamento' && this.coordenador) {
        this.coordenador.processarBloco(bloco);
      }
    });

    this.setEstado('em_andamento');
    this.persistencia.evento({
      tMs: this.obterRelogioMs(),
      tipo: 'retomada',
      detalhe: 'Sessão de transcrição retomada'
    });
  }

  private aoSegmentoDoCoordenador(seg: SegmentoClassificado): void {
    // 1. Eco descartado no sinal (antes do STT)
    if (seg.eco.descartado) {
      const segPersistido: SegmentoPersistido = {
        id: seg.id,
        falante: seg.falante,
        atribuicao: seg.atribuicao,
        canal: seg.canal,
        inicioMs: seg.inicioMs,
        fimMs: seg.fimMs,
        texto: '',
        confianca: null,
        descartadoPorEco: true,
        motivoDescarte: 'eco_sinal',
        latenciaMs: 0,
        forcadoPorTamanho: seg.forcadoPorTamanho
      };

      this.persistencia.anexar(segPersistido);
      this.listenersSegmento.forEach((fn) => fn(segPersistido));
      return;
    }

    // 2. Enfileirar para o motor STT
    this.filaSTT.push({
      segmento: seg,
      amostras: seg.amostras,
      horarioChegadaMs: this.obterRelogioMs()
    });

    // Alerta de atraso na fila se houver acúmulo
    if (this.filaSTT.length > 8 && !this.avisoFilaCheiaEmitido) {
      this.avisoFilaCheiaEmitido = true;
      this.persistencia.evento({
        tMs: this.obterRelogioMs(),
        tipo: 'aviso',
        detalhe: `transcrição atrasada (${this.filaSTT.length} segmentos na fila)`
      });
    }

    this.processarProximoDaFila();
  }

  private async processarProximoDaFila(): Promise<void> {
    if (this.processandoFila || this.filaSTT.length === 0) return;

    this.processandoFila = true;
    const item = this.filaSTT.shift()!;
    this.itemSendoProcessado = item;

    if (this.filaSTT.length <= 4) {
      this.avisoFilaCheiaEmitido = false;
    }

    try {
      const amostras = item.amostras;
      // Liberar referência no item para Garbage Collection imediato
      item.amostras = new Float32Array(0);

      const resultado = await this.motor.transcrever(amostras);
      // Sessão já encerrada (reunião reiniciada): o resultado atrasado não vai para o arquivo nem para a tela.
      if (this.estado === 'concluida') return;
      this.falhasConsecutivasMotor = 0;

      const durAudio = resultado.duracaoAudioMs || Math.max(1, item.segmento.fimMs - item.segmento.inicioMs);
      this.totalInferencias++;
      this.somaDuracaoAudioInferenciasMs += durAudio;
      this.somaTempoInferenciasMs += resultado.tempoProcessamentoMs;

      const textoLimpo = (resultado.texto || '').trim();

      // Regra: resultado de STT vazio não vira segmento
      if (textoLimpo === '') {
        this.segmentosSemTexto++;
      } else {
        const agoraEntrega = this.obterRelogioMs();
        const latenciaMs = Math.max(0, agoraEntrega - item.segmento.fimMs);

        const segPersistido: SegmentoPersistido = {
          id: item.segmento.id,
          falante: item.segmento.falante,
          atribuicao: item.segmento.atribuicao,
          canal: item.segmento.canal,
          inicioMs: item.segmento.inicioMs,
          fimMs: item.segmento.fimMs,
          texto: textoLimpo,
          confianca: resultado.confianca,
          descartadoPorEco: false,
          motivoDescarte: null,
          latenciaMs,
          forcadoPorTamanho: item.segmento.forcadoPorTamanho
        };

        if (segPersistido.canal === 'monitor') {
          // Segmentos do monitor persistem diretamente
          await this.persistencia.anexar(segPersistido);
          this.historicoSegmentosMonitor.push({
            id: segPersistido.id,
            canal: 'monitor',
            inicioMs: segPersistido.inicioMs,
            fimMs: segPersistido.fimMs,
            texto: segPersistido.texto
          });
          this.listenersSegmento.forEach((fn) => fn(segPersistido));
          // Verificar se destravou algum segmento de microfone pendente
          this.julgarPendentesDedupeMic(false);
        } else {
          // Segmentos do microfone aguardam deduplicação por texto
          this.pendentesMicDedupe.push({
            segmentoPersistido: segPersistido,
            fimMsOriginal: item.segmento.fimMs,
            transcritoEmMs: agoraEntrega
          });
          this.julgarPendentesDedupeMic(false);
        }
      }
    } catch (err: any) {
      this.falhasConsecutivasMotor++;
      const msgErro = err?.message || String(err);
      this.persistencia.evento({
        tMs: this.obterRelogioMs(),
        tipo: 'erro_stt',
        detalhe: `Falha na transcrição do segmento ${item.segmento.id}: ${msgErro}`
      });

      if (this.falhasConsecutivasMotor >= 3) {
        this.persistencia.evento({
          tMs: this.obterRelogioMs(),
          tipo: 'aviso',
          detalhe: 'Motor de transcrição falhou 3 vezes consecutivas. Sessão continua medindo.'
        });
      }
    } finally {
      this.itemSendoProcessado = null;
      this.processandoFila = false;
      if (this.filaSTT.length > 0) {
        this.processarProximoDaFila();
      }
    }
  }

  /**
   * Um segmento do microfone pode ser julgado quando:
   * (a) Já foi transcrito e
   * (b) Não há segmento do monitor ainda na fila ou em transcrição com inicioMs <= fimMs do mic + 4000,
   *     ou passaram 8 s desde a transcrição do mic, ou em finalização forçada.
   */
  private julgarPendentesDedupeMic(forcar: boolean): void {
    if (this.pendentesMicDedupe.length === 0) return;

    const agora = this.obterRelogioMs();
    const restantes: ItemPendenteDedupeMic[] = [];

    for (const item of this.pendentesMicDedupe) {
      const mic = item.segmentoPersistido;

      // Verificar se há monitor na fila do STT que ainda pode ser eco deste mic
      const monitorNaEspera =
        (this.itemSendoProcessado?.segmento.canal === 'monitor' &&
          this.itemSendoProcessado.segmento.inicioMs <= mic.fimMs + 4000) ||
        this.filaSTT.some(
          (f) => f.segmento.canal === 'monitor' && f.segmento.inicioMs <= mic.fimMs + 4000
        );

      const passouTimeout8s = agora - item.transcritoEmMs >= 8000;

      if (forcar || passouTimeout8s || !monitorNaEspera) {
        // Aplicar deduplicação por texto contra os segmentos do monitor conhecidos
        const candidatos = [
          ...this.historicoSegmentosMonitor,
          {
            id: mic.id,
            canal: 'microfone' as const,
            inicioMs: mic.inicioMs,
            fimMs: mic.fimMs,
            texto: mic.texto
          }
        ];

        const duplicados = idsDuplicadosPorEco(candidatos);
        if (duplicados.has(mic.id)) {
          mic.descartadoPorEco = true;
          mic.motivoDescarte = 'eco_texto';
        } else {
          mic.descartadoPorEco = false;
          mic.motivoDescarte = null;
        }

        this.persistencia.anexar(mic);
        this.listenersSegmento.forEach((fn) => fn(mic));
      } else {
        restantes.push(item);
      }
    }

    this.pendentesMicDedupe = restantes;
  }

  /**
   * Encerra a sessão. Com `interrompida`, descarta a fila do motor (não espera a transcrição
   * terminar) e grava o arquivo como "interrompida": é o caminho de "Reiniciar demonstração".
   */
  async finalizar(opcoes: { interrompida?: boolean } = {}): Promise<TranscricaoCompleta | null> {
    if (this.estado === 'inativa' || this.estado === 'concluida') {
      return this.persistencia.obterDados();
    }
    const interrompida = opcoes.interrompida === true;

    this.setEstado('finalizando');

    // Fechar e liberar o coordenador de áudio
    if (this.coordenador) {
      this.coordenador.finalizar();
    }
    if (this.unsubBlocos) {
      this.unsubBlocos();
      this.unsubBlocos = null;
    }

    if (interrompida) {
      this.filaSTT = [];
    } else {
      // Esperar a fila do STT esvaziar (timeout de 20 s)
      const limiteEsperaMs = 20000;
      const t0 = Date.now();
      while ((this.processandoFila || this.filaSTT.length > 0) && Date.now() - t0 < limiteEsperaMs) {
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    // Forçar deduplicação dos microfones restantes
    this.julgarPendentesDedupeMic(true);

    // Calcular RTF médio final
    const rtfMedio =
      this.somaDuracaoAudioInferenciasMs > 0
        ? Number((this.somaTempoInferenciasMs / this.somaDuracaoAudioInferenciasMs).toFixed(3))
        : null;

    const resultadoFinal = await this.persistencia.finalizar({
      estado: interrompida ? 'interrompida' : 'concluida',
      rtfMedio,
      encerradaEm: this.obterDataIso()
    });

    this.setEstado('concluida');
    return resultadoFinal;
  }

  estatisticas(): EstatisticasTranscricao {
    const dados = this.persistencia.obterDados();
    if (dados?.estatisticas) {
      return {
        ...dados.estatisticas,
        segmentosSemTexto: this.segmentosSemTexto
      };
    }
    return {
      segmentos: 0,
      descartadosPorEco: 0,
      segmentosSemTexto: this.segmentosSemTexto,
      duracaoMs: 0,
      porFalante: { implantadora: 0, prefeitura: 0, indefinido: 0 },
      latenciaMedianaMs: null
    };
  }
}
