/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contratos da F6 (transcrição ao vivo na interface). O controlador depende só destas interfaces:
 * a sessão real (F5), a captura (F2) e o motor (F4) entram por injeção.
 */
import type {
  EstatisticasTranscricao,
  MetaReuniao,
  ModoEscutaPersistido,
  SegmentoPersistido,
  TranscricaoCompleta
} from '../../types/transcricao.ts';
import type { BlocoAudioCapturado } from '../audio/captura.ts';
import type { ContextoCompletoApi, CopilotoApi } from '../api/cliente.ts';

export type EstadoSessaoAoVivo = 'inativa' | 'em_andamento' | 'pausada' | 'finalizando' | 'concluida';

/** O que o controlador exige da sessão de transcrição (implementada pela F5: SessaoDeTranscricao). */
export interface SessaoAoVivo {
  iniciar(
    meta: MetaReuniao,
    opcoes?: { modoUmCanal?: boolean; origemMs?: number }
  ): Promise<{ caminho: string | null; idArquivo: string | null }>;
  pausar(): Promise<void>;
  retomar(): void;
  /** `interrompida: true` fecha o JSON como "interrompida" (reinício da demonstração). */
  finalizar(opcoes?: { interrompida?: boolean }): Promise<TranscricaoCompleta | null>;
  definirFalanteManual(falante: 'implantadora' | 'prefeitura' | null): void;
  definirModoUmCanal(modoUmCanal: boolean): void;
  aoSegmento(fn: (segmento: SegmentoPersistido) => void): () => void;
  aoEstado(fn: (estado: EstadoSessaoAoVivo) => void): () => void;
  estatisticas(): EstatisticasTranscricao;
}

export interface InfoCapturaIniciada {
  /** true quando o canal da reunião (monitor) não está disponível. */
  modoUmCanal: boolean;
  microfone: string;
  monitor: string;
}

export interface EstadoFonteDeAudio {
  ativo: boolean;
  modoUmCanal: boolean;
  microfone: string;
  monitor: string;
}

/** Adaptador sobre `servicoCaptura` (F2). */
export interface FonteDeAudio {
  onBloco(fn: (bloco: BlocoAudioCapturado) => void): () => void;
  onEstado(fn: (estado: EstadoFonteDeAudio) => void): () => void;
  iniciar(): Promise<InfoCapturaIniciada>;
  parar(): Promise<void>;
  /** Para de entregar blocos sem fechar os dispositivos (os medidores continuam). */
  pausar(): void;
  retomar(): void;
  /** Relógio do AudioContext em ms (a mesma base dos blocos); null se a captura não existe. */
  tempoContextoMs(): number | null;
}

export type FaseAoVivo =
  | 'ocioso' // fonte "Ao vivo" ainda não escolhida ou motor descarregado
  | 'carregando_modelo'
  | 'pronto'
  | 'iniciando'
  | 'gravando'
  | 'pausada'
  | 'finalizando'
  | 'concluida'
  | 'erro';

export interface SnapshotAoVivo {
  fase: FaseAoVivo;
  /** Mensagem pronta para a pessoa (sem jargão); null se não houver erro. */
  erro: string | null;
  /** O que falhou, para escolher a ação oferecida. */
  origemDoErro: 'modelo' | 'captura' | 'sessao' | 'finalizacao' | null;
  motor: { estado: string; nome: string; biblioteca: string; threads: number | null; detalhe: string };
  modoEscuta: ModoEscutaPersistido | null;
  modoUmCanal: boolean;
  dispositivos: { microfone: string; monitor: string };
  /** Todas as falas da sessão, em ordem de chegada (a interface ordena por `inicioMs`). */
  segmentos: SegmentoPersistido[];
  ultimo: SegmentoPersistido | null;
  /** Caminho do JSON; null em "escuta sem guardar" ou antes de iniciar. */
  caminho: string | null;
  /** Avisos operacionais da sessão (um canal só, fila atrasada…). */
  avisos: string[];
  estatisticas: EstatisticasTranscricao | null;
  /** Análise da API (checklist, última fala, sugestões); null sem API ou antes do primeiro retorno. */
  copiloto: CopilotoApi | null;
  /** Contexto do cliente carregado da API (nome, checklist de partida); null sem API. */
  contexto: ContextoCompletoApi | null;
  /** Quem transcreve esta reunião; null antes de iniciar. */
  transcricaoPor: 'api' | 'local' | null;
}

export type ListenerAoVivo = (snapshot: SnapshotAoVivo) => void;
