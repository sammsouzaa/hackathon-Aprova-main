/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { gerarResumo } from '../services/analisador';
import {
  X,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Calendar,
  AlertTriangle,
  Building2,
  ArrowLeft,
  Check
} from 'lucide-react';

export const PainelResumo: React.FC = () => {
  const {
    painelResumoAberto,
    setPainelResumoAberto,
    checklist,
    compromissos
  } = useReuniao();

  const [aprovado, setAprovado] = useState<boolean | null>(null);
  const [envioAgenteStatus, setEnvioAgenteStatus] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState(
    'Reunião produtiva. Helena Prado validou os parâmetros da ZR2 e registrou a regra local de 3m de recuo frontal e a obrigatoriedade de parecer do Conselho do Meio Ambiente.'
  );

  // Fecha o painel ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && painelResumoAberto) {
        setPainelResumoAberto(false);
      }
    };
    if (painelResumoAberto) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [painelResumoAberto, setPainelResumoAberto]);

  if (!painelResumoAberto) return null;

  const resumo = gerarResumo(checklist, compromissos);

  // Exportar JSON de verdade (download direto no navegador)
  const handleExportarJSON = () => {
    const dadosExportacao = {
      sistema: 'Prumo - Mascote de Reunião',
      versao: '1.1.0-desktop',
      exportadoEm: new Date().toISOString(),
      metadados: {
        municipio: resumo.municipio,
        processo: 'Alvará de Construção Residencial',
        dataReuniao: '2026-10-26T14:00:00',
        implantadora: resumo.implantadora,
        analistaCliente: resumo.analistaCliente,
        statusAprovacao: aprovado === true ? 'Aprovado' : aprovado === false ? 'Recusado' : 'Pendente de revisão'
      },
      observacoesImplantador: observacoes,
      coberturaChecklist: {
        indicador: resumo.cobertura,
        totalItens: resumo.totalItens,
        itensConfirmados: resumo.itensConfirmados,
        itensPendentes: resumo.itensPendentes
      },
      regrasConfirmadas: resumo.regrasPadraoConfirmadas.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        valorDefinido: r.valorRespondido || r.valorModelo,
        evidencia: r.evidencia || 'Validado conforme modelo base'
      })),
      regrasLocais: resumo.regrasLocais.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        especificidade: r.valorRespondido || r.valorModelo,
        evidencia: r.evidencia
      })),
      compromissosFirmados: resumo.compromissos.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        responsavel: c.responsavel,
        prazo: c.prazo,
        status: c.status
      })),
      pendenciasELacunas: resumo.pendencias.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        modeloReferencia: p.valorModelo
      }))
    };

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prumo-resumo-alvara-serra-do-sabia-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEnviarAgente = () => {
    setEnvioAgenteStatus('enviando');
    setTimeout(() => {
      setEnvioAgenteStatus('sucesso');
      setTimeout(() => setEnvioAgenteStatus(null), 4000);
    }, 500);
  };

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-[440px] bg-white h-full flex flex-col border-l border-[#dee0e0] animate-in slide-in-from-right duration-250">
        {/* Cabeçalho do Painel com Botão de Voltar no topo */}
        <div className="h-14 border-b border-[#dee0e0] px-4 flex items-center justify-between shrink-0 bg-white">
          <button
            onClick={() => setPainelResumoAberto(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0d787e] hover:text-[#074a4e] cursor-pointer"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#0d787e]" aria-hidden="true" />
            <h2 className="font-bold text-sm text-[#1c1c1c]">
              Resumo da Sessão
            </h2>
          </div>

          <button
            onClick={() => setPainelResumoAberto(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#656666] hover:bg-[#f5f7f7] transition-colors cursor-pointer"
            aria-label="Fechar resumo"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Conteúdo Rolável com Seções Limpas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Metadados da Sessão */}
          <div className="bg-[#f5f7f7] border border-[#dee0e0] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1c1c1c] text-xs flex items-center gap-1.5">
                <Building2 size={14} className="text-[#0d787e]" aria-hidden="true" />
                {resumo.municipio}
              </span>
              <span className="font-bold text-[#0d787e] tabular-nums font-mono">
                Cobertura {resumo.cobertura}
              </span>
            </div>
            <div className="text-xs text-[#656666] flex items-center justify-between">
              <span>Processo: <strong>Alvará Residencial</strong></span>
              <span>26/10/2026 · 14:00</span>
            </div>
            <div className="text-xs text-[#656666] pt-1.5 border-t border-[#dee0e0]/70 flex items-center justify-between">
              <span>Implantadora: {resumo.implantadora}</span>
              <span>Analista: {resumo.analistaCliente}</span>
            </div>
          </div>

          {/* Notificação de Status de Envio */}
          {envioAgenteStatus === 'sucesso' && (
            <div className="bg-[#eefff9] text-[#055b40] p-3 rounded-xl border border-[#a7f3d0] font-semibold text-xs flex items-center gap-2">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Envio ao agente (simulado): parâmetros despachados com sucesso.</span>
            </div>
          )}

          {/* Seção 1: Regras Locais */}
          <div className="space-y-1.5">
            <div className="font-bold text-xs text-[#702600] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#ea580c]" aria-hidden="true" />
              Regras locais ({resumo.regrasLocais.length})
            </div>
            <div className="space-y-2">
              {resumo.regrasLocais.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#ffefe7] border border-[#ea580c]/30 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between font-bold text-[#1c1c1c]">
                    <span>{r.titulo}</span>
                    <span className="font-mono text-xs text-[#ea580c]">{r.id}</span>
                  </div>
                  <div className="text-[#702600] font-bold text-xs mt-1">
                    Definido: {r.valorRespondido || r.valorModelo}
                  </div>
                  {r.evidencia && (
                    <div className="text-xs text-[#656666] italic mt-1.5 border-l-2 border-[#ea580c]/50 pl-2">
                      "{r.evidencia}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Regras Confirmadas */}
          <div className="space-y-1.5">
            <div className="font-bold text-xs text-[#055b40] flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#055b40]" aria-hidden="true" />
              Regras confirmadas ({resumo.regrasPadraoConfirmadas.length})
            </div>
            <div className="bg-white border border-[#dee0e0] rounded-xl divide-y divide-[#dee0e0]">
              {resumo.regrasPadraoConfirmadas.map((r) => (
                <div key={r.id} className="p-2.5 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[#1c1c1c] text-xs">{r.titulo}</div>
                    <div className="text-xs text-[#0d787e] font-semibold mt-0.5">
                      {r.valorRespondido || r.valorModelo}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#656666] shrink-0">
                    {r.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Campos que mudam / Compromissos Firmados */}
          <div className="space-y-1.5">
            <div className="font-bold text-xs text-[#0856af] flex items-center gap-1.5">
              <Calendar size={14} className="text-[#0856af]" aria-hidden="true" />
              Campos que mudam e entregas ({resumo.compromissos.length})
            </div>
            <div className="space-y-2">
              {resumo.compromissos.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#ebf4ff] border border-[#bfdbfe] rounded-xl p-3 flex items-start justify-between"
                >
                  <div>
                    <div className="font-bold text-[#1c1c1c] text-xs">{c.titulo}</div>
                    <div className="text-xs text-[#656666] mt-0.5">
                      Responsável: {c.responsavel}
                    </div>
                    <div className="text-xs font-semibold text-[#0856af] mt-1 tabular-nums">
                      Prazo: {c.prazo}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      c.status === 'recebido'
                        ? 'bg-[#eefff9] text-[#055b40]'
                        : 'bg-white text-[#0856af] border border-[#bfdbfe]'
                    }`}
                  >
                    {c.status === 'recebido' ? (
                      <>
                        <Check size={12} aria-hidden="true" />
                        <span>Recebido</span>
                      </>
                    ) : (
                      'Pendente'
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 4: Pendências */}
          {resumo.pendencias.length > 0 && (
            <div className="space-y-1.5">
              <div className="font-bold text-xs text-[#ba1515] flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-[#ba1515]" aria-hidden="true" />
                Pendências ({resumo.pendencias.length})
              </div>
              <div className="bg-[#ffebeb] border border-[#fca5a5] rounded-xl p-2.5 space-y-1.5 text-xs">
                {resumo.pendencias.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="font-medium text-[#1c1c1c]">{p.titulo}</span>
                    <span className="font-mono text-xs text-[#ba1515]">{p.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações da Implantadora */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs text-[#1c1c1c] block">
              Observações da implantadora:
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-white border border-[#dee0e0] rounded-xl text-xs leading-relaxed focus:border-[#0d787e] outline-none"
            />
          </div>
        </div>

        {/* Rodapé Fixo:
            - Antes de aprovar: "Recusar" (secundário) e "Aprovar" (primário)
            - Depois de aprovado: "Exportar JSON" e "Enviar ao agente de implantação (simulado)"
        */}
        <div className="p-3.5 border-t border-[#dee0e0] bg-white shrink-0">
          {aprovado !== true ? (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setAprovado(false)}
                className={`flex-1 h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  aprovado === false
                    ? 'bg-[#ba1515] text-white border-[#ba1515]'
                    : 'bg-white text-[#ba1515] border-[#dee0e0] hover:bg-[#ffebeb]'
                }`}
              >
                <XCircle size={15} aria-hidden="true" />
                <span>Recusar</span>
              </button>

              <button
                onClick={() => setAprovado(true)}
                className="flex-1 h-10 px-3 rounded-xl text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>Aprovar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-[#055b40] font-semibold flex items-center gap-1.5">
                <Check size={14} aria-hidden="true" />
                <span>Ata aprovada pela equipe técnica.</span>
              </div>
              <div className="flex items-center justify-between gap-2.5">
                <button
                  onClick={handleExportarJSON}
                  className="flex-1 h-10 px-3 rounded-xl text-xs font-semibold border border-[#dee0e0] bg-white hover:bg-[#f5f7f7] text-[#1c1c1c] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} className="text-[#0d787e]" aria-hidden="true" />
                  <span>Exportar JSON</span>
                </button>

                <button
                  onClick={handleEnviarAgente}
                  className="flex-1 h-10 px-3 rounded-xl text-xs font-semibold bg-[#0d787e] hover:bg-[#074a4e] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send size={14} aria-hidden="true" />
                  <span>Enviar ao agente (simulado)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
