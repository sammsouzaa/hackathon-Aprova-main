# Briefing do desafio

| Campo | Valor |
|---|---|
| Status / versão / hora | ETAPA 2 em andamento · escolha confirmada (D') · v2 · 24/10/2026 ~11:20 (contador do portal marcava "Faltam 7h 19min" para 17:00) |
| Escriba | Claude Code (agente) |
| Base | Portal oficial (fonte primária): `https://zenith.aprova.com.br/hackathon.html` ("Hackathon Aprova — Guia do Participante"); `D08` §1 e §5; `D01` §3.5, §6, §8, §10 |

**Como o portal foi lido [FATO, observado nesta sessão]:** página aberta no navegador embutido; texto integral da `<main>` extraído; as abas **Suporte / Implantação / CS** da seção "Desafios" foram clicadas uma a uma e o texto de cada uma lido. A página tem **0 links** (`<a>`), **0 PDFs/anexos** e nenhum elemento `<details>`. Não há material complementar vinculado. Não vi a página renderizada em captura de tela (só texto/DOM). Nenhum DOCUMENTOS_OFICIAIS nem TEXTO_DO_DESAFIO foi informado (campos vazios no prompt).

## 1. Regras do evento (perguntar nos primeiros 15 minutos)

| Regra | Resposta | Status | Quem perguntou |
|---|---|---|---|
| **Entrega exigida** (aplicação funcional? protótipo? vídeo? URL? repositório?) | **Link do repositório Git via QR code até 17h** (sem tolerância), com: repositório acessível aos jurados; **pasta `INSTRUCTIONS`** (obrigatória) com as instruções do agente; **README** com o problema escolhido e como rodar; **demo funcionando ou vídeo de backup**. Prazo de "Finalizar demo, README e INSTRUCTIONS" a partir das 16h. Fonte: portal, seções "Regras", "Checklist do time", "Cronograma". Mensagem do portal: "construa uma solução agêntica". | `[FATO]` | portal |
| Critérios de avaliação e pesos | **Não há lista de critérios nem pesos.** O portal diz só: "O que pesa é o nível da entrega, não o desafio escolhido"; "Nenhum desafio vale mais"; "Os jurados precisam enxergar quais instruções o agente segue e o que cada uma faz". Banca de 3 a 5 jurados; os jurados escolhem o top 3. (Os critérios do desafio 3 — automação do trabalho do CSA, novas conexões, engajar stakeholders — são do enunciado, não da banca.) | `[FATO]` parcial · pesos `[A]` | portal |
| Tempo e formato do pitch; hora-limite; onde entregar | Hora-limite 17h, entrega pelo QR code `[FATO]`. Apresentações e premiação "depois" das 17h `[FATO]`. **Pitch aberto, de 5 a 10 minutos**, para explicar o contexto e mostrar a solução/o que foi desenvolvido (informado pela equipe em 24/10 após as ~09:50; não consta no portal). | `[FATO]` (equipe) | equipe |
| Código/ideia/bibliotecas prévios permitidos? | O portal não menciona. | `[A]` | |
| IA dentro do produto: exigida, permitida ou proibida? | **Exigida na prática:** "solução agêntica"; agentes permitidos: **Claude Code, Codex ou agentes open source**. Dica: "Agente + código clássico". | `[FATO]` | portal |
| Dados/API/ambiente fornecidos? Podem sair do local? | O portal **não fornece dados, API nem ambiente** e não cita restrição de envio a serviço externo. | `[A]` | |
| Rede: Wi-Fi existe? Restrições? | Não consta no portal (o anúncio em imagem, D08 §1, também não). | `[A]` | |
| Contato de mentoria (nome, canal) | Não consta. | `[A]` | |
| Documentos oficiais recebidos (arquivos, onde estão) | Nenhum além do portal. | `[FATO]` | |
| Cronograma | 9h abertura e desafios · 10h bebidas · 11h30 comida · **16h encerramento (demo, README, INSTRUCTIONS)** · **17h entrega** · depois apresentações e premiação. | `[FATO]` | portal |
| Equipe | O portal não fala de tamanho/composição. D08 §1 (anúncio em imagem) dizia times de 3: 1 da Aprova + 1 de fora + 1 livre. | `[A]` | |

**Divergências portal × base (prevalece o portal; nada apagado):**
- **D1.** D08 §1 cita ferramentas "Claude, Codex, Cursor e o que mais você usar"; o portal lista **Claude Code, Codex ou agentes open source** e não cita Cursor nem Google AI Studio. Consequência: o fluxo "AI Studio → Claude Code" do kit **não está autorizado nem vetado** `[A]`.
- **D2.** D08 §1 tratava o evento como "protótipo/demonstração" sem regra de entrega; o portal exige **repositório + `INSTRUCTIONS` + README + demo** e pede **solução agêntica**. Um protótipo só visual **não cumpre** o que o portal pede (ver §6 e §9).
- **D3.** D08 §1 listava premiação (R$ 2.000 / 1.000 / 500) e inscrição por QR code; o portal só diz "top 3" e não cita valores `[A]`.
- **D4.** O portal diz "sem depender de reunião"; o demandante, em conversa com a equipe (24/10, relato de segunda mão), disse que **a reunião e o prazo ficam**: a meta é cortar reuniões desnecessárias e de repetição ("bola de neve"). A equipe adotou a leitura do demandante `[A]` (confirmar com um organizador se a banca lê de outro modo). Nenhum dado/exemplo da Aprova será fornecido à equipe `[FATO]` (relato da equipe).

## 2. Os desafios (literal)

Introdução comum (portal, "Desafios"): a Aprova fornece soluções para gestão pública, principalmente processos eletrônicos; os contratos cobrem cada vez mais a prefeitura toda, mas nem todas as secretarias se engajam ao mesmo tempo; "Cliente ocupado, pouco técnico e que vive no WhatsApp vale para os três."

> **Desafio 1 — Suporte:** "Como resolver mais tickets, mais rápido, com tickets melhores desde a abertura?" — O volume de tickets supera a capacidade do time. Muitos chegam incompletos, o que gera várias interações, estoura o SLA e aumenta as reclamações por demora. *(portal, aba Suporte)*
> **Desafio 2 — Implantação:** "Como coletar e validar a regra de negócio de ~100 processos sem depender de reunião?" — 12–13 secretarias e ~100 processos por prefeitura; meta de 45–60 dias; ~10 processos/dia por implantador. Com 4 projetos de prefeitura toda ao mesmo tempo: ~400 processos em ~40 dias úteis; "por reunião, a conta não fecha" e sobra o protocolo genérico (rápido, sem regras, pouca adesão). *(portal, aba Implantação)*
> **Desafio 3 — CS:** "Como tirar o CSA da operação para gerar valor e expansão com quem decide?" — Depois da implantação, o CS cuida do relacionamento com diretores e secretários para renovação e expansão; na prática o CSA fica preso em bugs e assuntos operacionais. *(portal, aba CS)*

| # | Quem pede | O que quer | O que proíbe | Dado/API fornecido |
|---|---|---|---|---|
| 1 | Aprova (Suporte) [FATO: portal] | Mais capacidade (tickets no SLA, menor tempo médio, mais tickets/analista, menos pendentes/vencidos); mais previsibilidade (menos reclamações por demora, mais satisfação, menos tickets parados); abertura melhor (menos interações por ticket, menos pedidos de complemento, mais tickets resolvíveis na 1ª análise); menos tickets abertos via chat e Pylon | nada declarado | nenhum |
| 2 | Aprova (Implantação) [FATO: portal] | Menos horas de reunião por processo; menos idas e vindas até a regra completa; menos tempo para validar formulário clonado; mais processos no ar com regras inteligentes, não como protocolo genérico | nada declarado | nenhum |
| 3 | Aprova (CS) [FATO: portal] | CSA que consegue: superar bugs/bloqueios rápido ou de forma assíncrona; automatizar troca de informações com stakeholders operacionais; ver com dados quais contas são mais problemáticas; criar materiais personalizados com os resultados obtidos; mostrar tudo que a plataforma faz e captar pistas de expansão; chegar a secretários/diretores de outras secretarias com conteúdo para cada um | nada declarado | nenhum |

## 3. Frase única por desafio

1. **Suporte.** O **analista de suporte** (Aprova) precisa **resolver mais tickets dentro do SLA**, hoje **recebendo tickets abertos por munícipes/analistas da prefeitura (chat da plataforma e Pylon) sem as informações necessárias e pedindo complemento em várias interações**, para ter **tickets completos desde a abertura, menos interações e menos vencidos**. `[?]` hoje a triagem/pedido de complemento é feito manualmente? quais agentes o analista já usa?
2. **Implantação.** O **implantador** (Aprova) precisa **coletar e validar a regra de negócio de ~100 processos por prefeitura em 45–60 dias**, hoje **por reuniões e pedidos assíncronos que quase nunca voltam, com insumos picados (PDF de lei, foto de formulário, planilha, print) e validação só testando um formulário clonado por vez**, para **ter as regras completas com poucas reuniões e mais processos no ar com regras inteligentes**. `[?]` formato real da "cidade modelo"; quantos formulários clonados; quem valida na prefeitura.
3. **CS.** O **CSA** (Aprova) precisa **gerar valor e expansão com secretários, prefeitos e diretores**, hoje **preso em bugs e assuntos operacionais**, para **automatizar o operacional, criar conexões e engajar quem decide**. `[?]` quais dados de conta existem (uso, tickets, NPS)? como o CSA acompanha as contas hoje?

## 4. Público e dor (fato / hipótese / aberto)

Registrado para os três desafios (a escolha é da equipe; o preenchimento fino acontece na Etapa 2 sobre o escolhido).

| Item | Conteúdo | Rótulo |
|---|---|---|
| Público imediato (cargo/papel, não "o cidadão") | **Suporte:** analista de suporte (usa/já usa agents), analista da prefeitura (abre chamados, nem sempre manda toda a informação), requerente/munícipe (abre pelo chat da plataforma sem domínio técnico), CSA (sente a insatisfação). **Implantação:** implantador (adapta formulários, configura, testa, treina), analistas da prefeitura (têm a regra; projeto compete com a operação), secretário/diretor (decide, pouco tempo, não passa a regra). **CS:** CSA; secretário (economic buyer, sem tempo, "mal liga o computador"); prefeito (maior decisor, vive no WhatsApp); diretores e servidores (focados em tickets, riscos pessoais, sem incentivo para a Aprova expandir). | `[FATO]` (portal, "Personas") |
| Dor central (como é feito hoje, onde trava) | **Suporte:** tickets incompletos → várias interações → SLA estourado → reclamações. **Implantação:** "A regra não chega" (está na cabeça dos analistas); "Chega sem padrão" (PDF, foto, planilha, print, texto solto no ticket); "Só se valida testando" (formulários clonados da cidade modelo, particularidades só no teste, um por vez). **CS:** CSA preso em bugs/operacional; sem tempo/atenção de quem decide. | `[FATO]` (portal); como cada tarefa é feita hoje, passo a passo `[A]` |
| Proposta de valor possível | Suporte: ticket fica completo e triado **antes** de chegar ao analista. Implantação: regra coletada e validada de forma assíncrona, em mensagens curtas no WhatsApp, a partir dos documentos que o cliente já tem. CS: conteúdo personalizado por decisor, gerado a partir de dados da conta, e visão de contas problemáticas. | `[HIP]` |
| Diferencial possível | Suporte: perguntas de complemento adaptativas na abertura + completude medida. Implantação: extração com **trecho de origem** + pergunta de validação de 1 toque + painel de progresso dos ~100 processos. CS: material por secretaria + pistas de expansão. | `[HIP]` |
| Pior caso que a solução não pode causar | Resposta/regra errada gravada sem revisão humana (princípio do produto: humano aprova antes de gravar, citar fonte, trilha de auditoria — D01 §3.5, D08 §1). Enviar mensagem a prefeito/secretário errado ou com número inventado (CS). | `[HIP]` (princípio de D01, ALE da empresa) |

## 5. O que o enunciado diz × não diz

| Diz (literal) | Não diz |
|---|---|
| "construa uma solução agêntica e entregue pelo QR code até as 17h" | Quais critérios e pesos a banca usa; tempo do pitch; se a demo é ao vivo |
| "Pasta INSTRUCTIONS no git: Obrigatória. Na apresentação, mostre quais instruções são chamadas, como e qual a responsabilidade de cada uma" | Formato esperado de `INSTRUCTIONS` (arquivos `.md`? skills? `CLAUDE.md`/`AGENTS.md`?) |
| Agentes permitidos: "Claude Code, Codex ou agentes open source" | Se Google AI Studio / Gemini / outros modelos e IDEs são aceitos; qual provedor/chave de LLM é fornecido |
| "Nenhum desafio vale mais"; "O que pesa é o nível da entrega" | O que define "nível da entrega" |
| "Resolver 2 de verdade vale mais que tocar em todos" (card "Poucos objetivos, bem atacados"; no contexto, objetivos listados do desafio) | Se "2" se refere a 2 objetivos do mesmo desafio (leitura mais provável, `[HIP]`) ou a 2 desafios |
| "Mostre o indicador que mexe: diga qual métrica do desafio sua solução melhora e como" | Se haverá linha de base real; **nenhum número de Suporte ou CS é fornecido** (só os de Implantação: 12–13, ~100, 45–60, ~10/dia, ~400 em ~40 dias úteis) |
| "Use o canal real do cliente: prefeito, secretário e analista vivem no WhatsApp" | Se há conta/API do WhatsApp disponível; se simular o canal é aceito |
| "Agente + código clássico: os desafios pedem uma experiência completa, não só um prompt" | Que parte precisa ser executável ao vivo |
| "Plano B para a demo: um vídeo curto salva a apresentação" | Quando/como o vídeo é entregue (dentro do repo? link?) |
| Nenhum dado, API, PDF, exemplo de ticket ou documento de processo foi fornecido | Se existem dados anonimizados; se podem sair para serviço externo |

## 6. Restrições (dados, tecnologia, proibições, prazo)

- **Prazo duro:** 17:00, QR code, "sem tolerância" `[FATO]`. 16:00 começa o encerramento (demo, README, INSTRUCTIONS) `[FATO]` → tempo efetivo de construção ≈ 9h–16h menos o tempo de decisão/almoço `[HIP]`.
- **Entregável é repositório Git** com `INSTRUCTIONS` legível, README (problema + como rodar) e demo funcionando ou vídeo `[FATO]`. **Consequência para o kit:** a pasta `INSTRUCTIONS` e o README são itens P0 do plano; o selo e a rotulagem real × simulado vão também para o README.
- **Agentes permitidos:** Claude Code, Codex ou open source `[FATO]`. Uso do AI Studio `[A]` (ver §7, pergunta 1).
- Não há dados, API, ambiente nem exemplos fornecidos `[FATO: ausência no portal]` → tudo fictício e sintético (regra do kit); dados reais da Aprova/prefeituras `[A]`.
- Wi-Fi/restrição de rede `[A]`; chave de API de LLM `[A]` (a equipe deve testar uma chamada real nos primeiros minutos, D08 §4).
- Código prévio `[A]` → não copiar código de `D05`/`D09_kit_prompts_projetos.md`; só ideias e boilerplate genérico.

## 7. Perguntas feitas e respostas

| Hora | Pergunta | Quem respondeu | Resposta | Decisão que habilita |
|---|---|---|---|---|
| ~09:40 | (Nenhuma pergunta feita à organização até agora; as 7 abertas estão em `ESTADO.md` §8.) | — | — | — |
| ~11:00 | Conversa da equipe com o demandante (Aprova). Fatos relatados: já existe chat de contexto por cliente (texto, imagem, PDF, doc; WhatsApp serve sobretudo para cobrança de entregas); o implantador junta o contexto, marca a reunião e preenche um formulário com o cliente a partir da cidade/documento modelo; depois consolida e entrega ao agente deles, que altera o sistema; o ciclo se repete. Já existem o chat, o agente que interpreta o conteúdo e o agente que altera o sistema. **A reunião fica**; querem evitar reuniões desnecessárias. Sem acesso a dados deles. | demandante (via equipe) | relato `[FATO]` de segunda mão | habilita a direção D' (§9) |
| ~10:xx | Respostas internas da equipe sobre a ideia B' (não vieram da organização): "Superior" = tech leader; pendências respondidas pelo próprio Superior, em painel dele, que contata a prefeitura por fora (camada de retorno à prefeitura: talvez, sem certeza); p3.2 é continuação do p3; o Superior sobe toda a documentação e o agente a organiza; mascote desktop preferido porque os usuários são desenvolvedores; critérios do p5 aprovados em 1 clique. | equipe | `[DEC]` parcial só após confirmação formal; hoje `[HIP]` | habilita B' (ver §9) |

**Perguntas abertas (ordenadas pelo quanto mudam a decisão), com o que assumiremos sem resposta:**

1. **Google AI Studio (e modelo Gemini) é aceito, dado que o portal lista só Claude Code, Codex e agentes open source?** Assumiremos: AI Studio só para esboço visual descartável; todo o código que entra no repositório é escrito/revisado no Claude Code e declarado no README. Se for vetado: pular T-00 e gerar a base direto no Claude Code.
2. **Quais critérios e pesos a banca usa e o que é "nível da entrega"?** Assumiremos: agente real e observável + `INSTRUCTIONS` legível + indicador explícito + demo estável; visual vem depois.
3. **Tempo e formato do pitch; demo ao vivo é obrigatória ou o vídeo vale?** Assumiremos: ~5 min, demo ao vivo com vídeo de backup gravado até 16h.
4. **Há dados de exemplo (tickets, documentos de processos, regras) e eles podem ser enviados a um LLM externo?** Assumiremos: não; tudo sintético, em fixtures do repositório.
5. **Qual provedor/chave de LLM podemos usar e há Wi-Fi?** Assumiremos: API do Claude com chave da própria equipe, só no servidor; queda gravada e rotulada.
6. **Código/ideia/bibliotecas prévios são permitidos?** Assumiremos: só boilerplate genérico e dependências públicas, nada de projeto anterior.
7. **Há integrante da Aprova na equipe (anúncio dizia 1 da Aprova + 1 de fora + 1 livre) e ele pode validar a realidade do processo? Quais são as habilidades da equipe?** Assumiremos: sem acesso a especialista; o domínio da equipe (nota D) fica neutro (3) até a equipe informar.

## 8. Comparação com a base (≤ 5 linhas; só o que muda uma decisão)

Consultas feitas: D01 (§3.5, §6, §8 OPP-001/002, §10), D08 (§1, §4, §5.1–5.2), D03:SOL-005, D04:PROB-021 (índice), D07 (busca de WhatsApp/CMB). 5 consultas por identificador, nenhuma além do limite.

| Problema / necessidade do desafio | Onde olhar (documento, seção ou ID) | Classificação (conhecido / parcialmente previsto / novo) | O que muda na decisão |
|---|---|---|---|
| D1 Suporte: tickets incompletos, triagem, resposta ao analista | `D03:SOL-005` (triagem e roteamento, MVP definido); `D01:OPP-002`; `D07:CMB-010` (assistente com citação e recusa) | **Parcialmente previsto.** A base cobre triagem/classificação e rascunho de resposta; **não cobre** a coleta ativa do complemento na abertura (guiar o requerente a completar o ticket) nem o canal Pylon/WhatsApp. | Reaproveitar o desenho de SOL-005 (categoria, prioridade, justificativa, pedido de informação faltante, regra determinística para crítico, humano confirma). A "abertura guiada" é o que a equipe acrescenta. Cuidado: provável desafio mais disputado `[HIP]`. |
| D2 Implantação: coletar e validar regra de ~100 processos de forma assíncrona | `D01:OPP-001` (assistente de parametrização a partir de PDF/lei, com trecho de origem, aprovar/editar, JSON); `D04:PROB-021` (implantação em município pequeno, evidência "Fraca") | **Parcialmente previsto.** OPP-001 cobre extração de campos/documentos/etapas de uma fonte com referência ao trecho; **não cobre** coletar a regra que **não está escrita** (está na cabeça do analista), validar por mensagens curtas no WhatsApp, nem acompanhar ~100 processos × 12–13 secretarias. Evidência de PROB-021 é fraca. | Extração com trecho de origem vem pronta; o novo é o ciclo **pergunta curta → resposta no WhatsApp → regra validada** e o painel de progresso. Exige amostras sintéticas de documentos. |
| D3 CS: conteúdo por decisor, saúde de contas, pistas de expansão | `D03` (família de geração de texto/resumo; busca por SOL em CS não retornou ficha equivalente); nenhuma ficha D04 específica de CS/renovação | **Novo** (sem ficha equivalente achada em consulta limitada). | Menos reaproveitamento; e os "resultados obtidos" que o CS pede exigem dados de conta que **não foram fornecidos** → risco alto de métrica inventada. |

**Conhecimento aplicável:** princípio humano-aprova-antes-de-gravar, citar fonte e trilha de auditoria (D01 §3.5, D08 §1); plano de demonstração de `D03:SOL-005`; padrões de IA em `D05`/`D02` só para desenhar a integração real. **Não se aplica:** `D07` assume "WhatsApp fora do MVP" e infraestrutura de MVP; o portal pede WhatsApp como canal e agente executável, então essas premissas foram revertidas aqui. As fichas de `D01` descrevem a Aprova por fontes públicas e são `ALE`/`HIP`, não o processo interno real.

## 9. Alternativas de solução e desafio escolhido (pontuação leve)

**Alternativas (conceitos de experiência; cada uma atende um dos desafios, e a equipe escolhe UM):**

**A. Suporte — "Ticket completo na primeira abertura".**
- *O que o avaliador vê/faz:* lado esquerdo, o requerente conversa num chat tipo WhatsApp/chat da plataforma e descreve o problema solto; o agente faz as perguntas que faltam (adaptadas à categoria) e fecha um ticket estruturado. Lado direito, a fila do analista de suporte mostra ticket com categoria, urgência, **completude (%)**, risco de SLA e rascunho de resposta com artigo citado.
- *Jornada (7 passos):* 1 requerente descreve o problema; 2 agente classifica e detecta o que falta; 3 faz 2–3 perguntas curtas; 4 requerente responde (texto/print simulado); 5 ticket sai completo e triado na fila; 6 analista abre, vê resumo + artigo citado + rascunho; 7 aprova/edita e responde; painel mostra interações por ticket antes × depois.
- *Público/dor:* analista de suporte e requerente; ticket incompleto → várias interações → SLA.
- *Diferencial:* a **completude é medida e cobrada na abertura**, não só a triagem depois.
- *Real:* chamada de LLM que classifica, calcula o que falta e gera perguntas e rascunho (saída estruturada), sobre ~30 tickets sintéticos. *Simulado e rotulado:* canal (chat, não WhatsApp real), integração Pylon, SLA/tempos, métricas. *Adiado:* integração real, aprendizado contínuo.
- *Critérios do desafio atendidos:* menos interações por ticket, menos pedidos de complemento, mais resolvíveis na 1ª análise; SLA como indicador secundário.
- *Risco principal:* é o desafio onde o analista "já usa agents" `[FATO]` e é provável que muitas equipes escolham; diferenciar pela abertura guiada. Só ~7 passos de UI; barato.

**B. Implantação — "Regra validada em mensagens, sem reunião".**
- *O que o avaliador vê/faz:* o implantador arrasta os insumos de uma secretaria (PDF de lei, foto de formulário, planilha, print); o agente extrai por processo a regra (campos, documentos exigidos, etapas, prazos) **com trecho de origem**, marca o que **falta/está ambíguo** e gera 1–3 perguntas de validação para o analista da prefeitura, entregues como mensagens curtas estilo WhatsApp (responder "Sim / Não / Corrigir"). As respostas atualizam o processo para "regra validada" e geram o rascunho de formulário/fluxo. Painel mostra ~100 processos × 12–13 secretarias por estado (sem regra / perguntado / validado / no ar) e horas de reunião evitadas.
- *Jornada (7 passos):* 1 implantador cria prefeitura/secretaria; 2 sobe insumos soltos; 3 agente normaliza e extrai regra por processo com fonte; 4 aponta lacunas; 5 dispara perguntas (mensagens simuladas no WhatsApp); 6 analista responde em 1 toque; 7 regra consolidada + rascunho de formulário; 8 painel de progresso e a conta "400 processos em 40 dias" derivada dos números do portal.
- *Público/dor:* implantador, analista da prefeitura, secretário; "a regra não chega / chega sem padrão / só se valida testando".
- *Diferencial:* ataca a regra que **não está escrita** com perguntas mínimas e assíncronas, mais o painel que mostra a escala dos ~100 processos.
- *Real:* extração multimodal de insumos sintéticos (texto + imagem) com citação do trecho, detecção de lacuna e geração das perguntas, por LLM; consolidação da regra em JSON. *Simulado e rotulado:* envio/resposta no WhatsApp (conversa pré-roteirizada ou o próprio usuário responde no simulador), clonagem de formulário da cidade modelo, teste do formulário, horas "economizadas" (derivadas do modelo de mock, não medidas). *Adiado:* WhatsApp Business real, treinamento, integração à plataforma.
- *Critérios atendidos:* menos reuniões por processo, menos idas e vindas, mais processos com regra inteligente; indicador derivável dos números do portal.
- *Risco principal:* depende de documentos sintéticos bons e de extração multimodal confiável (queda gravada necessária); mais telas que A.

**C. CS — "Copiloto do CSA para chegar a quem decide".**
- *O que o avaliador vê/faz:* painel de contas (prefeituras) ordenadas por saúde (tickets, adoção, secretarias engajadas); ao abrir uma conta, o agente indica a secretaria com pistas de expansão e gera um material de uma página + mensagem curta de WhatsApp personalizados para cada decisor (secretário X, prefeito), para o CSA aprovar e enviar (simulado).
- *Jornada (6 passos):* 1 CSA vê contas por saúde; 2 abre a conta problemática; 3 vê bloqueios abertos e resposta assíncrona sugerida; 4 vê pistas de expansão por secretaria; 5 gera conteúdo personalizado por decisor; 6 aprova e "envia" (simulado).
- *Diferencial:* conteúdo por decisor com os resultados da conta.
- *Real:* geração de conteúdo por LLM a partir de dados da conta. *Simulado:* todos os dados de conta, saúde, envio. *Adiado:* integrações com dados reais.
- *Risco principal:* os "resultados obtidos" e a "saúde" seriam **dados fictícios apresentados como resultado**; sem dados fornecidos, o valor demonstrável é o mais fraco e o risco de parecer métrica inventada é o maior.

**B'. Implantação — "Copiloto de documentação do tech leader" (proposta da equipe, `[HIP]`, ainda não escolhida).**
- *Perfis:* tech leader ("Superior") sobe e padroniza a documentação; desenvolvedores da implantação consultam; a prefeitura fica **fora do produto** (o tech leader a contata por fora).
- *Partes:* p1 padrão de documentação por feature/processo (vira as `INSTRUCTIONS`); p2 funil que organiza o material solto em fichas segundo o padrão; p3 mascote/chat que responde com base na documentação e, quando falta, abre uma pendência no painel do tech leader (modelo de ticket do suporte), que responde ou sobe documento novo e manda reexecutar; p3.2 roteiro curto adaptado ao processo para o que não está em documento, gerando rascunho de regra com pendências priorizadas; p4 estágio de cada desenvolvedor mostrado ao tech leader; p5 critérios de aceite gerados pelo agente e aprovados em 1 clique; "considerar": 2ª prefeitura herda as regras validadas e só pergunta a diferença.
- *Mapeamento às ideias e dores:* p1≈I1/I7 (base de D-b); p2≈I1 (D-b); p3 sem equivalente (conhecimento interno, HIP-008 de D01, não é dor literal do portal); p3.2≈I5 (D-a, depende de quem responde); p4≈I3 (D-d, vínculo fraco); p5≈I4 em versão checklist (D-c parcial); delta≈I6 (D-c parcial, D-d).
- *Risco principal:* o portal fala em coletar a regra **do cliente** "sem depender de reunião"; com o contato à prefeitura fora do produto, D-a fica sem solução direta. Mitigação barata: gerar um pacote de perguntas pronto para o tech leader enviar (WhatsApp simulado), em vez de uma camada completa de retorno.
- *Real:* organização dos insumos, respostas com citação, geração de pendências e de critérios (cada um com um arquivo em `INSTRUCTIONS`). *Simulado:* contato com a prefeitura, ticket do suporte, dados. *Adiado:* shell desktop (stretch), integração real.

**D'. Implantação — "Prumo": mascote que acompanha a reunião do implantador com a prefeitura (confirmada pela equipe às ~11:20).**
- *O que o avaliador vê e faz:* o implantador abre a reunião do dia; o mascote mostra o checklist do que falta perguntar (a partir da cidade modelo, só o que ainda não se sabe), ouve a conversa, marca os itens conforme o cliente responde, alerta quando a fala contradiz um documento (mostrando o trecho; o implantador decide), avisa as lacunas antes do fim, guarda os compromissos ("envio até quinta") e dispara os lembretes ao longo da semana com o link do ticket do cliente. Ao final gera o contexto reunido, para o agente da empresa.
- *Jornada (8 passos):* preparar reunião → consentimento → reunião ao vivo (checklist marcando) → alerta de contradição → compromisso guardado → fechamento com lacunas → resumo aprovado e enviado ao agente (simulado) → lembretes e resposta do cliente no ticket (simulado).
- *Dor e público:* implantador (usuário), analista da prefeitura (fala na reunião e responde o ticket); ataca D-a (cobrança do que "quase nunca volta") e a reunião de repetição; D-b já resolvido pela Aprova; D-c parcial (contradição contra o modelo); D-d parcial.
- *Diferencial:* conhece o contexto e a cidade modelo e atua **durante** a reunião, algo que a transcrição genérica de videoconferência não faz.
- *Real:* análise de trechos da transcrição por LLM (marca checklist com evidência, detecta contradição com trecho, extrai compromissos, gera o resumo); transcrição ao vivo só se testada (stretch). *Simulado e rotulado:* lembretes (tempo acelerado), ticket e envio ao agente, dados, cidade modelo. *Adiado:* captura de áudio de qualquer plataforma, integração real. *Plataforma (decisão de 24/10 ~12:00):* mascote desktop (Electron) só na reunião; pendências e lembretes na web.
- *Risco principal:* áudio ao vivo (rede, permissão do navegador, qualidade em português) → três níveis de queda (ao vivo → áudio gravado → transcrição roteirizada, sempre rotulados).
- *Nota indicativa `[HIP]`:* V5 · C4 · A4 · D3 · F3 → ≈ 19. A escolha não veio da nota, e sim da validação com o demandante.

**Notas 1–5 por critério** (critérios da banca desconhecidos `[A]`; pesos padrão D08 §6.1 não aplicados; D = neutro 3 `[HIP]` até a equipe informar suas habilidades):

| Critério | Desafio 1 — A (Suporte) | Desafio 2 — B (Implantação) | Desafio 3 — C (CS) |
|---|---|---|---|
| **V** Valor demonstrável: quanto uma interface consegue **mostrar** a solução | 4 | 5 | 3 |
| **C** Clareza da dor e do público | 5 | 5 | 3 |
| **A** Aderência aos critérios da banca (só o que o portal diz: agente + código clássico, WhatsApp, indicador, INSTRUCTIONS) | 4 | 5 | 3 |
| **D** Domínio da equipe no tema `[HIP]` | 3 | 3 | 3 |
| **F** Viabilidade em ~4 h depois da base (telas, dados, interações, funcionalidade real) | 4 | 3 | 3 |
| Exige funcionalidade real? Parte mínima? (sim derruba F) | Sim: 1 chamada de LLM com saída estruturada (classificar + o que falta + perguntas + rascunho) | Sim: extração de insumo com citação + geração de perguntas (LLM); texto é o caminho barato, imagem/PDF sobe o risco | Sim: geração de conteúdo por LLM; o restante pode ser dado fictício |
| **Total (V+C+A+D+F)** | **20** | **21** | **15** |

**Recomendação [HIP, a equipe decide]: B (Implantação).** Motivo: é o desafio com a dor mais quantificada no próprio portal (a conta de ~400 processos em ~40 dias dá um indicador com número de origem) e com o menor reaproveitamento da base (a ficha D01:OPP-001 cobre só a extração), o que o diferencia; usa WhatsApp como canal central e mostra bem numa interface (painel de ~100 processos + validação em mensagens). Empate técnico (<3 pontos) com **A (Suporte)**: se a equipe quiser a opção mais barata e segura de construir, escolha A; pelo desempate do template, vale a história mais fácil de contar em 3 minutos, e A é a mais simples de explicar, B a mais memorável. C não é recomendada (dados de resultado fictícios, menor valor demonstrável).

**Parte mínima REAL conforme a entrega exigida (aplicação funcional + INSTRUCTIONS):** o portal pede solução agêntica e `INSTRUCTIONS` legível, então o **agente precisa executar de verdade** no escolhido: A = classificação/completude/perguntas por LLM; B = extração com fonte e geração de perguntas por LLM (mínimo: texto; imagem/PDF como extra). Impacto no plano: sai tempo de polimento visual, entram T-xx para o servidor com a chamada de IA, fixtures sintéticas, queda gravada rotulada, pasta `INSTRUCTIONS` (uma instrução = uma responsabilidade, nomeada) e README. Isso muda a prioridade 2 do kit (visual) para abaixo do agente real, até a equipe responder a pergunta 2.

Escolhido pela equipe: **Desafio 2 (Implantação), direção D' ("Prumo", mascote de reunião)** `[DEC]` às ~11:20 de 24/10/2026 — por quê: encaixa no fluxo real descrito pelo demandante (a reunião fica; o ganho é cortar reuniões de repetição); reaproveita o que a Aprova já tem (chat de contexto, agente que interpreta, agente que altera o sistema) em vez de reconstruí-lo; a captura do áudio de reunião justifica o programa desktop.
Descartados: Desafio 1 (Suporte) e 3 (CS) — Implantação foi a tendência da equipe e tem a conta quantificada no portal; versão 1 (funil + página do analista da prefeitura) — a Aprova já tem chat e agente de interpretação; versão 2 (tech leader × desenvolvedor) — leitura errada de "Implantação" (a relação é com a prefeitura); B (Implantação, cliente no centro) — substituída por D'. Empate (< 3 pontos): escolha o de história mais fácil de contar em 3 minutos.

**Para a etapa seguinte considerar (≤ 5 linhas):**
1. A entrega é repositório + `INSTRUCTIONS` + README + demo/vídeo até 17h: criar essas três peças como tarefas P0, não como acabamento final.
2. Pergunta 1 (AI Studio permitido?) bloqueia o desenho de T-00; sem resposta, usar AI Studio só como esboço e declarar.
3. O portal não fornece dados nem números de Suporte/CS: todo número de tela é fictício e rotulado; só os números de Implantação (12–13, ~100, 45–60, ~10/dia, ~400/~40) têm origem.
4. Não integrar WhatsApp real sem confirmar viabilidade; simular o canal com interface estilo WhatsApp e rotular.
5. Reservar vídeo de backup (portal recomenda) e fechar o código às 16h, quando o portal manda finalizar demo/README/INSTRUCTIONS.
