/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DadosMensagemCompromisso } from '../../types';
import { useReuniao } from '../../context/ReuniaoContext';
import { CalendarCheck2, Check, Edit3 } from 'lucide-react';

interface MensagemCompromissoProps {
  id: string;
  dados: DadosMensagemCompromisso;
  timestamp: string;
}

export const MensagemCompromisso: React.FC<MensagemCompromissoProps> = ({
  id,
  dados,
  timestamp
}) => {
  const { confirmarCompromisso, editarPrazoCompromisso } = useReuniao();
  const [editando, setEditando] = useState(false);
  const [novoPrazoInput, setNovoPrazoInput] = useState(dados.prazo);

  const handleSalvarPrazo = () => {
    if (novoPrazoInput.trim()) {
      editarPrazoCompromisso(dados.compromissoId, novoPrazoInput.trim());
      setEditando(false);
    }
  };

  // Se confirmado, vira linha compacta: "✔ Compromisso confirmado · Marina · Planta atualizada até 29/10"
  if (dados.confirmado) {
    return (
      <div className="flex items-center justify-between gap-2 bg-[#eefff9] border border-[#a7f3d0] px-3 py-2 rounded-xl text-xs text-[#055b40] animate-in fade-in duration-150">
        <div className="flex items-center gap-2 truncate">
          <Check size={15} className="text-[#055b40] shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#055b40]">Compromisso confirmado:</span>
          <span className="truncate">
            {dados.responsavel} · {dados.titulo} até {dados.prazo.split(' ')[0] || dados.prazo}
          </span>
        </div>
        <span className="text-xs text-[#055b40]/80 tabular-nums font-mono shrink-0">
          {timestamp}
        </span>
      </div>
    );
  }

  // Cartão Completo de Compromisso Detectado
  return (
    <div className="bg-[#ebf4ff] border border-[#bfdbfe] rounded-2xl rounded-tl-sm p-3.5 text-xs text-[#1c1c1c] space-y-3 animate-in fade-in duration-150">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 text-xs text-[#0856af]">
        <div className="flex items-center gap-1.5 font-bold">
          <CalendarCheck2 size={15} className="text-[#0856af]" aria-hidden="true" />
          <span>Compromisso detectado</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#0856af]/80">
          <span>Análise gravada</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{timestamp}</span>
        </div>
      </div>

      {/* Linhas Chave-Valor Legíveis */}
      <div className="bg-white/80 border border-[#bfdbfe] p-3 rounded-xl space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-[#656666]">O quê:</span>
          <span className="font-semibold text-[#1c1c1c] text-right truncate">
            {dados.titulo}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 border-t border-[#dee0e0]/70 pt-1">
          <span className="text-xs text-[#656666]">Quem:</span>
          <span className="font-semibold text-[#1c1c1c] text-right">
            {dados.responsavel}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 border-t border-[#dee0e0]/70 pt-1">
          <span className="text-xs text-[#656666]">Prazo:</span>
          <span className="font-bold text-[#0856af] text-right tabular-nums">
            {dados.prazo} (em 3 dias)
          </span>
        </div>
      </div>

      {/* Edição inline de prazo ou Ações Confirmar / Editar */}
      {editando ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={novoPrazoInput}
            onChange={(e) => setNovoPrazoInput(e.target.value)}
            className="h-9 text-xs px-3 border border-[#cacccc] rounded-lg flex-1 bg-white focus:border-[#0d787e]"
            placeholder="Ex: 29/10/2026"
            autoFocus
          />
          <button
            onClick={handleSalvarPrazo}
            className="h-9 px-3.5 rounded-lg bg-[#0d787e] text-white text-xs font-semibold cursor-pointer"
          >
            Salvar
          </button>
          <button
            onClick={() => setEditando(false)}
            className="h-9 px-3 rounded-lg border border-[#dee0e0] bg-white text-xs text-[#656666] hover:bg-[#f5f7f7] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <button
            onClick={() => setEditando(true)}
            className="h-9 px-3 rounded-lg text-xs font-medium border border-[#dee0e0] bg-white hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 size={13} aria-hidden="true" />
            <span>Editar prazo</span>
          </button>
          <button
            onClick={() => confirmarCompromisso(id, dados.compromissoId)}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check size={14} aria-hidden="true" />
            <span>Confirmar</span>
          </button>
        </div>
      )}
    </div>
  );
};
