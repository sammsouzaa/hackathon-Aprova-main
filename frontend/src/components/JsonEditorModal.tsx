import React, { useState } from 'react';
import { X, Code, Save, RotateCcw } from 'lucide-react';
import { DiffItem } from '../types';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffItems: DiffItem[];
  onSaveJson: (updatedJson: string) => void;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  diffItems,
  onSaveJson,
}) => {
  const initialJson = JSON.stringify(
    {
      schema_version: '2.1.0',
      cliente: 'ifpr-cascavel',
      target_service: 'alvara_construcao_civil',
      cloned_from: 'maringa_base_v1',
      mutations: diffItems.map(d => ({
        action: d.action,
        field_name: d.fieldName,
        label: d.label,
        category: d.category,
        details: d.details
      }))
    },
    null,
    2
  );

  const [jsonText, setJsonText] = useState(initialJson);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndSave = () => {
    try {
      JSON.parse(jsonText);
      setError(null);
      onSaveJson(jsonText);
      onClose();
    } catch (err: any) {
      setError(`Sintaxe JSON inválida: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white border border-[#cacccc] rounded-2xl shadow-xl flex flex-col overflow-hidden text-[#1c1c1c]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#dee0e0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e0f6f7] text-[#0d787e] flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1c1c1c]">
                Editor Low-Code do Esquema do Formulário
              </h3>
              <p className="text-[11px] text-[#656666]">
                Edite as mutações estruturais do motor de processos (ADS Form Builder)
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

        {/* Modal Body / Editor */}
        <div className="flex-1 p-5 bg-[#f5f7f7] flex flex-col min-h-[350px]">
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-[#ffebeb] border border-[#dc2626] text-[#ba1515] text-xs font-mono">
              {error}
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="flex-1 w-full p-4 bg-white border border-[#cacccc] rounded-xl text-xs font-mono text-[#074a4e] focus:outline-none focus:border-[#0d787e] leading-relaxed resize-none shadow-xs"
            spellCheck={false}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#dee0e0] bg-white flex items-center justify-between">
          <button
            onClick={() => setJsonText(initialJson)}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#f5f7f7] text-[#656666] hover:text-[#1c1c1c] text-xs font-medium border border-[#868787] flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-[#656666] hover:text-[#1c1c1c] text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleValidateAndSave}
              className="px-4 py-2 rounded-lg bg-[#0d787e] hover:bg-[#074a4e] text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar e Compilar Schema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
