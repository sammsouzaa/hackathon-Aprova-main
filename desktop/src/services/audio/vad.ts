/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Detecção de voz (VAD) por energia e segmentação em falas, um canal por vez.
 * Módulo puro (sem DOM, sem Electron): roda no navegador e em Node (testes).
 *
 * Regras (plano F3):
 *  - piso de ruído calibrado nos primeiros 1,5 s (percentil baixo do RMS) e atualizado devagar;
 *  - início da fala: RMS acima de piso×3 + 0,01 por 150 ms seguidos; fim: 700 ms abaixo do limiar de fim;
 *  - pré-rolagem de 250 ms e pós-rolagem de 200 ms;
 *  - fala mínima de 500 ms; segmento máximo de 15 s, cortado no ponto mais silencioso.
 */

export const TAXA_AMOSTRAGEM_HZ = 16000;

export interface ConfigVad {
  calibracaoMs: number;
  percentilPiso: number;
  multiplicadorInicio: number;
  margemInicio: number;
  multiplicadorFim: number;
  margemFim: number;
  pisoMinimo: number;
  pisoMaximo: number;
  limiarProvisorioInicio: number;
  limiarProvisorioFim: number;
  inicioConfirmadoMs: number;
  silencioFimMs: number;
  preRolagemMs: number;
  posRolagemMs: number;
  duracaoMinimaMs: number;
  duracaoMaximaMs: number;
  taxaAtualizacaoPiso: number;
  toleranciaRelogioMs: number;
}

export const CONFIG_VAD_PADRAO: ConfigVad = {
  calibracaoMs: 1500,
  percentilPiso: 0.25,
  multiplicadorInicio: 3,
  margemInicio: 0.01,
  multiplicadorFim: 2,
  margemFim: 0.006,
  pisoMinimo: 0.0005,
  pisoMaximo: 0.03,
  // Valem enquanto o piso ainda está sendo calibrado: quem fala logo ao iniciar não perde o começo.
  limiarProvisorioInicio: 0.015,
  limiarProvisorioFim: 0.009,
  inicioConfirmadoMs: 150,
  silencioFimMs: 700,
  preRolagemMs: 250,
  posRolagemMs: 200,
  duracaoMinimaMs: 500,
  duracaoMaximaMs: 15000,
  taxaAtualizacaoPiso: 0.02,
  toleranciaRelogioMs: 250
};

export interface SegmentoDeVoz {
  canal: string;
  inicioMs: number;
  fimMs: number;
  amostras: Float32Array;
  /** RMS dos blocos com voz. */
  rmsMedio: number;
  rmsPico: number;
  /** Duração entre o primeiro e o último bloco com voz. */
  vozMs: number;
  /** true quando o segmento foi cortado por passar do tamanho máximo. */
  forcadoPorTamanho: boolean;
}

export interface InfoBloco {
  inicioMs: number;
  fimMs: number;
  rms: number;
  voz: boolean;
  amostras: Float32Array;
}

interface Bloco {
  inicioMs: number;
  fimMs: number;
  rms: number;
  voz: boolean;
  amostras: Float32Array;
}

export function calcularRms(amostras: Float32Array): number {
  if (amostras.length === 0) return 0;
  let soma = 0;
  for (let i = 0; i < amostras.length; i++) soma += amostras[i] * amostras[i];
  return Math.sqrt(soma / amostras.length);
}

export function percentil(valores: number[], p: number): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const indice = Math.min(ordenados.length - 1, Math.max(0, Math.floor(p * (ordenados.length - 1))));
  return ordenados[indice];
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

function duracaoDosBlocosMs(blocos: Bloco[]): number {
  if (blocos.length === 0) return 0;
  return blocos[blocos.length - 1].fimMs - blocos[0].inicioMs;
}

export class SegmentadorDeVoz {
  readonly canal: string;
  private readonly cfg: ConfigVad;
  private readonly aoSegmento: (segmento: SegmentoDeVoz) => void;
  private aoBloco: ((info: InfoBloco) => void) | null = null;

  private relogioFimMs: number | null = null;
  private calibrando = true;
  private msCalibrados = 0;
  private rmsEmSilencio: number[] = [];
  private piso = 0;

  private estado: 'silencio' | 'fala' = 'silencio';
  private anel: Bloco[] = [];
  private candidatos: Bloco[] = [];
  private segmento: Bloco[] = [];
  private silencioMs = 0;

  constructor(
    canal: string,
    aoSegmento: (segmento: SegmentoDeVoz) => void,
    config: Partial<ConfigVad> = {}
  ) {
    this.canal = canal;
    this.aoSegmento = aoSegmento;
    this.cfg = { ...CONFIG_VAD_PADRAO, ...config };
  }

  /** Observador de cada bloco processado (usado para o histórico de envelope e o eco). */
  observarBlocos(fn: ((info: InfoBloco) => void) | null): void {
    this.aoBloco = fn;
  }

  /** Relógio interno em ms: fim do último bloco processado (null antes do primeiro). */
  get relogioMs(): number | null {
    return this.relogioFimMs;
  }

  get calibrado(): boolean {
    return !this.calibrando;
  }

  get falando(): boolean {
    return this.estado === 'fala';
  }

  limiarInicio(): number {
    if (this.calibrando) return this.cfg.limiarProvisorioInicio;
    return this.piso * this.cfg.multiplicadorInicio + this.cfg.margemInicio;
  }

  limiarFim(): number {
    if (this.calibrando) return this.cfg.limiarProvisorioFim;
    return this.piso * this.cfg.multiplicadorFim + this.cfg.margemFim;
  }

  /**
   * Processa um bloco de áudio mono a 16 kHz.
   * @param fimBlocoMs instante (ms, relógio do AudioContext) em que o bloco termina.
   */
  processar(amostras: Float32Array, fimBlocoMs: number): void {
    const duracaoMs = (amostras.length * 1000) / TAXA_AMOSTRAGEM_HZ;
    const inicioInformadoMs = fimBlocoMs - duracaoMs;

    let inicioMs = inicioInformadoMs;
    if (this.relogioFimMs !== null) {
      if (Math.abs(inicioInformadoMs - this.relogioFimMs) > this.cfg.toleranciaRelogioMs) {
        // Pausa, reconexão ou perda de blocos: o que está aberto termina aqui.
        this.descontinuidade();
      } else {
        // Dentro da tolerância, o relógio por contagem de amostras é mais estável que o carimbo.
        inicioMs = this.relogioFimMs;
      }
    }
    const fimMs = inicioMs + duracaoMs;
    this.relogioFimMs = fimMs;

    const rms = calcularRms(amostras);
    const voz = rms >= (this.estado === 'fala' ? this.limiarFim() : this.limiarInicio());
    const bloco: Bloco = { inicioMs, fimMs, rms, voz, amostras };

    if (this.estado === 'silencio') this.processarEmSilencio(bloco);
    else this.processarEmFala(bloco);

    this.aoBloco?.({ inicioMs, fimMs, rms, voz, amostras });
  }

  /** Fecha o que estiver aberto (fim da reunião ou pausa). */
  finalizar(): void {
    if (this.estado === 'fala') this.fecharPorSilencio();
    this.estado = 'silencio';
    this.candidatos = [];
    this.anel = [];
    this.silencioMs = 0;
  }

  private processarEmSilencio(bloco: Bloco): void {
    if (bloco.voz) {
      this.candidatos.push(bloco);
      if (duracaoDosBlocosMs(this.candidatos) >= this.cfg.inicioConfirmadoMs) {
        this.estado = 'fala';
        this.segmento = [...this.preRolagem(), ...this.candidatos];
        this.candidatos = [];
        this.anel = [];
        this.silencioMs = 0;
      }
      return;
    }

    // Rajada curta de energia que não virou fala: volta para o anel como se fosse silêncio.
    this.anel.push(...this.candidatos, bloco);
    this.candidatos = [];
    this.limitarAnel();
    this.atualizarPiso(bloco.rms, bloco.fimMs - bloco.inicioMs);
  }

  private processarEmFala(bloco: Bloco): void {
    this.segmento.push(bloco);
    if (bloco.voz) this.silencioMs = 0;
    else this.silencioMs += bloco.fimMs - bloco.inicioMs;

    if (this.silencioMs >= this.cfg.silencioFimMs) {
      this.fecharPorSilencio();
      return;
    }
    if (duracaoDosBlocosMs(this.segmento) >= this.cfg.duracaoMaximaMs) {
      this.cortarPorTamanho();
    }
  }

  /** Últimos blocos do anel que cobrem a pré-rolagem. */
  private preRolagem(): Bloco[] {
    const escolhidos: Bloco[] = [];
    let acumuladoMs = 0;
    for (let i = this.anel.length - 1; i >= 0 && acumuladoMs < this.cfg.preRolagemMs; i--) {
      escolhidos.unshift(this.anel[i]);
      acumuladoMs += this.anel[i].fimMs - this.anel[i].inicioMs;
    }
    return escolhidos;
  }

  private limitarAnel(): void {
    const limiteMs = this.cfg.preRolagemMs + this.cfg.inicioConfirmadoMs;
    while (this.anel.length > 1 && duracaoDosBlocosMs(this.anel) > limiteMs) this.anel.shift();
  }

  private atualizarPiso(rms: number, duracaoMs: number): void {
    if (this.calibrando) {
      this.rmsEmSilencio.push(rms);
      this.msCalibrados += duracaoMs;
      if (this.msCalibrados >= this.cfg.calibracaoMs) {
        this.piso = limitar(
          percentil(this.rmsEmSilencio, this.cfg.percentilPiso),
          this.cfg.pisoMinimo,
          this.cfg.pisoMaximo
        );
        this.calibrando = false;
        this.rmsEmSilencio = [];
      }
      return;
    }
    if (rms < this.limiarInicio()) {
      this.piso = limitar(
        this.piso + this.cfg.taxaAtualizacaoPiso * (rms - this.piso),
        this.cfg.pisoMinimo,
        this.cfg.pisoMaximo
      );
    }
  }

  private fecharPorSilencio(): void {
    const blocos = this.segmento;
    this.segmento = [];
    this.estado = 'silencio';
    this.silencioMs = 0;

    let ultimoComVoz = -1;
    for (let i = blocos.length - 1; i >= 0; i--) {
      if (blocos[i].voz) {
        ultimoComVoz = i;
        break;
      }
    }
    if (ultimoComVoz < 0) return;

    // Mantém só a pós-rolagem depois da última voz; o resto do silêncio vira pré-rolagem do próximo.
    const limiteMs = blocos[ultimoComVoz].fimMs + this.cfg.posRolagemMs;
    let corte = ultimoComVoz + 1;
    while (corte < blocos.length && blocos[corte].inicioMs < limiteMs) corte++;
    this.anel = blocos.slice(corte);
    this.limitarAnel();
    this.emitir(blocos.slice(0, corte), false);
  }

  /** Segmento longo demais: corta no bloco mais silencioso da segunda metade e segue falando. */
  private cortarPorTamanho(): void {
    const blocos = this.segmento;
    const primeiro = Math.floor(blocos.length / 2);
    let melhor = blocos.length - 1;
    for (let i = blocos.length - 1; i >= primeiro; i--) {
      if (blocos[i].rms < blocos[melhor].rms) melhor = i;
    }

    const emitidos = blocos.slice(0, melhor + 1);
    this.segmento = blocos.slice(melhor + 1);
    this.emitir(emitidos, true);

    this.silencioMs = 0;
    for (let i = this.segmento.length - 1; i >= 0 && !this.segmento[i].voz; i--) {
      this.silencioMs += this.segmento[i].fimMs - this.segmento[i].inicioMs;
    }
  }

  private emitir(blocos: Bloco[], forcadoPorTamanho: boolean): void {
    const comVoz = blocos.filter((b) => b.voz);
    if (comVoz.length === 0) return;

    const vozMs = comVoz[comVoz.length - 1].fimMs - comVoz[0].inicioMs;
    if (vozMs < this.cfg.duracaoMinimaMs) return;

    const total = blocos.reduce((soma, b) => soma + b.amostras.length, 0);
    const amostras = new Float32Array(total);
    let deslocamento = 0;
    for (const bloco of blocos) {
      amostras.set(bloco.amostras, deslocamento);
      deslocamento += bloco.amostras.length;
    }

    let somaQuadrados = 0;
    let rmsPico = 0;
    for (const bloco of comVoz) {
      somaQuadrados += bloco.rms * bloco.rms;
      if (bloco.rms > rmsPico) rmsPico = bloco.rms;
    }

    this.aoSegmento({
      canal: this.canal,
      inicioMs: blocos[0].inicioMs,
      fimMs: blocos[blocos.length - 1].fimMs,
      amostras,
      rmsMedio: Math.sqrt(somaQuadrados / comVoz.length),
      rmsPico,
      vozMs,
      forcadoPorTamanho
    });
  }

  private descontinuidade(): void {
    this.finalizar();
  }
}
