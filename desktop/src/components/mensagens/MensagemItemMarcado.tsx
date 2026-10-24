/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DadosMensagemItemMarcado } from '../../types';
import { useReuniao } from '../../context/ReuniaoContext';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface MensagemItemMarcadoProps {
  id: string;
  dados: DadosMensagemItemMarcado & { regraLocal?: boolean };
  timestamp: string;
}

export const MensagemItemMarcado: React.FC<MensagemItemMarcadoProps> = ({
  id,
  dados,
  timestamp
}) => {
  const { desmarcarItemMensagem } = useReuniao();
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="bg-white border border-[#dee0e0] rounded-xl text-xs select-text hover:border-[#cacccc] transition-all group overflow-hidden">
      {/* Linha Compacta Principal */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2
            size={16}
            className="text-[#055b40] shrink-0"
            aria-hidden="true"
          />
          <span className="font-medium text-[#1c1c1c] truncate">
            {dados.itemTitulo}
          </span>
          <span className="text-[#cacccc]" aria-hidden="true">·</span>
          <span className="font-semibold text-[#055b40] truncate">
            {dados.valor}
          </span>
          {dados.regraLocal && (
            <span className="text-[11px] font-semibold text-[#ea580c] bg-[#ffefe7] px-1.5 py-0.5 rounded shrink-0">
              Regra local
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#0e7490] bg-[#e6f5f8] px-1.5 py-0.5 rounded font-medium">
            Análise gravada
          </span>

          {/* Botão Ver Frase (expande em 150ms) */}
          {dados.evidencia && (
            <button
              onClick={() => setExpandido(!expandido)}
              className="text-xs text-[#0d787e] hover:text-[#074a4e] flex items-center gap-0.5 cursor-pointer font-medium"
              aria-expanded={expandido}
            >
              <span>{expandido ? 'Ocultar' : 'Ver frase'}</span>
              {expandido ? (
                <ChevronUp size={13} aria-hidden="true" />
              ) : (
                <ChevronDown size={13} aria-hidden="true" />
              )}
            </button>
          )}

          <span className="text-xs text-[#656666] tabular-nums font-mono hidden sm:inline">
            {timestamp}
          </span>

          {/* Botão Desmarcar: texto discreto visível no foco ou hover, acessível por teclado */}
          {!dados.desmarcado ? (
            <button
              onClick={() => desmarcarItemMensagem(id, dados.itemId)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs text-[#656666] hover:text-[#ba1515] transition-opacity cursor-pointer underline underline-offset-2 ml-1"
              title="Desmarcar item do checklist"
            >
              Desmarcar
            </button>
          ) : (
            <span className="text-xs text-[#656666] italic">Desmarcado</span>
          )}
        </div>
      </div>

      {/* Frase de evidência recolhida */}
      {expandido && dados.evidencia && (
        <div className="bg-[#f5f7f7] border-t border-[#dee0e0] px-3 py-2 text-xs text-[#656666] italic animate-in fade-in duration-150">
          "{dados.evidencia}"
        </div>
      )}
    </div>
  );
};
