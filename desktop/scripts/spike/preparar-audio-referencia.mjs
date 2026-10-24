import fs from 'node:fs';
import path from 'node:path';

const origem = '/home/moreira/Documentos/garanzia/resources/midia/p20-motion-tour-60s/audio/mix/stems/narracao.wav';
const destinoDir = path.resolve('.tmp/spike');
fs.mkdirSync(destinoDir, { recursive: true });

const buf = fs.readFileSync(origem);

// Ler cabeçalho RIFF WAV
const numChannels = buf.readUInt16LE(22);
const sampleRate = buf.readUInt32LE(24);
const bitsPerSample = buf.readUInt16LE(34);
const bytesPerSample = bitsPerSample / 8;
const blockAlign = numChannels * bytesPerSample;

// Encontrar chunk "data"
let pos = 12;
while (pos < buf.length - 8) {
  const chunkId = buf.toString('ascii', pos, pos + 4);
  const chunkSize = buf.readUInt32LE(pos + 4);
  if (chunkId === 'data') {
    pos += 8;
    break;
  }
  pos += 8 + chunkSize;
}

const dataStart = pos;
// Queremos 30 segundos de áudio
const duracaoAlvo = 30; // segundos
const samplesPorCanalAlvo = duracaoAlvo * sampleRate;
const bytesAlvo = Math.min(samplesPorCanalAlvo * blockAlign, buf.length - dataStart);

// Extrair e decodificar para Float32 mono 48kHz
const totalSamplesOriginal = Math.floor(bytesAlvo / blockAlign);
const mono48k = new Float32Array(totalSamplesOriginal);

for (let i = 0; i < totalSamplesOriginal; i++) {
  const offset = dataStart + i * blockAlign;
  // Ler canal 0 (24-bit)
  let val = 0;
  if (bitsPerSample === 24) {
    const b0 = buf[offset];
    const b1 = buf[offset + 1];
    const b2 = buf[offset + 2];
    let int24 = (b2 << 16) | (b1 << 8) | b0;
    if (int24 & 0x800000) int24 |= ~0xFFFFFF; // sinal
    val = int24 / 8388608.0;
  } else if (bitsPerSample === 16) {
    val = buf.readInt16LE(offset) / 32768.0;
  }
  mono48k[i] = val;
}

// Reamostrar de 48000 Hz para 16000 Hz (fator 3:1 simples com decimação/média)
const step = sampleRate / 16000;
const totalSamples16k = Math.floor(totalSamplesOriginal / step);
const mono16k = new Float32Array(totalSamples16k);

for (let i = 0; i < totalSamples16k; i++) {
  const origIndex = i * step;
  const idx = Math.floor(origIndex);
  const frac = origIndex - idx;
  const s0 = mono48k[idx];
  const s1 = (idx + 1 < mono48k.length) ? mono48k[idx + 1] : s0;
  mono16k[i] = s0 + frac * (s1 - s0);
}

// Salvar Float32 binário e WAV 16k 16-bit
const wavHeader = Buffer.alloc(44);
const dataSize16k = totalSamples16k * 2;
wavHeader.write('RIFF', 0);
wavHeader.writeUInt32LE(36 + dataSize16k, 4);
wavHeader.write('WAVE', 8);
wavHeader.write('fmt ', 12);
wavHeader.writeUInt32LE(16, 16); // subchunk1size
wavHeader.writeUInt16LE(1, 20); // PCM
wavHeader.writeUInt16LE(1, 22); // Mono
wavHeader.writeUInt32LE(16000, 24); // sampleRate
wavHeader.writeUInt32LE(32000, 28); // byteRate
wavHeader.writeUInt16LE(2, 32); // blockAlign
wavHeader.writeUInt16LE(16, 34); // bitsPerSample
wavHeader.write('data', 36);
wavHeader.writeUInt32LE(dataSize16k, 40);

const pcm16 = Buffer.alloc(dataSize16k);
for (let i = 0; i < totalSamples16k; i++) {
  const s = Math.max(-1, Math.min(1, mono16k[i]));
  const int16 = s < 0 ? s * 32768 : s * 32767;
  pcm16.writeInt16LE(Math.round(int16), i * 2);
}

const wavOut = Buffer.concat([wavHeader, pcm16]);
fs.writeFileSync(path.join(destinoDir, 'referencia-30s.wav'), wavOut);
fs.writeFileSync(path.join(destinoDir, 'referencia-30s.f32'), Buffer.from(mono16k.buffer));

console.log(JSON.stringify({
  amostras16k: totalSamples16k,
  duracaoRealSegundos: totalSamples16k / 16000,
  arquivoWav: path.join(destinoDir, 'referencia-30s.wav'),
  tamanhoWavBytes: wavOut.length
}));
