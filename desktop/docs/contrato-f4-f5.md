# Contrato compartilhado entre a F4 (motor STT) e a F5 (sessão e JSON)

Definido no commit "[F3.5]". As duas frentes trabalham em paralelo em branches/worktrees separadas e
só se encontram por estas interfaces. Mudou algo aqui? Avise a outra frente antes.

## Interface do motor (`src/services/stt/tipos.ts`)
`MotorSTT { estado, info, carregar(), transcrever(pcm: Float32Array 16 kHz mono, opcoes?), descarregar(), aoMudarEstado(fn) }`.
- `transcrever` devolve `{ texto, confianca|null, duracaoAudioMs, tempoProcessamentoMs }`; `texto` vazio = sem fala útil.
- `criarMotorSTT()` (`src/services/stt/index.ts`) devolve o motor real no Electron e o simulado no navegador.
- `MotorSTTSimulado` serve aos testes da F5; `MotorSTTDesktop` é um esqueleto que a F4 preenche.

## Quem mexe em quê
| Arquivo / bloco | Dono |
|---|---|
| `electron/ipc-stt.mjs`, `electron/stt/**`, `src/services/stt/motor-desktop.ts`, `scripts/teste/stt*.teste.*`, bloco `stt` do `preload.cjs`, `PrumoSttApi` em `desktop.d.ts`, `docs/f4-motor-stt.md` | F4 |
| `electron/ipc-transcricao.mjs`, `electron/transcricoes.mjs`, `src/services/transcricao/**`, `src/types/transcricao.ts`, `scripts/teste/sessao*.teste.ts`, `scripts/teste/transcricoes*.teste.mjs`, `scripts/validar-transcricao.mjs`, `dados/**`, bloco `transcricao` do `preload.cjs`, `PrumoTranscricaoApi` em `desktop.d.ts`, `docs/f5-sessao-json.md` | F5 |
| `src/services/stt/tipos.ts`, `motor-simulado.ts`, `index.ts` | compartilhado: só com acordo |
| `electron/main.mjs`, `package.json`, `docs/ESTADO.md`, `docs/stack.md` | ninguém edita nas branches; quem mescla atualiza |

## Recursos globais da máquina
Rodar `electron:smoke` e `electron:dev` **um de cada vez**: o módulo do PipeWire "Prumo-Reuniao" e a porta 3000 são únicos.
Testes de unidade (`teste:segmentacao`, `teste:stt`, `teste:sessao`) podem rodar em paralelo.
