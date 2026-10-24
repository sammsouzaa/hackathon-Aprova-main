/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { CabecalhoPrumo } from './CabecalhoPrumo';
import { FaixaUltimaFala } from './FaixaUltimaFala';
import { ListaDeMensagens } from './ListaDeMensagens';
import { AbaChecklist } from './AbaChecklist';
import { AbaTranscricao } from './AbaTranscricao';
import { ChipAoVivo } from './ChipAoVivo';
import { CampoDeMensagem } from './CampoDeMensagem';
import { PainelResumo } from './PainelResumo';
import { PainelTicketSimulado } from './PainelTicketSimulado';
import { PainelSobre } from './PainelSobre';
import { MessageSquare, CheckSquare, FileText, Info, X } from 'lucide-react';

export const PainelPrumo: React.FC = () => {
  const {
    abaAtiva,
    setAbaAtiva,
    checklist,
    aoVivoReal,
    alertaDemonstrativo,
    fecharAlertaDemonstrativo
  } = useReuniao();

  // A aba Transcrição só existe com a fonte Ao vivo; fora dela o painel é o mesmo de sempre.
  const aba = abaAtiva === 'transcricao' && !aoVivoReal ? 'conversa' : abaAtiva;

  // Contador de itens concluídos no checklist para o badge da aba
  const itensConcluidos = checklist.filter(
    (i) => i.status === 'confirmado_contexto' || i.status === 'respondido' || i.status === 'regra_local'
  ).length;

  return (
    <div className="w-full h-full bg-[#f5f7f7] text-[#1c1c1c] flex flex-col overflow-hidden relative select-none font-sans">
      {/* 1. Cabeçalho de 56 px com drag-region e controles no-drag */}
      <CabecalhoPrumo />

      {/* 2. Abas: "Conversa" e "Checklist" com 40 px de altura e sublinhado de 2 px */}
      <div className="h-10 bg-white border-b border-[#dee0e0] px-4 flex items-center justify-between shrink-0 no-drag z-10">
        <div className="flex items-center gap-4 h-full">
          <button
            onClick={() => setAbaAtiva('conversa')}
            className={`h-full text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer px-1 -mb-[1px] ${
              aba === 'conversa'
                ? 'border-[#0d787e] text-[#0d787e]'
                : 'border-transparent text-[#656666] hover:text-[#1c1c1c]'
            }`}
          >
            <MessageSquare size={14} aria-hidden="true" />
            <span>Conversa</span>
          </button>

          <button
            onClick={() => setAbaAtiva('checklist')}
            className={`h-full text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer px-1 -mb-[1px] ${
              aba === 'checklist'
                ? 'border-[#0d787e] text-[#0d787e]'
                : 'border-transparent text-[#656666] hover:text-[#1c1c1c]'
            }`}
          >
            <CheckSquare size={14} aria-hidden="true" />
            <span>Checklist</span>
            <span className="text-xs font-mono font-semibold text-[#0d787e] tabular-nums">
              ({itensConcluidos}/{checklist.length})
            </span>
          </button>

          {aoVivoReal && (
            <button
              onClick={() => setAbaAtiva('transcricao')}
              className={`h-full text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer px-1 -mb-[1px] ${
                aba === 'transcricao'
                  ? 'border-[#0d787e] text-[#0d787e]'
                  : 'border-transparent text-[#656666] hover:text-[#1c1c1c]'
              }`}
            >
              <FileText size={14} aria-hidden="true" />
              <span>Transcrição</span>
            </button>
          )}
        </div>

        <div className="text-xs text-[#656666] hidden sm:flex items-center gap-1.5 font-medium">
          <span className="text-[#1c1c1c]">Serra do Sabiá</span>
          <span aria-hidden="true">·</span>
          <span>Alvará Residencial</span>
        </div>
      </div>

      {/* Marca fixa do modo real (só com a fonte Ao vivo no desktop) */}
      {aoVivoReal && <ChipAoVivo />}

      {/* 3. Faixa "Última fala" logo abaixo das abas */}
      <FaixaUltimaFala />

      {/* 4. Alerta de ação demonstrativa se ativo */}
      {alertaDemonstrativo && (
        <div className="bg-[#ffefe7] border-b border-[#ea580c]/30 px-4 py-2 flex items-center justify-between text-xs text-[#702600] animate-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-[#ea580c] shrink-0" aria-hidden="true" />
            <span>{alertaDemonstrativo}</span>
          </div>
          <button
            onClick={fecharAlertaDemonstrativo}
            className="p-1 hover:bg-[#ea580c]/10 rounded cursor-pointer text-[#702600]"
            aria-label="Fechar aviso"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 5. Conteúdo Central: Lista de Mensagens com Campo OU Aba Checklist */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {aba === 'conversa' ? (
          <>
            <ListaDeMensagens />
            <CampoDeMensagem />
          </>
        ) : aba === 'transcricao' ? (
          <AbaTranscricao />
        ) : (
          <>
            <AbaChecklist />
            {/* Selo discreto obrigatório na base da aba Checklist */}
            <div className="h-6 bg-[#f5f7f7] border-t border-[#dee0e0] px-4 flex items-center justify-between text-xs text-[#656666] shrink-0 select-none">
              <span className="truncate">Protótipo demonstrativo · dados fictícios</span>
              <span className="font-mono text-[#656666] shrink-0 ml-2">v1.1.0</span>
            </div>
          </>
        )}
      </div>

      {/* Painéis Modais da Reunião */}
      <PainelResumo />
      <PainelTicketSimulado />
      <PainelSobre />
    </div>
  );
};
