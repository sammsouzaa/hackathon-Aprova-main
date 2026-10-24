import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Rule, PendingQuestion, MissingDoc, DiffItem } from '../types';

interface PendingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: Rule[];
  questions: PendingQuestion[];
  missingDocs: MissingDoc[];
  diffItems: DiffItem[];
}

export const PendingReportModal: React.FC<PendingReportModalProps> = ({
  isOpen,
  onClose,
  rules,
  questions,
  missingDocs,
  diffItems,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const unansweredQuestions = questions.filter(q => !q.answered);
  const pendingDocs = missingDocs.filter(d => !d.collected);

  const reportText = `=====================================================
RELATÓRIO DE PARAMETRIZAÇÃO E PENDÊNCIAS MUNICIPAIS
Instituto Federal do Paraná (IFPR) – Campus Cascavel - Coordenação de Laboratórios
Projeto: Implantação MeuLab
Produto: MeuLab
Status: ${Math.round((rules.length / (rules.length + unansweredQuestions.length)) * 100)}% das regras validadas
=====================================================

1. DÚVIDAS PENDENTES PARA PAUTA DE REUNIÃO (${unansweredQuestions.length}):
${unansweredQuestions.map((q, i) => `  ${i + 1}. [${q.targetRole}] ${q.question}
     Contexto: ${q.aiContext}
     Opções Propostas:
     ${q.options.map(opt => `     - ${opt}`).join('\n')}`).join('\n\n')}

2. DOCUMENTOS E INSUMOS BLOQUEANTES (${pendingDocs.length}):
${pendingDocs.map((d, i) => `  - [ ] ${d.title} (${d.deadlineText})`).join('\n')}

3. REGRAS JÁ VALIDAS E CONVERTIDAS (${rules.length}):
${rules.map((r, i) => `  - ${r.title}: ${r.definition}`).join('\n')}

4. ALTERAÇÕES ESTRUTURAIS GERADAS NO FORM BUILDER:
${diffItems.map(d => `  - [${d.action.toUpperCase()}] ${d.label} -> ${d.details}`).join('\n')}
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white border border-[#cacccc] rounded-2xl shadow-xl flex flex-col overflow-hidden text-[#1c1c1c]">
        {/* Modal Header (ADS Style) */}
        <div className="px-6 py-4 border-b border-[#dee0e0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e0f6f7] text-[#0d787e] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1c1c1c]">
                Relatório Oficial de Pendências & Parametrização
              </h3>
              <p className="text-[11px] text-[#656666]">
                Pauta consolidada para a reunião de alinhamento com o IFPR Cascavel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#656666] hover:text-[#1c1c1c] hover:bg-[#f5f7f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Report Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#1c1c1c] scrollbar-thin">
          {/* Executive Summary Cards in ADS Style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#f5f7f7] border border-[#cacccc]">
              <span className="text-[11px] text-[#656666] font-semibold uppercase">Progresso Atual</span>
              <div className="text-lg font-bold text-[#055b40] mt-1">
                {Math.round((rules.length / (rules.length + unansweredQuestions.length)) * 100)}% Concluído
              </div>
              <div className="text-[11px] text-[#656666] mt-0.5">{rules.length} regras validadas</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f7f7] border border-[#cacccc]">
              <span className="text-[11px] text-[#656666] font-semibold uppercase">Dúvidas em Aberto</span>
              <div className="text-lg font-bold text-[#ea580c] mt-1">
                {unansweredQuestions.length} questões
              </div>
              <div className="text-[11px] text-[#656666] mt-0.5">Pauta prioritária para a reunião</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f7f7] border border-[#cacccc]">
              <span className="text-[11px] text-[#656666] font-semibold uppercase">Insumos Bloqueantes</span>
              <div className="text-lg font-bold text-[#ba1515] mt-1">
                {pendingDocs.length} documentos
              </div>
              <div className="text-[11px] text-[#656666] mt-0.5">Decretos e tabelas de taxas</div>
            </div>
          </div>

          {/* Formatted Report Block */}
          <div className="p-5 rounded-2xl bg-white border border-[#cacccc] leading-relaxed space-y-4">
            <div>
              <div className="text-[#ea580c] font-bold mb-2 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>1. DÚVIDAS PRIORITÁRIAS PARA DELIBERAÇÃO</span>
              </div>
              <div className="space-y-3 pl-3 border-l-2 border-[#ea580c]">
                {unansweredQuestions.map((q, idx) => (
                  <div key={q.id}>
                    <div className="font-semibold text-[#1c1c1c]">
                      1.{idx + 1} [{q.targetRole}] {q.question}
                    </div>
                    <div className="text-[11px] text-[#656666] mt-0.5">
                      Contexto: {q.aiContext}
                    </div>
                    <div className="text-[11px] text-[#1c1c1c] mt-1 space-y-0.5">
                      {q.options.map((opt, i) => (
                        <div key={i} className="text-[#656666]">
                          ( ) {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[#ba1515] font-bold mb-2 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>2. DOCUMENTOS E DECRETOS A COBRAR</span>
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-[#ba1515]">
                {pendingDocs.map((d) => (
                  <div key={d.id} className="text-[#1c1c1c]">
                    [ ] {d.title} — <span className="text-[#ba1515] font-medium">{d.deadlineText}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[#055b40] font-bold mb-2 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. REGRAS JÁ EXTRAÍDAS E VALIDADAS</span>
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-[#19bf8b]">
                {rules.map((r) => (
                  <div key={r.id} className="text-[#1c1c1c]">
                    • <strong>{r.title}</strong>: {r.definition}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (ADS Style) */}
        <div className="px-6 py-4 border-t border-[#dee0e0] bg-[#f5f7f7] flex items-center justify-between">
          <span className="text-[11px] text-[#656666]">
            Protótipo demonstrativo · dados fictícios
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#f5f7f7] text-[#1c1c1c] text-xs font-medium flex items-center gap-1.5 border border-[#868787] transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#00dae7]" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Pauta Formatada</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
