# API do Prumo (backend)

Base: `http://localhost:8000` · JSON em UTF-8 · documentação interativa em `/docs` · CORS liberado.
Para subir tudo (backend + front): `python rodar.py` na raiz do repositório.

O fluxo tem duas fases:

1. **Contexto (antes da reunião).** Os arquivos do cliente (histórico de conversas, PDFs, imagens, planilhas) são
   analisados **uma vez** e viram um `contexto.md` consolidado, um glossário, um checklist e as perguntas rápidas.
   Tudo fica salvo em disco: depois disso, ler o contexto ou perguntar sobre ele **não reprocessa nada**.
2. **Sessão (durante a reunião).** A sessão é ligada a um contexto. O áudio é só transcrito (rota rápida).
   A análise roda em segundo plano a cada ~30s de fala, marca o checklist, sugere perguntas e anota.
   A interface lê o estado por `GET /copiloto` ou recebe tudo ao vivo por `GET /eventos` (SSE).

---

## O contexto já salvo: MeuLab · IFPR Cascavel

O ponto forte da demo é que o cliente **já chega conhecido**. O contexto `meulab-ifpr-cascavel` está processado e
salvo em `backend/contextos/meulab-ifpr-cascavel/`, pronto para uso, sem precisar chamar `/processar` de novo.

| | |
|---|---|
| Cliente | Implantação do MeuLab (agenda de laboratórios, almoxarifado e aprovação de práticas) no IFPR – Campus Cascavel |
| Arquivos | `01_proposta_tecnica_MeuLab.md`, `02_ata_kickoff_IFPR.md`, `03_inventario_almoxarifado_quimica.csv`, `04_email_tecnico_almoxarifado.txt` (os `.md` fazem o papel dos PDFs; pessoas e documentos são fictícios) |
| `contexto.md` | seções *Cliente e pessoas · Situação atual · Regras de negócio · Decisões já tomadas · Problemas e riscos · Pendências* |
| Checklist | 14 itens: **4 confirmados** (CHK-01 laboratórios do piloto, CHK-02 perfis, CHK-03 login por e-mail institucional, CHK-04 só técnicos movimentam estoque) e **10 pendentes** (antecedência, tempo de preparo, aprovação, bloqueios de TCC, reagendamento, estoque mínimo, resíduos, Anatomia, integração, Fase 2) |
| Glossário | nomes (Helena Duarte, Marcos Vieira, Rafael Nogueira, Luana Ferraz…), termos de laboratório e reagentes → vão para o prompt da transcrição |
| Perguntas rápidas | 5 chips (antecedência, preparo, quem aprova, TCC, laboratórios do piloto) |

O contexto é **parcial de propósito**: parte dos fatos só aparece na reunião, para o copiloto mostrar informação nova
e divergências ao vivo (ex.: preparo de prática simples sai 40 min na conversa, contra 30 min de referência → `diverge: true`).

### Como o front pega as coisas

```ts
// tudo de uma vez: arquivos, contexto.md, glossário, checklist, perguntas rápidas
GET  /contextos/meulab-ifpr-cascavel
// conteúdo de um documento (texto original + extração da IA) — usado ao clicar numa citação [[nome]]
GET  /contextos/meulab-ifpr-cascavel/arquivos/01_proposta_tecnica_MeuLab.md
// chat sobre o contexto, resposta chegando aos pedaços
POST /contextos/meulab-ifpr-cascavel/perguntar/stream   {texto, historico}
// reunião: cria a sessão ligada ao contexto (checklist copiado, confirmados já respondidos)
POST /sessoes   {contexto_id: "meulab-ifpr-cascavel", ...}
```

---

## Como cada parte da tela usa a API

| Tela | Rota |
|---|---|
| Painel do cliente (documentos, contexto, checklist) | `GET /contextos/{id}` |
| Abrir um documento / citação `[[arquivo]]` | `GET /contextos/{id}/arquivos/{nome}` |
| Chat sobre o contexto (antes da reunião) | `POST /contextos/{id}/perguntar/stream` |
| Card "Preparação da sessão" + mensagem de abertura | `POST /sessoes` → `preparacao`, ou `GET /sessoes/{id}/preparacao` |
| Modo de escuta (Gravação com aviso / Escuta sem guardar / Modo notas) | `PATCH /sessoes/{id}` `{modo}` |
| Caixa "Participantes informados" + botão **Iniciar reunião** | `POST /sessoes/{id}/iniciar` `{aviso_confirmado: true}` |
| Status no topo (Preparando / Ouvindo / Finalizada) | `copiloto.estado` |
| "Última fala" | `copiloto.ultima_fala` |
| Aba Checklist: barra "4 de 14 · 29%" | `copiloto.progresso` (`respondida`, `total`, `percentual`) |
| Grupo "Confirmados pelo contexto" | itens com `fonte == "contexto"` |
| Grupo "Pendentes de alinhamento" | itens com `status` `pendente` ou `parcial` |
| Código `CHK-05`, título, valor à direita | `codigo`, `titulo`, `resposta` ou `valor_referencia` |
| Expandir item (pergunta, trecho, hora) | `pergunta`, `trecho`, `hora`, `diverge` |
| Marcar item à mão | `PATCH /sessoes/{id}/checklist/{item_id}` |
| Busca no checklist | feita no cliente, sobre `copiloto.checklist` |
| Chips "Rápido: Quem aprova a prática? …" | `copiloto.perguntas_rapidas` |
| Caixa "Pergunte algo rápido" | `POST /sessoes/{id}/perguntar` |
| Mensagens do Prumo na conversa (pergunte agora, anotações) | `copiloto.sugestao_pergunta_imediata`, `perguntas_sugeridas`, `anotacoes` |
| Encerrar e ata | `POST /sessoes/{id}/finalizar`, `GET /sessoes/{id}/ata` |

---

## 0. Saúde

### `GET /`
`{"status": "online", "modelos_transcricao": [...], "modelos_analise": [...], "analisar_a_cada_s": 30}`

---

## 1. Contextos

Na pasta `backend/contextos/<id>/`:

```
meta.json               nome, descrição
arquivos/               originais (pode copiar arquivos direto aqui e chamar /processar)
extracoes/              uma extração por arquivo, feita só quando o arquivo é novo ou mudou
processados.json        hash de cada arquivo já extraído
contexto.md             tudo consolidado (o "txt cheio"); editável à mão
glossario.json          termos com a grafia certa → melhora a transcrição
checklist.json          itens a alinhar
perguntas_rapidas.json  chips de pergunta rápida
```

Formatos aceitos: `.txt .md .csv .json .html .xml .docx .pdf .png .jpg .jpeg .webp .heic .mp3 .wav .m4a .ogg .webm`.
Acima de 18 MB o arquivo vai pela File API do Gemini.

### `GET /contextos`
Lista os contextos.
```json
[{"id": "meulab-ifpr-cascavel", "nome": "MeuLab · IFPR Cascavel",
  "descricao": "...", "criado_em": "2026-10-24T14:51:59", "itens_checklist": 14, "tem_contexto": true}]
```

### `POST /contextos`
```json
{"nome": "MeuLab · IFPR Cascavel", "descricao": "opcional", "id": "opcional"}
```
O `id` padrão é gerado a partir do nome. Retorna o contexto completo, ou `409` se o id já existir.

### `GET /contextos/{id}` — o principal
Contexto completo, lido do disco (sem chamar o Gemini):
```json
{
  "id": "meulab-ifpr-cascavel", "nome": "MeuLab · IFPR Cascavel", "descricao": "...",
  "criado_em": "2026-10-24T14:51:59", "itens_checklist": 14, "tem_contexto": true,
  "arquivos": [{"nome": "01_proposta_tecnica_MeuLab.md", "bytes": 5120,
                "processado_em": "2026-10-24T14:53:02", "erro": null}],
  "contexto": "# Cliente e pessoas
...",
  "glossario": ["MeuLab", "IFPR Cascavel", "..."],
  "checklist": [{"id": "...", "codigo": "CHK-01", "...": "..."}],
  "perguntas_rapidas": ["Qual a antecedência mínima da reserva?", "..."]
}
```
`processado_em` fica `null` quando o arquivo é novo ou mudou desde a última extração.

### `GET /contextos/{id}/arquivos/{nome}`
Um documento do contexto: o texto original (para `.txt .md .csv .json .log .html .xml .docx`; `null` em PDF/imagem/áudio)
e a extração feita pela IA.
```json
{"nome": "02_ata_kickoff_IFPR.md", "bytes": 3400, "texto": "# Ata ...", "extracao": "..."}
```

### `POST /contextos/{id}/arquivos`
`multipart/form-data` com um ou mais campos `arquivos`. Só salva os arquivos; para analisar, chame `/processar`.

### `DELETE /contextos/{id}/arquivos/{nome}`
Remove o arquivo e a extração dele.

### `POST /contextos/{id}/processar?forcar=false`
Extrai **só os arquivos novos ou alterados** e reconsolida tudo. Com `forcar=true`, refaz todos.
Leva de 10s a 2 min, conforme o tamanho.
```json
{"extraidos": ["04_email_tecnico_almoxarifado.txt"], "erros": {}, "consolidado": true, "itens_checklist": 14, ...}
```
Na consolidação, os itens novos do checklist entram sem duplicar os existentes. Os confirmados ficam no topo e a lista é renumerada (`CHK-01…`).

### `GET /contextos/{id}/contexto` (texto) · `PUT /contextos/{id}/contexto` `{texto}`
Lê ou edita o `contexto.md`.

### `PUT /contextos/{id}/glossario` `{termos: [...]}`
Substitui o glossário, removendo duplicados sem diferenciar maiúsculas.

### `PUT /contextos/{id}/perguntas-rapidas` `{perguntas: [...]}`

### `POST /contextos/{id}/perguntar` · `POST /contextos/{id}/perguntar/stream`
Chat sobre o contexto, antes da reunião. Usa o `contexto.md`, as extrações de cada documento e o checklist.
```json
{"texto": "Quem aprova as práticas?",
 "historico": [{"pergunta": "...", "resposta": "..."}]}
```
`historico` é opcional (só as últimas 8 trocas entram no prompt).
- `/perguntar` devolve `{"hora", "pergunta", "resposta"}`.
- `/perguntar/stream` devolve `text/plain` chegando aos pedaços. A resposta começa com a etiqueta
  `[confirmado]`, `[pendente]` ou `[nao_consta]` e cita os documentos como `[[nome do arquivo]]`.

Sem `historico`, a mesma pergunta sobre o mesmo contexto sai de um **cache em memória**, na hora; o cache muda sozinho
quando o contexto, o checklist ou as extrações mudam. `422` para pergunta vazia, `503` se nenhum modelo do Gemini responder.

### `GET /contextos/{id}/checklist` · `PUT` (substitui tudo) · `POST` (adiciona um)
Item do checklist do contexto:
```json
{
  "id": "a1b2c3d4",
  "codigo": "CHK-06",
  "titulo": "Tempo de preparo por tipo de prática",
  "pergunta": "Quanto tempo o técnico precisa para preparar cada tipo de prática?",
  "categoria": "Agenda",
  "obrigatoria": true,
  "origem": "ia",
  "valor_referencia": "30 min simples · 1 h capela",
  "confirmado_no_contexto": false,
  "resposta_contexto": null
}
```
- `valor_referencia`: o valor que o material indica, mas que ainda precisa ser confirmado com o cliente. É o número cinza da tela.
- `confirmado_no_contexto`: o cliente já confirmou o valor numa reunião anterior. A resposta está em `resposta_contexto`.

---

## 2. Sessões

Na pasta `backend/sessoes/<id>/`: `sessao.json`, `segmentos.jsonl` (fonte da verdade), `transcricao.txt`,
`checklist.json`, `anotacoes.jsonl`, `chat.jsonl`, `analise.json/.md` e `ata.md`.

### `POST /sessoes`
```json
{"contexto_id": "meulab-ifpr-cascavel", "titulo": "Alinhamento MeuLab · IFPR Cascavel",
 "horario": "14:00", "modo": "gravacao", "id": "opcional"}
```
Cria a sessão e copia o checklist do contexto. Os itens confirmados chegam como `respondida`, com `fonte: "contexto"`.
Retorna o estado e a `preparacao`:
```json
{
  "titulo": "Alinhamento MeuLab · IFPR Cascavel",
  "horario": "14:00",
  "contexto": {"id": "meulab-ifpr-cascavel", "nome": "..."},
  "total": 14, "confirmados_contexto": 4, "a_perguntar": 10,
  "modo": "gravacao", "modos": ["gravacao", "sem_guardar", "notas"],
  "aviso_confirmado": false, "estado": "preparando",
  "mensagem": "Reunião de hoje, 14:00: Alinhamento MeuLab ... O checklist tem 14 itens: 4 já estão confirmados pelo contexto do cliente e 10 faltam perguntar."
}
```

**Modos**

| `modo` | Na tela | Comportamento |
|---|---|---|
| `gravacao` | Gravação com aviso | transcreve; guarda o áudio de falhas (e todo o áudio se `SALVAR_AUDIO=1`); gera ata |
| `sem_guardar` | Escuta sem guardar | transcreve e analisa; **nunca grava áudio em disco** (o reprocessamento usa só a memória) |
| `notas` | Modo notas | `/audio` responde `409`; funcionam checklist manual, anotações, chat e ata |

**Estados:** `preparando` → `ouvindo` → `finalizada`.

### `GET /sessoes` · `GET /sessoes/{id}`
Lista os ids das sessões · estado resumido da sessão (meta, contagem de segmentos, progresso).

### `GET /sessoes/{id}/preparacao`
O mesmo objeto `preparacao` acima.

### `PATCH /sessoes/{id}`
```json
{"modo": "sem_guardar", "titulo": "...", "horario": "14:00", "aviso_confirmado": true}
```
Todos os campos são opcionais. O `modo` só pode mudar enquanto a sessão estiver em `preparando`; depois disso, retorna `409`.

### `POST /sessoes/{id}/iniciar` `{aviso_confirmado: true}`
Passa a sessão para `ouvindo`. Exceto no modo `notas`, exige `aviso_confirmado: true`; sem isso, retorna `409`.
Um cliente que não chama esta rota, como a extensão do Chrome, inicia a sessão automaticamente no primeiro áudio.

### `POST /sessoes/{id}/audio` — transcrição
`multipart/form-data`:

| campo | obrigatório | |
|---|---|---|
| `audio_chunk` | sim | webm/opus, wav, ogg ou mp3; até 20 MB |
| `seq` | recomendado | número sequencial do trecho (garante a ordem quando as respostas chegam fora de ordem) |
| `inicio_ms` | recomendado | epoch em ms do início do trecho (vira a hora `[HH:MM:SS]`) |
| `duracao_ms` | recomendado | conta para disparar a análise a cada ~30s de fala |

```json
{"seq": 3, "hora": "14:12:07", "status": "ok", "texto": "a prática simples leva uns 40 minutos de preparo, não 30."}
```
`status`: `ok` | `silencio` | `falha`. Em caso de falha, o trecho é reprocessado sozinho em segundo plano.
A resposta **não traz a análise**; ela chega por `/copiloto` ou `/eventos`.

**Dicas para a transcrição sair melhor:**
- Corte os trechos nas pausas da fala, entre 4 e 12s. Cortes no meio de palavras geram erros.
- Grave o microfone junto com o áudio da reunião, para as perguntas do implantador também entrarem.
- Mantenha o glossário do contexto bem preenchido: nomes, siglas e sistemas vão direto para o prompt.

### `GET /sessoes/{id}/copiloto` — estado completo da tela
```json
{
  "sessao": "2026-10-26_14-00-00",
  "estado": "ouvindo",
  "modo": "gravacao",
  "contexto": {"id": "meulab-ifpr-cascavel", "nome": "..."},
  "atualizado_em": "14:12:40",
  "ultima_fala": {"seq": 3, "hora": "14:12:07", "texto": "..."},
  "perguntas_rapidas": ["Qual a antecedência mínima da reserva?", "Quem aprova a prática?", "..."],
  "resumo": "…",
  "sugestao_pergunta_imediata": "Esse tempo de 40 min vale também para práticas na capela?",
  "perguntas_sugeridas": ["…", "…"],
  "checklist": [
    {
      "id": "a1b2c3d4", "codigo": "CHK-06", "titulo": "Tempo de preparo por tipo de prática",
      "pergunta": "…", "categoria": "Agenda", "obrigatoria": true,
      "valor_referencia": "30 min simples · 1 h capela",
      "status": "respondida",
      "resposta": "40 min (prática simples)",
      "fonte": "conversa",
      "diverge": true,
      "trecho": "leva uns 40 minutos de preparo, não 30",
      "hora": "14:12:07",
      "manual": false
    }
  ],
  "progresso": {"pendente": 1, "parcial": 0, "respondida": 11, "ignorada": 0, "total": 14,
                "percentual": 93, "confirmados_contexto": 4, "obrigatorias_pendentes": 0},
  "anotacoes": {
    "ia": ["Diverge do contexto: preparo de prática simples é 40 min (referência dizia 30 min)."],
    "manuais": [{"hora": "14:05:10", "texto": "Marcos pediu treinamento presencial"}]
  },
  "regras_negocio": ["…"], "pendencias": ["…"], "resolvidos": ["…"]
}
```
Campos do item na sessão:
- `status`: `pendente` | `parcial` | `respondida` | `ignorada`.
- `fonte`: quem respondeu (`contexto`, `conversa` ou `manual`); `null` enquanto o item está pendente.
- `diverge`: a resposta dada contradiz o `valor_referencia`. Destaque na tela.
- `manual`: o item foi marcado à mão e a IA não muda mais o status dele.

### `GET /sessoes/{id}/eventos` — ao vivo (Server-Sent Events)
```js
const es = new EventSource(`${API}/sessoes/${id}/eventos`);
es.addEventListener('copiloto', e => render(JSON.parse(e.data)));      // mesmo formato do GET /copiloto
es.addEventListener('transcricao', e => ultimaFala(JSON.parse(e.data))); // {seq, hora, status, texto}
es.addEventListener('finalizado', e => ...);                            // {ata: true}
```
Ao conectar, o primeiro evento já é um `copiloto` completo. O servidor envia um `: ping` a cada 15s para manter a conexão.
`copiloto` também é enviado a cada mudança manual (checklist, anotação, modo ou início).

### `PATCH /sessoes/{id}/checklist/{item_id}`
```json
{"status": "respondida", "resposta": "40 min"}
```
Os dois campos são opcionais. Depois de marcado à mão, a IA não muda mais o item.
Voltar o item para `pendente` devolve o controle para a IA. Retorna `404` para item inexistente e `422` para status inválido.

### `POST /sessoes/{id}/checklist` `{pergunta, titulo?, categoria?, obrigatoria?}`
Adiciona um item só nesta sessão.

### `GET /sessoes/{id}/anotacoes` · `POST /sessoes/{id}/anotacoes` `{texto}`
Lê ou adiciona anotações manuais. Elas também entram na análise e na ata.

### `POST /sessoes/{id}/perguntar` `{texto}`
Chat com o copiloto, que usa o contexto, o checklist, as anotações e a transcrição.
```json
{"hora": "14:13:02", "pergunta": "Qual o tempo de preparo?", "resposta": "Prática simples: 40 min [14:12:07].", "modelo": "gemini-3.5-flash"}
```
Retorna `503` se nenhum modelo do Gemini responder.

### `POST /sessoes/{id}/analisar`
Força uma análise agora, sem esperar os 30s, e retorna o `copiloto`.

### `POST /sessoes/{id}/finalizar`
Espera a análise em andamento, faz a análise final, gera o `ata.md` (com a tabela do checklist) e marca a sessão como `finalizada`.
```json
{"pasta": "...", "ata": true, "falhas_pendentes": 0, "analise": {...}, "copiloto": {...}}
```

### `GET /sessoes/{id}/transcricao` (texto) · `GET /sessoes/{id}/ata` (markdown)

### `POST /sessoes/{id}/reprocessar`
Retranscreve os trechos que ficaram em `falhas/`, por exemplo depois de reiniciar o backend.

### `POST /processar-audio` (legado)
É a rota antiga da extensão do Chrome. Recebe os mesmos campos de `/audio` mais `sessao` e devolve a transcrição junto com a última análise.

---

## Recarregar o exemplo MeuLab do zero

Os originais ficam em `backend/exemplos/meulab/` (mais `_curadoria.json`, com checklist, glossário e perguntas rápidas
aplicados depois do processamento). Só é preciso se o contexto salvo for apagado. Com o backend rodando:
```
python exemplos/carregar_exemplo.py http://localhost:8000
```
O arquivo `exemplos/roteiros/meulab_reuniao2.txt` traz as falas para simular a reunião.

---

## Configuração (`.env`)

| variável | padrão | |
|---|---|---|
| `GEMINI_API_KEY` | — | obrigatória |
| `PORTA` | 8000 | |
| `MODELOS_TRANSCRICAO` / `MODELOS_ANALISE` | gemini-3.5-flash, gemini-3.5-flash-lite, gemini-flash-lite-latest | ordem de fallback |
| `TIMEOUT_TRANSCRICAO_S` / `TIMEOUT_ANALISE_S` / `TIMEOUT_CONTEXTO_S` | 20 / 45 / 180 | |
| `MAX_CHAMADAS_SIMULTANEAS` | 4 | chamadas ao Gemini em paralelo |
| `ANALISAR_A_CADA_S` | 30 | segundos de fala entre análises automáticas |
| `CONTEXTO_ANALISE_CHARS` | 30000 | quanto do `contexto.md` entra no prompt ao vivo e do chat |
| `GLOSSARIO_MAX_TERMOS` | 80 | termos enviados ao prompt da transcrição |
| `CONSOLIDACAO_ORIGINAL_CHARS` | 120000 | até esse total, os textos originais entram na consolidação |
| `JANELA_ANALISE_CHARS` | 15000 | quanto da transcrição entra em cada análise |
| `ESPERAS_REPROCESSAR_S` | 10,30,90 | esperas entre tentativas de retranscrever falhas |
| `MAX_CHARS_ARQUIVO` | 500000 | texto máximo lido de cada arquivo na extração |
| `SALVAR_AUDIO` | 0 | `1` guarda todo o áudio (só no modo `gravacao`) |
