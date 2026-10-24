/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sessão da reunião na API do Prumo: cria e inicia a sessão, acompanha o copiloto (checklist,
 * última fala, sugestões) e finaliza. Só existe quando a transcrição é feita pela API.
 */
import { chamarApi, gerarIdDaSessao, type ContextoCompletoApi, type CopilotoApi, type ModoApi } from '../api/cliente.ts';
import type { MotorSTTHibrido } from '../stt/motor-hibrido.ts';
import type { MetaReuniao } from '../../types/transcricao.ts';

export const INTERVALO_COPILOTO_MS = 3000;
/** A API só analisa sozinha a cada ~30 s de FALA acumulada; pedimos a análise logo após cada fala nova. */
export const INTERVALO_MINIMO_ANALISE_MS = 10000;
const ATRASO_APOS_FALA_MS = 1500;

export interface ServicoAnalise {
  /** A transcrição desta reunião passa pela API (e não pelo Whisper local)? */
  ativo(): boolean;
  /** Motivo de a API não ser usada, quando caiu no motor local. */
  motivoFallback(): string | null;
  /** Contexto já processado do cliente (nome e checklist), para a tela de preparação. */
  carregarContexto(): Promise<ContextoCompletoApi>;
  iniciar(meta: MetaReuniao): Promise<void>;
  /** Há texto novo: pede à API uma análise agora (agrupada, no máximo uma a cada 10 s). */
  solicitarAnalise(): void;
  aoCopiloto(fn: (copiloto: CopilotoApi) => void): () => void;
  /** `finalizar: true` fecha a sessão na API (gera a ata); false só para de acompanhar. */
  encerrar(opcoes: { finalizar: boolean }): Promise<void>;
  perguntar(texto: string): Promise<string>;
  /** Marca/desmarca um item do checklist à mão (a análise não mexe mais nele). */
  marcarItem(itemId: string, status: 'pendente' | 'respondida', resposta?: string): Promise<void>;
}

const MODO: Record<MetaReuniao['modoEscuta'], ModoApi> = {
  gravacao_com_aviso: 'gravacao',
  escuta_sem_guardar: 'sem_guardar',
  modo_notas: 'notas'
};

export function criarServicoAnalise(motor: MotorSTTHibrido): ServicoAnalise {
  const ouvintes = new Set<(c: CopilotoApi) => void>();
  let sessaoId: string | null = null;
  let relogio: ReturnType<typeof setInterval> | null = null;
  let consultando = false;
  let analisando = false;
  let analisePendente = false;
  let ultimaAnaliseEm = 0;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  const agendarAnalise = () => {
    if (temporizador || analisando) return;
    const espera = Math.max(ATRASO_APOS_FALA_MS, ultimaAnaliseEm + INTERVALO_MINIMO_ANALISE_MS - Date.now());
    temporizador = setTimeout(() => {
      temporizador = null;
      void analisarAgora();
    }, espera);
  };

  const analisarAgora = async () => {
    const id = sessaoId;
    if (!id || !analisePendente || analisando) return;
    analisePendente = false;
    analisando = true;
    try {
      const copiloto = await chamarApi<CopilotoApi>('POST', `/sessoes/${id}/analisar`, {});
      if (id === sessaoId && copiloto?.checklist) ouvintes.forEach((fn) => fn(copiloto));
    } catch {
      /* a análise automática da API continua valendo */
    } finally {
      analisando = false;
      ultimaAnaliseEm = Date.now();
      if (analisePendente && id === sessaoId) agendarAnalise();
    }
  };

  const consultar = async () => {
    if (!sessaoId || consultando) return;
    consultando = true;
    const id = sessaoId;
    try {
      const copiloto = await chamarApi<CopilotoApi>('GET', `/sessoes/${id}/copiloto`);
      if (id === sessaoId) ouvintes.forEach((fn) => fn(copiloto));
    } catch {
      /* mantém o último estado; a transcrição continua */
    } finally {
      consultando = false;
    }
  };

  const pararRelogio = () => {
    if (relogio) clearInterval(relogio);
    relogio = null;
  };

  return {
    ativo: () => motor.modo === 'api',
    motivoFallback: () => motor.motivoFallback,
    async carregarContexto() {
      const contexto = motor.api.contexto;
      if (!contexto) throw new Error('A API não informou o contexto da reunião.');
      return chamarApi<ContextoCompletoApi>('GET', `/contextos/${contexto.id}`);
    },
    async iniciar(meta) {
      const contexto = motor.api.contexto;
      if (!contexto) throw new Error('A API não informou o contexto da reunião.');
      const id = gerarIdDaSessao();
      const agora = new Date();
      const horario = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
      await chamarApi('POST', '/sessoes', { contexto_id: contexto.id, titulo: meta.processo, horario, modo: MODO[meta.modoEscuta], id });
      await chamarApi('POST', `/sessoes/${id}/iniciar`, { aviso_confirmado: true });
      sessaoId = id;
      motor.api.definirSessao(id);
      pararRelogio();
      void consultar();
      relogio = setInterval(() => void consultar(), INTERVALO_COPILOTO_MS);
    },
    solicitarAnalise() {
      if (!sessaoId) return;
      analisePendente = true;
      agendarAnalise();
    },
    aoCopiloto(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
    async encerrar({ finalizar }) {
      const id = sessaoId;
      pararRelogio();
      if (temporizador) clearTimeout(temporizador);
      temporizador = null;
      analisePendente = false;
      if (!id) return;
      try {
        if (finalizar) {
          await chamarApi('POST', `/sessoes/${id}/finalizar`, {});
          const final = await chamarApi<CopilotoApi>('GET', `/sessoes/${id}/copiloto`);
          ouvintes.forEach((fn) => fn(final));
        }
      } finally {
        sessaoId = null;
        motor.api.definirSessao(null);
      }
    },
    async marcarItem(itemId, status, resposta) {
      if (!sessaoId) throw new Error('A reunião ainda não começou.');
      await chamarApi('PATCH', `/sessoes/${sessaoId}/checklist/${itemId}`, resposta === undefined ? { status } : { status, resposta });
      void consultar();
    },
    async perguntar(texto) {
      if (!sessaoId) throw new Error('A reunião ainda não começou.');
      const r = await chamarApi<{ resposta: string }>('POST', `/sessoes/${sessaoId}/perguntar`, { texto });
      return r.resposta;
    }
  };
}
