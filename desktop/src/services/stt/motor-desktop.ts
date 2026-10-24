/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Motor real: fala com o processo de utilidade do Electron (Whisper em onnxruntime-node) por
 * `window.prumoDesktop.stt`. O modelo só é carregado quando `carregar()` é chamado.
 */
import type {
  EstadoMotorSTT,
  InfoMotorSTT,
  ListenerEstadoMotor,
  MotorSTT,
  OpcoesTranscricao,
  ResultadoTranscricao
} from './tipos.ts';

const INFO_INICIAL: InfoMotorSTT = { nome: 'whisper-base-q8', biblioteca: 'ainda não carregado', idioma: 'pt', threads: null };

export class MotorSTTDesktop implements MotorSTT {
  private estadoAtual: EstadoMotorSTT = 'descarregado';
  private infoAtual: InfoMotorSTT = INFO_INICIAL;
  private readonly listeners = new Set<ListenerEstadoMotor>();

  constructor() {
    const api = window.prumoDesktop?.stt;
    if (!api) return;
    api.aoMudarEstado((e) => this.aplicar(e.estado, e.detalhe, e.info));
    api
      .estado()
      .then((e) => e && this.aplicar(e.estado, e.detalhe, e.info))
      .catch(() => {});
  }

  get estado(): EstadoMotorSTT {
    return this.estadoAtual;
  }

  get info(): InfoMotorSTT {
    return this.infoAtual;
  }

  aoMudarEstado(fn: ListenerEstadoMotor): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private aplicar(estado: EstadoMotorSTT, detalhe: string, info: InfoMotorSTT | null): void {
    if (info) this.infoAtual = info;
    if (estado === this.estadoAtual && !detalhe) return;
    this.estadoAtual = estado;
    this.listeners.forEach((fn) => fn(estado, detalhe || undefined));
  }

  private api() {
    const api = window.prumoDesktop?.stt;
    if (!api) throw new Error('Motor de transcrição indisponível fora do programa desktop');
    return api;
  }

  async carregar(): Promise<void> {
    const e = await this.api().preaquecer();
    this.aplicar(e.estado, e.detalhe, e.info);
  }

  async transcrever(pcm: Float32Array, opcoes?: OpcoesTranscricao): Promise<ResultadoTranscricao> {
    return this.api().transcrever(pcm, opcoes);
  }

  async descarregar(): Promise<void> {
    const e = await this.api().descarregar();
    this.aplicar(e.estado, e.detalhe, e.info);
  }
}
