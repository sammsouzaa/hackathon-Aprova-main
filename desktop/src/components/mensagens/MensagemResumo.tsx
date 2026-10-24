/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MascotePrumo } from '../MascotePrumo';
import { DadosMensagemResumo } from '../../types';
import { useReuniao } from '../../context/ReuniaoContext';
import { FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface MensagemResumoProps {
  dados: DadosMensagemResumo;
  timestamp: string;
  mostrarAvatar?: boolean;
}

export const MensagemResumo: React.FC<MensagemResumoProps> = ({
  dados,
  timestamp,
  mostrarAvatar = true
}) => {
  const { setPainelResumoAberto } = useReuniao();

  return (
    <div className="flex items-start gap-2.5 max-w-[96%] select-text animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="w-7 shrink-0">
        {mostrarAvatar ? (
          <MascotePrumo size={28} className="mt-0.5" estado="sucesso" />
        ) : (
          <div className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      <div className="bg-white border border-[#dee0e0] rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[#656666]">
          <div className="flex items-center gap-1.5 text-[#055b40] font-semibold">
            <CheckCircle2 size={15} className="text-[#055b40]" aria-hidden="true" />
            <span>Reunião concluída</span>
          </div>
          <span className="tabular-nums font-mono">{timestamp}</span>
        </div>

        {/* Indicadores Principais em Grid Limpo */}
        <div className="bg-[#f5f7f7] border border-[#dee0e0] p-3 rounded-xl mb-2.5 space-y-1.5">
          <div className="font-bold text-sm text-[#0e7490] tabular-nums">
            {dados.cobertura}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#1c1c1c]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" aria-hidden="true" />
              <strong>{dados.regrasLocais}</strong> regras locais
            </span>
            <span className="text-[#dee0e0]" aria-hidden="true">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0891b2]" aria-hidden="true" />
              <strong>{dados.compromissos}</strong> compromissos
            </span>
          </div>
        </div>

        <p className="text-xs text-[#656666] mb-3 leading-relaxed">
          Os parâmetros coletados foram consolidados e estão prontos para revisão, exportação JSON e envio ao agente de implantação.
        </p>

        {/* Botão Ver Resumo */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setPainelResumoAberto(true)}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText size={14} aria-hidden="true" />
            <span>Ver resumo estruturado</span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
