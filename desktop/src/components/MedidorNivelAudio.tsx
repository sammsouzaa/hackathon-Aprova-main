/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Medidor visual de nível de áudio (VU meter) em tempo real para os dois canais.
 */
import React, { useEffect, useState } from 'react';
import { servicoCaptura, CanalAudio } from '../services/audio/captura';
import { Mic, Volume2 } from 'lucide-react';

export const MedidorNivelAudio: React.FC<{ visivel?: boolean }> = ({ visivel = true }) => {
  const [nivelMic, setNivelMic] = useState<number>(0);
  const [nivelMon, setNivelMon] = useState<number>(0);
  const [modoUmCanal, setModoUmCanal] = useState<boolean>(false);

  useEffect(() => {
    if (!visivel) return;

    const unsubNivel = servicoCaptura.onNivel((canal: CanalAudio, rms: number) => {
      // Normalização suave do RMS (0 a 1) para exibição visual
      const nivel = Math.min(1, Math.max(0, rms * 5));
      if (canal === 'microfone') {
        setNivelMic(nivel);
      } else {
        setNivelMon(nivel);
      }
    });

    const unsubEstado = servicoCaptura.onEstado((estado) => {
      setModoUmCanal(estado.modoUmCanal);
    });

    return () => {
      unsubNivel();
      unsubEstado();
    };
  }, [visivel]);

  if (!visivel) return null;

  return (
    <div className="flex items-center gap-3 text-[11px] text-[#656666] py-0.5">
      {/* Canal Microfone (Implantadora) */}
      <div className="flex items-center gap-1.5" title="Canal Microfone (Implantadora)">
        <Mic size={12} className={nivelMic > 0.05 ? 'text-[#0d787e]' : 'text-[#8c8e8e]'} />
        <span className="font-medium text-[10px]">Mic:</span>
        <div className="w-12 h-1.5 bg-[#dee0e0] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#0d787e] transition-[width] duration-75 ease-out rounded-full"
            style={{ width: `${Math.round(nivelMic * 100)}%` }}
          />
        </div>
      </div>

      {/* Canal Monitor (Prefeitura / Reunião) */}
      {!modoUmCanal ? (
        <div className="flex items-center gap-1.5" title="Canal Áudio da Reunião (Prefeitura)">
          <Volume2 size={12} className={nivelMon > 0.05 ? 'text-[#ea580c]' : 'text-[#8c8e8e]'} />
          <span className="font-medium text-[10px]">Reunião:</span>
          <div className="w-12 h-1.5 bg-[#dee0e0] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#ea580c] transition-[width] duration-75 ease-out rounded-full"
              style={{ width: `${Math.round(nivelMon * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-[#ea580c] font-medium" title="Sem canal da reunião: operando apenas com microfone">
          Sem canal reunião
        </span>
      )}
    </div>
  );
};
