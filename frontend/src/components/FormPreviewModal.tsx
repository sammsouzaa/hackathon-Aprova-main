import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Info,
  Calendar
} from 'lucide-react';

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffApplied: boolean;
}

export const FormPreviewModal: React.FC<FormPreviewModalProps> = ({
  isOpen,
  onClose,
  diffApplied,
}) => {
  const [area, setArea] = useState<number>(620);
  const [buildingType, setBuildingType] = useState<'comercial' | 'residencial' | 'posto'>('comercial');
  const [hasUploadedLaudo, setHasUploadedLaudo] = useState(false);

  if (!isOpen) return null;

  const isFirefighterReportRequired = area > 500 || buildingType === 'posto';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white border border-[#cacccc] rounded-2xl shadow-xl flex flex-col overflow-hidden text-[#1c1c1c]">
        {/* Modal Header (ADS Style) */}
        <div className="px-6 py-4 border-b border-[#dee0e0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e0f6f7] text-[#0d787e] flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1c1c1c]">
                  Simulador do Portal do Cidadão (Aprova Digital)
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#eefff9] text-[#055b40] border border-[#19bf8b]/40">
                  MeuLab Engine
                </span>
              </div>
              <p className="text-[11px] text-[#656666]">
                Visualize as regras e condicionais do formulário em execução real
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

        {/* Modal Body: The Live Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* Banner notification about the engine */}
          <div className="p-4 rounded-xl bg-[#e6f5f8] border border-[#0891b2]/30 flex items-start gap-3 text-xs text-[#074a4e]">
            <Sparkles className="w-4 h-4 text-[#0891b2] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Form Builder Reativo:</strong> Altere a área construída ou a finalidade do imóvel abaixo para testar o disparo condicional do campo de bombeiros (Art. 42 da Lei 142/18).
            </div>
          </div>

          {/* Simulated Form Container (ADS Card) */}
          <div className="p-6 rounded-2xl bg-[#f5f7f7] border border-[#cacccc] space-y-5">
            <div className="border-b border-[#dee0e0] pb-3">
              <span className="text-[11px] uppercase font-semibold text-[#656666]">Passo 2 de 4</span>
              <h4 className="text-sm font-bold text-[#1c1c1c]">Dados do Imóvel & Edificação</h4>
            </div>

            {/* Input 1: Finalidade da Edificação */}
            <div>
              <label className="block text-xs font-semibold text-[#1c1c1c] mb-2">
                Finalidade Principal da Atividade
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'residencial', label: 'Residencial' },
                  { id: 'comercial', label: 'Comercial / Serviços' },
                  { id: 'posto', label: 'Posto de Combustíveis' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setBuildingType(type.id as any)}
                    className={`py-2.5 px-3 text-xs rounded-lg border text-center transition-all ${
                      buildingType === type.id
                        ? 'bg-[#0d787e] border-[#0d787e] text-white font-medium shadow-xs'
                        : 'bg-white border-[#dee0e0] text-[#656666] hover:text-[#1c1c1c]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Área Construída Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#1c1c1c]">
                  Área Construída Total (m²)
                </label>
                <span className="text-xs font-bold text-[#0d787e] bg-white px-2.5 py-1 rounded-md border border-[#dee0e0]">
                  {area} m²
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full accent-[#0d787e] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#656666] mt-1">
                <span>50 m²</span>
                <span className="text-[#ea580c] font-medium">500 m² (Limiar de Bombeiros)</span>
                <span>2.000 m²</span>
              </div>
            </div>

            {/* Dynamic Conditional Field: Laudo Bombeiros */}
            {isFirefighterReportRequired ? (
              <div className="p-4 rounded-xl bg-[#eefff9] border border-[#19bf8b]/50 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#055b40]">
                    <CheckCircle2 className="w-4 h-4 text-[#19bf8b]" />
                    <span>Upload Obrigatório: Laudo do Corpo de Bombeiros</span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-[#055b40] border border-[#19bf8b]/40">
                    Condicional Ativada
                  </span>
                </div>

                <p className="text-xs text-[#055b40] leading-relaxed">
                  Para imóveis comerciais com área superior a 500m² ou postos de combustíveis, é indispensável a anexação do Laudo de Exame Preliminar do Corpo de Bombeiros (Art. 42 Lei 142/18).
                </p>

                <div className="border border-dashed border-[#19bf8b] rounded-xl p-5 bg-white flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#055b40] transition-colors">
                  <Upload className="w-6 h-6 text-[#0d787e] mb-1.5" />
                  <span className="text-xs font-semibold text-[#1c1c1c]">
                    {hasUploadedLaudo ? 'laudo_vistoria_bombeiros_aprovado.pdf' : 'Clique ou arraste o Laudo em PDF'}
                  </span>
                  <span className="text-[11px] text-[#656666] mt-0.5">
                    Máximo 15MB • Assinado Digitalmente
                  </span>
                  <button
                    type="button"
                    onClick={() => setHasUploadedLaudo(!hasUploadedLaudo)}
                    className="mt-2 text-xs text-[#0d787e] underline font-medium"
                  >
                    {hasUploadedLaudo ? 'Remover anexo' : 'Simular Anexo do Laudo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white border border-[#dee0e0] text-xs text-[#656666] flex items-center gap-2.5">
                <Info className="w-4 h-4 text-[#808b98]" />
                <span>
                  Laudo de Bombeiros dispensado (Área &le; 500m² e atividade residencial).
                </span>
              </div>
            )}

            {/* Field: Validade do Alvará */}
            <div className="p-3.5 rounded-xl bg-white border border-[#dee0e0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0d787e]" />
                <span className="text-[#1c1c1c] font-medium">Prazo de Validade do Alvará:</span>
              </div>
              <span className="font-bold text-[#074a4e] bg-[#e0f6f7] px-2.5 py-0.5 rounded-md border border-[#14bac4]/40">
                48 h (IFPR Cascavel)
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer (ADS Style) */}
        <div className="px-6 py-4 border-t border-[#dee0e0] bg-[#f5f7f7] flex items-center justify-between">
          <span className="text-[11px] text-[#656666]">
            Protótipo demonstrativo · dados fictícios
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-[#f5f7f7] text-xs font-medium text-[#1c1c1c] border border-[#868787]"
          >
            Fechar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
