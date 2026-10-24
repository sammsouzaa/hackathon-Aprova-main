// Service worker: orquestra a captura. Ele obtém o streamId da aba
// e repassa para o offscreen document, que é quem grava de fato.

const OFFSCREEN_URL = 'offscreen.html';

async function garantirOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)]
  });
  if (contexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA'],
    justification: 'Gravar o áudio da aba para transcrição'
  });
}

async function iniciar(tabId, { intervaloS = 7, contextoId = null, usarMic = true } = {}) {
  await garantirOffscreen();
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  await chrome.storage.local.set({
    gravando: true,
    status: 'Iniciando captura...',
    chunks: 0,
    sessao: null,
    historico: [],
    copiloto: null,
    chat: []
  });
  chrome.runtime.sendMessage({ target: 'offscreen', type: 'start', streamId, intervaloS, contextoId, usarMic });
}

async function parar() {
  await chrome.storage.local.set({ gravando: false, status: 'Parando...' });
  // O offscreen envia o último trecho, chama /finalizar e avisa com 'finalizado'
  chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'background') return;

  if (msg.type === 'finalizado') {
    // Só fecha se o usuário não iniciou outra gravação nesse meio tempo
    chrome.storage.local.get('gravando').then(({ gravando }) => {
      if (!gravando) chrome.offscreen.closeDocument().catch(() => {});
    });
    return;
  }

  // Estado vindo do offscreen (que não tem acesso a chrome.storage)
  if (msg.type === 'state') {
    chrome.storage.local.set(msg.patch).then(() => sendResponse({ ok: true }));
    return true;
  }

  // Cada trecho transcrito (resposta do /sessoes/{id}/audio)
  if (msg.type === 'transcricao') {
    chrome.storage.local.get('historico').then(({ historico = [] }) => {
      if (msg.item.texto) historico.unshift(msg.item);
      return chrome.storage.local.set({ ultimo: msg.item, historico: historico.slice(0, 30) });
    }).then(() => sendResponse({ ok: true }));
    return true;
  }

  // Estado do copiloto (checklist, perguntas, anotações) vindo do SSE
  if (msg.type === 'copiloto') {
    chrome.storage.local.set({ copiloto: msg.dados }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'start') {
    iniciar(msg.tabId, { intervaloS: msg.intervalo_s || 7, contextoId: msg.contexto_id, usarMic: msg.usar_mic })
      .then(() => sendResponse({ ok: true }))
      .catch((e) => {
        chrome.storage.local.set({ gravando: false, status: 'Erro: ' + e.message });
        sendResponse({ ok: false, erro: e.message });
      });
    return true; // resposta assíncrona
  }

  if (msg.type === 'stop') {
    parar().then(() => sendResponse({ ok: true }));
    return true;
  }
});
