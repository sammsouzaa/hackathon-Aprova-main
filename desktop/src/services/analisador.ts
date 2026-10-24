/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FalaRoteiro,
  ItemChecklist,
  DocumentoModelo,
  Compromisso
} from '../types';
import { EFEITOS_FALAS_GRAVADAS, EfeitoFalaGravada } from '../data/respostasGravadas';
import { DOCUMENTOS_MODELO } from '../data/documentos';

export interface ResultadoAnaliseTrecho {
  sucesso: boolean;
  fonteAnalise: 'Análise gravada';
  efeito?: EfeitoFalaGravada;
  erro?: string;
}

export interface EstruturaResumoFinal {
  cobertura: string;
  totalItens: number;
  itensConfirmados: number;
  itensPendentes: number;
  regrasLocais: ItemChecklist[];
  regrasPadraoConfirmadas: ItemChecklist[];
  pendencias: ItemChecklist[];
  compromissos: Compromisso[];
  dataGeracao: string;
  municipio: string;
  implantadora: string;
  analistaCliente: string;
}

/**
 * Ponto de extensão / costura para o modelo de IA futuro.
 * Nesta versão, consome o arquivo de dados de respostas pré-calculadas
 * e retorna exatamente a mesma estrutura JSON que a IA retornaria em produção.
 */
export async function analisarTrecho(
  fala: FalaRoteiro,
  _checklist: ItemChecklist[],
  _documentos: DocumentoModelo[],
  _hoje: string = '2026-10-26T14:00:00'
): Promise<ResultadoAnaliseTrecho> {
  // Simula latência de processamento local (100ms)
  await new Promise((resolve) => setTimeout(resolve, 80));

  const efeito = EFEITOS_FALAS_GRAVADAS[fala.id];

  return {
    sucesso: true,
    fonteAnalise: 'Análise gravada',
    efeito: efeito || undefined
  };
}

/**
 * Gera o resumo estruturado da reunião com base no estado atual do checklist e compromissos.
 */
export function gerarResumo(
  checklist: ItemChecklist[],
  compromissos: Compromisso[]
): EstruturaResumoFinal {
  const confirmados = checklist.filter(
    (i) => i.status === 'confirmado_contexto' || i.status === 'respondido' || i.status === 'regra_local'
  );
  const regrasLocais = checklist.filter((i) => i.status === 'regra_local' || i.regraLocal);
  const pendencias = checklist.filter(
    (i) => i.status === 'pendente' || i.status === 'lacuna'
  );
  const regrasPadrao = checklist.filter(
    (i) => (i.status === 'confirmado_contexto' || i.status === 'respondido') && !i.regraLocal
  );

  return {
    cobertura: `${confirmados.length}/${checklist.length}`,
    totalItens: checklist.length,
    itensConfirmados: confirmados.length,
    itensPendentes: pendencias.length,
    regrasLocais,
    regrasPadraoConfirmadas: regrasPadrao,
    pendencias,
    compromissos,
    dataGeracao: 'Segunda-feira, 26/10/2026 14:35',
    municipio: 'Prefeitura de Serra do Sabiá',
    implantadora: 'Marina Duarte',
    analistaCliente: 'Helena Prado'
  };
}

/**
 * Consulta pré-definida à documentação do modelo (campo de busca/pergunta do usuário).
 * Responde com base nos documentos especificados no brief.
 */
export function consultarDocumentacao(pergunta: string): {
  encontrado: boolean;
  resposta: string;
  docReferencia?: DocumentoModelo;
} {
  const q = pergunta.toLowerCase().trim();

  if (q.includes('recuo')) {
    const doc = DOCUMENTOS_MODELO.find((d) => d.id === 'DOC-02');
    return {
      encontrado: true,
      resposta: 'O recuo frontal mínimo previsto no modelo é de 4,50 m.',
      docReferencia: doc
    };
  }

  if (q.includes('taxa')) {
    const doc = DOCUMENTOS_MODELO.find((d) => d.id === 'DOC-04');
    return {
      encontrado: true,
      resposta: 'A taxa de alvará residencial no modelo é de R$ 3,85 por metro quadrado.',
      docReferencia: doc
    };
  }

  if (q.includes('prazo')) {
    const doc = DOCUMENTOS_MODELO.find((d) => d.id === 'DOC-05');
    return {
      encontrado: true,
      resposta: 'O prazo de análise técnica previsto no modelo é de 20 dias úteis.',
      docReferencia: doc
    };
  }

  return {
    encontrado: false,
    resposta: 'Não encontrei isso na documentação. Abri uma pendência (simulado).'
  };
}
