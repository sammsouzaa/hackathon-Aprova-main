/**
 * Teste de fumaça do app empacotado em Electron (PRUMO_SMOKE=1).
 * Abre o app, confere o DOM, inicia a reunião, espera as primeiras falas e salva capturas.
 * Devolve o código de saída: 0 = ok, 1 = falha.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const espera = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function capturar(janela, arquivo) {
  const imagem = await janela.webContents.capturePage();
  writeFileSync(arquivo, imagem.toPNG());
  return imagem.getSize();
}

export async function executar(janela, errosDoConsole) {
  const pasta = path.resolve(process.env.PRUMO_SMOKE_SAIDA || '.tmp');
  mkdirSync(pasta, { recursive: true });
  // O app nasce em segundo plano: a janela não pode estar visível até alguém abri-la.
  const iniciouOculta = !janela.isVisible();
  janela.show();
  await espera(1500);

  const avaliar = (codigo) => janela.webContents.executeJavaScript(codigo);
  const resultado = { passos: { iniciouOculta }, erros: errosDoConsole };

  resultado.passos.api = await avaliar(
    `({ existe: typeof window.prumoDesktop === 'object', plataforma: window.prumoDesktop?.plataforma, topo: null })`
  );
  resultado.passos.api.topo = await avaliar('window.prumoDesktop.janela.sempreNoTopo()');
  resultado.passos.dom = await avaliar(
    `({ temPrumo: document.body.innerText.includes('Prumo'),
        temAviso: document.body.innerText.includes('Participantes'),
        selo: document.body.innerText.includes('dados fictícios'),
        larguraJanela: window.innerWidth, alturaJanela: window.innerHeight,
        rolagemDaPagina: document.documentElement.scrollHeight > window.innerHeight + 1 })`
  );
  resultado.passos.tamanhoCaptura1 = await capturar(janela, path.join(pasta, 'smoke-1-preparando.png'));

  // Marca o aviso e inicia a reunião.
  resultado.passos.inicio = await avaliar(`(() => {
    const caixa = document.querySelector('[role="checkbox"], input[type="checkbox"]');
    if (!caixa) return 'sem caixa de participantes';
    caixa.click();
    return new Promise((ok) => setTimeout(() => {
      const botao = [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Iniciar reunião'));
      if (!botao || botao.disabled) return ok('botão Iniciar indisponível');
      botao.click();
      ok('iniciada');
    }, 150));
  })()`);

  await espera(15000);
  resultado.passos.reuniao = await avaliar(
    `({ emReuniao: document.body.innerText.includes('Em reunião'),
        taxaOcupacao: document.body.innerText.includes('58%') })`
  );
  resultado.passos.tamanhoCaptura2 = await capturar(janela, path.join(pasta, 'smoke-2-em-reuniao.png'));

  // Painel fixo: colado na borda direita da área útil, em toda a altura, mesmo depois de deslocado.
  const { screen } = await import('electron');
  janela.setBounds({ ...janela.getBounds(), x: 100, y: 100 });
  await avaliar('window.prumoDesktop.janela.restaurarPosicao()');
  await espera(600);
  const limites = janela.getBounds();
  const area = screen.getDisplayMatching(limites).workArea;
  resultado.passos.posicao = {
    colouNaBordaDireita: limites.x + limites.width === area.x + area.width,
    ocupaTodaAAltura: limites.y === area.y && limites.height === area.height,
    limites,
    areaUtil: area
  };
  resultado.passos.topo = await avaliar('window.prumoDesktop.janela.sempreNoTopo(false)');
  await avaliar('window.prumoDesktop.janela.ocultar()');
  await espera(200);
  resultado.passos.ocultou = !janela.isVisible();
  janela.show();
  resultado.passos.voltou = janela.isVisible();

  const ok =
    resultado.passos.iniciouOculta &&
    resultado.passos.posicao.colouNaBordaDireita &&
    resultado.passos.posicao.ocupaTodaAAltura &&
    resultado.passos.topo === false &&
    resultado.passos.ocultou &&
    resultado.passos.voltou &&
    resultado.passos.api.existe &&
    resultado.passos.dom.temPrumo &&
    resultado.passos.dom.selo &&
    !resultado.passos.dom.rolagemDaPagina &&
    resultado.passos.inicio === 'iniciada' &&
    resultado.passos.reuniao.emReuniao &&
    errosDoConsole.length === 0;

  resultado.ok = ok;
  console.log(`PRUMO_SMOKE ${JSON.stringify(resultado)}`);
  return ok ? 0 : 1;
}
