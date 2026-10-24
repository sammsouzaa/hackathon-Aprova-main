# Plano de integração Prumo × API (para a apresentação)

> Proposta `[HIP]` de 24/10/2026 ~13:30, a validar com quem faz a API. Meta: na demo, (1) a IA usa de verdade os documentos `.md` como contexto, (2) o Prumo capta o áudio da reunião e o envia à API, (3) a API transcreve, analisa com IA e devolve ao Prumo. Sem desenhar banco de dados. Nada aqui foi implementado ainda.

## 1. Arquitetura mínima

```text
┌─ Prumo (Electron) ──────────────────────────────┐        ┌─ API Python (FastAPI) ───────────────────┐
│ renderer (React)                                │        │ POST /v1/sessoes/{id}/audio              │
│  ├ captura: microfone  → canal "implantadora"   │  HTTP  │   1. transcreve (STT)                    │
│  ├ captura: monitor    → canal "prefeitura"     │ ─────▶ │   2. carrega contexto .md do processo    │
│  └ mostra: falas, itens, alertas, compromissos  │        │   3. LLM → JSON (itens, alertas, prazos) │
│ main (Node): cliente da API (token, timeout,    │ ◀───── │   4. valida em código (evidência, docId) │
│  fallback "análise gravada")                    │  JSON  │ sessões em memória + log JSONL em disco  │
└─────────────────────────────────────────────────┘        └──────────────┬───────────────────────────┘
                                                                          │ lê
                                                       contexto/ (arquivos .md versionados no repositório)
```

- **O "backend" do Prumo é uma camada fina no processo principal do Electron** (`electron/api.mjs`): guarda URL e token, chama a API, trata erro e queda. O renderer só fala com ele por IPC. Não existe servidor Node separado nem banco do lado do Prumo.
- **Estado:** a API mantém a sessão em memória e grava cada evento em `dados/sessoes/<id>.jsonl` (uma linha JSON por evento). Isso basta para `GET /sessoes/{id}`, para a web do parceiro refletir compromissos e resumo, e para gerar a "análise gravada" de queda a partir de uma execução real. Sem tabelas, sem migração.
- **Onde roda a API na apresentação:** no próprio notebook (`127.0.0.1:8000`), para não depender de Wi-Fi entre máquinas. A única dependência de rede é a do provedor do LLM (e do STT, se for em nuvem) `[A]`.

## 2. Contrato (mesmo formato que o front já consome)

O Prumo hoje usa `EfeitoFalaGravada` (`src/data/respostasGravadas.ts`). A API devolve exatamente essa forma, só que em listas e com a transcrição. Cabeçalho em toda chamada: `X-Prumo-Token: <segredo>`. Datas e prazos em ISO 8601 mais um rótulo legível.

| Endpoint | Entrada | Saída |
|---|---|---|
| `GET /v1/saude` | — | `{ ok, llm: "nome/modelo", stt: "nome/modelo", documentos: 5, processo: "alvara-residencial" }` |
| `POST /v1/sessoes` | `{ reuniaoId, processoId, modoEscuta, hojeSimulado? }` | `{ sessaoId, checklist: ItemChecklist[], documentos: [{id,titulo,artigo}] }` |
| `POST /v1/sessoes/{id}/audio` | multipart: `canal` (`implantadora` ou `prefeitura`), `seq`, `t0Ms`, `arquivo` (WAV 16 kHz mono PCM16, 5 a 8 s) | `ResultadoTrecho` (abaixo) |
| `POST /v1/sessoes/{id}/texto` | `{ canal, texto }` (modo notas, teste e queda) | `ResultadoTrecho` |
| `POST /v1/sessoes/{id}/pergunta` | `{ texto }` | `{ encontrado, resposta, citacoes: [{docId, artigo, trecho}] }` |
| `POST /v1/sessoes/{id}/encerrar` | `{ decisoes? }` | `{ resumo: ResumoFinal }` |
| `GET /v1/sessoes/{id}` | — | estado completo (checklist, compromissos, alertas, falas) para a web refletir |
| `POST /v1/contexto/recarregar` | — | `{ documentos: n }` (relê os `.md` sem reiniciar) |

```ts
// ResultadoTrecho
{
  falas: [{ id: number, canal: 'implantadora' | 'prefeitura', texto: string, tMs: number }],
  efeitos: {
    itensMarcados:  [{ itemId, itemTitulo, valor, evidencia, regraLocal?: boolean }],
    alertas:        [{ itemId, itemTitulo, falaCliente, docId, docTitulo, docArtigo, docTexto, valorCliente, valorModelo }],
    compromissos:   [{ compromissoId, titulo, responsavel, prazoIso, prazoRotulo }],
    mensagemTexto?: string,
    sugerirEncerrar?: boolean
  },
  fonte: 'ia_ao_vivo',         // nunca 'gravada': a queda é do lado do Prumo
  modelo: string,              // ex.: o nome do LLM e do STT usados
  latenciaMs: number
}
```

Regras que a API aplica **em código**, depois do LLM (mesma ideia de `stack.md` §7):
1. `evidencia` precisa ser substring literal de uma fala da sessão (`fala.texto`); senão o item é descartado.
2. `docId` precisa existir nos `.md` carregados e `docTexto` vem **do arquivo**, não do modelo.
3. `prazoIso` é calculado por código a partir de "até quinta" e da data de referência da sessão.
4. Nada é gravado como "respondido" se o item não está no checklist da sessão.

## 3. Contexto em `.md` (é o que prova que a IA usa os documentos)

Estrutura, versionada junto do repositório (um repositório só, ver §6):

```text
contexto/processos/alvara-residencial/
  checklist.md              # itens CHK-01..10 (id, titulo, valorModelo, docReferencia)
  documentos/DOC-01.md ... DOC-05.md
  regras-locais.md          # opcional: regras já acordadas com outra prefeitura (delta)
INSTRUCTIONS/
  01-analisar-trecho.md  02-verificar-contradicao.md  03-extrair-compromissos.md  04-gerar-resumo.md
```

Cada documento, com cabeçalho YAML simples:

```markdown
---
id: DOC-02
titulo: Plano Diretor (modelo, fictício)
artigo: Art. 14, §2º
---
O recuo frontal mínimo na ZR2 é de 4,50 m.
```

- A API monta o prompt do sistema com as instruções de `INSTRUCTIONS/*.md` + o checklist + **todos** os documentos do processo (poucos KB: não precisa de RAG nem banco vetorial).
- **Momento de prova no pitch:** editar `DOC-02.md` para "5,00 m", chamar `POST /v1/contexto/recarregar` e repetir a fala "3 metros": o alerta passa a citar 5,00 m. É a demonstração direta de que a IA lê os `.md`.
- As instruções em `INSTRUCTIONS/` são as mesmas que o portal exige para os jurados; a API as carrega em vez de ter prompts escondidos no código.

## 4. Captura de áudio no Prumo

- **Dois canais, sem diarização:** microfone = implantadora; "monitor" do áudio de saída = prefeitura (o que sai nos alto-falantes quando o Meet/Teams toca a voz do cliente). Neste notebook há PipeWire com fontes `alsa_output…monitor` e `bluez_output…monitor` (`pactl list short sources`); o Chromium costuma listá-las como entradas de áudio `[NV]`: **testar primeiro** com `navigator.mediaDevices.enumerateDevices()` dentro do Electron.
- **Formato:** `AudioContext` a 16 kHz, mono, PCM de 16 bits em WAV; janelas de 6 s por canal, enviadas só se houver voz (limiar de energia). Evita depender de `ffmpeg` (não instalado aqui) e de decodificar WebM/Opus na API.
- **Permissões:** hoje o `electron/main.mjs` nega todas; liberar apenas `media` para a origem `app://prumo` e ajustar o `connect-src` da CSP para o endereço da API.
- **Rótulos honestos:** "Ao vivo" só aparece com a captura realmente rodando; o aviso de gravação já existe.
- **Fones de ouvido** na demo, para o microfone não captar o alto-falante (eco duplica a fala da prefeitura).

Escada de queda, sempre rotulada na tela:
1. Dois canais ao vivo (mic + monitor).
2. Só o microfone, com duas pessoas conversando ao lado.
3. Arquivo de áudio pré-gravado tocado como "prefeitura" (rótulo "Áudio gravado").
4. Texto pelo `POST /texto` ou o roteiro atual (rótulo "Roteiro").
5. API fora do ar: "Análise gravada", como hoje.

## 5. O que muda no front do Prumo

| Peça | Hoje | Passa a ser |
|---|---|---|
| `src/services/analisador.ts` | lê `respostasGravadas.ts` | chama a API por IPC; se falhar, cai para a gravada com o rótulo "Análise gravada" |
| `ReuniaoContext` | roteiro de 16 falas | fonte "Ao vivo" chama a captura; `falaMaisRecente` vem da transcrição; efeitos vêm em listas |
| Rótulos | "Análise gravada" fixo | "Análise de IA · ao vivo" quando `fonte === 'ia_ao_vivo'`; "ao vivo" nunca na queda |
| Novo `electron/api.mjs` | — | cliente HTTP com token, timeout de 15 s e uma tentativa extra |
| Novo `src/services/capturaDeAudio.ts` | — | mic + monitor → WAV por canal → IPC |
| Menu ⋯ | fonte da fala | escolher microfone e "áudio da reunião"; mostrar saúde da API |

Esses itens conflitam com o trabalho em curso na outra frente (`ReuniaoContext`, F1): combinar a ordem de mesclagem antes de editar.

## 6. Repositório e entrega

O portal pede **um** link de repositório com a pasta `INSTRUCTIONS`, README e demo. Recomendado um repositório só:

```text
prumo/
  desktop/        # este projeto (Electron + React)
  api/            # Python (FastAPI)
  web/            # web do parceiro (login, chat, upload)
  contexto/       # .md dos processos
  INSTRUCTIONS/   # instruções dos agentes (a API as lê daqui)
  README.md       # problema, como rodar cada parte, real × simulado
```

## 7. Plano por tempo (hoje 24/10; agora ~13:30; entrega 16:30)

| Hora | Quem | Entrega | Porta (go/no-go) |
|---|---|---|---|
| 13:30–13:45 | os dois | fechar decisões da §8 e o repositório único | — |
| 13:45–14:15 | API | esqueleto: `/saude`, `/sessoes`, `/texto` devolvendo o JSON do contrato com resposta fixa; carrega `contexto/` | **G1:** o Prumo recebe o formato |
| 13:45–14:15 | Prumo | `electron/api.mjs`, IPC, mudança de `analisador.ts` com queda; teste de dispositivos de áudio | **G1** |
| 14:15–14:45 | API | LLM real em `/texto` com `INSTRUCTIONS` + `.md` + validações em código | **G2:** texto → itens/alerta/compromisso reais |
| 14:15–14:45 | Prumo | captura de áudio (mic e monitor) gerando WAV; envio a `/audio` (ainda devolvendo erro 501) | — |
| 14:45–15:15 | API | STT em `/audio` (local ou nuvem) ligado ao mesmo pipeline | **G3:** áudio → texto → efeitos |
| 14:45–15:15 | Prumo | "Ao vivo" ponta a ponta, rótulos e queda; seletor de dispositivos | **G3** |
| 15:15–15:45 | os dois | ensaio de ponta a ponta 3x; gravar a execução real como queda; editar `DOC-02.md` ao vivo | **congelamento 15:45** |
| 15:45–16:30 | os dois | README, `INSTRUCTIONS`, vídeo de backup, entrega | entrega 16:30 |

**Cortes (de cima para baixo):** nuvem para STT → só texto/notas; monitor (canal da prefeitura) → só microfone; alertas e compromissos reais → só itens marcados reais; `GET /sessoes` para a web → dados pré-semeados. **Nunca cortar:** a análise de IA sobre os `.md` com validação em código e o rótulo honesto de "ao vivo".

## 8. Decisões e perguntas para quem faz a API

1. **LLM:** qual provedor e modelo, e há chave e internet no local? `[A]`
2. **STT:** local (`faster-whisper`; sem chave, mas o modelo pequeno ocupa ~1 GB de RAM e este notebook tem ~2 GB livres) ou em nuvem (precisa de chave e rede)? Com CPU e sem GPU, `base` é mais seguro que `small` `[NV]`.
3. **Onde a API roda** na apresentação: neste notebook ou em outra máquina?
4. **Repositório único** com as pastas da §6?
5. **Quem escreve** `contexto/` e `INSTRUCTIONS/`? Sugestão: o dono da API, com o roteiro de 16 falas como caso de teste.
6. **Contrato:** aceita o formato da §2, ou o parceiro já definiu outro? Se for outro, o Prumo adapta na camada `electron/api.mjs`.
7. **Segurança:** token por cabeçalho e API ligada em `127.0.0.1`; sem dado real nem chave no repositório (`.env` fora do Git).

## 9. Riscos e limites

- Latência estimada de 8 a 15 s por trecho (janela de 6 s + STT + LLM) `[HIP]`; a interface já tem o estado "Analisando a fala…".
- Eco, ruído e português em reunião real: a transcrição pode errar; por isso a evidência vira item marcado só se bater literalmente na transcrição, e a decisão continua sendo da usuária.
- Sem banco, sessão e histórico acabam se o processo da API reiniciar, exceto o `.jsonl`.
- Áudio de reunião com servidores públicos exige aviso e base legal; o Prumo mostra o aviso, mas nenhuma afirmação de conformidade com a LGPD é feita. Na demo, só fala fictícia.
- O LLM externo recebe o texto e os `.md`: nada que não seja fictício.
