/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DadosMensagemContradicao, DecisaoContradicao } from '../../types';
import { useReuniao } from '../../context/ReuniaoContext';
import { AlertTriangle, CheckCircle2, BookOpen, Check } from 'lucide-react';

interface MensagemContradicaoProps {
  id: string;
  dados: DadosMensagemContradicao;
  timestamp: string;
}

export const MensagemContradicao: React.FC<MensagemContradicaoProps> = ({
  id,
  dados,
  timestamp
}) => {
  const { decidirContradicao } = useReuniao();

  const handleDecisao = (decisao: DecisaoContradicao) => {
    decidirContradicao(id, dados.itemId, decisao);
  };

  // Se já decidido, colapsa para uma linha compacta
  if (dados.decisao) {
    const textoDecisao =
      dados.decisao === 'aceitar_regra_local'
        ? 'Aceito como regra local (3m na ZR2)'
        : dados.decisao === 'perguntar'
        ? 'Questionar cliente para validação'
        : 'Divergência ignorada';

    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-2 bg-[#f5f7f7] border border-[#dee0e0] px-3 py-2 rounded-xl text-xs text-[#1c1c1c] animate-in fade-in duration-150"
      >
        <div className="flex items-center gap-2 truncate">
          <CheckCircle2 size={16} className="text-[#055b40] shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#1c1c1c]">Contradição resolvida:</span>
          <span className="text-[#055b40] font-medium truncate">{textoDecisao}</span>
        </div>
        <span className="text-xs text-[#656666] tabular-nums font-mono shrink-0">
          {timestamp}
        </span>
      </div>
    );
  }

  // Cartão Completo de Alerta de Contradição (único elemento forte do chat)
  return (
    <div
      role="alert"
      className="bg-[#ffefe7] border border-[#ea580c]/40 border-l-4 border-l-[#ea580c] rounded-2xl rounded-tl-sm p-3.5 text-xs text-[#1c1c1c] space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 text-xs text-[#702600]">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertTriangle size={15} className="text-[#ea580c]" aria-hidden="true" />
          <span>Possível contradição: {dados.itemTitulo}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#702600]/80">
          <span>Análise gravada</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{timestamp}</span>
        </div>
      </div>

      {/* Dois blocos lado a lado (empilhados em 360 px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Bloco 1: Helena disse */}
        <div className="bg-white/80 border border-[#ea580c]/20 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#702600] mb-1">
            <span>Helena disse:</span>
            <span className="font-bold text-[#ea580c] text-sm tabular-nums">
              {dados.valorCliente}
            </span>
          </div>
          <p className="text-[#1c1c1c] text-xs italic leading-relaxed">
            "{dados.falaCliente}"
          </p>
        </div>

        {/* Bloco 2: Documento (Planta/Código) */}
        <div className="bg-white/80 border border-[#ea580c]/20 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1c1c1c] mb-1">
            <span className="flex items-center gap-1 text-[#0d787e]">
              <BookOpen size={13} aria-hidden="true" />
              Documento ({dados.docArtigo})
            </span>
            <span className="font-bold text-[#0d787e] text-sm tabular-nums">
              {dados.valorModelo}
            </span>
          </div>
          <p className="text-[#656666] text-xs italic leading-relaxed">
            "{dados.docTexto}"
          </p>
        </div>
      </div>

      {/* Ações com hierarquia clara: Primário, Secundário, Terciário */}
      <div className="pt-0.5 space-y-2">
        <div className="text-xs text-[#702600] font-medium">
          Reunião pausada. Como deseja registrar este parâmetro?
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Primário */}
          <button
            onClick={() => handleDecisao('aceitar_regra_local')}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check size={14} aria-hidden="true" />
            <span>Aceitar como regra local</span>
          </button>

          {/* Secundário */}
          <button
            onClick={() => handleDecisao('perguntar')}
            className="h-9 px-3 rounded-lg text-xs font-medium border border-[#dee0e0] bg-white hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Perguntar ao cliente</span>
          </button>

          {/* Terciário */}
          <button
            onClick={() => handleDecisao('ignorar')}
            className="h-9 px-2.5 text-xs font-medium text-[#656666] hover:text-[#1c1c1c] transition-colors cursor-pointer hover:underline"
          >
            Ignorar
          </button>
        </div>
      </div>
    </div>
  );
};
