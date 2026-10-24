/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemChecklist } from '../types';

export const CHECKLIST_INICIAL: ItemChecklist[] = [
  {
    id: 'CHK-01',
    titulo: 'Zonas abrangidas',
    descricao: 'Zonas territoriais com aplicação do alvará residencial',
    valorModelo: 'ZR1, ZR2, ZC1',
    status: 'confirmado_contexto',
    valorRespondido: 'ZR1, ZR2 e ZC1',
    evidencia: 'Confirmado pelo material prévio e histórico do município.',
    docReferencia: 'DOC-01'
  },
  {
    id: 'CHK-02',
    titulo: 'Documentos obrigatórios',
    descricao: 'Documentação mínima para autuação do processo',
    valorModelo: 'Matrícula, ART/RRT, projeto, certidão negativa',
    status: 'confirmado_contexto',
    valorRespondido: 'Matrícula do imóvel, ART/RRT, projeto arquitetônico e certidão negativa de débitos.',
    evidencia: 'Regulamentado conforme art. 31 do Código de Obras modelo.',
    docReferencia: 'DOC-03'
  },
  {
    id: 'CHK-03',
    titulo: 'Etapas do processo',
    descricao: 'Fluxo sequencial das fases de análise administrativa',
    valorModelo: 'Análise técnica, fiscal, emissão',
    status: 'confirmado_contexto',
    valorRespondido: 'Análise técnica, fiscal e emissão do alvará',
    evidencia: 'Fluxograma padrão validado na etapa de alinhamento.',
    docReferencia: 'DOC-05'
  },
  {
    id: 'CHK-04',
    titulo: 'Autoridade emissora / assinatura',
    descricao: 'Cargo público competente para assinar a certidão/alvará',
    valorModelo: 'Diretor de Planejamento',
    status: 'confirmado_contexto',
    valorRespondido: 'Diretor de Planejamento Urbano',
    evidencia: 'Portaria municipal vigente de delegação de competência.',
    docReferencia: 'DOC-01'
  },
  {
    id: 'CHK-05',
    titulo: 'Taxa de ocupação máxima na ZR2',
    descricao: 'Percentual máximo da área do lote passível de projeção horizontal',
    valorModelo: '58%',
    status: 'pendente',
    docReferencia: 'DOC-01'
  },
  {
    id: 'CHK-06',
    titulo: 'Coeficiente de aproveitamento na ZR2',
    descricao: 'Relação máxima entre a área construída e a área total do lote',
    valorModelo: '1,35',
    status: 'pendente',
    docReferencia: 'DOC-01'
  },
  {
    id: 'CHK-07',
    titulo: 'Recuo frontal mínimo na ZR2',
    descricao: 'Distância mínima entre a edificação e o alinhamento da via pública',
    valorModelo: '4,50 m',
    status: 'pendente',
    docReferencia: 'DOC-02'
  },
  {
    id: 'CHK-08',
    titulo: 'Taxa do alvará residencial',
    descricao: 'Valor unitário ou fórmula de cálculo do tributo municipal',
    valorModelo: 'R$ 3,85 por m²',
    status: 'pendente',
    docReferencia: 'DOC-04'
  },
  {
    id: 'CHK-09',
    titulo: 'Prazo de análise técnica',
    descricao: 'Prazo legal em dias úteis para emissão do parecer inicial',
    valorModelo: '20 dias úteis',
    status: 'pendente',
    docReferencia: 'DOC-05'
  },
  {
    id: 'CHK-10',
    titulo: 'Parecer em área de preservação',
    descricao: 'Exigência de manifestação de órgão ambiental local',
    valorModelo: 'Modelo não prevê',
    status: 'pendente'
  }
];
