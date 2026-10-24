/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AudioWorkletProcessor para captura contínua e cálculo de nível (RMS).
 * Executa em thread de áudio de tempo real a 16 kHz mono.
 */
class CapturaAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.canal = options?.processorOptions?.canal || 'microfone';
    // Bloco de 1024 amostras = 64 ms a 16 kHz
    this.tamanhoBloco = 1024;
    this.buffer = new Float32Array(this.tamanhoBloco);
    this.pos = 0;
    this.acumuladorQuadrados = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const canal0 = input[0];
    if (!canal0 || canal0.length === 0) return true;

    const canal1 = input.length > 1 ? input[1] : null;
    const len = canal0.length;

    for (let i = 0; i < len; i++) {
      let sample = canal0[i];
      if (canal1) {
        // Downmix estéreo -> mono
        sample = (sample + canal1[i]) * 0.5;
      }

      this.acumuladorQuadrados += sample * sample;
      this.buffer[this.pos++] = sample;

      if (this.pos >= this.tamanhoBloco) {
        const rms = Math.sqrt(this.acumuladorQuadrados / this.tamanhoBloco);
        const pcm = new Float32Array(this.buffer);

        // Transferência direta do ArrayBuffer sem cópia
        this.port.postMessage(
          {
            canal: this.canal,
            amostras: pcm.buffer,
            tempoSegundos: currentTime,
            rms: rms
          },
          [pcm.buffer]
        );

        this.pos = 0;
        this.acumuladorQuadrados = 0;
      }
    }

    return true;
  }
}

registerProcessor('captura-audio-processor', CapturaAudioProcessor);
