/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Usa a API do Prumo para transcrever; se ela não responder ao preparar, cai no motor local
 * (Whisper) e diz isso. Quem decide é o carregar(); durante a reunião o motor não troca sozinho.
 */
import { MotorSTTApi } from './motor-api.ts';
import type { EstadoMotorSTT, InfoMotorSTT, ListenerEstadoMotor, MotorSTT, OpcoesTranscricao, ResultadoTranscricao } from './tipos.ts';

export class MotorSTTHibrido implements MotorSTT {
  readonly api = new MotorSTTApi();
  readonly local: MotorSTT;
  modo: 'api' | 'local' | null = null;
  /** Por que a API não foi usada (só quando o modo é "local"). */
  motivoFallback: string | null = null;
  private listeners = new Set<ListenerEstadoMotor>();

  constructor(local: MotorSTT) {
    this.local = local;
    const repassar = (origem: MotorSTT) => (estado: EstadoMotorSTT, detalhe?: string) => {
      // Só repassa o que vem do motor em uso (ou do que está carregando, antes de escolher).
      const ativo = this.ativo;
      if (ativo === null || ativo === origem) this.listeners.forEach((fn) => fn(estado, detalhe));
    };
    this.api.aoMudarEstado(repassar(this.api));
    this.local.aoMudarEstado(repassar(this.local));
  }

  private get ativo(): MotorSTT | null {
    return this.modo === 'api' ? this.api : this.modo === 'local' ? this.local : null;
  }

  get estado(): EstadoMotorSTT {
    return this.ativo?.estado ?? 'descarregado';
  }

  get info(): InfoMotorSTT {
    return (this.ativo ?? this.api).info;
  }

  aoMudarEstado(fn: ListenerEstadoMotor): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async carregar(): Promise<void> {
    if (this.estado === 'pronto') return;
    // Já como "api" para o estado "pronto" emitido pelo motor da API ser lido como pronto.
    this.modo = 'api';
    try {
      await this.api.carregar();
      this.motivoFallback = null;
      return;
    } catch (erro) {
      this.motivoFallback = erro instanceof Error ? erro.message : String(erro);
    }
    // Sem API: usa o Whisper local. Se ele também falhar, o erro mostra os dois motivos.
    this.modo = 'local';
    try {
      await this.local.carregar();
    } catch (erro) {
      this.modo = null;
      const local = erro instanceof Error ? erro.message : String(erro);
      throw new Error(`API do Prumo indisponível (${this.motivoFallback}) e o modelo local também falhou: ${local}`);
    }
  }

  transcrever(pcm: Float32Array, opcoes?: OpcoesTranscricao): Promise<ResultadoTranscricao> {
    const ativo = this.ativo;
    if (!ativo) return Promise.reject(new Error('Motor não está pronto'));
    return ativo.transcrever(pcm, opcoes);
  }

  async descarregar(): Promise<void> {
    await Promise.allSettled([this.api.descarregar(), this.local.descarregar()]);
    this.modo = null;
  }
}
