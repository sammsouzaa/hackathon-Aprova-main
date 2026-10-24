/**
 * Entrada de Electron para o teste de integração do motor (utilityProcess + IPC + preload reais).
 * Uso: electron scripts/teste/stt-ipc.electron.mjs   (cenário em PRUMO_TESTE_CENARIO)
 * Não importa electron/main.mjs: registra só o IPC do STT numa janela oculta.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cenario = process.env.PRUMO_TESTE_CENARIO ?? 'completo';
if (cenario === 'completo') process.env.PRUMO_STT_OCIOSIDADE_MS = '8000';
if (cenario === 'modelo-ausente') process.env.PRUMO_MODELOS = path.join(raiz, '.tmp', 'modelo-que-nao-existe');

const { registrarIpcStt } = await import('../../electron/ipc-stt.mjs');
const espera = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
const passos = {};
let janela = null;

const avaliar = (codigo) => janela.webContents.executeJavaScript(codigo);
const tentar = (codigo) =>
  avaliar(`(async () => { try { return { ok: true, valor: await (${codigo}) }; } catch (e) { return { ok: false, erro: e.message }; } })()`);

async function ate(descricao, condicao, limiteMs = 60000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    if (await condicao()) return Date.now() - inicio;
    await espera(250);
  }
  throw new Error(`Tempo esgotado esperando: ${descricao}`);
}

async function cenarioCompleto(gerenciador) {
  const bytes = fs.readFileSync(path.join(raiz, '.tmp', 'spike', 'referencia-30s.f32'));
  const doze = bytes.subarray(0, 12 * 16000 * 4).toString('base64');
  await avaliar(`
    window.__eventos = [];
    window.prumoDesktop.stt.aoMudarEstado((e) => window.__eventos.push(e.estado));
    window.__b64 = "${doze}";
    window.__pcm = (segundos) => {
      const bin = atob(window.__b64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new Float32Array(u8.buffer, 0, Math.min(u8.length / 4, segundos * 16000));
    };
    true`);

  passos.estadoInicial = (await avaliar('window.prumoDesktop.stt.estado()')).estado;

  const t0 = Date.now();
  const preaquecido = await tentar('window.prumoDesktop.stt.preaquecer()');
  passos.preaquecer = { ok: preaquecido.ok, estado: preaquecido.valor?.estado, ms: Date.now() - t0, info: preaquecido.valor?.info?.nome, threads: preaquecido.valor?.threads };

  const fala = await tentar('window.prumoDesktop.stt.transcrever(window.__pcm(12))');
  passos.fala = {
    ok: fala.ok,
    texto: fala.valor?.texto,
    rtf: fala.valor ? Number((fala.valor.tempoProcessamentoMs / fala.valor.duracaoAudioMs).toFixed(3)) : null
  };

  const silencio = await tentar('window.prumoDesktop.stt.transcrever(new Float32Array(16000 * 4))');
  passos.silencio = { ok: silencio.ok, texto: silencio.valor?.texto };

  const simultaneas = await tentar(
    'Promise.all([window.__pcm(5), window.__pcm(6), window.__pcm(7)].map((p) => window.prumoDesktop.stt.transcrever(p)))'
  );
  passos.simultaneas = { ok: simultaneas.ok, textos: simultaneas.valor?.map((r) => r.texto.length > 0) };

  passos.validacoes = {
    naoFloat32: (await tentar("window.prumoDesktop.stt.transcrever('texto')")).erro,
    grandeDemais: (await tentar('window.prumoDesktop.stt.transcrever(new Float32Array(16000 * 61))')).erro,
    idiomaInvalido: (await tentar("window.prumoDesktop.stt.transcrever(window.__pcm(3), { idioma: 'xx' })")).erro
  };

  // Queda do processo: o gerenciador deve reiniciar sozinho e voltar a transcrever.
  const pidAntes = gerenciador.pid();
  process.kill(pidAntes, 'SIGKILL');
  const msAteErro = await ate('estado "erro" depois da queda', async () => gerenciador.estado().estado === 'erro', 15000);
  const msAteVoltar = await ate('estado "pronto" depois do reinício', async () => gerenciador.estado().estado === 'pronto');
  const aposQueda = await tentar('window.prumoDesktop.stt.transcrever(window.__pcm(6))');
  passos.queda = {
    pidMudou: gerenciador.pid() !== pidAntes && gerenciador.pid() !== null,
    msAteErro,
    msAteVoltar,
    transcreveDepois: aposQueda.ok && aposQueda.valor.texto.length > 0
  };

  // Ociosidade (8 s): o processo é derrubado para devolver a memória.
  const msOcioso = await ate('descarga por ociosidade', async () => gerenciador.estado().estado === 'descarregado', 20000);
  passos.ociosidade = { msAteDescarregar: msOcioso, pid: gerenciador.pid() };
  const semModelo = await tentar('window.prumoDesktop.stt.transcrever(window.__pcm(3))');
  passos.descarregado = { rejeitou: !semModelo.ok, erro: semModelo.erro };

  // Recarrega e descarrega explicitamente.
  const recarga = await tentar('window.prumoDesktop.stt.preaquecer()');
  const depois = await tentar('window.prumoDesktop.stt.transcrever(window.__pcm(4))');
  const descarga = await tentar('window.prumoDesktop.stt.descarregar()');
  passos.recarga = { ok: recarga.ok && depois.ok, descarregou: descarga.valor?.estado, pid: gerenciador.pid() };

  passos.eventos = await avaliar('window.__eventos');
}

async function cenarioModeloAusente() {
  const r = await tentar('window.prumoDesktop.stt.preaquecer()');
  passos.preaquecer = { rejeitou: !r.ok, erro: r.erro };
  passos.estado = (await avaliar('window.prumoDesktop.stt.estado()')).estado;
}

function validar() {
  if (cenario === 'modelo-ausente') {
    return passos.preaquecer.rejeitou && /Modelo não encontrado/.test(passos.preaquecer.erro) && passos.estado === 'erro';
  }
  const p = passos;
  return (
    p.estadoInicial === 'descarregado' &&
    p.preaquecer.ok && p.preaquecer.estado === 'pronto' &&
    p.fala.ok && /garantia/i.test(p.fala.texto) && p.fala.rtf <= 0.6 &&
    p.silencio.ok && p.silencio.texto === '' &&
    p.simultaneas.ok && p.simultaneas.textos.every(Boolean) &&
    /Float32Array/.test(p.validacoes.naoFloat32) &&
    /60 s/.test(p.validacoes.grandeDemais) &&
    /Idioma/.test(p.validacoes.idiomaInvalido) &&
    p.queda.pidMudou && p.queda.transcreveDepois &&
    p.ociosidade.pid === null &&
    p.descarregado.rejeitou && /não está pronto/.test(p.descarregado.erro) &&
    p.recarga.ok && p.recarga.descarregou === 'descarregado' && p.recarga.pid === null &&
    p.eventos.includes('carregando') && p.eventos.includes('pronto') && p.eventos.includes('erro') && p.eventos.includes('descarregado')
  );
}

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  let gerenciador = null;
  try {
    janela = new BrowserWindow({
      show: false,
      webPreferences: { preload: path.join(raiz, 'electron', 'preload.cjs'), contextIsolation: true, sandbox: true }
    });
    await janela.loadURL('data:text/html,<html><body>teste</body></html>');
    gerenciador = registrarIpcStt({
      ipcMain,
      app,
      obterJanela: () => janela,
      eventoConfiavel: (evento) => evento.sender === janela.webContents,
      raiz
    });
    if (cenario === 'modelo-ausente') await cenarioModeloAusente();
    else await cenarioCompleto(gerenciador);
    const ok = validar();
    console.log(`PRUMO_STT_IPC ${JSON.stringify({ cenario, ok, passos })}`);
    gerenciador.encerrar();
    app.exit(ok ? 0 : 1);
  } catch (erro) {
    console.log(`PRUMO_STT_IPC ${JSON.stringify({ cenario, ok: false, erro: erro.message, passos })}`);
    gerenciador?.encerrar();
    app.exit(1);
  }
});
