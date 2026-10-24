/**
 * Testes do motor de transcrição sem modelo: limpeza de texto, proteção da inferência e ciclo de
 * vida, com um pipeline falso. Rodar: npm run teste:stt
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  colapsarRepeticoes,
  criarMotor,
  dividirEmBlocos,
  LIMITES,
  limparTexto
} from '../../electron/stt/motor.mjs';

const SEGUNDO = 16000;
const voz = (segundos: number, rms = 0.05): Float32Array => {
  const pcm = new Float32Array(Math.round(segundos * SEGUNDO));
  for (let i = 0; i < pcm.length; i++) pcm[i] = Math.sin(i / 7) * rms * 1.414;
  return pcm;
};

test('limparTexto: tira marcadores de som e frases que o Whisper inventa', () => {
  assert.equal(limparTexto('[Música]'), '');
  assert.equal(limparTexto('(aplausos)'), '');
  assert.equal(limparTexto('Legendas pela comunidade Amara.org'), '');
  assert.equal(limparTexto('Obrigado por assistir!'), '');
  assert.equal(limparTexto('Inscreva-se no canal'), '');
  assert.equal(limparTexto('...'), '');
  assert.equal(limparTexto('  '), '');
});

test('limparTexto: corta o rabicho inventado mas preserva fala real', () => {
  assert.equal(limparTexto('Na ZR2 é 58% do lote. Obrigado por assistir'), 'Na ZR2 é 58% do lote.');
  assert.equal(limparTexto('Obrigado.'), 'Obrigado.');
  assert.equal(limparTexto('Aqui a gente usa 3 metros de recuo frontal.'), 'Aqui a gente usa 3 metros de recuo frontal.');
  assert.equal(limparTexto('A taxa é R$ 3,85 por metro quadrado.'), 'A taxa é R$ 3,85 por metro quadrado.');
  assert.equal(limparTexto('Tchau, Helena, até quinta.'), 'Tchau, Helena, até quinta.');
});

test('limparTexto: colapsa laços de repetição do Whisper e deixa sequências normais', () => {
  assert.equal(limparTexto('e aí e aí e aí e aí e aí'), 'e aí');
  assert.equal(limparTexto('sim sim sim sim sim sim'), 'sim');
  assert.equal(colapsarRepeticoes('um dois três quatro cinco'), 'um dois três quatro cinco');
  assert.equal(limparTexto('muito muito bom'), 'muito muito bom');
  assert.equal(limparTexto('a taxa é a taxa é a taxa'), 'a taxa é a taxa é a taxa');
});

test('dividirEmBlocos: blocos de até 28 s, sem perder amostras', () => {
  assert.equal(dividirEmBlocos(voz(10)).length, 1);
  const quarenta = voz(40);
  const blocos = dividirEmBlocos(quarenta);
  assert.equal(blocos.length, 2);
  assert.equal(blocos.reduce((s, b) => s + b.length, 0), quarenta.length);
  assert.ok(blocos.every((b) => b.length <= 28 * SEGUNDO));
  assert.equal(dividirEmBlocos(voz(60)).length, 3);
});

function motorComPipelineFalso(opcoes: { atrasoMs?: number; texto?: string } = {}) {
  const chamadas: Array<{ amostras: number; opcoes: any }> = [];
  let emAndamento = 0;
  let maximoSimultaneo = 0;
  let criacoes = 0;
  const criarPipeline = async () => {
    criacoes++;
    return async (pcm: Float32Array, o: any) => {
      emAndamento++;
      maximoSimultaneo = Math.max(maximoSimultaneo, emAndamento);
      chamadas.push({ amostras: pcm.length, opcoes: o });
      if (opcoes.atrasoMs) await new Promise((r) => setTimeout(r, opcoes.atrasoMs));
      emAndamento--;
      return { text: opcoes.texto ?? ' Na ZR2 é 58% do lote.' };
    };
  };
  const motor = criarMotor({ caminhoModelos: '/nada', criarPipeline });
  return { motor, chamadas, maximoSimultaneo: () => maximoSimultaneo, criacoes: () => criacoes };
}

test('motor: não transcreve antes de carregar; carregar é idempotente mesmo com chamadas simultâneas', async () => {
  const { motor, criacoes } = motorComPipelineFalso();
  await assert.rejects(() => motor.transcrever(voz(2)), /não está pronto/);
  await Promise.all([motor.carregar(), motor.carregar(), motor.carregar()]);
  await motor.carregar();
  assert.equal(criacoes(), 1);
  assert.equal(motor.estado, 'pronto');
});

test('motor: áudio curto e silêncio não chamam o modelo (evita alucinação)', async () => {
  const { motor, chamadas } = motorComPipelineFalso();
  await motor.carregar();
  const curto = await motor.transcrever(voz(0.2));
  assert.equal(curto.texto, '');
  const silencio = await motor.transcrever(new Float32Array(5 * SEGUNDO));
  assert.equal(silencio.texto, '');
  assert.equal(silencio.duracaoAudioMs, 5000);
  assert.equal(chamadas.length, 0);
});

test('motor: fala normal chama o modelo em português com teto de tokens proporcional', async () => {
  const { motor, chamadas } = motorComPipelineFalso();
  await motor.carregar();
  const r = await motor.transcrever(voz(4));
  assert.equal(r.texto, 'Na ZR2 é 58% do lote.');
  assert.equal(r.duracaoAudioMs, 4000);
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].opcoes.language, 'portuguese');
  assert.equal(chamadas[0].opcoes.task, 'transcribe');
  assert.equal(chamadas[0].opcoes.max_new_tokens, 4 * LIMITES.tokensPorSegundo + LIMITES.tokensExtra);
  assert.ok(chamadas[0].opcoes.max_new_tokens < LIMITES.tokensMaximo);
});

test('motor: áudio de 40 s vira dois blocos e os textos se juntam', async () => {
  const { motor, chamadas } = motorComPipelineFalso({ texto: ' parte' });
  await motor.carregar();
  const r = await motor.transcrever(voz(40));
  assert.equal(chamadas.length, 2);
  assert.equal(r.texto, 'parte parte');
  assert.ok(chamadas.every((c) => c.amostras <= 28 * SEGUNDO));
});

test('motor: nunca roda duas inferências ao mesmo tempo', async () => {
  const { motor, maximoSimultaneo } = motorComPipelineFalso({ atrasoMs: 15 });
  await motor.carregar();
  await Promise.all([motor.transcrever(voz(2)), motor.transcrever(voz(2)), motor.transcrever(voz(2))]);
  assert.equal(maximoSimultaneo(), 1);
});

test('motor: erro do pipeline propaga mas o motor continua pronto; entradas inválidas são recusadas', async () => {
  let falhar = true;
  const motor = criarMotor({
    caminhoModelos: '/nada',
    criarPipeline: async () => async () => {
      if (falhar) {
        falhar = false;
        throw new Error('onnx caiu');
      }
      return { text: 'ok de novo' };
    }
  });
  await motor.carregar();
  await assert.rejects(() => motor.transcrever(voz(2)), /onnx caiu/);
  assert.equal(motor.estado, 'pronto');
  assert.equal((await motor.transcrever(voz(2))).texto, 'ok de novo');
  await assert.rejects(() => motor.transcrever(voz(2), { idioma: 'xx' }), /Idioma não suportado/);
  await assert.rejects(() => motor.transcrever([1, 2, 3] as any), /Float32Array/);
});

test('motor: falha ao carregar vira estado "erro" e permite nova tentativa; descarregar volta ao início', async () => {
  let tentativas = 0;
  const motor = criarMotor({
    caminhoModelos: '/nada',
    criarPipeline: async () => {
      if (++tentativas === 1) throw new Error('modelo corrompido');
      return async () => ({ text: 'fala' });
    }
  });
  await assert.rejects(() => motor.carregar(), /modelo corrompido/);
  assert.equal(motor.estado, 'erro');
  await motor.carregar();
  assert.equal(motor.estado, 'pronto');
  await motor.descarregar();
  assert.equal(motor.estado, 'descarregado');
  await assert.rejects(() => motor.transcrever(voz(2)), /não está pronto/);
});

test('motor: info identifica o modelo, a biblioteca e as threads', () => {
  const { motor } = motorComPipelineFalso();
  assert.equal(motor.info.nome, 'whisper-base-q8');
  assert.equal(motor.info.idioma, 'pt');
  assert.equal(motor.info.threads, 4);
  assert.match(motor.info.biblioteca, /@huggingface\/transformers@\d/);
});

test('motor: com aquecimento roda uma inferência descartável ao carregar, sem contar como fala', async () => {
  const chamadas: any[] = [];
  const motor = criarMotor({
    caminhoModelos: '/nada',
    aquecer: true,
    criarPipeline: async () => async (pcm: Float32Array, o: any) => {
      chamadas.push({ amostras: pcm.length, o });
      return { text: ' texto do aquecimento' };
    }
  });
  await motor.carregar();
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].o.max_new_tokens, 4);
  assert.equal(motor.estado, 'pronto');
  const fala = await motor.transcrever(voz(3));
  assert.equal(chamadas.length, 2);
  assert.equal(fala.texto, 'texto do aquecimento');
});

test('motor: se o aquecimento falhar, o motor fica pronto mesmo assim', async () => {
  const motor = criarMotor({
    caminhoModelos: '/nada',
    aquecer: true,
    criarPipeline: async () => async () => {
      throw new Error('aquecimento falhou');
    }
  });
  await motor.carregar();
  assert.equal(motor.estado, 'pronto');
});
