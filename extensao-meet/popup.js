const BACKEND = 'http://localhost:8000';

const $ = (id) => document.getElementById(id);
const btnGravar = $('btnGravar');
const btnParar = $('btnParar');
const statusDot = $('statusDot');
const statusTxt = $('statusTxt');
const resultadoDiv = $('resultado');
const selContexto = $('selContexto');
const chkMic = $('chkMic');
const inputIntervalo = $('inputIntervalo');

// O popup só controla e exibe. A gravação roda no offscreen document,
// então continua funcionando mesmo com o popup fechado.

let sessaoAtual = null;

// ---------- configuração ----------

chrome.storage.local.get(['intervalo_s', 'usar_mic', 'contexto_id'], async (res) => {
  if (res.intervalo_s) inputIntervalo.value = res.intervalo_s;
  if (res.usar_mic === false) chkMic.checked = false;
  await carregarContextos(res.contexto_id);
});

async function carregarContextos(selecionado) {
  try {
    const lista = await (await fetch(`${BACKEND}/contextos`)).json();
    for (const c of lista) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.nome} (${c.itens_checklist} perguntas)`;
      selContexto.appendChild(opt);
    }
    if (selecionado && lista.some((c) => c.id === selecionado)) selContexto.value = selecionado;
  } catch {
    statusTxt.innerText = 'Backend offline em ' + BACKEND;
  }
}

selContexto.addEventListener('change', () => chrome.storage.local.set({ contexto_id: selContexto.value || null }));
chkMic.addEventListener('change', () => chrome.storage.local.set({ usar_mic: chkMic.checked }));
inputIntervalo.addEventListener('change', () => {
  let val = parseInt(inputIntervalo.value, 10);
  if (isNaN(val) || val < 4) val = 4;
  if (val > 30) val = 30;
  inputIntervalo.value = val;
  chrome.storage.local.set({ intervalo_s: val });
});

async function microfoneLiberado() {
  try {
    return (await navigator.permissions.query({ name: 'microphone' })).state === 'granted';
  } catch {
    return false;
  }
}

// ---------- iniciar / parar ----------

btnGravar.addEventListener('click', async () => {
  if (chkMic.checked && !(await microfoneLiberado())) {
    // O offscreen não consegue pedir permissão; abre uma página que pede uma vez
    chrome.tabs.create({ url: chrome.runtime.getURL('permissao.html') });
    statusTxt.innerText = 'Permita o microfone na aba aberta e clique em Iniciar de novo.';
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const intervalo_s = parseInt(inputIntervalo.value, 10) || 10;
  await chrome.storage.local.set({ intervalo_s });

  statusTxt.innerText = 'Solicitando captura da aba...';
  const resp = await chrome.runtime.sendMessage({
    target: 'background',
    type: 'start',
    tabId: tab.id,
    intervalo_s,
    contexto_id: selContexto.value || null,
    usar_mic: chkMic.checked
  });
  if (!resp || !resp.ok) statusTxt.innerText = 'Erro: ' + (resp?.erro || 'desconhecido');
});

btnParar.addEventListener('click', () => {
  chrome.runtime.sendMessage({ target: 'background', type: 'stop' });
});

// ---------- ações durante a reunião ----------

async function api(caminho, metodo, corpo) {
  const res = await fetch(`${BACKEND}/sessoes/${sessaoAtual}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function atualizarCopiloto() {
  const dados = await api('/copiloto', 'GET');
  await chrome.storage.local.set({ copiloto: dados });
}

// Clique no item avança o status: pendente -> parcial -> respondida -> ignorada -> pendente
const PROXIMO = { pendente: 'parcial', parcial: 'respondida', respondida: 'ignorada', ignorada: 'pendente' };

$('lstChecklist').addEventListener('click', async (e) => {
  const li = e.target.closest('li[data-id]');
  if (!li || !sessaoAtual) return;
  await api(`/checklist/${li.dataset.id}`, 'PATCH', { status: PROXIMO[li.dataset.status] || 'respondida' });
  await atualizarCopiloto();
});

function aoEnviar(input, botao, acao) {
  const rodar = async () => {
    const texto = input.value.trim();
    if (!texto || !sessaoAtual) return;
    botao.disabled = true;
    try {
      await acao(texto);
      input.value = '';
    } catch (e) {
      statusTxt.innerText = 'Erro: ' + e.message;
    } finally {
      botao.disabled = false;
    }
  };
  botao.addEventListener('click', rodar);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') rodar(); });
}

aoEnviar($('inputItem'), $('btnItem'), async (pergunta) => {
  await api('/checklist', 'POST', { pergunta });
  await atualizarCopiloto();
});

aoEnviar($('inputNota'), $('btnNota'), async (texto) => {
  await api('/anotacoes', 'POST', { texto });
  await atualizarCopiloto();
});

aoEnviar($('inputChat'), $('btnChat'), async (texto) => {
  $('txtChat').innerText = 'Pensando...';
  const r = await api('/perguntar', 'POST', { texto });
  const { chat = [] } = await chrome.storage.local.get('chat');
  chat.unshift(r);
  await chrome.storage.local.set({ chat: chat.slice(0, 10) });
});

// ---------- renderização ----------

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function lista(itens, vazio) {
  return itens?.length
    ? '<ul>' + itens.map((r) => `<li>${escapeHtml(r)}</li>`).join('') + '</ul>'
    : `<span class="vazio">${vazio}</span>`;
}

const ICONE = { pendente: '⬜', parcial: '🟨', respondida: '✅', ignorada: '➖' };

function renderChecklist(itens) {
  if (!itens?.length) return '<li class="vazio">(sem checklist: escolha um contexto ou adicione abaixo)</li>';
  return itens.map((i) => `
    <li data-id="${escapeHtml(i.id)}" data-status="${escapeHtml(i.status)}" class="${escapeHtml(i.status)}"
        title="Clique para mudar o status (${escapeHtml(i.status)}${i.manual ? ', marcado à mão' : ''})">
      <span class="ico">${ICONE[i.status] || '⬜'}</span>
      <span>
        <span class="perg">${i.obrigatoria ? '<span class="obrig">*</span> ' : ''}${escapeHtml(i.pergunta)}</span>
        ${i.resposta ? `<span class="resp">${i.hora ? `[${escapeHtml(i.hora)}] ` : ''}${escapeHtml(i.resposta)}</span>` : ''}
      </span>
    </li>`).join('');
}

function render(state) {
  const gravando = !!state.gravando;
  sessaoAtual = state.sessao || null;
  btnGravar.style.display = gravando ? 'none' : 'flex';
  btnParar.style.display = gravando ? 'flex' : 'none';
  $('config').style.opacity = gravando ? 0.5 : 1;
  for (const el of [selContexto, chkMic, inputIntervalo]) el.disabled = gravando;
  statusDot.classList.toggle('active', gravando);
  statusTxt.innerText = state.status || 'Status: Parado';
  $('chunkCounter').innerText = `Trechos enviados: ${state.chunks || 0}` + (sessaoAtual ? ` · sessão ${sessaoAtual}` : '');

  if (!sessaoAtual) return;
  resultadoDiv.style.display = 'block';

  const u = state.ultimo;
  $('txtTranscricao').innerText = u?.texto?.trim() || '(aguardando fala)';

  const c = state.copiloto;
  if (c) {
    $('txtPergunta').innerText = c.sugestao_pergunta_imediata || '(nenhuma pendência imediata)';
    $('txtSugeridas').innerHTML = lista(c.perguntas_sugeridas, '(aguardando análise)');
    $('lstChecklist').innerHTML = renderChecklist(c.checklist);
    const p = c.progresso || {};
    $('txtProgresso').innerText = p.total
      ? `${p.respondida}/${p.total} respondidas · ${p.parcial} parciais` + (p.obrigatorias_pendentes ? ` · ${p.obrigatorias_pendentes} obrigatórias faltando` : '')
      : '';
    const notas = [
      ...(c.anotacoes?.manuais || []).map((n) => `[${n.hora}] ${n.texto}`),
      ...(c.anotacoes?.ia || [])
    ];
    $('txtAnotacoes').innerHTML = lista(notas, '(nenhuma ainda)');
    $('txtRegras').innerHTML = lista(c.regras_negocio, '(nenhuma regra citada ainda)');
  }

  const ultimaResposta = state.chat?.[0];
  if (ultimaResposta) {
    $('txtChat').innerText = `P: ${ultimaResposta.pergunta}\n\n${ultimaResposta.resposta}`;
  }
}

chrome.storage.local.get(null, render);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get(null, render));
