# CLAUDE.md — projeto `meu-prototipo` (hackathon; **desafio ainda não revelado**)

Complementa, não substitui, as regras permanentes do kit: [`../../D09_kit_desenvolvimento/CLAUDE.md`](../../D09_kit_desenvolvimento/CLAUDE.md). Em conflito, vale a regra **mais restritiva**. Aqui ficam só as regras específicas deste projeto. Português do Brasil.

**O que se constrói aqui:** um **protótipo demonstrável** de alta fidelidade: base visual gerada no **Google AI Studio** e evoluída no **Claude Code** (stack real descoberta no código exportado; orientação-base: React/Node/npm), dados fictícios, jornada central e diferencial **reais quando baratos e confiáveis** (ex.: IA), o resto simulado e rotulado. **Não** é um MVP nem um produto. Prioridade: problema e critérios compreendidos → qualidade visual e clareza de UX → jornada central → diferencial (IA real se relevante) → dados coerentes → interações simuladas → facilidade de apresentar → pitch.

## 1. Estado: nada foi decidido

O desafio será revelado em 24/10/2026. **Não existe** proposta, experiência, design nem plano. Os arquivos desta pasta são **esqueletos**; campo aberto traz um destes marcadores:

| Marcador | Significado | O que o agente faz |
|---|---|---|
| `[PREENCHER NO EVENTO]` | Informação que só existe depois de conhecer o desafio | Preenche **somente** com o que a equipe disse ou decidiu; senão mantém e pergunta |
| `[DECIDIR]` | A equipe precisa escolher | Apresenta opções com prós e contras; não escolhe sozinho salvo padrão razoável registrado como `[DEC]` |
| `[VALIDAR]` | Padrão sugerido pelo kit, ainda não confirmado | Trata como hipótese `[HIP]`; confirma ou troca e registra em `ESTADO.md` §5 |
| `[VALIDAR NA AUDITORIA]` | Fato sobre o código exportado (stack real, versões, comandos, estado) que só existe depois de abrir o projeto | **Não presume**; preenche a partir do código (prompt `03`) |

Outros rótulos: `[FATO]` (dito pela organização/enunciado), `[HIP]`, `[A]` (a confirmar), `[NV]` (não verificado), `[DEC]` (decidido, com motivo). **Marcador só sai quando alguém resolve o campo.** Nunca o troque por valor plausível inventado; o que sobrar é pendência declarada no `ESTADO.md`.

## 2. Enquanto o desafio não é conhecido

Permitido: ler o kit e a base, fazer o ensaio de pré-evento (`../../D09_kit_desenvolvimento/README.md` §6.2) e preparar o ambiente (Node, npm, git, acesso ao AI Studio). **Proibido:** inventar desafio, gerar ou escrever telas de produto ou importar código sem antes responder a regra de **código prévio** (`desafio.md` §1; enquanto for `[A]`, não copie código de `D05` nem de `D09_kit_prompts_projetos.md`, só ideias).

## 3. Leitura antes de agir

1. [`README.md`](README.md) (sequência do dia) e [`ESTADO.md`](ESTADO.md) (onde estamos).
2. O documento dono da matéria (seção 4). Não leia todos por padrão.
3. Base de conhecimento **seletiva**, por identificador (mapa em `../../D09_kit_desenvolvimento/README.md` §8). Nunca carregue `D01…D09` inteiros. Base e kit são somente leitura.

## 4. Fonte única de cada decisão

| Matéria | Documento dono | Os outros apenas **referenciam** (`arquivo §n`) |
|---|---|---|
| Regras do evento, desafio, interpretação, desafio escolhido | `desafio.md` | todos |
| Problema, público, proposta, diferencial, escopo, o que é real / simulado / adiado | `proposta.md` | experiência, demo |
| Fluxo principal, mapa de telas, interações I-nn, registro real × simulado × fictício | `experiencia.md` | design, dados, plano, validação |
| Tokens, componentes, estados, rótulos, checklist de fidelidade | `design.md` | plano, validação |
| Cenário, personagens, mocks, "hoje" fixo, caminho dourado | `dados-mock.md` | experiência, validação |
| Stack (orientação-base × **real descoberta**), comandos verificados, estrutura, disponibilização, **itens reais com contrato e queda** | `stack.md` | README, plano |
| Prompt enviado ao AI Studio, exportação, auditoria, mapa real × simulado × ausente, ordem de evolução | `base-ai-studio.md` | plano, `ESTADO.md` |
| Tarefas, donos, marcos, escada de cortes | `plano-implementacao.md` | `ESTADO.md` |
| Rotas, cenário 3×, botões, coerência, defeitos | `validacao.md` | demo |
| Roteiro, pitch, perguntas, plano de falha, instruções aos avaliadores | `demo/roteiro-demo.md` | — |
| Estado atual, decisões (uma linha), próximo passo | `ESTADO.md` | — |

Uma decisão é escrita **uma vez**. Informação em dois lugares: mantenha a do dono e troque a outra por referência.

## 5. Mudanças e alinhamento

- Antes de mudança importante, confira `experiencia.md` (fluxo e interações) e `stack.md`. Se a mudança contradiz um deles, **pare**: proponha a alteração no dono e espere confirmação.
- **Ideia nova** vai para a gaveta do `ESTADO.md` §10. Depois do **congelamento** (MARCO-3) não entra tela, interação nem funcionalidade nova.
- **Decisão de produto ou de escopo** (qual solução, o que é real, o que cortar): o agente apresenta opções e a **equipe escolhe**. Decisão técnica reversível dentro das regras: o agente decide e registra.
- Mudou uma decisão? Atualize `desafio` → `proposta` → `experiencia` → `design`/`dados-mock`/`stack` → `plano-implementacao` → `ESTADO.md` (linha em §5, com motivo e alternativa descartada). Documento defasado: atualize ou marque `[VALIDAR]`.

## 6. Regras do protótipo (resumo; texto completo no CLAUDE.md do kit §6 e §7)

- **Botão vivo:** todo controle visível navega, muda estado visível, abre painel ou mostra o aviso "ação demonstrativa". Sem controle morto; se não der tempo, **remova** o controle.
- **Espinha dorsal primeiro:** a jornada principal de ponta a ponta com dados simples, antes de qualquer tela secundária.
- **Real, simulado ou pendente, sempre explícito.** Selo permanente "Protótipo demonstrativo · dados fictícios". Simulações rotuladas e registradas em `experiencia.md` §7; funcionalidade real também rotulada ("gerado por IA · ao vivo"); resposta de queda **nunca** "ao vivo".
- **Preserve a base gerada:** a stack real do projeto exportado manda. Não troque de framework ou biblioteca, não migre para Laravel/PHP, não crie backend separado se o runtime existente basta, não reescreva o que funciona.
- **Real onde compensa:** jornada central e diferencial (IA se relevante e viável: `../../D09_kit_desenvolvimento/referencias/padroes-de-integracao-ia.md`). Banco, login e integrações só se a jornada pedir. Todo item real: contrato e queda em `stack.md` §7.
- **Segredos:** chaves e chamadas externas só no servidor, em variável de ambiente; `.env` fora do Git; nada no código cliente.
- **Visual:** parta do design system público da Aprova (`../../D09_kit_desenvolvimento/referencias/design-system-aprova.md`): tokens e padrões, nunca cópia de tela, logotipo ou marca; não invente padrões "oficiais"; a escolha final é `[DEC]` em `design.md` §1. Aderência visual não é atendimento aos requisitos.
- **Dados:** fictícios e coerentes; "hoje" fixo; nenhum dado pessoal real, segredo ou chave no repositório.
- **Uma plataforma** por padrão (web). Flutter só por decisão da equipe (`../../D09_kit_desenvolvimento/referencias/flutter-prototipo.md`).

## 7. Código, execução e evidência

- Código em `prototipo/` (raiz do **projeto exportado do AI Studio**); documentos ficam ao lado dele. **Audite antes de editar** (`../../D09_kit_desenvolvimento/prompts/03-auditar-codigo-exportado.md`; roteiro em `../../D09_kit_desenvolvimento/referencias/ai-studio-e-claude-code.md` §4).
- Use **somente** comandos de `stack.md` §4 que alguém executou. Sem comando verificado: `NÃO VERIFICADO` e diga o que a equipe deve rodar.
- "Pronto" tem nível **P1–P4** com evidência (rota, cenário 3×, chamada real vista) em `ESTADO.md` §4. Se não viu a tela, diga "não vi a tela".
- Todo relatório de incremento termina com `VERIFICADO` e `NÃO VERIFICADO` (formato no CLAUDE.md do kit §8).
- Pedido pequeno, seguro e compreendido: execute direto e verifique, sem documento de planejamento; atualize `ESTADO.md` só se mudou algo que o próximo leitor precisa saber.

## 8. Git e preservação

Commits pequenos, prefixo `[I]`, `[X]` ou `[D]` (dono da pasta). Tags `base`, `fluxo`, `demo-ready`. O código do AI Studio entra num commit inicial próprio, sem alterações. Não renomeie nem apague documentos desta pasta sem justificativa; guarde cópia antes de substituir conteúdo preenchido por pessoa.
