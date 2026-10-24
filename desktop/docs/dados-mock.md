# Dados fictícios e cenário

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · planejamento dos dados; os arquivos ainda não existem |
| Dono | D |
| Base | `experiencia.md` §2; `proposta.md` §5 |

## 1. Cenário e "hoje" fixo

Data de referência (`DEMO_NOW`): **segunda-feira, 26/10/2026, 14:00** `[DEC]` (fictícia; o evento real é sábado 24/10). Cenário em 2 linhas: a implantadora Marina Duarte reúne-se com a analista Helena Prado, da Prefeitura de **Serra do Sabiá** (município **fictício**), para coletar a regra do processo "Alvará de construção residencial", clonado da "Cidade Modelo" (também fictícia). Na reunião o Prumo marca o checklist, pega a contradição do recuo e guarda dois compromissos; três dias depois cobra e fecha um deles pelo ticket.

Todas as regras, valores e artigos citados são **inventados**; não representam legislação nem a Aprova.

## 2. Entidades e relações

| Entidade | Campos principais | Quantidade | Relaciona-se com |
|---|---|---|---|
| Reunião (REU) | id, processo, prefeitura, data/hora, status (agendada/em andamento/concluída), modo de escuta, fonte da fala | 5 | Processo, Compromisso, Fala |
| Processo (PRC) | id, nome, secretaria, origem (cidade modelo), situação | 5 | Reunião, Item de checklist |
| Item de checklist (CHK) | id, processo, pergunta, valor no modelo, origem, estado (confirmado pelo contexto / pendente / respondido / regra local / lacuna), evidência | 10 (do PRC-01) | Processo, Documento, Fala |
| Documento modelo (DOC) | id, título, artigo/trecho citável, valor | 5 trechos | Item de checklist, Alerta |
| Fala (TRN) | id, canal (implantador / prefeitura), texto, tempo, efeito esperado | 16 (roteiro) | Reunião, Item de checklist |
| Alerta (ALR) | id, fala, trecho do documento, decisão | 1 | Fala, Documento |
| Compromisso (CMP) | id, reunião, o quê, responsável, prazo, estado (pendente/lembrete enviado/recebido/atrasado) | 7 | Reunião, Ticket |
| Contexto do cliente (CTX) | id, resumo dos envios do chat (arquivos, mensagens de cobrança) | 1 para REU-01 | Reunião |
| Ticket (TKT) | id, compromisso, link, resposta, anexo | 7 (1 por compromisso) | Compromisso |

## 3. Personagens e registros-chave (caminho dourado)

Pessoas fictícias: **Marina Duarte** (implantadora, logada) · **Helena Prado** (analista de Planejamento Urbano, Serra do Sabiá) · **Antônio Valério** (secretário, citado). E-mails em `.invalid`.

| ID | Quem/o quê | Papel na história | Estado antes → depois da ação | Aparece em (telas) |
|---|---|---|---|---|
| REU-01 | Reunião "Alvará de construção residencial", 26/10 14:00 | Reunião da demo | agendada → em andamento → concluída | S-01, S-02, S-03, S-04, S-05 |
| PRC-01 | Alvará de construção residencial (clonado da Cidade Modelo) | Processo coletado | 4/10 itens confirmados → 9/10 (1 pendente via compromisso) | S-01, S-02, S-03, S-04 |
| CHK-01..04 | Zonas (ZR1, ZR2, ZC1) · documentos obrigatórios · etapas (técnica → fiscal → emissão) · quem assina (Diretor de Planejamento) | Já confirmados no contexto do chat | confirmado → confirmado | S-02, S-03 |
| CHK-05 | Taxa de ocupação máxima na ZR2 (modelo: 58 %) | Marcado na fala TRN-04 | pendente → respondido (58 %) | S-03 |
| CHK-06 | Coeficiente de aproveitamento na ZR2 (modelo: 1,35) | Marcado na fala TRN-06 | pendente → respondido (1,35) | S-03 |
| CHK-07 | Recuo frontal mínimo (modelo: **4,50 m**, DOC-02) | **Contradição** | pendente → **regra local 3,00 m** | S-03, S-04 |
| CHK-08 | Taxa do alvará (modelo: R$ 3,85/m², DOC-04) | Lacuna no fechamento | lacuna → respondido (igual ao modelo) | S-03 |
| CHK-09 | Prazo de análise (modelo: 20 dias úteis, DOC-05) | Lacuna que vira compromisso | lacuna → compromisso CMP-02 | S-03, S-05 |
| CHK-10 | Área de preservação exige parecer do Conselho do Meio Ambiente? (modelo: não prevê) | Regra local nova | pendente → regra local | S-03, S-04 |
| DOC-02 | "Plano Diretor (modelo, fictício), art. 14 §2: recuo frontal mínimo de 4,50 m na ZR2" | Trecho exibido no alerta | — | S-03 |
| ALR-01 | Alerta: fala TRN-08 (3 m) × DOC-02 (4,50 m) | Momento de destaque 2 | aberto → decidido (regra local) | S-03 |
| CMP-01 | Prefeitura envia a planta de zoneamento atualizada até **qui 29/10** | Compromisso da demo | pendente → lembrete enviado (28/10) → **recebido** | S-03, S-05, S-06 |
| CMP-02 | Prefeitura confirma o prazo de análise com o secretário até **sex 30/10** | Segundo compromisso | pendente → lembrete enviado → pendente (não respondido) | S-03, S-05 |
| TKT-01 | Ticket do CMP-01, com link e anexo "planta_zoneamento_v2.pdf" (fictício) | Resposta do cliente | aberto → respondido | S-05, S-06 |
| RES-01 | Resumo estruturado de REU-01 (regras confirmadas, campos que mudam, 2 regras locais, pendências) | Entrega ao agente (simulado) | rascunho → aprovado → "enviado (simulado)" | S-04 |

### Roteiro da reunião (REU-01; usado como fonte "Roteiro")

| ID | Canal | Fala (resumo; o texto literal das 16 falas está em `base-ai-studio.md` §1, que é o dono) | Efeito esperado |
|---|---|---|---|
| TRN-01 | Implantadora | Abre a reunião; propõe começar pelas zonas | nenhum |
| TRN-02 | Prefeitura | Zonas ZR1, ZR2, ZC1, como no material enviado | confirma CHK-01 (já confirmado) |
| TRN-03 | Implantadora | Pergunta a taxa de ocupação na ZR2 | — |
| TRN-04 | Prefeitura | "Na ZR2 é 58 % do lote" | CHK-05 ✓ com a frase como evidência |
| TRN-05 | Implantadora | Pergunta o coeficiente de aproveitamento | — |
| TRN-06 | Prefeitura | "1,35 na ZR2" | CHK-06 ✓ |
| TRN-07 | Implantadora | Pergunta o recuo frontal mínimo | — |
| TRN-08 | Prefeitura | "Aqui a gente usa 3 metros de recuo frontal" | **ALR-01** (DOC-02 diz 4,50 m) |
| TRN-09 | Implantadora | "No seu município é 3 metros; vamos registrar como regra local" | decisão: Aceitar como regra local |
| TRN-10 | Prefeitura | Área de preservação exige parecer do Conselho do Meio Ambiente antes da análise | CHK-10 ✓ regra local |
| TRN-11 | Prefeitura | "A planta de zoneamento atualizada eu te mando até quinta" | **CMP-01** (qui 29/10) |
| TRN-12 | Implantadora | "Vamos encerrar?" (aperta Encerrar) | Aviso de 2 lacunas: CHK-08, CHK-09 |
| TRN-13 | Implantadora | Pergunta a taxa do alvará e o prazo de análise | — |
| TRN-14 | Prefeitura | "A taxa é igual à do modelo, R$ 3,85 por metro quadrado" | CHK-08 ✓ |
| TRN-15 | Prefeitura | "O prazo eu confirmo com o secretário e te respondo até sexta" | **CMP-02** (sex 30/10) |
| TRN-16 | Implantadora | Encerramento | — |

## 4. Variedade de estados

| Coleção | Distribuição planejada | Item urgente | Item com problema |
|---|---|---|---|
| Reuniões (5) | 1 hoje (REU-01) · 2 agendadas (28/10 Habite-se; 30/10 Certidões) · 2 concluídas (20/10 Licença ambiental simplificada; 14/10 Parcelamento do solo) | REU-01 (hoje 14:00) | REU-04 (Licença ambiental) com compromisso atrasado |
| Compromissos (7) | 2 recebidos (REU-05) · 1 recebido (REU-04) · 1 atrasado (REU-04, prazo 23/10) · 1 pendente (REU-03, prazo 27/10) · 2 novos da demo (CMP-01, CMP-02) | CMP-01 (qui 29/10) | atrasado de REU-04 |
| Checklist PRC-01 (10) | 4 confirmados pelo contexto · 6 pendentes antes da reunião | CHK-07 (recuo) | CHK-09 (prazo, sem resposta na reunião) |
| Alertas (1) | 1 contradição | ALR-01 | — |

Nota (24/10): os compromissos de outras reuniões (REU-03 a REU-05) e as reuniões anteriores e próximas são dados da **plataforma web** (S-01, S-05), não do mascote; o mascote só usa REU-01, CMP-01 e CMP-02.

IDs das reuniões: **REU-01** Alvará de construção residencial (26/10, hoje) · **REU-02** Certidões (agendada, 30/10) · **REU-03** Habite-se (agendada, 28/10) · **REU-04** Licença ambiental simplificada (concluída, 20/10) · **REU-05** Parcelamento do solo (concluída, 14/10). Processos: PRC-01 Alvará · PRC-02 Certidões · PRC-03 Habite-se · PRC-04 Licença ambiental simplificada · PRC-05 Parcelamento do solo (só o PRC-01 tem checklist detalhado).

## 5. Indicadores e gráficos (como são derivados)

| Indicador / gráfico | Pergunta que responde | Calculado de (coleção, campo) | Muda quando… |
|---|---|---|---|
| Lacunas em aberto | O que ainda falta perguntar? | contagem de CHK com estado ≠ confirmado/respondido/regra local, por processo | itens se marcam na S-03 |
| Cobertura do checklist | Quanto da regra está coletada? | CHK respondidos ÷ total, por processo | idem; 4/10 → 9/10 na demo |
| Compromissos atrasados | O que está vencido? | CMP com prazo < `DEMO_NOW` e estado ≠ recebido | "Avançar tempo" ou resposta no ticket |
| Pendências resolvidas sem nova reunião | O lembrete evita nova reunião? | CMP recebidos via ticket após lembrete | I-15 (CMP-01 recebido) |
| Regras locais registradas | Quanto a cidade difere do modelo? | CHK com estado "regra local" | I-08 (decisão) e CHK-10 |

Todos são **indicadores do cenário, não medição**; rótulo na tela. Nenhum depende de dados reais da Aprova.

## 6. Organização dos arquivos

Pasta de dados da base (definida na auditoria; `stack.md` §2): `cenario` (`DEMO_NOW`, município, usuária) · `reunioes` · `processos` · `checklist` · `documentos` · `roteiro` (TRN) · `compromissos` · `tickets` · `contexto` · `respostas-gravadas` (saídas da análise e do resumo, de execução real anterior, datadas) · acesso por um único módulo de dados, nunca dentro dos componentes de tela. Outros arquivos: textos fixos do aviso de gravação.

## 7. Checklist de coerência

```text
[ ] Mesmo nome/identificador em lista, detalhe, painel e notificação
[ ] Contagens do painel = itens das listas (derivadas do mesmo mock)
[ ] Datas plausíveis em relação ao "hoje" fixo
[ ] Usuário logado igual em todas as telas
[ ] O caminho dourado altera os números do painel no sentido certo
[ ] Nenhum dado real; CPF/CNPJ inválidos; e-mails .invalid; nomes e órgão fictícios
[ ] Números não redondos; nada de lorem ipsum
```

Itens específicos: dias da semana conferidos (26/10 segunda; 29/10 quinta; 30/10 sexta) · valores do modelo iguais em checklist, documento e alerta (58 %, 1,35, 4,50 m, R$ 3,85/m², 20 dias úteis) · o trecho que o alerta mostra é literalmente o texto de DOC-02.

## 8. Reset e persistência na sessão

Coleções que aceitam alteração na demonstração: checklist, alertas, compromissos, reunião (status), resumo, tickets, `DEMO_NOW` · onde o estado fica (estado compartilhado; `sessionStorage` se precisar sobreviver a recarregamento) · como reiniciar (botão "Reiniciar demonstração" no cabeçalho; restaura também o relógio) · testado em: [PREENCHER NO EVENTO]
