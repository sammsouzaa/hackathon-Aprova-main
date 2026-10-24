'use strict';

/**
 * Gera os ícones do Prumo a partir do mascote em SVG (o mesmo de src/components/MascotePrumo.tsx).
 * Uso: npm run icones   (precisa de sessão gráfica; escreve em build/ e electron/assets/)
 */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');

const SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <line x1="32" y1="2" x2="32" y2="14" stroke="#0e7490" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="26" y="13" width="12" height="6" rx="2.5" fill="#06929f"/>
  <circle cx="32" cy="11" r="3" stroke="#0e7490" stroke-width="2" fill="#e6f5f8"/>
  <path d="M32 60C32 60 48 38 48 27C48 18.1634 40.8366 17 32 17C23.1634 17 16 18.1634 16 27C16 38 32 60 32 60Z" fill="#0891b2"/>
  <path d="M23 23C20 27 20 33 24 39" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-opacity="0.4"/>
  <ellipse cx="27" cy="28" rx="3" ry="3.5" fill="#ffffff"/>
  <ellipse cx="37" cy="28" rx="3" ry="3.5" fill="#ffffff"/>
  <circle cx="27.5" cy="28" r="1.8" fill="#1c1c1c"/>
  <circle cx="37.5" cy="28" r="1.8" fill="#1c1c1c"/>
  <circle cx="28.2" cy="27" r="0.7" fill="#ffffff"/>
  <circle cx="38.2" cy="27" r="0.7" fill="#ffffff"/>
  <path d="M29 35Q32 38 35 35" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" fill="none" stroke-opacity="0.9"/>
  <polygon points="30,56 34,56 32,61" fill="#e6f5f8"/>
</svg>`;

const HTML = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}</style><body>${SVG}</body>`;

function renderizar(tamanho) {
  return new Promise((resolver, rejeitar) => {
    const janela = new BrowserWindow({
      show: false,
      width: tamanho,
      height: tamanho,
      useContentSize: true,
      frame: false,
      transparent: true,
      webPreferences: { offscreen: true, sandbox: true }
    });
    let ultima = null;
    janela.webContents.on('paint', (_evento, _area, imagem) => {
      ultima = imagem;
    });
    janela.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        janela.destroy();
        if (!ultima) return rejeitar(new Error(`sem pintura para ${tamanho}px`));
        const tamanhoReal = ultima.getSize();
        resolver(
          tamanhoReal.width === tamanho ? ultima : ultima.resize({ width: tamanho, height: tamanho, quality: 'best' })
        );
      }, 600);
    });
    janela.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(HTML)}`);
    janela.webContents.setFrameRate(5);
  });
}

function gravar(imagemBase, tamanho, arquivo) {
  const imagem =
    imagemBase.getSize().width === tamanho
      ? imagemBase
      : imagemBase.resize({ width: tamanho, height: tamanho, quality: 'best' });
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, imagem.toPNG());
  console.log(`ok ${path.relative(RAIZ, arquivo)} ${tamanho}x${tamanho}`);
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.whenReady().then(async () => {
  try {
    // Uma única renderização em 512 px; os demais tamanhos são reduções dela.
    const base = await renderizar(512);
    gravar(base, 512, path.join(RAIZ, 'electron', 'assets', 'icone.png'));
    gravar(base, 24, path.join(RAIZ, 'electron', 'assets', 'tray.png'));
    gravar(base, 48, path.join(RAIZ, 'electron', 'assets', 'tray@2x.png'));
    app.exit(0);
  } catch (erro) {
    console.error(erro);
    app.exit(1);
  }
});
