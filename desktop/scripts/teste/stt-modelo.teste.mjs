/**
 * Teste com o modelo REAL (Whisper base q8) em Node, usando o áudio de referência de 30 s do spike.
 * Pula (com aviso) se o modelo ou o áudio não existirem: `npm run modelos` baixa o modelo.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { criarMotor } from '../../electron/stt/motor.mjs';

const modelos = path.resolve('modelos');
const referencia = path.resolve('.tmp/spike/referencia-30s.f32');
const temModelo = fs.existsSync(path.join(modelos, 'whisper-base-q8', 'config.json'));
const temAudio = fs.existsSync(referencia);
const pular = !temModelo || !temAudio ? 'modelo ou áudio de referência ausentes (npm run modelos; .tmp/spike)' : false;

function carregarReferencia() {
  const bytes = fs.readFileSync(referencia);
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

test('modelo real: transcreve 30 s em pt-BR com RTF ≤ 0,6 usando 4 threads', { skip: pular, timeout: 240000 }, async () => {
  const motor = criarMotor({ caminhoModelos: modelos, threads: 4 });
  const t0 = performance.now();
  await motor.carregar();
  const cargaMs = performance.now() - t0;

  const pcm = carregarReferencia();
  const r = await motor.transcrever(pcm);
  const rtf = r.tempoProcessamentoMs / r.duracaoAudioMs;
  console.log(`# carga ${Math.round(cargaMs)} ms | ${r.duracaoAudioMs} ms de áudio em ${r.tempoProcessamentoMs} ms | RTF ${rtf.toFixed(3)}`);
  console.log(`# texto: ${r.texto}`);

  assert.ok(rtf <= 0.6, `RTF ${rtf}`);
  assert.match(r.texto.toLowerCase(), /planilhas/);
  assert.match(r.texto.toLowerCase(), /matriz/);
  assert.match(r.texto.toLowerCase(), /garantia/);

  // Segmento curto, como os da VAD (primeiros 8 s): deve devolver texto coerente e rápido.
  const curto = await motor.transcrever(pcm.subarray(0, 8 * 16000));
  console.log(`# trecho de 8 s em ${curto.tempoProcessamentoMs} ms: ${curto.texto}`);
  assert.ok(curto.texto.length > 10);
  assert.ok(curto.tempoProcessamentoMs / curto.duracaoAudioMs <= 0.8);

  // Silêncio e ruído fraco não podem virar texto.
  assert.equal((await motor.transcrever(new Float32Array(5 * 16000))).texto, '');
  const ruidoFraco = new Float32Array(5 * 16000).map(() => (Math.random() * 2 - 1) * 0.002);
  assert.equal((await motor.transcrever(ruidoFraco)).texto, '');

  await motor.descarregar();
  assert.equal(motor.estado, 'descarregado');
});
