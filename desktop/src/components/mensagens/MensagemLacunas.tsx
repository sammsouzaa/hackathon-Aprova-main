/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MascotePrumo } from '../MascotePrumo';
import { DadosMensagemLacunas } from '../../types';
import { useReuniao } from '../../context/ReuniaoContext';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';

interface MensagemLacunasProps {
  dados: DadosMensagemLacunas;
  timestamp: string;
  mostrarAvatar?: boolean;
}

export const MensagemLacunas: React.FC<MensagemLacunasProps> = ({
  dados,
  timestamp,
  mostrarAvatar = true
}) => {
  const { cancelarEncerramento, confirmarEncerramento, estado } = useReuniao();

  return (
    <div className="flex items-start gap-2.5 max-w-[96%] select-text animate-in fade-in duration-150">
      <div className="w-7 shrink-0">
        {mostrarAvatar ? (
          <MascotePrumo size={28} className="mt-0.5" estado="alerta" />
        ) : (
          <div className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      <div className="bg-white border border-[#dee0e0] rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed w-full">
        {/* Cabeçalho Limpo */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[#656666]">
          <div className="flex items-center gap-1.5 text-[#702600] font-semibold">
            <AlertCircle size={14} className="text-[#ea580c]" aria-hidden="true" />
            <span>Revisão de lacunas pendentes</span>
          </div>
          <span className="tabular-nums font-mono">{timestamp}</span>
        </div>

        <p className="text-xs text-[#1c1c1c] mb-2 font-medium">
          Ainda constam {dados.itensLacuna.length} itens não abordados no checklist:
        </p>

        {/* Lista de Lacunas */}
        <div className="space-y-1.5 mb-2.5">
          {dados.itensLacuna.map((lacuna) => (
            <div
              key={lacuna.id}
              className="bg-[#f5f7f7] border border-[#dee0e0] px-3 py-2 rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono font-bold text-[#0d787e] mr-1.5">{lacuna.id}</span>
                <span className="font-medium text-[#1c1c1c]">{lacuna.titulo}</span>
              </div>
              <span className="text-xs text-[#656666] italic">
                (modelo: {lacuna.valorModelo})
              </span>
            </div>
          ))}

          {dados.contradicoesAbertas > 0 && (
            <div className="bg-[#ffefe7] text-[#702600] px-3 py-2 rounded-xl text-xs font-medium">
              Atenção: Consta {dados.contradicoesAbertas} divergência sem decisão registrada.
            </div>
          )}
        </div>

        {/* Ações */}
        {estado === 'encerrando' ? (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dee0e0]">
            <button
              onClick={cancelarEncerramento}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>Voltar à reunião</span>
            </button>
            <button
              onClick={confirmarEncerramento}
              className="h-9 px-3 rounded-lg text-xs font-medium border border-[#dee0e0] bg-white hover:bg-[#ffebeb] text-[#ba1515] transition-colors cursor-pointer"
            >
              Encerrar mesmo assim
            </button>
          </div>
        ) : (
          <div className="text-xs text-[#055b40] font-medium flex items-center gap-1.5 pt-1.5 border-t border-[#dee0e0]">
            <Check size={14} aria-hidden="true" />
            <span>Encerramento processado com registro de lacunas.</span>
          </div>
        )}
      </div>
    </div>
  );
};
