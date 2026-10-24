/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DadosMensagemTexto } from '../../types';

interface MensagemUsuarioProps {
  dados: DadosMensagemTexto;
  timestamp: string;
}

export const MensagemUsuario: React.FC<MensagemUsuarioProps> = ({
  dados,
  timestamp
}) => {
  return (
    <div className="flex justify-end select-text animate-in fade-in slide-in-from-right-1 duration-150">
      <div className="max-w-[85%] bg-[#0d787e] text-white rounded-2xl rounded-tr-sm p-3 text-xs leading-relaxed">
        <p className="whitespace-pre-line text-xs font-medium">{dados.texto}</p>
        <div className="flex items-center justify-end gap-1.5 mt-1 text-xs text-teal-100 font-normal">
          <span>Marina Duarte</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{timestamp}</span>
        </div>
      </div>
    </div>
  );
};
