/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * Controle do painel fixo do programa desktop (Electron): oculta o painel, e o Prumo segue na bandeja.
 * Só aparecem quando a API `window.prumoDesktop` existe; no navegador e no preview não renderizam.
 */
export const ControlesJanelaDesktop: React.FC = () => {
  const desktop = window.prumoDesktop;
  if (!desktop) return null;

  return (
    <div className="flex items-center gap-1 ml-1 pl-2 border-l border-[#dee0e0]">
      <button
        type="button"
        onClick={() => void desktop.janela.ocultar()}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#656666] hover:text-[#ba1515] hover:bg-[#ffebeb] transition-colors cursor-pointer"
        aria-label="Ocultar o Prumo na bandeja"
        title="Ocultar (o Prumo continua na bandeja; Ctrl+Q sai)"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
