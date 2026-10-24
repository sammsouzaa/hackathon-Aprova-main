import { pipeline, env } from '@huggingface/transformers';
import path from 'node:path';

// Forçar modo 100% offline
env.allowRemoteModels = false;
env.localModelPath = path.resolve('modelos');

console.log('Testando carga do modelo estritamente OFFLINE...');
const t0 = performance.now();
const transcriber = await pipeline('automatic-speech-recognition', 'whisper-base-q8', {
  dtype: 'q8',
  device: 'cpu'
});
const t1 = performance.now();
console.log(`✓ Modelo carregado com sucesso em modo OFFLINE em ${((t1 - t0) / 1000).toFixed(2)}s`);
