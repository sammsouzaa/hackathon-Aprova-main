/**
 * Motor de transcrição (Whisper) — lógica pura de Node, sem Electron.
 * Roda dentro do processo de utilidade (processo-stt.mjs) e nos testes.
 *
 * Responsabilidades: carregar o modelo offline, proteger a inferência (silêncio, áudio curto ou
 * longo demais, limite de tokens), serializar as chamadas e limpar o texto (alucinações do Whisper).
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export const TAXA_AMOSTRAGEM_HZ = 16000;

export const LIMITES = Object.freeze({
  /** Áudio menor que isto não é fala útil. */
  minimoMs: 300,
  /** RMS abaixo disto é silêncio: nem chama o modelo (evita alucinação). */
  silencioRms: 0.002,
  /** O Whisper trabalha em janelas de 30 s; blocos maiores são divididos. */
  blocoMaximoMs: 28000,
  /** Teto de tokens gerados, proporcional à duração, para cortar laços de repetição. */
  tokensPorSegundo: 8,
  tokensExtra: 16,
  tokensMaximo: 440
});

const NOME_DO_IDIOMA = Object.freeze({ pt: 'portuguese', en: 'english', es: 'spanish' });

export function calcularRms(pcm) {
  if (pcm.length === 0) return 0;
  let soma = 0;
  for (let i = 0; i < pcm.length; i++) soma += pcm[i] * pcm[i];
  return Math.sqrt(soma / pcm.length);
}

export function dividirEmBlocos(pcm, maximoMs = LIMITES.blocoMaximoMs) {
  const maximo = Math.round((maximoMs * TAXA_AMOSTRAGEM_HZ) / 1000);
  if (pcm.length <= maximo) return [pcm];
  const quantidade = Math.ceil(pcm.length / maximo);
  const tamanho = Math.ceil(pcm.length / quantidade);
  const blocos = [];
  for (let inicio = 0; inicio < pcm.length; inicio += tamanho) blocos.push(pcm.subarray(inicio, inicio + tamanho));
  return blocos;
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// O Whisper "inventa" estas frases (vindas de legendas de vídeos) quando ouve ruído ou silêncio.
// Só entram aqui frases que não fazem sentido numa reunião de trabalho.
const FRASES_ALUCINADAS = [
  'legendas pela comunidade amara org',
  'legendas pela comunidade',
  'legendado por',
  'legenda por',
  'transcricao e legendas por',
  'inscreva se no canal',
  'inscreva se',
  'deixe seu like',
  'curta e compartilhe',
  'obrigado por assistir',
  'obrigada por assistir',
  'ate o proximo video',
  'nos vemos no proximo video',
  'tchau tchau',
  'musica'
];

const MARCADORES_DE_SOM = /[\[(]\s*(musica|música|aplausos|risos|ruido|ruído|silencio|silêncio|inaudivel|inaudível|som)[^\])]*[\])]/gi;

/** Colapsa repetições em laço ("e aí e aí e aí e aí" → "e aí") que o Whisper gera ao se perder. */
export function colapsarRepeticoes(texto) {
  const palavras = texto.split(/\s+/).filter(Boolean);
  for (let n = 1; n <= 4; n++) {
    for (let i = 0; i + n * 4 <= palavras.length; i++) {
      const bloco = palavras.slice(i, i + n).map(normalizar).join(' ');
      let repeticoes = 1;
      while (
        i + (repeticoes + 1) * n <= palavras.length &&
        palavras
          .slice(i + repeticoes * n, i + (repeticoes + 1) * n)
          .map(normalizar)
          .join(' ') === bloco
      ) {
        repeticoes++;
      }
      if (repeticoes >= 4) {
        palavras.splice(i + n, (repeticoes - 1) * n);
        return colapsarRepeticoes(palavras.join(' '));
      }
    }
  }
  return palavras.join(' ');
}

export function limparTexto(entrada) {
  if (typeof entrada !== 'string') return '';
  let texto = entrada.replace(MARCADORES_DE_SOM, ' ').replace(/\s+/g, ' ').trim();
  if (!/[\p{L}\p{N}]/u.test(texto)) return '';

  texto = colapsarRepeticoes(texto);

  const normal = normalizar(texto);
  for (const frase of FRASES_ALUCINADAS) {
    // Frase inteira: é alucinação. Frase colada no fim de um texto real: corta só o rabicho.
    if (normal === frase) return '';
  }
  for (const frase of FRASES_ALUCINADAS) {
    if (frase.split(' ').length >= 3 && normal.endsWith(` ${frase}`)) {
      const palavrasDaFrase = frase.split(' ').length;
      const palavras = texto.split(/\s+/);
      texto = palavras.slice(0, Math.max(0, palavras.length - palavrasDaFrase)).join(' ').trim();
      break;
    }
  }
  return /[\p{L}\p{N}]/u.test(texto) ? texto : '';
}

function versaoDoPacote(nome) {
  try {
    const exigir = createRequire(import.meta.url);
    let pasta = path.dirname(exigir.resolve(nome));
    for (let i = 0; i < 6; i++) {
      const arquivo = path.join(pasta, 'package.json');
      if (fs.existsSync(arquivo)) {
        const pacote = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
        if (pacote.name === nome) return pacote.version;
      }
      pasta = path.dirname(pasta);
    }
  } catch {
    // sem versão: segue
  }
  return 'desconhecida';
}

/** A primeira inferência aloca memória e compila kernels; pagá-la aqui evita atrasar a primeira fala. */
async function aquecerModelo(pipe) {
  const ruido = new Float32Array(TAXA_AMOSTRAGEM_HZ);
  for (let i = 0; i < ruido.length; i++) ruido[i] = Math.sin(i / 11) * 0.02;
  try {
    await pipe(ruido, { language: 'portuguese', task: 'transcribe', return_timestamps: false, max_new_tokens: 4 });
  } catch {
    // o aquecimento é opcional: se falhar, a primeira fala real mostra o erro de verdade
  }
}

export async function criarPipelineWhisper({ caminhoModelos, nomeModelo, dtype, threads }) {
  const { pipeline, env } = await import('@huggingface/transformers');
  // 100% offline: nada de baixar modelo em tempo de execução.
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = caminhoModelos;
  return pipeline('automatic-speech-recognition', nomeModelo, {
    dtype,
    device: 'cpu',
    session_options: { intraOpNumThreads: threads, interOpNumThreads: 1 }
  });
}

/**
 * @param {object} opcoes
 * @param {string} opcoes.caminhoModelos pasta que contém `<nomeModelo>/`
 * @param {string} [opcoes.nomeModelo]
 * @param {string} [opcoes.dtype]
 * @param {number} [opcoes.threads]
 * @param {Function} [opcoes.criarPipeline] injeção para testes
 * @param {() => number} [opcoes.relogio] ms, padrão performance.now
 * @param {boolean} [opcoes.aquecer] roda uma inferência descartável ao carregar (a primeira é bem mais lenta)
 */
export function criarMotor({
  caminhoModelos,
  nomeModelo = 'whisper-base-q8',
  dtype = 'q8',
  threads = 4,
  criarPipeline = criarPipelineWhisper,
  relogio = () => performance.now(),
  aquecer = false
}) {
  let estado = 'descarregado';
  let pipe = null;
  let carga = null;
  let fila = Promise.resolve();

  const info = {
    nome: nomeModelo,
    biblioteca: `@huggingface/transformers@${versaoDoPacote('@huggingface/transformers')} + onnxruntime-node@${versaoDoPacote('onnxruntime-node')}`,
    idioma: 'pt',
    threads
  };

  async function carregar() {
    if (estado === 'pronto') return;
    if (carga) return carga;
    estado = 'carregando';
    carga = (async () => {
      try {
        pipe = await criarPipeline({ caminhoModelos, nomeModelo, dtype, threads });
        if (aquecer) await aquecerModelo(pipe);
        estado = 'pronto';
      } catch (erro) {
        estado = 'erro';
        pipe = null;
        throw erro;
      } finally {
        carga = null;
      }
    })();
    return carga;
  }

  async function inferir(pcm, opcoes) {
    const idioma = NOME_DO_IDIOMA[opcoes?.idioma ?? 'pt'];
    if (!idioma) throw new Error(`Idioma não suportado: ${opcoes?.idioma}`);

    const duracaoAudioMs = Math.round((pcm.length * 1000) / TAXA_AMOSTRAGEM_HZ);
    const resultadoVazio = { texto: '', confianca: null, duracaoAudioMs, tempoProcessamentoMs: 0 };
    if (duracaoAudioMs < LIMITES.minimoMs) return resultadoVazio;
    if (calcularRms(pcm) < LIMITES.silencioRms) return resultadoVazio;

    const inicio = relogio();
    const partes = [];
    for (const bloco of dividirEmBlocos(pcm)) {
      const segundos = bloco.length / TAXA_AMOSTRAGEM_HZ;
      const saida = await pipe(bloco, {
        language: idioma,
        task: 'transcribe',
        return_timestamps: false,
        max_new_tokens: Math.min(
          LIMITES.tokensMaximo,
          Math.ceil(segundos * LIMITES.tokensPorSegundo) + LIMITES.tokensExtra
        )
      });
      const texto = Array.isArray(saida) ? saida.map((s) => s.text).join(' ') : saida?.text;
      partes.push(texto ?? '');
    }
    return {
      texto: limparTexto(partes.join(' ')),
      confianca: null,
      duracaoAudioMs,
      tempoProcessamentoMs: Math.round(relogio() - inicio)
    };
  }

  function transcrever(pcm, opcoes) {
    if (estado !== 'pronto' || !pipe) return Promise.reject(new Error('Motor não está pronto'));
    if (!(pcm instanceof Float32Array)) return Promise.reject(new Error('PCM deve ser Float32Array (16 kHz mono)'));
    // Uma inferência por vez: o pipeline não é reentrante.
    const execucao = fila.then(() => inferir(pcm, opcoes));
    fila = execucao.catch(() => {});
    return execucao;
  }

  async function descarregar() {
    await fila;
    pipe = null;
    carga = null;
    estado = 'descarregado';
  }

  return {
    info,
    get estado() {
      return estado;
    },
    carregar,
    transcrever,
    descarregar
  };
}
