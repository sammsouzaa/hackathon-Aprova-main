import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Clock, 
  Sparkles, 
  FileText, 
  FolderGit2, 
  Calendar, 
  Copy, 
  Send, 
  HelpCircle, 
  Volume2, 
  BookOpen, 
  Check, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  UploadCloud
} from 'lucide-react';
import { Rule, PendingQuestion, MissingDoc, RawFile, TimelineMilestone } from '../types';

interface ContextHubProps {
  rules: Rule[];
  questions: PendingQuestion[];
  missingDocs: MissingDoc[];
  rawFiles: RawFile[];
  milestones: TimelineMilestone[];
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  onCopyQuestionToChat: (questionText: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
  onToggleMissingDoc: (docId: string) => void;
  onCobrarDoc: (docTitle: string) => void;
  onOpenFileModal: (fileName: string) => void;
  onSendToAgentDiff: (rule: Rule) => void;
}

export const ContextHub: React.FC<ContextHubProps> = ({
  rules,
  questions,
  missingDocs,
  rawFiles,
  milestones,
  selectedRuleId,
  onSelectRule,
  onCopyQuestionToChat,
  onAnswerQuestion,
  onToggleMissingDoc,
  onCobrarDoc,
  onOpenFileModal,
  onSendToAgentDiff,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'repo' | 'timeline'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [customAnswerText, setCustomAnswerText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter rules by query
  const filteredRules = rules.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyQuestion = (id: string, text: string) => {
    onCopyQuestionToChat(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectPredefinedOption = (questionId: string, option: string) => {
    onAnswerQuestion(questionId, option);
    setAnsweringQuestionId(null);
  };

  return (
    <section className="h-full flex flex-col bg-zinc-950 dark:bg-zinc-950 light:bg-white border-r border-zinc-800 dark:border-zinc-800 light:border-slate-200 overflow-hidden">
      {/* Internal Navigation Header */}
      <div className="h-12 border-b border-zinc-800 px-3.5 flex items-center justify-between shrink-0 bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-slate-50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Matriz de Regras & Perguntas</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
          </button>

          <button
            onClick={() => setActiveTab('repo')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'repo'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Repositório Bruto</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800/80 text-zinc-400">
              {rawFiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Cronograma & Prazos</span>
          </button>
        </div>

        {/* Quick Hub Badge */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>IA de Contexto Ativa</span>
        </div>
      </div>

      {/* Tab 1: Matriz de Regras & Perguntas (Canvas/Notion Style) */}
      {activeTab === 'matrix' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* Top Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar por artigo, metragem, imposto ou palavra-chave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-emerald-400 font-semibold">{rules.length}</span> regras
              <span>•</span>
              <span className="text-amber-400 font-semibold">{questions.filter(q => !q.answered).length}</span> dúvidas
            </div>
          </div>

          {/* ======================================================== */}
          {/* BLOCO A: Perguntas Respondidas & Regras Validadas (Cards Verdes) */}
          {/* ======================================================== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Bloco A: Regras Validadas & Perguntas Respondidas
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {rules.length} itens prontos
              </span>
            </div>

            <div className="space-y-3">
              {filteredRules.map((rule) => {
                const isSelected = selectedRuleId === rule.id;

                return (
                  <div
                    key={rule.id}
                    onClick={() => onSelectRule(rule.id)}
                    className={`rounded-lg p-3.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                        : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Header of Rule Card */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <h4 className="text-xs font-semibold text-zinc-100">
                          {rule.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {rule.category}
                        </span>
                        {rule.appliedToForm ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            Aplicado no Form
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Pronto para aplicação
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Definition */}
                    <p className="text-xs text-zinc-300 leading-relaxed pl-6 mb-2.5">
                      {rule.definition}
                    </p>

                    {/* Extraction Source Chips (Clickable) */}
                    <div className="pl-6 flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">
                        Fontes de Extração:
                      </span>
                      {rule.sources.map((src) => (
                        <button
                          key={src.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFileModal(src.label);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                          title={src.detail}
                        >
                          {src.type === 'audio' && <Volume2 className="w-3 h-3 text-emerald-400" />}
                          {src.type === 'decree' && <BookOpen className="w-3 h-3 text-amber-400" />}
                          {src.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                          {src.type === 'chat' && <Sparkles className="w-3 h-3 text-sky-400" />}
                          <span>{src.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </button>
                      ))}

                      {/* Action to dispatch to Agent */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToAgentDiff(rule);
                        }}
                        className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-colors"
                      >
                        <span>Vincular ao Diff</span>
                        <ChevronRight className="w-3 h-3 text-indigo-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/* BLOCO B: Dúvidas Pendentes / Perguntas a Realizar (Cards Amarelos) */}
          {/* ======================================================== */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Bloco B: Dúvidas Pendentes & Perguntas a Realizar
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Pauta para Reunião de Alinhamento
              </span>
            </div>

            <div className="space-y-3">
              {questions.map((q) => {
                const isAnswering = answeringQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className={`rounded-lg p-3.5 border transition-all ${
                      q.answered
                        ? 'bg-zinc-900/40 border-zinc-800 opacity-70'
                        : 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    {/* Header & Urgency */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {q.targetRole}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {q.sourceReference}
                      </span>
                    </div>

                    {/* Question text generated by AI */}
                    <h4 className="text-xs font-semibold text-zinc-100 mb-1.5 leading-snug">
                      {q.question}
                    </h4>

                    {/* AI Contextual reason */}
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3 bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                      <strong className="text-zinc-300 font-medium">Contexto da IA:</strong> {q.aiContext}
                    </p>

                    {/* Pre-mapped selectable options for meeting */}
                    <div className="space-y-1.5 mb-3">
                      <div className="text-[10px] uppercase font-mono text-zinc-400">
                        Opções pré-mapeadas para marcar na reunião:
                      </div>
                      {q.options.map((opt, idx) => {
                        const isChosen = q.selectedOption === opt;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectPredefinedOption(q.id, opt)}
                            className={`w-full text-left text-xs p-2 rounded border transition-all flex items-center justify-between ${
                              isChosen
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                                isChosen ? 'border-emerald-400 bg-emerald-500 text-zinc-950' : 'border-zinc-600'
                              }`}>
                                {isChosen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">
                              Clique para validar
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handleCopyQuestion(q.id, q.question)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded border border-zinc-700 transition-colors"
                      >
                        {copiedId === q.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado para Chat!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Copiar Pergunta para o Chat</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setAnsweringQuestionId(isAnswering ? null : q.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{q.answered ? 'Editar Resposta' : 'Marcar como Respondido'}</span>
                      </button>
                    </div>

                    {/* Expanded answer input */}
                    {isAnswering && (
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                        <textarea
                          placeholder="Descreva a deliberação oficial com o fiscal / procurador..."
                          value={customAnswerText}
                          onChange={(e) => setCustomAnswerText(e.target.value)}
                          className="w-full h-16 p-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setAnsweringQuestionId(null)}
                            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              if (customAnswerText.trim()) {
                                onAnswerQuestion(q.id, customAnswerText.trim());
                                setCustomAnswerText('');
                                setAnsweringQuestionId(null);
                              }
                            }}
                            disabled={!customAnswerText.trim()}
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-xs font-semibold"
                          >
                            Validar Regra
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/* BLOCO C: Documentos e Dados a Cobrar (Checklist de Bloqueios) */}
          {/* ======================================================== */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Bloco C: Documentos e Dados a Cobrar (Checklist de Bloqueios)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-rose-400/90 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {missingDocs.filter(d => !d.collected).length} itens pendentes
              </span>
            </div>

            <div className="space-y-2">
              {missingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    doc.collected
                      ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400 line-through'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <input
                      type="checkbox"
                      checked={doc.collected}
                      onChange={() => onToggleMissingDoc(doc.id)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-200">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{doc.deadlineText}</span>
                      </div>
                    </div>
                  </div>

                  {!doc.collected && (
                    <button
                      onClick={() => onCobrarDoc(doc.title)}
                      className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors shadow-sm"
                    >
                      <Send className="w-3 h-3 text-rose-400" />
                      <span>Cobrar no WhatsApp</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Repositório Bruto (8 arquivos) */}
      {activeTab === 'repo' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">Central de Evidências Brutas</h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                8 arquivos ingeridos pelo pipeline de OCR, Whisper e NLP municipal
              </p>
            </div>
            <button
              onClick={() => onOpenFileModal('Upload Modal')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ingerir Novo Documento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {rawFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onOpenFileModal(file.name)}
                className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded bg-zinc-800 group-hover:bg-zinc-750 flex items-center justify-center shrink-0 border border-zinc-700">
                    {file.type === 'audio' && <Volume2 className="w-4 h-4 text-emerald-400" />}
                    {file.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                    {file.type === 'image' && <BookOpen className="w-4 h-4 text-sky-400" />}
                    {file.type === 'doc' && <FileCheck className="w-4 h-4 text-amber-400" />}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.uploadDate}</span>
                      <span>•</span>
                      <span className="text-zinc-400 truncate">{file.description}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {file.rulesExtracted} regras
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cronograma & Prazos */}
      {activeTab === 'timeline' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div className="pb-2 border-b border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-200">Esteira Contratual de Implantação</h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Prefeitura Municipal de Cascavel / Meta de Entrega: 45 dias corridos
            </p>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-lg border ${
                  m.status === 'completed'
                    ? 'bg-zinc-900/60 border-zinc-800'
                    : m.status === 'in_progress'
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-950 border-zinc-850 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {m.phase}
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-200">{m.title}</h4>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">{m.targetDate}</span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        m.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500 animate-pulse'
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-300">{m.progress}%</span>
                </div>

                {m.blockersCount > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{m.blockersCount} bloqueios aguardando retorno municipal</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
