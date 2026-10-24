/**
 * Desenvolvimento: sobe o Vite e abre o Electron apontando para ele.
 * Uso: npm run electron:dev
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const exigir = createRequire(import.meta.url);
const caminhoDoElectron = exigir('electron');

// Em sessão Wayland o app precisa rodar via XWayland (sempre no topo e posição); passar o switch
// direto evita o relançamento que o main faria sozinho (e preserva a saída deste processo).
function argumentosDoElectron() {
  const emWayland = process.env.XDG_SESSION_TYPE === 'wayland' && process.env.PRUMO_OZONE !== 'wayland';
  return emWayland ? ['.', '--ozone-platform=x11'] : ['.'];
}
const PORTA = 3000;
const URL_DEV = `http://127.0.0.1:${PORTA}`;

const executavelDoVite = path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const vite = spawn(executavelDoVite, ['--port', String(PORTA), '--strictPort', '--host', '127.0.0.1'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

let electron = null;
let encerrando = false;

function encerrar(codigo = 0) {
  if (encerrando) return;
  encerrando = true;
  vite.kill();
  electron?.kill();
  process.exit(codigo);
}

function servidorPronto() {
  return new Promise((resolver) => {
    const requisicao = http.get(URL_DEV, (resposta) => {
      resposta.resume();
      resolver(resposta.statusCode === 200);
    });
    requisicao.on('error', () => resolver(false));
  });
}

vite.on('exit', (codigo) => encerrar(codigo ?? 1));
process.on('SIGINT', () => encerrar(0));
process.on('SIGTERM', () => encerrar(0));

for (let tentativa = 0; tentativa < 60; tentativa++) {
  if (await servidorPronto()) break;
  await new Promise((resolver) => setTimeout(resolver, 500));
  if (tentativa === 59) {
    console.error('O Vite não respondeu em 30 s.');
    encerrar(1);
  }
}

electron = spawn(caminhoDoElectron, argumentosDoElectron(), {
  stdio: 'inherit',
  env: { ...process.env, PRUMO_DEV_URL: URL_DEV, PRUMO_ABRIR: '1' }
});
electron.on('exit', (codigo) => encerrar(codigo ?? 0));
