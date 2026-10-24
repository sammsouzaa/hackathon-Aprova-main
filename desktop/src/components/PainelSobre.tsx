/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { MascotePrumo } from './MascotePrumo';
import { X, CheckCircle2, Sparkles } from 'lucide-react';

export const PainelSobre: React.FC = () => {
  const { painelSobreAberto, setPainelSobreAberto } = useReuniao();

  // Fecha no Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && painelSobreAberto) {
        setPainelSobreAberto(false);
      }
    };
    if (painelSobreAberto) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [painelSobreAberto, setPainelSobreAberto]);

  if (!painelSobreAberto) return null;

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-[450px] bg-white rounded-2xl border border-[#dee0e0] shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="h-12 border-b border-[#dee0e0] px-4 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <MascotePrumo size={24} />
            <h3 className="font-bold text-sm text-[#1c1c1c]">
              Sobre o Prumo
            </h3>
          </div>
          <button
            onClick={() => setPainelSobreAberto(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#656666] hover:bg-[#f5f7f7] transition-colors cursor-pointer"
            aria-label="Fechar painel Sobre"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Conteúdo em 2 Colunas Organizadas sem rolagem interna */}
        <div className="p-4 space-y-3 text-xs leading-relaxed">
          <p className="text-[#1c1c1c] text-xs font-normal">
            O Prumo acompanha a reunião. A gestão de pendências, a consulta à documentação e o histórico ficam na plataforma web, fora desta janela.
          </p>

          {/* 2 Colunas: Real vs Simulado */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Coluna 1: O que é real */}
            <div className="bg-[#eefff9] border border-[#a7f3d0] rounded-xl p-3 space-y-1.5">
              <div className="font-bold text-[#055b40] flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={13} className="text-[#055b40]" aria-hidden="true" />
                <span>Real no produto</span>
              </div>
              <ul className="space-y-1 text-[#055b40] text-[11px] leading-snug">
                <li>• Janela compacta 480 × 640</li>
                <li>• Checklist vivo de regras</li>
                <li>• Detecção de contradições</li>
                <li>• Exportação de ata em JSON</li>
              </ul>
            </div>

            {/* Coluna 2: O que é simulado */}
            <div className="bg-[#ebf4ff] border border-[#bfdbfe] rounded-xl p-3 space-y-1.5">
              <div className="font-bold text-[#0856af] flex items-center gap-1.5 text-xs">
                <Sparkles size={13} className="text-[#0856af]" aria-hidden="true" />
                <span>Simulado aqui</span>
              </div>
              <ul className="space-y-1 text-[#0856af] text-[11px] leading-snug">
                <li>• Roteiro de 16 falas</li>
                <li>• Respostas de IA rápidas</li>
                <li>• Avanço de 3 dias no tempo</li>
                <li>• Envio e resposta de ticket</li>
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-[#656666] leading-relaxed">
            Janela desktop flutuante projetada para Linux (Electron), ancorada na bandeja do sistema para acompanhamento discreto durante chamadas.
          </p>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-3 border-t border-[#dee0e0] bg-[#f5f7f7] flex justify-end shrink-0">
          <button
            onClick={() => setPainelSobreAberto(false)}
            className="h-8 px-4 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
