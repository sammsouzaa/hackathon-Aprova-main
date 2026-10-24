/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import {
  EstadoReuniao,
  ModoEscuta,
  FonteFala,
  ItemChecklist,
  FalaRoteiro,
  Compromisso,
  Mensagem,
  DecisaoContradicao
} from '../types';
import { CHECKLIST_INICIAL } from '../data/checklist';
import { DOCUMENTOS_MODELO } from '../data/documentos';
import { ROTEIRO_REUNIAO } from '../data/roteiro';
import { LEMBRETES_SIMULADOS } from '../data/lembretes';
import { analisarTrecho, consultarDocumentacao } from '../services/analisador';
import { aoVivoDisponivel } from '../services/aovivo/disponibilidade';

export type AbaPrumo = 'conversa' | 'checklist' | 'transcricao';

interface ReuniaoContextData {
  // Estado da Reunião
  estado: EstadoReuniao;
  modoEscuta: ModoEscuta;
  fonteFala: FonteFala;
  participantesAvisados: boolean;
  tempoDecorrido: number;
  indiceFalaAtual: number;
  falaMaisRecente: FalaRoteiro | null;
  mensagens: Mensagem[];
  checklist: ItemChecklist[];
  compromissos: Compromisso[];
  abaAtiva: AbaPrumo;
  /** Fonte "Ao vivo" no programa desktop: transcrição real; o roteiro simulado não roda. */
  aoVivoReal: boolean;
  dataSimuladaRelogio: string;
  diasAvancadosDemo: boolean;
  temContradicaoPendente: boolean;
  analisandoFala: boolean;

  // Controle de Janela (Maximização Vertical)
  janelaMaximizadaVertical: boolean;
  setJanelaMaximizadaVertical: (max: boolean) => void;
  toggleMaximizarVertical: () => void;

  // Modais e Painéis
  painelResumoAberto: boolean;
  painelTicketAberto: boolean;
  ticketIdSelecionado: string | null;
  painelSobreAberto: boolean;
  alertaDemonstrativo: string | null;

  // Ações
  setAbaAtiva: (aba: AbaPrumo) => void;
  setModoEscuta: (modo: ModoEscuta) => void;
  setFonteFala: (fonte: FonteFala) => void;
  setParticipantesAvisados: (avisado: boolean) => void;
  iniciarReuniao: () => void;
  pausarReuniao: () => void;
  retomarReuniao: () => void;
  avancarUmaFala: () => void;
  /** Encerra a reunião ao vivo sem o cartão de lacunas nem o resumo do roteiro. */
  concluirAoVivo: () => void;
  /** Mensagem do Prumo no chat, fora do roteiro (usada pela transcrição ao vivo). */
  adicionarMensagemPrumo: (texto: string, fonteAnalise?: Mensagem['fonteAnalise']) => void;
  adicionarMensagemUsuario: (texto: string) => void;
  /** Substitui o checklist pelo devolvido pela API (só com a transcrição ao vivo pela API). */
  aplicarChecklistAoVivo: (itens: ItemChecklist[]) => void;
  solicitarEncerramento: () => void;
  cancelarEncerramento: () => void;
  confirmarEncerramento: () => void;
  decidirContradicao: (mensagemId: string, itemId: string, decisao: DecisaoContradicao) => void;
  confirmarCompromisso: (mensagemId: string, compromissoId: string) => void;
  editarPrazoCompromisso: (compromissoId: string, novoPrazo: string) => void;
  alternarItemChecklistManual: (itemId: string) => void;
  desmarcarItemMensagem: (mensagemId: string, itemId: string) => void;
  enviarMensagemUsuario: (texto: string) => void;
  avancarTresDiasDemo: () => void;
  reiniciarDemonstracao: () => void;
  abrirTicketSimulado: (ticketId: string) => void;
  fecharTicketSimulado: () => void;
  concluirTicketSimulado: (ticketId: string, resposta: string) => void;
  setPainelResumoAberto: (aberto: boolean) => void;
  setPainelSobreAberto: (aberto: boolean) => void;
  fecharAlertaDemonstrativo: () => void;
}

const ReuniaoContext = createContext<ReuniaoContextData>({} as ReuniaoContextData);

export const ReuniaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // O aplicativo abre direto no estado "preparando" da reunião de hoje
  const [estado, setEstado] = useState<EstadoReuniao>('preparando');
  const [modoEscuta, setModoEscuta] = useState<ModoEscuta>('gravacao_com_aviso');
  const [fonteFala, setFonteFalaState] = useState<FonteFala>('roteiro');
  const [participantesAvisados, setParticipantesAvisados] = useState<boolean>(false);
  const [tempoDecorrido, setTempoDecorrido] = useState<number>(0);
  const [indiceFalaAtual, setIndiceFalaAtual] = useState<number>(-1);
  const [falaMaisRecente, setFalaMaisRecente] = useState<FalaRoteiro | null>(null);
  const [checklist, setChecklist] = useState<ItemChecklist[]>(CHECKLIST_INICIAL);
  
  // Compromissos criados durante a reunião (inicia vazio, gerados pelas falas 11 e 15)
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);

  const [abaAtiva, setAbaAtiva] = useState<AbaPrumo>('conversa');
  const [dataSimuladaRelogio, setDataSimuladaRelogio] = useState<string>('Segunda-feira, 26/10/2026 · 14:00');
  const [diasAvancadosDemo, setDiasAvancadosDemo] = useState<boolean>(false);
  const [analisandoFala, setAnalisandoFala] = useState<boolean>(false);

  // Controle de Janela: Maximizar verticalmente até embaixo (padrão true)
  const [janelaMaximizadaVertical, setJanelaMaximizadaVertical] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('prumo_maximizada_vertical');
      if (salvo !== null) return salvo === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('prumo_maximizada_vertical', String(janelaMaximizadaVertical));
    }
  }, [janelaMaximizadaVertical]);

  const toggleMaximizarVertical = useCallback(() => {
    setJanelaMaximizadaVertical((prev) => !prev);
  }, []);

  // Modais e Painéis
  const [painelResumoAberto, setPainelResumoAberto] = useState<boolean>(false);
  const [painelTicketAberto, setPainelTicketAberto] = useState<boolean>(false);
  const [ticketIdSelecionado, setTicketIdSelecionado] = useState<string | null>(null);
  const [painelSobreAberto, setPainelSobreAberto] = useState<boolean>(false);
  const [alertaDemonstrativo, setAlertaDemonstrativo] = useState<string | null>(null);

  // Mensagens do chat do Prumo: mensagem inicial ao abrir em "preparando"
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => [
    {
      id: 'msg-init-1',
      timestamp: '14:00',
      remetente: 'prumo',
      tipo: 'texto',
      dados: {
        texto:
          'Reunião de hoje, 14:00: Alvará de construção residencial, Serra do Sabiá. O checklist tem 10 itens: 4 já estão confirmados pelo contexto do cliente e 6 faltam perguntar.'
      },
      fonteAnalise: 'Análise gravada'
    }
  ]);

  const timerReuniaoRef = useRef<NodeJS.Timeout | null>(null);
  const timerRoteiroRef = useRef<NodeJS.Timeout | null>(null);

  const fecharAlertaDemonstrativo = () => setAlertaDemonstrativo(null);

  const aoVivoReal = fonteFala === 'ao_vivo' && aoVivoDisponivel();

  const setFonteFala = (novaFonte: FonteFala) => {
    setFonteFalaState(novaFonte);
    if (novaFonte === 'ao_vivo' && !aoVivoDisponivel()) {
      setAlertaDemonstrativo(
        'Ação demonstrativa: a transcrição ao vivo só existe no programa desktop. Aqui a reunião segue o roteiro simulado.'
      );
    }
  };

  // Cronômetro da reunião ativa
  useEffect(() => {
    if (estado === 'em_reuniao') {
      timerReuniaoRef.current = setInterval(() => {
        setTempoDecorrido((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerReuniaoRef.current) clearInterval(timerReuniaoRef.current);
    }
    return () => {
      if (timerReuniaoRef.current) clearInterval(timerReuniaoRef.current);
    };
  }, [estado]);

  // Verifica se há contradição pendente de decisão
  const temContradicaoPendente = mensagens.some(
    (m) => m.tipo === 'contradicao' && !m.dados.decisao
  );

  // Processamento do roteiro passo a passo
  const processarProximaFala = useCallback(async () => {
    setIndiceFalaAtual((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= ROTEIRO_REUNIAO.length) {
        return prevIndex;
      }

      const fala = ROTEIRO_REUNIAO[nextIndex];
      setFalaMaisRecente(fala);
      setAnalisandoFala(true);

      // Executa o analisador do serviço
      analisarTrecho(fala, checklist, DOCUMENTOS_MODELO).then((res) => {
        setTimeout(() => setAnalisandoFala(false), 900);
        if (!res.sucesso || !res.efeito) return;
        const efeito = res.efeito;

        // Se o efeito exigir pausa (ex: fala 8 com contradição ou fala 12)
        if (efeito.devePausarRoteiro) {
          setEstado('pausada');
        }

        // 1. Mensagem de texto explicativa se houver
        if (efeito.mensagemTexto) {
          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-txt-${fala.id}-${Date.now()}`,
              timestamp: formatarHoraSimulada(nextIndex),
              remetente: 'prumo',
              tipo: 'texto',
              dados: { texto: efeito.mensagemTexto },
              fonteAnalise: 'Análise gravada'
            }
          ]);
        }

        // 2. Marcar item no checklist (1 linha compacta)
        if (efeito.itemMarcado) {
          const item = efeito.itemMarcado;
          setChecklist((itens) =>
            itens.map((it) => {
              if (it.id === item.itemId) {
                return {
                  ...it,
                  status: item.regraLocal ? 'regra_local' : 'respondido',
                  valorRespondido: item.valor,
                  evidencia: item.evidencia,
                  regraLocal: item.regraLocal
                };
              }
              return it;
            })
          );

          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-item-${item.itemId}-${Date.now()}`,
              timestamp: formatarHoraSimulada(nextIndex),
              remetente: 'prumo',
              tipo: 'item_marcado',
              dados: item,
              fonteAnalise: 'Análise gravada'
            }
          ]);
        }

        // 3. Alerta de contradição (cartão completo com opções de decisão)
        if (efeito.alertaContradicao) {
          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-contra-${efeito.alertaContradicao!.itemId}-${Date.now()}`,
              timestamp: formatarHoraSimulada(nextIndex),
              remetente: 'prumo',
              tipo: 'contradicao',
              dados: efeito.alertaContradicao,
              fonteAnalise: 'Análise gravada'
            }
          ]);
        }

        // 4. Criação de compromisso (cartão com confirmar/editar prazo)
        if (efeito.novoCompromisso) {
          const comp = efeito.novoCompromisso;
          const novoComp: Compromisso = {
            id: comp.compromissoId,
            titulo: comp.titulo,
            responsavel: comp.responsavel,
            prazo: comp.prazo,
            confirmado: false,
            ticketId: comp.compromissoId === 'CMP-01' ? 'TCK-8841' : 'TCK-8842',
            status: 'pendente'
          };

          setCompromissos((prev) => {
            if (prev.some((c) => c.id === novoComp.id)) return prev;
            return [...prev, novoComp];
          });

          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-comp-${comp.compromissoId}-${Date.now()}`,
              timestamp: formatarHoraSimulada(nextIndex),
              remetente: 'prumo',
              tipo: 'compromisso',
              dados: comp,
              fonteAnalise: 'Análise gravada'
            }
          ]);
        }

        // 5. Resumo final da reunião (fala 16)
        if (efeito.resumoFinal) {
          setEstado('concluida');
          setMensagens((prev) => [
            ...prev,
            {
              id: `msg-resumo-${Date.now()}`,
              timestamp: formatarHoraSimulada(nextIndex),
              remetente: 'prumo',
              tipo: 'resumo',
              dados: efeito.resumoFinal,
              fonteAnalise: 'Análise gravada'
            },
            {
              id: `msg-aviso-concluida-${Date.now() + 1}`,
              timestamp: formatarHoraSimulada(nextIndex),
              remetente: 'prumo',
              tipo: 'texto',
              dados: {
                texto: 'Reunião concluída. Resumo gerado para validação técnica da equipe de implantação.'
              },
              fonteAnalise: 'Análise gravada'
            }
          ]);
        }
      });

      return nextIndex;
    });
  }, [checklist]);

  // Intervalo automático de avanço do roteiro (~4.2s)
  useEffect(() => {
    if (estado === 'em_reuniao' && !aoVivoReal) {
      timerRoteiroRef.current = setInterval(() => {
        processarProximaFala();
      }, 4200);
    } else {
      if (timerRoteiroRef.current) clearInterval(timerRoteiroRef.current);
    }

    return () => {
      if (timerRoteiroRef.current) clearInterval(timerRoteiroRef.current);
    };
  }, [estado, aoVivoReal, processarProximaFala]);

  // Ação: Iniciar reunião
  const iniciarReuniao = () => {
    if (!participantesAvisados) return;
    setEstado('em_reuniao');

    if (indiceFalaAtual === -1 && !aoVivoReal) {
      setTimeout(() => {
        processarProximaFala();
      }, 500);
    }
  };

  const pausarReuniao = () => setEstado('pausada');
  const retomarReuniao = () => setEstado('em_reuniao');
  const avancarUmaFala = () => {
    if (aoVivoReal) return;
    processarProximaFala();
  };

  const concluirAoVivo = () => setEstado('concluida');

  const aplicarChecklistAoVivo = useCallback((itens: ItemChecklist[]) => setChecklist(itens), []);

  const adicionarMensagemUsuario = (texto: string) => {
    if (!texto.trim()) return;
    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-user-${Date.now()}-${prev.length}`,
        timestamp: new Date().toTimeString().slice(0, 5),
        remetente: 'usuario',
        tipo: 'usuario',
        dados: { texto: texto.trim() },
        fonteAnalise: 'Entrada da usuária'
      }
    ]);
  };

  const adicionarMensagemPrumo = (texto: string, fonteAnalise?: Mensagem['fonteAnalise']) => {
    const agora = new Date();
    const hora = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-prumo-${Date.now()}-${prev.length}`,
        timestamp: hora,
        remetente: 'prumo',
        tipo: 'texto',
        dados: { texto },
        fonteAnalise
      }
    ]);
  };

  // Solicitar encerramento da reunião (exibe aviso de lacunas)
  const solicitarEncerramento = () => {
    setEstado('encerrando');
    const lacunas = checklist
      .filter((i) => i.status === 'pendente' || i.status === 'lacuna')
      .map((i) => ({
        id: i.id,
        titulo: i.titulo,
        valorModelo: i.valorModelo
      }));

    const contradicoesAbertas = mensagens.filter(
      (m) => m.tipo === 'contradicao' && !m.dados.decisao
    ).length;

    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-lacunas-${Date.now()}`,
        timestamp: '14:28',
        remetente: 'prumo',
        tipo: 'lacunas',
        dados: {
          itensLacuna: lacunas,
          contradicoesAbertas
        },
        fonteAnalise: 'Análise gravada'
      }
    ]);
  };

  const cancelarEncerramento = () => {
    setEstado('em_reuniao');
  };

  // Confirmar encerramento e gerar cartão de resumo no chat
  const confirmarEncerramento = () => {
    setEstado('concluida');

    setChecklist((itens) =>
      itens.map((it) =>
        it.status === 'pendente' ? { ...it, status: 'lacuna' } : it
      )
    );

    const coberturaCount = checklist.filter(
      (i) => i.status === 'confirmado_contexto' || i.status === 'respondido' || i.status === 'regra_local'
    ).length;

    const regrasLocaisCount = checklist.filter((i) => i.status === 'regra_local' || i.regraLocal).length;

    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-resumo-encerrado-${Date.now()}`,
        timestamp: '14:30',
        remetente: 'prumo',
        tipo: 'resumo',
        dados: {
          cobertura: `Cobertura do checklist ${coberturaCount}/10`,
          regrasLocais: regrasLocaisCount,
          compromissos: compromissos.length
        },
        fonteAnalise: 'Análise gravada'
      },
      {
        id: `msg-aviso-concluida-${Date.now() + 1}`,
        timestamp: '14:30',
        remetente: 'prumo',
        tipo: 'texto',
        dados: {
          texto: 'Reunião concluída. Resumo gerado para validação técnica da equipe de implantação.'
        },
        fonteAnalise: 'Análise gravada'
      }
    ]);
  };

  // Decisão sobre alerta de contradição
  const decidirContradicao = (
    mensagemId: string,
    itemId: string,
    decisao: DecisaoContradicao
  ) => {
    setMensagens((prev) =>
      prev.map((m) => {
        if (m.id === mensagemId) {
          return {
            ...m,
            dados: { ...m.dados, decisao }
          };
        }
        return m;
      })
    );

    let textoAcao = '';
    if (decisao === 'aceitar_regra_local') {
      textoAcao = 'Aceitei como regra local (3 metros na ZR2).';
      setChecklist((itens) =>
        itens.map((it) =>
          it.id === itemId
            ? {
                ...it,
                status: 'regra_local',
                valorRespondido: '3,00 m',
                evidencia: 'Aqui a gente usa 3 metros de recuo frontal.',
                regraLocal: true
              }
            : it
        )
      );
    } else if (decisao === 'perguntar') {
      textoAcao = 'Perguntei à Helena para confirmar se 3m é exceção ou regra definitiva.';
      setChecklist((itens) =>
        itens.map((it) =>
          it.id === itemId
            ? { ...it, status: 'pendente', valorRespondido: '3,00 m (sob questionamento)' }
            : it
        )
      );
    } else {
      textoAcao = 'Ignorei a divergência por enquanto.';
    }

    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-user-decisao-${Date.now()}`,
        timestamp: '14:15',
        remetente: 'usuario',
        tipo: 'usuario',
        dados: { texto: textoAcao },
        fonteAnalise: 'Entrada da usuária'
      }
    ]);

    setEstado('em_reuniao');
  };

  // Confirmar compromisso
  const confirmarCompromisso = (mensagemId: string, compromissoId: string) => {
    setMensagens((prev) =>
      prev.map((m) => (m.id === mensagemId ? { ...m, dados: { ...m.dados, confirmado: true } } : m))
    );

    setCompromissos((prev) =>
      prev.map((c) => (c.id === compromissoId ? { ...c, confirmado: true } : c))
    );

    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-user-comp-${Date.now()}`,
        timestamp: '14:20',
        remetente: 'usuario',
        tipo: 'usuario',
        dados: { texto: 'Compromisso confirmado no registro de reunião.' },
        fonteAnalise: 'Entrada da usuária'
      }
    ]);
  };

  // Editar prazo de compromisso
  const editarPrazoCompromisso = (compromissoId: string, novoPrazo: string) => {
    setCompromissos((prev) =>
      prev.map((c) => (c.id === compromissoId ? { ...c, prazo: novoPrazo } : c))
    );
    setMensagens((prev) =>
      prev.map((m) => {
        if (m.tipo === 'compromisso' && m.dados.compromissoId === compromissoId) {
          return {
            ...m,
            dados: { ...m.dados, prazo: novoPrazo, prazoEditado: novoPrazo }
          };
        }
        return m;
      })
    );
  };

  // Desmarcar item do checklist
  const desmarcarItemMensagem = (mensagemId: string, itemId: string) => {
    setMensagens((prev) =>
      prev.map((m) => (m.id === mensagemId ? { ...m, dados: { ...m.dados, desmarcado: true } } : m))
    );

    setChecklist((itens) =>
      itens.map((it) =>
        it.id === itemId
          ? { ...it, status: 'pendente', valorRespondido: undefined, evidencia: undefined }
          : it
      )
    );

    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-user-desmarcar-${Date.now()}`,
        timestamp: '14:22',
        remetente: 'usuario',
        tipo: 'usuario',
        dados: { texto: `Desmarquei a confirmação automática do item ${itemId}.` },
        fonteAnalise: 'Entrada da usuária'
      }
    ]);
  };

  // Alternar item no checklist manual
  const alternarItemChecklistManual = (itemId: string) => {
    setChecklist((itens) =>
      itens.map((it) => {
        if (it.id === itemId) {
          const novoStatus =
            it.status === 'respondido' || it.status === 'confirmado_contexto'
              ? 'pendente'
              : 'respondido';
          return {
            ...it,
            status: novoStatus,
            valorRespondido: novoStatus === 'respondido' ? it.valorModelo : undefined
          };
        }
        return it;
      })
    );
  };

  // Usuária digita mensagem
  const enviarMensagemUsuario = (texto: string) => {
    if (!texto.trim()) return;

    const msgUser: Mensagem = {
      id: `msg-user-${Date.now()}`,
      timestamp: '14:25',
      remetente: 'usuario',
      tipo: 'usuario',
      dados: { texto: texto.trim() },
      fonteAnalise: 'Entrada da usuária'
    };

    setMensagens((prev) => [...prev, msgUser]);

    setTimeout(() => {
      const consulta = consultarDocumentacao(texto);
      if (consulta.encontrado) {
        setMensagens((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            timestamp: '14:25',
            remetente: 'prumo',
            tipo: 'pergunta_resposta',
            dados: {
              pergunta: texto,
              resposta: consulta.resposta,
              docReferencia: consulta.docReferencia
                ? {
                    id: consulta.docReferencia.id,
                    titulo: consulta.docReferencia.titulo,
                    artigo: consulta.docReferencia.artigo,
                    texto: consulta.docReferencia.textoCompleto
                  }
                : undefined
            },
            fonteAnalise: 'Resposta simulada'
          }
        ]);
      } else {
        setMensagens((prev) => [
          ...prev,
          {
            id: `msg-pend-${Date.now()}`,
            timestamp: '14:25',
            remetente: 'prumo',
            tipo: 'pendencia',
            dados: {
              pergunta: texto,
              observacao: 'Não encontrei isso na documentação. Abri uma pendência (simulado).',
              codigoProtocolo: `PEND-${Math.floor(1000 + Math.random() * 9000)}`
            },
            fonteAnalise: 'Resposta simulada'
          }
        ]);
      }
    }, 400);
  };

  // Avançar 3 dias (demo): dispara lembretes e resposta do ticket no próprio chat
  const avancarTresDiasDemo = () => {
    setDataSimuladaRelogio('Quinta-feira, 29/10/2026 · 11:40');
    setDiasAvancadosDemo(true);

    // Dispara os lembretes simulados no chat
    LEMBRETES_SIMULADOS.forEach((lembrete, index) => {
      setTimeout(() => {
        setMensagens((prev) => [
          ...prev,
          {
            id: `msg-lembrete-${index}-${Date.now()}`,
            timestamp: lembrete.dataSimulada.split(' ')[1] || '09:15',
            remetente: 'prumo',
            tipo: 'lembrete',
            dados: lembrete,
            fonteAnalise: 'Tempo simulado'
          }
        ]);
      }, index * 500);
    });

    // Atualiza CMP-01 com planta recebida
    setCompromissos((prev) =>
      prev.map((c) => {
        if (c.id === 'CMP-01' || c.ticketId === 'TCK-8841') {
          return {
            ...c,
            status: 'recebido',
            arquivoAnexo: 'planta_zoneamento_v2.pdf'
          };
        }
        return c;
      })
    );
  };

  // Reiniciar demonstração: volta ao estado "preparando" com compromissos e relógio zerados
  const reiniciarDemonstracao = () => {
    if (timerReuniaoRef.current) clearInterval(timerReuniaoRef.current);
    if (timerRoteiroRef.current) clearInterval(timerRoteiroRef.current);

    setEstado('preparando');
    setModoEscuta('gravacao_com_aviso');
    setFonteFalaState('roteiro');
    setParticipantesAvisados(false);
    setTempoDecorrido(0);
    setIndiceFalaAtual(-1);
    setFalaMaisRecente(null);
    setChecklist(CHECKLIST_INICIAL);
    setCompromissos([]);

    setAbaAtiva('conversa');
    setDataSimuladaRelogio('Segunda-feira, 26/10/2026 · 14:00');
    setDiasAvancadosDemo(false);

    setPainelResumoAberto(false);
    setPainelTicketAberto(false);
    setTicketIdSelecionado(null);
    setPainelSobreAberto(false);
    setAlertaDemonstrativo(null);

    setMensagens([
      {
        id: 'msg-init-1',
        timestamp: '14:00',
        remetente: 'prumo',
        tipo: 'texto',
        dados: {
          texto:
            'Reunião de hoje, 14:00: Alvará de construção residencial, Serra do Sabiá. O checklist tem 10 itens: 4 já estão confirmados pelo contexto do cliente e 6 faltam perguntar.'
        },
        fonteAnalise: 'Análise gravada'
      }
    ]);
  };

  // Controle de Ticket Simulado
  const abrirTicketSimulado = (ticketId: string) => {
    setTicketIdSelecionado(ticketId);
    setPainelTicketAberto(true);
  };

  const fecharTicketSimulado = () => {
    setPainelTicketAberto(false);
    setTicketIdSelecionado(null);
  };

  const concluirTicketSimulado = (_ticketId: string, resposta: string) => {
    setPainelTicketAberto(false);

    setCompromissos((prev) =>
      prev.map((c) => {
        if (c.id === 'CMP-01' || c.ticketId === 'TCK-8841') {
          return {
            ...c,
            status: 'recebido',
            arquivoAnexo: 'planta_zoneamento_v2.pdf'
          };
        }
        return c;
      })
    );

    setMensagens((prev) => [
      ...prev,
      {
        id: `msg-ticket-concluido-${Date.now()}`,
        timestamp: '11:42',
        remetente: 'prumo',
        tipo: 'texto',
        dados: {
          texto: `Ticket TCK-8841 respondido pela analista: "${resposta.slice(0, 70)}...". Planta anexada ao processo.`
        },
        fonteAnalise: 'Tempo simulado'
      }
    ]);
  };

  return (
    <ReuniaoContext.Provider
      value={{
        estado,
        modoEscuta,
        fonteFala,
        participantesAvisados,
        tempoDecorrido,
        indiceFalaAtual,
        falaMaisRecente,
        mensagens,
        checklist,
        compromissos,
        abaAtiva,
        aoVivoReal,
        dataSimuladaRelogio,
        diasAvancadosDemo,
        temContradicaoPendente,
        analisandoFala,
        janelaMaximizadaVertical,
        setJanelaMaximizadaVertical,
        toggleMaximizarVertical,
        painelResumoAberto,
        painelTicketAberto,
        ticketIdSelecionado,
        painelSobreAberto,
        alertaDemonstrativo,
        setAbaAtiva,
        setModoEscuta,
        setFonteFala,
        setParticipantesAvisados,
        iniciarReuniao,
        pausarReuniao,
        retomarReuniao,
        avancarUmaFala,
        concluirAoVivo,
        adicionarMensagemPrumo,
        adicionarMensagemUsuario,
        aplicarChecklistAoVivo,
        solicitarEncerramento,
        cancelarEncerramento,
        confirmarEncerramento,
        decidirContradicao,
        confirmarCompromisso,
        editarPrazoCompromisso,
        alternarItemChecklistManual,
        desmarcarItemMensagem,
        enviarMensagemUsuario,
        avancarTresDiasDemo,
        reiniciarDemonstracao,
        abrirTicketSimulado,
        fecharTicketSimulado,
        concluirTicketSimulado,
        setPainelResumoAberto,
        setPainelSobreAberto,
        fecharAlertaDemonstrativo
      }}
    >
      {children}
    </ReuniaoContext.Provider>
  );
};

export const useReuniao = () => useContext(ReuniaoContext);

function formatarHoraSimulada(indiceFala: number): string {
  const min = Math.min(59, Math.floor(indiceFala * 1.8));
  return `14:${min.toString().padStart(2, '0')}`;
}
