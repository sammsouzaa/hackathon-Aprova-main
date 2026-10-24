# Spike de Viabilidade: Transcrição Local e Áudio Multi-Canal no Electron (F0)

**Data:** 24/10/2026 (atualizado após micro-spikes de arquitetura)  
**Ambiente de Referência:**
- SO: Ubuntu 24.04 LTS (Kernel Linux 6.8), GNOME, Wayland / XWayland
- Hardware: CPU 12 threads (sem GPU dedicada)
- Memória: 7,5 GiB total (2,3 GiB disponíveis na partida)
- Disco: ~11 GB livres (partição raiz 95% cheia)
- Servidor de Áudio: PipeWire 1.0.5 com emulação PulseAudio 15.0
- Runtime: Electron v45.0.0, Node v24.13.0, Chromium 134

---

## 1. Sumário Executivo e Decisões de Arquitetura

- **Decisão:** **GO** para implementação da transcrição local.
- **Modelo de STT Escolhido:** **Whisper Base Quantizado (`onnx-community/whisper-base`, q8)** via `@huggingface/transformers`.
- **Backend de Inferência Aprovado:** **`utilityProcess.fork` do Electron com `onnxruntime-node` (nativo C++)**.
  - **RTF medido no utilityProcess:** **0,186** (transcreve 30 s de fala em 5,59 s).
  - **Memória do utilityProcess:** **712,8 MB RSS** (isolada do processo renderer da interface).
  - **Carga inicial:** **0,81 s** (a partir do cache local).
  - **Segurança e Estabilidade:** Dispensa alterações de COOP/COEP no app, não exige afrouxar a CSP com `'wasm-unsafe-eval'` nem `worker-src` no renderer, e transfere blocos `Float32Array` via `MessagePort` sem cópias de memória.
- **Captura Automatizada do Monitor:** **Opção A (Gerenciamento transparente de Remap via Main)**.
  - O main process cria na inicialização uma fonte virtual `Prumo-Reuniao` vinculada ao monitor do sink padrão (`<sink>.monitor`) usando `pactl load-module module-remap-source`.
  - O Chromium enxerga o dispositivo normalmente em `navigator.mediaDevices.enumerateDevices()`, permitindo um único `AudioContext` com dois `MediaStreamSource` (D3) e medidores de nível sincronizados no front.
  - Limpeza 100% automatizada em `before-quit`, `will-quit` e detecção de encerramento, além de descarregar módulos órfãos de execuções anteriores na partida.
  - Degradação: caso `pactl` falhe ou não haja sink de saída, entra em modo 1 canal (somente microfone).

---

## 2. Resultados das Etapas do Spike

### S1: Enumeração de Dispositivos e Remap Automatizado
- O Chromium no Linux intencionalmente oculta fontes do tipo `.monitor` nativas do PipeWire/PulseAudio no `enumerateDevices()`.
- O módulo `GerenciadorMonitorAudio` (em `electron/audio-monitor.mjs`) gerencia o ciclo de vida do remap:
  - Criação: `pactl load-module module-remap-source master=<sink>.monitor source_name=Prumo-Reuniao source_properties=device.description="Prumo-Reuniao"`
  - Tempo de ativação: ~15 ms.
  - Resultado no `enumerateDevices()` do renderer: dispositivo com label `"Prumo-Reuniao"`, tipo `audioinput`, 2 canais, 48 kHz.
  - Remoção limpa com `pactl unload-module <id>` no encerramento.

### S2: Permissões de Mídia no Electron
- No `electron/main.mjs`, liberação estrita apenas de `'media'` para a origem segura `app://prumo` (e para a URL de dev do Vite):
  - `setPermissionRequestHandler`: libera somente `'media'`.
  - `setPermissionCheckHandler`: retorna `true` apenas para `'media'`.
  - Todas as demais permissões (geolocalização, notificações externas, etc.) permanecem bloqueadas.
- Testes de `getUserMedia`:
  1. Microfone: `{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }` → Sucesso (48 kHz mono).
  2. Monitor: `{ deviceId: { exact: idMonitor }, echoCancellation: false, noiseSuppression: false, autoGainControl: false }` → Sucesso (48 kHz estéreo).

### S3: Captura, Reamostragem e AudioWorklet
- `AudioContext({ sampleRate: 16000 })` com AudioWorklet:
  - Reamostra 48 kHz estéreo do monitor para 16 kHz mono sem perda de sincronia.
  - Amostras processadas no teste: 2.560 amostras em 20 blocos.
  - Ausência de NaN / corrupção: `hasNaN === false`.

### S4: Comparativo de Modelos e Micro-Spike de Backend
- **Áudio de Referência:** Trecho de 30,00 s de narração real em português brasileiro (16 kHz mono, 480.000 amostras).
- **Medições de Inferência:**

| Configuração | Modelo / Backend | Carga | Tempo (30 s) | RTF | RSS | Qualidade pt-BR |
|---|---|---|---|---|---|---|
| **Node nativo** | Whisper Tiny (q8) | 20,12 s | 3,81 s | **0,127** | 535 MB | Erros fonéticos ("planílias", "uma tris") |
| **Node nativo** | Whisper Base (q8) | 35,64 s | 4,85 s | **0,162** | 728 MB | Excelente ("emails e planilhas", "matriz") |
| **utilityProcess.fork** | **Whisper Base (q8)** | **0,81 s** (cache) | **5,59 s** | **0,186** | **712,8 MB** | **Excelente (idêntica ao nativo)** |

- **Nota de Retificação:** O RTF inicial de 0,162 foi obtido com `onnxruntime-node` (execução nativa C++ via binding do Node.js), e **não** via WASM do navegador. O micro-spike confirmou que rodar em `utilityProcess.fork` com `onnxruntime-node` preserva o mesmo RTF excelente (0,186 ≤ 0,600) e isola o uso de memória (712 MB) fora da UI do renderer.

### S5: Isolamento e Política de Segurança (CSP)
- Como o backend roda em `utilityProcess`, o renderer **não** precisa de `'wasm-unsafe-eval'`, nem de `worker-src blob:`, nem de cabeçalhos agressivos de COOP/COEP que poderiam quebrar o carregamento de fontes e assets locais.
- A CSP do app permanece estrita:
  ```text
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:;
  ```
- O AudioWorklet carrega de `'self'` ou URL local registrada.

---

## 3. Estratégia de Empacotamento para Produção
- `asarUnpack`: incluir os binários nativos do `onnxruntime-node` (`*.node`) para que o `utilityProcess` possa carregá-los sem falhas de extração ASAR.
- `extraResources`: modelos offline em `modelos/` preservados fora do ASAR para acesso direto por caminho do sistema de arquivos.
