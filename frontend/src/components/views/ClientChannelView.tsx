import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  FileText, 
  Send, 
  Paperclip, 
  ChevronDown, 
  ChevronUp, 
  Users,
  Eye,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { Confianca, nomeExibicao, separarConfianca } from '../../api';

interface ClientChannelViewProps {
  title: string;
  subtitle: string;
  placeholder: string;
  variant?: 'ia' | 'cliente';
  typing?: boolean; // a IA está respondendo
  quickQuestions?: string[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendCobrança: () => void;
  onOpenFileModal: (fileName: string) => void;
  onNavigateToContextWithRule: (ruleId: string) => void;
}

const iniciais = (nome: string) =>
  nome.replace(/\(.*?\)|Profa?\./g, '').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

// Avatar do remetente: a IA ganha o ícone, pessoas ganham as iniciais.
const Avatar: React.FC<{ msg: ChatMessage }> = ({ msg }) =>
  msg.aiProcessed ? (
    <div className="w-8 h-8 rounded-full bg-[#0d787e] text-white flex items-center justify-center shrink-0">
      <Sparkles className="w-4 h-4" />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-[#e0f6f7] text-[#074a4e] border border-[#14bac4]/40 flex items-center justify-center shrink-0 text-[11px] font-bold">
      {iniciais(msg.sender)}
    </div>
  );

const ETIQUETAS: Record<Confianca, { rotulo: string; classe: string }> = {
  confirmado: { rotulo: 'Confirmado no material', classe: 'bg-[#eefff9] text-[#055b40] border-[#19bf8b]/40' },
  pendente: { rotulo: 'Pendente com o cliente', classe: 'bg-[#fff8eb] text-[#8a5300] border-[#f0a020]/40' },
  nao_consta: { rotulo: 'Não consta no material', classe: 'bg-[#f5f7f7] text-[#656666] border-[#dee0e0]' },
};

// "[[arquivo.md]]" vira um chip que abre o documento no visualizador.
const comCitacoes = (linha: string, onAbrir?: (nome: string) => void): React.ReactNode[] =>
  linha.split(/(\[\[[^\]]+\]\])/g).filter(Boolean).map((parte, i) => {
    const m = parte.match(/^\[\[([^\]]+)\]\]$/);
    if (!m) return parte;
    return (
      <button
        key={i}
        type="button"
        onClick={() => onAbrir?.(m[1])}
        title="Abrir documento"
        className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-md border border-[#14bac4]/40 bg-[#e0f6f7] text-[#074a4e] hover:bg-[#c9eef0] text-[11px] font-medium align-middle cursor-pointer"
      >
        <FileText className="w-3 h-3" />
        {nomeExibicao(m[1])}
      </button>
    );
  });

// Linhas que começam com "- " viram lista; o resto vira parágrafo.
const TextoFormatado: React.FC<{ texto: string; onAbrir?: (nome: string) => void }> = ({ texto, onAbrir }) => {
  const blocos: React.ReactNode[] = [];
  let lista: string[] = [];
  const fecharLista = () => {
    if (lista.length) {
      blocos.push(
        <ul key={`l${blocos.length}`} className="space-y-1 pl-4 list-disc marker:text-[#0d787e]">
          {lista.map((item, i) => <li key={i}>{comCitacoes(item, onAbrir)}</li>)}
        </ul>
      );
      lista = [];
    }
  };
  texto.split('\n').forEach((linha) => {
    const t = linha.trim();
    if (/^[-•*]\s+/.test(t)) lista.push(t.replace(/^[-•*]\s+/, ''));
    else {
      fecharLista();
      if (t) blocos.push(<p key={`p${blocos.length}`}>{comCitacoes(t, onAbrir)}</p>);
    }
  });
  fecharLista();
  return <div className="space-y-2">{blocos}</div>;
};

export const ClientChannelView: React.FC<ClientChannelViewProps> = ({
  title,
  subtitle,
  placeholder,
  variant = 'cliente',
  typing = false,
  quickQuestions = [],
  messages,
  onSendMessage,
  onOpenFileModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typing]);

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
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f7f7] text-[#1c1c1c] overflow-hidden">
      {/* 1. Cabeçalho Oficial do Canal de Fiscalização (Padrão Corporativo Limpo ADS) */}
      <header className="h-16 border-b border-[#dee0e0] px-8 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            variant === 'ia' ? 'bg-[#0d787e] text-white' : 'bg-[#e0f6f7] text-[#0d787e] border border-[#14bac4]/40'
          }`}>
            {variant === 'ia' ? <Sparkles className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1c1c1c]">
                {title}
              </h2>
            </div>
            <p className="text-xs text-[#656666]">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-[#656666]">
          <span className="font-semibold text-[#1c1c1c]">IFPR Cascavel</span> · Laboratórios
        </div>
      </header>

      {/* 2. Fluxo de Mensagens Institucionais */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-5">
          
          {/* Divisor de Data Oficial */}
          <div className="flex items-center justify-center my-2">
            <span className="px-3 py-1 rounded-full bg-white border border-[#dee0e0] text-[11px] font-medium text-[#656666]">
              24 de Outubro de 2026
            </span>
          </div>

          {messages.map((msg) => {
            const isOutgoing = msg.isOutgoing;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
              >
                {!isOutgoing && <Avatar msg={msg} />}
                <div className={`flex flex-col min-w-0 max-w-[80%] ${isOutgoing ? 'items-end' : 'items-start'}`}>
                {/* Identificação do Remetente */}
                <div className="flex items-center gap-2 mb-1 px-1 text-xs">
                  <span className={`font-semibold ${isOutgoing ? 'text-[#0d787e]' : 'text-[#1c1c1c]'}`}>
                    {msg.sender}
                  </span>
                  {!isOutgoing && msg.role && (
                    <span className="text-[11px] text-[#868787]">{msg.role}</span>
                  )}
                  <span className="text-[11px] text-[#868787]">· {msg.timestamp}</span>
                </div>

                {/* Balão de Mensagem de Texto */}
                {msg.text && (
                  <div
                    className={`text-[13px] leading-relaxed rounded-2xl px-4 py-3 ${
                      isOutgoing
                        ? 'bg-[#0d787e] text-white rounded-tr-md'
                        : 'bg-white border border-[#dee0e0] text-[#1c1c1c] rounded-tl-md shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                    }`}
                  >
                    {isOutgoing ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (() => {
                      const { confianca, corpo } = msg.aiProcessed ? separarConfianca(msg.text) : { confianca: null, corpo: msg.text };
                      return (
                        <>
                          {confianca && (
                            <span className={`inline-block mb-2 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${ETIQUETAS[confianca].classe}`}>
                              {ETIQUETAS[confianca].rotulo}
                            </span>
                          )}
                          <TextoFormatado texto={corpo} onAbrir={onOpenFileModal} />
                        </>
                      );
                    })()}
                    {isOutgoing && (
                      <div className="flex justify-end mt-1 text-white/70">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                )}

                {/* Mensagem de Áudio da Fiscalização (Design Sóbrio e Limpo) */}
                {msg.isAudio && (
                  <div className="w-full max-w-[85%] bg-white border border-[#cacccc] rounded-xl p-4 space-y-3 rounded-tl-none shadow-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="w-10 h-10 rounded-full bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        title={isPlayingAudio ? 'Pausar áudio' : 'Ouvir áudio'}
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-[#1c1c1c]">
                            Áudio do cliente
                          </span>
                          <span className="text-[11px] text-[#656666] font-mono">
                            {isPlayingAudio
                              ? `00:${Math.floor((audioProgress / 100) * 102).toString().padStart(2, '0')}`
                              : msg.audioDuration}
                          </span>
                        </div>

                        {/* Barra de Reprodução Contínua e Suave */}
                        <div className="w-full h-2 bg-[#dee0e0] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#0d787e] transition-all duration-300"
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transcrição Oficial Integrada */}
                    <div className="border-t border-[#dee0e0] pt-2.5">
                      <button
                        onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-[#074a4e] hover:text-[#0d787e] transition-colors cursor-pointer"
                      >
                        <span>Transcrição Formal do Áudio</span>
                        {isTranscriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isTranscriptOpen && (
                        <div className="mt-2 text-xs text-[#1c1c1c] leading-relaxed bg-[#f5f7f7] p-3 rounded-lg border border-[#dee0e0]">
                          <p className="italic text-[#404141]">
                            &quot;...acima de 500m² tem que pedir habite-se prévio, e se for posto de combustível é obrigatório independente da metragem conforme o Art. 42 da Lei 142/18...&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Anexo de Documento / Despacho Oficial */}
                {msg.isFile && (
                  <div className="w-full max-w-[85%] bg-white border border-[#cacccc] rounded-xl p-3.5 rounded-tl-none shadow-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#ebf4ff] border border-[#1d74d8]/20 flex items-center justify-center shrink-0 text-[#0856af]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1c1c1c] truncate">
                            {msg.fileName || 'Despacho com Anotações Técnicas (Dra. Helena)'}
                          </div>
                          <div className="text-[11px] text-[#656666]">
                            Despacho Jurídico · 3.4 MB · Anexo Homologado
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenFileModal(msg.fileName || 'Despacho com Anotações Técnicas (Dra. Helena)')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f7f7] hover:bg-[#dee0e0] border border-[#cacccc] text-xs font-medium text-[#1c1c1c] transition-colors shrink-0 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0d787e]" />
                        <span>Visualizar</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#0d787e] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start">
                <div className="mb-1 px-1 text-xs font-semibold text-[#1c1c1c]">IA de Contexto · MeuLab</div>
                <div className="bg-white border border-[#dee0e0] rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5" aria-label="IA digitando">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#0d787e] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                  <span className="ml-2 text-[11px] text-[#868787]">consultando os documentos...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. Barra de Digitação Institucional Limpa (Sem banners artificiais de cobrança) */}
      <footer className="p-4 border-t border-[#dee0e0] bg-white shrink-0">
        <div className="max-w-3xl mx-auto">
          {quickQuestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quickQuestions.map(q => (
                <button
                  key={q}
                  type="button"
                  disabled={typing}
                  onClick={() => onSendMessage(q)}
                  className="px-2.5 py-1 rounded-full border border-[#dee0e0] bg-white hover:border-[#0d787e] hover:text-[#0d787e] disabled:opacity-50 text-[11px] text-[#404141] transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#f5f7f7] border border-[#c4cbd1] rounded-xl p-1.5 focus-within:border-[#0d787e] focus-within:bg-white transition-colors">
            <button
              type="button"
              onClick={() => onOpenFileModal('Upload')}
              title="Anexar documento ou certidão"
              className="p-2 rounded-lg text-[#656666] hover:text-[#1c1c1c] hover:bg-[#dee0e0] transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent px-3 text-xs text-[#1c1c1c] placeholder-[#868787] focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || typing}
              className="px-3.5 py-2 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};
