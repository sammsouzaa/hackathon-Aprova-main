/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MascotePrumo } from '../MascotePrumo';

interface MensagemTextoProps {
  texto: string;
  timestamp: string;
  fonteAnalise?: string;
  mostrarAvatar?: boolean;
}

export const MensagemTexto: React.FC<MensagemTextoProps> = ({
  texto,
  timestamp,
  fonteAnalise = 'Análise gravada',
  mostrarAvatar = true
}) => {
  return (
    <div className="flex items-start gap-2.5 max-w-[94%] select-text animate-in fade-in duration-150">
      {/* Avatar só na primeira mensagem consecutiva do Prumo */}
      <div className="w-7 shrink-0">
        {mostrarAvatar ? (
          <MascotePrumo size={28} className="mt-0.5" />
        ) : (
          <div className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      {/* Balão discreto com cantos arredondados (16 px) e fundo #e6f5f8 para o Prumo */}
      <div className="bg-[#e6f5f8] border border-[#0891b2]/20 rounded-2xl rounded-tl-sm p-3.5 text-xs leading-relaxed text-[#1c1c1c] w-full">
        <div className="flex items-center justify-between gap-2 mb-1 text-xs text-[#0e7490]">
          <span className="font-semibold text-[#0e7490]">Prumo</span>
          <div className="flex items-center gap-1.5 text-xs text-[#656666]">
            <span>{fonteAnalise}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{timestamp}</span>
          </div>
        </div>
        <p className="whitespace-pre-line text-xs text-[#1c1c1c] leading-relaxed">
          {texto}
        </p>
      </div>
    </div>
  );
};
