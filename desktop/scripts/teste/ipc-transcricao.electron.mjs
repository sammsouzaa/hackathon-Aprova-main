import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { registrarIpcTranscricao } from '../../electron/ipc-transcricao.mjs';
import { validarTranscricao } from '../validar-transcricao.mjs';

const dirTemp = path.join(os.tmpdir(), `prumo-ipc-teste-${Date.now()}`);
fs.mkdirSync(dirTemp, { recursive: true });
process.env.PRUMO_DADOS = dirTemp;

app.whenReady().then(async () => {
  let janela = null;
  const contexto = {
    ipcMain,
    app,
    obterJanela: () => janela,
    eventoConfiavel: (e) => janela && e.sender === janela.webContents,
    raiz: process.cwd()
  };

  const { diretorioDados } = registrarIpcTranscricao(contexto);

  janela = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.resolve('electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  await janela.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!DOCTYPE html><html><body><h1>IPC Test</h1></body></html>'));

  try {
    const res = await janela.webContents.executeJavaScript(`
      (async () => {
        const t = window.prumoDesktop?.transcricao;
        if (!t) return { ok: false, erro: 'window.prumoDesktop.transcricao ausente' };

        const ini = await t.iniciar({
          id: 'REU-IPC-TESTE',
          processo: 'Processo via IPC',
          modoEscuta: 'gravacao_com_aviso',
          participantesAvisados: true
        });

        if (!ini.ok) return { ok: false, erro: 'Falha no iniciar: ' + ini.erro };

        const anexo = await t.anexar({
          id: 1,
          falante: 'implantadora',
          atribuicao: 'canal',
          canal: 'microfone',
          inicioMs: 1000,
          fimMs: 3000,
          texto: 'Teste via IPC Preload',
          confianca: 0.99,
          descartadoPorEco: false,
          motivoDescarte: null,
          latenciaMs: 300,
          forcadoPorTamanho: false
        });

        if (!anexo.ok) return { ok: false, erro: 'Falha no anexar: ' + anexo.erro };

        const ev = await t.evento({
          tMs: 3500,
          tipo: 'aviso',
          detalhe: 'Aviso via IPC'
        });

        if (!ev.ok) return { ok: false, erro: 'Falha no evento: ' + ev.erro };

        const fin = await t.finalizar({ rtfMedio: 0.12 });
        if (!fin.ok) return { ok: false, erro: 'Falha no finalizar: ' + fin.erro };

        const lista = await t.listar();
        if (!lista.ok) return { ok: false, erro: 'Falha no listar: ' + lista.erro };

        return {
          ok: true,
          caminho: ini.dados?.caminho,
          totalArquivos: lista.lista?.length || 0,
          dadosFinal: fin.dados
        };
      })()
    `);

    if (!res.ok) {
      console.error('IPC_TEST_FAIL:', res.erro);
      app.exit(1);
      return;
    }

    // Conferir no disco e validar
    const arquivos = fs.readdirSync(diretorioDados).filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));
    if (arquivos.length === 0) {
      console.error('IPC_TEST_FAIL: Nenhum arquivo gerado no disco');
      app.exit(1);
      return;
    }

    const caminhoFinal = path.join(diretorioDados, arquivos[0]);
    const json = JSON.parse(fs.readFileSync(caminhoFinal, 'utf-8'));
    const validacao = validarTranscricao(json);

    if (!validacao.valido) {
      console.error('IPC_TEST_FAIL: JSON inválido:', validacao.erros);
      app.exit(1);
      return;
    }

    console.log('IPC_TEST_SUCCESS:', JSON.stringify({ arquivos: arquivos.length, id: json.reuniao.id, segmentos: json.segmentos.length }));
    app.exit(0);
  } catch (err) {
    console.error('IPC_TEST_ERROR:', err.message);
    app.exit(1);
  } finally {
    fs.rmSync(dirTemp, { recursive: true, force: true });
  }
});
