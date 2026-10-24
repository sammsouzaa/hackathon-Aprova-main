/**
 * Gerencia o processo de utilidade do motor de transcrição: carga sob demanda, fila de pedidos
 * com tempo limite, reinício controlado se o processo cair e descarga por ociosidade.
 * Usa só a API de `utilityProcess` recebida por injeção, para ser testável.
 */

/**
 * @param {object} config
 * @param {string} config.caminhoProcesso arquivo do processo (processo-stt.mjs)
 * @param {string} config.caminhoModelos
 * @param {number} config.threads
 * @param {(estado: object) => void} config.aoEstado
 * @param {Function} config.forkFn utilityProcess.fork
 */
export function criarGerenciadorStt({
  caminhoProcesso,
  caminhoModelos,
  nomeModelo = 'whisper-base-q8',
  dtype = 'q8',
  threads,
  aoEstado,
  forkFn,
  tempoLimiteCargaMs = 180000,
  tempoLimiteTranscricaoMs = 90000,
  ociosidadeMs = 10 * 60 * 1000,
  maximoReinicios = 3,
  existeModelo = () => true
}) {
  let filho = null;
  let estado = 'descarregado';
  let detalhe = '';
  let info = null;
  let ultimaCarga = null;
  let proximoId = 1;
  let encerrando = false;
  let promessaPreaquecimento = null;
  let temporizadorOciosidade = null;
  let reinicios = [];
  const pendentes = new Map();

  function foto() {
    return { estado, detalhe, info, threads, tempoCargaMs: ultimaCarga?.tempoCargaMs ?? null, rssMb: ultimaCarga?.rssMb ?? null };
  }

  function mudar(novo, novoDetalhe = '') {
    estado = novo;
    detalhe = novoDetalhe;
    aoEstado?.(foto());
  }

  function rejeitarPendentes(motivo) {
    for (const [, p] of pendentes) {
      clearTimeout(p.temporizador);
      p.rejeitar(new Error(motivo));
    }
    pendentes.clear();
  }

  function armarOciosidade() {
    clearTimeout(temporizadorOciosidade);
    if (!ociosidadeMs || estado !== 'pronto') return;
    temporizadorOciosidade = setTimeout(() => {
      if (pendentes.size === 0) descarregar().catch(() => {});
    }, ociosidadeMs);
    temporizadorOciosidade.unref?.();
  }

  function enviar(tipo, dados, tempoLimiteMs) {
    return new Promise((resolver, rejeitar) => {
      if (!filho) return rejeitar(new Error('Processo de transcrição não está ativo'));
      const id = proximoId++;
      const temporizador = setTimeout(() => {
        pendentes.delete(id);
        rejeitar(new Error(`Tempo esgotado (${Math.round(tempoLimiteMs / 1000)} s) em "${tipo}"`));
        // Um processo travado não volta sozinho: derrubar e deixar o reinício controlado agir.
        filho?.kill();
      }, tempoLimiteMs);
      pendentes.set(id, { resolver, rejeitar, temporizador });
      filho.postMessage({ tipo, id, ...dados });
    });
  }

  function iniciarProcesso() {
    filho = forkFn(caminhoProcesso, [], { serviceName: 'prumo-stt' });
    const este = filho;

    este.on('message', (mensagem) => {
      const pendente = pendentes.get(mensagem.id);
      if (!pendente) return;
      pendentes.delete(mensagem.id);
      clearTimeout(pendente.temporizador);
      if (mensagem.tipo === 'erro') pendente.rejeitar(new Error(mensagem.mensagem));
      else pendente.resolver(mensagem);
    });

    este.on('exit', (codigo) => {
      if (filho !== este) return;
      filho = null;
      clearTimeout(temporizadorOciosidade);
      const intencional = encerrando || estado === 'descarregado';
      rejeitarPendentes(`Processo de transcrição encerrou (código ${codigo})`);
      if (intencional) return;

      const agora = Date.now();
      reinicios = reinicios.filter((t) => agora - t < 5 * 60 * 1000);
      if (reinicios.length >= maximoReinicios) {
        mudar('erro', `O processo de transcrição caiu ${maximoReinicios} vezes em 5 min (último código ${codigo})`);
        return;
      }
      reinicios.push(agora);
      mudar('erro', `Processo de transcrição encerrou (código ${codigo}); reiniciando`);
      setTimeout(() => {
        if (!encerrando) preaquecer().catch(() => {});
      }, 500);
    });
  }

  function preaquecer() {
    if (estado === 'pronto') {
      armarOciosidade();
      return Promise.resolve(foto());
    }
    if (promessaPreaquecimento) return promessaPreaquecimento;

    if (!existeModelo()) {
      const mensagem = `Modelo não encontrado em ${caminhoModelos}. Rode "npm run modelos".`;
      mudar('erro', mensagem);
      return Promise.reject(new Error(mensagem));
    }

    mudar('carregando');
    promessaPreaquecimento = (async () => {
      try {
        if (!filho) iniciarProcesso();
        const resposta = await enviar('carregar', { caminhoModelos, nomeModelo, dtype, threads }, tempoLimiteCargaMs);
        info = resposta.info;
        ultimaCarga = { tempoCargaMs: resposta.tempoCargaMs, rssMb: resposta.rssMb };
        mudar('pronto');
        armarOciosidade();
        return foto();
      } catch (erro) {
        if (estado !== 'erro') mudar('erro', erro.message);
        throw erro;
      } finally {
        promessaPreaquecimento = null;
      }
    })();
    return promessaPreaquecimento;
  }

  async function transcrever(pcm, opcoes) {
    if (estado !== 'pronto') throw new Error('Motor não está pronto');
    clearTimeout(temporizadorOciosidade);
    try {
      const resposta = await enviar('transcrever', { pcm, opcoes }, tempoLimiteTranscricaoMs);
      if (ultimaCarga) ultimaCarga.rssMb = resposta.rssMb;
      return resposta.resultado;
    } finally {
      armarOciosidade();
    }
  }

  async function descarregar() {
    clearTimeout(temporizadorOciosidade);
    if (!filho) {
      if (estado !== 'descarregado') mudar('descarregado');
      return foto();
    }
    // Mata o processo: é a única forma de devolver os ~700 MB ao sistema.
    estado = 'descarregado';
    const este = filho;
    filho = null;
    rejeitarPendentes('Motor descarregado');
    este.kill();
    mudar('descarregado');
    return foto();
  }

  function encerrar() {
    encerrando = true;
    clearTimeout(temporizadorOciosidade);
    rejeitarPendentes('Aplicativo encerrando');
    filho?.kill();
    filho = null;
  }

  return {
    preaquecer,
    transcrever,
    descarregar,
    encerrar,
    estado: foto,
    /** PID do processo do motor (null se não houver); usado por testes e diagnóstico. */
    pid: () => filho?.pid ?? null
  };
}
