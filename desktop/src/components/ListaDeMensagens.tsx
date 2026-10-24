/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { MensagemTexto } from './mensagens/MensagemTexto';
import { MensagemItemMarcado } from './mensagens/MensagemItemMarcado';
import { MensagemContradicao } from './mensagens/MensagemContradicao';
import { MensagemCompromisso } from './mensagens/MensagemCompromisso';
import { MensagemLacunas } from './mensagens/MensagemLacunas';
import { MensagemResumo } from './mensagens/MensagemResumo';
import { MensagemLembrete } from './mensagens/MensagemLembrete';
import { MensagemUsuario } from './mensagens/MensagemUsuario';
import { MensagemPerguntaResposta } from './mensagens/MensagemPerguntaResposta';
import { MensagemPendencia } from './mensagens/MensagemPendencia';
import { CardAvisoGravacao } from './CardAvisoGravacao';
import { ArrowDown } from 'lucide-react';
import { MascotePrumo } from './MascotePrumo';

export const ListaDeMensagens: React.FC = () => {
  const { mensagens, estado, analisandoFala } = useReuniao();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [usuarioNoFundo, setUsuarioNoFundo] = useState(true);
  const [temNovasMensagensAbaixo, setTemNovasMensagensAbaixo] = useState(false);
  const totalMensagensAnterior = useRef(mensagens.length);

  // Monitora rolagem do usuário
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Se a distância até o fundo for menor que 60px, consideramos que o usuário está no fundo
    const estaNoFundo = scrollHeight - scrollTop - clientHeight < 60;
    setUsuarioNoFundo(estaNoFundo);
    if (estaNoFundo) {
      setTemNovasMensagensAbaixo(false);
    }
  }, []);

  // Rolagem automática só se a usuária já estiver no final
  useEffect(() => {
    if (mensagens.length > totalMensagensAnterior.current) {
      if (usuarioNoFundo) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTemNovasMensagensAbaixo(false);
      } else {
        setTemNovasMensagensAbaixo(true);
      }
      totalMensagensAnterior.current = mensagens.length;
    }
  }, [mensagens, usuarioNoFundo]);

  // Se o estado mudar para preparando ou concluida, rola para baixo
  useEffect(() => {
    if (usuarioNoFundo) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [estado, usuarioNoFundo]);

  const rolarParaOFundo = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTemNovasMensagensAbaixo(false);
    setUsuarioNoFundo(true);
  };

  return (
    <div className="flex-1 relative flex flex-col min-h-0 bg-[#f5f7f7]">
      {/* Container de Mensagens com acessibilidade role="log" e aria-live="polite" */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 select-text"
      >
        {/* Separador de dia calmo no topo */}
        <div className="flex items-center justify-center my-1 select-none">
          <span className="text-[11px] font-medium text-[#656666] bg-white border border-[#dee0e0] px-2.5 py-0.5 rounded-full">
            Hoje, 26/10
          </span>
        </div>

        {/* Lista de Mensagens */}
        {mensagens.map((msg, index) => {
          // Agrupamento de mensagens consecutivas do Prumo sob um único avatar
          const remetenteAnterior = index > 0 ? mensagens[index - 1].remetente : null;
          const ehPrimeiraDoGrupoPrumo =
            msg.remetente === 'prumo' && remetenteAnterior !== 'prumo';

          switch (msg.tipo) {
            case 'texto':
              return (
                <MensagemTexto
                  key={msg.id}
                  texto={msg.dados.texto}
                  timestamp={msg.timestamp}
                  fonteAnalise={msg.fonteAnalise}
                  mostrarAvatar={ehPrimeiraDoGrupoPrumo}
                />
              );

            case 'item_marcado':
              return (
                <MensagemItemMarcado
                  key={msg.id}
                  id={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                />
              );

            case 'contradicao':
              return (
                <MensagemContradicao
                  key={msg.id}
                  id={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                />
              );

            case 'compromisso':
              return (
                <MensagemCompromisso
                  key={msg.id}
                  id={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                />
              );

            case 'lacunas':
              return (
                <MensagemLacunas
                  key={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                  mostrarAvatar={ehPrimeiraDoGrupoPrumo}
                />
              );

            case 'resumo':
              return (
                <MensagemResumo
                  key={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                  mostrarAvatar={ehPrimeiraDoGrupoPrumo}
                />
              );

            case 'lembrete':
              return (
                <MensagemLembrete
                  key={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                />
              );

            case 'usuario':
              return (
                <MensagemUsuario
                  key={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                />
              );

            case 'pergunta_resposta':
              return (
                <MensagemPerguntaResposta
                  key={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                  mostrarAvatar={ehPrimeiraDoGrupoPrumo}
                />
              );

            case 'pendencia':
              return (
                <MensagemPendencia
                  key={msg.id}
                  dados={msg.dados}
                  timestamp={msg.timestamp}
                />
              );

            default:
              return null;
          }
        })}

        {/* Indicador de digitação/análise ("Analisando a fala...") com 3 pontos suaves */}
        {analisandoFala && estado === 'em_reuniao' && (
          <div className="flex items-center gap-2.5 max-w-[94%] animate-in fade-in duration-150">
            <div className="w-7 shrink-0">
              <MascotePrumo size={28} className="mt-0.5" estado="atento" />
            </div>
            <div className="bg-[#e6f5f8] border border-[#0891b2]/20 rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs text-[#0e7490] flex items-center gap-2">
              <span className="font-medium">Analisando a fala...</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Cartão de Aviso de Gravação e Preparação durante o estado Preparando */}
        {estado === 'preparando' && <CardAvisoGravacao />}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Pílula sutil flutuante "Novas mensagens ↓" quando o usuário rolou para cima */}
      {temNovasMensagensAbaixo && (
        <button
          onClick={rolarParaOFundo}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-[#0d787e] border border-[#0d787e] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-[#e6f5f8] transition-all z-20 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span>Novas mensagens</span>
          <ArrowDown size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
