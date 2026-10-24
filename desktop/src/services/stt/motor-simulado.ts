/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Motor de transcrição de mentira, para testes e para a F5 antes de a F4 ser mesclada.
 * Devolve textos de uma fila (ou um texto padrão), com latência opcional. Nunca é usado como se
 * fosse real: `info.nome` começa com "simulado".
 */
import type {
  EstadoMotorSTT,
  InfoMotorSTT,
  ListenerEstadoMotor,
  MotorSTT,
  OpcoesTranscricao,
  ResultadoTranscricao
} from './tipos.ts';

export interface OpcoesMotorSimulado {
  /** Textos devolvidos em ordem; depois que acabam, usa `textoPadrao`. */
  respostas?: string[];
  textoPadrao?: string;
  latenciaMs?: number;
  /** Se informado, o carregar() rejeita com esta mensagem. */
  falharAoCarregar?: string;
  /** Se informado, o transcrever() de índice N (0 = primeiro) rejeita. */
  falharNaTranscricao?: number[];
}

export class MotorSTTSimulado implements MotorSTT {
  readonly info: InfoMotorSTT = {
    nome: 'simulado',
    biblioteca: 'motor-simulado',
    idioma: 'pt',
    threads: null
  };

  private estadoAtual: EstadoMotorSTT = 'descarregado';
  private readonly listeners = new Set<ListenerEstadoMotor>();
  private readonly respostas: string[];
  private readonly opcoes: OpcoesMotorSimulado;
  private chamadas = 0;

  /** Quantos PCM foram recebidos, com a duração de cada um (para asserções em testes). */
  readonly recebidos: Array<{ duracaoMs: number }> = [];

  constructor(opcoes: OpcoesMotorSimulado = {}) {
    this.opcoes = opcoes;
    this.respostas = [...(opcoes.respostas ?? [])];
  }

  get estado(): EstadoMotorSTT {
    return this.estadoAtual;
  }

  aoMudarEstado(fn: ListenerEstadoMotor): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private mudar(estado: EstadoMotorSTT, detalhe?: string): void {
    this.estadoAtual = estado;
    this.listeners.forEach((fn) => fn(estado, detalhe));
  }

  async carregar(): Promise<void> {
    if (this.estadoAtual === 'pronto') return;
    this.mudar('carregando');
    if (this.opcoes.falharAoCarregar) {
      this.mudar('erro', this.opcoes.falharAoCarregar);
      throw new Error(this.opcoes.falharAoCarregar);
    }
    this.mudar('pronto');
  }

  async transcrever(pcm: Float32Array, _opcoes?: OpcoesTranscricao): Promise<ResultadoTranscricao> {
    if (this.estadoAtual !== 'pronto') throw new Error('Motor simulado não está pronto');
    const indice = this.chamadas++;
    const duracaoAudioMs = Math.round((pcm.length * 1000) / 16000);
    this.recebidos.push({ duracaoMs: duracaoAudioMs });

    const latencia = this.opcoes.latenciaMs ?? 0;
    if (latencia > 0) await new Promise((resolver) => setTimeout(resolver, latencia));
    if (this.opcoes.falharNaTranscricao?.includes(indice)) throw new Error(`Falha simulada na transcrição ${indice}`);

    const texto = this.respostas.shift() ?? this.opcoes.textoPadrao ?? `fala simulada ${indice + 1}`;
    return { texto, confianca: null, duracaoAudioMs, tempoProcessamentoMs: latencia };
  }

  async descarregar(): Promise<void> {
    this.mudar('descarregado');
  }
}
