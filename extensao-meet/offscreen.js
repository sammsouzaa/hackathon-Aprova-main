// Roda escondido em segundo plano. Mistura o áudio da aba com o microfone,
// corta em trechos nas pausas da fala e envia cada trecho para o backend.

const BACKEND = 'http://localhost:8000';

// Corte por silêncio: o trecho fecha na primeira pausa depois de MIN,
// ou à força ao chegar em MAX (fala sem pausa).
const PAUSA_MS = 350;          // silêncio contínuo que conta como pausa
const AMOSTRA_MS = 50;         // de quanto em quanto tempo mede o volume
const LIMIAR_MINIMO = 0.008;   // RMS abaixo disso é sempre silêncio

let minMs = 4000;
let maxMs = 11000;

let streamAba = null;
let streamMic = null;
let audioCtx = null;
let mix = null;
let analisador = null;
let medidor = null;
let eventos = null;

let gravando = false;
let contador = 0;
let sessaoId = null;
let trecho = null;             // { recorder, partes, inicioMs, teveVoz }
let silencioDesde = null;
let pisoRuido = 0.01;
const envios = new Set(); // envios em andamento (para esperar antes de finalizar)

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== 'offscreen') return;
  if (msg.type === 'start') iniciar(msg);
  if (msg.type === 'stop') parar();
});

// Offscreen documents só têm acesso a chrome.runtime (sem chrome.storage).
// Então todo estado é enviado ao background, que grava no storage.
function salvar(patch) {
  return chrome.runtime.sendMessage({ target: 'background', type: 'state', patch }).catch(() => {});
}

function setStatus(status) {
  return salvar({ status });
}

function avisarBackground(type, dados) {
  return chrome.runtime.sendMessage({ target: 'background', type, ...dados }).catch(() => {});
}

async function criarSessao(contextoId) {
  const res = await fetch(`${BACKEND}/sessoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contexto_id: contextoId || null })
  });
  if (!res.ok) throw new Error(`backend respondeu ${res.status}: ${(await res.text()).slice(0, 150)}`);
  return (await res.json()).id;
}

async function abrirMicrofone() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    });
  } catch (e) {
    console.warn('microfone indisponível', e);
    return null;
  }
}

async function iniciar({ streamId, intervaloS = 7, contextoId = null, usarMic = true }) {
  try {
    maxMs = Math.max(4, intervaloS) * 1000;
    minMs = Math.max(2500, maxMs * 0.4);

    await setStatus('Criando sessão no backend...');
    sessaoId = await criarSessao(contextoId);

    streamAba = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId }
      },
      video: false
    });
    streamMic = usarMic ? await abrirMicrofone() : null;

    audioCtx = new AudioContext();
    mix = audioCtx.createMediaStreamDestination();
    const fonteAba = audioCtx.createMediaStreamSource(streamAba);
    // Sem isso, a aba fica muda para o usuário durante a captura
    fonteAba.connect(audioCtx.destination);
    fonteAba.connect(mix);
    // O microfone vai só para a gravação (não toca de volta, senão dá eco)
    if (streamMic) audioCtx.createMediaStreamSource(streamMic).connect(mix);

    analisador = audioCtx.createAnalyser();
    analisador.fftSize = 2048;
    audioCtx.createMediaStreamSource(mix.stream).connect(analisador);

    gravando = true;
    contador = 0;
    await salvar({ sessao: sessaoId, chunks: 0, microfone: !!streamMic });
    abrirEventos();
    novoTrecho();
    medidor = setInterval(medir, AMOSTRA_MS);

    const fontes = streamMic ? 'aba + microfone' : (usarMic ? 'só aba (microfone sem permissão)' : 'só aba');
    await setStatus(`Gravando ${fontes}, trechos de ${(minMs / 1000).toFixed(0)}-${intervaloS}s...`);
  } catch (e) {
    console.error(e);
    pararCaptura();
    await salvar({ gravando: false, status: 'Erro ao iniciar: ' + e.message });
    avisarBackground('finalizado', {});
  }
}

// ---------- corte por silêncio ----------

const buffer = new Float32Array(2048);

function medir() {
  if (!gravando || !trecho) return;
  analisador.getFloatTimeDomainData(buffer);
  let soma = 0;
  for (let i = 0; i < buffer.length; i++) soma += buffer[i] * buffer[i];
  const rms = Math.sqrt(soma / buffer.length);

  // Piso de ruído adaptativo: cai rápido, sobe devagar
  pisoRuido = rms < pisoRuido ? rms : pisoRuido * 0.998 + rms * 0.002;
  const fala = rms > Math.max(LIMIAR_MINIMO, pisoRuido * 2.5);

  const agora = Date.now();
  if (fala) {
    trecho.teveVoz = true;
    silencioDesde = null;
  } else if (silencioDesde === null) {
    silencioDesde = agora;
  }

  const duracao = agora - trecho.inicioMs;
  const emPausa = silencioDesde !== null && agora - silencioDesde >= PAUSA_MS;
  if ((duracao >= minMs && emPausa) || duracao >= maxMs) cortar();
}

function novoTrecho() {
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  // Um MediaRecorder novo por trecho => cada arquivo tem cabeçalho WebM válido
  const t = { recorder: new MediaRecorder(mix.stream, { mimeType: mime }), partes: [], inicioMs: Date.now(), teveVoz: false };
  t.recorder.ondataavailable = (e) => { if (e.data.size > 0) t.partes.push(e.data); };
  t.recorder.onstop = () => {
    // Trecho sem nenhuma fala não vale uma chamada ao Gemini
    if (!t.partes.length || !t.teveVoz) return;
    contador++;
    const p = enviar(new Blob(t.partes, { type: 'audio/webm' }), contador, t.inicioMs, Date.now() - t.inicioMs);
    envios.add(p);
    p.finally(() => envios.delete(p));
  };
  t.recorder.start();
  trecho = t;
  silencioDesde = null;
}

function cortar() {
  const antigo = trecho;
  // Começa o próximo antes de parar o atual: nenhum pedaço de áudio fica de fora
  if (gravando) novoTrecho(); else trecho = null;
  if (antigo && antigo.recorder.state === 'recording') antigo.recorder.stop();
}

// ---------- envio ----------

async function enviar(blob, n, inicioMs, duracaoMs) {
  await salvar({ chunks: n });

  const form = new FormData();
  form.append('audio_chunk', blob, `chunk_${n}.webm`);
  form.append('seq', String(n));
  form.append('inicio_ms', String(inicioMs));
  form.append('duracao_ms', String(duracaoMs));

  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${BACKEND}/sessoes/${sessaoId}/audio`, { method: 'POST', body: form, signal: controller.signal });
    const texto = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${texto.slice(0, 200)}`);
    const data = JSON.parse(texto);
    await avisarBackground('transcricao', { item: { n, ...data } });
    if (gravando) await setStatus(`Trecho #${n} transcrito (${(duracaoMs / 1000).toFixed(1)}s). Gravando...`);
  } catch (e) {
    console.error(e);
    const msg = e.name === 'AbortError' ? 'timeout (60s)' : e.message;
    await setStatus(`Trecho #${n} falhou: ${msg}`);
  } finally {
    clearTimeout(abort);
  }
}

// O backend avisa por SSE quando a análise do copiloto muda
function abrirEventos() {
  eventos = new EventSource(`${BACKEND}/sessoes/${sessaoId}/eventos`);
  eventos.addEventListener('copiloto', (e) => {
    avisarBackground('copiloto', { dados: JSON.parse(e.data) });
  });
}

// ---------- parada ----------

function pararCaptura() {
  gravando = false;
  clearInterval(medidor);
  // stop() dispara onstop, que envia o último pedaço de áudio
  cortar();
  for (const s of [streamAba, streamMic]) if (s) s.getTracks().forEach((t) => t.stop());
  if (audioCtx) audioCtx.close();
  streamAba = streamMic = audioCtx = mix = analisador = null;
}

async function parar() {
  pararCaptura();

  // Dá tempo do onstop rodar e espera os envios pendentes
  await new Promise((r) => setTimeout(r, 300));
  await setStatus('Finalizando: aguardando últimos trechos...');
  await Promise.allSettled([...envios]);

  if (sessaoId) {
    await setStatus('Gerando análise final e ata...');
    try {
      const res = await fetch(`${BACKEND}/sessoes/${sessaoId}/finalizar`, { method: 'POST' });
      const data = await res.json();
      if (data.copiloto) await avisarBackground('copiloto', { dados: data.copiloto });
      await setStatus(`Finalizado${data.ata ? ' (ata gerada)' : ''}. Arquivos em: ${data.pasta}`);
    } catch (e) {
      await setStatus('Parado (falha ao finalizar: ' + e.message + ')');
    }
  }
  if (eventos) eventos.close();
  eventos = null;

  avisarBackground('finalizado', {});
}
