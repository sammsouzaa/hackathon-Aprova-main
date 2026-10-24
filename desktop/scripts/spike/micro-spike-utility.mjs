import { app, utilityProcess } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.whenReady().then(async () => {
  console.log('Iniciando micro-spike: utilityProcess.fork com Whisper Base q8...');
  const workerPath = path.join(__dirname, 'stt-utility-worker.mjs');
  const child = utilityProcess.fork(workerPath, [], {
    serviceName: 'prumo-stt-utility'
  });

  const f32Path = path.resolve('.tmp/spike/referencia-30s.f32');
  const f32Buf = fs.readFileSync(f32Path);
  const duracaoSegundos = f32Buf.byteLength / 4 / 16000;

  child.on('spawn', () => {
    console.log('utilityProcess filho iniciado com sucesso.');
  });

  child.postMessage({ tipo: 'carregar', id: 1 });

  child.on('message', (msg) => {
    if (msg.tipo === 'carregado') {
      console.log(`Modelo carregado no utilityProcess: ${(msg.tempoCargaMs / 1000).toFixed(2)}s | RSS: ${msg.rssMb.toFixed(1)} MB`);
      console.log(`Enviando áudio de ${duracaoSegundos.toFixed(2)}s via postMessage...`);
      child.postMessage({
        tipo: 'transcrever',
        id: 2,
        buffer: f32Buf.buffer,
        duracaoSegundos
      });
    } else if (msg.tipo === 'resultado') {
      console.log(`\n=== RESULTADO UTILITY_PROCESS ===`);
      console.log(`Tempo de transcrição: ${(msg.tempoExecMs / 1000).toFixed(2)}s`);
      console.log(`RTF: ${msg.rtf.toFixed(3)}`);
      console.log(`RSS: ${msg.rssMb.toFixed(1)} MB`);
      console.log(`Texto: "${msg.texto}"`);
      child.kill();
      app.quit();
    } else if (msg.tipo === 'erro') {
      console.error('Erro no utilityProcess:', msg.erro);
      child.kill();
      app.quit();
    }
  });

  child.on('exit', (code) => {
    console.log(`utilityProcess finalizado com código ${code}`);
  });
});
