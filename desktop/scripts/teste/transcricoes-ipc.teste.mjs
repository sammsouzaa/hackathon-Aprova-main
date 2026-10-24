import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronPath = require('electron');

test('F5.3: IPC end-to-end com preload real no Electron', () => {
  const scriptElectron = path.resolve('scripts/teste/ipc-transcricao.electron.mjs');
  const args = [scriptElectron];

  if (process.platform === 'linux' && process.env.XDG_SESSION_TYPE === 'wayland') {
    args.push('--ozone-platform=x11');
  }

  const res = spawnSync(electronPath, args, {
    encoding: 'utf-8',
    timeout: 15000,
    env: { ...process.env, PRUMO_DEVTOOLS: '0' }
  });

  if (res.error) {
    throw res.error;
  }

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';

  // Se não houver display disponível (ex.: CI puramente headless sem X11)
  if (res.status !== 0 && (stderr.includes('cannot open display') || stdout.includes('cannot open display'))) {
    console.warn('F5.3: Sessão gráfica indisponível para BrowserWindow. Teste IPC marcado como não verificado em headless.');
    return;
  }

  assert.equal(res.status, 0, `Electron IPC falhou com código ${res.status}. Saída:\n${stdout}\n${stderr}`);
  assert.ok(stdout.includes('IPC_TEST_SUCCESS'), `Esperado IPC_TEST_SUCCESS na saída. Recebido: ${stdout}`);
});
