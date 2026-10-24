import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Send, 
  Volume2, 
  BookOpen, 
  Check, 
  Search, 
  ExternalLink,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Rule, PendingQuestion, MissingDoc } from '../../types';

interface ContextMatrixViewProps {
  rules: Rule[];
  questions: PendingQuestion[];
  missingDocs: MissingDoc[];
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  onCopyQuestionToChat: (questionText: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
  onToggleMissingDoc: (docId: string) => void;
  onCobrarDoc: (docTitle: string) => void;
  onOpenFileModal: (fileName: string) => void;
  onSendToAgentDiff: (rule: Rule) => void;
}

export const ContextMatrixView: React.FC<ContextMatrixViewProps> = ({
  rules,
  questions,
  missingDocs,
  selectedRuleId,
  onSelectRule,
  onCopyQuestionToChat,
  onAnswerQuestion,
  onToggleMissingDoc,
  onCobrarDoc,
  onOpenFileModal,
}) => {
  // Por padrão 'all' ou 'duvidas'
  const [filterBlock, setFilterBlock] = useState<'all' | 'duvidas' | 'insumos' | 'regras'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [customAnswerText, setCustomAnswerText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingQuestions = questions.filter(q => !q.answered);
  const pendingDocs = missingDocs.filter(d => !d.collected);

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

  const handleSelectOption = (questionId: string, option: string) => {
    onAnswerQuestion(questionId, option);
    setAnsweringQuestionId(null);
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f7f7] text-[#1c1c1c] overflow-hidden">
      {/* 1. Cabeçalho Oficial (Hierarquia ADS: Título, Contexto do cliente e Filtros Prioritários) */}
      <header className="border-b border-[#dee0e0] px-8 py-4 bg-white flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#656666] mb-0.5">
            <span>IFPR Cascavel · Laboratórios de Ensino</span>
            <span className="text-[#cacccc]">/</span>
            <span>Implantação MeuLab</span>
          </div>
          <h1 className="text-lg font-bold text-[#1c1c1c] tracking-tight">
            Matriz de Regras & Alinhamento Técnico
          </h1>
        </div>

        {/* Filtros em Ordem de Prioridade: Dúvidas -> Insumos -> Regras */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#f5f7f7] border border-[#dee0e0] text-xs">
          <button
            onClick={() => setFilterBlock('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              filterBlock === 'all' ? 'bg-white text-[#1c1c1c] shadow-xs font-semibold' : 'text-[#656666] hover:text-[#1c1c1c]'
            }`}
          >
            Visão Geral ({pendingQuestions.length + pendingDocs.length + rules.length})
          </button>

          {/* 1º MAIS IMPORTANTE: DÚVIDAS PENDENTES */}
          <button
            onClick={() => setFilterBlock('duvidas')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              filterBlock === 'duvidas' ? 'bg-[#ffefe7] text-[#702600] border border-[#ea580c]/30 font-semibold' : 'text-[#656666] hover:text-[#1c1c1c]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
            <span>Dúvidas para Deliberação</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#ffd2bb] text-[#702600] text-[10px] font-bold">
              {pendingQuestions.length}
            </span>
          </button>

          {/* 2º MAIS IMPORTANTE: INSUMOS A COBRAR */}
          <button
            onClick={() => setFilterBlock('insumos')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              filterBlock === 'insumos' ? 'bg-[#ffebeb] text-[#ba1515] border border-[#dc2626]/30 font-semibold' : 'text-[#656666] hover:text-[#1c1c1c]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
            <span>Insumos a Cobrar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#ffbfbf] text-[#ba1515] text-[10px] font-bold">
              {pendingDocs.length}
            </span>
          </button>

          {/* 3º: REGRAS ESTABELECIDAS */}
          <button
            onClick={() => setFilterBlock('regras')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              filterBlock === 'regras' ? 'bg-[#eefff9] text-[#055b40] border border-[#19bf8b]/40 font-semibold' : 'text-[#656666] hover:text-[#1c1c1c]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#19bf8b]" />
            <span>Regras Estabelecidas</span>
            <span className="text-[10px] text-[#055b40] font-semibold">
              ({rules.length})
            </span>
          </button>
        </div>
      </header>

      {/* 2. Conteúdo Principal Estruturado */}
      <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Campo de Busca Rápida na Matriz */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#868787]" />
            <input
              type="text"
              placeholder="Pesquisar por assunto, categoria ou regra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs bg-white border border-[#c4cbd1] rounded-lg text-[#1c1c1c] placeholder-[#868787] focus:outline-none focus:border-[#0d787e] transition-colors"
            />
          </div>

          {/* =========================================================================
              SEÇÃO 1 (PRIORIDADE MÁXIMA): DÚVIDAS PENDENTES PARA DELIBERAÇÃO
              ========================================================================= */}
          {(filterBlock === 'all' || filterBlock === 'duvidas') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dee0e0] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#ea580c]" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#1c1c1c]">
                    Dúvidas Pendentes para Deliberação
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffefe7] text-[#702600] border border-[#ea580c]/30">
                    Prioridade da Reunião
                  </span>
                </div>
                <span className="text-xs text-[#656666] font-medium">
                  {pendingQuestions.length} questões aguardando resposta
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-xl border transition-all ${
                      q.answered
                        ? 'bg-[#f5f7f7] border-[#dee0e0] opacity-60'
                        : 'bg-white border-[#cacccc] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#ffefe7] text-[#702600] border border-[#ea580c]/30">
                          {q.targetRole}
                        </span>
                        <span className="text-xs text-[#656666]">
                          Origem: {q.sourceReference}
                        </span>
                      </div>
                      {q.answered && (
                        <span className="text-xs font-semibold text-[#055b40] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-[#19bf8b]" />
                          Deliberado
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#1c1c1c] mb-2 leading-snug">
                      {q.question}
                    </h3>

                    {/* Contexto Técnico de Apoio */}
                    <div className="text-xs text-[#074a4e] leading-relaxed mb-4 bg-[#e6f5f8] p-3.5 rounded-lg border border-[#0891b2]/30">
                      <strong className="text-[#0e7490]">Contexto técnico:</strong> {q.aiContext}
                    </div>

                    {/* Opções de Deliberação */}
                    <div className="space-y-2 mb-4">
                      <div className="text-[11px] uppercase font-semibold text-[#656666]">
                        Valor indicado pelo material:
                      </div>
                      {q.options.map((opt, idx) => {
                        const isChosen = q.selectedOption === opt;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`w-full text-left text-xs p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                              isChosen
                                ? 'bg-[#eefff9] border-[#19bf8b] text-[#055b40] font-semibold'
                                : 'bg-white hover:bg-[#f6fbfb] border-[#dee0e0] text-[#1c1c1c]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                                isChosen ? 'border-[#19bf8b] bg-[#19bf8b] text-white' : 'border-[#cacccc]'
                              }`}>
                                {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <span className="text-[11px] text-[#656666] font-medium">
                              {isChosen ? 'Opção Escolhida' : 'Homologar Esta Opção'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#dee0e0]">
                      <button
                        onClick={() => handleCopyQuestion(q.id, q.question)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1c1c1c] hover:bg-[#f5f7f7] px-3 py-1.5 rounded-lg border border-[#868787] transition-colors cursor-pointer"
                      >
                        {copiedId === q.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#055b40]" />
                            <span className="text-[#055b40] font-semibold">Copiado para o Chat!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#656666]" />
                            <span>Perguntar à IA de Contexto</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setAnsweringQuestionId(answeringQuestionId === q.id ? null : q.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d787e] hover:text-[#074a4e] bg-[#e0f6f7] px-3.5 py-1.5 rounded-lg border border-[#14bac4]/40 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{q.answered ? 'Editar Decisão' : 'Registrar Resposta em Ata'}</span>
                      </button>
                    </div>

                    {/* Campo de resposta manual */}
                    {answeringQuestionId === q.id && (
                      <div className="mt-3.5 pt-3.5 border-t border-[#dee0e0] space-y-2.5">
                        <textarea
                          placeholder="Descreva a resposta confirmada pelo cliente..."
                          value={customAnswerText}
                          onChange={(e) => setCustomAnswerText(e.target.value)}
                          className="w-full h-20 p-3 text-xs bg-white border border-[#c4cbd1] rounded-lg text-[#1c1c1c] placeholder-[#868787] focus:outline-none focus:border-[#0d787e]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setAnsweringQuestionId(null)}
                            className="px-3 py-1.5 text-xs text-[#656666] hover:text-[#1c1c1c] cursor-pointer"
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
                            className="px-4 py-1.5 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold cursor-pointer"
                          >
                            Gravar Decisão
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              SEÇÃO 2 (SEGUNDA PRIORIDADE): INSUMOS E DOCUMENTOS A COBRAR
              ========================================================================= */}
          {(filterBlock === 'all' || filterBlock === 'insumos') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dee0e0] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#1c1c1c]">
                    Insumos e Documentos a Cobrar
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffebeb] text-[#ba1515] border border-[#dc2626]/30">
                    Bloqueios de Implantação
                  </span>
                </div>
                <span className="text-xs text-[#656666] font-medium">
                  {pendingDocs.length} itens pendentes de envio
                </span>
              </div>

              <div className="space-y-3">
                {missingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      doc.collected
                        ? 'bg-[#f5f7f7] border-[#dee0e0] opacity-60 text-[#656666]'
                        : 'bg-white border-[#cacccc] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={doc.collected}
                        onChange={() => onToggleMissingDoc(doc.id)}
                        className="w-4 h-4 rounded border-[#cacccc] text-[#0d787e] focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold ${doc.collected ? 'line-through text-[#656666]' : 'text-[#1c1c1c]'}`}>
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-[#656666] mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#ea580c]" />
                          <span>Prazo crítico: {doc.deadlineText}</span>
                        </div>
                      </div>
                    </div>

                    {!doc.collected && (
                      <button
                        onClick={() => onCobrarDoc(doc.title)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffebeb] hover:bg-[#ffbfbf] border border-[#dc2626]/30 text-[#ba1515] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Solicitar Envio</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              SEÇÃO 3: REGRAS ESTABELECIDAS & HOMOLOGADAS
              ========================================================================= */}
          {(filterBlock === 'all' || filterBlock === 'regras') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dee0e0] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#19bf8b]" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#1c1c1c]">
                    Regras Estabelecidas & Homologadas
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eefff9] text-[#055b40] border border-[#19bf8b]/30">
                    Consolidado
                  </span>
                </div>
                <span className="text-xs text-[#656666] font-medium">
                  {rules.length} regras ativas no processo
                </span>
              </div>

              <div className="space-y-3.5">
                {filteredRules.map((rule) => {
                  const isSelected = selectedRuleId === rule.id;

                  return (
                    <div
                      key={rule.id}
                      onClick={() => onSelectRule(rule.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#e0f6f7] border-[#0d787e]'
                          : 'bg-white hover:bg-[#f6fbfb] border-[#cacccc]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0d787e] shrink-0" />
                          <h3 className="text-xs font-bold text-[#1c1c1c]">
                            {rule.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#f5f7f7] text-[#656666] border border-[#dee0e0]">
                          {rule.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#404141] leading-relaxed pl-6 mb-3">
                        {rule.definition}
                      </p>

                      <div className="pl-6 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#dee0e0]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#868787] uppercase">
                            Fundamentação Legal:
                          </span>
                          {rule.sources.map((src) => (
                            <button
                              key={src.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenFileModal(src.label);
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded bg-[#f5f7f7] hover:bg-[#dee0e0] text-[#1c1c1c] border border-[#dee0e0] transition-colors cursor-pointer"
                            >
                              {src.type === 'audio' && <Volume2 className="w-3 h-3 text-[#0d787e]" />}
                              {src.type === 'decree' && <BookOpen className="w-3 h-3 text-[#ea580c]" />}
                              {src.type === 'pdf' && <FileCheck className="w-3 h-3 text-[#ba1515]" />}
                              <span>{src.label}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-[#868787]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};
