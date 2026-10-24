import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import { criarGravador } from '../../electron/transcricoes.mjs';
import { validarTranscricao } from '../validar-transcricao.mjs';

function criarDirTemp() {
  const dir = path.join(os.tmpdir(), `prumo-teste-transcricao-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('F5.2: Iniciar, ordenar por inicioMs, recalcular estatísticas e finalizar com JSON válido', () => {
  const dir = criarDirTemp();
  try {
    const gravador = criarGravador({ diretorioDados: dir, escreverSincrono: true });

    const inicio = gravador.iniciar({
      id: 'REU-TESTE-1',
      processo: 'Alvará Residencial Teste',
      modoEscuta: 'gravacao_com_aviso',
      participantesAvisados: true
    });

    assert.ok(inicio.caminho);
    assert.ok(fs.existsSync(inicio.caminho));

    // Anexar segmentos fora de ordem propositalmente (2º antes do 1º)
    gravador.anexar({
      id: 10,
      falante: 'prefeitura',
      atribuicao: 'canal',
      canal: 'monitor',
      inicioMs: 5000,
      fimMs: 9000,
      texto: 'Fala da prefeitura',
      descartadoPorEco: false,
      motivoDescarte: null,
      latenciaMs: 400
    });

    gravador.anexar({
      id: 5,
      falante: 'implantadora',
      atribuicao: 'canal',
      canal: 'microfone',
      inicioMs: 1000,
      fimMs: 4500,
      texto: 'Fala da implantadora que veio depois no código mas começou antes',
      descartadoPorEco: false,
      motivoDescarte: null,
      latenciaMs: 600
    });

    gravador.evento({ tMs: 9500, tipo: 'aviso', detalhe: 'Aviso de teste' });

    const final = gravador.finalizar({ rtfMedio: 0.15 });

    // Verificar se ordenou por inicioMs
    assert.equal(final.segmentos.length, 2);
    assert.equal(final.segmentos[0].id, 5);
    assert.equal(final.segmentos[0].inicioMs, 1000);
    assert.equal(final.segmentos[1].id, 10);
    assert.equal(final.segmentos[1].inicioMs, 5000);

    // Estatísticas
    assert.equal(final.estatisticas.segmentos, 2);
    assert.equal(final.estatisticas.porFalante.implantadora, 1);
    assert.equal(final.estatisticas.porFalante.prefeitura, 1);
    assert.equal(final.estatisticas.latenciaMedianaMs, 500);

    // Validação contra o validador
    const conteudoDisco = JSON.parse(fs.readFileSync(inicio.caminho, 'utf-8'));
    const validacao = validarTranscricao(conteudoDisco);
    assert.equal(validacao.valido, true, `Erros: ${validacao.erros.join(', ')}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('F5.2: Modos de escuta e recusas de segurança', () => {
  const dir = criarDirTemp();
  try {
    const gravador = criarGravador({ diretorioDados: dir, escreverSincrono: true });

    // 1. Participantes não avisados -> REJEITA
    assert.throws(
      () =>
        gravador.iniciar({
          id: 'REU-SEM-AVISO',
          processo: 'Proc',
          modoEscuta: 'gravacao_com_aviso',
          participantesAvisados: false
        }),
      /participantes devem ser avisados/
    );

    // 2. Modo notas -> REJEITA
    assert.throws(
      () =>
        gravador.iniciar({
          id: 'REU-NOTAS',
          processo: 'Proc',
          modoEscuta: 'modo_notas',
          participantesAvisados: true
        }),
      /modo_notas/
    );

    // 3. Modo escuta_sem_guardar -> NÃO CRIA NADA EM DISCO
    const inicioSemGuardar = gravador.iniciar({
      id: 'REU-SEM-GUARDAR',
      processo: 'Proc',
      modoEscuta: 'escuta_sem_guardar',
      participantesAvisados: true
    });

    assert.equal(inicioSemGuardar.caminho, null);
    assert.equal(gravador.anexar({ id: 1, inicioMs: 0, fimMs: 100, texto: 'teste' }), false);
    assert.equal(gravador.evento({ tMs: 50, tipo: 'aviso' }), false);
    const finalSemGuardar = gravador.finalizar();
    assert.equal(finalSemGuardar.reuniao.estado, 'concluida');

    // NENHUM arquivo criado em dir (nem .tmp nem .json)
    const arquivos = fs.readdirSync(dir);
    assert.equal(arquivos.length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('F5.2: Validação de limites (texto > 5000 chars)', () => {
  const dir = criarDirTemp();
  try {
    const gravador = criarGravador({ diretorioDados: dir, escreverSincrono: true });
    gravador.iniciar({
      id: 'REU-LIMITES',
      processo: 'Proc',
      modoEscuta: 'gravacao_com_aviso',
      participantesAvisados: true
    });

    const textoGigante = 'a'.repeat(5001);
    assert.throws(
      () =>
        gravador.anexar({
          id: 1,
          inicioMs: 0,
          fimMs: 100,
          texto: textoGigante
        }),
      /excede o limite máximo/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('F5.2: Recuperar sessões órfãs em_andamento -> interrompida', () => {
  const dir = criarDirTemp();
  try {
    const arqOrfao = path.join(dir, '2026-10-24T14-00-00_ORFA.json');
    const conteudoOrfao = {
      versaoEsquema: 1,
      reuniao: {
        id: 'ORFA',
        processo: 'Processo Órfão',
        iniciadaEm: '2026-10-24T14:00:00-03:00',
        encerradaEm: null,
        estado: 'em_andamento',
        modoEscuta: 'gravacao_com_aviso',
        participantesAvisados: true
      },
      motor: { nome: 'm', biblioteca: 'b', idioma: 'pt', threads: null, rtfMedio: null },
      falantes: [],
      segmentos: [],
      eventos: [],
      estatisticas: { segmentos: 0, descartadosPorEco: 0, duracaoMs: 0, porFalante: { implantadora: 0, prefeitura: 0, indefinido: 0 }, latenciaMedianaMs: null }
    };
    fs.writeFileSync(arqOrfao, JSON.stringify(conteudoOrfao, null, 2));

    const gravador = criarGravador({ diretorioDados: dir });
    const recuperados = gravador.recuperarOrfas();

    assert.equal(recuperados.length, 1);
    assert.equal(recuperados[0], '2026-10-24T14-00-00_ORFA.json');

    const atualizado = JSON.parse(fs.readFileSync(arqOrfao, 'utf-8'));
    assert.equal(atualizado.reuniao.estado, 'interrompida');
    assert.ok(atualizado.reuniao.encerradaEm);
    assert.equal(validarTranscricao(atualizado).valido, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('F5.2: Escrita atômica concorrente (leitura contínua durante 200 escritas não vê arquivo corrompido)', async () => {
  const dir = criarDirTemp();
  try {
    const gravador = criarGravador({ diretorioDados: dir, escreverSincrono: true });
    const inicio = gravador.iniciar({
      id: 'REU-CONCORRENCIA',
      processo: 'Proc Concorrente',
      modoEscuta: 'gravacao_com_aviso',
      participantesAvisados: true
    });

    let leiturasComSucesso = 0;

    // Realizar 200 escritas enquanto lemos em paralelo
    for (let i = 1; i <= 200; i++) {
      gravador.anexar({
        id: i,
        falante: i % 2 === 0 ? 'prefeitura' : 'implantadora',
        atribuicao: 'canal',
        canal: i % 2 === 0 ? 'monitor' : 'microfone',
        inicioMs: i * 100,
        fimMs: i * 100 + 80,
        texto: `Segmento de número ${i} com texto para teste de concorrência atômica.`
      });

      // Leitura imediata durante o ciclo
      const conteudo = fs.readFileSync(inicio.caminho, 'utf-8');
      const parsed = JSON.parse(conteudo);
      assert.ok(parsed.versaoEsquema === 1);
      leiturasComSucesso++;
    }

    assert.equal(leiturasComSucesso, 200);
    gravador.finalizar();

    const final = JSON.parse(fs.readFileSync(inicio.caminho, 'utf-8'));
    assert.equal(final.segmentos.length, 200);
    assert.equal(validarTranscricao(final).valido, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('F5.2: Sobrevivência a kill -9 (processo filho morre com SIGKILL e JSON continua válido)', async () => {
  const dir = criarDirTemp();
  try {
    // Script descartável para o processo filho
    const scriptFilho = path.join(dir, 'filho-escritor.mjs');
    fs.writeFileSync(
      scriptFilho,
      `
      import { criarGravador } from '${path.resolve('electron/transcricoes.mjs')}';
      const gravador = criarGravador({ diretorioDados: '${dir}', escreverSincrono: true });
      gravador.iniciar({
        id: 'REU-KILL9',
        processo: 'Teste Kill',
        modoEscuta: 'gravacao_com_aviso',
        participantesAvisados: true
      });
      // Notifica o pai que iniciou
      process.send({ pronto: true });

      let i = 1;
      while (true) {
        gravador.anexar({
          id: i,
          inicioMs: i * 10,
          fimMs: i * 10 + 5,
          texto: 'Texto ' + i
        });
        i++;
      }
      `
    );

    const filho = fork(scriptFilho);

    await new Promise((resolve) => {
      filho.on('message', (msg) => {
        if (msg.pronto) resolve();
      });
    });

    // Esperar escrever alguns itens e mandar SIGKILL
    await new Promise((r) => setTimeout(r, 50));
    filho.kill('SIGKILL');

    await new Promise((resolve) => {
      filho.on('exit', () => resolve());
    });

    // Encontrar arquivo gerado
    const arquivos = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.tmp'));
    assert.equal(arquivos.length, 1);

    const conteudo = fs.readFileSync(path.join(dir, arquivos[0]), 'utf-8');
    const json = JSON.parse(conteudo);
    assert.equal(json.reuniao.id, 'REU-KILL9');
    assert.ok(json.segmentos.length > 0);

    // O arquivo após kill -9 deve ser JSON válido e passar no validador
    const validacao = validarTranscricao(json);
    assert.equal(validacao.valido, true, `Erros pós-kill: ${validacao.erros.join(', ')}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
