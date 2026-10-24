export interface SourceChip {
  id: string;
  label: string;
  type: 'audio' | 'pdf' | 'decree' | 'chat';
  detail: string;
  timestamp?: string;
}

export interface Rule {
  id: string;
  title: string;
  definition: string;
  sources: SourceChip[];
  status: 'validated' | 'applied' | 'pending';
  category: string;
  dateValidated: string;
  impactScore?: 'Alto' | 'Médio' | 'Baixo';
  appliedToForm?: boolean;
}

export interface PendingQuestion {
  id: string;
  question: string;
  aiContext: string;
  options: string[];
  selectedOption?: string;
  customAnswer?: string;
  answered: boolean;
  urgency: 'high' | 'medium' | 'low';
  targetRole: string; // e.g., 'Fiscal Chefe', 'Procuradoria Jurídica', 'Secretário'
  sourceReference?: string;
}

export interface MissingDoc {
  id: string;
  title: string;
  deadlineText: string;
  isBlocker: boolean;
  collected: boolean;
  reminderSent: boolean;
  category: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  timestamp: string;
  text?: string;
  isAudio?: boolean;
  audioDuration?: string;
  audioTranscript?: string;
  isFile?: boolean;
  fileName?: string;
  fileType?: string;
  aiProcessed?: boolean;
  isOutgoing?: boolean;
  highlightedRuleId?: string;
}

export interface DiffItem {
  id: string;
  action: 'removed' | 'added' | 'modified';
  label: string;
  details: string;
  fieldName: string;
  category: string;
  rawJsonBefore?: string;
  rawJsonAfter?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  timestamp: string;
  text: string;
  diffItems?: DiffItem[];
  diffApplied?: boolean;
  diffId?: string;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface RawFile {
  id: string;
  name: string;
  type: 'audio' | 'pdf' | 'image' | 'doc';
  size: string;
  uploadDate: string;
  status: 'processed' | 'analyzing' | 'flagged';
  rulesExtracted: number;
  description: string;
  folderId: string;
  apiName?: string; // nome do arquivo no backend (quando veio da API)
  extractedSnippet?: string;
}

export interface TimelineMilestone {
  id: string;
  phase: string;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  targetDate: string;
  progress: number;
  blockersCount: number;
}
