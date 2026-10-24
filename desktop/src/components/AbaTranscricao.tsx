/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useAoVivo } from '../context/AoVivoContext';
import { useReuniao } from '../context/ReuniaoContext';
import type { SegmentoPersistido } from '../types/transcricao';
import { AlertTriangle, FileText, Pause } from 'lucide-react';

const ROTULO_FALANTE: Record<SegmentoPersistido['falante'], string> = {
  implantadora: 'Implantadora',
  prefeitura: 'Prefeitura',
  indefinido: 'Sem identificação'
};

const ESTILO_FALANTE: Record<SegmentoPersistido['falante'], string> = {
  implantadora: 'bg-[#e6f5f8] text-[#0e7490]',
  prefeitura: 'bg-[#ffefe7] text-[#702600]',
  indefinido: 'bg-[#f5f7f7] text-[#656666] border border-[#dee0e0]'
};

function formatarInstante(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

export const AbaTranscricao: React.FC = () => {
  const { snapshot, falanteManual, definirFalanteManual } = useAoVivo();
  const { estado, modoEscuta } = useReuniao();
  const fimRef = useRef<HTMLDivElement>(null);
  const colouNoFimRef = useRef(true);
  const listaRef = useRef<HTMLDivElement>(null);

  const falas = useMemo(
    () => snapshot.segmentos.filter((s) => !s.descartadoPorEco && s.texto).sort((a, b) => a.inicioMs - b.inicioMs || a.id - b.id),
    [snapshot.segmentos]
  );
  const descartadas = snapshot.segmentos.filter((s) => s.descartadoPorEco).length;

  useEffect(() => {
    if (colouNoFimRef.current) fimRef.current?.scrollIntoView({ block: 'end' });
  }, [falas.length]);

  const aoRolar = () => {
    const el = listaRef.current;
    if (!el) return;
    colouNoFimRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const emReuniao = snapshot.fase === 'gravando' || snapshot.fase === 'pausada' || snapshot.fase === 'finalizando';
  const vazio =
    modoEscuta === 'modo_notas'
      ? 'Modo notas: o Prumo não capta áudio, então não há transcrição.'
      : estado === 'preparando'
        ? 'A transcrição aparece aqui depois que a reunião começar.'
        : snapshot.fase === 'pausada'
          ? 'Pausada. As falas voltam a ser transcritas quando você continuar.'
          : snapshot.fase === 'concluida'
            ? 'Nenhuma fala foi transcrita nesta reunião.'
            : 'Aguardando a primeira fala…';

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#f5f7f7]">
      {snapshot.fase === 'pausada' && (
        <div className="bg-[#ffefe7] border-b border-[#ea580c]/30 px-4 py-1.5 text-xs text-[#702600] flex items-center gap-1.5 shrink-0">
          <Pause size={12} aria-hidden="true" />
          <span>Pausada: as falas não estão sendo transcritas.</span>
        </div>
      )}

      {snapshot.avisos.map((aviso) => (
        <div key={aviso} className="bg-[#fffbeb] border-b border-[#fde68a] px-4 py-1.5 text-xs text-[#78350f] flex items-start gap-1.5 shrink-0">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{aviso}</span>
        </div>
      ))}

      {emReuniao && snapshot.modoUmCanal && (
        <div className="bg-white border-b border-[#dee0e0] px-4 py-2 shrink-0">
          <div className="text-[11px] text-[#656666] mb-1 font-medium">Quem está falando agora?</div>
          <div className="grid grid-cols-3 gap-1 bg-[#f5f7f7] p-1 rounded-lg" role="group" aria-label="Atribuir as próximas falas">
            {([['implantadora', 'Implantadora'], ['prefeitura', 'Prefeitura'], [null, 'Não sei']] as const).map(([valor, rotulo]) => (
              <button
                key={rotulo}
                type="button"
                aria-pressed={falanteManual === valor}
                onClick={() => definirFalanteManual(valor)}
                className={`text-[11px] py-1 rounded font-medium transition-colors cursor-pointer ${
                  falanteManual === valor ? 'bg-white text-[#0d787e] shadow-xs' : 'text-[#656666] hover:text-[#1c1c1c]'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={listaRef} onScroll={aoRolar} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5 select-text" aria-live="polite" aria-label="Transcrição da reunião">
        {falas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#656666] gap-2 px-6">
            <FileText size={22} className="text-[#cacccc]" aria-hidden="true" />
            <p>{vazio}</p>
          </div>
        ) : (
          falas.map((fala) => (
            <div key={fala.id} className="bg-white border border-[#dee0e0] rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${ESTILO_FALANTE[fala.falante]}`}>
                  {ROTULO_FALANTE[fala.falante]}
                  {fala.atribuicao === 'manual' ? ' (manual)' : ''}
                </span>
                <span className="text-[11px] text-[#656666] font-mono tabular-nums">{formatarInstante(fala.inicioMs)}</span>
              </div>
              <p className="text-xs text-[#1c1c1c] leading-relaxed">{fala.texto}</p>
            </div>
          ))
        )}
        <div ref={fimRef} />
      </div>

      <div className="h-6 bg-[#f5f7f7] border-t border-[#dee0e0] px-4 flex items-center justify-between text-xs text-[#656666] shrink-0 select-none">
        <span className="truncate">
          {falas.length} {falas.length === 1 ? 'fala' : 'falas'}
          {descartadas > 0 ? ` · ${descartadas} eco${descartadas === 1 ? '' : 's'} descartado${descartadas === 1 ? '' : 's'}` : ''}
        </span>
        <span className="shrink-0 ml-2">Protótipo demonstrativo · só a fala é real</span>
      </div>
    </div>
  );
};
