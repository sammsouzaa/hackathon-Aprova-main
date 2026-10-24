# `projetos/meu-prototipo/` — espaço de trabalho do protótipo demonstrável do hackathon

## 1. Objetivo

Reservar e organizar o espaço onde a equipe vai **entender o desafio, escolher a solução, gerar a base no Google AI Studio, auditá-la e evoluí-la no Claude Code e apresentar um protótipo demonstrável** (alta fidelidade, dados fictícios, jornada central e diferencial reais quando couber, o resto simulado e rotulado). Não é um MVP. Consome a base (`../../D01…D09`) e o kit (`../../D09_kit_desenvolvimento/`); não os altera.

## 2. Estado atual

| Item | Estado |
|---|---|
| Desafio | **não conhecido** (revelado em 24/10/2026) |
| Proposta, experiência, design, dados, stack, base do AI Studio, plano, validação, roteiro | **esqueletos** com marcadores (`CLAUDE.md` §1) |
| Código (`prototipo/`) | **nenhum**; chega exportado do AI Studio (fase 3), só depois de responder a regra de código prévio (`desafio.md` §1) |
| Estado registrado | [`ESTADO.md`](ESTADO.md) |

## 3. Estrutura

```
meu-prototipo/
  CLAUDE.md  README.md  ESTADO.md
  desafio.md  proposta.md  experiencia.md  design.md
  dados-mock.md  stack.md  base-ai-studio.md  plano-implementacao.md  validacao.md
  demo/roteiro-demo.md      (roteiro, pitch, perguntas, instruções aos avaliadores)
  prototipo/                (projeto exportado do AI Studio; ainda não existe)
```

## 4. Início rápido do dia (T0 = hora em que o desafio é revelado; veja `../../D09_kit_desenvolvimento/FLUXO_DE_TRABALHO.md`)

| # | Quando (min desde T0) | Faça | Preenche | Prompt |
|---|---|---|---|---|
| 0 | antes de T0 | Abrir o Claude Code **na raiz** `hackathon_aprova/`; confirmar que leu o `CLAUDE.md`; checar Node, npm, git e o acesso ao AI Studio (`stack.md` §4) | — | — |
| 1 | 0–30 | Anotar o desafio **literalmente**, dar os **PDFs oficiais** ao agente, perguntar as regras (critérios, tempo de pitch, código prévio, IA); receber a análise e as alternativas | `desafio.md` | **A** `01-analisar-desafio-e-escolher-solucao` (etapa 1) |
| 2 | 30–60 | **A equipe escolhe**; o agente fecha proposta, jornada, real/simulado/adiado, dados, direção visual, plano e o prompt do AI Studio. **MARCO-1: direção aprovada** | `proposta`, `experiencia`, `design`, `dados-mock`, `stack`, `plano-implementacao`, `base-ai-studio` §1 | **A** (etapa 2) |
| 3 | 60–90 | Colar o prompt no AI Studio (uma pessoa), no máximo 2–3 iterações, exportar e fazer o commit inicial | `base-ai-studio` §2–§3 | **B** `02-gerar-prototipo-ai-studio` (colado no AI Studio) |
| 4 | 90–120 | Auditar antes de editar: stack real, comandos, mapa real × simulado × ausente, ordem de evolução. **MARCO-2** (tag `base`) | `base-ai-studio` §4–§7, `stack.md` | **C** `03-auditar-codigo-exportado` |
| 5 | 120–240 | Fatias verticais: jornada central, lógica, **diferencial (IA real se relevante)**, dados, simulações, reset. **MARCO-3: congelamento** (tag `fluxo`) | código; `experiencia.md` §5, §7; `stack.md` §7 | **D** `04-implementar-e-corrigir` |
| 6 | 240–265 | Acabamento visual e de dados (25 min) | `design.md` §8 | **D** (modo refinar) |
| 7 | 265–285 | Validar o cenário 3×, confirmar a IA e a queda, máquina limpa, disponibilização (≤ 15 min). **MARCO-4** (tag `demo-ready`) | `validacao.md`; `demo/roteiro-demo.md` §8 | **E** `05-validar-e-preparar-demo` (modo validar) |
| 8 | 285–330 | Pitch, slides, perguntas, 2 ensaios, vídeo de backup. **MARCO-5** (rascunho desde ~150) | `demo/roteiro-demo.md` | **E** (modo pitch) |
| — | 330–360 | **Reserva.** Sem código novo | `ESTADO.md` | — |

### Primeira mensagem para o agente

> Leia `projetos/meu-prototipo/README.md`, `projetos/meu-prototipo/CLAUDE.md` e `projetos/meu-prototipo/ESTADO.md`. Depois execute `D09_kit_desenvolvimento/prompts/01-analisar-desafio-e-escolher-solucao.md` (etapa 1) com `{{PASTA_DO_PROJETO}}` = `projetos/meu-prototipo`. Documentos oficiais: «caminhos». Desafio, literal: «…».

Quando o código chegar do AI Studio: «Execute `prompts/03-auditar-codigo-exportado.md`». Depois, para cada pedido da equipe: `prompts/04-implementar-e-corrigir.md`. Em qualquer retomada: `ESTADO.md` primeiro.

## 5. Regras que não mudam

- **Botão vivo**: nada visível fica morto. **Espinha dorsal primeiro.** **Real, simulado ou pendente, sempre explícito** (selo permanente "Protótipo demonstrativo · dados fictícios").
- **Audite antes de editar** o código do AI Studio; **preserve** a stack e o que funciona; não regenere a base depois do MARCO-2.
- **Congelamento no MARCO-3**: sem tela, interação nem funcionalidade nova. Ideia nova vai para a gaveta do `ESTADO.md` §10.
- **Real só onde compensa** (jornada central, diferencial, IA se relevante), com contrato e queda rotulada em `stack.md` §7. Banco, login e integrações só se a jornada pedir.
- Dados fictícios, "hoje" fixo, **nenhuma chave no cliente nem no repositório**.

## 6. Reutilizar para outro evento

Copie esta pasta para `projetos/<outro-nome>/` e preencha a cópia. Mantenha `meu-prototipo/` como molde em branco (há *snapshot* com hash em `../../backups/molde_meu-prototipo_*`). Sem `git`: `cp -r`.
