/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cliente da API do Prumo (transcrição e análise no servidor). As chamadas passam pelo processo
 * principal do Electron (window.prumoDesktop.api): sem CORS e sem abrir a CSP da interface.
 */

export interface ContextoApi {
  id: string;
  nome: string;
  tem_contexto?: boolean;
}

export interface ItemChecklistApi {
  id: string;
  codigo: string;
  titulo: string;
  pergunta?: string;
  categoria?: string;
  obrigatoria?: boolean;
  valor_referencia?: string | null;
  status: 'pendente' | 'parcial' | 'respondida' | 'ignorada';
  resposta?: string | null;
  fonte?: 'contexto' | 'conversa' | 'manual' | null;
  diverge?: boolean;
  trecho?: string | null;
  hora?: string | null;
  manual?: boolean;
}

/** Item do checklist do contexto (antes da reunião). */
export interface ItemContextoApi {
  id: string;
  codigo: string;
  titulo: string;
  pergunta?: string;
  categoria?: string;
  valor_referencia?: string | null;
  confirmado_no_contexto?: boolean;
  resposta_contexto?: string | null;
}

export interface ContextoCompletoApi extends ContextoApi {
  checklist: ItemContextoApi[];
  perguntas_rapidas?: string[];
}

export interface CopilotoApi {
  estado: 'preparando' | 'ouvindo' | 'finalizada';
  ultima_fala?: { seq: number; hora: string; texto: string } | null;
  perguntas_rapidas?: string[];
  resumo?: string;
  sugestao_pergunta_imediata?: string | null;
  perguntas_sugeridas?: string[];
  checklist: ItemChecklistApi[];
  progresso?: { respondida: number; total: number; percentual: number; confirmados_contexto?: number };
  anotacoes?: { ia?: string[]; manuais?: Array<{ hora: string; texto: string }> };
}

export type ModoApi = 'gravacao' | 'sem_guardar' | 'notas';

export function apiDisponivel(): boolean {
  return typeof window !== 'undefined' && Boolean(window.prumoDesktop?.api);
}

export async function chamarApi<T>(metodo: 'GET' | 'POST' | 'PATCH' | 'PUT', caminho: string, corpo?: unknown): Promise<T> {
  const ponte = window.prumoDesktop?.api;
  if (!ponte) throw new Error('A API só está disponível no programa desktop.');
  const resposta = await ponte.chamar<T>({ metodo, caminho, corpo });
  if (!resposta.ok) throw new Error(resposta.erro ?? 'Falha na API');
  return resposta.dados as T;
}

/** Escolhe o contexto da reunião: o do alvará, se existir; senão o primeiro com material processado. */
export async function descobrirContexto(): Promise<ContextoApi> {
  const lista = await chamarApi<ContextoApi[]>('GET', '/contextos');
  if (!Array.isArray(lista) || lista.length === 0) throw new Error('A API não tem nenhum contexto cadastrado.');
  return (
    lista.find((c) => /meulab|ifpr|alvar|serra/i.test(`${c.id} ${c.nome}`) && c.tem_contexto !== false) ??
    lista.find((c) => c.tem_contexto !== false) ??
    lista[0]
  );
}

export function gerarIdDaSessao(agora = new Date()): string {
  const d2 = (n: number) => n.toString().padStart(2, '0');
  return `prumo-${agora.getFullYear()}${d2(agora.getMonth() + 1)}${d2(agora.getDate())}-${d2(agora.getHours())}${d2(agora.getMinutes())}${d2(agora.getSeconds())}`;
}

/** PCM Float32 mono → WAV 16 bits (formato aceito por POST /sessoes/{id}/audio). */
export function codificarWav(pcm: Float32Array, taxa = 16000): Uint8Array {
  const dados = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const texto = (deslocamento: number, valor: string) => {
    for (let i = 0; i < valor.length; i++) dados.setUint8(deslocamento + i, valor.charCodeAt(i));
  };
  texto(0, 'RIFF');
  dados.setUint32(4, 36 + pcm.length * 2, true);
  texto(8, 'WAVE');
  texto(12, 'fmt ');
  dados.setUint32(16, 16, true);
  dados.setUint16(20, 1, true);
  dados.setUint16(22, 1, true);
  dados.setUint32(24, taxa, true);
  dados.setUint32(28, taxa * 2, true);
  dados.setUint16(32, 2, true);
  dados.setUint16(34, 16, true);
  texto(36, 'data');
  dados.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const amostra = Math.max(-1, Math.min(1, pcm[i]));
    dados.setInt16(44 + i * 2, amostra < 0 ? amostra * 0x8000 : amostra * 0x7fff, true);
  }
  return new Uint8Array(dados.buffer);
}
