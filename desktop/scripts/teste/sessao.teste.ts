import test from 'node:test';
import assert from 'node:assert/strict';
import { SessaoDeTranscricao } from '../../src/services/transcricao/sessao.ts';
import { PersistenciaMemoria } from '../../src/services/transcricao/persistencia-memoria.ts';
import { MotorSTTSimulado } from '../../src/services/stt/motor-simulado.ts';
import { validarTranscricao } from '../validar-transcricao.mjs';
import { gerador, fala, sobre, BLOCO, atrasar, ganho, somar } from './sinais.ts';
import type { BlocoAudioCapturado } from '../../src/services/audio/captura.ts';

class FonteDeBlocosFake {
  private listener: ((bloco: BlocoAudioCapturado) => void) | null = null;

  onBloco(fn: (bloco: BlocoAudioCapturado) => void): () => void {
    this.listener = fn;
    return () => {
      this.listener = null;
    };
  }

  enviarStream(microfone: Float32Array, monitor: Float32Array | null, aoBloco?: (fimMs: number) => void): void {
    const total = Math.max(microfone.length, monitor?.length ?? 0);
    for (let pos = 0; pos + BLOCO <= total; pos += BLOCO) {
      const fimMs = ((pos + BLOCO) * 1000) / 16000;
      if (aoBloco) aoBloco(fimMs);
      if (pos + BLOCO <= microfone.length) {
        if (this.listener) {
          this.listener({ canal: 'microfone', amostras: microfone.subarray(pos, pos + BLOCO), tempoMs: fimMs, rms: 0.1 });
        }
      }
      if (monitor && pos + BLOCO <= monitor.length) {
        if (this.listener) {
          this.listener({ canal: 'monitor', amostras: monitor.subarray(pos, pos + BLOCO), tempoMs: fimMs, rms: 0.1 });
        }
      }
    }
  }
}

test('F5.4 (1, 7, 9): Falas do monitor viram prefeitura, microfone viram implantadora, ordenadas por inicioMs e JSON válido', async () => {
  const rnd = gerador(42);
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado({
    respostas: ['Primeira fala da implantadora', 'Resposta da prefeitura']
  });
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();

  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia
  });

  await sessao.iniciar({
    id: 'REU-CANAIS',
    processo: 'Processo Teste Canais',
    modoEscuta: 'gravacao_com_aviso',
    participantesAvisados: true
  });

  // Microfone fala em 1 s (duração 2 s); Monitor fala em 4 s (duração 2 s)
  const micAudio = sobre(7000, 0.001, rnd, [1000, fala(2000, 0.15, rnd)]);
  const monAudio = sobre(7000, 0.001, rnd, [4000, fala(2000, 0.15, rnd)]);

  fonte.enviarStream(micAudio, monAudio);
  const resultadoFinal = await sessao.finalizar();

  assert.ok(resultadoFinal);
  assert.equal(resultadoFinal.reuniao.estado, 'concluida');
  assert.equal(resultadoFinal.segmentos.length, 2);

  // Ordenação por inicioMs
  assert.equal(resultadoFinal.segmentos[0].canal, 'microfone');
  assert.equal(resultadoFinal.segmentos[0].falante, 'implantadora');
  assert.equal(resultadoFinal.segmentos[0].texto, 'Primeira fala da implantadora');
  assert.ok(resultadoFinal.segmentos[0].inicioMs >= 600 && resultadoFinal.segmentos[0].inicioMs <= 1400);

  assert.equal(resultadoFinal.segmentos[1].canal, 'monitor');
  assert.equal(resultadoFinal.segmentos[1].falante, 'prefeitura');
  assert.equal(resultadoFinal.segmentos[1].texto, 'Resposta da prefeitura');
  assert.ok(resultadoFinal.segmentos[1].inicioMs >= 3500 && resultadoFinal.segmentos[1].inicioMs <= 4400);

  assert.ok(resultadoFinal.segmentos[0].inicioMs <= resultadoFinal.segmentos[1].inicioMs);

  // Validação do JSON final
  const validacao = validarTranscricao(resultadoFinal);
  assert.equal(validacao.valido, true, `Erros: ${validacao.erros.join(', ')}`);
});

test('F5.4 (2): Eco de sinal sai com texto vazio e sem chamada ao motor STT', async () => {
  const rnd = gerador(99);
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado();
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();

  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia
  });

  await sessao.iniciar({
    id: 'REU-ECO-SINAL',
    processo: 'Proc Eco',
    modoEscuta: 'gravacao_com_aviso',
    participantesAvisados: true
  });

  // Fala no monitor e eco atrasado de 200 ms no microfone (atenuação 0.3)
  const falaPrefeitura = fala(2000, 0.2, rnd);
  const monAudio = sobre(5000, 0.001, rnd, [1000, falaPrefeitura]);
  const ecoMic = atrasar(ganho(falaPrefeitura, 0.3), 200);
  const micAudio = sobre(5000, 0.001, rnd, [1000, ecoMic]);

  fonte.enviarStream(micAudio, monAudio);
  const res = await sessao.finalizar();

  assert.ok(res);
  // O monitor gerou 1 fala útil, e o eco do microfone foi detectado no sinal
  const segEco = res.segmentos.find((s) => s.canal === 'microfone');
  assert.ok(segEco, 'Segmento de eco deve existir');
  assert.equal(segEco.descartadoPorEco, true);
  assert.equal(segEco.motivoDescarte, 'eco_sinal');
  assert.equal(segEco.texto, '', 'Texto do eco de sinal deve ser vazio');

  // O motor só deve ter recebido 1 áudio (o da prefeitura no monitor), NÃO o eco
  assert.equal(motor.recebidos.length, 1);
});

test('F5.4 (3): Eco de texto é marcado com descartadoPorEco: true e mantém o texto', async () => {
  const rnd = gerador(11);
  const fonte = new FonteDeBlocosFake();

  // Motor configurado para devolver o mesmo texto para ambos os canais
  const motor = new MotorSTTSimulado({
    textoPadrao: 'A taxa de ocupação máxima permitida na zona residencial é de 58%.'
  });
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();

  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia
  });

  await sessao.iniciar({
    id: 'REU-ECO-TEXTO',
    processo: 'Proc Eco Texto',
    modoEscuta: 'gravacao_com_aviso',
    participantesAvisados: true
  });

  // Dupla fala onde o sinal não é descartado pelo correlacionador (eco fraco de 0.1), mas o STT decodifica o mesmo texto
  const monAudio = sobre(10000, 0.003, rnd, [1500, fala(5000, 0.1, rnd)]);
  const propria = sobre(10000, 0.003, rnd, [2500, fala(3000, 0.12, rnd)]);
  const micAudio = somar(propria, ganho(atrasar(monAudio, 200), 0.1));

  fonte.enviarStream(micAudio, monAudio);
  const res = await sessao.finalizar();

  assert.ok(res);
  assert.equal(res.segmentos.length, 2);

  const segMic = res.segmentos.find((s) => s.canal === 'microfone')!;
  const segMon = res.segmentos.find((s) => s.canal === 'monitor')!;

  assert.equal(segMon.descartadoPorEco, false);
  assert.equal(segMic.descartadoPorEco, true);
  assert.equal(segMic.motivoDescarte, 'eco_texto');
  assert.ok(segMic.texto.includes('58%'), 'Texto deve ser mantido mesmo descartado por eco de texto');

  const validacao = validarTranscricao(res);
  assert.equal(validacao.valido, true);
});

test('F5.4 (4, 5): Recusas de modo_notas / participantesAvisados e espião no modo escuta_sem_guardar', async () => {
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado();
  await motor.carregar();

  let chamadasPersistencia = 0;
  const persistenciaEspia = {
    async iniciar() {
      chamadasPersistencia++;
      return { caminho: null, idArquivo: null };
    },
    async anexar() {
      chamadasPersistencia++;
      return false;
    },
    async evento() {
      chamadasPersistencia++;
      return false;
    },
    async finalizar() {
      chamadasPersistencia++;
      return null;
    },
    obterDados() {
      return null;
    }
  };

  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia: persistenciaEspia
  });

  // 1. modo_notas rejeita
  await assert.rejects(
    () =>
      sessao.iniciar({
        id: 'R1',
        processo: 'P1',
        modoEscuta: 'modo_notas',
        participantesAvisados: true
      }),
    /modo_notas/
  );

  // 2. participantesAvisados: false rejeita
  await assert.rejects(
    () =>
      sessao.iniciar({
        id: 'R2',
        processo: 'P2',
        modoEscuta: 'gravacao_com_aviso',
        participantesAvisados: false
      }),
    /participantes devem ser avisados/
  );
});

test('F5.4 (6): Falha do motor STT vira evento erro_stt sem derrubar a sessão', async () => {
  const rnd = gerador(77);
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado({
    falharNaTranscricao: [0]
  });
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();

  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia
  });

  await sessao.iniciar({
    id: 'REU-FALHA-MOTOR',
    processo: 'Proc Falha',
    modoEscuta: 'gravacao_com_aviso',
    participantesAvisados: true
  });

  const monAudio = sobre(8000, 0.001, rnd, [1000, fala(1500, 0.15, rnd)], [4000, fala(1500, 0.15, rnd)]);
  const micAudio = sobre(8000, 0.001, rnd);

  fonte.enviarStream(micAudio, monAudio);
  const res = await sessao.finalizar();

  assert.ok(res);
  assert.equal(res.segmentos.length, 1);
  const eventoErro = res.eventos.find((e) => e.tipo === 'erro_stt');
  assert.ok(eventoErro, 'Evento erro_stt deve ser registrado no JSON');
  assert.ok(eventoErro.detalhe?.includes('Falha simulada'));

  const validacao = validarTranscricao(res);
  assert.equal(validacao.valido, true);
});

test('F5.4 (8): Pausar e retomar geram eventos e não perdem fala em curso', async () => {
  const rnd = gerador(88);
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado();
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();

  let relogioSimulado = 0;
  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia,
    relogioMs: () => relogioSimulado
  });

  await sessao.iniciar({
    id: 'REU-PAUSA',
    processo: 'Proc Pausa',
    modoEscuta: 'gravacao_com_aviso',
    participantesAvisados: true
  });

  const fala1 = fala(1500, 0.15, rnd);
  const stream1Mic = sobre(3000, 0.001, rnd, [500, fala1]);
  fonte.enviarStream(stream1Mic, null, (t) => {
    relogioSimulado = t;
  });

  relogioSimulado = 3000;
  await sessao.pausar();

  const falaDurantePausa = fala(1500, 0.15, rnd);
  const streamPausa = sobre(3000, 0.001, rnd, [500, falaDurantePausa]);
  fonte.enviarStream(streamPausa, null, (t) => {
    relogioSimulado = 3000 + t;
  });

  relogioSimulado = 6000;
  sessao.retomar();

  const falaAposRetomada = fala(1500, 0.15, rnd);
  const stream2Mic = sobre(3000, 0.001, rnd, [500, falaAposRetomada]);
  fonte.enviarStream(stream2Mic, null, (t) => {
    relogioSimulado = 6000 + t;
  });

  relogioSimulado = 9500;
  const res = await sessao.finalizar();

  assert.ok(res);
  assert.equal(res.segmentos.length, 2);
  assert.ok(res.eventos.some((e) => e.tipo === 'pausada'));
  assert.ok(res.eventos.some((e) => e.tipo === 'retomada'));

  const validacao = validarTranscricao(res);
  assert.equal(validacao.valido, true);
});

test('F5.4 (10): Desempenho (60 s de áudio em menos de 1 s)', async () => {
  const rnd = gerador(314);
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado({ latenciaMs: 0 });
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();

  const sessao = new SessaoDeTranscricao({
    fonteDeBlocos: fonte,
    motor,
    persistencia
  });

  await sessao.iniciar({
    id: 'REU-DESEMPENHO',
    processo: 'Proc Desempenho 60s',
    modoEscuta: 'gravacao_com_aviso',
    participantesAvisados: true
  });

  const mic60s = sobre(
    60000,
    0.001,
    rnd,
    [2000, fala(3000, 0.15, rnd)],
    [12000, fala(4000, 0.15, rnd)],
    [25000, fala(3000, 0.15, rnd)],
    [40000, fala(5000, 0.15, rnd)]
  );

  const mon60s = sobre(
    60000,
    0.001,
    rnd,
    [6000, fala(4000, 0.15, rnd)],
    [18000, fala(4000, 0.15, rnd)],
    [32000, fala(4000, 0.15, rnd)],
    [50000, fala(4000, 0.15, rnd)]
  );

  const t0 = performance.now();
  fonte.enviarStream(mic60s, mon60s);
  const res = await sessao.finalizar();
  const t1 = performance.now();
  const tempoGastoMs = t1 - t0;

  assert.ok(res);
  assert.equal(res.segmentos.length, 8);
  assert.ok(tempoGastoMs < 1000, `Processamento de 60 s levou ${tempoGastoMs.toFixed(1)} ms (esperado < 1000 ms)`);

  const validacao = validarTranscricao(res);
  assert.equal(validacao.valido, true);
});

test('F6: finalizar({ interrompida }) descarta a fila, grava como "interrompida" e ignora resultado atrasado', async () => {
  const rnd = gerador(7);
  const fonte = new FonteDeBlocosFake();
  const motor = new MotorSTTSimulado({ latenciaMs: 400 });
  await motor.carregar();
  const persistencia = new PersistenciaMemoria();
  const sessao = new SessaoDeTranscricao({ fonteDeBlocos: fonte, motor, persistencia });
  const vistos: string[] = [];
  sessao.aoSegmento((s) => vistos.push(s.texto));

  await sessao.iniciar({ id: 'REU-INT', processo: 'Proc Int', modoEscuta: 'gravacao_com_aviso', participantesAvisados: true });
  const stream = sobre(4000, 0.001, rnd, [300, fala(1200, 0.15, rnd)], [2200, fala(1200, 0.15, rnd)]);
  fonte.enviarStream(stream, null);

  const t0 = Date.now();
  const res = await sessao.finalizar({ interrompida: true });
  assert.ok(Date.now() - t0 < 300, 'não pode esperar a fila do motor');
  assert.ok(res);
  assert.equal(res.reuniao.estado, 'interrompida');
  assert.equal(validarTranscricao(res).valido, true);
  const antes = vistos.length;
  await new Promise((r) => setTimeout(r, 900));
  assert.equal(vistos.length, antes, 'resultado do motor depois do encerramento não vira segmento');
});
