/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { X, Paperclip, Send, User, CheckCircle2 } from 'lucide-react';

export const PainelTicketSimulado: React.FC = () => {
  const {
    painelTicketAberto,
    fecharTicketSimulado,
    concluirTicketSimulado,
    ticketIdSelecionado
  } = useReuniao();

  const [resposta, setResposta] = useState(
    'Olá Marina, segue em anexo a planta atualizada do zoneamento urbano de Serra do Sabiá (versão out/2026). Qualquer dúvida estamos à disposição.'
  );
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false);

  // Fecha o painel ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && painelTicketAberto) {
        fecharTicketSimulado();
      }
    };
    if (painelTicketAberto) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [painelTicketAberto, fecharTicketSimulado]);

  if (!painelTicketAberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resposta.trim()) {
      setEnviadoComSucesso(true);
      setTimeout(() => {
        concluirTicketSimulado(ticketIdSelecionado || 'TCK-8841', resposta.trim());
        setEnviadoComSucesso(false);
      }, 700);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#dee0e0] shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="h-12 border-b border-[#dee0e0] px-4 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-[#0856af]">
              {ticketIdSelecionado || 'TCK-8841'}
            </span>
            <span className="text-[#cacccc]" aria-hidden="true">·</span>
            <span className="text-xs font-semibold text-[#1c1c1c]">
              Ticket simulado
            </span>
          </div>
          <button
            onClick={fecharTicketSimulado}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#656666] hover:bg-[#f5f7f7] transition-colors cursor-pointer"
            aria-label="Fechar ticket"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Corpo do Ticket */}
        <div className="p-4 space-y-3.5 text-xs">
          {enviadoComSucesso ? (
            <div className="py-8 text-center space-y-2 animate-in fade-in duration-150">
              <CheckCircle2 size={36} className="text-[#055b40] mx-auto" aria-hidden="true" />
              <div className="font-bold text-sm text-[#1c1c1c]">
                Resposta enviada com sucesso!
              </div>
              <p className="text-xs text-[#656666]">
                O compromisso foi registrado e o anexo adicionado ao processo.
              </p>
            </div>
          ) : (
            <>
              {/* Pedido inicial da implantadora */}
              <div className="bg-[#f5f7f7] border border-[#dee0e0] rounded-xl p-3">
                <div className="flex items-center justify-between text-xs text-[#656666] mb-1.5">
                  <span className="font-semibold text-[#1c1c1c] flex items-center gap-1.5">
                    <User size={13} className="text-[#0d787e]" aria-hidden="true" />
                    <span>Marina Duarte (Implantadora)</span>
                  </span>
                  <span className="tabular-nums font-mono text-[11px]">26/10 · 14:30</span>
                </div>
                <p className="text-[#1c1c1c] leading-relaxed">
                  <strong>Solicitação:</strong> Envio da planta de zoneamento urbano atualizada de Serra do Sabiá para configuração do mapa temático.
                </p>
              </div>

              {/* Área de Resposta da Analista */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#1c1c1c]">
                      Resposta de Helena Prado (Prefeitura):
                    </span>
                    <span className="text-[11px] text-[#656666]">Simulação de envio</span>
                  </div>
                  <textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-white border border-[#dee0e0] rounded-xl text-xs leading-relaxed focus:border-[#0d787e] outline-none"
                    required
                  />
                </div>

                {/* Anexo Simulado em Chip */}
                <div className="bg-[#eefff9] border border-[#a7f3d0] rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#055b40]">
                    <Paperclip size={14} className="shrink-0" aria-hidden="true" />
                    <span className="font-semibold truncate">planta_zoneamento_v2.pdf</span>
                    <span className="text-[11px] text-[#656666]">(2.4 MB)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#055b40]">
                    Anexo pronto
                  </span>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dee0e0]">
                  <button
                    type="button"
                    onClick={fecharTicketSimulado}
                    className="h-9 px-3 rounded-lg text-xs font-medium border border-[#dee0e0] text-[#656666] hover:bg-[#f5f7f7] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={14} aria-hidden="true" />
                    <span>Enviar ticket (simulado)</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
