/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MascotePrumo } from '../MascotePrumo';
import { DadosMensagemLembrete } from '../../types';
import { useReuniao } from '../../context/ReuniaoContext';
import { Clock, ExternalLink, CheckCircle2 } from 'lucide-react';

interface MensagemLembreteProps {
  dados: DadosMensagemLembrete;
  timestamp: string;
  mostrarAvatar?: boolean;
}

export const MensagemLembrete: React.FC<MensagemLembreteProps> = ({
  dados,
  timestamp,
  mostrarAvatar = true
}) => {
  const { abrirTicketSimulado } = useReuniao();

  return (
    <div className="flex items-start gap-2.5 max-w-[94%] select-text animate-in fade-in duration-150">
      <div className="w-7 shrink-0">
        {mostrarAvatar ? (
          <MascotePrumo
            size={28}
            className="mt-0.5"
            estado={dados.concluido ? 'sucesso' : 'atento'}
          />
        ) : (
          <div className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      <div className="bg-white border border-[#dee0e0] rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed w-full">
        {/* Cabeçalho Limpo */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-[#656666]">
          <div className="flex items-center gap-1.5 font-semibold text-[#0856af]">
            <Clock size={14} className="text-[#0856af]" aria-hidden="true" />
            <span>Lembrete de acompanhamento</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span>Tempo simulado</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{timestamp}</span>
          </div>
        </div>

        {/* Data Simulada */}
        <div className="text-xs font-semibold text-[#1c1c1c] mb-1">
          {dados.dataSimulada}
        </div>

        {/* Conteúdo */}
        <p className="text-xs text-[#1c1c1c] mb-2 leading-relaxed">{dados.texto}</p>

        {/* Ação: Abrir ticket (simulado) */}
        {dados.ticketId && (
          <div className="flex items-center justify-end mt-2 pt-1.5 border-t border-[#dee0e0]">
            <button
              onClick={() => abrirTicketSimulado(dados.ticketId!)}
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#e6f5f8] hover:bg-[#cff0f6] text-[#0e7490] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink size={13} aria-hidden="true" />
              <span>Abrir ticket (simulado)</span>
            </button>
          </div>
        )}

        {dados.concluido && (
          <div className="mt-2 text-[#055b40] text-xs font-semibold flex items-center gap-1.5 pt-1.5 border-t border-[#dee0e0]">
            <CheckCircle2 size={14} className="text-[#055b40]" aria-hidden="true" />
            <span>Compromisso concluído sem nova reunião</span>
          </div>
        )}
      </div>
    </div>
  );
};
