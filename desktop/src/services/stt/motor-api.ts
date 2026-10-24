/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Motor de transcrição que delega à API do Prumo (POST /sessoes/{id}/audio). Mesmo contrato do motor
 * local: a sessão de transcrição (VAD por canal, eco, JSON) não muda.
 */
import { chamarApi, codificarWav, descobrirContexto, type ContextoApi } from '../api/cliente.ts';
import type { EstadoMotorSTT, InfoMotorSTT, ListenerEstadoMotor, MotorSTT, ResultadoTranscricao } from './tipos.ts';

export class MotorSTTApi implements MotorSTT {
  readonly info: InfoMotorSTT = { nome: 'api-prumo', biblioteca: 'API do Prumo (Gemini)', idioma: 'pt', threads: null };
  contexto: ContextoApi | null = null;
  private estadoAtual: EstadoMotorSTT = 'descarregado';
  private listeners = new Set<ListenerEstadoMotor>();
  private sessaoId: string | null = null;
  private seq = 0;

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

  /** Sessão da API que recebe os trechos; a numeração recomeça a cada reunião. */
  definirSessao(id: string | null): void {
    this.sessaoId = id;
    this.seq = 0;
  }

  async carregar(): Promise<void> {
    if (this.estadoAtual === 'pronto') return;
    this.mudar('carregando');
    try {
      this.contexto = await descobrirContexto();
      this.mudar('pronto');
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      this.mudar('erro', mensagem);
      throw new Error(mensagem);
    }
  }

  async transcrever(pcm: Float32Array): Promise<ResultadoTranscricao> {
    if (!this.sessaoId) throw new Error('Sessão da API não iniciada');
    const ponte = window.prumoDesktop?.api;
    if (!ponte) throw new Error('API indisponível');
    const duracaoMs = Math.round((pcm.length * 1000) / 16000);
    const t0 = Date.now();
    const resposta = await ponte.enviarAudio({
      sessaoId: this.sessaoId,
      wav: codificarWav(pcm),
      seq: ++this.seq,
      inicioMs: t0 - duracaoMs,
      duracaoMs
    });
    if (!resposta.ok) throw new Error(resposta.erro ?? 'Falha ao enviar o áudio');
    const dados = resposta.dados;
    if (dados?.status === 'falha') throw new Error('A API não conseguiu transcrever o trecho');
    return {
      texto: dados?.status === 'ok' ? (dados.texto ?? '').trim() : '',
      confianca: null,
      duracaoAudioMs: duracaoMs,
      tempoProcessamentoMs: Date.now() - t0
    };
  }

  async descarregar(): Promise<void> {
    this.contexto = null;
    this.mudar('descarregado');
  }
}

/** Atalho usado pelo controlador para a conversa com a sessão (fora da transcrição). */
export const api = { chamar: chamarApi };
