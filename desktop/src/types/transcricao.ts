/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tipos do esquema JSON v1 de persistência da sessão de transcrição do Prumo.
 */

export type EstadoReuniaoPersistida = 'em_andamento' | 'concluida' | 'interrompida';

export type ModoEscutaPersistido = 'gravacao_com_aviso' | 'escuta_sem_guardar' | 'modo_notas';

export type FalantePersistido = 'implantadora' | 'prefeitura' | 'indefinido';

export type AtribuicaoPersistida = 'canal' | 'manual' | 'indefinido';

export type CanalAudioPersistido = 'microfone' | 'monitor';

export type MotivoDescarteEco = 'eco_sinal' | 'eco_texto' | null;

export type TipoEventoTranscricao =
  | 'reuniao_iniciada'
  | 'pausada'
  | 'retomada'
  | 'encerrada'
  | 'dispositivo_ausente'
  | 'erro_stt'
  | 'aviso';

export interface MetaReuniao {
  id: string;
  processo: string;
  iniciadaEm?: string;
  modoEscuta: ModoEscutaPersistido;
  participantesAvisados: boolean;
  motor?: Partial<MotorPersistido>;
  falantes?: FalanteInfo[];
}

export interface MotorPersistido {
  nome: string;
  biblioteca: string;
  idioma: string;
  threads: number | null;
  rtfMedio: number | null;
}

export interface FalanteInfo {
  id: FalantePersistido;
  rotulo: string;
  canal: CanalAudioPersistido;
  dispositivo: string;
}

export interface SegmentoPersistido {
  id: number;
  falante: FalantePersistido;
  atribuicao: AtribuicaoPersistida;
  canal: CanalAudioPersistido;
  inicioMs: number;
  fimMs: number;
  texto: string;
  confianca: number | null;
  descartadoPorEco: boolean;
  motivoDescarte: MotivoDescarteEco;
  latenciaMs: number | null;
  forcadoPorTamanho: boolean;
}

export interface EventoTranscricao {
  tMs: number;
  tipo: TipoEventoTranscricao;
  detalhe?: string;
}

export interface EstatisticasTranscricao {
  segmentos: number;
  descartadosPorEco: number;
  segmentosSemTexto?: number;
  duracaoMs: number;
  porFalante: Record<FalantePersistido, number>;
  latenciaMedianaMs: number | null;
}

export interface ReuniaoInfoPersistida {
  id: string;
  processo: string;
  iniciadaEm: string;
  encerradaEm: string | null;
  estado: EstadoReuniaoPersistida;
  modoEscuta: ModoEscutaPersistido;
  participantesAvisados: boolean;
}

export interface TranscricaoCompleta {
  versaoEsquema: 1;
  reuniao: ReuniaoInfoPersistida;
  motor: MotorPersistido;
  falantes: FalanteInfo[];
  segmentos: SegmentoPersistido[];
  eventos: EventoTranscricao[];
  estatisticas: EstatisticasTranscricao;
}

export interface ResumoFinal {
  encerradaEm?: string;
  estado?: 'concluida' | 'interrompida';
  rtfMedio?: number | null;
}
