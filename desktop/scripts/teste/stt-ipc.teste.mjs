/**
 * Integração do motor com o Electron de verdade: utilityProcess, IPC, preload e queda do processo.
 * Precisa de sessão gráfica e do modelo (`npm run modelos`). Cada cenário abre um Electron oculto.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';

const exigir = createRequire(import.meta.url);
const caminhoDoElectron = exigir('electron');
const temModelo = fs.existsSync(path.resolve('modelos', 'whisper-base-q8', 'config.json'));
const temAudio = fs.existsSync(path.resolve('.tmp', 'spike', 'referencia-30s.f32'));
const temTela = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);

function rodar(cenario) {
  const resultado = spawnSync(caminhoDoElectron, ['scripts/teste/stt-ipc.electron.mjs'], {
    encoding: 'utf-8',
    timeout: 240000,
    env: { ...process.env, PRUMO_TESTE_CENARIO: cenario }
  });
  const linha = (resultado.stdout ?? '').split('\n').find((l) => l.startsWith('PRUMO_STT_IPC '));
  assert.ok(linha, `sem linha de resultado.\nstdout: ${resultado.stdout}\nstderr: ${resultado.stderr?.slice(-600)}`);
  const dados = JSON.parse(linha.slice('PRUMO_STT_IPC '.length));
  console.log(`# ${cenario}: ${JSON.stringify(dados.passos)}`);
  return { dados, status: resultado.status };
}

test('Electron: carga sob demanda, transcrição, validações, queda, ociosidade e descarga', { skip: !temModelo || !temAudio || !temTela, timeout: 260000 }, () => {
  const { dados, status } = rodar('completo');
  assert.equal(dados.ok, true, JSON.stringify(dados));
  assert.equal(status, 0);
});

test('Electron: modelo ausente dá erro claro, sem subir processo', { skip: !temTela, timeout: 60000 }, () => {
  const { dados, status } = rodar('modelo-ausente');
  assert.equal(dados.ok, true, JSON.stringify(dados));
  assert.equal(status, 0);
});
