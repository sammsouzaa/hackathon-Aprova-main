/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Transcrição ao vivo na interface (F6). Liga o controlador (captura + motor + sessão) ao ciclo da
 * reunião: reage às transições do ReuniaoContext (pausar, retomar, concluir, reiniciar) e expõe o
 * estado real para a interface. Fora do programa desktop não cria nada e a interface fica no roteiro.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useReuniao } from './ReuniaoContext';
import { aoVivoDisponivel } from '../services/aovivo/disponibilidade';
import { mapearChecklist } from '../services/aovivo/mapa-checklist';
import { criarControladorAoVivo } from '../services/aovivo/fabrica';
import type { ControladorAoVivo } from '../services/aovivo/controlador';
import type { SnapshotAoVivo } from '../services/aovivo/tipos';
import type { MetaReuniao } from '../types/transcricao';

export const PROCESSO_DA_DEMONSTRACAO = 'Alvará de construção residencial · Serra do Sabiá';

const SNAPSHOT_VAZIO: SnapshotAoVivo = {
  fase: 'ocioso',
  erro: null,
  origemDoErro: null,
  motor: { estado: 'descarregado', nome: '', biblioteca: '', threads: null, detalhe: '' },
  modoEscuta: null,
  modoUmCanal: false,
  dispositivos: { microfone: '', monitor: '' },
  segmentos: [],
  ultimo: null,
  caminho: null,
  avisos: [],
  estatisticas: null,
  copiloto: null,
  contexto: null,
  transcricaoPor: null
};

type FalanteManual = 'implantadora' | 'prefeitura' | null;

interface AoVivoContextData {
  /** Fonte "Ao vivo" escolhida E programa desktop: a interface mostra a transcrição real. */
  ativo: boolean;
  snapshot: SnapshotAoVivo;
  /** Pede o início da captura e da sessão. Resolve true se a reunião pode começar. */
  iniciar: () => Promise<boolean>;
  /** Carrega o modelo de novo (depois de uma falha ou de ele ter sido descarregado). */
  prepararModelo: () => void;
  falanteManual: FalanteManual;
  definirFalanteManual: (falante: FalanteManual) => void;
  abrirPastaDasTranscricoes: () => Promise<void>;
  /** Caminho do JSON mais recente na pasta das transcrições (de qualquer reunião); null se não houver. */
  ultimoArquivo: string | null;
  atualizarUltimoArquivo: () => Promise<void>;
  /** A transcrição e a análise desta reunião vêm da API do Prumo (e não do Whisper local). */
  viaApi: boolean;
  /** Pergunta ao copiloto da API; a resposta entra no chat. */
  perguntar: (texto: string) => Promise<void>;
  /** Marca ou desmarca um item do checklist na API (código CHK-nn). */
  alternarItem: (codigo: string, marcado: boolean) => Promise<void>;
}

const padrao: AoVivoContextData = {
  ativo: false,
  snapshot: SNAPSHOT_VAZIO,
  iniciar: async () => false,
  prepararModelo: () => {},
  falanteManual: null,
  definirFalanteManual: () => {},
  abrirPastaDasTranscricoes: async () => {},
  ultimoArquivo: null,
  atualizarUltimoArquivo: async () => {},
  viaApi: false,
  perguntar: async () => {},
  alternarItem: async () => {}
};

const AoVivoContext = createContext<AoVivoContextData>(padrao);

const sempreSemAssinatura = () => () => {};

function gerarIdDaReuniao(agora: Date): string {
  const dois = (n: number) => n.toString().padStart(2, '0');
  const data = `${agora.getFullYear()}${dois(agora.getMonth() + 1)}${dois(agora.getDate())}`;
  const hora = `${dois(agora.getHours())}${dois(agora.getMinutes())}${dois(agora.getSeconds())}`;
  return `REU-${data}-${hora}`;
}

export function descreverFechamento(snapshot: SnapshotAoVivo): string {
  const falas = snapshot.segmentos.filter((s) => !s.descartadoPorEco && s.texto);
  const doFalante = (f: string) => falas.filter((s) => s.falante === f).length;
  const partes = [`${doFalante('prefeitura')} da prefeitura`, `${doFalante('implantadora')} da implantadora`];
  const semNome = doFalante('indefinido');
  if (semNome > 0) partes.push(`${semNome} sem identificação`);
  const resumo =
    falas.length === 0
      ? 'Reunião encerrada. Nenhuma fala foi transcrita.'
      : `Reunião encerrada. ${falas.length} ${falas.length === 1 ? 'fala transcrita' : 'falas transcritas'} (${partes.join(', ')}).`;
  const destino =
    snapshot.modoEscuta === 'escuta_sem_guardar'
      ? 'Escuta sem guardar: nada foi salvo em disco.'
      : snapshot.caminho
        ? `Texto salvo em ${snapshot.caminho}.`
        : 'O texto não foi salvo em arquivo.';
  return `${resumo} ${destino}`;
}

export const AoVivoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estado, fonteFala, modoEscuta, participantesAvisados, aoVivoReal, adicionarMensagemPrumo, adicionarMensagemUsuario, aplicarChecklistAoVivo, checklist } = useReuniao();
  const [controlador] = useState<ControladorAoVivo | null>(() => (aoVivoDisponivel() ? criarControladorAoVivo() : null));
  const [falanteManual, setFalanteManual] = useState<FalanteManual>(null);
  const [ultimoArquivo, setUltimoArquivo] = useState<string | null>(null);

  const assinar = useMemo(() => (controlador ? (aviso: () => void) => controlador.assinar(aviso) : sempreSemAssinatura), [controlador]);
  const obter = useCallback(() => (controlador ? controlador.obterSnapshot() : SNAPSHOT_VAZIO), [controlador]);
  const snapshot = useSyncExternalStore(assinar, obter);

  // O motor ativo diz de onde vem a transcrição (antes de carregar, o nome já é o da API).
  const viaApi = Boolean(controlador) && snapshot.motor.nome === 'api-prumo' && snapshot.motor.estado === 'pronto';

  // Contexto do cliente (API): a tela de preparação mostra o checklist de partida e a abertura da reunião.
  const aberturaRef = useRef<string | null>(null);
  useEffect(() => {
    if (!aoVivoReal) {
      aberturaRef.current = null;
      return;
    }
    const contexto = snapshot.contexto;
    if (!contexto || estado !== 'preparando' || snapshot.transcricaoPor === 'api') return;
    const itens = mapearChecklist(
      contexto.checklist.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
        pergunta: i.pergunta,
        valor_referencia: i.valor_referencia,
        status: i.confirmado_no_contexto ? 'respondida' : 'pendente',
        resposta: i.resposta_contexto ?? null,
        fonte: i.confirmado_no_contexto ? 'contexto' : null
      }))
    );
    aplicarChecklistAoVivo(itens);
    if (aberturaRef.current !== contexto.id) {
      aberturaRef.current = contexto.id;
      const confirmados = itens.filter((i) => i.status === 'confirmado_contexto').length;
      adicionarMensagemRef.current(
        `Contexto carregado: ${contexto.nome}. O checklist tem ${itens.length} itens: ${confirmados} já confirmados pelo contexto do cliente e ${itens.length - confirmados} faltam perguntar.`,
        'Análise da API'
      );
    }
  }, [aoVivoReal, snapshot.contexto, snapshot.transcricaoPor, estado, aplicarChecklistAoVivo]);

  // Análise da API → checklist e chat. Os itens trazem o id da API só aqui; o código (CHK-nn) é o que a tela usa.
  const itensApiRef = useRef<Record<string, string>>({});
  const jaAvisadoRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const copiloto = snapshot.copiloto;
    if (!copiloto || snapshot.transcricaoPor !== 'api') return;
    itensApiRef.current = Object.fromEntries(copiloto.checklist.map((i) => [i.codigo, i.id]));
    aplicarChecklistAoVivo(mapearChecklist(copiloto.checklist));
    const novos: string[] = [];
    const sugestao = copiloto.sugestao_pergunta_imediata?.trim();
    if (sugestao) novos.push(`Pergunte agora: ${sugestao}`);
    copiloto.anotacoes?.ia?.forEach((a) => novos.push(a));
    for (const texto of novos) {
      if (jaAvisadoRef.current.has(texto)) continue;
      jaAvisadoRef.current.add(texto);
      adicionarMensagemRef.current(texto, 'Análise da API');
    }
  }, [snapshot.copiloto, snapshot.transcricaoPor, aplicarChecklistAoVivo]);
  useEffect(() => {
    if (estado === 'preparando') jaAvisadoRef.current = new Set();
  }, [estado]);

  // Sempre a versão mais recente das funções do contexto da reunião, sem refazer os efeitos abaixo.
  const adicionarMensagemRef = useRef(adicionarMensagemPrumo);
  adicionarMensagemRef.current = adicionarMensagemPrumo;

  useEffect(() => {
    return () => {
      void controlador?.destruir();
    };
  }, [controlador]);

  // Pré-aquecimento: escolher "Ao vivo" já carrega o modelo, para o "Iniciar" estar pronto na hora.
  // Também recarrega se o motor foi descarregado por ociosidade (fase volta a 'ocioso'). Uma falha
  // ('erro') não tenta de novo sozinha: a pessoa decide em "Tentar de novo".
  useEffect(() => {
    if (!controlador || !aoVivoReal || estado !== 'preparando' || modoEscuta === 'modo_notas') return;
    if (snapshot.fase === 'ocioso') void controlador.preparar();
  }, [controlador, aoVivoReal, estado, modoEscuta, snapshot.fase]);

  const atualizarUltimoArquivo = useCallback(async () => {
    const api = window.prumoDesktop?.transcricao;
    if (!api) return;
    try {
      const resposta = await api.listar();
      const lista = resposta.ok ? (resposta.lista ?? []) : [];
      setUltimoArquivo(lista.length > 0 ? lista[0].caminhoCompleto : null);
    } catch {
      /* sem acesso à pasta: o menu só não mostra o caminho */
    }
  }, []);

  // Transições da reunião → controlador.
  const anterior = useRef({ estado, fonteFala });
  useEffect(() => {
    const antes = anterior.current;
    anterior.current = { estado, fonteFala };
    if (!controlador) return;

    const saiuDoAoVivo = antes.fonteFala === 'ao_vivo' && fonteFala !== 'ao_vivo';
    const reiniciou = estado === 'preparando' && antes.estado !== 'preparando';
    if (saiuDoAoVivo || reiniciou) {
      setFalanteManual(null);
      void controlador.cancelar();
      return;
    }
    if (fonteFala !== 'ao_vivo') return;

    if (antes.estado === 'em_reuniao' && estado === 'pausada') {
      void controlador.pausar();
    } else if (antes.estado === 'pausada' && estado === 'em_reuniao') {
      controlador.retomar();
    } else if (estado === 'concluida' && antes.estado !== 'concluida') {
      void (async () => {
        const gravando = controlador.ativa;
        await controlador.finalizar();
        const final = controlador.obterSnapshot();
        // Reiniciar a demonstração durante o fechamento anula tudo: não escreve no chat novo.
        if (gravando && final.fase !== 'concluida') return;
        if (!gravando) {
          adicionarMensagemRef.current('Reunião encerrada. No modo notas o Prumo não capta áudio.', 'Transcrição local');
          return;
        }
        adicionarMensagemRef.current(descreverFechamento(final), 'Transcrição local');
        if (final.origemDoErro === 'finalizacao' && final.erro) {
          adicionarMensagemRef.current(final.erro, 'Transcrição local');
        }
        void atualizarUltimoArquivo();
      })();
    }
  }, [estado, fonteFala, controlador, atualizarUltimoArquivo]);

  const iniciar = useCallback(async (): Promise<boolean> => {
    if (!controlador) return false;
    const meta: MetaReuniao = {
      id: gerarIdDaReuniao(new Date()),
      processo: snapshot.contexto?.nome ?? PROCESSO_DA_DEMONSTRACAO,
      modoEscuta,
      participantesAvisados
    };
    const ok = await controlador.iniciar(meta);
    if (ok) {
      const porApi = controlador?.obterSnapshot().transcricaoPor === 'api';
      const guarda =
        modoEscuta === 'escuta_sem_guardar'
          ? 'O texto fica só na tela e some ao reiniciar a demonstração.'
          : 'O texto é salvo em arquivo neste computador.';
      adicionarMensagemRef.current(
        porApi
          ? `Transcrevendo ao vivo pela API do Prumo: o áudio é enviado ao servidor em trechos e a análise marca o checklist. ${guarda}`
          : `Transcrevendo ao vivo, neste computador (API indisponível). ${guarda} Sem a API, o checklist não é marcado pela fala real.`,
        porApi ? 'Análise da API' : 'Transcrição local'
      );
      void atualizarUltimoArquivo();
    }
    return ok;
  }, [controlador, modoEscuta, participantesAvisados, atualizarUltimoArquivo, snapshot.contexto]);

  const prepararModelo = useCallback(() => {
    void controlador?.preparar();
  }, [controlador]);

  const definirFalanteManual = useCallback(
    (falante: FalanteManual) => {
      setFalanteManual(falante);
      controlador?.definirFalanteManual(falante);
    },
    [controlador]
  );

  const abrirPastaDasTranscricoes = useCallback(async () => {
    try {
      await window.prumoDesktop?.transcricao?.abrirPasta();
    } catch {
      /* o menu continua; abrir a pasta é conveniência */
    }
  }, []);

  const perguntar = useCallback(
    async (texto: string) => {
      adicionarMensagemUsuario(texto);
      try {
        const resposta = await controlador!.perguntar(texto);
        adicionarMensagemRef.current(resposta, 'Análise da API');
      } catch (erro) {
        adicionarMensagemRef.current(`Não consegui consultar a API: ${erro instanceof Error ? erro.message : erro}`, 'Análise da API');
      }
    },
    [controlador, adicionarMensagemUsuario]
  );

  const alternarItem = useCallback(
    async (codigo: string, marcado: boolean) => {
      const idApi = itensApiRef.current[codigo];
      if (!controlador || !idApi) return;
      const item = checklist.find((i) => i.id === codigo);
      try {
        await controlador.marcarItem(idApi, marcado ? 'pendente' : 'respondida', marcado ? undefined : item?.valorModelo);
      } catch (erro) {
        adicionarMensagemRef.current(`Não consegui atualizar o item ${codigo}: ${erro instanceof Error ? erro.message : erro}`, 'Análise da API');
      }
    },
    [controlador, checklist]
  );

  const valor = useMemo<AoVivoContextData>(
    () => ({
      ativo: Boolean(controlador) && aoVivoReal,
      snapshot,
      iniciar,
      prepararModelo,
      falanteManual,
      definirFalanteManual,
      abrirPastaDasTranscricoes,
      ultimoArquivo,
      atualizarUltimoArquivo,
      viaApi,
      perguntar,
      alternarItem
    }),
    [controlador, aoVivoReal, snapshot, iniciar, prepararModelo, falanteManual, definirFalanteManual, abrirPastaDasTranscricoes, ultimoArquivo, atualizarUltimoArquivo, viaApi, perguntar, alternarItem]
  );

  return <AoVivoContext.Provider value={valor}>{children}</AoVivoContext.Provider>;
};

export const useAoVivo = () => useContext(AoVivoContext);
