/**
 * Teste de fumaça: abre o app (dist) no Electron, inicia a reunião e salva capturas em .tmp/.
 * Uso: npm run electron:smoke            (roteiro; faz o build antes)
 *      npm run electron:smoke:aovivo     (transcrição ao vivo de ponta a ponta, com microfone falso)
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const caminhoDoElectron = createRequire(import.meta.url)('electron');
const aoVivo = process.argv[2] === 'aovivo';

// Em sessão Wayland o app precisa rodar via XWayland (sempre no topo e posição); passar o switch
// direto evita o relançamento que o main faria sozinho (e preserva a saída deste processo).
function argumentosDoElectron() {
  const emWayland = process.env.XDG_SESSION_TYPE === 'wayland' && process.env.PRUMO_OZONE !== 'wayland';
  const argumentos = emWayland ? ['.', '--ozone-platform=x11'] : ['.'];
  if (aoVivo && process.env.PRUMO_SMOKE_REAL !== '1') {
    // Microfone falso que toca em laço um áudio de fala em português: a captura, o VAD, o motor e a
    // interface rodam de verdade; só a fonte do som é o arquivo.
    const wav = path.resolve('.tmp/spike/referencia-30s.wav');
    if (!fs.existsSync(wav)) {
      console.error(`Falta o áudio de referência (${wav}). Rode scripts/spike/preparar-audio-referencia.mjs.`);
      process.exit(2);
    }
    argumentos.push(
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${wav}`
    );
  }
  return argumentos;
}

const ambiente = { ...process.env, PRUMO_SMOKE: aoVivo ? 'aovivo' : '1' };
if (aoVivo) {
  const dados = path.resolve('.tmp/aovivo-dados');
  fs.rmSync(dados, { recursive: true, force: true });
  ambiente.PRUMO_DADOS = dados;
}

// PRUMO_SMOKE_API=1: sobe a API simulada local e aponta o app para ela.
let apiSimulada = null;
if (aoVivo && process.env.PRUMO_SMOKE_API === '1') {
  apiSimulada = spawn(process.execPath, ['scripts/teste/api-simulada.mjs', '38123'], { stdio: 'ignore' });
  ambiente.PRUMO_API_URL = 'http://127.0.0.1:38123';
  await new Promise((r) => setTimeout(r, 800));
}

const resultado = spawnSync(caminhoDoElectron, argumentosDoElectron(), { stdio: 'inherit', env: ambiente });
apiSimulada?.kill();
process.exit(resultado.status ?? 1);
