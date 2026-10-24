import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  FileText, 
  Image as ImageIcon, 
  Send, 
  Paperclip, 
  Mic, 
  Sparkles, 
  CheckCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  ArrowUpRight,
  User,
  ExternalLink
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ClientChannelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendCobrança: () => void;
  onSelectRuleFromChat: (ruleId: string) => void;
  onOpenFileModal: (fileName: string) => void;
}

export const ClientChannel: React.FC<ClientChannelProps> = ({
  messages,
  onSendMessage,
  onSendCobrança,
  onSelectRuleFromChat,
  onOpenFileModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(38); // 38% for realistic feel
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.5x' | '2x'>('1.5x');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Audio simulation timer
  useEffect(() => {
    let timer: any;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const togglePlaybackSpeed = () => {
    if (playbackSpeed === '1x') setPlaybackSpeed('1.5x');
    else if (playbackSpeed === '1.5x') setPlaybackSpeed('2x');
    else setPlaybackSpeed('1x');
  };

  return (
    <section className="h-full flex flex-col bg-zinc-950 dark:bg-zinc-950 light:bg-slate-50 border-r border-zinc-800 dark:border-zinc-800 light:border-slate-200 overflow-hidden">
      {/* Column Header */}
      <div className="h-12 border-b border-zinc-800/80 px-3.5 flex items-center justify-between shrink-0 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs font-semibold text-zinc-200 dark:text-zinc-200 light:text-slate-800 flex items-center gap-1.5">
            <span>Canal de Entrada</span>
            <span className="text-[11px] text-zinc-400 font-normal font-mono">(WhatsApp & Chat)</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Grupo: [Obras - Alvarás]</span>
        </div>
      </div>

      {/* Feed Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
        {/* Context notice timestamp */}
        <div className="flex items-center justify-center my-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-900/80 px-2.5 py-0.5 rounded-full border border-zinc-800">
            Histórico Sincronizado com WhatsApp Oficial
          </span>
        </div>

        {messages.map((msg) => {
          const isOutgoing = msg.isOutgoing;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} group`}
            >
              {/* Sender label */}
              {!isOutgoing && (
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <span className="text-[11px] font-medium text-emerald-400 dark:text-emerald-400">
                    {msg.sender}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                    {msg.role}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              )}

              {isOutgoing && (
                <div className="flex items-center gap-1.5 mb-1 mr-1">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {msg.timestamp}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-300">
                    Você (Implantador)
                  </span>
                </div>
              )}

              {/* Text Message */}
              {msg.text && (
                <div
                  className={`max-w-[92%] text-xs leading-relaxed rounded-lg p-2.5 shadow-sm ${
                    isOutgoing
                      ? 'bg-indigo-600/90 text-indigo-50 border border-indigo-500/40 rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  {isOutgoing && (
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-200/80">
                      <span>WhatsApp Web Hook</span>
                      <CheckCheck className="w-3 h-3 text-sky-300" />
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp Audio Card */}
              {msg.isAudio && (
                <div className="w-full max-w-[94%] bg-zinc-900/95 border border-zinc-800 rounded-lg p-2.5 shadow-sm space-y-2 rounded-tl-none">
                  {/* Audio Player Controls */}
                  <div className="flex items-center gap-2.5">
                    {/* Play Button */}
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Waveform Visualization */}
                    <div className="flex-1 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-0.5 h-6">
                        {[
                          18, 35, 60, 42, 85, 95, 70, 50, 80, 100, 65, 45, 90, 75,
                          40, 60, 85, 90, 55, 30, 70, 88, 62, 40, 25, 45, 65, 80,
                          50, 30, 20
                        ].map((h, i) => {
                          const isPassed = (i / 31) * 100 <= audioProgress;
                          return (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all duration-150 ${
                                isPassed
                                  ? 'bg-emerald-400'
                                  : 'bg-zinc-700 group-hover:bg-zinc-600'
                              } ${isPlayingAudio ? 'animate-pulse' : ''}`}
                              style={{ height: `${Math.max(15, h * 0.22)}px` }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>
                          {isPlayingAudio
                            ? `00:${Math.floor((audioProgress / 100) * 102)
                                .toString()
                                .padStart(2, '0')}`
                            : msg.audioDuration}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={togglePlaybackSpeed}
                            className="px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono border border-zinc-700"
                          >
                            {playbackSpeed}
                          </button>
                          <Volume2 className="w-3 h-3 text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Retractable AI Transcription Tab */}
                  <div className="border-t border-zinc-800/80 pt-2">
                    <button
                      onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                      className="w-full flex items-center justify-between text-[11px] font-medium text-emerald-400/90 hover:text-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Transcrito pela IA de Contexto</span>
                      </div>
                      {isTranscriptOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isTranscriptOpen && (
                      <div className="mt-2 text-xs text-zinc-300 leading-relaxed bg-zinc-950/70 p-2.5 rounded border border-zinc-800/80">
                        <p className="italic font-serif">
                          &quot;...aqui acima de{' '}
                          <mark className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-mono font-semibold">
                            500m²
                          </mark>{' '}
                          tem que pedir habite-se prévio, e se for posto de combustível é obrigatório independente da metragem conforme o{' '}
                          <mark className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono font-semibold">
                            Art. 42 da Lei 142/18
                          </mark>
                          ...&quot;
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Confiança Whisper: 98.4%
                          </span>
                          <button
                            onClick={() => onSelectRuleFromChat('rule-1')}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 transition-colors"
                          >
                            <span>Ver Regra na Matriz</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Received File Card (e.g. Foto do Decreto Anotado) */}
              {msg.isFile && (
                <div className="w-full max-w-[92%] bg-zinc-900 border border-zinc-800 rounded-lg p-2 shadow-sm rounded-tl-none space-y-2">
                  <div
                    onClick={() => onOpenFileModal(msg.fileName || '')}
                    className="cursor-pointer group/file relative aspect-[16/9] w-full rounded bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center"
                  >
                    {/* Visual mockup of document with yellow highlighter lines */}
                    <div className="absolute inset-0 p-3 bg-amber-950/20 font-mono text-[9px] text-zinc-400 leading-relaxed overflow-hidden select-none opacity-80 group-hover/file:opacity-100 transition-opacity">
                      <div className="text-zinc-300 font-bold border-b border-zinc-800 pb-1 mb-1">
                        LEI Nº 142/2018 - SEC. URBANISMO
                      </div>
                      <div className="text-zinc-400">
                        Art. 8º Fica dispensada a exigência...
                      </div>
                      <div className="bg-amber-400/30 text-amber-200 px-1 my-0.5 border-l-2 border-amber-400">
                        *OBS MANUAL: Manter até 120m² unifamiliar (Decreto 15.992)
                      </div>
                      <div className="text-zinc-500">
                        § 1º O requerimento deverá ser assinado por...
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex items-end justify-between p-2">
                      <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-mono font-medium">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                        <span className="truncate">{msg.fileName}</span>
                      </div>
                      <span className="text-[10px] text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/80 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        Ampliar
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Sparkles className="w-3 h-3" />
                      Processado pela IA (2 regras)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">3.4 MB</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Rodapé 1 - Quick Billing Suggestion Bar */}
      <div className="p-2.5 border-t border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 light:bg-amber-50">
        <div className="flex items-start gap-2">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] leading-snug text-zinc-300 dark:text-zinc-300 light:text-amber-900">
              <strong className="text-amber-400 font-medium">Sugestão de Cobrança da IA:</strong> O cliente não enviou a tabela de taxas atualizada para a reunião de amanhã.
            </p>
            <button
              onClick={onSendCobrança}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[11px] font-medium transition-all shadow-sm active:scale-[0.99]"
            >
              <span>Disparar Cobrança Padrão no WhatsApp</span>
              <Send className="w-3 h-3 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé 2 - Message Input Field */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-zinc-800 bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-slate-100 flex items-center gap-2">
        <button
          type="button"
          title="Anexar documento ou evidência"
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Responder ao grupo oficial..."
            className="w-full h-8 pl-2.5 pr-8 text-xs bg-zinc-950 border border-zinc-800 dark:border-zinc-800 light:border-slate-300 dark:bg-zinc-950 light:bg-white rounded text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            title="Gravar nota de áudio"
            className={`absolute right-1 top-1 p-1 rounded transition-colors ${
              isRecording ? 'text-rose-400 animate-pulse' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="h-8 px-3 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-medium flex items-center justify-center transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </section>
  );
};
