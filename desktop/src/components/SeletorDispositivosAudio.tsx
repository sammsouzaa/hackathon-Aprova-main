/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Seletor de dispositivos de áudio (Microfone e Áudio da Reunião) para o menu ⋯.
 */
import React, { useEffect, useState } from 'react';
import { servicoCaptura, DispositivoAudioInfo } from '../services/audio/captura';
import { Mic, Volume2, AlertTriangle, RefreshCw } from 'lucide-react';

export const SeletorDispositivosAudio: React.FC = () => {
  const [microfones, setMicrofones] = useState<DispositivoAudioInfo[]>([]);
  const [monitores, setMonitores] = useState<DispositivoAudioInfo[]>([]);
  const [micSelecionado, setMicSelecionado] = useState<string>('default');
  const [monSelecionado, setMonSelecionado] = useState<string>('');
  const [modoUmCanal, setModoUmCanal] = useState<boolean>(false);
  const [capturaAtiva, setCapturaAtiva] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(false);

  const carregarDispositivos = async () => {
    setCarregando(true);
    try {
      const lista = await servicoCaptura.listarDispositivos();
      setMicrofones(lista.microfones);
      setMonitores(lista.monitores);

      if (lista.microfones.length > 0 && !micSelecionado) {
        setMicSelecionado(lista.microfones[0].deviceId);
      }
      if (lista.monitores.length > 0 && !monSelecionado) {
        setMonSelecionado(lista.monitores[0].deviceId);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDispositivos();

    const unsub = servicoCaptura.onEstado((est) => {
      setModoUmCanal(est.modoUmCanal);
      setCapturaAtiva(est.ativo);
    });

    return () => unsub();
  }, []);

  const handleTrocarMic = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setMicSelecionado(id);
    servicoCaptura.selecionarDispositivo('microfone', id);
  };

  const handleTrocarMon = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setMonSelecionado(id);
    servicoCaptura.selecionarDispositivo('monitor', id);
  };

  return (
    <div className="px-2.5 py-2 border-b border-[#dee0e0] space-y-2 text-xs bg-[#fafafa]">
      <div className="flex items-center justify-between font-semibold text-[#1c1c1c] text-[11px]">
        <span className="flex items-center gap-1.5">
          <Mic size={13} className="text-[#0d787e]" /> Dispositivos de Áudio
        </span>
        <button
          onClick={carregarDispositivos}
          disabled={carregando}
          className="text-[#656666] hover:text-[#1c1c1c] p-0.5 rounded cursor-pointer transition-colors"
          title="Atualizar lista de dispositivos"
        >
          <RefreshCw size={11} className={carregando ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Seletor do Microfone */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#656666] flex items-center justify-between">
          <span>Canal Microfone (Implantadora):</span>
          <span className="text-[9px] text-[#055b40]">echo cancel ativo</span>
        </label>
        <select
          value={micSelecionado}
          onChange={handleTrocarMic}
          className="w-full h-7 px-2 text-[11px] bg-white border border-[#dee0e0] rounded-md outline-none focus:border-[#0d787e] text-[#1c1c1c] truncate cursor-pointer"
        >
          {microfones.map((m) => (
            <option key={m.deviceId} value={m.deviceId}>
              {m.label}
            </option>
          ))}
          {microfones.length === 0 && (
            <option value="default">Microfone padrão</option>
          )}
        </select>
      </div>

      {/* Seletor do Áudio da Reunião (Monitor) */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#656666] flex items-center justify-between">
          <span>Áudio da Reunião (Prefeitura):</span>
          <span className="text-[9px] text-[#0e7490]">som limpo / sem filtro</span>
        </label>
        {!modoUmCanal && monitores.length > 0 ? (
          <select
            value={monSelecionado}
            onChange={handleTrocarMon}
            className="w-full h-7 px-2 text-[11px] bg-white border border-[#dee0e0] rounded-md outline-none focus:border-[#0d787e] text-[#1c1c1c] truncate cursor-pointer"
          >
            {monitores.map((m) => (
              <option key={m.deviceId} value={m.deviceId}>
                {m.label}
              </option>
            ))}
          </select>
        ) : !capturaAtiva ? (
          // O canal da reunião só existe depois que a captura começa: antes disso não é falha.
          <div className="p-1.5 rounded bg-[#f5f7f7] border border-[#dee0e0] text-[10px] text-[#656666]">
            O áudio da reunião é ligado automaticamente ao iniciar. Se não houver, o Prumo avisa e segue só com o microfone.
          </div>
        ) : (
          <div className="p-1.5 rounded bg-[#fff7ed] border border-[#ffedd5] flex items-start gap-1.5 text-[10px] text-[#9a3412]">
            <AlertTriangle size={13} className="shrink-0 mt-0.5 text-[#ea580c]" />
            <span>Sem canal da reunião: operando em modo 1 canal (somente microfone).</span>
          </div>
        )}
      </div>
    </div>
  );
};
