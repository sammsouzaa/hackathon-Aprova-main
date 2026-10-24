import React from 'react';
import { 
  GitBranch, 
  Clock, 
  FileDown, 
  Eye, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface HeaderProps {
  validationPercentage: number;
  onOpenReportModal: () => void;
  onOpenFormPreview: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  validationPercentage,
  onOpenReportModal,
  onOpenFormPreview,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-white light:border-slate-200 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Left side: City Badge, Service Identifier, Base Model Tag */}
      <div className="flex items-center gap-3 overflow-hidden">
        {/* City Coat of Arms / Badge */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-zinc-800 dark:border-zinc-800 light:border-slate-200">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-inner border border-emerald-500/30 text-white font-bold text-xs tracking-tighter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-200">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="currentColor" fillOpacity="0.3" />
              <path d="M12 7v10M8 12h8" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-slate-900">
                Prefeitura Municipal de Cascavel / PR
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Homologação
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-slate-500 font-mono">
              CNPJ: 76.208.867/0001-07 • Região Oeste
            </p>
          </div>
        </div>

        {/* Process Identifier */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-slate-500 font-medium">
            Sec. Obras e Urbanismo
          </span>
          <span className="text-zinc-600">/</span>
          <div className="flex items-center gap-1 font-semibold text-zinc-200 dark:text-zinc-200 light:text-slate-800">
            <span>Alvará de Construção Civil</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 dark:bg-zinc-800 light:bg-slate-200 text-zinc-300 dark:text-zinc-300 light:text-slate-700">
              v2.1
            </span>
          </div>
        </div>

        {/* Base Model Tag */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-indigo-400/80">Clonado de:</span>
          <span className="font-semibold text-indigo-200">Maringá-PR (Modelo Padrão)</span>
        </div>
      </div>

      {/* Right side: Deadlines, Progress Chip, Actions */}
      <div className="flex items-center gap-3">
        {/* Contractual Deadline Badge with mini progress bar */}
        <div className="hidden sm:flex flex-col items-end gap-1 px-3 py-1 rounded border border-zinc-800/80 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-slate-100 light:border-slate-300 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-300 dark:text-zinc-300 light:text-slate-700 font-medium">
              Meta Contratual: <strong className="font-mono text-zinc-100 dark:text-zinc-100 light:text-slate-900">Dia 18 de 45</strong>
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 font-medium">(27 dias rest.)</span>
          </div>
          {/* Progress bar */}
          <div className="w-36 h-1.5 bg-zinc-800 dark:bg-zinc-800 light:bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
              style={{ width: `${(18 / 45) * 100}%` }}
              title="40% do cronograma total decorrido"
            />
          </div>
        </div>

        {/* Parametrization Status Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{validationPercentage}%</span>
          <span className="text-emerald-400/80 hidden md:inline">das regras validadas</span>
        </div>

        {/* Live Form Preview trigger */}
        <button
          onClick={onOpenFormPreview}
          title="Ver pré-visualização do formulário com as regras aplicadas"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-colors shadow-sm"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Preview Formulário</span>
        </button>

        {/* Export Report Action */}
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Exportar Relatório de Pendências</span>
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro corporativo' : 'Mudar para modo escuro'}
          className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Implantador User Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow border border-indigo-400/40">
              GC
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" title="Online no Workspace" />
          </div>
          <div className="hidden 2xl:block text-left">
            <div className="text-xs font-medium text-zinc-200 leading-tight">Gabriel Costa</div>
            <div className="text-[10px] text-zinc-400 font-mono">Implantador Sênior</div>
          </div>
        </div>
      </div>
    </header>
  );
};
