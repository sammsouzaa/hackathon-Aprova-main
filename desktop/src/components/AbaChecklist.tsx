/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useReuniao } from '../context/ReuniaoContext';
import { useAoVivo } from '../context/AoVivoContext';
import { ItemChecklist } from '../types';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react';

export const AbaChecklist: React.FC = () => {
  const { checklist, alternarItemChecklistManual: alternarLocal, aoVivoReal } = useReuniao();
  const aoVivo = useAoVivo();
  const viaApi = aoVivo.viaApi && aoVivo.snapshot.transcricaoPor === 'api';
  // Com a API, marcar à mão grava na sessão dela (a análise não mexe mais no item); senão é local.
  const alternarItemChecklistManual = (id: string) => {
    if (!viaApi) return alternarLocal(id);
    const item = checklist.find((i) => i.id === id);
    const marcado = item?.status === 'respondido' || item?.status === 'confirmado_contexto' || item?.status === 'regra_local';
    void aoVivo.alternarItem(id, Boolean(marcado));
  };
  const [termoBusca, setTermoBusca] = useState('');
  const [itensExpandidos, setItensExpandidos] = useState<Record<string, boolean>>({});

  // Cálculo da cobertura
  const itensConcluidos = checklist.filter(
    (i) => i.status === 'confirmado_contexto' || i.status === 'respondido' || i.status === 'regra_local'
  );
  const total = checklist.length;
  const porcentagem = Math.round((itensConcluidos.length / total) * 100);

  // Toggle de expansão da gaveta de evidência
  const toggleGaveta = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItensExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtragem por busca
  const itensFiltrados = checklist.filter((item) => {
    if (!termoBusca.trim()) return true;
    const termo = termoBusca.toLowerCase();
    return (
      item.id.toLowerCase().includes(termo) ||
      item.titulo.toLowerCase().includes(termo) ||
      item.descricao.toLowerCase().includes(termo) ||
      item.valorModelo.toLowerCase().includes(termo) ||
      (item.valorRespondido && item.valorRespondido.toLowerCase().includes(termo))
    );
  });

  // Agrupamento em seções limpas sem cartões encaixados
  const grupoConfirmadosContexto = itensFiltrados.filter(
    (i) => i.status === 'confirmado_contexto'
  );
  const grupoRespondidosReuniao = itensFiltrados.filter(
    (i) => i.status === 'respondido' && !i.regraLocal
  );
  const grupoRegrasLocais = itensFiltrados.filter(
    (i) => i.status === 'regra_local' || i.regraLocal
  );
  const grupoPendentes = itensFiltrados.filter(
    (i) => i.status === 'pendente' || i.status === 'lacuna'
  );

  // Renderiza uma linha de item de 44 px de altura
  const renderItemLinha = (item: ItemChecklist) => {
    const isAtivo =
      item.status === 'respondido' ||
      item.status === 'confirmado_contexto' ||
      item.status === 'regra_local';

    const isRegraLocal = item.status === 'regra_local' || item.regraLocal;
    const expandido = !!itensExpandidos[item.id];
    const valorExibido = item.valorRespondido || item.valorModelo;

    return (
      <div
        key={item.id}
        className="border-b border-[#dee0e0] last:border-b-0 hover:bg-[#f9fafb] transition-colors"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => alternarItemChecklistManual(item.id)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              alternarItemChecklistManual(item.id);
            }
          }}
          className="min-h-[44px] px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer outline-none focus-visible:bg-[#e6f5f8]"
          aria-pressed={isAtivo}
        >
          {/* Esquerda: Ícone de estado SVG + ID + Título */}
          <div className="flex items-center gap-2.5 min-w-0">
            {isRegraLocal ? (
              <Sparkles size={16} className="text-[#ea580c] shrink-0" aria-hidden="true" />
            ) : isAtivo ? (
              <CheckCircle2 size={16} className="text-[#055b40] shrink-0" aria-hidden="true" />
            ) : (
              <Circle size={16} className="text-[#cacccc] shrink-0" aria-hidden="true" />
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-mono text-[11px] text-[#656666] shrink-0">
                  {item.id}
                </span>
                <span className="font-semibold text-xs text-[#1c1c1c] truncate">
                  {item.titulo}
                </span>
              </div>
            </div>
          </div>

          {/* Direita: Valor detectado em peso 600 + Botão de gaveta */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-semibold tabular-nums ${
                isRegraLocal
                  ? 'text-[#ea580c]'
                  : isAtivo
                  ? 'text-[#055b40]'
                  : 'text-[#656666]'
              }`}
            >
              {valorExibido}
            </span>

            {/* Gaveta recolhível para frase de evidência / modelo */}
            <button
              type="button"
              onClick={(e) => toggleGaveta(item.id, e)}
              className="w-7 h-7 rounded flex items-center justify-center text-[#656666] hover:text-[#1c1c1c] hover:bg-[#dee0e0]/40 transition-colors cursor-pointer"
              aria-label={expandido ? 'Recolher detalhes' : 'Ver detalhes'}
            >
              {expandido ? (
                <ChevronUp size={14} aria-hidden="true" />
              ) : (
                <ChevronDown size={14} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Gaveta Recolhível (evidência ou detalhes normativos) */}
        {expandido && (
          <div className="px-3.5 pb-2.5 pt-1 text-xs text-[#656666] bg-[#f5f7f7] space-y-1 animate-in fade-in duration-150">
            <p className="leading-relaxed">{item.descricao}</p>
            <div className="flex items-baseline justify-between text-[11px] pt-1 border-t border-[#dee0e0]/60">
              <span>Padrão do modelo: <strong>{item.valorModelo}</strong></span>
              {item.docReferencia && <span>Ref: {item.docReferencia}</span>}
            </div>
            {item.evidencia && (
              <p className="italic text-[11px] text-[#0e7490] pt-0.5">
                "{item.evidencia}"
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f7f7]">
      {/* 1. Topo: Cobertura em Destaque Calmo com Barra de Progresso de 8 px */}
      <div className="bg-white border border-[#dee0e0] rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#1c1c1c]">
            {itensConcluidos.length} de {total} itens respondidos
          </span>
          <span className="font-bold text-[#0d787e] tabular-nums font-mono text-sm">
            {porcentagem}%
          </span>
        </div>

        {/* Barra de progresso fina de 8 px com cantos arredondados e cor #0d787e */}
        <div className="w-full h-2 bg-[#dee0e0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0d787e] transition-all duration-200 rounded-full"
            style={{ width: `${porcentagem}%` }}
          />
        </div>
      </div>

      {/* 2. Campo de Busca de Parâmetros */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#656666]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          placeholder="Buscar no checklist (recuo, taxa, ZR2)..."
          className="w-full h-9 pl-8 pr-7 text-xs bg-white border border-[#dee0e0] rounded-lg placeholder:text-[#656666] focus:border-[#0d787e] outline-none"
        />
        {termoBusca && (
          <button
            onClick={() => setTermoBusca('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#656666] hover:text-[#1c1c1c]"
            aria-label="Limpar busca"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Na transcrição ao vivo o checklist não acompanha a fala real: só o roteiro simulado o preenchia */}
      {aoVivoReal && !viaApi && (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2 text-xs text-[#78350f] leading-relaxed">
          Itens e valores abaixo são do roteiro fictício. Sem a API do Prumo, a fala real só é transcrita (aba
          Transcrição): o checklist não é marcado a partir dela.
        </div>
      )}
      {viaApi && (
        <div className="bg-[#e6f5f8] border border-[#bfe3ea] rounded-xl px-3 py-2 text-xs text-[#0e7490] leading-relaxed">
          Checklist atualizado pela análise da API a partir da fala real (a cada ~30 s de conversa).
        </div>
      )}

      {/* 3. Seções Limpas sem Cartões Encaixados */}
      <div className="space-y-3">
        {/* Seção: Regras Locais */}
        {grupoRegrasLocais.length > 0 && (
          <div className="bg-white border border-[#dee0e0] rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 bg-[#ffefe7]/60 border-b border-[#ea580c]/20 flex items-center justify-between text-xs font-semibold text-[#702600]">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#ea580c]" aria-hidden="true" />
                Regras locais
              </span>
              <span className="text-xs font-mono tabular-nums">
                {grupoRegrasLocais.length}
              </span>
            </div>
            <div>{grupoRegrasLocais.map(renderItemLinha)}</div>
          </div>
        )}

        {/* Seção: Respondidos na Reunião */}
        {grupoRespondidosReuniao.length > 0 && (
          <div className="bg-white border border-[#dee0e0] rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 bg-[#eefff9] border-b border-[#a7f3d0] flex items-center justify-between text-xs font-semibold text-[#055b40]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#055b40]" aria-hidden="true" />
                Respondidos na reunião
              </span>
              <span className="text-xs font-mono tabular-nums">
                {grupoRespondidosReuniao.length}
              </span>
            </div>
            <div>{grupoRespondidosReuniao.map(renderItemLinha)}</div>
          </div>
        )}

        {/* Seção: Confirmados pelo Contexto */}
        {grupoConfirmadosContexto.length > 0 && (
          <div className="bg-white border border-[#dee0e0] rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 bg-[#f5f7f7] border-b border-[#dee0e0] flex items-center justify-between text-xs font-semibold text-[#1c1c1c]">
              <span>Confirmados pelo contexto</span>
              <span className="text-xs text-[#656666] font-mono tabular-nums">
                {grupoConfirmadosContexto.length}
              </span>
            </div>
            <div>{grupoConfirmadosContexto.map(renderItemLinha)}</div>
          </div>
        )}

        {/* Seção: Pendentes */}
        {grupoPendentes.length > 0 && (
          <div className="bg-white border border-[#dee0e0] rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 bg-[#f5f7f7] border-b border-[#dee0e0] flex items-center justify-between text-xs font-semibold text-[#656666]">
              <span>Pendentes de alinhamento</span>
              <span className="text-xs text-[#656666] font-mono tabular-nums">
                {grupoPendentes.length}
              </span>
            </div>
            <div>{grupoPendentes.map(renderItemLinha)}</div>
          </div>
        )}

        {itensFiltrados.length === 0 && (
          <div className="bg-white border border-[#dee0e0] rounded-xl p-6 text-center text-xs text-[#656666]">
            Nenhum item encontrado com o termo informado.
          </div>
        )}
      </div>
    </div>
  );
};
