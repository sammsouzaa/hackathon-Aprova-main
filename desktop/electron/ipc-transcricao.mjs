/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Canais IPC da sessão de transcrição e persistência em JSON (prumo:transcricao:*).
 * Arquivo da F5.
 */
import path from 'node:path';
import { criarGravador } from './transcricoes.mjs';

export function resolverDiretorioTranscricoes(contexto) {
  if (process.env.PRUMO_DADOS) {
    return path.resolve(process.env.PRUMO_DADOS, 'transcricoes');
  }
  if (contexto.app?.isPackaged && typeof contexto.app.getPath === 'function') {
    return path.join(contexto.app.getPath('userData'), 'transcricoes');
  }
  return path.join(contexto.raiz || process.cwd(), 'dados', 'transcricoes');
}

export function registrarIpcTranscricao(contexto) {
  const { ipcMain, app, eventoConfiavel } = contexto;
  const diretorioDados = resolverDiretorioTranscricoes(contexto);
  const gravador = criarGravador({ diretorioDados });

  // Recuperar sessões órfãs na inicialização
  gravador.recuperarOrfas();

  // Garantir flush de dados pendentes antes de fechar o app
  if (app && typeof app.on === 'function') {
    app.on('before-quit', () => gravador.flushSincrono());
    app.on('will-quit', () => gravador.flushSincrono());
  }

  const validarChamada = (evento) => {
    if (typeof eventoConfiavel === 'function') {
      return eventoConfiavel(evento);
    }
    return true;
  };

  ipcMain.handle('prumo:transcricao:iniciar', async (evento, meta) => {
    if (!validarChamada(evento)) return { ok: false, erro: 'Acesso negado' };
    try {
      const res = gravador.iniciar(meta);
      return { ok: true, dados: res };
    } catch (err) {
      return { ok: false, erro: err.message };
    }
  });

  ipcMain.handle('prumo:transcricao:anexar', async (evento, segmento) => {
    if (!validarChamada(evento)) return { ok: false, erro: 'Acesso negado' };
    try {
      const res = gravador.anexar(segmento);
      return { ok: true, gravado: res };
    } catch (err) {
      return { ok: false, erro: err.message };
    }
  });

  ipcMain.handle('prumo:transcricao:evento', async (evento, ev) => {
    if (!validarChamada(evento)) return { ok: false, erro: 'Acesso negado' };
    try {
      const res = gravador.evento(ev);
      return { ok: true, gravado: res };
    } catch (err) {
      return { ok: false, erro: err.message };
    }
  });

  ipcMain.handle('prumo:transcricao:finalizar', async (evento, resumo) => {
    if (!validarChamada(evento)) return { ok: false, erro: 'Acesso negado' };
    try {
      const res = gravador.finalizar(resumo);
      return { ok: true, dados: res };
    } catch (err) {
      return { ok: false, erro: err.message };
    }
  });

  ipcMain.handle('prumo:transcricao:listar', async (evento) => {
    if (!validarChamada(evento)) return { ok: false, erro: 'Acesso negado' };
    try {
      const res = gravador.listar();
      return { ok: true, lista: res };
    } catch (err) {
      return { ok: false, erro: err.message };
    }
  });

  ipcMain.handle('prumo:transcricao:abrir-pasta', async (evento) => {
    if (!validarChamada(evento)) return { ok: false, erro: 'Acesso negado' };
    try {
      const { shell } = await import('electron');
      if (shell && typeof shell.openPath === 'function') {
        await shell.openPath(diretorioDados);
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, erro: err.message };
    }
  });

  return { gravador, diretorioDados };
}
