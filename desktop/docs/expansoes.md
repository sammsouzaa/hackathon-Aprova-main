# Propostas de expansão do Prumo (Suporte e CS) sobre o núcleo de Implantação

> Status: **propostas `[HIP]`**, nenhuma é `[DEC]`. Base: portal `https://zenith.aprova.com.br/hackathon.html` (abas Suporte, Implantação, CS), `proposta.md`, `experiencia.md`, `dados-mock.md`, `stack.md` §7. Nada aqui altera o núcleo; tudo depende de o núcleo estar P3 (`plano-implementacao.md`).

> **Nota (24/10 ~12:00):** estas propostas continuam **pendentes** por decisão do usuário. A tela S-07 e as lentes de Suporte e CS ficariam na **plataforma web**, não no mascote desktop (que fica só na reunião).

## 1. Princípio

Os três desafios são **fases do ciclo de vida do cliente**, em sequência: **Implantação** (antes do go-live) → **Suporte** (depois do go-live, uso contínuo) → **CS** (relacionamento e expansão). O elo é o **dossiê da prefeitura**, registro estruturado que o Prumo grava na Implantação e que as duas fases seguintes consomem. Suporte e CS **não** entram nas reuniões de implantação; entram como **lentes** sobre o dossiê, mostradas depois de avançar o relógio da demonstração.

Dados da cena pós go-live (fictícios): `DEMO_NOW_POS` = **quinta-feira 10/12/2026, 09:30**. Os nomes de prefeituras além de Serra do Sabiá são provisórios (conferir para não coincidir com cidades reais).

## 2. Mapa geral

| ID | Proposta | Fase | O que entrega | Onde aparece | Prio. | Custo (min) | Depende de |
|---|---|---|---|---|---|---|---|
| X-01 | Dossiê da prefeitura | Implantação → base das outras | Registro estruturado das regras, evidências, decisões, compromissos e pistas | S-07 aba Implantação; JSON exportável | **1ª onda** | 20 | S-04 (resumo) |
| X-02 | Pista de expansão | Implantação → CS | Cartão no chat quando a fala cita outra secretaria | S-03 / `/mascote`; dossiê | **1ª onda** | 20 | roteiro (2 falas novas) |
| X-03 | Cobrança por WhatsApp e resposta conferida | Implantação | Lembrete como mensagem de WhatsApp (simulada) com link; confere se a resposta cobre o item | S-05, S-06 | 2ª onda | 30 | S-05 |
| X-04 | Ticket com contexto de implantação | **Suporte** | Triagem do ticket pelo dossiê: regra configurada × possível erro de configuração, ticket completo e resposta sugerida | S-07 aba Suporte | **1ª onda** | 45 | X-01 |
| X-05 | Perguntas de complemento na abertura | Suporte | Pede ao requerente o que falta antes de o ticket chegar ao analista | chat do cliente (web do colega) | visão | 45 | colega |
| X-06 | Resposta antes do ticket (menos tickets) | Suporte | Responde pela documentação e pelo dossiê, com citação, sem abrir ticket | campo de pergunta do mascote; chat do cliente | 2ª onda / visão | 25–45 | X-01 |
| X-07 | Saúde da conta | **CS** | Ranking de prefeituras por atenção necessária, calculado por código | S-07 aba CS | 2ª onda | 30 | X-01, X-04 |
| X-08 | Conteúdo para o decisor | CS | 3 linhas para o secretário e a mensagem de WhatsApp pronta | S-04 (aba "Para o secretário"), S-07 aba CS | **1ª onda** | 25 | X-01 |
| X-09 | Conteúdo para outra secretaria | CS | Mensagem para a secretaria da pista de expansão, com base no que já foi feito | S-07 aba CS | 2ª onda | 15 | X-02, X-08 |
| X-10 | Tela "Dossiê da prefeitura" (S-07) | Transversal | Linha do tempo com abas Implantação · Suporte · CS e botão "Avançar até o pós go-live" | nova tela P1 | **1ª onda** | 40 | X-01 |

Ordem de entrega por onda, a depender do tempo (ver §5): 1ª onda = X-01, X-02, X-08, X-10 e X-04; 2ª = X-03, X-07, X-09, X-06; visão (só slide, nunca prometer) = X-05 e a parte de chat do cliente de X-06.

## 3. Fichas

### X-01 · Dossiê da prefeitura (fase Implantação, base das outras)
- **Problema/objetivo do portal:** quem chega depois não sabe o que foi combinado; o CSA "fica preso" em assuntos operacionais (CS) e o ticket chega sem contexto (Suporte).
- **Quem usa:** implantador (gera), analista de suporte e CSA (consomem).
- **Gatilho:** reunião encerrada e resumo aprovado (S-04).
- **O que o Prumo faz:** agrupa, por prefeitura e processo, (1) **regras confirmadas** e **regras locais** (diferença para a cidade modelo), cada uma com a frase de evidência, quem falou, reunião e hora; (2) contradições e a decisão tomada; (3) compromissos e seu estado; (4) pistas de expansão; (5) histórico de reuniões.
- **Entrada → saída:** estado da reunião (checklist, alertas, compromissos) → JSON com esquema validado (ids de regra, de reunião e de fala existentes) + visão em S-07.
- **Real × simulado:** montagem por **código** (determinística); a redação do resumo é a do R-2 (LLM). Dados fictícios.
- **Dados novos:** ids de regra (`REG-01..`), ex. `REG-07` = recuo frontal 3,00 m, origem local, evidência da fala 8, REU-01.
- **Risco:** dossiê "bonito" sem fonte → regra: nenhum item sem evidência ou sem decisão humana.
- **Corte:** sem edição manual; só leitura e exportar JSON.

### X-02 · Pista de expansão (Implantação → CS)
- **Objetivo do portal (CS):** "captar pistas de expansão".
- **Quem usa:** implantador (vê o cartão), CSA (recebe).
- **Gatilho:** fala nova do roteiro, após a fala 10: Prefeitura: "A Secretaria de Meio Ambiente também quer começar com isso, mas ainda não sabem por onde."
- **O que o Prumo faz:** cartão "Pista de expansão: Secretaria de Meio Ambiente · sinal: 'quer começar' · Enviar ao CSA (simulado)". Entra no dossiê.
- **Entrada → saída:** trecho de fala → `{secretaria, sinal, evidencia}` (a evidência deve existir literalmente na fala; instrução `INSTRUCTIONS/03` ampliada ou `05`).
- **Real × simulado:** detecção por LLM (real); "enviar ao CSA" simulado.
- **Dados novos:** 1–2 falas no roteiro (a numeração do roteiro muda: atualizar `dados-mock.md` §3 e o arquivo de dados).
- **Risco:** pista inventada; mitigação: só com evidência literal e confirmação do implantador.
- **Corte:** vira só um cartão pré-gravado, rotulado como análise gravada.

### X-03 · Cobrança por WhatsApp e resposta conferida (Implantação)
- **Base:** o portal diz que analistas e secretários "respondem no WhatsApp, não no e-mail nem no ticket" e que cada cliente já tem grupo com a Aprova.
- **O que o Prumo faz:** o lembrete sai como mensagem de WhatsApp (envio **simulado**) com o texto pronto e o link do ticket; a resposta pode chegar no grupo ou no ticket; o Prumo confere se cobre o item do checklist (ex.: "a planta veio sem a legenda das zonas") e pede só o que falta, em vez de nova rodada.
- **Entrada → saída:** resposta + item esperado → `{cobre: sim|parcial|nao, faltante}`; o texto do faltante cita o que o checklist exige.
- **Real × simulado:** conferência por LLM (real) sobre o texto de um anexo fictício; mensagem, grupo e ticket simulados.
- **Dados novos:** texto do anexo fictício; mensagem do lembrete.
- **Corte:** sem conferência, só o lembrete em formato de WhatsApp.

### X-04 · Ticket com contexto de implantação (fase **Suporte**)
- **Objetivo do portal (Suporte):** "tickets melhores desde a abertura", "mais tickets resolvíveis na primeira análise", "menos interações por ticket".
- **Quando:** depois do go-live (10/12/2026). **Quem usa:** analista de suporte (decide); a analista da prefeitura abre o ticket.
- **Cena:** Helena escreve no chat da plataforma: "O sistema não deixa protocolar o alvará da obra da Rua das Palmeiras, 120, diz que o recuo está errado."
- **O que o Prumo faz:** (1) completa o ticket (processo, secretaria, mensagem, regra envolvida, urgência) e lista o que falta perguntar (nº do protocolo, print); (2) cruza com o dossiê: `REG-07` (recuo local 3,00 m, acordado em 26/10, com evidência); (3) compara com a **configuração atual do formulário (simulada)**: 4,50 m, igual à cidade modelo; (4) classifica: **possível erro de configuração** (a regra local não foi aplicada), em vez de "dúvida do usuário"; (5) sugere a resposta, com a citação, e a ação "Encaminhar à implantação (simulado)". A decisão é do analista.
- **Entrada → saída:** ticket + dossiê + configuração → `{classificacao, regraId, evidencia, camposFaltantes, respostaSugerida}`; o código confere que `regraId` existe e mostra o texto **do dossiê**, não do modelo (instrução nova `INSTRUCTIONS/06-triar-ticket.md`).
- **Real × simulado:** triagem por LLM (real); ticket, chat e configuração do formulário simulados e rotulados.
- **Dados novos:** `TKT-S01`, configuração do formulário (`recuo = 4,50`), data `DEMO_NOW_POS`.
- **Risco:** afirmar que o suporte melhorou. Mitigação: indicadores do cenário rotulados; "mecanismo, não resultado".
- **Corte:** triagem gravada e rotulada.

### X-05 · Perguntas de complemento na abertura (Suporte, visão)
- **O que faria:** no chat do cliente, antes de o ticket chegar ao analista, o Prumo pergunta o que falta (módulo, passo a passo, mensagem de erro, urgência).
- **Dependência:** o chat web que o colega está construindo. Sem ele, fica só como slide. Não entra na demo sem confirmar o prazo dele.

### X-06 · Resposta antes do ticket (Suporte, menos tickets)
- **Objetivo do portal:** "reduzir os chamados abertos via chat e Pylon".
- **O que faz:** a pergunta "qual o recuo mínimo na ZR2?" é respondida pelo dossiê e pelos documentos, com citação ("3,00 m, regra local de Serra do Sabiá"), sem abrir ticket. Se não houver resposta, abre o ticket completo (X-04).
- **Onde:** campo de pergunta do mascote (já previsto no prompt do AI Studio, com 3 respostas pré-definidas) e, depois, o chat do cliente.
- **Real × simulado:** na primeira onda, resposta pré-definida e rotulada "Resposta simulada"; real só se sobrar tempo.

### X-07 · Saúde da conta (fase **CS**)
- **Objetivo do portal (CS):** "ver com dados quais contas são mais problemáticas".
- **O que mostra:** ranking de 4 prefeituras fictícias por atenção necessária, por **regras explícitas em código** (ex.: compromissos atrasados, lacunas em aberto, tickets abertos, dias sem reunião), com o motivo de cada marcação, e a linha "Ocorrências operacionais resolvidas sem o CSA: 1" (do X-04).
- **Dados novos:** 3 prefeituras fictícias com valores diferentes (uma "Atenção", duas "Estável"), nomes a conferir.
- **Real × simulado:** cálculo por código (real); dados fictícios; rótulo "Indicador do cenário, não medição".
- **Risco:** parecer métrica real; mitigação: o rótulo e o texto "regra de exemplo".
- **Corte:** só a conta Serra do Sabiá, sem ranking.

### X-08 · Conteúdo para o decisor (CS)
- **Objetivo do portal:** "criar materiais personalizados com os resultados obtidos"; secretário "sem tempo para reuniões".
- **O que o Prumo faz:** do dossiê, gera 3 linhas em linguagem simples para o secretário (o que foi configurado, o que falta dele, quando vai ao ar) e a mensagem de WhatsApp pronta; o CSA aprova antes de enviar (envio simulado).
- **Entrada → saída:** dossiê → `{resumo3linhas, mensagem}`; o código confere que cada número ou regra citada existe no dossiê (instrução `INSTRUCTIONS/05-resumo-para-decisor.md`).
- **Real × simulado:** geração por LLM (real); envio simulado.
- **Risco:** "resultados" inventados; regra: só números do dossiê, rotulados "do cenário".
- **Corte:** texto gravado, rotulado.

### X-09 · Conteúdo para outra secretaria (CS)
- **Objetivo do portal:** "chegar a secretários e diretores de outras secretarias com conteúdo feito para cada um".
- **O que faz:** a partir da pista de X-02, gera a mensagem para a Secretaria de Meio Ambiente (o que já foi feito em Planejamento Urbano e o processo equivalente, ex. "Licença ambiental simplificada", PRC-04), mesma instrução do X-08 com outro público.
- **Corte:** vira variante de texto do X-08.

### X-10 · Tela "Dossiê da prefeitura" (S-07, transversal)
- **O que é:** uma tela (P1) com linha do tempo e três abas: **Implantação** (regras, locais, evidências, compromissos), **Suporte** (ticket TKT-S01 e a triagem do X-04), **CS** (saúde, pista, conteúdos).
- **Comando de demo:** botão "Avançar até o pós go-live (10/12/2026)", que reaproveita a lógica de "Avançar tempo" (I-13).
- **Estados:** vazio ("Nenhuma reunião registrada"), carregando, sucesso, erro com queda rotulada.
- **Corte:** abas viram seções de uma só página; ou só o painel do Suporte.

## 4. Como entram no roteiro (cerca de 1 minuto depois da cena principal)

1. "Avançar até o pós go-live (10/12/2026)" abre a S-07 e mostra o dossiê gravado.
2. **Suporte (X-04):** o ticket de Helena chega; o Prumo mostra `REG-07`, a configuração divergente e a resposta sugerida; o analista decide.
3. **CS (X-07, X-08, X-02, X-09):** a conta Serra do Sabiá, a pista de Meio Ambiente e a mensagem para o secretário; o CSA aprova.
4. Frase: "É o mesmo registro percorrendo as três fases; o que vimos de Suporte e CS é a ideia em ação, com dados fictícios."

## 5. Tempo e prioridade (honesto)

- O núcleo ocupa a janela até o congelamento (14:30). Estas propostas **só entram** (a) depois de S-03 e do pipeline R-1 estarem P3, ou (b) se a equipe mover o congelamento (decisão dela).
- Primeira onda ≈ 150 min de trabalho somados (X-01 20, X-02 20, X-08 25, X-10 40, X-04 45), divididos por 3 pessoas em paralelo ≈ 50–60 min de relógio. Segunda onda ≈ 100 min. Se faltar tempo: manter X-01, X-04 e X-08; o resto vira visão no slide.
- Regra do portal: "poucos objetivos, bem atacados". Máximo de **uma** extensão real em cada fase (Suporte: X-04; CS: X-08); as demais, rotuladas como simuladas ou visão.

## 6. Pontos a validar com o demandante

1. O ticket de suporte hoje chega com as regras locais configuradas na implantação, ou o analista pergunta de novo?
2. Quem decide se um ticket é "regra configurada" ou "erro de configuração" e quanto tempo isso consome?
3. O CSA recebe o histórico da implantação ao assumir a conta?
4. A lembrança por WhatsApp (envio simulado) está dentro do que a Aprova faria hoje, ou há restrições?

## 7. Impacto nos documentos (pendente de confirmação da equipe)

`experiencia.md` (S-07, novas interações I-17..I-20, falas novas), `dados-mock.md` (`DEMO_NOW_POS`, ids `REG-`, `TKT-S01`, prefeituras fictícias), `stack.md` §7 (R-4 triagem, R-5 conteúdo), `INSTRUCTIONS/` (05, 06), `plano-implementacao.md` (tarefas P1 após `T-06`), `ESTADO.md` §10 (retirar da gaveta). Nada disso foi alterado ainda.
