/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { useAoVivo } from '../context/AoVivoContext';
import { Send, HelpCircle } from 'lucide-react';
import { MedidorNivelAudio } from './MedidorNivelAudio';

export const CampoDeMensagem: React.FC = () => {
  const { enviarMensagemUsuario, fonteFala, estado, falaMaisRecente, aoVivoReal, modoEscuta } = useReuniao();
  const aoVivo = useAoVivo();
  const { snapshot } = aoVivo;
  const viaApi = aoVivo.snapshot.transcricaoPor === 'api' && snapshot.fase !== 'concluida';
  const [texto, setTexto] = useState('');

  // Na reunião com a API, a pergunta vai ao copiloto dela (usa o contexto e a transcrição).
  const enviar = (pergunta: string) => (viaApi ? void aoVivo.perguntar(pergunta) : enviarMensagemUsuario(pergunta));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (texto.trim()) {
      enviar(texto.trim());
      setTexto('');
    }
  };

  const handleSugestao = (pergunta: string) => {
    enviar(pergunta);
  };

  const sugestoes = viaApi && snapshot.copiloto?.perguntas_rapidas?.length ? snapshot.copiloto.perguntas_rapidas.slice(0, 3) : ['Qual o recuo?', 'Qual a taxa?', 'Qual o prazo?'];

  // "Ao vivo" fora do desktop roda o roteiro: o rótulo não pode dizer que está ouvindo de verdade.
  const rotuloFonte = fonteFala === 'audio_gravado' ? 'Áudio gravado' : 'Roteiro';

  // Estado real da captura ao vivo (só a fase 'gravando' pode dizer "Transcrevendo").
  const statusAoVivo = (() => {
    if (!aoVivoReal) return null;
    if (modoEscuta === 'modo_notas' && estado !== 'preparando') return { rotulo: 'Modo notas', detalhe: 'sem áudio', ativo: false };
    switch (snapshot.fase) {
      case 'gravando':
        return { rotulo: 'Transcrevendo', detalhe: viaApi ? 'API' : 'local', ativo: true };
      case 'pausada':
        return { rotulo: 'Pausada', detalhe: '', ativo: false };
      case 'iniciando':
        return { rotulo: 'Abrindo o áudio…', detalhe: '', ativo: false };
      case 'finalizando':
        return { rotulo: 'Finalizando…', detalhe: '', ativo: false };
      case 'concluida':
        return { rotulo: 'Encerrada', detalhe: '', ativo: false };
      default:
        return { rotulo: 'Áudio desligado', detalhe: '', ativo: false };
    }
  })();
  const medidorVisivel = snapshot.fase === 'gravando' || snapshot.fase === 'pausada';

  const audioAtivo = estado === 'em_reuniao' && !!falaMaisRecente;

  return (
    <div className="bg-white border-t border-[#dee0e0] px-4 py-2.5 shrink-0 z-10 space-y-2 select-none">
      {/* Sugestões rápidas compactas */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
        <span className="text-[#656666] flex items-center gap-1 shrink-0 font-medium text-xs">
          <HelpCircle size={13} className="text-[#0d787e]" aria-hidden="true" /> Rápido:
        </span>
        {sugestoes.map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => handleSugestao(sug)}
            className="px-2.5 py-1 rounded-lg bg-[#f5f7f7] hover:bg-[#e6f5f8] text-[#0e7490] border border-[#dee0e0] hover:border-[#0891b2] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Campo de texto de 44 px com cantos 20 px, fundo #f9fafb, borda #cacccc */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte algo rápido"
          className="flex-1 h-11 px-4 text-xs bg-[#f9fafb] hover:bg-white focus:bg-white border border-[#cacccc] rounded-[20px] transition-colors placeholder:text-[#656666] outline-none focus-visible:ring-2 focus-visible:ring-[#1c1c1c] focus-visible:ring-offset-2"
        />
        <button
          type="submit"
          disabled={!texto.trim()}
          aria-label="Enviar mensagem"
          className="w-10 h-10 rounded-full bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 focus-visible:ring-2 focus-visible:ring-[#1c1c1c] focus-visible:ring-offset-2"
          title="Enviar pergunta rápida"
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </form>

      {/* Faixa de status logo abaixo do campo */}
      <div className="flex items-center justify-between text-xs text-[#656666] pt-0.5">
        {/* Esquerda: Ponto verde com "Ouvindo · fonte: Roteiro" + barras de áudio oscilantes */}
        <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${statusAoVivo && !statusAoVivo.ativo ? 'bg-[#cacccc]' : 'bg-[#055b40]'}`}
            aria-hidden="true"
          />
          <span className="font-medium text-[#1c1c1c]">{statusAoVivo ? statusAoVivo.rotulo : 'Ouvindo'}</span>
          {(!statusAoVivo || statusAoVivo.detalhe) && (
            <>
              <span className="text-[#cacccc]" aria-hidden="true">·</span>
              <span className="truncate">{statusAoVivo ? statusAoVivo.detalhe : `fonte: ${rotuloFonte}`}</span>
            </>
          )}

          {/* Medidor de nível real para os dois canais no modo Ao vivo, ou barras discretas no roteiro */}
          {aoVivoReal ? (
            <div className="ml-2 shrink-0">
              <MedidorNivelAudio visivel={medidorVisivel} />
            </div>
          ) : audioAtivo && (
            <div className="flex items-center gap-0.5 ml-1 h-3 shrink-0" aria-hidden="true">
              <span className="w-0.5 bg-[#0d787e] rounded-full audio-bar-1" />
              <span className="w-0.5 bg-[#0d787e] rounded-full audio-bar-2" />
              <span className="w-0.5 bg-[#0d787e] rounded-full audio-bar-3" />
            </div>
          )}
        </div>

        {/* Direita: Selo obrigatório em 12 px neutro */}
        <span className="text-xs text-[#656666] shrink-0 ml-2">
          {aoVivoReal ? 'Protótipo demonstrativo · só a fala é real' : 'Protótipo demonstrativo · dados fictícios'}
        </span>
      </div>
    </div>
  );
};
