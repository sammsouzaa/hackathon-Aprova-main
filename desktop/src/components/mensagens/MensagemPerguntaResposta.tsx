/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MascotePrumo } from '../MascotePrumo';
import { DadosMensagemPerguntaResposta } from '../../types';
import { BookOpen } from 'lucide-react';

interface MensagemPerguntaRespostaProps {
  dados: DadosMensagemPerguntaResposta;
  timestamp: string;
  mostrarAvatar?: boolean;
}

export const MensagemPerguntaResposta: React.FC<MensagemPerguntaRespostaProps> = ({
  dados,
  timestamp,
  mostrarAvatar = true
}) => {
  return (
    <div className="flex items-start gap-2.5 max-w-[94%] select-text animate-in fade-in duration-150">
      <div className="w-7 shrink-0">
        {mostrarAvatar ? (
          <MascotePrumo size={28} className="mt-0.5" />
        ) : (
          <div className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      <div className="bg-[#e6f5f8] border border-[#0891b2]/20 rounded-2xl rounded-tl-sm p-3.5 text-xs leading-relaxed w-full">
        {/* Cabeçalho Limpo */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-[#0e7490]">
          <span className="font-semibold text-[#0e7490]">
            Consulta à Documentação
          </span>
          <div className="flex items-center gap-1.5 text-xs text-[#656666]">
            <span>Resposta simulada</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{timestamp}</span>
          </div>
        </div>

        {/* Resposta em no máximo 2 linhas */}
        <p className="font-semibold text-[#1c1c1c] text-xs mb-2 line-clamp-2 leading-relaxed">
          {dados.resposta}
        </p>

        {/* Citação do Documento se existir */}
        {dados.docReferencia && (
          <div className="bg-white/90 border border-[#dee0e0] p-2.5 rounded-xl text-xs">
            <div className="font-semibold text-[#0d787e] flex items-center gap-1 mb-0.5 text-xs">
              <BookOpen size={13} aria-hidden="true" />
              <span>{dados.docReferencia.titulo} ({dados.docReferencia.artigo})</span>
            </div>
            <p className="text-[#656666] italic text-xs leading-relaxed line-clamp-2">
              "{dados.docReferencia.texto}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
