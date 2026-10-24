import React, { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  Send, 
  GitCommit, 
  Check, 
  RotateCcw, 
  Code, 
  Sparkles, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  Clock, 
  FileEdit,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { AgentMessage, DiffItem } from '../types';

interface ConfigAgentProps {
  messages: AgentMessage[];
  onSendCommand: (cmd: string) => void;
  onApplyDiff: (diffId: string) => void;
  onRevertDiff: (diffId: string) => void;
  onOpenJsonEditor: (diff: DiffItem[]) => void;
}

export const ConfigAgent: React.FC<ConfigAgentProps> = ({
  messages,
  onSendCommand,
  onApplyDiff,
  onRevertDiff,
  onOpenJsonEditor,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [diffViewMode, setDiffViewMode] = useState<'visual' | 'json'>('visual');
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
    }, 900);
  };

  const quickChips = [
    'Aplicar todas as regras validadas',
    'Gerar relatório de diferenças contra a Cidade Modelo',
    'Adicionar condicional de corte de vegetação'
  ];

  return (
    <section className="h-full flex flex-col bg-zinc-950 dark:bg-zinc-950 light:bg-slate-50 overflow-hidden">
      {/* Column Header */}
      <div className="h-12 border-b border-zinc-800 px-3.5 flex items-center justify-between shrink-0 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>Agente Construtor de Processos</span>
            </h2>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Conectado ao Form Builder API</span>
          <span className="text-emerald-500/60 hidden sm:inline">(24ms)</span>
        </div>
      </div>

      {/* Chat Area & Execution Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div key={msg.id} className="space-y-2.5">
              {/* Message Header */}
              <div className={`flex items-center gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isUser ? (
                  <>
                    <span className="text-[10px] font-mono text-zinc-400">{msg.timestamp}</span>
                    <span className="text-[11px] font-semibold text-zinc-300">Implantador</span>
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                      GC
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-300">Agente Construtor (Capa-Preta)</span>
                    <span className="text-[10px] font-mono text-zinc-400">{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  isUser
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 ml-6'
                    : 'bg-zinc-900/90 border border-indigo-500/25 text-zinc-200 mr-1'
                }`}
              >
                <p>{msg.text}</p>

                {/* Diff Container Card */}
                {msg.diffItems && msg.diffItems.length > 0 && (
                  <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden font-mono text-xs shadow-md">
                    {/* Diff Header */}
                    <div className="px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] text-zinc-300 font-semibold">
                          CHANGESET #{msg.diffId || 'CS-8924'}
                        </span>
                        <span className="text-[10px] text-zinc-400">form_alvara_obras_v2.json</span>
                      </div>

                      {/* Diff View Mode Toggle */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setDiffViewMode('visual')}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            diffViewMode === 'visual'
                              ? 'bg-zinc-800 text-zinc-200'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Diff Amigável
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiffViewMode('json')}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            diffViewMode === 'json'
                              ? 'bg-zinc-800 text-zinc-200'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          JSON Schema
                        </button>
                      </div>
                    </div>

                    {/* Diff Lines Container */}
                    {diffViewMode === 'visual' ? (
                      <div className="p-2 space-y-1.5 divide-y divide-zinc-900">
                        {msg.diffItems.map((item) => {
                          if (item.action === 'removed') {
                            return (
                              <div
                                key={item.id}
                                className="pt-1.5 first:pt-0 flex items-start gap-2 p-1.5 rounded bg-rose-950/20 text-rose-300 border border-rose-900/40 text-[11px]"
                              >
                                <span className="font-bold text-rose-400 font-mono">[-]</span>
                                <div className="flex-1">
                                  <div className="font-medium text-rose-200">
                                    Campo removido: &quot;{item.label}&quot;
                                  </div>
                                  <div className="text-[10px] text-rose-300/80 mt-0.5">
                                    {item.details}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (item.action === 'added') {
                            return (
                              <div
                                key={item.id}
                                className="pt-1.5 first:pt-0 flex items-start gap-2 p-1.5 rounded bg-emerald-950/20 text-emerald-300 border border-emerald-900/40 text-[11px]"
                              >
                                <span className="font-bold text-emerald-400 font-mono">[+]</span>
                                <div className="flex-1">
                                  <div className="font-medium text-emerald-200">
                                    Campo adicionado: &quot;{item.label}&quot;
                                  </div>
                                  <div className="text-[10px] text-emerald-300/80 mt-0.5">
                                    {item.details}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={item.id}
                              className="pt-1.5 first:pt-0 flex items-start gap-2 p-1.5 rounded bg-amber-950/20 text-amber-300 border border-amber-900/40 text-[11px]"
                            >
                              <span className="font-bold text-amber-400 font-mono">[~]</span>
                              <div className="flex-1">
                                <div className="font-medium text-amber-200">
                                  Campo alterado: &quot;{item.label}&quot;
                                </div>
                                <div className="text-[10px] text-amber-300/80 mt-0.5">
                                  {item.details}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Raw JSON inspection */
                      <div className="p-2.5 bg-zinc-950 overflow-x-auto text-[10px] text-zinc-300 leading-relaxed font-mono">
                        <pre className="text-zinc-400">
{`// Mutações compiladas pelo Form Builder Engine
{
  "diff_id": "${msg.diffId || 'CS-8924'}",
  "target_service": "alvara_construcao_civil",
  "mutations": [
    {
      "op": "remove_field",
      "field_key": "declaracao_risco_simples"
    },
    {
      "op": "add_field",
      "field_key": "upload_laudo_bombeiros",
      "conditional": "area > 500 || cnae_in(['4731-8/00'])"
    },
    {
      "op": "update_property",
      "field_key": "validade_meses",
      "from": 12,
      "to": 24
    }
  ]
}`}
                        </pre>
                      </div>
                    )}

                    {/* Diff Actions Footer */}
                    <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenJsonEditor(msg.diffItems || [])}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[11px] font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
                        >
                          <Code className="w-3 h-3 text-zinc-400" />
                          <span>Editar JSON</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRevertDiff(msg.diffId || 'CS-8924')}
                          className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverter</span>
                        </button>
                      </div>

                      {msg.diffApplied ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Aplicado no Form Engine</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={() => handleApply(msg.diffId || 'CS-8924')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all shadow-md shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-50"
                        >
                          {isApplying ? (
                            <>
                              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              <span>Compilando...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-emerald-200" />
                              <span>Aplicar Alteração no Sistema</span>
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

      {/* Rodapé da Coluna (Barra de Comando & Quick Chips) */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-slate-100 space-y-2.5 shrink-0">
        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            Comandos Rápidos:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendCommand(chip)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 hover:text-zinc-100 text-zinc-300 border border-zinc-700/80 transition-colors"
            >
              [{chip}]
            </button>
          ))}
        </div>

        {/* Command Prompt Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Terminal className="w-3.5 h-3.5 absolute left-3 top-2.5 text-indigo-400" />
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Instrua o agente a criar campos, condicionais ou alterar rotas de aprovação..."
            className="w-full h-8 pl-8 pr-9 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={!commandInput.trim()}
            className="absolute right-1 top-1 w-6 h-6 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </section>
  );
};
