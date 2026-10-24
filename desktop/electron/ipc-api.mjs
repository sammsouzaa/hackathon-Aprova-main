/**
 * Ponte HTTP para a API do Prumo (prumo:api:*). As chamadas saem do processo principal: sem CORS e
 * sem abrir a CSP da interface. A URL base vem de PRUMO_API_URL (padrão: http://localhost:8000).
 */
const URL_PADRAO = process.env.PRUMO_API_URL_PADRAO ?? 'http://localhost:8000';
const CAMINHO_PERMITIDO = /^\/(contextos|sessoes)(\/[A-Za-z0-9_.-]+)*(\?[A-Za-z0-9_=&.-]*)?$/;
const METODOS = new Set(['GET', 'POST', 'PATCH', 'PUT']);

export function registrarIpcApi({ ipcMain, eventoConfiavel }) {
  const base = (process.env.PRUMO_API_URL || URL_PADRAO).replace(/\/+$/, '');

  const validar = (evento) => (typeof eventoConfiavel === 'function' ? eventoConfiavel(evento) : true);

  async function requisitar(metodo, caminho, init, limiteMs) {
    // O cabeçalho dispensa a página de aviso do ngrok (túnel gratuito); os outros servidores o ignoram.
    const cabecalhos = { 'ngrok-skip-browser-warning': '1', ...(init.headers ?? {}) };
    const resposta = await fetch(base + caminho, { ...init, headers: cabecalhos, method: metodo, signal: AbortSignal.timeout(limiteMs) });
    const texto = await resposta.text();
    let dados = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = texto;
    }
    if (!resposta.ok) {
      const detalhe = typeof dados === 'object' && dados?.detail ? JSON.stringify(dados.detail) : String(texto).slice(0, 200);
      return { ok: false, status: resposta.status, erro: `API ${resposta.status}: ${detalhe}` };
    }
    return { ok: true, status: resposta.status, dados };
  }

  function falha(erro) {
    const causa = erro?.cause?.code || erro?.name;
    const msg = causa === 'TimeoutError' ? 'a API não respondeu a tempo' : `sem conexão com a API (${causa || erro?.message})`;
    return { ok: false, status: 0, erro: msg };
  }

  ipcMain.handle('prumo:api:base', (evento) => (validar(evento) ? base : null));

  ipcMain.handle('prumo:api:chamar', async (evento, pedido) => {
    if (!validar(evento)) return { ok: false, status: 0, erro: 'Acesso negado' };
    const { metodo = 'GET', caminho, corpo } = pedido ?? {};
    // Finalizar espera a análise final e perguntar consulta o modelo: precisam de mais tempo.
    const limiteMs = /\/(finalizar|perguntar|analisar)$/.test(caminho ?? '') ? 120000 : 20000;
    if (!METODOS.has(metodo) || typeof caminho !== 'string' || !CAMINHO_PERMITIDO.test(caminho)) {
      return { ok: false, status: 0, erro: 'Chamada de API não permitida' };
    }
    try {
      const init = corpo === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) };
      return await requisitar(metodo, caminho, init, limiteMs);
    } catch (erro) {
      return falha(erro);
    }
  });

  // Trecho de áudio WAV (bytes) para POST /sessoes/{id}/audio.
  ipcMain.handle('prumo:api:enviar-audio', async (evento, { sessaoId, wav, seq, inicioMs, duracaoMs } = {}) => {
    if (!validar(evento)) return { ok: false, status: 0, erro: 'Acesso negado' };
    if (typeof sessaoId !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(sessaoId) || !(wav instanceof Uint8Array) || wav.byteLength > 20 * 1024 * 1024) {
      return { ok: false, status: 0, erro: 'Áudio inválido' };
    }
    try {
      const form = new FormData();
      form.append('audio_chunk', new Blob([wav], { type: 'audio/wav' }), `trecho-${seq}.wav`);
      form.append('seq', String(seq));
      form.append('inicio_ms', String(Math.round(inicioMs)));
      form.append('duracao_ms', String(Math.round(duracaoMs)));
      return await requisitar('POST', `/sessoes/${sessaoId}/audio`, { body: form }, 90000);
    } catch (erro) {
      return falha(erro);
    }
  });
}
