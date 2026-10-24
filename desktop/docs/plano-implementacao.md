# Plano de implementação

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · rascunho para aprovação da equipe (MARCO-1); horários `[HIP]`, ajustar à hora real |
| Dono | D (integrador) |
| Base | `experiencia.md` §2, §3 e §5; `../../D09_kit_desenvolvimento/FLUXO_DE_TRABALHO.md` |

## 1. Linha do tempo

T0 (início do desenvolvimento): **11:45** `[HIP]` (após a equipe aprovar a direção) · **código congelado às 16:00 no máximo** e entrega pelo QR code até **17:00** sem tolerância `[FATO]` (portal); a equipe adota **entrega às 16:30** com 30 min de reserva `[HIP]` · pitch real: depois das 17:00, de 5 a 10 min `[FATO]` (equipe) · janela efetiva: ~4 h 45 min até o congelamento (menos que as ~6 h do kit: os marcos foram comprimidos, ver §4).

| Marco | Horário | Condição |
|---|---|---|
| MARCO-1 | 11:45 | direção aprovada pela equipe; prompt do AI Studio pronto (`base-ai-studio.md` §1) |
| MARCO-2 | 12:45 | base exportada roda local, auditada, ordem de evolução aprovada; tag `base` |
| MARCO-3 | 14:30 | jornada principal P3 (S-01..S-05), diferencial R-1 visto (ou queda rotulada); **congelamento**; tag `fluxo` |
| MARCO-4 | 15:15 | cenário 3/3 após reset, sem erro de console; tag `demo-ready` |
| MARCO-5 | 15:50 | 2 ensaios; vídeo de backup; `INSTRUCTIONS`, README e roteiro finais |
| Entrega | 16:30 | repositório acessível, QR code enviado |
| Reserva | 16:30–17:00 | **intocável**; sem código novo |

## 2. Papéis e pastas

| Papel | Pessoa | Pastas (dono) |
|---|---|---|
| D — Narrativa e dados | [PREENCHER NO EVENTO] | pasta dos mocks/dados de demonstração, `INSTRUCTIONS/`, `README.md`, `demo/` (caminhos reais: `stack.md` §2, após a auditoria) |
| I — Interface | [PREENCHER NO EVENTO] | componentes de UI, estilos globais e tokens |
| X — Fluxos, lógica e integrações | [PREENCHER NO EVENTO] | rotas/roteador, estado, servidor, serviços (IA, fala) |

Com menos de 3 pessoas, junte os papéis (`../../D09_kit_desenvolvimento/FLUXO_DE_TRABALHO.md` §2.2). Equipe e papéis ainda não informados.

## 3. Quadro de telas e tarefas

| ID | Tela / interação | Prio. | Dono | Estimativa | Marco alvo | Depende de |
|---|---|---|---|---|---|---|
| T-00 | Gerar a base no AI Studio (prompt de `base-ai-studio.md` §1) e exportar com commit inicial `base AI Studio, sem alterações` (11:45–12:15) | P0 | I | 30 min | M1→M2 | — |
| T-P1 | **Em paralelo à T-00:** testar chamada real ao LLM com a chave (≥ 1 chamada), esboçar `INSTRUCTIONS/00..04`, esquemas JSON das saídas e decidir se o teste de fala (R-3) vale (11:45–12:15) | P0 | X | 30 min | M2 | — |
| T-P2 | **Em paralelo:** transformar `dados-mock.md` em arquivos de dados e o roteiro TRN-01..16; deixar o espaço das respostas gravadas (11:45–12:30) | P0 | D | 45 min | M2 | — |
| T-01 | Auditar: stack real, comandos, mapa de funcionalidades, ordem de evolução (`base-ai-studio.md` §4–§7) (12:15–12:45) | P0 | X | 30 min | M2 | T-00 |
| T-02 | **Endpoint de análise (R-1a, R-1b, R-1c)**: chamadas em paralelo, validação por código (evidência literal, `docId` existente, datas por `DEMO_NOW`), queda gravada rotulada (12:45–13:30) | P0 | X | 45 min | M3 | T-01, T-P1 |
| T-03 | S-02 Preparar reunião como **cartão no chat do mascote** (checklist, modo de escuta, aviso de gravação); a lista de reuniões (S-01) é da **web** (dono a definir) (12:45–13:30) | P0 | I | 45 min | M3 | T-01, T-P2 |
| T-04 | **S-03 Reunião ao vivo**: transcrição por canal (fonte "Roteiro"), checklist que se marca, alerta de contradição com trecho e decisão, cartão de compromisso, aviso de lacunas ao encerrar (13:30–14:15) | P0 | I (UI) + X (ligação) | 45 min | M3 | T-02, T-03 |
| T-05 | **Lembretes como mensagens do mascote** (menu ⋯ "Avançar 3 dias") e painel do ticket simulado; a lista de compromissos (S-05) e a página do cliente (S-06) são da **web**: dono e contrato de dados a definir com o colega (13:30–14:15) | P0 | D | 45 min | M3 | T-P2, T-03 |
| T-06 | S-04 Resumo e contexto reunido (R-2), Aprovar/Recusar, exportar JSON, envio simulado (14:15–14:30) | P0 | X | 30 min | M3 | T-04 |
| T-07 | **R-3 transcrição ao vivo (stretch)**: teste de rede e português com a chave; **go/no-go às 14:00**; se não passar, fica áudio gravado e roteiro | P1 | X | 30 min | M3 | T-P1, T-04 |
| T-08 | Refinar o painel do mascote (480x640; abas Conversa e Checklist; sem modo "fora da reunião") e prepará-lo para o Electron | P0 | I | 30 min | M3 | T-04 |
| T-09 | Acabamento: tokens, estados (carregando/vazio/erro), selos e rótulos, reset, foco e contraste (14:30–14:55) | P0 | I | 25 min | M4 | M3 |
| T-10 | `INSTRUCTIONS/` final (4 arquivos + índice), README (problema, como rodar, real × simulado), roteiro e instruções aos avaliadores (em paralelo, 13:30–15:15) | P0 | D | 60 min | M5 | T-P1 |
| T-11 | Validar o cenário 3× após reset, console, rotas, botões (`validacao.md`); testar a queda (14:55–15:15) | P0 | D + X | 20 min | M4 | M3 |
| T-12 | Ensaios (2), vídeo de backup, plano de falha dito em voz alta (15:15–15:50) | P0 | todos | 35 min | M5 | M4 |
| T-13 | **Empacotar o mascote com Electron**: feito na branch `feat/electron` (worktree `projetos/prumo-desktop-electron`), **ainda não mesclada**; verificações em `stack.md` §4. Falta: ver a bandeja e o atalho no desktop com os olhos, mesclar e resolver os pontos de contato com `CabecalhoPrumo.tsx` e `App.tsx` | P0 | X | feito (sem commit) | M3 | T-04, T-08 |

Status e prontidão (P1–P4) com evidência ficam em `ESTADO.md` §4.

## 4. Escada de cortes (de cima para baixo, até caber)

| Ordem | Corte | Preserva |
|---|---|---|
| 1 | T-13 Electron: cai para a janela web compacta (mesmo painel) | a demo do mascote |
| 2 | T-08 acabamentos do painel além do essencial (estados vazios, microinterações) | S-03 completa |
| 3 | T-07 transcrição ao vivo: a fonte fica "Áudio gravado" ou "Roteiro" | pipeline de análise (R-1) |
| 4 | S-06 vira modal dentro de S-05 (sem página de celular) | ciclo de cobrança |
| 5 | Modos de escuta além de "gravação com aviso" | aviso de gravação |
| 6 | S-04 sem edição do resumo (só Aprovar/Recusar e JSON) | resumo e aprovação |
| 7 | S-01 vira lista simples, sem abas e sem indicadores | entrada na S-02 |
| 8 | Análise ao vivo vira "análise gravada" rotulada (nunca chamar de ao vivo) | momentos de destaque 1 e 2 |

Nunca cortar: S-03 com checklist e alerta de contradição, compromisso e cobrança, coerência dos dados, identidade visual, selo, reset, rotulagem de real × simulado, `INSTRUCTIONS`, README, vídeo, roteiro, pitch, ensaio e reserva. A integração real do diferencial (R-1) é o último corte (antes, queda rotulada).

Atraso: o marco se mantém, corta-se de cima para baixo e registra-se em §6. Janela comprimida: a base do AI Studio tem 30 min; se na hora **12:15** não houver base utilizável, aplicar `CORTE-1` (§5).

## 5. Riscos e contingências

| Risco | Probabilidade/impacto | Resposta | Quem decide |
|---|---|---|---|
| Google AI Studio não é aceito pela banca ou pela regra (o portal lista só Claude Code, Codex e open source) `[A]` | média / alto | `CORTE-1`: gerar a base no Claude Code com o mesmo prompt de `base-ai-studio.md` §1; declarar no README o que veio do AI Studio | equipe |
| AI Studio não entrega base utilizável em 30 min | média / alto | `CORTE-1` / `CONT-8` | X |
| A base exportada não roda após 30 min de auditoria | média / alto | `CORTE-2` | X |
| Build do front falha | baixa / alto | `CONT-2` | X |
| Dependência de rede (Wi-Fi do evento desconhecido) | média / alto | `CONT-1`: demo local; queda gravada; testar a rede às 11:45 | D |
| Serviço de IA falha (chave, cota, rede, latência) | média / alto | `CONT-9`: queda gravada rotulada, `DEMO_MODE=gravado` | X |
| Transcrição ao vivo não funciona (rede, permissão do navegador, português) | alta / médio | R-3 é stretch; queda "Áudio gravado" → "Roteiro"; rótulo sempre exato | X |
| Demonstrar áudio com o Meet exige duas pessoas e boa rede | média / médio | demonstrar com áudio gravado e dizer isso | D |
| Empacotar com Electron (instalação, rede, janela sempre no topo no Linux) `[NV]` | média / médio | T-13 com plano antes e queda para a janela web compacta; rotular na demo | X |
| Dono da parte web (pendências, lembretes, ticket) indefinido; dados não chegam do mascote | média / alto | fechar com o colega o contrato de 2 eventos ou usar dados pré-semeados rotulados | D |
| Congelamento atrasa (S-03 não fica P3 até 14:30) | média / alto | corte conforme §4 e registro em §6 | D |
| Leitura do demandante diverge da banca (reunião ou não) `[A]` | baixa / médio | enquadrar no pitch como "menos reuniões de repetição" | D |

## 6. Registro de desvios

| Hora | Desvio (atraso, corte aplicado) | Marco afetado | Decisão |
|---|---|---|---|
| | | | |
