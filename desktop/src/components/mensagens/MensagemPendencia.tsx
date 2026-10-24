/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MascotePrumo } from '../MascotePrumo';
import { DadosMensagemPendencia } from '../../types';
import { HelpCircle, Tag } from 'lucide-react';

interface MensagemPendenciaProps {
  dados: DadosMensagemPendencia;
  timestamp: string;
  mostrarAvatar?: boolean;
}

export const MensagemPendencia: React.FC<MensagemPendenciaProps> = ({
  dados,
  timestamp,
  mostrarAvatar = true
}) => {
  return (
    <div className="flex items-start gap-2.5 max-w-[94%] select-text animate-in fade-in duration-150">
      <div className="w-7 shrink-0">
        {mostrarAvatar ? (
          <MascotePrumo size={28} className="mt-0.5" estado="atento" />
        ) : (
          <div className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      <div className="bg-white border border-[#dee0e0] rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed w-full">
        {/* Cabeçalho Limpo */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-[#656666]">
          <div className="flex items-center gap-1.5 font-semibold text-[#0856af]">
            <HelpCircle size={14} className="text-[#0856af]" aria-hidden="true" />
            <span>Pendência registrada</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span>Resposta simulada</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{timestamp}</span>
          </div>
        </div>

        <p className="text-xs text-[#1c1c1c] mb-2 leading-relaxed">{dados.observacao}</p>

        <div className="bg-[#f5f7f7] border border-[#dee0e0] p-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#656666]">
            <Tag size={13} className="text-[#0d787e]" aria-hidden="true" />
            <span>Protocolo:</span>
            <span className="font-mono font-bold text-[#1c1c1c]">
              {dados.codigoProtocolo}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#702600]">
            Aguardando validação
          </span>
        </div>
      </div>
    </div>
  );
};
