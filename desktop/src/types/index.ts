/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EstadoReuniao = 'preparando' | 'em_reuniao' | 'pausada' | 'encerrando' | 'concluida';

export type ModoEscuta = 'gravacao_com_aviso' | 'escuta_sem_guardar' | 'modo_notas';

export type FonteFala = 'roteiro' | 'audio_gravado' | 'ao_vivo';

export type StatusItemChecklist =
  | 'confirmado_contexto'
  | 'pendente'
  | 'respondido'
  | 'regra_local'
  | 'lacuna';

export interface ItemChecklist {
  id: string; // ex: 'CHK-01'
  titulo: string;
  descricao: string;
  valorModelo: string;
  status: StatusItemChecklist;
  valorRespondido?: string;
  evidencia?: string;
  docReferencia?: string;
  regraLocal?: boolean;
}

export interface DocumentoModelo {
  id: string; // ex: 'DOC-01'
  titulo: string;
  artigo: string;
  textoCompleto: string;
}

export interface FalaRoteiro {
  id: number;
  orador: 'implantadora' | 'prefeitura';
  nome: string;
  cargo: string;
  texto: string;
}

export interface Compromisso {
  id: string; // CMP-01, CMP-02
  titulo: string;
  responsavel: string;
  prazo: string;
  confirmado: boolean;
  ticketId?: string;
  arquivoAnexo?: string;
  status?: 'pendente' | 'recebido';
}

export type DecisaoContradicao = 'perguntar' | 'aceitar_regra_local' | 'ignorar';

export interface DadosMensagemTexto {
  texto: string;
}

export interface DadosMensagemItemMarcado {
  itemId: string;
  itemTitulo: string;
  valor: string;
  evidencia: string;
  desmarcado?: boolean;
}

export interface DadosMensagemContradicao {
  itemId: string;
  itemTitulo: string;
  falaCliente: string;
  docId: string;
  docTitulo: string;
  docArtigo: string;
  docTexto: string;
  valorCliente: string;
  valorModelo: string;
  decisao?: DecisaoContradicao;
}

export interface DadosMensagemCompromisso {
  compromissoId: string;
  titulo: string;
  responsavel: string;
  prazo: string;
  confirmado?: boolean;
  prazoEditado?: string;
}

export interface DadosMensagemLacunas {
  itensLacuna: Array<{
    id: string;
    titulo: string;
    valorModelo: string;
  }>;
  contradicoesAbertas: number;
}

export interface DadosMensagemResumo {
  cobertura: string;
  regrasLocais: number;
  compromissos: number;
}

export interface DadosMensagemLembrete {
  dataSimulada: string;
  texto: string;
  tipo: 'envio' | 'resposta';
  ticketId?: string;
  compromissoId?: string;
  concluido?: boolean;
}

export interface DadosMensagemPendencia {
  pergunta: string;
  observacao: string;
  codigoProtocolo: string;
}

export interface DadosMensagemPerguntaResposta {
  pergunta: string;
  resposta: string;
  docReferencia?: {
    id: string;
    titulo: string;
    artigo: string;
    texto: string;
  };
}

export type TipoMensagem =
  | 'texto'
  | 'item_marcado'
  | 'contradicao'
  | 'compromisso'
  | 'lacunas'
  | 'resumo'
  | 'lembrete'
  | 'pendencia'
  | 'pergunta_resposta'
  | 'usuario';

export interface Mensagem {
  id: string;
  timestamp: string;
  remetente: 'prumo' | 'usuario';
  tipo: TipoMensagem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: any;
  fonteAnalise?:
    | 'Análise gravada'
    | 'Tempo simulado'
    | 'Resposta simulada'
    | 'Entrada da usuária'
    | 'Transcrição local'
    | 'Análise da API';
}
