# ESTADO

> Última atualização: 24/10/2026 ~12:00 · Marco atual: **ETAPA 2 gravada, aguardando aprovação da equipe (MARCO-1 previsto 11:45)** · Versão/tag: nenhuma

**Como usar (kit, não é conteúdo do projeto).** Fonte da verdade para retomar o trabalho. Atualize ao fim de cada incremento, a cada marco e antes de encerrar a sessão. Escreva só o que é verdadeiro agora; o histórico fica no Git. Todo "pronto", "ensaiado" ou "validado" traz nível P1–P4 e evidência com data (`../../D09_kit_desenvolvimento/CLAUDE.md` §8).

## 1. O projeto em 5 linhas

Desafio: **2 — Implantação** (`[DEC]`, `desafio.md` §9) · Público: implantador (usuário) e analista da prefeitura · Proposta: **Prumo**, mascote que acompanha a reunião do implantador com a prefeitura: checklist que se marca, alerta de contradição com o trecho do documento, compromissos guardados e cobrados (`proposta.md` §2) · Plataforma: **mascote desktop (Electron) só na reunião** `[DEC]` + web da plataforma (pendências e lembretes; outro integrante) `[DEC]` · Fluxo principal: F-01..F-08 (`experiencia.md` §2)

*(Cópia resumida de `proposta.md` §1–§2 e `experiencia.md` §2. Se divergir, vale o documento dono.)*

## 2. Regras do evento conhecidas

Fonte: portal `https://zenith.aprova.com.br/hackathon.html` `[FATO]`. **Entrega:** link do repositório Git via QR code até **17h** (sem tolerância); repo acessível aos jurados, pasta **`INSTRUCTIONS`** obrigatória, **README** (problema + como rodar), **demo funcionando ou vídeo de backup**; 16h começa o encerramento. **Solução agêntica**; agentes permitidos: Claude Code, Codex ou open source. Banca de 3–5 jurados, top 3 escolhido por eles; sem critérios/pesos publicados `[A]`. **Pitch aberto de 5 a 10 min** `[FATO]` (equipe). Dados fornecidos: nenhum (relato da equipe); Wi-Fi, código prévio, mentoria: `[A]`. Divergências portal × base: `desafio.md` §1 (D1–D4; D4: a reunião fica, segundo o demandante).

## 3. Como rodar (comandos verificados)

> Fonte: `stack.md` §4. Copie só o que alguém **executou e viu funcionar**.

| Ação | Comando | Verificado em (data/máquina) |
|---|---|---|
| Instalar | `npm install` (worktree `prumo-desktop-electron`) | 24/10/2026, notebook da equipe |
| Rodar | `npm run electron:dev` (desktop) · `npm run electron:start` (a partir de dist/) | 24/10/2026, notebook da equipe |
| Build do front | `npm run build` · instaladores `npm run electron:dist` | 24/10/2026, notebook da equipe |
| Reiniciar a demonstração | | |
| Varredura de rotas | | |

Hoje: **não há nada para rodar** (nenhum código).

## 4. Telas, interações e funcionalidades por prontidão

Fonte: `plano-implementacao.md` §3. Nível: P1 existe · P2 conectada · P3 interativa · P4 ensaiada.

| Marco | Tela / interação | Dono | Status (pronta / em curso / bloqueada / cortada) | Nível (P1–P4) | Evidência (comando ou ação → resultado, data) |
|---|---|---|---|---|---|
| M3 | S-01 Reuniões (lista; **web**, dono a definir) | — | planejada | — | — |
| M3 | S-02 Preparar reunião (cartão no chat do **mascote**) | I | planejada | — | — |
| M3 | S-03 Reunião ao vivo (**mascote**: checklist, alerta, compromisso) | I + X | planejada | — | — |
| M3 | S-04 Resumo e contexto reunido (painel do **mascote**) | X | planejada | — | — |
| M3 | Lembretes como mensagens do mascote (menu ⋯ "Avançar 3 dias") e painel do ticket simulado; lista de compromissos (S-05) na **web**, dono a definir | D | planejada | — | — |
| M3 | S-06 Ticket do cliente (página do cliente; **web**, dono a definir; no mascote só o painel simulado) | — | planejada | — | — |
| M3 | R-1 análise de trecho por LLM (`stack.md` §7) | X | planejada | — | — |
| M3 | Empacotar o mascote com Electron (T-13, P0) e R-3 transcrição ao vivo (stretch) | X | planejada | — | — |

## 5. Decisões, cortes e limitações (uma linha cada; mais recente primeiro)

| Data/hora | Tipo (decisão / corte / limitação / bloqueio) | Resumo (o quê, por quê, alternativa descartada) |
|---|---|---|
| 24/10 | decisão | `[DEC]` (usuário) divisão de trabalho: o **mascote** é um programa desktop gerado no AI Studio como painel compacto (~480x640, ≤ 1/4 da tela), refinado no Claude Code e empacotado com **Electron** (prompt em `prompt-ai-studio-mascote.md`); o **web simples** (login, chat de conversa, envio de arquivos) fica com outro integrante e não entra neste trabalho. Isso promove o desktop de stretch (`plano-implementacao.md` T-13) a parte do plano: ajustar tarefas e cortes quando a equipe confirmar. |
| 24/10 ~13:20 | decisão | `[DEC]` (usuário pediu) comportamento de app de bandeja: inicia em segundo plano (janela oculta, `PRUMO_ABRIR=1` para abrir na partida); clique no ícone abre/oculta direto; painel **fixo** na borda direita, em **toda a altura útil** do monitor do ponteiro (480 de largura), sempre no topo e em todas as áreas de trabalho; sem arrastar (CSS injetado) e reancora se o gerenciador mover. **Substitui** a regra anterior de "≤ 1/4 da tela": a janela passa a ocupar ~35 % da área útil do notebook (1366×768). Clique na bandeja verificado por DBus (`Activate` abre, segundo oculta), em dev e no pacote. `skipTaskbar` não confirmado no X11 `[NV]`. Sem commit. |
| 24/10 ~12:55 | decisão | `[DEC]` (usuário pediu) Electron configurado por completo na branch `feat/electron`, em worktree separada (`projetos/prumo-desktop-electron`) porque outra LLM editava `prumo-desktop`. Decisões técnicas reversíveis: janela de 480 de largura e altura de 480 a 640 (menor se passar de 1/4 da área útil); em Wayland o app reinicia uma vez em X11 (XWayland), único jeito de ter "sempre no topo" e posição; aceleração por GPU desligada no Linux (o processo de GPU falhou aqui); conteúdo servido por `app://` com CSP, permissões negadas, sandbox do renderer ligado; fechar oculta na bandeja, `Ctrl+Q` e menu da bandeja saem. Sem commit. |
| 24/10 ~12:00 | decisão | `[DEC]` (usuário, 24/10 ~12:00): o **programa desktop (mascote, Electron) fica limitado ao momento da reunião**: preparar, acompanhar, resumo ao concluir e lembretes como mensagens no chat do mascote. O "modo fora da reunião" (lista de pendências e cobranças, consulta à documentação, reuniões anteriores e próximas) **não existe no desktop**: fica na **plataforma web**. A primeira geração com dois modos foi um erro de escopo e foi corrigida com prompt próprio. Motivo: janela de 480x640 serve à reunião; menos escopo no desktop; a web já existe (outro integrante faz login, chat e envio de arquivos). Alternativa descartada: dois modos no desktop (mais código num espaço apertado). |
| 24/10 ~11:25 | decisão | `[DEC]` Etapa 2 fechada com a direção D' ("Prumo"): `[DEC]` desafio 2 Implantação e mascote de reunião (confirmado pela equipe); `[HIP]` web com `/mascote` em vez de desktop (**superada pela decisão de ~12:00**: mascote desktop com Electron, só na reunião); `[HIP]` fala por 3 níveis (ao vivo → áudio gravado → roteiro), ao vivo só se testado; `[HIP]` marcos comprimidos (congelamento 14:30, entrega 16:30); `[DEC]` visual: ADS + cor de IA nos blocos de IA, produto fictício "Prumo". Alternativas descartadas: versões 1 e 2 e B (`desafio.md` §9). |
| 24/10 ~11:20 | decisão | `[DEC]` a reunião e o prazo ficam (relato do demandante via equipe); a meta é cortar reuniões desnecessárias e de repetição. Sem dados da Aprova para a equipe. |
| 24/10 | proposta (superada por D') | Equipe formulou a ideia B' (copiloto de documentação do tech leader, mascote desktop, pendências, critérios de aceite, delta entre prefeituras); registrada em `desafio.md` §9. Aguarda confirmação do escopo e do desafio. |
| 24/10 ~09:40 | limitação | Portal sem anexos/links/dados; entrega exigida (repo + INSTRUCTIONS + README + demo) é mais que protótipo visual; AI Studio não consta entre os agentes permitidos `[A]`. Ver `desafio.md` §1 e §9. Nenhuma [DEC] ainda: a escolha do desafio é da equipe. |

**Pendências abertas hoje:** os marcadores `[PREENCHER NO EVENTO]`, `[DECIDIR]` e `[VALIDAR]` que ainda estiverem nos arquivos. Lista automática: `python3 ../../D09_kit_desenvolvimento/verificar_kit.py --pendencias`.

## 6. O que é real, simulado, fictício e pendente (resumo)

Fonte: `experiencia.md` §7 e `base-ai-studio.md` §5.

| Elemento | Realidade (real / simulado / fictício / pendente) | Como aparece na tela |
|---|---|---|
| Análise de trecho (checklist, contradição, compromissos), resumo | **real** (LLM, planejado; nenhum código ainda) | "Análise de IA · ao vivo" / "Análise gravada em <data>" |
| Transcrição de áudio ao vivo | stretch; real só se testada | fonte sempre rotulada |
| Reunião, contexto do cliente, ticket, lembretes, envio ao agente | simulado | "Roteiro", "Contexto do cliente (simulado)", "Ticket simulado", "Tempo simulado", "Envio ao agente (simulado)" |
| Dados (município, pessoas, documentos, valores) | fictício | selo "Protótipo demonstrativo · dados fictícios" |

Limitações conhecidas (com data):
- 24/10: ainda não há código; a regra de **código prévio** é desconhecida `[A]`; o uso do AI Studio não está confirmado `[A]`; chave de LLM, Wi-Fi e qualidade da fala em português não testados; `INSTRUCTIONS/` e README ainda não existem.

## 7. Verificado × não verificado

**Verificado (com evidência):** nada sobre o protótipo (não existe).
**Não verificado (e como verificar):** comandos do projeto exportado (executar e registrar em `stack.md` §4); chamada real de IA, se houver (`validacao.md` §3); abertura do protótipo em máquina limpa (`validacao.md` §6).

## 8. Perguntas em aberto

| Pergunta | Quem responde | O que assumimos até lá | Status |
|---|---|---|---|
| 1. Google AI Studio (Gemini) é aceito? O portal lista só Claude Code, Codex e open source | organizadores | AI Studio só como esboço visual; código no repo escrito/revisado no Claude Code e declarado no README | aberta |
| 2. Critérios, pesos da banca e o que é "nível da entrega" | organizadores | agente real + INSTRUCTIONS legível + indicador + demo estável | aberta |
| 3. Tempo/formato do pitch; demo ao vivo obrigatória ou vídeo vale? | organizadores | `[FATO]` pitch aberto de 5 a 10 min (equipe); demo ao vivo com vídeo de backup | parcial |
| 4. Dados de exemplo e envio a LLM externo permitido? | organizadores | tudo sintético, fixtures no repo | aberta |
| 5. Provedor/chave de LLM e Wi-Fi? | organizadores / equipe testa | API do Claude, chave só no servidor, queda gravada rotulada | aberta |
| 6. Código/ideia/bibliotecas prévios permitidos? | organizadores | só boilerplate genérico e dependências públicas | aberta |
| 7. Integrante da Aprova na equipe pode validar o domínio? Habilidades da equipe? Papéis D, I, X? | equipe | sem especialista; papéis em `plano-implementacao.md` §2 a preencher | aberta |
| 8. Pode gravar/transcrever reunião com servidores públicos? Qual aviso? | Aprova (jurídico) | aviso no início + 3 modos de escuta (gravação com aviso, escuta sem guardar, modo notas); sem afirmar conformidade com a LGPD | aberta |
| 9. Quantas reuniões por processo e quanto tempo hoje (linha de base)? | demandante | nenhum número; indicadores do cenário rotulados, sem afirmar ganho | aberta |
| 10. Qual a banca lê "sem depender de reunião" (portal) × "a reunião fica" (demandante)? | organizadores | enquadrar como "menos reuniões de repetição" | aberta |
| 11. Quem constrói, na web, a lista de pendências, os lembretes e a página do ticket do cliente? Como o mascote entrega os dados (2 eventos: compromisso e resumo)? | equipe (o colega da web) | dados pré-semeados na web, rotulados como simulados, até haver contrato | aberta |

*(Perguntas completas e justificativas: `desafio.md` §7.)*

## 9. Próximo passo

**Equipe lê `experiencia.md` §2–§3, `proposta.md` §2 e `plano-implementacao.md` §1–§4 e aprova (MARCO-1, 11:45).** Em seguida: T-00 (colar o prompt de `base-ai-studio.md` §1 no AI Studio, dono I) em paralelo com T-P1 (testar a chave do LLM e esboçar `INSTRUCTIONS/`, dono X) e T-P2 (arquivos de dados, dono D). Bloqueios ativos: nenhum; pergunta 1 (AI Studio) condiciona T-00: se vetado, `CORTE-1`.

## 10. Gaveta de ideias (fora do escopo; não implementar)

- Funil de insumos soltos + página do analista da prefeitura (a Aprova já tem chat e agente que interpreta)
- Painel de acompanhamento por desenvolvedor; critérios de aceite como tela; 2ª prefeitura herdando regras como fluxo próprio
- Importar conversa exportada do WhatsApp; seleção de janela de horário
- Programa desktop (janela sempre no topo, bandeja); captura de áudio de Meet/Teams instalados; diarização de vários participantes
- Modo "fora da reunião" dentro do desktop (descartado em ~12:00; vive na web)
- Servidor MCP para o desenvolvedor consultar o copiloto na IDE (`[HIP]`, não testado)

## 11. HANDOFF (para quem retomar; ≤ 12 linhas)

Objetivo: protótipo demonstrável do **Prumo** (mascote de reunião para o implantador; desafio Implantação), pitch de 5–10 min; entrega do repositório (com `INSTRUCTIONS/`, README e demo ou vídeo) até 16:30 (hard 17:00). · Onde estamos: documentos da Etapa 2 escritos (desafio, proposta, experiência, dados, design, stack, plano, prompt do AI Studio, roteiro §1–§3); **nenhum código**. · Para ver funcionando rode: nada ainda. · Não confie em: `[HIP]` (web com `/mascote`, marcos comprimidos, notas), nos nomes de pessoas (fictícios) e nos relatos do demandante (segunda mão). · Próximo passo: §9. · Cuidado com: AI Studio não confirmado (`CORTE-1`); áudio ao vivo é stretch (go/no-go 14:00); não chamar de "ao vivo" a queda; não regenerar a base depois do MARCO-2.
