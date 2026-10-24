/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic } from 'lucide-react';
import { useAoVivo } from '../context/AoVivoContext';

/** Marca fixa do modo real: deixa claro o que a transcrição ao vivo faz e o que não faz. */
export const ChipAoVivo: React.FC = () => {
  const { viaApi, snapshot } = useAoVivo();
  // Antes de a reunião começar só se sabe pelo motor carregado; durante, pela sessão.
  const porApi = snapshot.transcricaoPor ? snapshot.transcricaoPor === 'api' : viaApi;
  return (
    <div className="bg-[#e6f5f8] border-b border-[#bfe3ea] px-4 h-7 flex items-center gap-1.5 text-[11px] font-semibold text-[#0e7490] shrink-0 select-none">
      <Mic size={12} aria-hidden="true" />
      <span className="truncate">
        {porApi ? 'Transcrição ao vivo pela API do Prumo · áudio vai ao servidor' : 'Transcrição ao vivo (local) · somente transcrição'}
      </span>
    </div>
  );
};
