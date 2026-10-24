import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '..');
const pastaDestino = path.join(raiz, 'modelos', 'whisper-base-q8');
fs.mkdirSync(path.join(pastaDestino, 'onnx'), { recursive: true });

const cacheOrigem = path.join(raiz, 'node_modules', '@huggingface', 'transformers', '.cache', 'onnx-community', 'whisper-base');

const arquivosEsperados = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer_config.json',
  'tokenizer.json',
  path.join('onnx', 'decoder_model_merged_quantized.onnx'),
  path.join('onnx', 'encoder_model_quantized.onnx')
];

function sha256Arquivo(caminho) {
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(caminho);
  hash.update(buffer);
  return hash.digest('hex');
}

console.log('=== PREPARANDO ARTEFATOS OFFLINE DO WHISPER BASE Q8 ===');

// Se o cache local do transformers já tiver os arquivos, copiar; senão baixar via transformers pipeline
const todosNoCache = fs.existsSync(cacheOrigem) && arquivosEsperados.every(arq => fs.existsSync(path.join(cacheOrigem, arq)));

if (!todosNoCache) {
  console.log('Arquivos não encontrados no cache local. Baixando via transformers.js...');
  const { pipeline } = await import('@huggingface/transformers');
  await pipeline('automatic-speech-recognition', 'onnx-community/whisper-base', {
    dtype: 'q8',
    device: 'cpu'
  });
}

const manifesto = {
  modelo: 'onnx-community/whisper-base',
  quantizacao: 'q8',
  idiomaPadrao: 'pt',
  geradoEm: new Date().toISOString(),
  arquivos: []
};

let tamanhoTotalBytes = 0;

for (const relPath of arquivosEsperados) {
  const origem = path.join(cacheOrigem, relPath);
  const destino = path.join(pastaDestino, relPath);

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);

  const stats = fs.statSync(destino);
  const sha256 = sha256Arquivo(destino);
  tamanhoTotalBytes += stats.size;

  manifesto.arquivos.push({
    caminho: relPath,
    tamanhoBytes: stats.size,
    tamanhoMb: (stats.size / 1024 / 1024).toFixed(2),
    sha256
  });

  console.log(`✓ ${relPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB) - SHA256: ${sha256.slice(0, 12)}...`);
}

manifesto.tamanhoTotalMb = (tamanhoTotalBytes / 1024 / 1024).toFixed(2);
const manifestoPath = path.join(raiz, 'modelos', 'MANIFESTO.json');
fs.writeFileSync(manifestoPath, JSON.stringify(manifesto, null, 2));

console.log(`\nManifesto salvo em: ${manifestoPath}`);
console.log(`Tamanho total: ${manifesto.tamanhoTotalMb} MB em ${manifesto.arquivos.length} arquivos.`);
console.log('Modelo offline pronto para uso em produção e desenvolvimento.');
