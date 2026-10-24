/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MascotePrumo } from './MascotePrumo';
import { ControlesJanelaDesktop } from './ControlesJanelaDesktop';
import { SeletorDispositivosAudio } from './SeletorDispositivosAudio';
import { useReuniao } from '../context/ReuniaoContext';
import { useAoVivo } from '../context/AoVivoContext';
import { FonteFala } from '../types';
import {
  MoreVertical,
  Play,
  Pause,
  SkipForward,
  PowerOff,
  RotateCcw,
  Info,
  Sliders,
  CalendarDays,
  Maximize2,
  Minimize2,
  Check,
  FolderOpen,
  X
} from 'lucide-react';

export const CabecalhoPrumo: React.FC = () => {
  const {
    estado,
    tempoDecorrido,
    fonteFala,
    setFonteFala,
    pausarReuniao,
    retomarReuniao,
    avancarUmaFala,
    solicitarEncerramento,
    avancarTresDiasDemo,
    reiniciarDemonstracao,
    setPainelSobreAberto,
    janelaMaximizadaVertical,
    toggleMaximizarVertical,
    aoVivoReal,
    concluirAoVivo
  } = useReuniao();
  const aoVivo = useAoVivo();
  const { snapshot } = aoVivo;

  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmandoReiniciar, setConfirmandoReiniciar] = useState(false);
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false);

  // Ao vivo, encerrar fecha o arquivo da transcrição: pede um segundo toque e desiste sozinho.
  useEffect(() => {
    if (!confirmandoEncerrar) return;
    const t = setTimeout(() => setConfirmandoEncerrar(false), 5000);
    return () => clearTimeout(t);
  }, [confirmandoEncerrar]);
  useEffect(() => {
    setConfirmandoEncerrar(false);
  }, [estado]);

  const clicarEncerrar = () => {
    if (!aoVivoReal) {
      solicitarEncerramento();
      return;
    }
    if (!confirmandoEncerrar) {
      setConfirmandoEncerrar(true);
      return;
    }
    setConfirmandoEncerrar(false);
    concluirAoVivo();
  };

  // Troca de fonte no meio da reunião, de ou para o modo ao vivo, deixaria captura e roteiro desencontrados.
  const fonteTravada = (f: FonteFala) => estado !== 'preparando' && (aoVivoReal || f === 'ao_vivo');
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Fecha menu ao clicar fora ou apertar Esc
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
        setConfirmandoReiniciar(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuAberto) {
        setMenuAberto(false);
        setConfirmandoReiniciar(false);
        menuBtnRef.current?.focus();
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickFora);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuAberto]);

  // Formata tempo decorrido mm:ss com números tabulares
  const formatarTempo = useCallback((segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }, []);

  return (
    <header className="drag-region h-14 bg-white border-b border-[#dee0e0] px-4 flex items-center justify-between shrink-0 select-none z-20 relative">
      {/* Esquerda: Avatar 32px, Nome e Chip de Status Discreto */}
      <div className="flex items-center gap-2.5 min-w-0">
        <MascotePrumo
          size={32}
          estado={
            estado === 'concluida'
              ? 'sucesso'
              : estado === 'pausada'
              ? 'alerta'
              : 'atento'
          }
        />
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-[15px] tracking-tight text-[#1c1c1c]">
            Prumo
          </span>

          <span className="text-[#cacccc]" aria-hidden="true">·</span>

          {/* Status com ponto + texto conforme princípios de acessibilidade e escaneabilidade */}
          {estado === 'preparando' && (
            <div className="flex items-center gap-1.5 text-xs text-[#656666]">
              <span className="w-2 h-2 rounded-full bg-[#656666]" aria-hidden="true" />
              <span className="font-medium text-[#656666]">Preparando</span>
            </div>
          )}

          {estado === 'em_reuniao' && (
            <div className="flex items-center gap-1.5 text-xs text-[#055b40]">
              <span
                className="w-2 h-2 rounded-full bg-[#055b40] animate-pulse"
                aria-hidden="true"
              />
              <span className="font-semibold text-[#055b40]">Em reunião</span>
              <span className="tabular-nums font-mono text-[#055b40] font-medium">
                {formatarTempo(tempoDecorrido)}
              </span>
            </div>
          )}

          {estado === 'pausada' && (
            <div className="flex items-center gap-1.5 text-xs text-[#702600]">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" aria-hidden="true" />
              <span className="font-semibold text-[#702600]">Pausada</span>
              <span className="tabular-nums font-mono text-[#702600] font-medium">
                {formatarTempo(tempoDecorrido)}
              </span>
            </div>
          )}

          {estado === 'encerrando' && (
            <div className="flex items-center gap-1.5 text-xs text-[#702600]">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" aria-hidden="true" />
              <span className="font-semibold text-[#702600]">Revisando lacunas</span>
            </div>
          )}

          {estado === 'concluida' && (
            <div className="flex items-center gap-1.5 text-xs text-[#0e7490]">
              <span className="w-2 h-2 rounded-full bg-[#0891b2]" aria-hidden="true" />
              <span className="font-semibold text-[#0e7490]">
                {aoVivoReal && snapshot.fase === 'finalizando' ? 'Finalizando transcrição…' : 'Concluída'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Direita: Ações secundárias e Menu ⋯ (com classe no-drag) */}
      <div className="flex items-center gap-2 no-drag">
        {/* Botão Encerrar Reunião: secundário, em contorno, ícone + texto, visível só durante a reunião */}
        {(estado === 'em_reuniao' || estado === 'pausada') && (
          <button
            onClick={clicarEncerrar}
            className={`h-9 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              confirmandoEncerrar
                ? 'text-white bg-[#ba1515] hover:bg-[#991111] border-[#ba1515]'
                : 'text-[#ba1515] bg-white hover:bg-[#ffebeb] active:bg-[#fed7d7] border-[#dee0e0] hover:border-[#fca5a5]'
            }`}
            title={aoVivoReal ? 'Encerrar a reunião e fechar a transcrição' : 'Encerrar reunião e revisar lacunas'}
          >
            <PowerOff size={14} aria-hidden="true" />
            {confirmandoEncerrar ? (
              <span>Confirmar encerramento</span>
            ) : (
              <>
                <span className="hidden sm:inline">Encerrar reunião</span>
                <span className="sm:hidden">Encerrar</span>
              </>
            )}
          </button>
        )}

        {/* Botão de Maximizar / Restaurar Vertical (36 x 36 px): só no preview; no desktop a janela é do sistema */}
        {!window.prumoDesktop && (
        <button
          onClick={toggleMaximizarVertical}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#656666] hover:text-[#1c1c1c] hover:bg-[#f5f7f7] active:bg-[#dee0e0] transition-colors cursor-pointer border border-transparent hover:border-[#dee0e0]"
          title={
            janelaMaximizadaVertical
              ? 'Restaurar altura compacta (640 px)'
              : 'Maximizar verticalmente (ocupar todo espaço vertical até embaixo)'
          }
          aria-label={
            janelaMaximizadaVertical
              ? 'Restaurar altura compacta'
              : 'Maximizar verticalmente'
          }
        >
          {janelaMaximizadaVertical ? (
            <Minimize2 size={16} className="text-[#0d787e]" />
          ) : (
            <Maximize2 size={16} />
          )}
        </button>
        )}

        {/* Menu ⋯ (36 x 36 px) */}
        <div className="relative" ref={menuRef}>
          <button
            ref={menuBtnRef}
            onClick={() => {
              if (!menuAberto && aoVivoReal) void aoVivo.atualizarUltimoArquivo();
              setMenuAberto(!menuAberto);
              setConfirmandoReiniciar(false);
            }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
              menuAberto
                ? 'bg-[#f5f7f7] border-[#dee0e0] text-[#1c1c1c]'
                : 'border-transparent text-[#656666] hover:text-[#1c1c1c] hover:bg-[#f5f7f7]'
            }`}
            aria-label="Mais opções"
            aria-expanded={menuAberto}
            aria-haspopup="menu"
            title="Mais opções da demonstração"
          >
            <MoreVertical size={18} />
          </button>

          {/* Dropdown Popover de 240 px ancorado ao botão */}
          {menuAberto && (
            <div
              role="menu"
              className="absolute right-0 top-11 w-[240px] max-h-[calc(100vh-72px)] overflow-y-auto bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#dee0e0] py-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#656666] border-b border-[#dee0e0] flex items-center gap-1.5">
                <Sliders size={13} className="text-[#0d787e]" aria-hidden="true" />
                Controles da demonstração
              </div>

              {/* Controles de Reprodução */}
              <div className="px-2.5 py-2 border-b border-[#dee0e0]">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  {estado === 'em_reuniao' ? (
                    <button
                      role="menuitem"
                      onClick={() => {
                        pausarReuniao();
                        setMenuAberto(false);
                      }}
                      className="flex-1 h-8 px-2 rounded-lg bg-[#ffefe7] hover:bg-[#fbd5c6] text-[#702600] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Pause size={13} aria-hidden="true" /> Pausar
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      onClick={() => {
                        retomarReuniao();
                        setMenuAberto(false);
                      }}
                      disabled={estado === 'preparando' || estado === 'concluida'}
                      className="flex-1 h-8 px-2 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Play size={13} aria-hidden="true" /> Continuar
                    </button>
                  )}

                  <button
                    role="menuitem"
                    onClick={() => {
                      avancarUmaFala();
                      setMenuAberto(false);
                    }}
                    disabled={estado === 'concluida' || aoVivoReal}
                    title={aoVivoReal ? 'Indisponível na transcrição ao vivo: não há roteiro para avançar' : undefined}
                    className="flex-1 h-8 px-2 rounded-lg border border-[#dee0e0] hover:bg-[#f5f7f7] text-[#1c1c1c] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <SkipForward size={13} aria-hidden="true" /> Avançar fala
                  </button>
                </div>

                {/* Seletor de fonte da fala */}
                <div className="text-[11px] text-[#656666] mb-1 font-medium">
                  Fonte da fala:
                </div>
                <div className="grid grid-cols-3 gap-1 bg-[#f5f7f7] p-1 rounded-lg">
                  {(['roteiro', 'audio_gravado', 'ao_vivo'] as FonteFala[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFonteFala(f);
                        if (f !== 'ao_vivo') setMenuAberto(false);
                      }}
                      disabled={fonteTravada(f)}
                      title={fonteTravada(f) ? 'Não dá para trocar a fonte durante a reunião' : undefined}
                      className={`text-[11px] py-1 px-1 rounded text-center font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        fonteFala === f
                          ? 'bg-white text-[#0d787e] shadow-xs'
                          : 'text-[#656666] hover:text-[#1c1c1c]'
                      }`}
                    >
                      {f === 'roteiro'
                        ? 'Roteiro'
                        : f === 'audio_gravado'
                        ? 'Gravado'
                        : 'Ao vivo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seletor de dispositivos quando fonte for ao_vivo */}
              {fonteFala === 'ao_vivo' && <SeletorDispositivosAudio />}

              {/* Estado real da transcrição ao vivo: modelo, dispositivos e arquivo */}
              {aoVivoReal && (
                <div className="px-3 py-2 border-b border-[#dee0e0] text-[11px] text-[#656666] space-y-1.5">
                  <div className="font-bold uppercase tracking-wider text-[10px]">Transcrição ao vivo</div>
                  <div>
                    <span className="font-medium text-[#1c1c1c]">Transcrição:</span>{' '}
                    {snapshot.motor.nome === 'api-prumo' ? 'API do Prumo' : snapshot.motor.nome || 'Whisper'} ·{' '}
                    {snapshot.motor.estado === 'pronto'
                      ? 'pronto'
                      : snapshot.motor.estado === 'carregando'
                        ? 'carregando…'
                        : snapshot.motor.estado === 'erro'
                          ? 'com erro'
                          : 'não carregado'}
                  </div>
                  {snapshot.dispositivos.microfone && (
                    <div className="break-words">
                      <span className="font-medium text-[#1c1c1c]">Microfone:</span> {snapshot.dispositivos.microfone}
                    </div>
                  )}
                  {snapshot.dispositivos.monitor && (
                    <div className="break-words">
                      <span className="font-medium text-[#1c1c1c]">Reunião:</span> {snapshot.dispositivos.monitor}
                    </div>
                  )}
                  {aoVivo.ultimoArquivo && (
                    <div className="break-all select-text" title={aoVivo.ultimoArquivo}>
                      <span className="font-medium text-[#1c1c1c]">Último arquivo:</span> {aoVivo.ultimoArquivo}
                    </div>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => {
                      void aoVivo.abrirPastaDasTranscricoes();
                      setMenuAberto(false);
                    }}
                    className="w-full h-8 px-2 rounded-lg border border-[#dee0e0] hover:bg-[#f5f7f7] text-[#1c1c1c] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FolderOpen size={13} className="text-[#0d787e]" aria-hidden="true" /> Abrir pasta das transcrições
                  </button>
                </div>
              )}

              {/* Ação: Avançar 3 dias (demo) */}
              <button
                role="menuitem"
                onClick={() => {
                  avancarTresDiasDemo();
                  setMenuAberto(false);
                }}
                disabled={aoVivoReal}
                title={aoVivoReal ? 'Indisponível na transcrição ao vivo' : undefined}
                className="w-full px-3 py-2 text-left hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center gap-2.5 cursor-pointer font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CalendarDays size={14} className="text-[#0891b2]" aria-hidden="true" />
                <span>Avançar 3 dias (demo)</span>
              </button>

              {/* Ação: Maximizar/Restaurar Vertical (só no preview) */}
              {!window.prumoDesktop && (
              <button
                role="menuitem"
                onClick={() => {
                  toggleMaximizarVertical();
                  setMenuAberto(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
              >
                {janelaMaximizadaVertical ? (
                  <Minimize2 size={14} className="text-[#0d787e]" aria-hidden="true" />
                ) : (
                  <Maximize2 size={14} className="text-[#0d787e]" aria-hidden="true" />
                )}
                <span>
                  {janelaMaximizadaVertical
                    ? 'Restaurar 640 px'
                    : 'Maximizar vertical'}
                </span>
              </button>
              )}

              {/* Ação: Reiniciar reunião (com confirmação curta) */}
              {confirmandoReiniciar ? (
                <div className="px-3 py-2 bg-[#ffefe7] border-y border-[#ea580c]/30 text-xs">
                  <div className="font-semibold text-[#702600] mb-1.5">
                    Reiniciar do início?
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        reiniciarDemonstracao();
                        setMenuAberto(false);
                        setConfirmandoReiniciar(false);
                      }}
                      className="h-7 px-2.5 rounded bg-[#0d787e] text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={12} aria-hidden="true" /> Sim, reiniciar
                    </button>
                    <button
                      onClick={() => setConfirmandoReiniciar(false)}
                      className="h-7 px-2 rounded border border-[#dee0e0] bg-white text-[#656666] text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  role="menuitem"
                  onClick={() => setConfirmandoReiniciar(true)}
                  className="w-full px-3 py-2 text-left hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <RotateCcw size={14} className="text-[#656666]" aria-hidden="true" />
                  <span>Reiniciar demonstração</span>
                </button>
              )}

              {/* Ação: Sobre */}
              <button
                role="menuitem"
                onClick={() => {
                  setPainelSobreAberto(true);
                  setMenuAberto(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center gap-2.5 cursor-pointer border-t border-[#dee0e0] transition-colors"
              >
                <Info size={14} className="text-[#0856af]" aria-hidden="true" />
                <span>Sobre o Prumo</span>
              </button>
            </div>
          )}
        </div>

        {/* Controles da janela sem moldura: só existem no programa desktop (Electron) */}
        <ControlesJanelaDesktop />
      </div>
    </header>
  );
};
