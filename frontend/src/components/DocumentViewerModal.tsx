import React, { useEffect, useState } from 'react';
import { buscarArquivo, ConteudoArquivo } from '../api';
import { RawFile } from '../types';
import { 
  X, 
  FileText, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Volume2
} from 'lucide-react';

interface DocumentViewerModalProps {
  file: RawFile | null;
  fileName: string | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  file,
  fileName,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeLayer, setActiveLayer] = useState<'ocr' | 'raw'>('ocr');
  const [conteudo, setConteudo] = useState<ConteudoArquivo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setConteudo(null);
    setErro(null);
    if (!file?.apiName) return;
    buscarArquivo(file.apiName).then(setConteudo).catch(e => setErro(String(e)));
  }, [file?.apiName]);

  if (!fileName) return null;

  const isAudio = fileName.endsWith('.ogg') || fileName.endsWith('.mp3');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white border border-[#cacccc] rounded-2xl shadow-xl flex flex-col overflow-hidden text-[#1c1c1c]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#dee0e0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e0f6f7] text-[#0d787e] flex items-center justify-center">
              {isAudio ? <Volume2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1c1c1c]">
                  {file?.name ?? fileName}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#eefff9] text-[#055b40] border border-[#19bf8b]/40">
                  {file?.status === 'processed' ? 'Extração concluída' : 'Aguardando processamento'}
                </span>
              </div>
              <p className="text-[11px] text-[#656666]">
                Contexto do cliente · MeuLab
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#656666] hover:text-[#1c1c1c] hover:bg-[#f5f7f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar */}
        <div className="px-6 py-2.5 border-b border-[#dee0e0] bg-[#f5f7f7] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#656666]">Visualização:</span>
            <button
              onClick={() => setActiveLayer('ocr')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeLayer === 'ocr'
                  ? 'bg-[#0d787e] text-white'
                  : 'bg-white text-[#656666] hover:text-[#1c1c1c] border border-[#dee0e0]'
              }`}
            >
              Extração da IA
            </button>
            <button
              onClick={() => setActiveLayer('raw')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeLayer === 'raw'
                  ? 'bg-[#0d787e] text-white'
                  : 'bg-white text-[#656666] hover:text-[#1c1c1c] border border-[#dee0e0]'
              }`}
            >
              Documento Bruto
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(70, prev - 15))}
              className="p-1.5 rounded-lg text-[#656666] hover:text-[#1c1c1c] hover:bg-[#dee0e0]"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#1c1c1c] px-2 font-mono font-medium">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(160, prev + 15))}
              className="p-1.5 rounded-lg text-[#656666] hover:text-[#1c1c1c] hover:bg-[#dee0e0]"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#f5f7f7] flex items-center justify-center">
          <div 
            className="w-full max-w-2xl bg-white border border-[#cacccc] rounded-2xl p-6 shadow-sm transition-transform duration-150"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {!file?.apiName ? (
              <div className="text-xs text-[#656666] text-center py-8">
                Para adicionar documentos, copie os arquivos para <code>backend/contextos/{'<id>'}/arquivos</code> e chame <code>POST /contextos/{'{id}'}/processar</code>.
              </div>
            ) : erro ? (
              <div className="text-xs text-[#ba1515]">Não foi possível carregar o documento: {erro}</div>
            ) : !conteudo ? (
              <div className="text-xs text-[#656666] text-center py-8">Carregando documento...</div>
            ) : (
              <div className="space-y-3 text-xs text-[#1c1c1c]">
                <div className="text-[10px] text-[#656666] uppercase font-semibold">
                  {activeLayer === 'ocr' ? 'Extração feita pela IA de Contexto' : 'Conteúdo original do documento'}
                </div>
                <pre className="whitespace-pre-wrap font-sans leading-relaxed p-4 rounded-xl bg-[#f5f7f7] border border-[#cacccc]">
                  {activeLayer === 'ocr'
                    ? conteudo.extracao || 'Este arquivo ainda não foi processado.'
                    : conteudo.texto || 'Arquivo binário: sem pré-visualização de texto.'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#dee0e0] bg-[#f5f7f7] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#656666]">
            Dados fictícios · carregados do backend
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-[#f5f7f7] text-[#1c1c1c] border border-[#868787] font-medium"
          >
            Fechar Visualizador
          </button>
        </div>
      </div>
    </div>
  );
};
