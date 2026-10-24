# F4 — Motor de transcrição (Whisper local)

## O que é
Transcrição offline em pt-BR: Whisper base quantizado (q8) em `@huggingface/transformers` + `onnxruntime-node`, rodando
num **processo de utilidade do Electron** (fora do renderer). Nenhum áudio sai da máquina. A interface da F5/F6 é
`MotorSTT` (`src/services/stt/tipos.ts`); `criarMotorSTT()` devolve `MotorSTTDesktop` no Electron e o simulado fora dele.

```
renderer: MotorSTTDesktop ──IPC prumo:stt:*──▶ main: ipc-stt.mjs ──▶ stt/gerenciador.mjs ──postMessage──▶ utilityProcess
                                                                                        stt/processo-stt.mjs → stt/motor.mjs → Whisper
```

## Arquivos
| Arquivo | Papel |
|---|---|
| `electron/stt/motor.mjs` | Lógica pura: carrega o modelo offline, protege a inferência, serializa chamadas, limpa o texto |
| `electron/stt/processo-stt.mjs` | Entrada do utilityProcess (protocolo de mensagens documentado no topo) |
| `electron/stt/gerenciador.mjs` | Ciclo de vida: carga sob demanda, tempo limite, reinício controlado, descarga por ociosidade |
| `electron/ipc-stt.mjs` | Canais `prumo:stt:{estado,preaquecer,transcrever,descarregar}` e evento `prumo:stt:estado-alterado` |
| `electron/preload.cjs` (bloco `stt`) | API `window.prumoDesktop.stt` (erros viram exceções com mensagem limpa) |
| `src/services/stt/motor-desktop.ts` | `MotorSTTDesktop` (implementa `MotorSTT`) |
| `scripts/teste/stt*.teste.*` | Testes (`npm run teste:stt`, sequenciais) |

## Como a F6 usa
1. Ao escolher a fonte "Ao vivo" (ou abrir o painel no estado "preparando"): `motor.carregar()` e mostrar "Carregando modelo…"
   até `estado === 'pronto'` (`aoMudarEstado`). **Habilitar "Iniciar reunião" só então.**
2. Para cada segmento da F3: `motor.transcrever(segmento.amostras)` (Float32 mono 16 kHz, até 60 s). `texto === ''` = sem fala útil.
3. Depois de 10 min sem uso o processo é encerrado sozinho (devolve ~700 MB): a próxima chamada precisa de `carregar()` de novo
   (o estado muda para `descarregado`; `transcrever` rejeita com "Motor não está pronto").
4. Se o processo cair, o gerenciador reinicia sozinho (até 3 vezes em 5 min): estado `erro` → `carregando` → `pronto`.

## Regras do motor
- Áudio < 300 ms ou RMS < 0,002 → texto vazio, **sem chamar o modelo** (evita alucinação em silêncio).
- Blocos de até 28 s (acima disso divide); teto de tokens proporcional à duração (8/s + 16) para cortar laços.
- Uma inferência por vez (fila interna). Idiomas aceitos: `pt` (padrão), `en`, `es`.
- `limparTexto`: remove marcadores de som (`[Música]`, `(risos)`…), frases que o Whisper inventa a partir de legendas
  ("Legendas pela comunidade Amara.org", "Obrigado por assistir"…) e colapsa repetições em laço. **Não** remove "Obrigado" nem "Tchau"
  quando são fala real.
- Aquecimento: uma inferência descartável ao carregar (a primeira é mais lenta).
- Prioridade do processo reduzida (nice 10) para não competir com a videochamada (`PRUMO_STT_PRIORIDADE=0` desliga).

## Variáveis de ambiente
| Variável | Efeito |
|---|---|
| `PRUMO_STT=preaquecer` | Carrega o modelo já na partida do app (padrão: sob demanda) |
| `PRUMO_STT=desligado` | Desliga o motor (os canais respondem erro claro) |
| `PRUMO_STT_THREADS` | Threads do onnxruntime (padrão: metade dos núcleos, entre 2 e 4) |
| `PRUMO_MODELOS` | Pasta dos modelos (padrão: `modelos/`; empacotado: `resources/modelos`) |
| `PRUMO_STT_OCIOSIDADE_MS` | Descarga por ociosidade (padrão 600000) |

## Medições (24/10/2026, notebook de 12 threads, sem GPU)
| Item | Resultado |
|---|---|
| Carga do modelo (disco quente) | 0,75 a 1,9 s (após reiniciar a máquina a primeira leitura pode levar 20 a 35 s, medido no spike) |
| 30 s de fala | 5,8 s (RTF 0,195) |
| Segmentos curtos (4 threads) | 3 s → 1,4 s · 6 s → 1,6 s · 12 s → 2,7 s · 15 s → 2,6 s |
| 8 threads (comparação) | mais lento que 4 (30 s → 7,4 s): fica 4 |
| Queda do processo → pronto de novo | 1,3 a 2,5 s |
| Ociosidade (teste com 8 s) | processo encerrado, `pid` nulo |
| Memória do processo | ~713 MB RSS (medido no spike com o mesmo modelo) |
Rodando testes em paralelo (cargas simultâneas) o RTF chegou a 0,45 a 0,52: rode `teste:stt` sempre sequencial.

## Limites e pendências
- Qualidade: o base errou nomes próprios do áudio de referência ("Garantia" → "garância"); termos de domínio (ZR2, ART/RRT) não foram avaliados
  com voz real. O texto da F4 não é "verdade": a decisão continua humana.
- **Empacotamento (dívida):** `build.files` tem `!node_modules/**/*`, então o AppImage/deb **ainda não levam** `@huggingface/transformers`
  nem `onnxruntime-node` (549 MB, com CUDA/TensorRT). Falta filtrar para linux/x64 CPU, manter `asarUnpack` e medir. Não testei
  `utilityProcess.fork` com o arquivo dentro do asar. Até lá, use `electron:start` ou `electron:dev`.
- O modelo (77 MB) fica em `modelos/` (fora do git): `npm run modelos`.

## Para quem mescla (não editei estes arquivos, exceto a linha do script)
- `docs/ESTADO.md` §3/§4/§7 e `docs/stack.md` §3/§4/§7: registrar o motor, as medições acima e a dívida de empacotamento.
- `package.json`: a linha `teste:stt` ganhou `--test-concurrency=1`.
