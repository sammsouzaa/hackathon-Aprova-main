/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Detecção de eco entre o microfone e o monitor (o áudio da reunião que sai nos alto-falantes).
 * Sem fone, a voz da prefeitura volta pelo microfone e viraria uma fala falsa da implantadora.
 *
 * Duas camadas:
 *  1. Sinal (antes do STT): correlação entre os envelopes de energia dos dois canais. Eco é uma
 *     cópia atrasada e atenuada do monitor, então os envelopes andam juntos; duas pessoas falando
 *     ao mesmo tempo (dupla fala) têm envelopes independentes e não são marcadas.
 *  2. Texto (depois do STT): descarta a fala do microfone que repete a do monitor na mesma janela.
 *
 * Módulo puro: sem DOM nem Electron.
 */

export const FRAME_ENVELOPE_MS = 16;
export const AMOSTRAS_POR_FRAME = 256; // 16 ms a 16 kHz

export class HistoricoDeEnvelope {
  private readonly capacidade: number;
  private readonly valores: Float32Array;
  private readonly frames: Int32Array;
  private ultimo = -1;

  /** Guarda os últimos `capacidadeFrames` frames de 16 ms (padrão: 60 s). */
  constructor(capacidadeFrames = 3750) {
    this.capacidade = capacidadeFrames;
    this.valores = new Float32Array(capacidadeFrames);
    this.frames = new Int32Array(capacidadeFrames).fill(-1);
  }

  static frameDe(ms: number): number {
    return Math.floor(ms / FRAME_ENVELOPE_MS);
  }

  get ultimoFrame(): number {
    return this.ultimo;
  }

  adicionar(inicioMs: number, amostras: Float32Array): void {
    const quantidade = Math.floor(amostras.length / AMOSTRAS_POR_FRAME);
    for (let k = 0; k < quantidade; k++) {
      let soma = 0;
      const base = k * AMOSTRAS_POR_FRAME;
      for (let i = 0; i < AMOSTRAS_POR_FRAME; i++) {
        const v = amostras[base + i];
        soma += v * v;
      }
      const frame = Math.round((inicioMs + k * FRAME_ENVELOPE_MS) / FRAME_ENVELOPE_MS);
      const posicao = ((frame % this.capacidade) + this.capacidade) % this.capacidade;
      this.valores[posicao] = Math.sqrt(soma / AMOSTRAS_POR_FRAME);
      this.frames[posicao] = frame;
      if (frame > this.ultimo) this.ultimo = frame;
    }
  }

  /** RMS do frame, ou null se ele não está (mais) no histórico. */
  obter(frame: number): number | null {
    const posicao = ((frame % this.capacidade) + this.capacidade) % this.capacidade;
    return this.frames[posicao] === frame ? this.valores[posicao] : null;
  }
}

export interface ConfigEco {
  /** Fração mínima do segmento em que o monitor precisa estar com voz para suspeitar de eco. */
  fracaoMonitorMinima: number;
  /** Correlação mínima entre os envelopes para marcar como eco. */
  correlacaoMinima: number;
  /** Maior atraso (monitor → microfone) considerado: sistema de áudio + acústica + bluetooth. */
  lagMaximoMs: number;
  framesMinimos: number;
}

export const CONFIG_ECO_PADRAO: ConfigEco = {
  fracaoMonitorMinima: 0.4,
  correlacaoMinima: 0.6,
  lagMaximoMs: 640,
  framesMinimos: 20
};

export interface ResultadoEco {
  eco: boolean;
  correlacao: number;
  lagMs: number;
  fracaoMonitorAtivo: number;
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  if (n < 2) return 0;
  let mediaA = 0;
  let mediaB = 0;
  for (let i = 0; i < n; i++) {
    mediaA += a[i];
    mediaB += b[i];
  }
  mediaA /= n;
  mediaB /= n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - mediaA;
    const db = b[i] - mediaB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  if (varA === 0 || varB === 0) return 0;
  return cov / Math.sqrt(varA * varB);
}

/**
 * Decide se um segmento do microfone [inicioMs, fimMs] é eco do monitor.
 * @param limiarMonitor RMS acima do qual um frame do monitor conta como "com voz".
 */
export function analisarEco(
  microfone: HistoricoDeEnvelope,
  monitor: HistoricoDeEnvelope,
  inicioMs: number,
  fimMs: number,
  limiarMonitor: number,
  config: Partial<ConfigEco> = {}
): ResultadoEco {
  const cfg = { ...CONFIG_ECO_PADRAO, ...config };
  const primeiro = HistoricoDeEnvelope.frameDe(inicioMs);
  const ultimo = HistoricoDeEnvelope.frameDe(fimMs);

  let validos = 0;
  let ativos = 0;
  for (let f = primeiro; f <= ultimo; f++) {
    const valor = monitor.obter(f);
    if (valor === null) continue;
    validos++;
    if (valor >= limiarMonitor) ativos++;
  }
  const fracaoMonitorAtivo = validos > 0 ? ativos / validos : 0;
  const naoEco = { eco: false, correlacao: 0, lagMs: 0, fracaoMonitorAtivo };
  if (validos < cfg.framesMinimos || fracaoMonitorAtivo < cfg.fracaoMonitorMinima) return naoEco;

  let melhorCorrelacao = -1;
  let melhorLag = 0;
  const maxLag = Math.round(cfg.lagMaximoMs / FRAME_ENVELOPE_MS);
  for (let lag = 0; lag <= maxLag; lag++) {
    const par: number[] = [];
    const referencia: number[] = [];
    for (let f = primeiro; f <= ultimo; f++) {
      const m = microfone.obter(f);
      const r = monitor.obter(f - lag);
      if (m === null || r === null) continue;
      // Raiz quadrada: deixa a correlação menos dominada pelos picos mais altos.
      par.push(Math.sqrt(m));
      referencia.push(Math.sqrt(r));
    }
    if (par.length < cfg.framesMinimos) continue;
    const c = pearson(par, referencia);
    if (c > melhorCorrelacao) {
      melhorCorrelacao = c;
      melhorLag = lag;
    }
  }
  if (melhorCorrelacao < 0) return naoEco;

  return {
    eco: melhorCorrelacao >= cfg.correlacaoMinima,
    correlacao: Number(melhorCorrelacao.toFixed(3)),
    lagMs: melhorLag * FRAME_ENVELOPE_MS,
    fracaoMonitorAtivo: Number(fracaoMonitorAtivo.toFixed(3))
  };
}

// ----- Camada de texto (usada depois do STT) -----

export interface SegmentoComTexto {
  id: number;
  canal: 'microfone' | 'monitor';
  inicioMs: number;
  fimMs: number;
  texto: string;
}

export interface OpcoesDedupeTexto {
  janelaMs: number;
  limiarJaccard: number;
  limiarContencao: number;
  minTokensContencao: number;
}

export const OPCOES_DEDUPE_PADRAO: OpcoesDedupeTexto = {
  janelaMs: 4000,
  limiarJaccard: 0.6,
  limiarContencao: 0.8,
  minTokensContencao: 3
};

export function normalizarTokens(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function similaridadeDeTexto(a: string[], b: string[]): { jaccard: number; contencao: number } {
  const conjuntoA = new Set(a);
  const conjuntoB = new Set(b);
  if (conjuntoA.size === 0 || conjuntoB.size === 0) return { jaccard: 0, contencao: 0 };
  let comuns = 0;
  for (const token of conjuntoA) if (conjuntoB.has(token)) comuns++;
  const uniao = conjuntoA.size + conjuntoB.size - comuns;
  return {
    jaccard: comuns / uniao,
    contencao: comuns / Math.min(conjuntoA.size, conjuntoB.size)
  };
}

/**
 * Ids das falas do microfone que repetem uma fala do monitor próxima no tempo (eco que passou
 * pelo filtro de sinal). A fala do monitor é sempre a mantida.
 */
export function idsDuplicadosPorEco(
  segmentos: SegmentoComTexto[],
  opcoes: Partial<OpcoesDedupeTexto> = {}
): Set<number> {
  const cfg = { ...OPCOES_DEDUPE_PADRAO, ...opcoes };
  const duplicados = new Set<number>();
  const doMonitor = segmentos.filter((s) => s.canal === 'monitor');

  for (const mic of segmentos.filter((s) => s.canal === 'microfone')) {
    const tokensMic = normalizarTokens(mic.texto);
    for (const mon of doMonitor) {
      const proximo =
        mic.inicioMs <= mon.fimMs + cfg.janelaMs && mon.inicioMs <= mic.fimMs + cfg.janelaMs;
      if (!proximo) continue;
      const tokensMon = normalizarTokens(mon.texto);
      const { jaccard, contencao } = similaridadeDeTexto(tokensMic, tokensMon);
      const contido =
        contencao >= cfg.limiarContencao &&
        Math.min(new Set(tokensMic).size, new Set(tokensMon).size) >= cfg.minTokensContencao;
      if (jaccard >= cfg.limiarJaccard || contido) {
        duplicados.add(mic.id);
        break;
      }
    }
  }
  return duplicados;
}
