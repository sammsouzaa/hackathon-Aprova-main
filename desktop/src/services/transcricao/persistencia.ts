/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adaptadores de persistência para a sessão de transcrição.
 */
import type {
  MetaReuniao,
  SegmentoPersistido,
  EventoTranscricao,
  ResumoFinal,
  TranscricaoCompleta
} from '../../types/transcricao.ts';

export interface PersistenciaTranscricao {
  iniciar(meta: MetaReuniao): Promise<{ caminho: string | null; idArquivo: string | null }>;
  anexar(segmento: SegmentoPersistido): Promise<boolean>;
  evento(evento: EventoTranscricao): Promise<boolean>;
  finalizar(resumo?: ResumoFinal): Promise<TranscricaoCompleta | null>;
  obterDados(): TranscricaoCompleta | null;
}

/**
 * Persistência real em ambiente desktop (Electron), delegando ao IPC.
 */
export class PersistenciaDesktop implements PersistenciaTranscricao {
  private dadosLocais: TranscricaoCompleta | null = null;

  async iniciar(meta: MetaReuniao): Promise<{ caminho: string | null; idArquivo: string | null }> {
    if (!window.prumoDesktop?.transcricao) {
      throw new Error('API prumoDesktop.transcricao não disponível neste ambiente');
    }
    const res = await window.prumoDesktop.transcricao.iniciar(meta);
    if (!res.ok) throw new Error(res.erro || 'Falha ao iniciar transcrição via IPC');
    return res.dados || { caminho: null, idArquivo: null };
  }

  async anexar(segmento: SegmentoPersistido): Promise<boolean> {
    if (!window.prumoDesktop?.transcricao) return false;
    const res = await window.prumoDesktop.transcricao.anexar(segmento);
    return Boolean(res.ok && res.gravado);
  }

  async evento(evento: EventoTranscricao): Promise<boolean> {
    if (!window.prumoDesktop?.transcricao) return false;
    const res = await window.prumoDesktop.transcricao.evento(evento);
    return Boolean(res.ok && res.gravado);
  }

  async finalizar(resumo?: ResumoFinal): Promise<TranscricaoCompleta | null> {
    if (!window.prumoDesktop?.transcricao) return null;
    const res = await window.prumoDesktop.transcricao.finalizar(resumo);
    if (res.ok && res.dados) {
      this.dadosLocais = res.dados;
      return res.dados;
    }
    return null;
  }

  obterDados(): TranscricaoCompleta | null {
    return this.dadosLocais;
  }
}

/**
 * Persistência que não grava nada em disco (modo "escuta sem guardar"): só devolve o que a sessão
 * precisa para funcionar. O texto vive na tela até a reunião acabar e depois some.
 */
export class PersistenciaNula implements PersistenciaTranscricao {
  async iniciar(): Promise<{ caminho: string | null; idArquivo: string | null }> {
    return { caminho: null, idArquivo: null };
  }
  async anexar(): Promise<boolean> {
    return true;
  }
  async evento(): Promise<boolean> {
    return true;
  }
  async finalizar(): Promise<TranscricaoCompleta | null> {
    return null;
  }
  obterDados(): TranscricaoCompleta | null {
    return null;
  }
}
