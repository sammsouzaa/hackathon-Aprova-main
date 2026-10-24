// Cliente da API do backend (contextos). URL e contexto vêm do rodar.py via variáveis VITE_*.
import { Folder, PendingQuestion, RawFile, Rule } from './types';

// Sem VITE_API_URL, usa o mesmo host da página: quem abre http://<ip>:3000 na rede fala com http://<ip>:8000.
export const API_URL =
  (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:8000`;
export const CONTEXTO_ID = (import.meta.env.VITE_CONTEXTO_ID as string) || 'meulab-ifpr-cascavel';

export interface ItemChecklist {
  id: string;
  codigo: string;
  titulo: string;
  pergunta: string;
  categoria: string;
  obrigatoria: boolean;
  valor_referencia: string | null;
  confirmado_no_contexto: boolean;
  resposta_contexto: string | null;
}

export interface ArquivoContexto {
  nome: string;
  bytes: number;
  processado_em: string | null;
  erro: string | null;
}

export interface ContextoCompleto {
  id: string;
  nome: string;
  descricao: string;
  criado_em: string;
  arquivos: ArquivoContexto[];
  contexto: string;
  glossario: string[];
  checklist: ItemChecklist[];
  perguntas_rapidas: string[];
}

export interface ConteudoArquivo {
  nome: string;
  bytes: number;
  texto: string | null;
  extracao: string | null;
}

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${caminho}`, init);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

export const buscarContexto = () => chamar<ContextoCompleto>(`/contextos/${CONTEXTO_ID}`);

export const buscarArquivo = (nome: string) =>
  chamar<ConteudoArquivo>(`/contextos/${CONTEXTO_ID}/arquivos/${encodeURIComponent(nome)}`);

export interface TrocaChat {
  pergunta: string;
  resposta: string;
}

// Resposta da IA chegando aos pedaços; onTexto recebe o texto acumulado a cada pedaço.
export async function perguntarContextoStream(
  texto: string,
  historico: TrocaChat[],
  onTexto: (acumulado: string) => void,
): Promise<string> {
  const r = await fetch(`${API_URL}/contextos/${CONTEXTO_ID}/perguntar/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, historico }),
  });
  if (!r.ok || !r.body) throw new Error(`${r.status} ${await r.text()}`);
  const leitor = r.body.getReader();
  const decoder = new TextDecoder();
  let acumulado = '';
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    acumulado += decoder.decode(value, { stream: true });
    onTexto(acumulado);
  }
  return acumulado;
}

// A resposta começa com [confirmado|pendente|nao_consta]; enquanto a etiqueta não fecha, nada aparece.
export type Confianca = 'confirmado' | 'pendente' | 'nao_consta';

export function separarConfianca(texto: string): { confianca: Confianca | null; corpo: string } {
  const m = texto.match(/^\s*\[(confirmado|pendente|nao_consta)\]\s*/);
  if (m) return { confianca: m[1] as Confianca, corpo: texto.slice(m[0].length) };
  if (/^\s*\[[a-z_]*$/.test(texto)) return { confianca: null, corpo: '' };
  return { confianca: null, corpo: texto };
}

// ---------- conversão para o formato das telas ----------

// Os .md fazem o papel dos PDFs digitalizados do cliente.
export const nomeExibicao = (nome: string) => nome.replace(/\.md$/i, '.pdf');

export const PASTAS: Folder[] = [
  { id: 'folder-proposta', name: 'Proposta & Escopo', description: 'Proposta técnica e escopo contratado', color: 'emerald' },
  { id: 'folder-atas', name: 'Atas de Reunião', description: 'Atas e registros das reuniões com o cliente', color: 'sky' },
  { id: 'folder-planilhas', name: 'Planilhas & Inventários', description: 'Inventários e dados operacionais do cliente', color: 'amber' },
  { id: 'folder-emails', name: 'E-mails do Cliente', description: 'Comunicações recebidas da equipe do cliente', color: 'indigo' },
];

const DESCRICOES: Record<string, string> = {
  proposta: 'Proposta técnica PT-2026-031: módulos, fases, perfis e laboratórios',
  ata: 'Kickoff de 10/10: decisões confirmadas e pontos sem fechamento',
  inventario: 'Inventário do almoxarifado de Química, com estoques mínimos',
  email: 'E-mail do técnico Marcos sobre o processo atual e tempos de preparo',
};

function pastaDe(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('ata')) return 'folder-atas';
  if (n.endsWith('.csv') || n.endsWith('.xlsx')) return 'folder-planilhas';
  if (n.includes('email') || n.includes('e-mail')) return 'folder-emails';
  return 'folder-proposta';
}

function tipoDe(nome: string): RawFile['type'] {
  const n = nome.toLowerCase();
  if (/\.(md|pdf)$/.test(n)) return 'pdf';
  if (/\.(mp3|wav|ogg|m4a|webm)$/.test(n)) return 'audio';
  if (/\.(png|jpe?g|webp|heic)$/.test(n)) return 'image';
  return 'doc';
}

const tamanho = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Não processado';

export function arquivosParaTela(arquivos: ArquivoContexto[]): RawFile[] {
  return arquivos.map((a) => {
    const chave = Object.keys(DESCRICOES).find((k) => a.nome.toLowerCase().includes(k));
    return {
      id: a.nome,
      name: nomeExibicao(a.nome),
      apiName: a.nome,
      type: tipoDe(a.nome),
      size: tamanho(a.bytes),
      uploadDate: data(a.processado_em),
      status: a.erro ? 'flagged' : a.processado_em ? 'processed' : 'analyzing',
      rulesExtracted: 0,
      description: chave ? DESCRICOES[chave] : 'Documento do cliente',
      folderId: pastaDe(a.nome),
    };
  });
}

export function checklistParaRegras(itens: ItemChecklist[]): Rule[] {
  return itens
    .filter((i) => i.confirmado_no_contexto)
    .map((i) => ({
      id: i.id,
      title: `${i.codigo} · ${i.titulo}`,
      definition: i.resposta_contexto || i.valor_referencia || '',
      sources: [{ id: `${i.id}-src`, label: 'Confirmado no contexto', type: 'pdf' as const, detail: i.pergunta }],
      status: 'validated' as const,
      category: i.categoria || 'Geral',
      dateValidated: 'Contexto',
      impactScore: i.obrigatoria ? ('Alto' as const) : ('Médio' as const),
      appliedToForm: false,
    }));
}

export function checklistParaPerguntas(itens: ItemChecklist[]): PendingQuestion[] {
  return itens
    .filter((i) => !i.confirmado_no_contexto)
    .map((i) => ({
      id: i.id,
      question: i.pergunta,
      aiContext: i.valor_referencia
        ? `O material indica "${i.valor_referencia}", mas ainda não foi confirmado com o cliente.`
        : 'Nenhum documento do contexto responde a esta pergunta.',
      options: i.valor_referencia ? [i.valor_referencia] : [],
      answered: false,
      urgency: i.obrigatoria ? 'high' : 'medium',
      targetRole: i.categoria || 'Cliente',
      sourceReference: `${i.codigo} · ${i.titulo}`,
    }));
}
