import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ESQUEMA = 'app';
const HOST_APP = 'prumo';
const ORIGEM_APP = `${ESQUEMA}://${HOST_APP}`;

protocol.registerSchemesAsPrivileged([
  {
    scheme: ESQUEMA,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');

app.whenReady().then(async () => {
  // Protocol handler com headers COOP/COEP e CSP
  protocol.handle(ESQUEMA, (req) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Spike Audio</title>
</head>
<body>
  <h1>Spike Audio</h1>
</body>
</html>`;
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' blob: data:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; media-src 'self' blob:;"
      }
    });
  });

  // Configurar permissões de mídia para app://
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return permission === 'media';
  });

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      webSecurity: true
    }
  });

  await win.loadURL(`${ORIGEM_APP}/index.html`);

  const resultado = await win.webContents.executeJavaScript(`
    (async () => {
      const logs = [];
      const report = {
        isSecureContext: window.isSecureContext,
        crossOriginIsolated: window.crossOriginIsolated,
        dispositivos: [],
        microfones: [],
        monitores: [],
        testesGUM: [],
        resampleAudioContext: null
      };

      try {
        // Primeiro GUM para destravar labels
        try {
          const initStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          initStream.getTracks().forEach(t => t.stop());
        } catch (e) {
          logs.push('Erro no init GUM: ' + e.message);
        }

        // S1: Enumerate devices
        const devs = await navigator.mediaDevices.enumerateDevices();
        report.dispositivos = devs.map(d => ({
          kind: d.kind,
          deviceId: d.deviceId,
          groupId: d.groupId,
          label: d.label
        }));

        const audioInputs = devs.filter(d => d.kind === 'audioinput');
        report.audioInputs = audioInputs.map(d => ({ deviceId: d.deviceId, label: d.label }));

        // Identificar monitores e microfones
        for (const dev of audioInputs) {
          const isMonitor = dev.label.toLowerCase().includes('monitor');
          if (isMonitor) {
            report.monitores.push(dev);
          } else {
            report.microfones.push(dev);
          }
        }

        // S2: Testar getUserMedia por canal
        // 1. Microfone padrão com echoCancellation e noiseSuppression
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          const track = micStream.getAudioTracks()[0];
          const settings = track.getSettings();
          report.testesGUM.push({
            tipo: 'microfone_padrao',
            sucesso: true,
            label: track.label,
            settings: {
              sampleRate: settings.sampleRate,
              channelCount: settings.channelCount,
              echoCancellation: settings.echoCancellation,
              noiseSuppression: settings.noiseSuppression
            }
          });
          track.stop();
        } catch (err) {
          report.testesGUM.push({ tipo: 'microfone_padrao', sucesso: false, erro: err.message });
        }

        // 2. Testar cada monitor encontrado com echoCancellation: false
        for (const mon of report.monitores) {
          try {
            const monStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: { exact: mon.deviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            });
            const track = monStream.getAudioTracks()[0];
            const settings = track.getSettings();
            report.testesGUM.push({
              tipo: 'monitor',
              labelBuscada: mon.label,
              sucesso: true,
              labelObtida: track.label,
              settings: {
                sampleRate: settings.sampleRate,
                channelCount: settings.channelCount,
                echoCancellation: settings.echoCancellation
              }
            });

            // S3: Testar AudioContext reamostragem 16kHz e AudioWorklet
            if (!report.resampleAudioContext) {
              const audioCtx = new AudioContext({ sampleRate: 16000 });
              
              // Criar worklet inline via Blob
              const workletCode = \`
                class CapturaSpikeProcessor extends AudioWorkletProcessor {
                  constructor() {
                    super();
                    this.samplesRecebidos = 0;
                    this.blocos = 0;
                    this.hasNaN = false;
                    this.maxAbs = 0;
                  }
                  process(inputs, outputs, parameters) {
                    const input = inputs[0];
                    if (input && input.length > 0) {
                      const canal0 = input[0];
                      this.blocos++;
                      this.samplesRecebidos += canal0.length;
                      for (let i = 0; i < canal0.length; i++) {
                        const val = canal0[i];
                        if (isNaN(val)) this.hasNaN = true;
                        const abs = Math.abs(val);
                        if (abs > this.maxAbs) this.maxAbs = abs;
                      }
                      if (this.blocos === 20) {
                        this.port.postMessage({
                          samplesRecebidos: this.samplesRecebidos,
                          blocos: this.blocos,
                          hasNaN: this.hasNaN,
                          maxAbs: this.maxAbs,
                          currentFrame: currentFrame
                        });
                      }
                    }
                    return true;
                  }
                }
                registerProcessor('captura-spike-processor', CapturaSpikeProcessor);
              \`;

              const blob = new Blob([workletCode], { type: 'application/javascript' });
              const workletUrl = URL.createObjectURL(blob);
              await audioCtx.audioWorklet.addModule(workletUrl);

              const sourceNode = audioCtx.createMediaStreamSource(monStream);
              const workletNode = new AudioWorkletNode(audioCtx, 'captura-spike-processor');
              
              const workletPromise = new Promise((resolve) => {
                workletNode.port.onmessage = (event) => {
                  resolve(event.data);
                };
                setTimeout(() => resolve({ timeout: true }), 1500);
              });

              sourceNode.connect(workletNode);
              const workletRes = await workletPromise;
              report.resampleAudioContext = {
                audioContextSampleRate: audioCtx.sampleRate,
                monitorSettings: settings,
                workletResult: workletRes
              };

              await audioCtx.close();
            }

            track.stop();
          } catch (err) {
            report.testesGUM.push({
              tipo: 'monitor',
              labelBuscada: mon.label,
              sucesso: false,
              erro: err.message
            });
          }
        }

      } catch (globalErr) {
        report.erroGlobal = globalErr.message;
      }

      return report;
    })();
  `);

  console.log('SPIKE_AUDIO_RESULT:' + JSON.stringify(resultado, null, 2));
  app.quit();
});
