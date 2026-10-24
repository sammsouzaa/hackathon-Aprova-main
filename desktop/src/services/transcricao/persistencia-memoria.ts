/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Persistência em memória para testes. Usa o gravador do processo principal (node:fs): NÃO importar
 * a partir do código da interface, só de scripts de teste.
 */
import type { MetaReuniao, SegmentoPersistido, EventoTranscricao, ResumoFinal, TranscricaoCompleta } from '../../types/transcricao.ts';
import { criarGravador } from '../../../electron/transcricoes.mjs';
import type { PersistenciaTranscricao } from './persistencia.ts';

export class PersistenciaMemoria implements PersistenciaTranscricao {
  private gravador: ReturnType<typeof criarGravador>;
  private dadosFinais: TranscricaoCompleta | null = null;

  constructor(diretorioTemp: string = '/tmp/prumo-memoria') {
    this.gravador = criarGravador({
      diretorioDados: diretorioTemp,
      escreverSincrono: true
    });
  }

  async iniciar(meta: MetaReuniao): Promise<{ caminho: string | null; idArquivo: string | null }> {
    const res = this.gravador.iniciar(meta);
    return res;
  }

  async anexar(segmento: SegmentoPersistido): Promise<boolean> {
    return this.gravador.anexar(segmento);
  }

  async evento(evento: EventoTranscricao): Promise<boolean> {
    return this.gravador.evento(evento);
  }

  async finalizar(resumo?: ResumoFinal): Promise<TranscricaoCompleta | null> {
    const res = this.gravador.finalizar(resumo);
    this.dadosFinais = res as TranscricaoCompleta | null;
    return this.dadosFinais;
  }

  obterDados(): TranscricaoCompleta | null {
    return this.dadosFinais || (this.gravador.estadoAtual() as TranscricaoCompleta | null);
  }
}
