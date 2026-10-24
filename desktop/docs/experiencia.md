# Experiência a demonstrar

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · rascunho para aprovação da equipe (MARCO-1) |
| Donos | D (fluxo), I (telas), X (interações) |
| Base | `proposta.md` §5; `dados-mock.md` §1 |

## 1. Perfis em cena

| Perfil | Cargo/papel | Quem aparece logado na demonstração | O que ele quer fazer |
|---|---|---|---|
| Implantador | Implantador (Aprova), usa o Prumo | **Marina Duarte** (fictícia) | Chegar à reunião sabendo o que perguntar, sair com a regra completa e os compromissos registrados |
| Analista da prefeitura | Analista de Planejamento Urbano, fala na reunião e responde o ticket | **Helena Prado** (fictícia); não faz login: aparece na transcrição e na página do ticket (S-06) | Explicar a regra do processo e enviar o que ficou combinado |
| Secretário (opcional) | Decide, não passa a regra | **Antônio Valério** (fictício); só citado | — (fora da cena) |

## 2. Fluxo principal (cenário de demonstração)

História em 2 linhas: segunda-feira, 26/10/2026, Marina reúne-se com Helena, da Prefeitura de Serra do Sabiá (fictícia), para coletar a regra do processo "Alvará de construção residencial", clonado da cidade modelo. O Prumo acompanha a reunião, pega uma contradição de recuo, guarda o compromisso da planta e, três dias depois, cobra e recebe a resposta, sem nova reunião.

| Passo | Tela | Ação do avaliador/apresentador | Reação visível | Dado do cenário envolvido |
|---|---|---|---|---|
| F-01 | S-01 | Escolher a reunião "Alvará de construção residencial" | Abre S-02 | REU-01 |
| F-02 | S-02 | Ver o checklist (10 itens: 4 já confirmados no contexto, 6 a perguntar), escolher o modo de escuta e confirmar o aviso de gravação | "Iniciar reunião" habilita | PRC-01, CHK-01..10, CTX-01 |
| F-03 | S-03 | Iniciar a reunião; a fala da prefeitura chega (roteiro, áudio gravado ou ao vivo) | Itens do checklist se marcam com a frase como evidência | TRN-01..n |
| F-04 | S-03 | Aparece o alerta de contradição (recuo frontal 3 m × 5,00 m do modelo); decidir "Aceitar como regra local" | Banner com o trecho do documento; item vira "regra local" e o delta é registrado | DOC-02, ALR-01 |
| F-05 | S-03 | A prefeitura promete a planta de zoneamento até quinta; confirmar o compromisso | Cartão de compromisso com prazo 29/10 | CMP-01 |
| F-06 | S-03 → S-04 | "Encerrar reunião": o Prumo lista as 2 lacunas; perguntar ao cliente; encerrar | Lacunas viram itens respondidos; abre o resumo | CHK-06, CHK-07 |
| F-07 | S-04 | Revisar o resumo estruturado e **Aprovar**; "Enviar ao agente de implantação (simulado)" | Resumo aprovado; contexto reunido gravado; confirmação rotulada como simulada | RES-01 |
| F-08 | S-05 → S-06 | "Avançar 3 dias"; lembrete sai com o link; abrir o ticket do cliente e responder com o anexo | Compromisso vira "Recebido"; indicador de pendências resolvidas sobe | CMP-01, TKT-01 |

## 3. Mapa de telas

| ID | Tela | Objetivo | Entra por | Sai para | Prioridade (P0 fluxo principal / P1 apoio / P2 se sobrar) |
|---|---|---|---|---|---|
| S-01 | Reuniões | Ver as reuniões do dia e a situação de cada processo (lacunas, compromissos) | início | S-02, S-05 | P0 |
| S-02 | Preparar reunião | Contexto do cliente, checklist da cidade modelo (só o que falta), modo de escuta e aviso de gravação | S-01 | S-03 | P0 |
| S-03 | Reunião ao vivo (Prumo) | Transcrição, checklist se marcando, alertas de contradição, compromissos, lacunas ao encerrar | S-02 | S-04, `/mascote` | P0 |
| S-04 | Resumo e contexto reunido | Revisar e aprovar o resumo estruturado para o agente da empresa | S-03 | S-05 | P0 |
| S-05 | Compromissos e lembretes | Lista de compromissos, avançar tempo (demo), lembretes enviados, indicadores | S-01, S-04 | S-06, S-01 | P0 |
| S-06 | Ticket do cliente (simulado) | O que a prefeitura vê no link: responder e anexar | S-05 (link) | S-05 (atualiza) | P0 |
| — | Mascote desktop (Prumo) | O mascote é a janela compacta (480x640, Electron) que **contém S-02, S-03 e S-04** e recebe os lembretes como mensagens; não tem modo "fora da reunião" | ícone da bandeja | — | P0 |
| — | Painel de acompanhamento, critérios de aceite, 2ª prefeitura, histórico | Ideias anteriores | — | — | P2 (só lista; `ESTADO.md` §10) |

### 3.1 Superfícies (decisão de 24/10 ~12:00)

| Superfície | Telas e funções | Dono |
|---|---|---|
| **Mascote desktop** (Electron; só na reunião) | S-02 Preparar (cartão no chat, aviso de gravação), S-03 Reunião ao vivo, S-04 Resumo; lembretes como mensagens do chat; painel do ticket simulado; menu ⋯ ("Avançar 3 dias", "Reiniciar", "Sobre") | I (UI) + X (ligação) |
| **Plataforma web** (fora do mascote) | S-01 Reuniões, S-05 Compromissos e lembretes (lista, cobrança), S-06 página do ticket do cliente, consulta à documentação, reuniões anteriores e próximas | a definir com o colega que faz login, chat e envio de arquivos |

Os dados que nascem no mascote (compromissos, resumo) precisam aparecer na web: contrato de 2 eventos ou dados pré-semeados rotulados como simulados (`ESTADO.md` §8, pergunta 11).

## 4. Navegação

Menu/áreas (≤ 6), **na web**: **Reuniões · Compromissos**; no mascote: abas **Conversa · Checklist** e menu ⋯ (as outras telas abrem pelo fluxo). Itens do menu sem destino real: ficam fora ou abrem o aviso de ação demonstrativa. Reinício: botão "Reiniciar demonstração" no cabeçalho (restaura mocks, checklist, compromissos e relógio da demo; `stack.md` §4).

## 5. Interações simuladas

| ID | Tela | Controle / gatilho | Reação visível | Estado alterado | Mecanismo (estado local, estado compartilhado, mock, servidor) | Real ou simulada; rótulo |
|---|---|---|---|---|---|---|
| I-01 | S-01 | Clicar na reunião; abas Hoje/Agendadas/Concluídas | Abre S-02; lista filtra | reunião ativa | estado compartilhado, mock | real (navegação) |
| I-02 | S-02 | Checklist da cidade modelo | 10 itens com origem (modelo) e marca "já confirmado no contexto" | nenhum | mock | fictício; "Contexto do cliente (simulado)" |
| I-03 | S-02 | Seletor do modo de escuta (gravação com aviso · escuta sem guardar · modo notas) + caixa "Participantes avisados" | Habilita "Iniciar reunião" só com a caixa marcada; troca o rótulo do modo | modo da reunião | estado compartilhado | real (UI); aviso não é validação jurídica |
| I-04 | S-02 | Iniciar reunião | Abre S-03; relógio da reunião começa | reunião `em andamento` | estado compartilhado | real |
| I-05 | S-03 | Fonte da fala: Ao vivo · Áudio gravado · Roteiro (padrão) | Rótulo da fonte sempre visível ("ao vivo" só se ao vivo) | fonte | estado local | roteiro/gravado simulados e rotulados; ao vivo só se P3 |
| I-06 | S-03 | Chega um trecho de fala | Spinner "Analisando…"; item(ns) marcam ✓ com a frase de evidência | checklist, evidências | servidor (LLM) | **real**: "Análise de IA · ao vivo"; queda: "Análise gravada em <data>" |
| I-07 | S-03 | Desmarcar/marcar um item na mão | O item volta/sai de "pendente" | checklist | estado compartilhado | real |
| I-08 | S-03 | Alerta de contradição: Perguntar ao cliente · Aceitar como regra local · Ignorar | Banner com fala e trecho do documento; a decisão atualiza o item e o delta | alerta, checklist, delta | servidor (LLM) + estado | **real** (detecção); decisão humana |
| I-09 | S-03 | Compromisso detectado: Confirmar/Editar prazo | Cartão no painel de compromissos | compromisso | servidor (LLM) + estado | **real** (extração); lembrete é simulado |
| I-10 | S-03 | Encerrar reunião | Aviso listando lacunas e contradições abertas; "Voltar" ou "Encerrar mesmo assim" | status da reunião | estado | real; cálculo por código |
| I-11 | — | (removida) Abrir o mascote: o mascote **é** a janela; S-02, S-03 e S-04 acontecem nela | — | — | — | decisão de 24/10 ~12:00 |
| I-12 | S-04 | Gerar resumo; Editar; Aprovar/Recusar; Exportar JSON; Enviar ao agente | Resumo estruturado (regras confirmadas, campos que mudam, pendências); botão Aprovar; JSON baixa de verdade; envio mostra "simulado" | resumo, reunião `encerrada` | servidor (LLM) + estado | resumo **real**; envio **simulado**: "Envio ao agente (simulado)" |
| I-13 | S-05 | "Avançar tempo (demo)": +1 dia / +3 dias | Relógio da demo muda; lembretes disparam; compromissos vencem | `DEMO_NOW`, lembretes | estado compartilhado | simulado: "Tempo simulado" |
| I-14 | S-05 | Abrir ticket do cliente (link) | Abre S-06 | nenhum | navegação | simulado: "Ticket simulado" |
| I-15 | S-06 | Responder e anexar arquivo (fictício) | Confirmação; no S-05 o compromisso vira "Recebido" e o checklist marca | compromisso, checklist, indicador | estado compartilhado | simulado: "Ticket simulado" |
| I-16 | todas | Reiniciar demonstração | Volta ao estado inicial | tudo | estado | real |

## 6. Estados por tela (só os que aparecem no cenário)

| Tela | Carregando | Vazio | Sucesso | Erro típico |
|---|---|---|---|---|
| S-01 | esqueleto da lista | "Nenhuma reunião hoje" + botão | lista com status | — |
| S-02 | esqueleto do checklist | checklist vazio: "Sem modelo para este processo" + ação | checklist e contexto | contexto indisponível: aviso e seguir sem ele |
| S-03 | "Analisando trecho…" (≤ 5 s) | "Aguardando a fala…" | itens marcados com evidência | análise indisponível → **queda rotulada** "Análise gravada"; ou "Tentar de novo" |
| S-04 | "Gerando resumo…" | "Nada a resumir ainda" | resumo aprovado | falha ao gerar → resumo gravado, rotulado |
| S-05 | esqueleto | "Nenhum compromisso" | lembrete enviado / recebido | compromisso atrasado em destaque |
| S-06 | spinner no botão | — | "Resposta enviada" | arquivo inválido: mensagem acionável |

## 7. Registro de simulações (real × simulado × fictício)

| Elemento | Realidade (real / simulado / fictício) | Como é rotulado na tela | O que dizer no pitch |
|---|---|---|---|
| Dados (município, pessoas, documentos, valores) | fictício | selo permanente "Protótipo demonstrativo · dados fictícios" | "todos os dados são fictícios" |
| Cidade modelo, documentos e regras | fictício | "Documento modelo (fictício)" | "inventamos a cidade modelo; a Aprova tem a real" |
| Chat de contexto do cliente | simulado | "Contexto do cliente (simulado)" | "aqui entraria o chat que a Aprova já tem" |
| Fala da reunião (roteiro, áudio gravado) | simulado | "Roteiro" / "Áudio gravado" na fonte | "esta reunião foi roteirizada" |
| Transcrição de áudio ao vivo | real **só se** testada (P3); senão não aparece | "ao vivo" apenas se ao vivo; mostra qual fonte | "agora é áudio ao vivo" ou "áudio gravado", nunca o contrário |
| Análise do trecho (checklist, contradição, compromisso) | **real** (LLM) | "Análise de IA · ao vivo"; na queda, "Análise gravada em <data>" | "a análise roda de verdade sobre o texto; o implantador decide" |
| Resumo estruturado | **real** (LLM) | "Gerado por IA · ao vivo" / "gravado" | idem |
| Lembretes e passagem de tempo | simulado | "Tempo simulado" | "avançamos o relógio para mostrar a cobrança" |
| Ticket do cliente (S-06) | simulado | "Ticket simulado" | "no produto seria o ticket da própria Aprova" |
| Envio ao agente de implantação | simulado | "Envio ao agente (simulado)" | "o agente da empresa receberia este pacote" |
| Indicadores (lacunas, cobertura, pendências resolvidas) | derivados dos mocks, não medição | "Indicador do cenário" | "números do cenário, não resultado" |
| Aviso de gravação e modos de escuta | UI real; **sem validação jurídica** | aviso no início da reunião | "o aviso existe; a base legal é decisão da Aprova" |

## 8. Fora do escopo (cortado)

| Item cortado | Quando | Motivo |
|---|---|---|
| Funil de insumos soltos e página do analista | 24/10 ~11:20 | A Aprova já tem chat de contexto e agente que interpreta |
| Painel de acompanhamento por desenvolvedor, critérios de aceite, 2ª prefeitura herdando regras (como telas) | 24/10 ~11:20 | Ideias das versões anteriores; vão para `ESTADO.md` §10. O delta aparece só como "regra local" no checklist |
| Importar conversa exportada do WhatsApp | 24/10 ~11:20 | Fora da direção atual |
| Modo "fora da reunião" no mascote desktop | 24/10 ~12:00 | janela compacta serve à reunião; pendências, consulta e histórico vão para a web |
| Programa desktop como stretch | 24/10 ~12:00 | virou parte do plano (Electron), com a janela web compacta como queda |
| Captura de áudio de Meet/Teams instalados e vários participantes | — | depende de captura do sistema e diarização; adiado |
