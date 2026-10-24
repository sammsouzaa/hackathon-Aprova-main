import React from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Code2, 
  FolderTree, 
  Eye, 
  Share2,
  ChevronRight,
  ShieldCheck,
  Building2,
  Layers,
  HelpCircle,
  Users
} from 'lucide-react';
import { ContextoCompleto } from '../api';

export type ActiveNavTab = 'chat' | 'cliente' | 'documents' | 'context' | 'code';

interface GeminiSidebarProps {
  contexto: ContextoCompleto | null;
  erroContexto: string | null;
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenReportModal: () => void;
  onOpenFormPreview: () => void;
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  contexto,
  erroContexto,
  activeTab,
  onSelectTab,
  onOpenReportModal,
  onOpenFormPreview,
}) => {
  const navItems = [
    {
      id: 'chat' as ActiveNavTab,
      label: 'Chat do Contexto',
      subtitle: 'Pergunte à IA sobre o cliente',
      icon: MessageSquare,
      badge: 'IA',
      badgeClass: 'badge--info'
    },
    {
      id: 'cliente' as ActiveNavTab,
      label: 'Chat com o Cliente',
      subtitle: 'Você e a equipe do cliente',
      icon: Users,
      badge: 'Cliente',
      badgeClass: 'badge--neutral'
    },
    {
      id: 'documents' as ActiveNavTab,
      label: 'Repositório & Pastas',
      subtitle: 'Documentos do contexto',
      icon: FolderTree,
      badge: `${contexto?.arquivos.length ?? 0} docs`,
      badgeClass: 'badge--neutral'
    },
    {
      id: 'context' as ActiveNavTab,
      label: 'Matriz de Regras',
      subtitle: 'Alinhamento & Dúvidas',
      icon: Sparkles,
      badge: 'Matriz Viva',
      badgeClass: 'badge--warning'
    },
    {
      id: 'code' as ActiveNavTab,
      label: 'Agente Construtor',
      subtitle: 'Form Builder & Changesets',
      icon: Code2,
      badge: 'IA ADS',
      badgeClass: 'badge--ia'
    },
  ];

  return (
    <aside className="w-72 h-full flex flex-col bg-white border-r border-[#dee0e0] shrink-0 select-none">
      {/* Projeto atual: nome e progresso do checklist */}
      <div className="px-5 py-4 border-b border-[#dee0e0]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0d787e] shrink-0" />
          <span className="text-sm font-semibold text-[#1c1c1c] truncate" title={contexto?.descricao}>
            {contexto?.nome ?? (erroContexto ? 'Backend fora do ar' : 'Carregando...')}
          </span>
        </div>
        {contexto && contexto.checklist.length > 0 && (() => {
          const ok = contexto.checklist.filter(i => i.confirmado_no_contexto).length;
          const total = contexto.checklist.length;
          return (
            <div className="mt-3">
              <div className="h-1 rounded-full bg-[#eeeeee] overflow-hidden">
                <div className="h-full bg-[#0d787e]" style={{ width: `${(ok / total) * 100}%` }} />
              </div>
              <div className="text-[11px] text-[#656666] mt-1.5">{ok} de {total} itens confirmados</div>
            </div>
          );
        })()}
      </div>

      {/* Main Navigation (Módulos) */}
      <div className="p-3 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#656666]">
          Módulos de Trabalho
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-[#e0f6f7] text-[#074a4e] border border-[#14bac4]/50 font-medium'
                  : 'text-[#656666] hover:text-[#1c1c1c] hover:bg-[#f5f7f7] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#0d787e] text-white shadow-xs'
                      : 'bg-[#f5f7f7] text-[#656666] group-hover:text-[#1c1c1c] group-hover:bg-[#dee0e0]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs leading-tight ${isActive ? 'font-semibold text-[#074a4e]' : 'font-medium text-[#1c1c1c]'}`}>
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[#656666] truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d787e] shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Resumo do contexto */}
      {contexto && (
        <div className="mx-3 mt-2 px-3 py-3 rounded-lg border border-[#eeeeee] text-[11px] text-[#656666] space-y-1.5">
          <div className="font-semibold uppercase tracking-wider text-[10px] text-[#868787] mb-2">Contexto</div>
          <div className="flex justify-between"><span>Documentos</span><span className="font-semibold text-[#1c1c1c]">{contexto.arquivos.length}</span></div>
          <div className="flex justify-between"><span>Pendências</span><span className="font-semibold text-[#1c1c1c]">{contexto.checklist.filter(i => !i.confirmado_no_contexto).length}</span></div>
          <div className="flex justify-between"><span>Termos no glossário</span><span className="font-semibold text-[#1c1c1c]">{contexto.glossario.length}</span></div>
        </div>
      )}

      <div className="flex-1" />

      {/* Usuário e status do backend */}
      <div className="px-4 py-3 border-t border-[#dee0e0] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0d787e] text-white flex items-center justify-center text-[11px] font-bold shrink-0">G</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#1c1c1c] truncate">Gabriel</div>
          <div className="text-[11px] text-[#656666]">Implantador · MeuLab</div>
        </div>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${erroContexto ? 'bg-[#dc2626]' : contexto ? 'bg-[#19bf8b]' : 'bg-[#cacccc]'}`}
          title={erroContexto ? 'Backend fora do ar' : contexto ? 'Backend conectado' : 'Conectando...'}
        />
      </div>
    </aside>
  );
};
