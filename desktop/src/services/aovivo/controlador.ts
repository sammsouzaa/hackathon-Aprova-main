/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Controlador da transcrição ao vivo: liga captura (F2), motor (F4) e sessão (F5) ao ciclo da
 * reunião. Sem React, sem Electron: tudo entra por injeção, então roda em Node nos testes.
 *
 * Regras:
 *  - "Iniciar" só vale com o modelo pronto; cada operação assíncrona confere um token de geração,
 *    então reiniciar no meio de uma carga/início não deixa resultado velho vazar para o estado atual;
 *  - modo_notas nunca capta áudio; participantes não avisados nunca iniciam;
 *  - falhar ao iniciar desfaz a captura (nenhum microfone aberto sem sessão);
 *  - pausar suspende o envio ao motor (a captura segue aberta, os medidores continuam);
 *  - nenhum texto "ao vivo" sem captura rodando: o snapshot só tem fase 'gravando' com captura ativa.
 */
import type { MotorSTT } from '../stt/tipos.ts';
import type { ServicoAnalise } from './analise.ts';
import type {
  EstatisticasTranscricao,
  MetaReuniao,
  ModoEscutaPersistido,
  SegmentoPersistido
} from '../../types/transcricao.ts';
import type {
  FaseAoVivo,
  FonteDeAudio,
  ListenerAoVivo,
  SessaoAoVivo,
  SnapshotAoVivo
} from './tipos.ts';

/** Folga entre o relógio do AudioContext no início e o t=0 da reunião: todo bloco começa depois dele. */
export const FOLGA_ORIGEM_MS = 200;

export interface DependenciasControlador {
  motor: MotorSTT;
  fonte: FonteDeAudio;
  /** Cria a sessão do modo pedido (gravacao_com_aviso grava JSON; escuta_sem_guardar nunca grava). */
  criarSessao(modoEscuta: ModoEscutaPersistido): SessaoAoVivo;
  /** Sessão na API do Prumo (análise e checklist); ausente nos testes e fora do desktop. */
  analise?: ServicoAnalise;
}

const FASES_ATIVAS: FaseAoVivo[] = ['iniciando', 'gravando', 'pausada', 'finalizando'];

/** Mesma conta do gravador de JSON (electron/transcricoes.mjs), para o modo que não grava em disco. */
export function calcularEstatisticas(segmentos: SegmentoPersistido[]): EstatisticasTranscricao {
  const porFalante: EstatisticasTranscricao['porFalante'] = { implantadora: 0, prefeitura: 0, indefinido: 0 };
  const latencias: number[] = [];
  let descartadosPorEco = 0;
  let duracaoMs = 0;
  for (const segmento of segmentos) {
    if (segmento.descartadoPorEco) descartadosPorEco++;
    porFalante[segmento.falante] = (porFalante[segmento.falante] ?? 0) + 1;
    if (typeof segmento.latenciaMs === 'number' && segmento.latenciaMs >= 0) latencias.push(segmento.latenciaMs);
    duracaoMs = Math.max(duracaoMs, segmento.fimMs);
  }
  latencias.sort((x, y) => x - y);
  const meio = Math.floor(latencias.length / 2);
  const mediana = latencias.length === 0 ? null : latencias.length % 2 ? latencias[meio] : Math.round((latencias[meio - 1] + latencias[meio]) / 2);
  return { segmentos: segmentos.length, descartadosPorEco, duracaoMs, porFalante, latenciaMedianaMs: mediana };
}

export function traduzirErroDeCaptura(erro: unknown): string {
  const nome = (erro as { name?: string })?.name ?? '';
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return 'Sem permissão para usar o microfone. Libere o acesso ao áudio para o Prumo e tente de novo.';
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
    return 'Nenhum microfone encontrado. Conecte um microfone ou escolha outro no menu ⋯.';
  }
  if (nome === 'NotReadableError') {
    return 'O microfone está em uso por outro programa. Feche-o e tente de novo.';
  }
  return mensagem ? `Não foi possível abrir o áudio: ${mensagem}` : 'Não foi possível abrir o áudio.';
}

export class ControladorAoVivo {
  private readonly deps: DependenciasControlador;
  private readonly listeners = new Set<ListenerAoVivo>();
  private snapshotAtual: SnapshotAoVivo;
  private geracao = 0;
  private sessao: SessaoAoVivo | null = null;
  private desinscreverSessao: Array<() => void> = [];
  private desinscreverAnalise: (() => void) | null = null;
  private desinscreverFonte: (() => void) | null = null;
  private desinscreverMotor: (() => void) | null = null;
  private preparando: Promise<void> | null = null;

  constructor(deps: DependenciasControlador) {
    this.deps = deps;
    this.snapshotAtual = this.snapshotInicial();
    this.desinscreverMotor = deps.motor.aoMudarEstado((estado, detalhe) => this.aoMotor(estado, detalhe));
    this.desinscreverFonte = deps.fonte.onEstado((estado) => {
      if (!FASES_ATIVAS.includes(this.snapshotAtual.fase)) return;
      // O monitor pode sumir ou voltar no meio da reunião (fone desligado, troca de saída de áudio).
      if (estado.modoUmCanal !== this.snapshotAtual.modoUmCanal) {
        this.sessao?.definirModoUmCanal(estado.modoUmCanal);
        if (estado.modoUmCanal) {
          this.acrescentarAviso('Sem canal da reunião: só o microfone. Quem fala não é identificado automaticamente.');
        }
      }
      this.atualizar({
        modoUmCanal: estado.modoUmCanal,
        dispositivos: { microfone: estado.microfone, monitor: estado.monitor }
      });
    });
  }

  // ---------- leitura ----------

  obterSnapshot(): SnapshotAoVivo {
    return this.snapshotAtual;
  }

  assinar(fn: ListenerAoVivo): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Há uma sessão aberta (iniciando, gravando, pausada ou finalizando)? */
  get ativa(): boolean {
    return FASES_ATIVAS.includes(this.snapshotAtual.fase);
  }

  // ---------- operações ----------

  /** Carrega o modelo (idempotente). Resolve quando pronto; a falha vira fase "erro", não exceção. */
  preparar(): Promise<void> {
    if (this.ativa) return Promise.resolve();
    if (this.preparando) return this.preparando;
    if (this.snapshotAtual.fase === 'pronto' && this.deps.motor.estado === 'pronto') return Promise.resolve();

    const geracao = this.geracao;
    this.atualizar({ fase: 'carregando_modelo', erro: null, origemDoErro: null });
    this.preparando = (async () => {
      try {
        await this.deps.motor.carregar();
        if (geracao !== this.geracao) return;
        // Com a API, a tela de preparação já mostra o cliente (nome e checklist) que ela conhece.
        let contexto = null;
        if (this.deps.analise?.ativo()) {
          try {
            contexto = await this.deps.analise.carregarContexto();
          } catch (erro) {
            this.acrescentarAviso(`Não foi possível ler o contexto do cliente: ${erro instanceof Error ? erro.message : erro}`);
          }
          if (geracao !== this.geracao) return;
        }
        this.atualizar({ fase: 'pronto', erro: null, origemDoErro: null, contexto });
      } catch (erro) {
        if (geracao !== this.geracao) return;
        this.atualizar({
          fase: 'erro',
          origemDoErro: 'modelo',
          erro: erro instanceof Error ? erro.message : String(erro)
        });
      } finally {
        this.preparando = null;
      }
    })();
    return this.preparando;
  }

  /**
   * Abre a captura e a sessão. Devolve true se a reunião pode começar; em caso de falha devolve
   * false e o motivo fica em `snapshot.erro` (a captura já foi desfeita).
   */
  async iniciar(meta: MetaReuniao): Promise<boolean> {
    // Duplo clique em "Iniciar": a segunda chamada não faz nada e não mexe no erro da primeira.
    if (this.ativa) return false;
    if (this.snapshotAtual.fase !== 'pronto') {
      this.recusar('O modelo de transcrição ainda não está pronto.');
      return false;
    }
    if (meta.modoEscuta === 'modo_notas') {
      this.recusar('O modo notas não capta áudio. Escolha outro modo de escuta ou a fonte Roteiro.');
      return false;
    }
    if (!meta.participantesAvisados) {
      this.recusar('Avise os participantes antes de iniciar a transcrição.');
      return false;
    }

    const geracao = ++this.geracao;
    this.atualizar({
      fase: 'iniciando',
      erro: null,
      origemDoErro: null,
      modoEscuta: meta.modoEscuta,
      segmentos: [],
      ultimo: null,
      caminho: null,
      avisos: [],
      estatisticas: null,
      copiloto: null,
      transcricaoPor: null
    });

    try {
      const captura = await this.deps.fonte.iniciar();
      if (geracao !== this.geracao) {
        await this.deps.fonte.parar().catch(() => {});
        return false;
      }

      // Transcrição pela API: abre a sessão lá (contexto, checklist) antes de começar a enviar áudio.
      const analise = this.deps.analise;
      const viaApi = Boolean(analise?.ativo());
      if (analise && viaApi) {
        try {
          await analise.iniciar(meta);
        } catch (erro) {
          if (geracao !== this.geracao) return false;
          await this.desfazer();
          this.falhar('sessao', `Não foi possível abrir a reunião na API: ${erro instanceof Error ? erro.message : erro}`);
          return false;
        }
        if (geracao !== this.geracao) {
          await analise.encerrar({ finalizar: false }).catch(() => {});
          await this.deps.fonte.parar().catch(() => {});
          return false;
        }
        this.desinscreverAnalise = analise.aoCopiloto((copiloto) => {
          if (geracao === this.geracao) this.atualizar({ copiloto });
        });
      }

      const sessao = this.deps.criarSessao(meta.modoEscuta);
      this.sessao = sessao;
      this.desinscreverSessao = [
        sessao.aoSegmento((segmento) => this.aoSegmento(segmento, geracao))
      ];

      const relogio = this.deps.fonte.tempoContextoMs();
      const origemMs = (relogio ?? 0) - FOLGA_ORIGEM_MS;
      const resultado = await sessao.iniciar(meta, { modoUmCanal: captura.modoUmCanal, origemMs });
      if (geracao !== this.geracao) {
        await this.encerrarSessao(sessao, true);
        await this.deps.fonte.parar().catch(() => {});
        return false;
      }

      const avisos = captura.modoUmCanal
        ? ['Sem canal da reunião: só o microfone. Quem fala não é identificado automaticamente.']
        : [];
      if (analise && !viaApi) {
        avisos.push(`API do Prumo indisponível (${analise.motivoFallback() ?? 'sem detalhe'}): transcrição local, sem análise do checklist.`);
      }
      this.atualizar({
        fase: 'gravando',
        modoUmCanal: captura.modoUmCanal,
        dispositivos: { microfone: captura.microfone, monitor: captura.monitor },
        caminho: resultado.caminho,
        avisos,
        transcricaoPor: viaApi ? 'api' : 'local'
      });
      return true;
    } catch (erro) {
      if (geracao !== this.geracao) return false;
      await this.desfazer();
      this.falhar('captura', traduzirErroDeCaptura(erro));
      return false;
    }
  }

  async pausar(): Promise<void> {
    if (this.snapshotAtual.fase !== 'gravando' || !this.sessao) return;
    const sessao = this.sessao;
    this.atualizar({ fase: 'pausada' });
    try {
      await sessao.pausar();
    } catch (erro) {
      this.acrescentarAviso(`Não foi possível registrar a pausa: ${erro instanceof Error ? erro.message : erro}`);
    }
  }

  retomar(): void {
    if (this.snapshotAtual.fase !== 'pausada' || !this.sessao) return;
    this.sessao.retomar();
    this.atualizar({ fase: 'gravando' });
  }

  /** Fecha a transcrição: espera a fila do motor, grava o JSON e libera o áudio. */
  async finalizar(): Promise<void> {
    if (!this.ativa || !this.sessao) return;
    const sessao = this.sessao;
    const geracao = this.geracao;
    this.atualizar({ fase: 'finalizando' });
    // Para de entregar blocos novos, mas deixa a sessão esvaziar o que já está na fila do motor.
    this.deps.fonte.pausar();
    try {
      const dados = await sessao.finalizar();
      if (geracao !== this.geracao) return;
      try {
        await this.deps.analise?.encerrar({ finalizar: true });
      } catch (erro) {
        this.acrescentarAviso(`Não foi possível fechar a reunião na API: ${erro instanceof Error ? erro.message : erro}`);
      }
      this.atualizar({
        fase: 'concluida',
        estatisticas: dados?.estatisticas ?? calcularEstatisticas(this.snapshotAtual.segmentos),
        caminho: this.snapshotAtual.modoEscuta === 'escuta_sem_guardar' ? null : this.snapshotAtual.caminho
      });
    } catch (erro) {
      if (geracao !== this.geracao) return;
      this.atualizar({
        fase: 'concluida',
        origemDoErro: 'finalizacao',
        erro: `A transcrição foi encerrada, mas o arquivo pode estar incompleto: ${erro instanceof Error ? erro.message : erro}`
      });
    } finally {
      // Reiniciar durante a finalização já limpou tudo; não derruba a sessão nova.
      if (geracao === this.geracao) {
        this.limparSessao();
        await this.deps.fonte.parar().catch(() => {});
      }
    }
  }

  /** Reiniciar a demonstração ou trocar a fonte: abandona o que estiver em andamento. */
  async cancelar(): Promise<void> {
    this.geracao++;
    const sessao = this.sessao;
    const tinhaSessao = this.ativa;
    const fase = this.snapshotAtual.fase;
    this.preparando = null;
    this.limparSessao();
    // Se já está finalizando, deixa a finalização em curso terminar sozinha (não é reentrante).
    if (sessao && tinhaSessao && fase !== 'finalizando') await this.encerrarSessao(sessao, true);
    await this.deps.fonte.parar().catch(() => {});
    const motorPronto = this.deps.motor.estado === 'pronto';
    this.snapshotAtual = {
      ...this.snapshotInicial(),
      fase: motorPronto ? 'pronto' : 'ocioso',
      contexto: motorPronto ? this.snapshotAtual.contexto : null,
      motor: this.descreverMotor()
    };
    this.notificar();
  }

  perguntar(texto: string): Promise<string> {
    const analise = this.deps.analise;
    if (!analise || this.snapshotAtual.transcricaoPor !== 'api') return Promise.reject(new Error('A API não está em uso nesta reunião.'));
    return analise.perguntar(texto);
  }

  marcarItem(itemId: string, status: 'pendente' | 'respondida', resposta?: string): Promise<void> {
    const analise = this.deps.analise;
    if (!analise || this.snapshotAtual.transcricaoPor !== 'api') return Promise.reject(new Error('A API não está em uso nesta reunião.'));
    return analise.marcarItem(itemId, status, resposta);
  }

  definirFalanteManual(falante: 'implantadora' | 'prefeitura' | null): void {
    this.sessao?.definirFalanteManual(falante);
  }

  /** Libera tudo (desmontagem da interface). */
  async destruir(): Promise<void> {
    await this.cancelar();
    this.desinscreverMotor?.();
    this.desinscreverFonte?.();
    this.listeners.clear();
  }

  // ---------- internos ----------

  private snapshotInicial(): SnapshotAoVivo {
    return {
      fase: 'ocioso',
      erro: null,
      origemDoErro: null,
      motor: this.deps ? this.descreverMotor() : { estado: 'descarregado', nome: '', biblioteca: '', threads: null, detalhe: '' },
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
  }

  private descreverMotor(detalhe = this.snapshotAtual?.motor?.detalhe ?? ''): SnapshotAoVivo['motor'] {
    const { motor } = this.deps;
    return {
      estado: motor.estado,
      nome: motor.info.nome,
      biblioteca: motor.info.biblioteca,
      threads: motor.info.threads,
      detalhe
    };
  }

  private aoMotor(estado: string, detalhe?: string): void {
    const fase = this.snapshotAtual.fase;
    const mudancas: Partial<SnapshotAoVivo> = { motor: this.descreverMotor(detalhe ?? '') };
    // O motor foi descarregado por ociosidade ou caiu fora de uma reunião: a interface precisa saber.
    if (!FASES_ATIVAS.includes(fase) && !this.preparando) {
      if (estado === 'descarregado' && fase === 'pronto') mudancas.fase = 'ocioso';
      if (estado === 'erro' && fase !== 'concluida') {
        mudancas.fase = 'erro';
        mudancas.origemDoErro = 'modelo';
        mudancas.erro = detalhe || 'O motor de transcrição parou.';
      }
      if (estado === 'pronto' && (fase === 'ocioso' || fase === 'erro')) {
        mudancas.fase = 'pronto';
        mudancas.erro = null;
        mudancas.origemDoErro = null;
      }
    } else if (FASES_ATIVAS.includes(fase) && estado === 'descarregado') {
      // Descarregado por ociosidade no meio da reunião (pausa longa): recarrega e avisa.
      this.acrescentarAviso('O motor de transcrição foi recarregado; falas durante a recarga podem ter ficado de fora.');
      void this.deps.motor.carregar().catch(() => {});
    } else if (FASES_ATIVAS.includes(fase) && estado === 'erro') {
      this.acrescentarAviso(`O motor de transcrição reiniciou (${detalhe || 'falha'}); algumas falas podem ter ficado de fora.`);
    }
    this.atualizar(mudancas);
  }

  private aoSegmento(segmento: SegmentoPersistido, geracao: number): void {
    if (geracao !== this.geracao) return;
    if (this.snapshotAtual.transcricaoPor === 'api' && !segmento.descartadoPorEco && segmento.texto) {
      this.deps.analise?.solicitarAnalise();
    }
    const segmentos = [...this.snapshotAtual.segmentos, segmento];
    this.atualizar({ segmentos, ultimo: segmento.descartadoPorEco || !segmento.texto ? this.snapshotAtual.ultimo : segmento });
  }

  private acrescentarAviso(aviso: string): void {
    if (this.snapshotAtual.avisos.includes(aviso)) return;
    this.atualizar({ avisos: [...this.snapshotAtual.avisos, aviso] });
  }

  /** Pedido recusado sem mudar de fase (a interface continua mostrando o estado real). */
  private recusar(mensagem: string): void {
    this.atualizar({ erro: mensagem, origemDoErro: 'sessao' });
  }

  private falhar(origem: NonNullable<SnapshotAoVivo['origemDoErro']>, mensagem: string): void {
    const motorPronto = this.deps.motor.estado === 'pronto';
    this.atualizar({ fase: motorPronto ? 'pronto' : 'erro', erro: mensagem, origemDoErro: origem });
  }

  private limparSessao(): void {
    this.desinscreverAnalise?.();
    this.desinscreverAnalise = null;
    // Reinício ou falha: para de acompanhar a API sem fechar a sessão lá (best effort, sem esperar).
    void this.deps.analise?.encerrar({ finalizar: false }).catch(() => {});
    this.desinscreverSessao.forEach((fn) => fn());
    this.desinscreverSessao = [];
    this.sessao = null;
  }

  private async encerrarSessao(sessao: SessaoAoVivo, interrompida: boolean): Promise<void> {
    try {
      await Promise.race([
        sessao.finalizar({ interrompida }),
        new Promise((resolver) => setTimeout(resolver, 4000))
      ]);
    } catch {
      // descartar a sessão não pode falhar para o chamador
    }
  }

  /** Desfaz uma captura que não chegou a virar reunião. */
  private async desfazer(): Promise<void> {
    const sessao = this.sessao;
    this.limparSessao();
    if (sessao) await this.encerrarSessao(sessao, true);
    await this.deps.fonte.parar().catch(() => {});
  }

  private atualizar(mudancas: Partial<SnapshotAoVivo>): void {
    this.snapshotAtual = { ...this.snapshotAtual, ...mudancas };
    this.notificar();
  }

  private notificar(): void {
    const foto = this.snapshotAtual;
    this.listeners.forEach((fn) => fn(foto));
  }
}
