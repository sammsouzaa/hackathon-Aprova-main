/**
 * Teste de ponta a ponta da transcrição ao vivo (PRUMO_SMOKE=aovivo), com microfone falso tocando
 * uma fala em português em laço (ver scripts/electron-smoke.mjs). Percorre a interface de verdade:
 * escolhe "Ao vivo", espera o modelo, inicia, confere falas reais, pausa, retoma, encerra, valida o
 * JSON, reinicia no meio de uma reunião e confere o modo "escuta sem guardar".
 * Código de saída: 0 = ok, 1 = falha.
 */
import fs from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const espera = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export async function executar(janela, errosDoConsole) {
  const COM_API = ['1', 'real'].includes(process.env.PRUMO_SMOKE_API ?? '');
  const ESPERA_API_MS = process.env.PRUMO_SMOKE_API === 'real' ? 120000 : 20000; // API real analisa a cada ~30 s
  const pasta = path.resolve(process.env.PRUMO_SMOKE_SAIDA || '.tmp');
  mkdirSync(pasta, { recursive: true });
  const diretorioDados = path.join(process.env.PRUMO_DADOS, 'transcricoes');
  const { validarTranscricao } = await import(pathToFileURL(path.resolve('scripts/validar-transcricao.mjs')).href);

  const avaliar = (codigo) => janela.webContents.executeJavaScript(codigo);
  const passos = {};
  const falhas = [];
  const verificar = (nome, condicao, detalhe) => {
    passos[nome] = detalhe === undefined ? Boolean(condicao) : detalhe;
    if (!condicao) falhas.push(nome);
  };

  async function esperar(expressao, { limiteMs = 30000, passo = 400, rotulo = expressao } = {}) {
    const inicio = Date.now();
    while (Date.now() - inicio < limiteMs) {
      const valor = await avaliar(expressao);
      if (valor) return valor;
      await espera(passo);
    }
    throw new Error(`tempo esgotado: ${rotulo}`);
  }

  const textoDaTela = () => avaliar('document.body.innerText');
  const temTexto = (texto) => `document.body.innerText.includes(${JSON.stringify(texto)})`;
  const clicarCss = (seletor) =>
    avaliar(`(() => { const e = document.querySelector(${JSON.stringify(seletor)}); if (!e) return false; e.click(); return true; })()`);
  // Clica o primeiro controle habilitado cujo texto (ou título) bate. `exato` compara o texto inteiro.
  const clicarTexto = (texto, { exato = false, atributo = null } = {}) =>
    avaliar(`(() => {
      const alvo = ${JSON.stringify(texto)};
      const lista = [...document.querySelectorAll('button, [role="menuitem"], [role="radio"], [role="checkbox"]')];
      const e = lista.find((x) => {
        if (x.disabled) return false;
        const t = ${JSON.stringify(atributo)} ? (x.getAttribute(${JSON.stringify(atributo)}) || '') : x.innerText.trim();
        return ${exato ? 't === alvo' : 't.includes(alvo)'};
      });
      if (!e) return false;
      e.click();
      return true;
    })()`);
  const contarFalas = () => avaliar(`document.querySelectorAll('[aria-label="Transcrição da reunião"] p').length`);
  const abrirMenu = async () => {
    const aberto = await avaliar(`Boolean(document.querySelector('[role="menu"]'))`);
    if (!aberto) await clicarCss('[aria-label="Mais opções"]');
    await espera(200);
  };
  const capturar = async (nome) => {
    const imagem = await janela.webContents.capturePage();
    writeFileSync(path.join(pasta, nome), imagem.toPNG());
  };
  const arquivosJson = () =>
    fs.existsSync(diretorioDados) ? fs.readdirSync(diretorioDados).filter((f) => f.endsWith('.json') && !f.endsWith('.tmp')) : [];
  const lerJson = (nome) => JSON.parse(fs.readFileSync(path.join(diretorioDados, nome), 'utf-8'));

  async function escolherAoVivo() {
    await abrirMenu();
    verificar('escolheuAoVivo', await clicarTexto('Ao vivo', { exato: true }), undefined);
    await esperar(`document.body.innerText.includes('Transcrição ao vivo')`, { rotulo: 'chip fixo' });
    await clicarCss('[aria-label="Mais opções"]'); // fecha o menu
    await espera(200);
  }

  async function marcarAvisoEIniciar() {
    await clicarTexto('Participantes informados', { exato: false });
    await espera(200);
    return clicarTexto('Iniciar reunião');
  }

  async function fecharReuniaoComDoisToques() {
    verificar('encerrarPedeConfirmacao', await clicarTexto('Encerrar a reunião e fechar a transcrição', { atributo: 'title' }));
    await esperar(temTexto('Confirmar encerramento'), { rotulo: 'botão de confirmação' });
    await clicarTexto('Confirmar encerramento');
  }

  async function reiniciarDemonstracao() {
    await abrirMenu();
    await clicarTexto('Reiniciar demonstração');
    await espera(200);
    await clicarTexto('Sim, reiniciar');
    await esperar(`document.body.innerText.toLowerCase().includes('preparação da sessão')`, { rotulo: 'volta ao estado preparando' });
  }

  try {
    janela.show();
    await espera(1500);

    // ---------- 1. Escolher "Ao vivo", modelo e início ----------
    await escolherAoVivo();
    verificar('iniciarBloqueadoSemAviso', await avaliar(`[...document.querySelectorAll('button')].find((b) => b.innerText.includes('Iniciar reunião'))?.disabled === true`));
    const t0 = Date.now();
    await esperar(`/API do Prumo conectada|usando o modelo local/.test(document.body.innerText)`, { limiteMs: 120000, rotulo: 'motor pronto' });
    if (COM_API) verificar('apiConectada', (await textoDaTela()).includes('API do Prumo conectada'));
    passos.modeloProntoEmMs = Date.now() - t0;

    if (COM_API) {
      // Antes de iniciar, a tela já mostra o cliente que a API conhece.
      const prep = await textoDaTela();
      verificar('contextoDaApiNaPreparacao', prep.includes('MeuLab · IFPR Cascavel') && /4 de 14 já confirmados/.test(prep));
    }
    await clicarTexto('Participantes informados');
    await espera(250);
    verificar('iniciarLiberadoComModeloEAviso', await avaliar(`[...document.querySelectorAll('button')].find((b) => b.innerText.includes('Iniciar reunião'))?.disabled === false`));
    await capturar('aovivo-1-preparando.png');
    verificar('clicouIniciar', await clicarTexto('Iniciar reunião'));
    await esperar(temTexto('Transcrevendo'), { limiteMs: 30000, rotulo: 'rodapé "Transcrevendo"' });
    verificar('emReuniao', (await textoDaTela()).includes('Em reunião'));

    // Só confere os canais com os dispositivos reais da máquina (PRUMO_SMOKE_REAL=1), sem esperar fala.
    if (process.env.PRUMO_SMOKE_REAL === '1') {
      await espera(2500);
      await abrirMenu();
      passos.menuAoVivo = (await avaliar(`document.querySelector('[role="menu"]')?.innerText`)) ?? null;
      await capturar('aovivo-real-canais.png');
      return finalizar();
    }

    // ---------- 2. Falas reais na aba Transcrição ----------
    await clicarTexto('Transcrição', { exato: true });
    await esperar(`document.querySelector('[aria-label="Transcrição da reunião"]') !== null`, { rotulo: 'aba Transcrição' });
    // Um canal só (microfone falso, sem monitor): a pessoa diz quem fala.
    const umCanal = await avaliar(`document.body.innerText.includes('Quem está falando agora?')`);
    passos.umCanal = umCanal;
    if (umCanal) await clicarTexto('Implantadora', { exato: true });
    await esperar(`document.querySelectorAll('[aria-label="Transcrição da reunião"] p').length >= 2`, { limiteMs: 120000, rotulo: '2 falas reais' });
    const falas = await avaliar(`[...document.querySelectorAll('[aria-label="Transcrição da reunião"] p')].map((p) => p.innerText)`);
    passos.primeirasFalas = falas.slice(0, 3);
    verificar('falasNaoVazias', falas.every((f) => f.trim().length > 3));
    await capturar('aovivo-2-transcrevendo.png');

    // O roteiro não roda e o checklist não é marcado pela fala real.
    const textoTranscricao = await textoDaTela();
    if (!COM_API) verificar('checklistIntacto', textoTranscricao.includes('(4/10)'));
    verificar('semFalasDoRoteiro', await avaliar(`!/Helena|Marina/.test(document.body.innerText)`));
    verificar('semRoteiro', !textoTranscricao.includes('58%'));
    if (umCanal) {
      verificar('atribuicaoManualVisivel', textoTranscricao.includes('Implantadora (manual)') || (await textoDaTela()).includes('Implantadora (manual)'));
    }

    // ---------- 3. Pausar: nada novo é transcrito; continuar: volta ----------
    await abrirMenu();
    verificar('pausou', await clicarTexto('Pausar'));
    await esperar(temTexto('Pausada'), { rotulo: 'estado pausada' });
    await espera(process.env.PRUMO_SMOKE_API === 'real' ? 50000 : 12000); // deixa a fila do motor esvaziar (a API real leva ~8 s por trecho)
    const antes = await contarFalas();
    await espera(9000);
    const depois = await contarFalas();
    passos.falasEmPausa = { antes, depois };
    verificar('pausaNaoTranscreve', antes === depois);
    await abrirMenu();
    verificar('continuou', await clicarTexto('Continuar'));
    await esperar(`!document.body.innerText.includes('Pausada')`, { rotulo: 'sai do estado pausada' });
    await esperar(`document.querySelectorAll('[aria-label="Transcrição da reunião"] p').length > ${depois}`, { limiteMs: 90000, rotulo: 'novas falas depois de continuar' });
    verificar('retomadaTranscreve', true);

    if (COM_API) {
      // A análise da API marca o checklist (14 itens do simulador) e sugere perguntas no chat.
      await esperar(`/\\/14\\)/.test(document.body.innerText)`, { limiteMs: ESPERA_API_MS, rotulo: 'checklist da API' });
      await clicarTexto('Conversa', { exato: true });
      await esperar(temTexto('Pergunte agora:'), { limiteMs: ESPERA_API_MS, rotulo: 'sugestão da API no chat' });
      await clicarTexto('Qual a antecedência mínima da reserva?');
      await esperar(process.env.PRUMO_SMOKE_API === 'real' ? `document.querySelectorAll('[class*="cursor"]').length >= 0 && document.body.innerText.includes('Análise da API')` : temTexto('O recuo frontal mínimo é de 5 metros.'), { limiteMs: ESPERA_API_MS, rotulo: 'resposta do copiloto' });
      verificar('copilotoDaApi', true);
      await clicarTexto('Transcrição', { exato: true });
    }

    // ---------- 4. Encerrar: JSON válido e mensagem no chat ----------
    await fecharReuniaoComDoisToques();
    await clicarTexto('Conversa', { exato: true });
    await esperar(temTexto('Reunião encerrada.'), { limiteMs: 60000, rotulo: 'mensagem de encerramento' });
    const chat = await textoDaTela();
    const caminho = /Texto salvo em (\S+\.json)/.exec(chat)?.[1];
    verificar('mensagemComCaminho', Boolean(caminho), caminho ?? null);
    const arquivos = arquivosJson();
    verificar('umArquivoGravado', arquivos.length === 1, arquivos);
    if (arquivos.length >= 1) {
      const dados = lerJson(arquivos[0]);
      const validacao = validarTranscricao(dados);
      verificar('jsonValido', validacao.valido === true, validacao.valido ? 'ok' : validacao.erros);
      verificar('jsonConcluido', dados.reuniao.estado === 'concluida' && dados.reuniao.modoEscuta === 'gravacao_com_aviso');
      const comTexto = dados.segmentos.filter((s) => !s.descartadoPorEco && s.texto);
      verificar('jsonComFalas', comTexto.length >= 2, comTexto.length);
      verificar('jsonSemAudio', !JSON.stringify(dados).includes('amostras'));
      verificar('caminhoDaMensagemBate', caminho ? path.resolve(caminho) === path.resolve(diretorioDados, arquivos[0]) : false);
    }
    verificar('cabecalhoConcluida', (await textoDaTela()).includes('Concluída'));
    await capturar('aovivo-3-encerrada.png');

    // ---------- 5. Reiniciar a demonstração volta ao painel normal ----------
    await reiniciarDemonstracao();
    const abasDepois = await avaliar(`[...document.querySelectorAll('button')].map((b) => b.innerText.trim())`);
    verificar('abaTranscricaoSomeNoReinicio', !abasDepois.includes('Transcrição'));
    verificar('chipSomeNoReinicio', !(await textoDaTela()).includes('Transcrição ao vivo'));

    // ---------- 6. Escuta sem guardar: nada no disco ----------
    await escolherAoVivo();
    verificar('motorContinuaProntoNoReinicio', /API do Prumo conectada|usando o modelo local/.test(await textoDaTela()));
    await clicarTexto('Escuta sem guardar');
    await clicarTexto('Participantes informados');
    await espera(250);
    verificar('iniciouSemGuardar', await clicarTexto('Iniciar reunião'));
    await esperar(temTexto('Transcrevendo'), { rotulo: 'transcrevendo (sem guardar)' });
    await clicarTexto('Transcrição', { exato: true });
    await esperar(`document.querySelectorAll('[aria-label="Transcrição da reunião"] p').length >= 1`, { limiteMs: 120000, rotulo: 'fala no modo sem guardar' });
    await fecharReuniaoComDoisToques();
    await clicarTexto('Conversa', { exato: true });
    await esperar(temTexto('nada foi salvo em disco'), { limiteMs: 60000, rotulo: 'mensagem sem guardar' });
    verificar('semGuardarNaoGravaArquivo', arquivosJson().length === 1, arquivosJson());
    await reiniciarDemonstracao();

    // ---------- 7. Reiniciar no meio da reunião: captura fechada, JSON "interrompida" ----------
    await escolherAoVivo();
    await clicarTexto('Participantes informados');
    await espera(250);
    verificar('iniciouParaInterromper', await clicarTexto('Iniciar reunião'));
    await esperar(temTexto('Transcrevendo'), { rotulo: 'transcrevendo (interromper)' });
    await espera(6000);
    await reiniciarDemonstracao();
    await espera(1500);
    const apos = arquivosJson();
    verificar('doisArquivosAposInterromper', apos.length === 2, apos);
    const interrompido = apos.map((f) => ({ f, d: lerJson(f) })).find((x) => x.d.reuniao.estado === 'interrompida');
    verificar('jsonInterrompido', Boolean(interrompido));
    if (interrompido) {
      const validacao = validarTranscricao(interrompido.d);
      verificar('jsonInterrompidoValido', validacao.valido === true, validacao.valido ? 'ok' : validacao.erros);
    }
    verificar('painelVoltouAoRoteiro', (await textoDaTela()).toLowerCase().includes('preparação da sessão') && !(await textoDaTela()).includes('Transcrição ao vivo'));
    await capturar('aovivo-4-reiniciada.png');
  } catch (erro) {
    falhas.push(`exceção: ${erro.message}`);
    passos.excecao = erro.message;
    try {
      await capturar('aovivo-erro.png');
      passos.telaNoErro = (await textoDaTela()).slice(0, 1500);
    } catch {
      /* sem captura */
    }
  }

  return finalizar();

  function finalizar() {
    const errosRelevantes = errosDoConsole.filter((e) => !/gpu_persistent_cache|Persistent cache/.test(e));
    const resultado = { ok: falhas.length === 0 && errosRelevantes.length === 0, falhas, passos, erros: errosRelevantes };
    console.log(`PRUMO_SMOKE_AOVIVO ${JSON.stringify(resultado)}`);
    return resultado.ok ? 0 : 1;
  }
}
