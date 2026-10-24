import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from '@huggingface/transformers';

const wavPath = path.resolve('.tmp/spike/referencia-30s.wav');
const f32Path = path.resolve('.tmp/spike/referencia-30s.f32');
const f32Buf = fs.readFileSync(f32Path);
const float32Array = new Float32Array(f32Buf.buffer, f32Buf.byteOffset, f32Buf.byteLength / 4);

const duracaoAudioSegundos = float32Array.length / 16000;
console.log(`Áudio de teste: ${duracaoAudioSegundos.toFixed(2)}s (${float32Array.length} amostras)`);

async function testarModelo(modelId, dtype = 'q8') {
  console.log(`\n========================================`);
  console.log(`Iniciando teste: ${modelId} (${dtype})`);
  console.log(`========================================`);

  const memInicial = process.memoryUsage();
  const t0Carga = performance.now();

  const transcriber = await pipeline('automatic-speech-recognition', modelId, {
    dtype: dtype,
    device: 'cpu'
  });

  const t1Carga = performance.now();
  const tempoCargaMs = t1Carga - t0Carga;
  const memPosCarga = process.memoryUsage();

  console.log(`Modelo carregado em ${(tempoCargaMs / 1000).toFixed(2)}s`);
  console.log(`Memória pós-carga: RSS ${(memPosCarga.rss / 1024 / 1024).toFixed(1)} MB (delta: +${((memPosCarga.rss - memInicial.rss) / 1024 / 1024).toFixed(1)} MB)`);

  // Executar transcrição
  const t0Exec = performance.now();
  const resultado = await transcriber(float32Array, {
    language: 'portuguese',
    task: 'transcribe',
    return_timestamps: false
  });
  const t1Exec = performance.now();
  const tempoExecMs = t1Exec - t0Exec;
  const memPosExec = process.memoryUsage();

  const rtf = (tempoExecMs / 1000) / duracaoAudioSegundos;

  console.log(`Tempo de transcrição: ${(tempoExecMs / 1000).toFixed(2)}s`);
  console.log(`RTF calculado: ${rtf.toFixed(3)} (Regra de decisão: RTF <= 0.600)`);
  console.log(`Texto obtido:\n"${resultado.text}"`);
  console.log(`Memória pós-exec: RSS ${(memPosExec.rss / 1024 / 1024).toFixed(1)} MB`);

  return {
    modelId,
    dtype,
    tempoCargaMs,
    tempoExecMs,
    rtf,
    texto: resultado.text,
    memoriaRssMb: memPosExec.rss / 1024 / 1024,
    passouRtf: rtf <= 0.6
  };
}

async function main() {
  const relatorio = {};

  try {
    // 1. Whisper Tiny
    relatorio.tiny = await testarModelo('onnx-community/whisper-tiny', 'q8');
  } catch (err) {
    console.error('Erro ao testar whisper-tiny:', err);
    relatorio.tiny = { erro: err.message };
  }

  try {
    // 2. Whisper Base
    relatorio.base = await testarModelo('onnx-community/whisper-base', 'q8');
  } catch (err) {
    console.error('Erro ao testar whisper-base:', err);
    relatorio.base = { erro: err.message };
  }

  fs.writeFileSync(path.resolve('.tmp/spike/resultado-stt.json'), JSON.stringify(relatorio, null, 2));
  console.log('\nRelatório final salvo em .tmp/spike/resultado-stt.json');
}

main().catch(console.error);
