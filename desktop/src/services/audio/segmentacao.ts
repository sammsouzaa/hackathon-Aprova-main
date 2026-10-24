/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Coordena a segmentação dos dois canais (microfone e monitor), atribui o falante e filtra o eco.
 *
 *   microfone → "implantadora"      monitor → "prefeitura"
 *
 * Quem fala é definido pelo CANAL, não pela voz. Com um canal só, o falante fica "indefinido"
 * (ou "manual", se a pessoa indicar quem está falando). Vários participantes remotos ficam juntos
 * no canal "prefeitura".
 *
 * Os segmentos saem na ordem em que ficam prontos (o do microfone espera as evidências de eco do
 * monitor); quem persiste deve ordenar por `inicioMs`.
 *
 * Módulo puro: sem DOM nem Electron.
 */
import type { BlocoAudioCapturado } from './captura.ts';
import { analisarEco, CONFIG_ECO_PADRAO, HistoricoDeEnvelope } from './eco.ts';
import type { ConfigEco, ResultadoEco } from './eco.ts';
import { SegmentadorDeVoz, TAXA_AMOSTRAGEM_HZ } from './vad.ts';
import type { ConfigVad, SegmentoDeVoz } from './vad.ts';

export type Falante = 'implantadora' | 'prefeitura' | 'indefinido';
export type Atribuicao = 'canal' | 'manual' | 'indefinido';

export interface InfoEco {
  descartado: boolean;
  correlacao: number;
  lagMs: number;
  fracaoMonitorAtivo: number;
}

export interface SegmentoClassificado {
  id: number;
  canal: 'microfone' | 'monitor';
  falante: Falante;
  atribuicao: Atribuicao;
  /** Relativos à origem da reunião (ver `definirOrigem`). */
  inicioMs: number;
  fimMs: number;
  /** Vazio quando o segmento foi descartado como eco (não vai para o STT). */
  amostras: Float32Array;
  rmsMedio: number;
  vozMs: number;
  forcadoPorTamanho: boolean;
  eco: InfoEco;
}

export interface OpcoesCoordenador {
  aoSegmento: (segmento: SegmentoClassificado) => void;
  modoUmCanal?: boolean;
  /** Instante (ms, relógio do AudioContext) que vale como 0 da reunião; padrão: o primeiro bloco. */
  origemMs?: number;
  detectarEco?: boolean;
  configVad?: Partial<ConfigVad>;
  configEco?: Partial<ConfigEco>;
  /** Quanto o segmento do microfone espera pelas evidências do monitor antes de ser liberado. */
  esperaMaximaMs?: number;
}

export interface EstatisticasSegmentacao {
  segmentos: number;
  descartadosPorEco: number;
  porFalante: Record<Falante, number>;
}

interface EntradaManual {
  tMs: number;
  falante: 'implantadora' | 'prefeitura' | null;
}

export class CoordenadorDeSegmentacao {
  private readonly aoSegmento: (segmento: SegmentoClassificado) => void;
  private readonly microfone: SegmentadorDeVoz;
  private readonly monitor: SegmentadorDeVoz;
  private readonly envelopeMicrofone = new HistoricoDeEnvelope();
  private readonly envelopeMonitor = new HistoricoDeEnvelope();
  private readonly configEco: ConfigEco;
  private readonly detectarEco: boolean;
  private readonly esperaMaximaMs: number;

  private modoUmCanal: boolean;
  private origemMs: number | null;
  private proximoId = 1;
  private pendentes: SegmentoDeVoz[] = [];
  private historicoManual: EntradaManual[] = [];
  private readonly contagem: EstatisticasSegmentacao = {
    segmentos: 0,
    descartadosPorEco: 0,
    porFalante: { implantadora: 0, prefeitura: 0, indefinido: 0 }
  };

  constructor(opcoes: OpcoesCoordenador) {
    this.aoSegmento = opcoes.aoSegmento;
    this.modoUmCanal = opcoes.modoUmCanal ?? false;
    this.origemMs = opcoes.origemMs ?? null;
    this.detectarEco = opcoes.detectarEco ?? true;
    this.configEco = { ...CONFIG_ECO_PADRAO, ...opcoes.configEco };
    this.esperaMaximaMs = opcoes.esperaMaximaMs ?? 1500;

    this.microfone = new SegmentadorDeVoz('microfone', (s) => this.aoSegmentoMicrofone(s), opcoes.configVad);
    this.monitor = new SegmentadorDeVoz('monitor', (s) => this.aoSegmentoMonitor(s), opcoes.configVad);
    this.microfone.observarBlocos((info) => this.envelopeMicrofone.adicionar(info.inicioMs, info.amostras));
    this.monitor.observarBlocos((info) => this.envelopeMonitor.adicionar(info.inicioMs, info.amostras));
  }

  definirOrigem(origemMs: number): void {
    this.origemMs = origemMs;
  }

  definirModoUmCanal(valor: boolean): void {
    this.modoUmCanal = valor;
  }

  /** Quem está falando segundo a pessoa (só vale com um canal). null desfaz a indicação. */
  definirFalanteManual(falante: 'implantadora' | 'prefeitura' | null): void {
    const agora = (this.microfone.relogioMs ?? this.origemMs ?? 0) - (this.origemMs ?? 0);
    this.historicoManual.push({ tMs: agora, falante });
  }

  estatisticas(): EstatisticasSegmentacao {
    return { ...this.contagem, porFalante: { ...this.contagem.porFalante } };
  }

  processarBloco(bloco: BlocoAudioCapturado): void {
    const duracaoMs = (bloco.amostras.length * 1000) / TAXA_AMOSTRAGEM_HZ;
    if (this.origemMs === null) this.origemMs = bloco.tempoMs - duracaoMs;

    if (bloco.canal === 'monitor') {
      if (this.modoUmCanal) return;
      this.monitor.processar(bloco.amostras, bloco.tempoMs);
      this.liberarPendentes(false);
    } else {
      this.microfone.processar(bloco.amostras, bloco.tempoMs);
      this.liberarPendentes(false);
    }
  }

  /** Fecha o que estiver aberto e libera tudo (fim da reunião ou pausa). */
  finalizar(): void {
    this.microfone.finalizar();
    this.monitor.finalizar();
    this.liberarPendentes(true);
  }

  private aoSegmentoMonitor(segmento: SegmentoDeVoz): void {
    this.entregar(segmento, 'prefeitura', 'canal', this.semEco());
  }

  private aoSegmentoMicrofone(segmento: SegmentoDeVoz): void {
    if (this.modoUmCanal || !this.detectarEco) {
      this.entregarDoMicrofone(segmento, this.semEco());
      return;
    }
    this.pendentes.push(segmento);
  }

  /**
   * O segmento do microfone só pode ser julgado quando o monitor já passou do fim dele mais o atraso
   * máximo do eco; se o monitor parou de chegar, vale o tempo máximo de espera.
   */
  private liberarPendentes(forcar: boolean): void {
    if (this.pendentes.length === 0) return;
    const restantes: SegmentoDeVoz[] = [];
    for (const segmento of this.pendentes) {
      const relogioMonitor = this.monitor.relogioMs;
      const relogioMicrofone = this.microfone.relogioMs ?? segmento.fimMs;
      const monitorAlcancou =
        relogioMonitor !== null && relogioMonitor >= segmento.fimMs + this.configEco.lagMaximoMs;
      const esperouDemais = relogioMicrofone - segmento.fimMs > this.esperaMaximaMs;
      if (forcar || monitorAlcancou || esperouDemais) this.julgarEco(segmento);
      else restantes.push(segmento);
    }
    this.pendentes = restantes;
  }

  private julgarEco(segmento: SegmentoDeVoz): void {
    const resultado: ResultadoEco = analisarEco(
      this.envelopeMicrofone,
      this.envelopeMonitor,
      segmento.inicioMs,
      segmento.fimMs,
      this.monitor.limiarFim(),
      this.configEco
    );
    this.entregarDoMicrofone(segmento, {
      descartado: resultado.eco,
      correlacao: resultado.correlacao,
      lagMs: resultado.lagMs,
      fracaoMonitorAtivo: resultado.fracaoMonitorAtivo
    });
  }

  private entregarDoMicrofone(segmento: SegmentoDeVoz, eco: InfoEco): void {
    if (!this.modoUmCanal) {
      this.entregar(segmento, 'implantadora', 'canal', eco);
      return;
    }
    const manual = this.falanteManualEm(segmento);
    if (manual) this.entregar(segmento, manual, 'manual', eco);
    else this.entregar(segmento, 'indefinido', 'indefinido', eco);
  }

  /** Valor indicado pela pessoa no ponto médio do segmento (o clique costuma vir um pouco depois). */
  private falanteManualEm(segmento: SegmentoDeVoz): 'implantadora' | 'prefeitura' | null {
    const origem = this.origemMs ?? 0;
    const meio = (segmento.inicioMs + segmento.fimMs) / 2 - origem;
    let valor: 'implantadora' | 'prefeitura' | null = null;
    for (const entrada of this.historicoManual) {
      if (entrada.tMs <= meio) valor = entrada.falante;
    }
    return valor;
  }

  private semEco(): InfoEco {
    return { descartado: false, correlacao: 0, lagMs: 0, fracaoMonitorAtivo: 0 };
  }

  private entregar(segmento: SegmentoDeVoz, falante: Falante, atribuicao: Atribuicao, eco: InfoEco): void {
    const origem = this.origemMs ?? 0;
    this.contagem.segmentos++;
    this.contagem.porFalante[falante]++;
    if (eco.descartado) this.contagem.descartadosPorEco++;

    this.aoSegmento({
      id: this.proximoId++,
      canal: segmento.canal === 'monitor' ? 'monitor' : 'microfone',
      falante,
      atribuicao,
      inicioMs: Math.round(segmento.inicioMs - origem),
      fimMs: Math.round(segmento.fimMs - origem),
      amostras: eco.descartado ? new Float32Array(0) : segmento.amostras,
      rmsMedio: segmento.rmsMedio,
      vozMs: segmento.vozMs,
      forcadoPorTamanho: segmento.forcadoPorTamanho,
      eco
    });
  }
}
