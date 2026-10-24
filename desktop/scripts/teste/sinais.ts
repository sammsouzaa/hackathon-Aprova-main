/**
 * Sinais sintéticos para testar VAD, segmentação e eco sem microfone.
 * "Fala" aqui é ruído modulado por um envelope irregular (sílabas), com RMS controlado.
 */
import { CoordenadorDeSegmentacao } from '../../src/services/audio/segmentacao.ts';
import type { SegmentoClassificado } from '../../src/services/audio/segmentacao.ts';
import { SegmentadorDeVoz, TAXA_AMOSTRAGEM_HZ } from '../../src/services/audio/vad.ts';
import type { ConfigVad, SegmentoDeVoz } from '../../src/services/audio/vad.ts';

export const BLOCO = 1024; // 64 ms, igual ao worklet

export function gerador(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function amostrasDe(ms: number): number {
  return Math.round((ms * TAXA_AMOSTRAGEM_HZ) / 1000);
}

function normalizarRms(sinal: Float32Array, rmsAlvo: number): Float32Array {
  let soma = 0;
  for (let i = 0; i < sinal.length; i++) soma += sinal[i] * sinal[i];
  const atual = Math.sqrt(soma / Math.max(1, sinal.length));
  const ganho = atual > 0 ? rmsAlvo / atual : 0;
  for (let i = 0; i < sinal.length; i++) sinal[i] *= ganho;
  return sinal;
}

/** Ruído de fundo (ventilador, sala). */
export function ruido(ms: number, rms: number, rnd: () => number): Float32Array {
  const sinal = new Float32Array(amostrasDe(ms));
  for (let i = 0; i < sinal.length; i++) sinal[i] = rnd() * 2 - 1;
  return normalizarRms(sinal, rms);
}

/** Fala sintética: ruído com envelope de três sílabas por segundo, sem silêncios longos. */
export function fala(ms: number, rms: number, rnd: () => number): Float32Array {
  const n = amostrasDe(ms);
  const sinal = new Float32Array(n);
  const f = [1.3 + rnd() * 1.2, 2.6 + rnd() * 1.6, 4.5 + rnd() * 2];
  const fase = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let i = 0; i < n; i++) {
    const t = i / TAXA_AMOSTRAGEM_HZ;
    const envelope =
      0.55 +
      0.2 * Math.sin(6.28 * f[0] * t + fase[0]) +
      0.15 * Math.sin(6.28 * f[1] * t + fase[1]) +
      0.1 * Math.sin(6.28 * f[2] * t + fase[2]);
    sinal[i] = (rnd() * 2 - 1) * Math.max(0.15, envelope);
  }
  return normalizarRms(sinal, rms);
}

export function concatenar(...partes: Float32Array[]): Float32Array {
  const total = partes.reduce((s, p) => s + p.length, 0);
  const saida = new Float32Array(total);
  let pos = 0;
  for (const p of partes) {
    saida.set(p, pos);
    pos += p.length;
  }
  return saida;
}

export function atrasar(sinal: Float32Array, ms: number): Float32Array {
  const d = amostrasDe(ms);
  const saida = new Float32Array(sinal.length);
  saida.set(sinal.subarray(0, Math.max(0, sinal.length - d)), d);
  return saida;
}

export function ganho(sinal: Float32Array, g: number): Float32Array {
  return sinal.map((v) => v * g);
}

export function somar(a: Float32Array, b: Float32Array): Float32Array {
  const n = Math.max(a.length, b.length);
  const saida = new Float32Array(n);
  for (let i = 0; i < n; i++) saida[i] = (a[i] ?? 0) + (b[i] ?? 0);
  return saida;
}

/** Coloca `parte` em `inicioMs` dentro de um fundo de `totalMs` com ruído `rmsFundo`. */
export function sobre(totalMs: number, rmsFundo: number, rnd: () => number, ...partes: Array<[number, Float32Array]>): Float32Array {
  let saida = ruido(totalMs, rmsFundo, rnd);
  for (const [inicioMs, parte] of partes) {
    const colocada = new Float32Array(saida.length);
    colocada.set(parte.subarray(0, Math.max(0, saida.length - amostrasDe(inicioMs))), amostrasDe(inicioMs));
    saida = somar(saida, colocada);
  }
  return saida;
}

/** Alimenta um segmentador em blocos de 64 ms; `deslocamentoMs` simula um salto do relógio. */
export function executarSegmentador(
  sinal: Float32Array,
  config: Partial<ConfigVad> = {},
  saltos: Array<{ aposMs: number; somarMs: number }> = []
): SegmentoDeVoz[] {
  const saida: SegmentoDeVoz[] = [];
  const segmentador = new SegmentadorDeVoz('teste', (s) => saida.push(s), config);
  let deslocamento = 0;
  for (let pos = 0; pos + BLOCO <= sinal.length; pos += BLOCO) {
    const fimMs = ((pos + BLOCO) * 1000) / TAXA_AMOSTRAGEM_HZ;
    for (const salto of saltos) if (fimMs - 64 >= salto.aposMs && fimMs - 128 < salto.aposMs) deslocamento += salto.somarMs;
    segmentador.processar(sinal.subarray(pos, pos + BLOCO), fimMs + deslocamento);
  }
  segmentador.finalizar();
  return saida;
}

export interface ResultadoCoordenador {
  segmentos: SegmentoClassificado[];
  coordenador: CoordenadorDeSegmentacao;
}

/** Alimenta o coordenador com os dois canais em lockstep (microfone primeiro, depois monitor). */
export function executarCoordenador(
  microfone: Float32Array,
  monitor: Float32Array | null,
  opcoes: { modoUmCanal?: boolean; detectarEco?: boolean; antesDeFinalizar?: (c: CoordenadorDeSegmentacao) => void; aoBloco?: (c: CoordenadorDeSegmentacao, fimMs: number) => void } = {}
): ResultadoCoordenador {
  const segmentos: SegmentoClassificado[] = [];
  const coordenador = new CoordenadorDeSegmentacao({
    aoSegmento: (s) => segmentos.push(s),
    modoUmCanal: opcoes.modoUmCanal,
    detectarEco: opcoes.detectarEco,
    origemMs: 0
  });
  const total = Math.max(microfone.length, monitor?.length ?? 0);
  for (let pos = 0; pos + BLOCO <= total; pos += BLOCO) {
    const fimMs = ((pos + BLOCO) * 1000) / TAXA_AMOSTRAGEM_HZ;
    opcoes.aoBloco?.(coordenador, fimMs);
    const blocoMic = new Float32Array(BLOCO);
    blocoMic.set(microfone.subarray(pos, Math.min(pos + BLOCO, microfone.length)));
    coordenador.processarBloco({ canal: 'microfone', amostras: blocoMic, tempoMs: fimMs, rms: 0 });
    if (monitor) {
      const blocoMon = new Float32Array(BLOCO);
      blocoMon.set(monitor.subarray(pos, Math.min(pos + BLOCO, monitor.length)));
      coordenador.processarBloco({ canal: 'monitor', amostras: blocoMon, tempoMs: fimMs, rms: 0 });
    }
  }
  opcoes.antesDeFinalizar?.(coordenador);
  coordenador.finalizar();
  return { segmentos, coordenador };
}
