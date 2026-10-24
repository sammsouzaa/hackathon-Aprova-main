/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contrato do motor de transcrição (STT). Compartilhado entre a F4 (motor real no processo de
 * utilidade do Electron) e a F5 (sessão e JSON), que só depende desta interface.
 * Não altere sem combinar com as duas frentes.
 */

export type EstadoMotorSTT = 'descarregado' | 'carregando' | 'pronto' | 'erro';

export interface InfoMotorSTT {
  /** Ex.: "whisper-base-q8". */
  nome: string;
  /** Ex.: "@huggingface/transformers@4.0.0 + onnxruntime-node". */
  biblioteca: string;
  idioma: string;
  threads: number | null;
}

export interface OpcoesTranscricao {
  /** Código do idioma; o padrão do motor é "pt". */
  idioma?: string;
}

export interface ResultadoTranscricao {
  /** Texto já limpo (sem alucinações conhecidas); string vazia quando não há fala útil. */
  texto: string;
  /** 0 a 1, ou null quando o motor não informa. */
  confianca: number | null;
  duracaoAudioMs: number;
  /** Tempo gasto só na inferência; RTF = tempoProcessamentoMs / duracaoAudioMs. */
  tempoProcessamentoMs: number;
}

export type ListenerEstadoMotor = (estado: EstadoMotorSTT, detalhe?: string) => void;

export interface MotorSTT {
  readonly estado: EstadoMotorSTT;
  readonly info: InfoMotorSTT;
  /** Carrega o modelo (idempotente). Pode levar vários segundos na primeira vez. */
  carregar(): Promise<void>;
  /** PCM Float32 mono a 16 kHz. Rejeita se o motor não estiver pronto. */
  transcrever(pcm: Float32Array, opcoes?: OpcoesTranscricao): Promise<ResultadoTranscricao>;
  descarregar(): Promise<void>;
  aoMudarEstado(fn: ListenerEstadoMotor): () => void;
}
