/**
 * Testes do controlador da transcrição ao vivo (F6) com fontes, sessão e motor falsos:
 * sem Electron, sem microfone, sem modelo. Rodar: npm run teste:aovivo
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MotorSTTSimulado } from '../../src/services/stt/motor-simulado.ts';
import { ControladorAoVivo, FOLGA_ORIGEM_MS, traduzirErroDeCaptura } from '../../src/services/aovivo/controlador.ts';
import type { EstadoFonteDeAudio, FonteDeAudio, InfoCapturaIniciada, SessaoAoVivo } from '../../src/services/aovivo/tipos.ts';
import type { MetaReuniao, SegmentoPersistido } from '../../src/types/transcricao.ts';

const META: MetaReuniao = { id: 'REU-01', processo: 'Alvará', modoEscuta: 'gravacao_com_aviso', participantesAvisados: true };
const espera = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

function erroNomeado(nome: string, mensagem = nome): Error {
  const erro = new Error(mensagem);
  erro.name = nome;
  return erro;
}

class FonteFalsa implements FonteDeAudio {
  chamadas: string[] = [];
  relogio: number | null = 5000;
  info: InfoCapturaIniciada = { modoUmCanal: false, microfone: 'Mic de teste', monitor: 'Monitor de teste' };
  falharAoIniciar: Error | null = null;
  atrasoIniciarMs = 0;
  private listenersEstado = new Set<(e: EstadoFonteDeAudio) => void>();
  onBloco() {
    return () => {};
  }
  onEstado(fn: (e: EstadoFonteDeAudio) => void) {
    this.listenersEstado.add(fn);
    return () => this.listenersEstado.delete(fn);
  }
  emitirEstado(e: Partial<EstadoFonteDeAudio>) {
    const estado = { ativo: true, modoUmCanal: false, microfone: 'Mic de teste', monitor: 'Monitor de teste', ...e };
    this.listenersEstado.forEach((fn) => fn(estado));
  }
  async iniciar() {
    this.chamadas.push('iniciar');
    if (this.atrasoIniciarMs) await espera(this.atrasoIniciarMs);
    if (this.falharAoIniciar) throw this.falharAoIniciar;
    return this.info;
  }
  async parar() {
    this.chamadas.push('parar');
  }
  pausar() {
    this.chamadas.push('pausar');
  }
  retomar() {
    this.chamadas.push('retomar');
  }
  tempoContextoMs() {
    return this.relogio;
  }
}

class SessaoFalsa implements SessaoAoVivo {
  chamadas: string[] = [];
  opcoesDeInicio: any = null;
  metaRecebida: MetaReuniao | null = null;
  finalizarOpcoes: any[] = [];
  falharAoIniciar: Error | null = null;
  falharAoFinalizar: Error | null = null;
  atrasoFinalizarMs = 0;
  caminho: string | null = 'dados/transcricoes/teste.json';
  private ouvintes = new Set<(s: SegmentoPersistido) => void>();
  modoUmCanalRecebido: boolean[] = [];

  async iniciar(meta: MetaReuniao, opcoes?: { modoUmCanal?: boolean; origemMs?: number }) {
    this.chamadas.push('iniciar');
    this.metaRecebida = meta;
    this.opcoesDeInicio = opcoes;
    if (this.falharAoIniciar) throw this.falharAoIniciar;
    return { caminho: meta.modoEscuta === 'escuta_sem_guardar' ? null : this.caminho, idArquivo: 'teste' };
  }
  async pausar() {
    this.chamadas.push('pausar');
  }
  retomar() {
    this.chamadas.push('retomar');
  }
  async finalizar(opcoes?: { interrompida?: boolean }) {
    this.chamadas.push('finalizar');
    this.finalizarOpcoes.push(opcoes);
    if (this.atrasoFinalizarMs) await espera(this.atrasoFinalizarMs);
    if (this.falharAoFinalizar) throw this.falharAoFinalizar;
    return null;
  }
  definirFalanteManual() {}
  definirModoUmCanal(v: boolean) {
    this.modoUmCanalRecebido.push(v);
  }
  aoSegmento(fn: (s: SegmentoPersistido) => void) {
    this.ouvintes.add(fn);
    return () => this.ouvintes.delete(fn);
  }
  aoEstado() {
    return () => {};
  }
  estatisticas() {
    return { segmentos: this.totalEmitido, descartadosPorEco: 0, duracaoMs: 0, porFalante: { implantadora: 0, prefeitura: 0, indefinido: 0 }, latenciaMedianaMs: null };
  }
  totalEmitido = 0;
  emitir(parcial: Partial<SegmentoPersistido> = {}) {
    const segmento: SegmentoPersistido = {
      id: ++this.totalEmitido,
      falante: 'prefeitura',
      atribuicao: 'canal',
      canal: 'monitor',
      inicioMs: 1000,
      fimMs: 3000,
      texto: 'Aqui a gente usa 3 metros de recuo frontal.',
      confianca: null,
      descartadoPorEco: false,
      motivoDescarte: null,
      latenciaMs: 1500,
      forcadoPorTamanho: false,
      ...parcial
    };
    this.ouvintes.forEach((fn) => fn(segmento));
  }
}

async function montar(opcoes: { motor?: MotorSTTSimulado } = {}) {
  const motor = opcoes.motor ?? new MotorSTTSimulado();
  const fonte = new FonteFalsa();
  const sessoes: SessaoFalsa[] = [];
  const modosPedidos: string[] = [];
  const controlador = new ControladorAoVivo({
    motor,
    fonte,
    criarSessao: (modo) => {
      modosPedidos.push(modo);
      const sessao = new SessaoFalsa();
      sessoes.push(sessao);
      return sessao;
    }
  });
  return { controlador, motor, fonte, sessoes, modosPedidos, sessao: () => sessoes[sessoes.length - 1] };
}

async function prontoParaIniciar() {
  const ambiente = await montar();
  await ambiente.controlador.preparar();
  assert.equal(ambiente.controlador.obterSnapshot().fase, 'pronto');
  return ambiente;
}

test('preparar: ocioso → carregando_modelo → pronto, e é idempotente com chamadas simultâneas', async () => {
  const { controlador, motor } = await montar();
  const fases: string[] = [controlador.obterSnapshot().fase];
  controlador.assinar((s) => fases.push(s.fase));
  await Promise.all([controlador.preparar(), controlador.preparar(), controlador.preparar()]);
  await controlador.preparar();
  assert.deepEqual([...new Set(fases)], ['ocioso', 'carregando_modelo', 'pronto']);
  assert.equal(motor.estado, 'pronto');
  assert.equal(controlador.obterSnapshot().motor.nome, 'simulado');
});

test('preparar: falha do modelo vira fase "erro" com a mensagem, e uma nova tentativa funciona', async () => {
  const motor = new MotorSTTSimulado({ falharAoCarregar: 'Modelo não encontrado. Rode "npm run modelos".' });
  const { controlador } = await montar({ motor });
  await controlador.preparar();
  const s = controlador.obterSnapshot();
  assert.equal(s.fase, 'erro');
  assert.equal(s.origemDoErro, 'modelo');
  assert.match(s.erro ?? '', /npm run modelos/);
  (motor as any).opcoes.falharAoCarregar = undefined;
  await controlador.preparar();
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
  assert.equal(controlador.obterSnapshot().erro, null);
});

test('iniciar: abre a captura, cria a sessão do modo certo e usa origem = relógio − folga', async () => {
  const { controlador, fonte, sessao, modosPedidos } = await prontoParaIniciar();
  assert.equal(await controlador.iniciar(META), true);
  const s = controlador.obterSnapshot();
  assert.equal(s.fase, 'gravando');
  assert.deepEqual(modosPedidos, ['gravacao_com_aviso']);
  assert.deepEqual(fonte.chamadas, ['iniciar']);
  assert.equal(sessao().opcoesDeInicio.origemMs, 5000 - FOLGA_ORIGEM_MS);
  assert.equal(sessao().opcoesDeInicio.modoUmCanal, false);
  assert.equal(s.caminho, 'dados/transcricoes/teste.json');
  assert.deepEqual(s.dispositivos, { microfone: 'Mic de teste', monitor: 'Monitor de teste' });
  assert.deepEqual(s.avisos, []);
});

test('iniciar: sem modelo pronto, em modo notas ou sem aviso aos participantes recusa SEM abrir o microfone', async () => {
  const frio = await montar();
  assert.equal(await frio.controlador.iniciar(META), false);
  assert.match(frio.controlador.obterSnapshot().erro ?? '', /ainda não está pronto/);
  assert.deepEqual(frio.fonte.chamadas, []);

  const { controlador, fonte, sessoes } = await prontoParaIniciar();
  assert.equal(await controlador.iniciar({ ...META, modoEscuta: 'modo_notas' }), false);
  assert.match(controlador.obterSnapshot().erro ?? '', /não capta áudio/);
  assert.equal(await controlador.iniciar({ ...META, participantesAvisados: false }), false);
  assert.match(controlador.obterSnapshot().erro ?? '', /Avise os participantes/);
  assert.deepEqual(fonte.chamadas, []);
  assert.equal(sessoes.length, 0);
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
});

test('iniciar: microfone negado → mensagem clara, captura desfeita, dá para tentar de novo', async () => {
  const { controlador, fonte, sessoes } = await prontoParaIniciar();
  fonte.falharAoIniciar = erroNomeado('NotAllowedError', 'Permission denied');
  assert.equal(await controlador.iniciar(META), false);
  const s = controlador.obterSnapshot();
  assert.equal(s.fase, 'pronto');
  assert.equal(s.origemDoErro, 'captura');
  assert.match(s.erro ?? '', /Sem permissão para usar o microfone/);
  assert.deepEqual(fonte.chamadas, ['iniciar', 'parar']);
  assert.equal(sessoes.length, 0);
  fonte.falharAoIniciar = null;
  assert.equal(await controlador.iniciar(META), true);
  assert.equal(controlador.obterSnapshot().erro, null);
});

test('iniciar: falha ao abrir a sessão fecha a sessão como interrompida e solta o microfone', async () => {
  const { controlador, fonte } = await prontoParaIniciar();
  const original = (controlador as any).deps.criarSessao;
  let criada: SessaoFalsa | null = null;
  (controlador as any).deps.criarSessao = (modo: any) => {
    criada = original(modo);
    criada!.falharAoIniciar = new Error('disco cheio');
    return criada;
  };
  assert.equal(await controlador.iniciar(META), false);
  assert.match(controlador.obterSnapshot().erro ?? '', /disco cheio/);
  assert.deepEqual(fonte.chamadas, ['iniciar', 'parar']);
  assert.deepEqual(criada!.finalizarOpcoes, [{ interrompida: true }]);
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
});

test('iniciar: duplo clique abre a captura uma única vez', async () => {
  const { controlador, fonte, sessoes } = await prontoParaIniciar();
  fonte.atrasoIniciarMs = 20;
  const [a, b] = await Promise.all([controlador.iniciar(META), controlador.iniciar(META)]);
  assert.deepEqual([a, b].sort(), [false, true]);
  assert.equal(fonte.chamadas.filter((c) => c === 'iniciar').length, 1);
  assert.equal(sessoes.length, 1);
  assert.equal(controlador.obterSnapshot().fase, 'gravando');
  assert.equal(controlador.obterSnapshot().erro, null);
});

test('cancelar no meio do início: a captura aberta depois é fechada e nenhuma sessão nasce', async () => {
  const { controlador, fonte, sessoes } = await prontoParaIniciar();
  fonte.atrasoIniciarMs = 40;
  const iniciando = controlador.iniciar(META);
  await espera(5);
  await controlador.cancelar();
  assert.equal(await iniciando, false);
  assert.equal(sessoes.length, 0);
  assert.equal(fonte.chamadas.filter((c) => c === 'parar').length >= 1, true);
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
  assert.equal(controlador.ativa, false);
});

test('cancelar durante a carga do modelo: o resultado velho não vira erro nem sessão; a fase acompanha o motor real', async () => {
  const motor = new MotorSTTSimulado();
  const original = motor.carregar.bind(motor);
  motor.carregar = async () => {
    await espera(30);
    return original();
  };
  const { controlador } = await montar({ motor });
  const carregando = controlador.preparar();
  await espera(5);
  await controlador.cancelar();
  assert.equal(controlador.obterSnapshot().fase, 'ocioso');
  await carregando;
  // O modelo terminou de carregar de verdade: "pronto" é o retrato fiel, sem erro nem sessão.
  assert.equal(motor.estado, 'pronto');
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
  assert.equal(controlador.obterSnapshot().erro, null);
  assert.equal(controlador.ativa, false);
});

test('pausar e retomar: só valem em gravação; a captura continua aberta', async () => {
  const { controlador, fonte, sessao } = await prontoParaIniciar();
  await controlador.pausar();
  controlador.retomar();
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
  await controlador.iniciar(META);
  await controlador.pausar();
  assert.equal(controlador.obterSnapshot().fase, 'pausada');
  assert.deepEqual(sessao().chamadas, ['iniciar', 'pausar']);
  controlador.retomar();
  assert.equal(controlador.obterSnapshot().fase, 'gravando');
  assert.deepEqual(sessao().chamadas, ['iniciar', 'pausar', 'retomar']);
  assert.ok(!fonte.chamadas.includes('parar'));
});

test('finalizar: para de alimentar, espera a sessão, fecha o áudio e entrega o caminho do JSON', async () => {
  const { controlador, fonte, sessao } = await prontoParaIniciar();
  await controlador.iniciar(META);
  sessao().emitir();
  sessao().atrasoFinalizarMs = 15;
  await controlador.finalizar();
  const s = controlador.obterSnapshot();
  assert.equal(s.fase, 'concluida');
  assert.equal(s.caminho, 'dados/transcricoes/teste.json');
  assert.equal(s.estatisticas?.segmentos, 1);
  assert.deepEqual(fonte.chamadas, ['iniciar', 'pausar', 'parar']);
  assert.deepEqual(sessao().chamadas, ['iniciar', 'finalizar']);
  assert.equal(controlador.ativa, false);
});

test('finalizar em "escuta sem guardar": nenhum caminho de arquivo', async () => {
  const { controlador, modosPedidos } = await prontoParaIniciar();
  await controlador.iniciar({ ...META, modoEscuta: 'escuta_sem_guardar' });
  assert.deepEqual(modosPedidos, ['escuta_sem_guardar']);
  assert.equal(controlador.obterSnapshot().caminho, null);
  await controlador.finalizar();
  assert.equal(controlador.obterSnapshot().caminho, null);
  assert.equal(controlador.obterSnapshot().fase, 'concluida');
});

test('finalizar com falha da sessão: conclui, avisa que o arquivo pode estar incompleto e solta o microfone', async () => {
  const { controlador, fonte, sessao } = await prontoParaIniciar();
  await controlador.iniciar(META);
  sessao().falharAoFinalizar = new Error('erro de gravação');
  await controlador.finalizar();
  const s = controlador.obterSnapshot();
  assert.equal(s.fase, 'concluida');
  assert.equal(s.origemDoErro, 'finalizacao');
  assert.match(s.erro ?? '', /incompleto/);
  assert.ok(fonte.chamadas.includes('parar'));
});

test('segmentos: acumulam em ordem de chegada; "último" ignora eco e fala vazia', async () => {
  const { controlador, sessao } = await prontoParaIniciar();
  await controlador.iniciar(META);
  sessao().emitir({ texto: 'primeira fala' });
  sessao().emitir({ texto: '', descartadoPorEco: true, motivoDescarte: 'eco_sinal', falante: 'implantadora', canal: 'microfone' });
  sessao().emitir({ texto: 'segunda fala', falante: 'implantadora', canal: 'microfone' });
  sessao().emitir({ texto: 'eco de texto', descartadoPorEco: true, motivoDescarte: 'eco_texto' });
  const s = controlador.obterSnapshot();
  assert.equal(s.segmentos.length, 4);
  assert.equal(s.ultimo?.texto, 'segunda fala');
});

test('segmentos de uma sessão cancelada não aparecem na seguinte', async () => {
  const { controlador, sessao, sessoes } = await prontoParaIniciar();
  await controlador.iniciar(META);
  const antiga = sessao();
  await controlador.cancelar();
  antiga.emitir({ texto: 'fantasma' });
  assert.equal(controlador.obterSnapshot().segmentos.length, 0);
  await controlador.iniciar(META);
  assert.equal(sessoes.length, 2);
  assert.equal(controlador.obterSnapshot().segmentos.length, 0);
});

test('cancelar com sessão ativa: fecha como interrompida, fecha o áudio e zera a tela', async () => {
  const { controlador, fonte, sessao } = await prontoParaIniciar();
  await controlador.iniciar(META);
  sessao().emitir();
  const aberta = sessao();
  await controlador.cancelar();
  assert.deepEqual(aberta.finalizarOpcoes, [{ interrompida: true }]);
  assert.ok(fonte.chamadas.includes('parar'));
  const s = controlador.obterSnapshot();
  assert.equal(s.fase, 'pronto');
  assert.equal(s.segmentos.length, 0);
  assert.equal(s.caminho, null);
  assert.equal(controlador.ativa, false);
});

test('monitor some no meio da reunião: avisa, passa a um canal na sessão e volta quando reaparece', async () => {
  const { controlador, fonte, sessao } = await prontoParaIniciar();
  await controlador.iniciar(META);
  fonte.emitirEstado({ modoUmCanal: true, monitor: 'Sem canal de reunião (só microfone)' });
  let s = controlador.obterSnapshot();
  assert.equal(s.modoUmCanal, true);
  assert.match(s.avisos.join(' '), /só o microfone/);
  fonte.emitirEstado({ modoUmCanal: false });
  s = controlador.obterSnapshot();
  assert.equal(s.modoUmCanal, false);
  assert.deepEqual(sessao().modoUmCanalRecebido, [true, false]);
});

test('iniciar sem monitor desde o começo: um canal, com aviso', async () => {
  const ambiente = await montar();
  ambiente.fonte.info = { modoUmCanal: true, microfone: 'Mic', monitor: 'Sem canal de reunião (só microfone)' };
  await ambiente.controlador.preparar();
  await ambiente.controlador.iniciar(META);
  assert.equal(ambiente.sessao().opcoesDeInicio.modoUmCanal, true);
  assert.equal(ambiente.controlador.obterSnapshot().modoUmCanal, true);
  assert.equal(ambiente.controlador.obterSnapshot().avisos.length, 1);
});

test('motor descarregado por ociosidade fora da reunião: pronto → ocioso; durante a reunião só avisa se cair', async () => {
  const { controlador, motor } = await prontoParaIniciar();
  await motor.descarregar();
  assert.equal(controlador.obterSnapshot().fase, 'ocioso');
  await controlador.preparar();
  assert.equal(controlador.obterSnapshot().fase, 'pronto');
  await controlador.iniciar(META);
  await motor.descarregar();
  // Em reunião: a fase não muda, o motor é recarregado e a pessoa é avisada.
  assert.equal(controlador.obterSnapshot().fase, 'gravando');
  assert.match(controlador.obterSnapshot().avisos.join(' '), /recarregado/);
  await espera(20);
  assert.equal(motor.estado, 'pronto');
});

test('traduzirErroDeCaptura: mensagens para a pessoa, sem jargão', () => {
  assert.match(traduzirErroDeCaptura(erroNomeado('NotAllowedError')), /permissão/i);
  assert.match(traduzirErroDeCaptura(erroNomeado('NotFoundError')), /Nenhum microfone/);
  assert.match(traduzirErroDeCaptura(erroNomeado('NotReadableError')), /em uso/);
  assert.equal(traduzirErroDeCaptura(new Error('falha estranha')), 'Não foi possível abrir o áudio: falha estranha');
});

test('assinar: o ouvinte recebe cada mudança e para de receber depois de cancelar a assinatura', async () => {
  const { controlador } = await montar();
  const vistas: string[] = [];
  const parar = controlador.assinar((s) => {
    if (vistas[vistas.length - 1] !== s.fase) vistas.push(s.fase);
  });
  await controlador.preparar();
  parar();
  await controlador.cancelar();
  assert.deepEqual(vistas, ['carregando_modelo', 'pronto']);
});
