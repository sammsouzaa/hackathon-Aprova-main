/**
 * Canais IPC do motor de transcrição (prumo:stt:*). F4.
 * `contexto`: { ipcMain, app, obterJanela, eventoConfiavel, raiz }.
 *
 * O modelo NÃO é carregado na partida (ocupa ~700 MB): só quando a interface pede
 * (`stt.preaquecer()`), ou na partida com PRUMO_STT=preaquecer. PRUMO_STT=desligado desativa tudo.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { utilityProcess } from 'electron';
import { criarGerenciadorStt } from './stt/gerenciador.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const NOME_MODELO = 'whisper-base-q8';
const IDIOMAS_PERMITIDOS = new Set(['pt', 'en', 'es']);
/** Segmentos reais têm até 15 s; 60 s é folga generosa e protege o processo de payloads absurdos. */
const MAXIMO_AMOSTRAS = 16000 * 60;

export function registrarIpcStt(contexto) {
  const { ipcMain, app, obterJanela, eventoConfiavel, raiz } = contexto;
  const modo = process.env.PRUMO_STT ?? 'sob-demanda';

  const caminhoModelos =
    process.env.PRUMO_MODELOS ?? (app.isPackaged ? path.join(process.resourcesPath, 'modelos') : path.join(raiz, 'modelos'));
  const threads = Number(process.env.PRUMO_STT_THREADS) || Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2)));

  const gerenciador = criarGerenciadorStt({
    caminhoProcesso: path.join(AQUI, 'stt', 'processo-stt.mjs'),
    caminhoModelos,
    nomeModelo: NOME_MODELO,
    threads,
    ociosidadeMs: Number(process.env.PRUMO_STT_OCIOSIDADE_MS) || 10 * 60 * 1000,
    existeModelo: () => fs.existsSync(path.join(caminhoModelos, NOME_MODELO, 'config.json')),
    forkFn: (...argumentos) => utilityProcess.fork(...argumentos),
    aoEstado: (estado) => {
      const janela = obterJanela();
      if (janela && !janela.isDestroyed()) janela.webContents.send('prumo:stt:estado-alterado', estado);
    }
  });

  const naoConfiavel = { ok: false, erro: 'Origem não confiável' };
  const desligado = { ok: false, erro: 'Transcrição desligada (PRUMO_STT=desligado)' };
  const mensagem = (erro) => (erro instanceof Error ? erro.message : String(erro));

  ipcMain.handle('prumo:stt:estado', (evento) => (eventoConfiavel(evento) ? gerenciador.estado() : null));

  ipcMain.handle('prumo:stt:preaquecer', async (evento) => {
    if (!eventoConfiavel(evento)) return naoConfiavel;
    if (modo === 'desligado') return desligado;
    try {
      return { ok: true, estado: await gerenciador.preaquecer() };
    } catch (erro) {
      return { ok: false, erro: mensagem(erro), estado: gerenciador.estado() };
    }
  });

  ipcMain.handle('prumo:stt:transcrever', async (evento, pcm, opcoes) => {
    if (!eventoConfiavel(evento)) return naoConfiavel;
    if (modo === 'desligado') return desligado;
    if (!(pcm instanceof Float32Array)) return { ok: false, erro: 'PCM deve ser Float32Array (16 kHz mono)' };
    if (pcm.length > MAXIMO_AMOSTRAS) return { ok: false, erro: 'Áudio maior que 60 s' };
    const idioma = opcoes?.idioma ?? 'pt';
    if (!IDIOMAS_PERMITIDOS.has(idioma)) return { ok: false, erro: `Idioma não suportado: ${idioma}` };
    try {
      return { ok: true, resultado: await gerenciador.transcrever(pcm, { idioma }) };
    } catch (erro) {
      return { ok: false, erro: mensagem(erro) };
    }
  });

  ipcMain.handle('prumo:stt:descarregar', async (evento) => {
    if (!eventoConfiavel(evento)) return naoConfiavel;
    return { ok: true, estado: await gerenciador.descarregar() };
  });

  app.on('will-quit', () => gerenciador.encerrar());

  if (modo === 'preaquecer') {
    gerenciador.preaquecer().catch((erro) => console.warn('[prumo:stt] pré-aquecimento falhou:', mensagem(erro)));
  }

  return gerenciador;
}
