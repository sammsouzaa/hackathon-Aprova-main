# INSTRUCTIONS: o que o agente segue e o que cada instrução faz

O agente do Prumo é um copiloto (Gemini) com **código clássico em volta**. Cada arquivo numerado desta pasta é uma
instrução **carregada de verdade** pelo backend (`backend/prompts.py` lê estes arquivos; não há cópia no código).
Mudou o arquivo, mudou o comportamento. O comentário `<!-- -->` no topo de cada arquivo é só documentação e não vai
para o modelo.

## Fluxo: quem chama quem

```
ANTES DA REUNIÃO (uma vez por cliente; resultado salvo em disco)
  arquivos do cliente ──03──► extração por arquivo ──04──► contexto.md + glossário + checklist + perguntas rápidas
                                                                   │
                                      chat sobre o contexto ◄──07──┘

DURANTE A REUNIÃO
  áudio (chunks) ──01 (+02 glossário)──► transcrição ──(a cada ~30 s)──05──► checklist marcado, divergências, próxima pergunta
                                                                   └──06──► perguntas do implantador ao copiloto

DEPOIS
  transcrição + checklist + anotações ──08──► ata final
```

## Índice

| Arquivo | Responsabilidade | Chamada por | Saída |
|---|---|---|---|
| [`01-transcricao.md`](01-transcricao.md) | Transcrever cada trecho de áudio, literal, sem inventar o que falta | `Sessao._transcrever` (`backend/sessao.py`) | texto / `[silencio]` |
| [`02-glossario-transcricao.md`](02-glossario-transcricao.md) | Injetar nomes e termos do cliente na 01 para acertar a grafia | `Sessao._glossario` | trecho de prompt |
| [`03-extracao-arquivo.md`](03-extracao-arquivo.md) | Extrair conteúdo, termos e dúvidas de cada arquivo do cliente | `Contexto._extrair` (`backend/contexto.py`) | JSON |
| [`04-consolidacao-contexto.md`](04-consolidacao-contexto.md) | Consolidar tudo em contexto único + checklist (um valor por item; só confirma o que o cliente confirmou) | `Contexto._consolidar` | JSON |
| [`05-analise-ao-vivo.md`](05-analise-ao-vivo.md) | Marcar checklist com a citação que comprova, apontar divergência do contexto, sugerir a próxima pergunta | `Sessao.analisar` | JSON |
| [`06-pergunta-na-reuniao.md`](06-pergunta-na-reuniao.md) | Responder o implantador citando o horário da fala | `Sessao.perguntar` | texto |
| [`07-pergunta-sobre-o-contexto.md`](07-pergunta-sobre-o-contexto.md) | Responder sobre o cliente com etiqueta `[confirmado]`/`[pendente]`/`[nao_consta]` e fonte | `Contexto.perguntar` / `perguntar_stream` | texto |
| [`08-ata-final.md`](08-ata-final.md) | Gerar a ata em Markdown fiel ao que foi dito | `Sessao.finalizar` | Markdown |

## O que é código clássico (não é instrução)

Cobertura do checklist, ordem e status dos itens, cache de respostas, janelas de 30 s, fallback de modelos, SSE e
persistência em disco. A instrução decide o que **dizer**; o código decide quando chamar e o que **gravar**.

## Instruções para o agente de desenvolvimento

[`CLAUDE.md`](CLAUDE.md): regras que o Claude Code segue ao mexer neste repositório.

## Como ver uma instrução em ação

Com o backend no ar (`python rodar.py`), `http://localhost:8000/docs` lista as rotas e o terminal do backend
registra a atividade. Roteiro de demo do app desktop: [`../desktop/roteiro-demo.md`](../desktop/roteiro-demo.md).
