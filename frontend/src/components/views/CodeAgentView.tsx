import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Check, 
  X,
  Layers,
  Sparkles,
  FileCheck2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { AgentMessage, DiffItem } from '../../types';

interface CodeAgentViewProps {
  messages: AgentMessage[];
  onSendCommand: (cmd: string) => void;
  onApplyDiff: (diffId: string) => void;
  onRevertDiff: (diffId: string) => void;
  onOpenJsonEditor: (diff: DiffItem[]) => void;
}

export const CodeAgentView: React.FC<CodeAgentViewProps> = ({
  messages,
  onSendCommand,
  onApplyDiff,
  onRevertDiff,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onSendCommand(commandInput.trim());
    setCommandInput('');
  };

  const handleApply = (diffId: string) => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      onApplyDiff(diffId);
    }, 700);
  };

  const quickChips = [
    'Aplicar regras validadas com o IFPR Cascavel',
    'Conferir diferenças de prazos contra o modelo base',
    'Configurar bloqueio do espectrofotômetro em horários de TCC'
  ];

  return (
    <div className="h-full flex flex-col bg-[#f5f7f7] text-[#1c1c1c] overflow-hidden">
      {/* 1. Cabeçalho Institucional de Parametrização (Padrão Aprova ADS) */}
      <header className="h-16 border-b border-[#dee0e0] px-8 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#e0f6f7] text-[#0d787e] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1c1c1c]">
                Parametrização & Modelagem de Processos
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f5f8] text-[#0891b2] border border-[#0891b2]/30">
                Assistente de Implantação
              </span>
            </div>
            <p className="text-xs text-[#656666]">
              A IA estrutura as regras do cliente · Nada entra no sistema sem a sua aprovação formal
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-[#656666]">
          <span className="font-semibold text-[#1c1c1c]">IFPR Cascavel</span> · Configuração MeuLab
        </div>
      </header>

      {/* 2. Área de Interações e Propostas de Parametrização */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className="space-y-2">
                {/* Cabeçalho do Remetente */}
                <div className={`flex items-center gap-2 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <>
                      <span className="text-[11px] text-[#868787]">{msg.timestamp}</span>
                      <span className="font-semibold text-[#1c1c1c]">Gabriel (Implantador MeuLab)</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-[#e6f5f8] border border-[#0891b2]/40 flex items-center justify-center text-[#0891b2]">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-[#074a4e]">
                        Assistente de Parametrização
                      </span>
                      <span className="text-[11px] text-[#868787]">{msg.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Balão de Mensagem */}
                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#1c1c1c] text-white ml-12 rounded-tr-none shadow-xs'
                      : 'bg-white border border-[#cacccc] text-[#1c1c1c] mr-4 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Card de Proposta de Parametrização (Design Corporativo da Aprova) */}
                  {msg.diffItems && msg.diffItems.length > 0 && (
                    <div className="mt-4 bg-[#f5f7f7] border border-[#cacccc] rounded-xl overflow-hidden shadow-xs">
                      
                      {/* Topo do Card de Proposta */}
                      <div className="px-5 py-3.5 bg-white border-b border-[#dee0e0] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileCheck2 className="w-4 h-4 text-[#0d787e]" />
                          <div>
                            <div className="text-xs font-bold text-[#1c1c1c]">
                              Proposta de Parametrização para Homologação
                            </div>
                            <div className="text-[11px] text-[#656666]">
                              Fluxo: Reserva de laboratório · IFPR Cascavel
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e0f6f7] text-[#074a4e] border border-[#14bac4]/40 font-mono">
                          Revisão #{msg.diffId || 'REV-2026'}
                        </span>
                      </div>

                      {/* Faixa Oficial de Governança ADS ("Nada é gravado sem aprovação") */}
                      <div className="px-5 py-2.5 bg-[#e6f5f8] border-b border-[#0891b2]/20 flex items-center justify-between text-xs text-[#074a4e]">
                        <span className="font-semibold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#0891b2]" />
                          <span>Confirmação necessária: Revise as adequações legais antes de aplicar</span>
                        </span>
                      </div>

                      {/* Lista de Alterações no Formulário (Linguagem Institucional Limpa) */}
                      <div className="p-4 space-y-3">
                        {msg.diffItems.map((item) => {
                          const isRemoved = item.action === 'removed';
                          const isAdded = item.action === 'added';

                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-lg border text-xs ${
                                isRemoved
                                  ? 'bg-white border-[#dee0e0] text-[#656666]'
                                  : isAdded
                                  ? 'bg-[#eefff9] border-[#19bf8b]/40 text-[#055b40]'
                                  : 'bg-white border-[#cacccc] text-[#1c1c1c]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                                    isRemoved ? 'bg-[#f5f7f7] text-[#656666]' :
                                    isAdded ? 'bg-[#cffff0] text-[#055b40]' :
                                    'bg-[#e0f6f7] text-[#074a4e]'
                                  }`}>
                                    {isRemoved ? 'Regra Dispensada' : isAdded ? 'Novo Campo Obrigatório' : 'Parâmetro Atualizado'}
                                  </span>
                                  <span className="font-bold text-xs text-[#1c1c1c]">
                                    {item.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#868787]">
                                  {item.category || 'Urbanismo'}
                                </span>
                              </div>

                              <p className="text-xs text-[#404141] mt-1 leading-relaxed pl-1">
                                {item.details}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Rodapé com Ações Formais: Recusar / Homologar */}
                      <div className="px-5 py-3.5 bg-white border-t border-[#dee0e0] flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onRevertDiff(msg.diffId || 'REV-2026')}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#f5f7f7] text-[#ba1515] hover:text-[#760000] text-xs font-medium border border-[#cacccc] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Recusar Proposta</span>
                        </button>

                        {msg.diffApplied ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#eefff9] text-[#055b40] border border-[#19bf8b]/40 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-[#19bf8b]" />
                            <span>Parametrização Homologada no Sistema</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isApplying}
                            onClick={() => handleApply(msg.diffId || 'REV-2026')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isApplying ? (
                              <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                <span>Gravando no Formulário...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Homologar e Aplicar no Formulário</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Barra de Solicitação Limpa (Sem aparência de terminal de dev) */}
      <footer className="p-4 border-t border-[#dee0e0] bg-white shrink-0">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Sugestões Executivas */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#868787] uppercase">
              Sugestões Rápidas:
            </span>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendCommand(chip)}
                className="text-[11px] px-3 py-1 rounded-full bg-[#f5f7f7] hover:bg-[#dee0e0] text-[#404141] hover:text-[#1c1c1c] border border-[#dee0e0] transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Campo de Entrada de Instrução */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[#f5f7f7] border border-[#c4cbd1] rounded-xl p-1.5 focus-within:border-[#0d787e] focus-within:bg-white transition-colors">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Descreva a regra ou ajuste que deseja parametrizar no formulário..."
              className="flex-1 bg-transparent px-3 text-xs text-[#1c1c1c] placeholder-[#868787] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commandInput.trim()}
              className="px-3.5 py-2 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Processar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};
