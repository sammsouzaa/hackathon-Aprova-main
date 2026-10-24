/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PainelPrumo } from './PainelPrumo';
import { MascotePrumo } from './MascotePrumo';
import { useReuniao } from '../context/ReuniaoContext';
import {
  Wifi,
  Volume2,
  BatteryCharging,
  Monitor,
  Maximize2,
  Minimize2
} from 'lucide-react';

export const PreviewDesktop: React.FC = () => {
  const { janelaMaximizadaVertical, toggleMaximizarVertical, estado } = useReuniao();

  // Lê parâmetro de URL inicial (?desktop=0 desativa o preview de desktop para modo janela pura)
  const [modoDesktop, setModoDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('desktop') !== '0';
    }
    return true;
  });

  const [janelaAberta, setJanelaAberta] = useState<boolean>(true);

  // Se o usuário desativou modo desktop, exibe o painel em tela cheia (como na janela nativa do Electron)
  if (!modoDesktop) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#f5f7f7] relative">
        <PainelPrumo />

        {/* Botão flutuante discreto para alternar de volta ao preview desktop */}
        <button
          onClick={() => setModoDesktop(true)}
          className="fixed bottom-3 right-3 z-50 bg-[#1c1c1c]/90 hover:bg-[#1c1c1c] text-white text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all border border-white/10"
          title="Ver no ambiente desktop Linux simulado"
        >
          <Monitor size={13} aria-hidden="true" />
          <span>Ver desktop Linux</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#1c1c1c] flex flex-col overflow-hidden relative select-none font-sans">
      {/* 1. Barra Superior Realista do Sistema Linux (GNOME/Ubuntu) */}
      <div className="h-7 bg-[#121212]/95 border-b border-white/10 px-3.5 flex items-center justify-between text-white text-xs font-medium z-40 shrink-0">
        {/* Esquerda: Atividades e Apps */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white/90 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors">
            Atividades
          </span>
          <div className="hidden sm:flex items-center gap-2 text-white/50 text-[11px]">
            <span>Terminal</span>
            <span aria-hidden="true">·</span>
            <span>Arquivos</span>
            <span aria-hidden="true">·</span>
            <span className="text-white/80">Reunião (Helena Prado)</span>
          </div>
        </div>

        {/* Centro: Relógio do Sistema Fixo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white/90 font-medium tracking-tight text-xs tabular-nums">
          <span>Seg 26 Out</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">14:00</span>
        </div>

        {/* Direita: Ícones de Sistema e Bandeja (Tray) do Prumo */}
        <div className="flex items-center gap-3">
          {/* Seletor rápido de alternar maximização vertical */}
          <button
            onClick={toggleMaximizarVertical}
            className="text-white/70 hover:text-white text-[11px] hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title={
              janelaMaximizadaVertical
                ? 'Restaurar altura compacta da janela (640 px)'
                : 'Maximizar verticalmente até embaixo'
            }
          >
            {janelaMaximizadaVertical ? (
              <Minimize2 size={12} className="text-[#06929f]" aria-hidden="true" />
            ) : (
              <Maximize2 size={12} aria-hidden="true" />
            )}
            <span>
              {janelaMaximizadaVertical ? 'Restaurar 640px' : 'Maximizar vertical'}
            </span>
          </button>

          {/* Seletor rápido de modo janela 100% */}
          <button
            onClick={() => setModoDesktop(false)}
            className="text-white/60 hover:text-white text-[11px] hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Alternar para visualização 100% da janela (Electron nativo)"
          >
            <Maximize2 size={12} aria-hidden="true" />
            <span>Janela 100%</span>
          </button>

          <div className="flex items-center gap-2 text-white/70">
            <Wifi size={13} aria-hidden="true" />
            <Volume2 size={13} aria-hidden="true" />
            <div className="flex items-center gap-1 text-[11px] tabular-nums font-mono text-emerald-400">
              <BatteryCharging size={13} aria-hidden="true" />
              <span>98%</span>
            </div>
          </div>

          {/* ÍCONE DA BANDEJA (TRAY ICON) DO PRUMO COM INDICADOR */}
          <button
            onClick={() => setJanelaAberta(!janelaAberta)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all cursor-pointer relative ${
              janelaAberta
                ? 'bg-[#0d787e] text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-white/90'
            }`}
            title="Prumo - Clique para abrir ou fechar o painel"
            aria-label="Alternar janela do Prumo na bandeja"
          >
            <MascotePrumo size={18} />
            <span className="text-xs font-bold">Prumo</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                estado === 'em_reuniao'
                  ? 'bg-emerald-300 animate-pulse'
                  : estado === 'pausada'
                  ? 'bg-amber-400'
                  : 'bg-teal-300'
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* 2. Área de Trabalho Simulada do Linux (#1c1c1c) */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3 bg-gradient-to-br from-[#1c1c1c] via-[#242424] to-[#181818]">
        {/* Marca d'água sutil da área de trabalho */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 text-white text-center p-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-white/20 flex items-center justify-center mb-2">
            <Monitor size={32} aria-hidden="true" />
          </div>
          <div className="text-sm font-semibold tracking-wide">
            Área de Trabalho Linux (1440 × 900)
          </div>
          <div className="text-xs text-white/60 max-w-sm mt-1">
            Janela flutuante ancorada no canto da tela durante a conferência de alinhamento com o cliente.
          </div>
        </div>

        {/* 3. JANELA FLUTUANTE DO PRUMO (com cantos de 12 px e sombra 0 8px 24px rgba(0,0,0,0.16)) */}
        {janelaAberta ? (
          <div
            className={`absolute right-2 w-[480px] max-w-[calc(100vw-16px)] bg-[#f5f7f7] rounded-[12px] overflow-hidden border border-[#cacccc]/50 flex flex-col z-30 transition-all duration-150 animate-in fade-in zoom-in-95 ${
              janelaMaximizadaVertical
                ? 'top-2 bottom-2'
                : 'top-2 h-[640px] max-h-[calc(100vh-44px)]'
            }`}
            style={{
              boxShadow: '0 8px 24px rgba(0,0,0,0.16)'
            }}
          >
            <PainelPrumo />
          </div>
        ) : (
          /* Estado minimizado com dica de abertura */
          <div className="z-30 bg-[#2d2d2d] border border-white/10 text-white rounded-2xl p-5 shadow-2xl text-center max-w-xs animate-in fade-in duration-150">
            <MascotePrumo size={40} className="mx-auto mb-2.5" />
            <div className="font-bold text-xs mb-1">
              Prumo recolhido na bandeja
            </div>
            <p className="text-[11px] text-white/60 mb-3.5 leading-relaxed">
              O assistente continua acompanhando o diálogo em segundo plano. Clique no ícone na barra superior para reabrir.
            </p>
            <button
              onClick={() => setJanelaAberta(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Exibir painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
