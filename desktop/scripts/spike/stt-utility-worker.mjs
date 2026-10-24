import { pipeline } from '@huggingface/transformers';

let transcriber = null;

async function carregar() {
  const t0 = performance.now();
  transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-base', {
    dtype: 'q8',
    device: 'cpu'
  });
  const t1 = performance.now();
  const mem = process.memoryUsage();
  return {
    tempoCargaMs: t1 - t0,
    rssMb: mem.rss / 1024 / 1024
  };
}

// Escuta mensagem da porta pai
process.parentPort.on('message', async (event) => {
  const { tipo, id, buffer, duracaoSegundos } = event.data;

  if (tipo === 'carregar') {
    try {
      const res = await carregar();
      process.parentPort.postMessage({ id, tipo: 'carregado', ...res });
    } catch (err) {
      process.parentPort.postMessage({ id, tipo: 'erro', erro: err.message });
    }
    return;
  }

  if (tipo === 'transcrever') {
    try {
      if (!transcriber) await carregar();
      const float32Array = new Float32Array(buffer);
      const t0 = performance.now();
      const resultado = await transcriber(float32Array, {
        language: 'portuguese',
        task: 'transcribe',
        return_timestamps: false
      });
      const t1 = performance.now();
      const tempoExecMs = t1 - t0;
      const rtf = (tempoExecMs / 1000) / duracaoSegundos;
      const mem = process.memoryUsage();

      process.parentPort.postMessage({
        id,
        tipo: 'resultado',
        texto: resultado.text,
        tempoExecMs,
        rtf,
        rssMb: mem.rss / 1024 / 1024
      });
    } catch (err) {
      process.parentPort.postMessage({ id, tipo: 'erro', erro: err.message });
    }
  }
});
