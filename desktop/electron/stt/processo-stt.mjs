/**
 * Processo de utilidade do Electron que roda o Whisper (onnxruntime-node, nativo).
 * Fica fora do renderer para não travar a interface nem disputar memória com ela.
 *
 * Protocolo (mensagens por process.parentPort; cada pedido tem `id` e recebe UMA resposta):
 *   pai → filho: { tipo: 'carregar', id, caminhoModelos, nomeModelo, dtype, threads }
 *                { tipo: 'transcrever', id, pcm, opcoes } | { tipo: 'descarregar', id }
 *   filho → pai: { tipo: 'carregado', id, info, tempoCargaMs, rssMb } | { tipo: 'resultado', id, resultado, rssMb }
 *                { tipo: 'descarregado', id } | { tipo: 'erro', id, mensagem }
 * A configuração viaja dentro de "carregar": não há ordem de mensagens a respeitar.
 */
import os from 'node:os';
import { criarMotor } from './motor.mjs';

const porta = process.parentPort;
let motor = null;
let cadeia = Promise.resolve();

try {
  // Prioridade menor: a videochamada não pode engasgar por causa da transcrição.
  // PRUMO_STT_PRIORIDADE=0 desliga (útil para medir o desempenho puro).
  const prioridade = Number(process.env.PRUMO_STT_PRIORIDADE ?? 10);
  if (prioridade > 0) os.setPriority(0, prioridade);
} catch {
  // sem permissão: segue na prioridade normal
}

function rssMb() {
  return Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10;
}

async function tratar(mensagem) {
  const { tipo, id } = mensagem;
  try {
    if (tipo !== 'carregar' && !motor) throw new Error('Motor não foi carregado');
    if (tipo === 'carregar') {
      motor ??= criarMotor({
        caminhoModelos: mensagem.caminhoModelos,
        nomeModelo: mensagem.nomeModelo,
        dtype: mensagem.dtype,
        threads: mensagem.threads,
        aquecer: true
      });
      const inicio = performance.now();
      await motor.carregar();
      porta.postMessage({
        tipo: 'carregado',
        id,
        info: motor.info,
        tempoCargaMs: Math.round(performance.now() - inicio),
        rssMb: rssMb()
      });
    } else if (tipo === 'transcrever') {
      const pcm = mensagem.pcm instanceof Float32Array ? mensagem.pcm : new Float32Array(mensagem.pcm);
      const resultado = await motor.transcrever(pcm, mensagem.opcoes);
      porta.postMessage({ tipo: 'resultado', id, resultado, rssMb: rssMb() });
    } else if (tipo === 'descarregar') {
      await motor.descarregar();
      porta.postMessage({ tipo: 'descarregado', id });
    }
  } catch (erro) {
    porta.postMessage({ tipo: 'erro', id, mensagem: erro instanceof Error ? erro.message : String(erro) });
  }
}

porta.on('message', (evento) => {
  cadeia = cadeia.then(() => tratar(evento.data));
});

