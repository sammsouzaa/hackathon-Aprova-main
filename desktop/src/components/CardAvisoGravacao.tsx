/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { useAoVivo } from '../context/AoVivoContext';
import { ModoEscuta } from '../types';
import { Play, CheckSquare, Square, Radio, FileText, Ear, Info, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const CardAvisoGravacao: React.FC = () => {
  const {
    modoEscuta,
    setModoEscuta,
    participantesAvisados,
    setParticipantesAvisados,
    iniciarReuniao,
    checklist
  } = useReuniao();

  const aoVivo = useAoVivo();
  const { snapshot } = aoVivo;

  const iniciarBtnRef = useRef<HTMLButtonElement>(null);
  const iniciandoRef = useRef(false);

  // Fonte "Ao vivo" no desktop: a reunião só começa com o modelo pronto e o áudio aberto.
  const captura = aoVivo.ativo && modoEscuta !== 'modo_notas';
  const abrindoAudio = snapshot.fase === 'iniciando';
  const aguardandoModelo = captura && snapshot.fase !== 'pronto';

  const clicarIniciar = async () => {
    if (iniciandoRef.current) return;
    iniciandoRef.current = true;
    try {
      if (captura) {
        const ok = await aoVivo.iniciar();
        if (!ok) return;
      }
      iniciarReuniao();
    } finally {
      iniciandoRef.current = false;
    }
  };

  const itensConfirmados = checklist.filter(
    (i) => i.status === 'confirmado_contexto' || i.status === 'respondido'
  );
  const itensFaltando = checklist.filter((i) => i.status === 'pendente');

  const opcoesModo: Array<{ id: ModoEscuta; rotulo: string; desc: string; icone: React.ReactNode }> = [
    {
      id: 'gravacao_com_aviso',
      rotulo: 'Gravação com aviso',
      desc: aoVivo.ativo
        ? aoVivo.viaApi
          ? 'Transcreve pela API do Prumo e salva o texto neste computador. O servidor pode guardar trechos de áudio que falharem.'
          : 'Transcreve e salva o texto em arquivo neste computador. O áudio não é guardado.'
        : 'Transcreve e gera ata automática com gravação segura',
      icone: <Radio size={15} className="text-[#0891b2]" aria-hidden="true" />
    },
    {
      id: 'escuta_sem_guardar',
      rotulo: 'Escuta sem guardar',
      desc: aoVivo.ativo
        ? aoVivo.viaApi
          ? 'Transcreve pela API sem guardar áudio. Neste computador o texto fica só na tela.'
          : 'Transcreve na tela e não salva nada em disco. O texto some ao reiniciar a demonstração.'
        : 'Extrai regras e descarta o áudio imediatamente',
      icone: <Ear size={15} className="text-[#0d787e]" aria-hidden="true" />
    },
    {
      id: 'modo_notas',
      rotulo: 'Modo notas',
      desc: aoVivo.ativo
        ? 'Não capta áudio e não transcreve: só anotações manuais.'
        : 'Apenas assiste anotações manuais sem captura de voz',
      icone: <FileText size={15} className="text-[#656666]" aria-hidden="true" />
    }
  ];

  const handleToggleAvisados = () => {
    const novoValor = !participantesAvisados;
    setParticipantesAvisados(novoValor);
    if (novoValor) {
      setTimeout(() => {
        iniciarBtnRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="bg-white border border-[#dee0e0] rounded-2xl p-4 text-xs leading-relaxed space-y-3.5 mb-2">
      {/* 1. Cabeçalho e Resumo do Checklist em Bloco Único */}
      <div>
        <div className="text-[11px] font-semibold text-[#0d787e] tracking-tight uppercase">
          Preparação da Sessão
        </div>
        <h3 className="font-bold text-sm text-[#1c1c1c] mt-0.5">
          {aoVivo.ativo && snapshot.contexto ? snapshot.contexto.nome : 'Alvará de Construção Residencial · Serra do Sabiá'}
        </h3>
        <p className="text-xs text-[#0d787e] font-semibold mt-1 tabular-nums">
          {itensConfirmados.length} de {checklist.length} já confirmados · {itensFaltando.length} a perguntar
        </p>
      </div>

      {/* 2. Aviso de Gravação com fundo #ebf4ff e ícone de informação */}
      <div className="bg-[#ebf4ff] border border-[#bfdbfe] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#0856af]">
        <Info size={16} className="text-[#0856af] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[#0856af]">Aviso de Acompanhamento: </span>
          O Prumo auxilia na conferência de regras de negócio em tempo real. Informe aos participantes sobre a assistência automatizada.
        </div>
      </div>

      {/* 3. Modos de Escuta em Cartões de Rádio Selecionáveis */}
      <div className="space-y-1.5">
        <div className="font-semibold text-xs text-[#1c1c1c]">
          Modo de escuta:
        </div>

        <div className="space-y-1.5" role="radiogroup" aria-label="Modo de escuta do Prumo">
          {opcoesModo.map((opcao) => {
            const selecionado = modoEscuta === opcao.id;
            return (
              <div
                key={opcao.id}
                role="radio"
                aria-checked={selecionado}
                tabIndex={0}
                onClick={() => setModoEscuta(opcao.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setModoEscuta(opcao.id);
                  }
                }}
                className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  selecionado
                    ? 'bg-[#f5f7f7] border-[#0d787e]'
                    : 'bg-white border-[#dee0e0] hover:bg-[#f9fafb]'
                }`}
              >
                <div className="mt-0.5">{opcao.icone}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-[#1c1c1c]">
                    {opcao.rotulo}
                  </div>
                  <div className="text-[11px] text-[#656666] leading-tight mt-0.5">
                    {opcao.desc}
                  </div>
                </div>
                <div className="mt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selecionado
                        ? 'border-[#0d787e] bg-[#0d787e]'
                        : 'border-[#cacccc]'
                    }`}
                  >
                    {selecionado && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado do motor de transcrição (só com a fonte Ao vivo no desktop) */}
      {aoVivo.ativo && (
        <div
          className={`rounded-xl border p-2.5 flex items-start gap-2 text-[11px] leading-snug ${
            snapshot.erro ? 'bg-[#ffebeb] border-[#fca5a5] text-[#7f1d1d]' : 'bg-[#f5f7f7] border-[#dee0e0] text-[#1c1c1c]'
          }`}
          role="status"
          aria-live="polite"
        >
          {snapshot.erro ? (
            <AlertTriangle size={14} className="text-[#ba1515] shrink-0 mt-0.5" aria-hidden="true" />
          ) : modoEscuta === 'modo_notas' ? (
            <Info size={14} className="text-[#656666] shrink-0 mt-0.5" aria-hidden="true" />
          ) : snapshot.fase === 'pronto' ? (
            <CheckCircle2 size={14} className="text-[#055b40] shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Loader2 size={14} className="text-[#0d787e] shrink-0 mt-0.5 animate-spin" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            {snapshot.erro ? (
              <>
                <div className="font-semibold">{snapshot.erro}</div>
                {snapshot.origemDoErro === 'modelo' && (
                  <button
                    type="button"
                    onClick={aoVivo.prepararModelo}
                    className="mt-1.5 h-7 px-2.5 rounded-lg border border-[#fca5a5] bg-white text-[#7f1d1d] font-semibold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-[#fff5f5]"
                  >
                    <RefreshCw size={12} aria-hidden="true" /> Tentar de novo
                  </button>
                )}
              </>
            ) : modoEscuta === 'modo_notas' ? (
              <span>Modo notas: o Prumo não capta áudio nesta reunião.</span>
            ) : abrindoAudio ? (
              <span>Abrindo o microfone e o áudio da reunião…</span>
            ) : snapshot.fase === 'pronto' ? (
              <span>
                {aoVivo.viaApi ? (
                  <>
                    <span className="font-semibold">API do Prumo conectada.</span> O áudio da reunião será enviado ao servidor para transcrição e análise.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">API indisponível: usando o modelo local.</span> O áudio é processado neste computador, sem análise do checklist
                    {snapshot.motor.detalhe ? '' : '.'}
                  </>
                )}
              </span>
            ) : (
              <span>Conectando à API do Prumo (se não responder, carrega o modelo local). Pode levar alguns segundos.</span>
            )}
          </div>
        </div>
      )}

      {/* 4. Caixa de Seleção "Participantes avisados" com toque confortável (min-h 44px) */}
      <div
        role="checkbox"
        aria-checked={participantesAvisados}
        tabIndex={0}
        onClick={handleToggleAvisados}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggleAvisados();
          }
        }}
        className={`min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-colors select-none ${
          participantesAvisados
            ? 'bg-[#eefff9] border-[#a7f3d0] text-[#055b40]'
            : 'bg-[#f5f7f7] border-[#dee0e0] text-[#1c1c1c] hover:bg-white'
        }`}
      >
        <span className="shrink-0" aria-hidden="true">
          {participantesAvisados ? (
            <CheckSquare size={18} className="text-[#055b40]" />
          ) : (
            <Square size={18} className="text-[#656666]" />
          )}
        </span>
        <span className="text-xs font-semibold leading-tight">
          Participantes informados sobre o acompanhamento do Prumo
        </span>
      </div>

      {/* 5. Botão "Iniciar reunião": 44 px de altura, largura total, ganha foco ao marcar aviso */}
      <div className="pt-0.5">
        <button
          ref={iniciarBtnRef}
          onClick={clicarIniciar}
          disabled={!participantesAvisados || aguardandoModelo || abrindoAudio}
          className="w-full h-11 rounded-xl text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#1c1c1c] focus-visible:ring-offset-2"
        >
          {abrindoAudio ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Play size={15} fill="currentColor" aria-hidden="true" />
          )}
          <span>{abrindoAudio ? 'Abrindo o áudio…' : 'Iniciar reunião'}</span>
        </button>

        {!participantesAvisados ? (
          <p className="text-[11px] text-center text-[#656666] mt-1.5">
            Marque a confirmação de aviso para habilitar o início.
          </p>
        ) : (
          aguardandoModelo &&
          !snapshot.erro && (
            <p className="text-[11px] text-center text-[#656666] mt-1.5">
              O início libera quando o modelo terminar de carregar.
            </p>
          )
        )}
      </div>
    </div>
  );
};
