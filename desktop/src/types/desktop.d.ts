/**
 * API do programa desktop (Electron), exposta por electron/preload.cjs.
 * Fora do Electron (navegador, preview) `window.prumoDesktop` é undefined.
 */
import type {
  MetaReuniao,
  SegmentoPersistido,
  EventoTranscricao,
  ResumoFinal,
  TranscricaoCompleta
} from './transcricao.ts';

export interface StatusMonitorAudio {
  ativo: boolean;
  sinkPadrao: string | null;
  nomeDispositivo: string;
  moduloId: string | null;
}

export interface PreferenciasAudio {
  microfoneId: string;
  monitorId: string;
}

/** F4 (motor de transcrição): declarar aqui os métodos de `window.prumoDesktop.stt`. */
export interface EstadoSttDesktop {
  estado: 'descarregado' | 'carregando' | 'pronto' | 'erro';
  detalhe: string;
  info: { nome: string; biblioteca: string; idioma: string; threads: number | null } | null;
  threads: number;
  tempoCargaMs: number | null;
  rssMb: number | null;
}

export interface PrumoSttApi {
  estado: () => Promise<EstadoSttDesktop | null>;
  /** Carrega o modelo (sob demanda) e resolve quando está pronto; rejeita se falhar. */
  preaquecer: () => Promise<EstadoSttDesktop>;
  /** PCM Float32 mono a 16 kHz, até 60 s. Rejeita com mensagem clara em caso de erro. */
  transcrever: (
    pcm: Float32Array,
    opcoes?: { idioma?: string }
  ) => Promise<{ texto: string; confianca: number | null; duracaoAudioMs: number; tempoProcessamentoMs: number }>;
  /** Encerra o processo do motor e devolve a memória. */
  descarregar: () => Promise<EstadoSttDesktop>;
  aoMudarEstado: (callback: (estado: EstadoSttDesktop) => void) => () => void;
}

// ---- fim do bloco da F4 ----

export interface RespostaIpcTranscricao<T = unknown> {
  ok: boolean;
  dados?: T;
  gravado?: boolean;
  lista?: Array<{
    nomeArquivo: string;
    caminhoCompleto: string;
    tamanhoBytes: number;
    modificadoEm: Date;
  }>;
  erro?: string;
}

/** F5 (sessão e JSON): declarar aqui os métodos de `window.prumoDesktop.transcricao`. */
export interface PrumoTranscricaoApi {
  iniciar: (meta: MetaReuniao) => Promise<RespostaIpcTranscricao<{ caminho: string | null; idArquivo: string | null }>>;
  anexar: (segmento: SegmentoPersistido) => Promise<RespostaIpcTranscricao>;
  evento: (evento: EventoTranscricao) => Promise<RespostaIpcTranscricao>;
  finalizar: (resumo?: ResumoFinal) => Promise<RespostaIpcTranscricao<TranscricaoCompleta | null>>;
  listar: () => Promise<RespostaIpcTranscricao<Array<{ nomeArquivo: string; caminhoCompleto: string; tamanhoBytes: number }>>>;
  abrirPasta: () => Promise<RespostaIpcTranscricao>;
}

// ---- fim do bloco da F5 ----

export interface PrumoDesktopApi {
  readonly plataforma: string;
  readonly versoes: { readonly electron: string; readonly chrome: string };
  readonly janela: {
    ocultar: () => Promise<void>;
    minimizar: () => Promise<void>;
    /** Sem argumento consulta; com booleano altera. Devolve o estado atual. */
    sempreNoTopo: (valor?: boolean) => Promise<boolean>;
    restaurarPosicao: () => Promise<void>;
    sair: () => Promise<void>;
  };
  readonly audio?: {
    statusMonitor: () => Promise<StatusMonitorAudio | null>;
    ativarMonitor: () => Promise<StatusMonitorAudio | null>;
    desativarMonitor: () => Promise<StatusMonitorAudio | null>;
    obterPreferencias: () => Promise<PreferenciasAudio | null>;
    salvarPreferencias: (prefs: PreferenciasAudio) => Promise<boolean>;
    aoMudarSink: (callback: (status: StatusMonitorAudio) => void) => () => void;
  };
  readonly stt?: PrumoSttApi;
  readonly transcricao?: PrumoTranscricaoApi;
  readonly api?: PrumoApiPonte;
}

export interface RespostaApi<T = unknown> {
  ok: boolean;
  status: number;
  dados?: T;
  erro?: string;
}

export interface PrumoApiPonte {
  base: () => Promise<string | null>;
  chamar: <T = unknown>(pedido: { metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT'; caminho: string; corpo?: unknown }) => Promise<RespostaApi<T>>;
  enviarAudio: (dados: { sessaoId: string; wav: Uint8Array; seq: number; inicioMs: number; duracaoMs: number }) => Promise<RespostaApi<{ seq: number; hora: string; status: 'ok' | 'silencio' | 'falha'; texto: string }>>;
}

declare global {
  interface Window {
    prumoDesktop?: PrumoDesktopApi;
  }
}
