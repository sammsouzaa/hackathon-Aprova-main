/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { useAoVivo } from '../context/AoVivoContext';
import { Volume2 } from 'lucide-react';

export const FaixaUltimaFala: React.FC = () => {
  const { falaMaisRecente, estado, fonteFala, aoVivoReal, modoEscuta } = useReuniao();
  const { snapshot } = useAoVivo();

  if (aoVivoReal) {
    const ultimo = snapshot.ultimo;
    if (!ultimo) {
      const aviso =
        estado === 'preparando'
          ? 'Aguardando início da reunião...'
          : modoEscuta === 'modo_notas'
            ? 'Modo notas: o Prumo não capta áudio.'
            : snapshot.fase === 'pausada'
              ? 'Pausada: as falas não estão sendo transcritas.'
              : 'Aguardando a primeira fala...';
      return (
        <div className="bg-white border-b border-[#dee0e0] px-4 py-2 flex items-center justify-between text-xs text-[#656666] shrink-0 min-h-[38px]">
          <div className="flex items-center gap-2 truncate">
            <Volume2 size={14} className="text-[#656666] shrink-0" aria-hidden="true" />
            <span className="font-medium text-[#656666]">Última fala:</span>
            <span className="text-[#656666] truncate">{aviso}</span>
          </div>
          <span className="text-xs font-medium text-[#656666] shrink-0 ml-2">{snapshot.fase === 'gravando' ? 'Ao vivo' : ''}</span>
        </div>
      );
    }
    const rotulo = ultimo.falante === 'implantadora' ? 'Implantadora' : ultimo.falante === 'prefeitura' ? 'Prefeitura' : 'Sem identificação';
    return (
      <div className="bg-white border-b border-[#dee0e0] px-4 py-2 flex items-start justify-between gap-3 text-xs shrink-0 min-h-[38px]">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold shrink-0 mt-0.5 ${
              ultimo.falante === 'implantadora'
                ? 'bg-[#e6f5f8] text-[#0e7490]'
                : ultimo.falante === 'prefeitura'
                  ? 'bg-[#ffefe7] text-[#702600]'
                  : 'bg-[#f5f7f7] text-[#656666] border border-[#dee0e0]'
            }`}
          >
            {rotulo}
          </span>
          <p className="text-[#1c1c1c] text-xs line-clamp-2 leading-relaxed font-normal">"{ultimo.texto}"</p>
        </div>
        <span className="text-xs text-[#656666] shrink-0 font-medium self-start mt-0.5">{snapshot.fase === 'gravando' ? 'Ao vivo' : 'Última fala'}</span>
      </div>
    );
  }

  // Ao vivo escolhido fora do programa desktop: quem roda é o roteiro, e o rótulo diz isso.
  const rotuloFonte =
    fonteFala === 'audio_gravado' ? 'Gravado' : 'Roteiro';

  if (estado === 'preparando' || !falaMaisRecente) {
    return (
      <div className="bg-white border-b border-[#dee0e0] px-4 py-2 flex items-center justify-between text-xs text-[#656666] shrink-0 min-h-[38px]">
        <div className="flex items-center gap-2 truncate">
          <Volume2 size={14} className="text-[#656666] shrink-0" aria-hidden="true" />
          <span className="font-medium text-[#656666]">Última fala:</span>
          <span className="text-[#656666] truncate">Aguardando início da sessão de alinhamento...</span>
        </div>
        <span className="text-xs font-medium text-[#656666] shrink-0 ml-2">
          {rotuloFonte}
        </span>
      </div>
    );
  }

  const isImplantadora = falaMaisRecente.orador === 'implantadora';
  const canalNome = falaMaisRecente.nome.split(' ')[0]; // "Helena" ou "Marina"

  return (
    <div className="bg-white border-b border-[#dee0e0] px-4 py-2 flex items-start justify-between gap-3 text-xs shrink-0 transition-opacity duration-150 min-h-[38px]">
      <div className="flex items-start gap-2 min-w-0">
        {/* Rótulo pequeno do canal: "Helena" ou "Marina" */}
        <span
          className={`px-1.5 py-0.5 rounded text-[11px] font-semibold shrink-0 mt-0.5 ${
            isImplantadora
              ? 'bg-[#e6f5f8] text-[#0e7490]'
              : 'bg-[#ffefe7] text-[#702600]'
          }`}
        >
          {canalNome}
        </span>

        {/* Texto em até 2 linhas com reticências */}
        <p className="text-[#1c1c1c] text-xs line-clamp-2 leading-relaxed font-normal">
          "{falaMaisRecente.texto}"
        </p>
      </div>

      <span className="text-xs text-[#656666] shrink-0 font-medium self-start mt-0.5">
        {rotuloFonte}
      </span>
    </div>
  );
};
