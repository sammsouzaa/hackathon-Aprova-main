/**
 * Testes de VAD, segmentação, atribuição de falante e eco (F3), com sinais sintéticos.
 * Rodar: npm run teste:segmentacao
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { idsDuplicadosPorEco, normalizarTokens, similaridadeDeTexto } from '../../src/services/audio/eco.ts';
import {
  atrasar,
  concatenar,
  executarCoordenador,
  executarSegmentador,
  fala,
  ganho,
  gerador,
  ruido,
  somar,
  sobre
} from './sinais.ts';

const perto = (valor: number, alvo: number, tolerancia: number, rotulo: string) =>
  assert.ok(Math.abs(valor - alvo) <= tolerancia, `${rotulo}: ${valor} fora de ${alvo} ± ${tolerancia}`);

test('silêncio com ruído de sala não gera segmentos', () => {
  const rnd = gerador(1);
  assert.equal(executarSegmentador(ruido(10000, 0.003, rnd)).length, 0);
});

test('uma fala: fronteiras dentro de ±300 ms e pré/pós-rolagem presentes', () => {
  const rnd = gerador(2);
  const sinal = sobre(5000, 0.003, rnd, [1500, fala(2000, 0.1, rnd)]);
  const segmentos = executarSegmentador(sinal);
  assert.equal(segmentos.length, 1);
  const s = segmentos[0];
  perto(s.inicioMs, 1500 - 250, 130, 'início (fala em 1500 menos pré-rolagem)');
  perto(s.fimMs, 3500 + 200, 130, 'fim (fala até 3500 mais pós-rolagem)');
  perto(s.vozMs, 2000, 250, 'duração da voz');
  assert.equal(s.amostras.length, Math.round(((s.fimMs - s.inicioMs) * 16000) / 1000));
  assert.equal(s.forcadoPorTamanho, false);
});

test('pausa curta (400 ms) mantém uma fala só; pausa longa (1200 ms) separa em duas', () => {
  const rnd = gerador(3);
  const curta = sobre(7000, 0.003, rnd, [1500, fala(1500, 0.1, rnd)], [3400, fala(1500, 0.1, rnd)]);
  assert.equal(executarSegmentador(curta).length, 1);
  const longa = sobre(8000, 0.003, rnd, [1500, fala(1500, 0.1, rnd)], [4200, fala(1500, 0.1, rnd)]);
  assert.equal(executarSegmentador(longa).length, 2);
});

test('fala curta demais (200 ms) é descartada', () => {
  const rnd = gerador(4);
  assert.equal(executarSegmentador(sobre(5000, 0.003, rnd, [2000, fala(200, 0.1, rnd)])).length, 0);
});

test('fala contínua de 40 s: nenhum segmento passa de 15 s, cortes nas pausas e sem perder áudio', () => {
  const rnd = gerador(5);
  const partes: Array<[number, Float32Array]> = [];
  const pausas: Array<[number, number]> = [];
  let t = 1500;
  for (let i = 0; i < 16; i++) {
    partes.push([t, fala(2200, 0.1, rnd)]);
    t += 2200;
    pausas.push([t, t + 300]);
    t += 300;
  }
  const sinal = sobre(t + 2000, 0.003, rnd, ...partes);
  const segmentos = executarSegmentador(sinal);

  assert.ok(segmentos.length >= 3, `esperava ≥ 3 segmentos, veio ${segmentos.length}`);
  for (const s of segmentos) assert.ok(s.fimMs - s.inicioMs <= 15000, `segmento de ${s.fimMs - s.inicioMs} ms`);
  segmentos.slice(0, -1).forEach((s) => assert.equal(s.forcadoPorTamanho, true));
  for (const s of segmentos.slice(0, -1)) {
    const dentroDeUmaPausa = pausas.some(([ini, fim]) => s.fimMs >= ini - 130 && s.fimMs <= fim + 130);
    assert.ok(dentroDeUmaPausa, `corte em ${s.fimMs} ms não está numa pausa`);
  }
  for (let i = 1; i < segmentos.length; i++) {
    perto(segmentos[i].inicioMs, segmentos[i - 1].fimMs, 70, 'segmentos contíguos');
  }
  const coberto = segmentos.reduce((soma, s) => soma + (s.fimMs - s.inicioMs), 0);
  assert.ok(coberto >= 40000, `cobriu só ${coberto} ms dos ~41 s de fala`);
});

test('ruído de fundo alto e constante (0,01) é calibrado: sem falsos positivos e a fala ainda passa', () => {
  const rnd = gerador(6);
  const sinal = sobre(12000, 0.01, rnd, [8000, fala(2000, 0.1, rnd)]);
  const segmentos = executarSegmentador(sinal);
  assert.equal(segmentos.length, 1);
  perto(segmentos[0].inicioMs, 8000 - 250, 200, 'início depois do ruído');
});

test('fala logo no início (durante a calibração) não perde o começo', () => {
  const rnd = gerador(7);
  const sinal = sobre(6000, 0.003, rnd, [300, fala(2500, 0.1, rnd)]);
  const segmentos = executarSegmentador(sinal);
  assert.equal(segmentos.length, 1);
  assert.ok(segmentos[0].inicioMs <= 300, `começou em ${segmentos[0].inicioMs}`);
});

test('salto de relógio (pausa ou reconexão) fecha o segmento aberto e nenhum segmento atravessa o buraco', () => {
  const rnd = gerador(8);
  // A primeira fala (1,5 a 4,5 s) é cortada pelo salto aos 3 s; o resto dela e a segunda fala
  // chegam depois do buraco de 5 s.
  const sinal = sobre(9000, 0.003, rnd, [1500, fala(3000, 0.1, rnd)], [6000, fala(1500, 0.1, rnd)]);
  const segmentos = executarSegmentador(sinal, {}, [{ aposMs: 3000, somarMs: 5000 }]);
  assert.equal(segmentos.length, 3);
  assert.ok(segmentos[0].fimMs <= 3300, `primeira terminou em ${segmentos[0].fimMs}`);
  assert.ok(segmentos[1].inicioMs >= 7900, `a segunda começou em ${segmentos[1].inicioMs}, antes do fim do buraco`);
  for (const s of segmentos) assert.ok(s.fimMs - s.inicioMs < 3300, 'um segmento atravessou o buraco do relógio');
});

test('canais: monitor vira "prefeitura", microfone vira "implantadora"', () => {
  const rnd = gerador(9);
  const mic = sobre(9000, 0.003, rnd, [5500, fala(2000, 0.1, rnd)]);
  const mon = sobre(9000, 0.003, rnd, [1500, fala(2000, 0.1, rnd)]);
  const { segmentos } = executarCoordenador(mic, mon);
  const ordenados = [...segmentos].sort((a, b) => a.inicioMs - b.inicioMs);
  assert.equal(ordenados.length, 2);
  assert.equal(ordenados[0].falante, 'prefeitura');
  assert.equal(ordenados[0].canal, 'monitor');
  assert.equal(ordenados[1].falante, 'implantadora');
  assert.equal(ordenados[1].canal, 'microfone');
  assert.ok(ordenados.every((s) => s.atribuicao === 'canal' && !s.eco.descartado));
  assert.ok(ordenados[0].inicioMs < ordenados[1].inicioMs);
});

test('eco: voz do monitor que volta pelo microfone (200 ms, 30%) é descartada', () => {
  const rnd = gerador(10);
  const vozMonitor = fala(3500, 0.1, rnd);
  const mon = sobre(9000, 0.003, rnd, [1500, vozMonitor]);
  const eco = ganho(atrasar(mon, 200), 0.3);
  const mic = somar(ruido(9000, 0.003, rnd), eco);
  const { segmentos, coordenador } = executarCoordenador(mic, mon);

  const doMic = segmentos.filter((s) => s.canal === 'microfone');
  assert.equal(doMic.length, 1, 'o microfone chegou a detectar a voz do eco');
  assert.equal(doMic[0].eco.descartado, true);
  assert.equal(doMic[0].amostras.length, 0);
  perto(doMic[0].eco.lagMs, 200, 48, 'atraso estimado do eco');
  assert.ok(doMic[0].eco.correlacao >= 0.6);
  assert.equal(segmentos.filter((s) => s.canal === 'monitor' && !s.eco.descartado).length, 1);
  assert.equal(coordenador.estatisticas().descartadosPorEco, 1);
});

test('dupla fala: a implantadora fala por cima da prefeitura (com eco fraco) e NÃO é descartada', () => {
  const rnd = gerador(11);
  const mon = sobre(10000, 0.003, rnd, [1500, fala(5000, 0.1, rnd)]);
  const propria = sobre(10000, 0.003, rnd, [2500, fala(3000, 0.12, rnd)]);
  const mic = somar(propria, ganho(atrasar(mon, 200), 0.1));
  const { segmentos } = executarCoordenador(mic, mon);

  const doMic = segmentos.filter((s) => s.canal === 'microfone');
  assert.ok(doMic.length >= 1, 'a fala própria sumiu');
  assert.ok(doMic.every((s) => !s.eco.descartado), `marcada como eco: ${JSON.stringify(doMic.map((s) => s.eco))}`);
});

test('fone de ouvido (microfone limpo) durante a fala da prefeitura: nada é marcado como eco', () => {
  const rnd = gerador(12);
  const mon = sobre(9000, 0.003, rnd, [1500, fala(3500, 0.1, rnd)]);
  const mic = sobre(9000, 0.003, rnd, [6000, fala(1500, 0.1, rnd)]);
  const { segmentos } = executarCoordenador(mic, mon);
  assert.equal(segmentos.filter((s) => s.canal === 'microfone').length, 1);
  assert.equal(segmentos.filter((s) => s.eco.descartado).length, 0);
});

test('sem monitor (um canal): falante "indefinido"; com indicação manual vira "manual"', () => {
  const rnd = gerador(13);
  const mic = sobre(14000, 0.003, rnd, [1500, fala(2000, 0.1, rnd)], [5500, fala(2000, 0.1, rnd)], [9500, fala(2000, 0.1, rnd)]);
  const { segmentos } = executarCoordenador(mic, null, {
    modoUmCanal: true,
    aoBloco: (c, fimMs) => {
      if (fimMs === 1472) c.definirFalanteManual('prefeitura');
      if (fimMs === 5440) c.definirFalanteManual('implantadora');
      if (fimMs === 9472) c.definirFalanteManual(null);
    }
  });
  const ordenados = [...segmentos].sort((a, b) => a.inicioMs - b.inicioMs);
  assert.equal(ordenados.length, 3);
  assert.deepEqual(
    ordenados.map((s) => [s.falante, s.atribuicao]),
    [
      ['prefeitura', 'manual'],
      ['implantadora', 'manual'],
      ['indefinido', 'indefinido']
    ]
  );
});

test('finalizar fecha a fala em andamento (fim da reunião no meio de uma frase)', () => {
  const rnd = gerador(14);
  const mic = sobre(4000, 0.003, rnd, [1500, fala(2500, 0.1, rnd)]);
  const { segmentos } = executarCoordenador(mic, null, { modoUmCanal: true });
  assert.equal(segmentos.length, 1);
});

test('desempenho: 10 minutos de dois canais em menos de 3 s', () => {
  const rnd = gerador(15);
  const base = sobre(600000, 0.003, rnd, [2000, fala(60000, 0.08, rnd)]);
  const inicio = performance.now();
  executarCoordenador(base, base);
  const gasto = performance.now() - inicio;
  assert.ok(gasto < 3000, `levou ${Math.round(gasto)} ms`);
});

test('deduplicação por texto: o eco que passou pelo sinal some, a fala própria fica', () => {
  const duplicados = idsDuplicadosPorEco([
    { id: 1, canal: 'monitor', inicioMs: 1000, fimMs: 4000, texto: 'Aqui a gente usa 3 metros de recuo frontal.' },
    { id: 2, canal: 'microfone', inicioMs: 1200, fimMs: 4200, texto: 'aqui a gente usa três metros de recuo frontal' },
    { id: 3, canal: 'microfone', inicioMs: 9000, fimMs: 11000, texto: 'Entendi, vamos registrar como regra local.' },
    { id: 4, canal: 'microfone', inicioMs: 1500, fimMs: 2500, texto: 'gente usa 3 metros de recuo' }
  ]);
  assert.deepEqual([...duplicados].sort(), [2, 4]);
});

test('normalização de texto ignora acentos, caixa e pontuação', () => {
  assert.deepEqual(normalizarTokens('Três METROS, né?'), ['tres', 'metros', 'ne']);
  const { jaccard } = similaridadeDeTexto(['a', 'b', 'c'], ['a', 'b', 'd']);
  assert.equal(jaccard, 0.5);
});

test('trecho máximo de 5 s (modo API): fala contínua é cortada em pausas, sem perder áudio', () => {
  const rnd = gerador(6);
  const partes: Array<[number, Float32Array]> = [];
  let t = 1500;
  for (let i = 0; i < 16; i++) {
    partes.push([t, fala(2200, 0.1, rnd)]);
    t += 2500;
  }
  const sinal = sobre(t + 2000, 0.003, rnd, ...partes);
  const segmentos = executarSegmentador(sinal, { duracaoMaximaMs: 5000 });
  assert.ok(segmentos.length >= 6, `esperava ≥ 6 segmentos, veio ${segmentos.length}`);
  for (const s of segmentos) assert.ok(s.fimMs - s.inicioMs <= 5500, `segmento de ${s.fimMs - s.inicioMs} ms`);
});
