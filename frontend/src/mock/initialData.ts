// Dados de tela que ainda não vêm do backend. Documentos, regras e dúvidas vêm da API (src/api.ts).
import { MissingDoc, ChatMessage, AgentMessage, DiffItem } from '../types';

export const INITIAL_MISSING_DOCS: MissingDoc[] = [
  {
    id: 'doc-1',
    title: 'Planilha de tempos de preparo por tipo de prática',
    deadlineText: 'Marcos ficou de cronometrar antes da reunião de alinhamento',
    isBlocker: true,
    collected: false,
    reminderSent: false,
    category: 'Almoxarifado'
  },
  {
    id: 'doc-2',
    title: 'Lista de equipamentos e horários bloqueados para TCC',
    deadlineText: 'Necessária para configurar as regras de bloqueio da agenda',
    isBlocker: true,
    collected: false,
    reminderSent: true,
    category: 'Coordenação'
  },
  {
    id: 'doc-3',
    title: 'Contrato da empresa de coleta de resíduos',
    deadlineText: 'Define categorias aceitas e periodicidade da coleta',
    isBlocker: false,
    collected: false,
    reminderSent: false,
    category: 'Resíduos'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'IA de Contexto · MeuLab',
    role: 'Assistente de implantação',
    timestamp: '09:00',
    text: 'Li os 4 documentos do contexto do IFPR Cascavel (proposta, ata do kickoff, inventário e e-mail do almoxarifado). Pergunte o que quiser sobre o cliente: respondo só com o que está no material e aviso o que ainda está pendente.',
    aiProcessed: true
  }
];

export const INITIAL_DIFF_ITEMS: DiffItem[] = [
  {
    id: 'diff-1',
    action: 'removed',
    label: 'Laboratório de Anatomia',
    details: 'Sem uso de reagentes de bancada; entrada na Fase 1 ainda não confirmada',
    fieldName: 'laboratorios.anatomia',
    category: 'Escopo',
    rawJsonBefore: '"anatomia": { "ativo": true, "fase": 1 }',
    rawJsonAfter: '// Removido da Fase 1'
  },
  {
    id: 'diff-2',
    action: 'added',
    label: 'Bloqueio da capela de exaustão',
    details: 'Equipamento crítico: intervalo mínimo entre práticas e controle de uso simultâneo',
    fieldName: 'equipamentos.capela_exaustao',
    category: 'Regras da agenda',
    rawJsonBefore: '// Inexistente na configuração padrão',
    rawJsonAfter: '{\n  "id": "EQP-021",\n  "critico": true,\n  "intervalo_minimo_min": 60,\n  "uso_simultaneo_max": 1\n}'
  },
  {
    id: 'diff-3',
    action: 'modified',
    label: 'Antecedência mínima da reserva',
    details: 'Padrão MeuLab de 24 h ajustado para a proposta do IFPR Cascavel (pendente de confirmação)',
    fieldName: 'agenda.antecedencia_horas',
    category: 'Regras da agenda',
    rawJsonBefore: '"antecedencia_horas": 24',
    rawJsonAfter: '"antecedencia_horas": 72'
  }
];

export const INITIAL_AGENT_MESSAGES: AgentMessage[] = [
  {
    id: 'agent-msg-1',
    role: 'user',
    timestamp: '09:05',
    text: 'Agente, aplique as regras do kickoff do IFPR Cascavel na configuração padrão do MeuLab.'
  },
  {
    id: 'agent-msg-2',
    role: 'agent',
    timestamp: '09:06',
    text: 'Cruzei a ata do kickoff e o e-mail do almoxarifado com a configuração padrão do MeuLab. Encontrei 3 divergências. Abaixo está o changeset pronto para aplicação:',
    diffItems: INITIAL_DIFF_ITEMS,
    diffApplied: false,
    diffId: 'CS-8924'
  }
];

// Conversa direta com a equipe do cliente (sem IA).
export const INITIAL_CLIENT_MESSAGES: ChatMessage[] = [
  {
    id: 'cli-1',
    sender: 'Profa. Helena Duarte',
    role: 'Coordenação dos Laboratórios',
    timestamp: '08:12',
    text: 'Bom dia, Gabriel! Confirmado o alinhamento de hoje às 10h. Vou levar o Marcos e o Prof. Rafael.'
  },
  {
    id: 'cli-2',
    sender: 'Marcos Vieira',
    role: 'Almoxarifado de Química',
    timestamp: '08:20',
    text: 'Cronometrei algumas práticas essa semana, levo os números na reunião.'
  },
  {
    id: 'cli-3',
    sender: 'Gabriel (Implantador MeuLab)',
    role: 'Implantador',
    timestamp: '08:25',
    text: 'Perfeito, obrigado! Até às 10h.',
    isOutgoing: true
  }
];
