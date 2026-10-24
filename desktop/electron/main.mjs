/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Programa desktop do Prumo (Electron).
 * Janela compacta de mascote: fixa na borda direita, sempre no topo e em segundo plano (bandeja).
 */
import {
  app,
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  globalShortcut,
  ipcMain,
  nativeImage,
  net,
  protocol,
  screen,
  session
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GerenciadorMonitorAudio } from './audio-monitor.mjs';
import { registrarIpcStt } from './ipc-stt.mjs';
import { registrarIpcTranscricao } from './ipc-transcricao.mjs';
import { registrarIpcApi } from './ipc-api.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const DIST = path.join(RAIZ, 'dist');
const DADOS_DIR = path.join(RAIZ, 'dados');
const ARQUIVO_PREFERENCIAS = path.join(DADOS_DIR, 'preferencias.json');
const ESQUEMA = 'app';
const HOST_APP = 'prumo';
const ORIGEM_APP = `${ESQUEMA}://${HOST_APP}`;

// Largura da janela compacta do Prumo. Altura acompanha a tela inteira.
const LARGURA = 480;
const ATALHO_ALTERNAR = 'CommandOrControl+Alt+P';

// URL de desenvolvimento (Vite com HMR) ou build em disco.
const URL_DEV = process.env.PRUMO_URL_DEV ?? null;
const ABRIR_NA_PARTIDA = process.env.PRUMO_ABRIR === '1' || Boolean(URL_DEV);
const MODO_SMOKE = process.env.PRUMO_SMOKE === '1' || process.env.PRUMO_SMOKE === 'aovivo';

// Política de Segurança de Conteúdo (CSP) estrita.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' ws://127.0.0.1:* http://127.0.0.1:*",
  "media-src 'self' blob:"
].join('; ');

// Esquema próprio para servir a pasta dist com caminhos absolutos (/assets/...) e CSP.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
]);

// Em Wayland nativo o compositor ignora "sempre no topo" e o posicionamento da janela. Rodando
// via XWayland (X11) os dois funcionam. A plataforma gráfica do Chromium é escolhida antes de este
// código rodar, então a única forma confiável é reiniciar uma vez com --ozone-platform=x11.
const PRECISA_X11 =
  process.platform === 'linux' &&
  process.env.XDG_SESSION_TYPE === 'wayland' &&
  process.env.PRUMO_OZONE !== 'wayland' &&
  app.commandLine.getSwitchValue('ozone-platform') === 'wayland';

if (PRECISA_X11) {
  app.relaunch({
    execPath: process.env.APPIMAGE ?? process.execPath,
    args: [...process.argv.slice(1), '--ozone-platform=x11']
  });
  app.exit(0);
}

if (process.platform === 'linux' && process.env.PRUMO_GPU !== '1') {
  app.disableHardwareAcceleration();
}

let janela = null;
let bandeja = null;
let saindo = false;
const errosDoConsole = [];
const gerenciadorMonitor = new GerenciadorMonitorAudio();

// Notificar a janela quando houver mudança de dispositivo de saída padrão
gerenciadorMonitor.onSinkAlterado = (status) => {
  if (janela && !janela.isDestroyed()) {
    janela.webContents.send('prumo:audio:sink-alterado', status);
  }
};

function caminhoAsset(nome) {
  return path.join(AQUI, 'assets', nome);
}

// Painel fixo na borda direita da área útil do monitor, em toda a altura.
function limitesAncorados(monitor) {
  const area = monitor.workArea;
  return { x: area.x + area.width - LARGURA, y: area.y, width: LARGURA, height: area.height };
}

function monitorAtivo() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function mesmosLimites(a, b) {
  return (
    Math.abs(a.x - b.x) < 2 &&
    Math.abs(a.y - b.y) < 2 &&
    Math.abs(a.width - b.width) < 2 &&
    Math.abs(a.height - b.height) < 2
  );
}

let ancorando = false;
function ancorar(monitor = monitorAtivo()) {
  if (!janela) return;
  const alvo = limitesAncorados(monitor);
  if (mesmosLimites(janela.getBounds(), alvo)) return;
  ancorando = true;
  janela.setResizable(true);
  janela.setBounds(alvo);
  janela.setResizable(false);
  setTimeout(() => {
    ancorando = false;
  }, 300);
}

function urlPermitida(url) {
  if (URL_DEV) return url.startsWith(URL_DEV);
  return url.startsWith(`${ORIGEM_APP}/`);
}

function registrarProtocolo() {
  protocol.handle('app', async (requisicao) => {
    const { pathname } = new URL(requisicao.url);
    const relativo = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const arquivo = path.normalize(path.join(DIST, relativo));

    if (arquivo !== DIST && !arquivo.startsWith(DIST + path.sep)) {
      return new Response('Acesso negado', { status: 403 });
    }

    const resposta = await net.fetch(pathToFileURL(arquivo).toString());
    const cabecalhos = new Headers(resposta.headers);
    cabecalhos.set('Content-Security-Policy', CSP);
    return new Response(resposta.body, {
      status: resposta.status,
      statusText: resposta.statusText,
      headers: cabecalhos
    });
  });
}

function endurecerSessao() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, responder) => {
    const url = webContents.getURL();
    const ehOrigemValida = url.startsWith(ORIGEM_APP) || (URL_DEV && url.startsWith(URL_DEV));
    if (permission === 'media' && ehOrigemValida) {
      return responder(true);
    }
    return responder(false);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const url = webContents.getURL();
    const ehOrigemValida = url.startsWith(ORIGEM_APP) || (URL_DEV && url.startsWith(URL_DEV));
    return permission === 'media' && ehOrigemValida;
  });
}

function criarJanela() {
  janela = new BrowserWindow({
    ...limitesAncorados(screen.getPrimaryDisplay()),
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: 'Prumo',
    backgroundColor: '#f5f7f7',
    icon: nativeImage.createFromPath(caminhoAsset('icone.png')),
    webPreferences: {
      preload: path.join(AQUI, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      backgroundThrottling: false
    }
  });

  janela.setAlwaysOnTop(true, 'floating');
  janela.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  janela.setMenuBarVisibility(false);

  janela.once('ready-to-show', () => {
    if (ABRIR_NA_PARTIDA) mostrarJanela();
  });

  janela.on('close', (evento) => {
    if (saindo) return;
    evento.preventDefault();
    janela.hide();
  });
  janela.on('show', reconstruirMenuDaBandeja);
  janela.on('hide', reconstruirMenuDaBandeja);

  janela.webContents.on('did-finish-load', () => {
    janela.webContents.insertCSS('.drag-region { -webkit-app-region: no-drag !important; }');
  });

  let temporizadorDeMovimento = null;
  janela.on('move', () => {
    if (ancorando) return;
    clearTimeout(temporizadorDeMovimento);
    temporizadorDeMovimento = setTimeout(
      () => ancorar(screen.getDisplayMatching(janela.getBounds())),
      250
    );
  });

  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  janela.webContents.on('will-navigate', (evento, url) => {
    if (!urlPermitida(url)) evento.preventDefault();
  });
  janela.webContents.on('console-message', (evento) => {
    if (evento.level === 'error') errosDoConsole.push(evento.message);
  });
  janela.webContents.on('before-input-event', (evento, entrada) => {
    if (entrada.type !== 'keyDown' || !(entrada.control || entrada.meta)) return;
    if (entrada.key.toLowerCase() === 'q') {
      evento.preventDefault();
      sair();
    }
  });

  janela.loadURL(URL_DEV ?? `${ORIGEM_APP}/index.html`);

  if (URL_DEV && process.env.PRUMO_DEVTOOLS === '1') {
    janela.webContents.openDevTools({ mode: 'detach' });
  }

  if (MODO_SMOKE) {
    janela.webContents.once('did-finish-load', async () => {
      const { executar } = await import(process.env.PRUMO_SMOKE === 'aovivo' ? './smoke-aovivo.mjs' : './smoke.mjs');
      const codigo = await executar(janela, errosDoConsole);
      saindo = true;
      gerenciadorMonitor.descarregarSync();
      app.exit(codigo);
    });
  }
}

function mostrarJanela() {
  if (!janela) return;
  ancorar();
  janela.show();
  janela.setSkipTaskbar(true);
  janela.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  janela.focus();
}

function alternarJanela() {
  if (!janela) return;
  if (janela.isVisible()) janela.hide();
  else mostrarJanela();
}

function definirSempreNoTopo(valor) {
  if (!janela) return false;
  janela.setAlwaysOnTop(Boolean(valor), 'floating');
  reconstruirMenuDaBandeja();
  return janela.isAlwaysOnTop();
}

async function sair() {
  saindo = true;
  await gerenciadorMonitor.desativar();
  app.quit();
}

function reconstruirMenuDaBandeja() {
  if (!bandeja || !janela) return;
  const visivel = janela.isVisible();
  bandeja.setContextMenu(
    Menu.buildFromTemplate([
      { label: visivel ? 'Ocultar Prumo' : 'Mostrar Prumo', click: alternarJanela },
      {
        label: 'Sempre no topo',
        type: 'checkbox',
        checked: janela.isAlwaysOnTop(),
        click: (item) => definirSempreNoTopo(item.checked)
      },
      { label: 'Reancorar na tela', click: () => ancorar() },
      { type: 'separator' },
      { label: 'Sair do Prumo', click: sair }
    ])
  );
}

function criarBandeja() {
  const icone = nativeImage.createFromPath(caminhoAsset('tray.png'));
  bandeja = new Tray(icone);
  bandeja.setToolTip('Prumo · mascote de reunião');
  bandeja.on('click', alternarJanela);
  reconstruirMenuDaBandeja();
}

// Só a janela do próprio app pode chamar os canais IPC.
function eventoConfiavel(evento) {
  return Boolean(janela) && evento.sender === janela.webContents;
}

function registrarIpc() {
  const confiavel = (evento) => janela && evento.sender === janela.webContents;

  ipcMain.handle('prumo:janela:ocultar', (evento) => {
    if (confiavel(evento)) janela.hide();
  });
  ipcMain.handle('prumo:janela:minimizar', (evento) => {
    if (confiavel(evento)) janela.hide();
  });
  ipcMain.handle('prumo:janela:sempre-no-topo', (evento, valor) => {
    if (!confiavel(evento)) return false;
    return typeof valor === 'boolean' ? definirSempreNoTopo(valor) : janela.isAlwaysOnTop();
  });
  ipcMain.handle('prumo:janela:restaurar-posicao', (evento) => {
    if (confiavel(evento)) ancorar();
  });
  ipcMain.handle('prumo:app:sair', (evento) => {
    if (confiavel(evento)) sair();
  });

  // Áudio: ciclo de vida do monitor sob demanda
  ipcMain.handle('prumo:audio:status-monitor', (evento) => {
    if (confiavel(evento)) return gerenciadorMonitor.obterStatus();
    return null;
  });
  ipcMain.handle('prumo:audio:ativar-monitor', async (evento) => {
    if (confiavel(evento)) return await gerenciadorMonitor.ativar();
    return null;
  });
  ipcMain.handle('prumo:audio:desativar-monitor', async (evento) => {
    if (confiavel(evento)) return await gerenciadorMonitor.desativar();
    return null;
  });

  // Preferências salvas em dados/preferencias.json
  ipcMain.handle('prumo:audio:obter-preferencias', (evento) => {
    if (!confiavel(evento)) return null;
    try {
      if (fs.existsSync(ARQUIVO_PREFERENCIAS)) {
        return JSON.parse(fs.readFileSync(ARQUIVO_PREFERENCIAS, 'utf-8'));
      }
    } catch {}
    return { microfoneId: 'default', monitorId: 'default' };
  });

  ipcMain.handle('prumo:audio:salvar-preferencias', (evento, prefs) => {
    if (!confiavel(evento)) return false;
    try {
      fs.mkdirSync(DADOS_DIR, { recursive: true });
      fs.writeFileSync(ARQUIVO_PREFERENCIAS, JSON.stringify(prefs, null, 2));
      return true;
    } catch (err) {
      console.warn('[prumo:audio] Erro ao salvar dados/preferencias.json:', err.message);
      return false;
    }
  });
}

if (PRECISA_X11) {
  // Reiniciando em X11
} else if (!MODO_SMOKE && !app.requestSingleInstanceLock()) {
  console.log('[prumo] já existe uma instância em execução; ela foi trazida para a frente');
  app.quit();
} else {
  app.on('second-instance', mostrarJanela);
  app.on('before-quit', () => {
    saindo = true;
    gerenciadorMonitor.descarregarSync();
  });
  app.on('window-all-closed', () => {});
  app.on('will-quit', () => {
    gerenciadorMonitor.descarregarSync();
    globalShortcut.unregisterAll();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    if (!URL_DEV) registrarProtocolo();
    endurecerSessao();
    registrarIpc();
    // Cada frente registra seus canais no próprio arquivo (F4: ipc-stt.mjs, F5: ipc-transcricao.mjs).
    const contextoIpc = { ipcMain, app, obterJanela: () => janela, eventoConfiavel, raiz: RAIZ };
    registrarIpcStt(contextoIpc);
    registrarIpcTranscricao(contextoIpc);
    registrarIpcApi(contextoIpc);

    // Limpeza assíncrona preventiva de remaps órfãos na partida (sobrevivência a crash prévio)
    // O monitor nasce desativado e só é criado sob demanda ao acionar fonte "Ao vivo"
    await gerenciadorMonitor.limparRemapsResiduais();

    criarJanela();
    const reancorarSeVisivel = () => janela?.isVisible() && ancorar(screen.getDisplayMatching(janela.getBounds()));
    screen.on('display-metrics-changed', reancorarSeVisivel);
    screen.on('display-removed', reancorarSeVisivel);
    if (!MODO_SMOKE) {
      criarBandeja();
      if (!ABRIR_NA_PARTIDA && Notification.isSupported()) {
        new Notification({
          title: 'Prumo está na bandeja',
          body: 'Clique no ícone do Prumo na barra superior para abrir o painel.',
          silent: true,
          icon: nativeImage.createFromPath(caminhoAsset('icone.png'))
        }).show();
      }
      const atalhoOk = globalShortcut.register(ATALHO_ALTERNAR, alternarJanela);
      if (!atalhoOk) console.warn(`[prumo] atalho ${ATALHO_ALTERNAR} indisponível nesta sessão`);
      console.log(`[prumo] pronto: bandeja criada, atalho ${atalhoOk ? 'ativo' : 'inativo'}`);
    }
  });
}
