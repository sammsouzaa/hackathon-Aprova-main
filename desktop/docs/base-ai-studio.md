# Base gerada no AI Studio

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · prompt pronto para colar (§1); resto no evento |
| Dono | X (I na seção 6, D registra) |
| Base | `proposta.md`; `experiencia.md`; `../../D09_kit_desenvolvimento/prompts/02-gerar-prototipo-ai-studio.md`; `../../D09_kit_desenvolvimento/referencias/ai-studio-e-claude-code.md` |

## 1. Prompt enviado ao AI Studio (versão atual, pronto para colar)

> Uso: colar no modo Build do Google AI Studio (uma pessoa, `T-00`). **O uso do AI Studio não está confirmado pela organização** `[A]` (o portal lista só Claude Code, Codex e agentes open source): se for vetado ou a base não servir às 12:15, o **mesmo texto** vai ao Claude Code (`CORTE-1`, `plano-implementacao.md` §5). Todo o texto e os dados abaixo são fictícios; nada vem de material da Aprova.

```text
Você é um(a) designer e engenheiro(a) front-end sênior. Crie a PRIMEIRA VERSÃO de um protótipo de aplicação web chamado "Prumo". O objetivo é uma base visualmente convincente, organizada e fácil de continuar desenvolvendo, e NÃO um produto completo.

CONTEXTO E PROBLEMA
Implantadores de um software de processos eletrônicos para prefeituras reúnem-se com analistas da prefeitura para coletar a regra de negócio de cada processo (por exemplo, alvará de construção), preenchendo com eles um formulário clonado de uma "cidade modelo". O que faltou perguntar, o que a fala do cliente contradiz no documento modelo e o que o cliente ficou de enviar só aparecem depois da reunião, e isso gera novas reuniões de repetição. A reunião continua existindo; o objetivo é não precisar de reuniões desnecessárias.

USUÁRIO PRINCIPAL
Marina Duarte (fictícia), implantadora. Fala com Helena Prado (fictícia), analista de Planejamento Urbano da Prefeitura de Serra do Sabiá (município fictício). Marina é a única pessoa logada, sem tela de login.

PROPOSTA E DIFERENCIAL
O Prumo acompanha a reunião: mostra antes o checklist do que falta perguntar (só o que a cidade modelo ainda não confirmou), marca os itens conforme o cliente responde (com a frase dele como evidência), avisa quando a fala contradiz um documento (mostrando o trecho exato; quem decide é a implantadora), lembra as lacunas antes do fim e guarda os compromissos ("envio até quinta") para cobrar ao longo da semana com o link do ticket do cliente. A diferença para uma ata genérica de videoconferência é que ele conhece o contexto e age durante e depois da reunião.

JORNADA PRINCIPAL (na ordem)
1. Marina abre "Reuniões" e escolhe a reunião de hoje (26/10/2026, 14:00) "Alvará de construção residencial".
2. Em "Preparar reunião" vê o contexto do cliente e o checklist de 10 itens (4 já confirmados pelo contexto, 6 a perguntar), escolhe o modo de escuta e confirma o aviso de gravação; "Iniciar reunião" habilita.
3. Em "Reunião ao vivo", a conversa chega fala a fala; os itens do checklist se marcam com a frase de evidência.
4. Quando a prefeitura diz que o recuo frontal é 3 metros, aparece o alerta de contradição com o trecho do documento (4,50 m); Marina escolhe "Aceitar como regra local".
5. A prefeitura promete a planta de zoneamento até quinta; aparece o cartão do compromisso.
6. Marina clica "Encerrar reunião": o Prumo avisa as 2 lacunas (taxa do alvará e prazo de análise); elas são respondidas; o prazo de análise vira um segundo compromisso.
7. Em "Resumo", Marina revisa o contexto reunido, aprova e "envia ao agente de implantação" (simulado).
8. Em "Compromissos", clica "Avançar 3 dias": os lembretes saem com o link do ticket; ao abrir o ticket do cliente e responder, o compromisso vira "Recebido".

TELAS PRIORITÁRIAS (somente estas)
S-01 Reuniões: lista de 5 reuniões com abas Hoje · Agendadas · Concluídas; cada cartão mostra processo, prefeitura, data/hora, status e número de lacunas e compromissos; três indicadores no topo (lacunas em aberto, compromissos atrasados, pendências resolvidas sem nova reunião); ação principal: abrir a reunião de hoje.
S-02 Preparar reunião: cabeçalho com processo, prefeitura e horário; bloco "Contexto do cliente (simulado)" com 3 envios do chat (lista de documentos em PDF, foto do fluxograma, planilha de zonas); checklist de 10 itens com origem (documento modelo), valor do modelo e marca "já confirmado no contexto"; seletor de modo de escuta (Gravação com aviso · Escuta sem guardar · Modo notas); caixa "Participantes avisados" obrigatória; ação principal: Iniciar reunião.
S-03 Reunião ao vivo: duas colunas. Esquerda: transcrição com falas por canal (Implantadora · Prefeitura) e hora, seletor de fonte (Roteiro · Áudio gravado · Ao vivo) com rótulo sempre visível, controles Pausar e Avançar fala. Direita: checklist com contagem de cobertura, onde cada item marcado mostra a frase de evidência e permite desmarcar na mão; área de alertas de contradição (fala do cliente ao lado do trecho do documento, com Perguntar ao cliente · Aceitar como regra local · Ignorar); cartões de compromisso (o quê, quem, prazo, Confirmar/Editar). Botão Encerrar reunião abre um aviso listando lacunas e contradições abertas, com "Voltar à reunião" e "Encerrar mesmo assim". Há também um botão que abre a versão compacta (coluna estreita de 360 px) na rota /mascote, com checklist e alertas.
S-04 Resumo e contexto reunido: pré-visualização editável com regras confirmadas, campos que mudam, 2 regras locais (recuo frontal 3,00 m; parecer do Conselho do Meio Ambiente em área de preservação) e pendências; botões Recusar e Aprovar, Exportar JSON, Enviar ao agente de implantação (mostra "Envio ao agente (simulado)").
S-05 Compromissos e lembretes: lista de 7 compromissos com selo de estado (pendente, lembrete enviado, recebido, atrasado), filtro e busca; botão "Avançar tempo (demo)" com +1 dia e +3 dias e o relógio da demonstração visível; lembretes enviados listados com o link do ticket; indicadores derivados (compromissos atrasados, pendências resolvidas sem nova reunião).
S-06 Ticket do cliente (simulado): página em coluna única para celular (390 px) com o pedido ("Enviar a planta de zoneamento atualizada"), campo de resposta, anexo fictício e botão Enviar; ao enviar, mostra confirmação e atualiza o compromisso em S-05.

LINGUAGEM VISUAL
Calma, confiável e discreta: o mascote não pode roubar a atenção de quem está em reunião. Tokens (aplicar como variáveis CSS em um único lugar): fundo #f5f7f7; superfície #ffffff; texto #1c1c1c; texto suave #656666; borda #cacccc (divisor #dee0e0); ação principal #0d787e (hover #074a4e, texto branco); marca para ícone e foco #06929f (nunca texto pequeno branco sobre ela); IA: ícone #0891b2, texto #0e7490, fundo #e6f5f8 (usar só em blocos gerados por IA e no painel do Prumo); sucesso fundo #eefff9 texto #055b40; alerta fundo #ffefe7 texto #702600; erro fundo #ffebeb texto #ba1515; info fundo #ebf4ff texto #0856af. Fonte Inter instalada localmente (sem CDN); escala de texto 12, 14, 16, 20, 24, 32; espaçamento 4, 8, 12, 16, 24, 32, 48; raio 8 px em controles, 16 px em cartões; sem sombra nos cartões (sombra só na janela compacta); altura de controle 36/44 px. Barra superior com a marca fictícia "Prumo", menu "Reuniões" e "Compromissos", botão "Reiniciar demonstração" e avatar. Não copie telas, logotipos ou marcas de nenhuma empresa. Hierarquia clara (uma ação principal por tela), espaçamento consistente, contraste adequado, foco visível nos controles, layout responsivo (desktop 1440 px; S-06 em 390 px).

DADOS DE DEMONSTRAÇÃO
Data de "hoje" fixa: segunda-feira, 26/10/2026, 14:00. Município fictício: Serra do Sabiá. Cidade modelo fictícia (documentos citados abaixo). Pessoas: Marina Duarte (implantadora), Helena Prado (analista de Planejamento Urbano), Antônio Valério (secretário, só citado); e-mails terminam em .invalid.
Reuniões (5): REU-01 Alvará de construção residencial, 26/10 14:00 (hoje); REU-02 Certidões, 30/10 (agendada); REU-03 Habite-se, 28/10 (agendada); REU-04 Licença ambiental simplificada, concluída em 20/10; REU-05 Parcelamento do solo, concluída em 14/10.
Checklist do alvará (10 itens): CHK-01 zonas abrangidas (ZR1, ZR2, ZC1), confirmado no contexto; CHK-02 documentos obrigatórios (matrícula, ART/RRT, projeto, certidão negativa), confirmado; CHK-03 etapas (análise técnica, fiscal, emissão), confirmado; CHK-04 quem assina o alvará (Diretor de Planejamento), confirmado; CHK-05 taxa de ocupação máxima na ZR2 (modelo 58%); CHK-06 coeficiente de aproveitamento na ZR2 (modelo 1,35); CHK-07 recuo frontal mínimo (modelo 4,50 m); CHK-08 taxa do alvará (modelo R$ 3,85 por m²); CHK-09 prazo de análise (modelo 20 dias úteis); CHK-10 exigência de parecer em área de preservação (modelo não prevê).
Documentos do modelo (trechos citáveis, literais): DOC-01 "Lei de Uso e Ocupação do Solo (modelo, fictício), art. 8º: na ZR2, taxa de ocupação máxima de 58% e coeficiente de aproveitamento de 1,35."; DOC-02 "Plano Diretor (modelo, fictício), art. 14, §2º: o recuo frontal mínimo na ZR2 é de 4,50 m."; DOC-03 "Código de Obras (modelo, fictício), art. 31: documentos obrigatórios: matrícula do imóvel, ART/RRT, projeto arquitetônico e certidão negativa de débitos."; DOC-04 "Decreto de Taxas (modelo, fictício), art. 5º: taxa de alvará residencial de R$ 3,85 por metro quadrado."; DOC-05 "Código de Obras (modelo, fictício), art. 40: prazo de análise técnica de 20 dias úteis."
Roteiro da reunião REU-01 (16 falas, nesta ordem e com este texto):
1 Implantadora: "Bom dia, Helena. Hoje quero fechar as regras do alvará de construção residencial. Podemos começar pelas zonas?"
2 Prefeitura: "Bom dia, Marina. As zonas são ZR1, ZR2 e ZC1, como mandei no material."
3 Implantadora: "Perfeito. Na ZR2, qual é a taxa de ocupação máxima?"
4 Prefeitura: "Na ZR2 é 58% do lote."
5 Implantadora: "E o coeficiente de aproveitamento?"
6 Prefeitura: "É 1,35 na ZR2."
7 Implantadora: "Agora o recuo frontal mínimo. Qual é?"
8 Prefeitura: "Aqui a gente usa 3 metros de recuo frontal."
9 Implantadora: "Entendi. No seu município é 3 metros, então vamos registrar como regra local."
10 Prefeitura: "Outra coisa: em área de preservação, o projeto precisa de parecer do Conselho do Meio Ambiente antes da análise."
11 Prefeitura: "E a planta de zoneamento atualizada eu te mando até quinta."
12 Implantadora: "Combinado. Acho que podemos encerrar por aqui, certo?" (a reunião pausa até Marina clicar em Encerrar reunião)
13 Implantadora: "Antes de desligar, faltaram dois pontos: a taxa do alvará e o prazo de análise."
14 Prefeitura: "A taxa é igual à do modelo, R$ 3,85 por metro quadrado."
15 Prefeitura: "O prazo de análise eu preciso confirmar com o secretário. Te respondo até sexta."
16 Implantadora: "Perfeito, Helena. Obrigada, e até a próxima."
Efeitos esperados: fala 4 marca CHK-05; fala 6 marca CHK-06; fala 8 gera o alerta de contradição contra DOC-02 (3 m contra 4,50 m); fala 10 marca CHK-10 como regra local; fala 11 cria o compromisso CMP-01 (planta de zoneamento, quinta 29/10); ao encerrar, as lacunas são CHK-08 e CHK-09; fala 14 marca CHK-08; fala 15 cria o compromisso CMP-02 (confirmar o prazo de análise, sexta 30/10).
Compromissos (7): os 2 acima (pendentes) e 5 anteriores: REU-05 dois recebidos; REU-04 um recebido e um atrasado (prazo 23/10, "Lista de condicionantes ambientais"); REU-03 um pendente (prazo 27/10).
Todos os dados são FICTÍCIOS e plausíveis, coerentes entre telas (mesmos nomes, números e datas), com variedade de estados. Coloque-os em arquivos de dados separados dos componentes (uma coleção por arquivo) e use a data de "hoje" fixa. Nada de lorem ipsum, nada de valores aleatórios a cada carga.

FUNCIONALIDADE REAL (implemente de verdade somente isto, e somente se for simples e confiável)
Nenhuma chamada externa nesta geração. Crie, porém, a costura para a funcionalidade real que será ligada depois: um módulo de serviço com as funções analisarTrecho(fala, checklist, documentos, hoje) e gerarResumo(estado), que nesta versão leem respostas pré-calculadas de um arquivo de dados "respostas gravadas" (uma por fala do roteiro) e devolvem o mesmo formato JSON que um modelo devolveria: itens marcados com a frase de evidência, alertas com id do documento e a diferença, compromissos com responsável, o quê e prazo. A interface mostra o rótulo "Análise gravada" (nunca "ao vivo") enquanto for assim, e tem estados de carregando, sucesso e erro. Nenhuma chave de API no código ou no prompt.

SIMULAÇÕES (parecem funcionar, mas devem ser identificadas)
- A reunião (roteiro; cada fala chega a cada ~4 s, com Pausar e Avançar). A fonte "Áudio gravado" reproduz o mesmo roteiro; a fonte "Ao vivo" mostra "Ação demonstrativa: na versão completa isto ouviria a reunião".
- O contexto do cliente (chat), o ticket do cliente (S-06), os lembretes e a passagem de tempo ("Tempo simulado") e o envio ao agente de implantação ("Envio ao agente (simulado)").
- Os indicadores são derivados dos dados do cenário e trazem o rótulo "Indicador do cenário".
Toda saída simulada traz um rótulo discreto. Mostre sempre, em local permanente, o selo "Protótipo demonstrativo · dados fictícios".

PLATAFORMA E RESTRIÇÕES
Aplicação web em português do Brasil, otimizada para um notebook ou monitor (1440 px) e, na tela S-06, para celular (390 px). Sem login, sem banco, sem pagamentos. Funciona sem internet. Um botão "Reiniciar demonstração" restaura os dados, o checklist, os compromissos e o relógio ao estado inicial.

ESTRUTURA DE CÓDIGO (importante para continuar o desenvolvimento)
- Aplicação web com React. Use TypeScript se for o padrão do gerador.
- Pastas claras: componentes reutilizáveis de UI, páginas/telas, dados de demonstração, serviços (o módulo de análise acima), utilitários, e (se houver servidor) código de servidor separado.
- Um componente por responsabilidade; sem lógica duplicada entre telas; navegação coerente entre todas as telas, sem links mortos.
- Todo controle visível deve fazer algo: navegar, mudar um estado visível, abrir um painel/modal ou mostrar um aviso "Ação demonstrativa: na versão completa isto…". Não deixe botões sem reação.
- Estados visuais em todas as telas da jornada: carregando, vazio, sucesso e erro.
- Use poucas dependências e prefira as que já vêm no projeto. Evite imagens, fontes e scripts remotos: a demonstração deve funcionar sem internet.
- NÃO crie: autenticação real, banco de dados, pagamentos, integrações externas ou backend complexo. Não coloque nenhum segredo no código.

AO TERMINAR
Escreva um resumo curto: a estrutura de pastas, como executar, o que é REAL, o que é SIMULADO e o que ficou de fora.
```

## 2. Gerações e iterações no AI Studio

| # | Hora | Pedido (um problema, uma correção) | Resultado | Aceita? |
|---|---|---|---|---|
| 1 | 24/10 (hora não registrada) | geração inicial do **mascote** com `prompt-ai-studio-mascote.md` (não o prompt de 6 telas da §1) | [PREENCHER NO EVENTO] | [PREENCHER NO EVENTO] |
| 2 | 24/10 (hora não registrada) | atualização "dois modos de uso" (em reunião e fora da reunião) | **erro de escopo**: acrescentou abas Pendências, Consultar e Reuniões | não: revertida pela iteração 3 |
| 3 | 24/10 (hora não registrada) | correção: remover o modo "fora da reunião" e deixar só "em reunião" (texto em `prompt-ai-studio-mascote.md` §Iteração 3) | [PREENCHER NO EVENTO] | [PREENCHER NO EVENTO] |

## 3. Exportação

| Item | Valor |
|---|---|
| Forma (ZIP, GitHub, outra) e hora | [PREENCHER NO EVENTO] |
| Pasta no repositório | `prototipo/` |
| Commit inicial só com a base (hash) | [PREENCHER NO EVENTO] |
| Segredos encontrados e tratados | [PREENCHER NO EVENTO] (nenhum / quais, como foram removidos) |
| Regeneração no AI Studio após o MARCO-2 | **não** (sobrescreve o trabalho) |

## 4. Auditoria técnica (achados; a stack real e os comandos estão em `stack.md`)

| Item | Achado (observado no código ou na execução) | Gravidade (bloqueia / incomoda / ok) |
|---|---|---|
| Executa (instalar, rodar, build) | [VALIDAR NA AUDITORIA] | |
| Erros de compilação, tipos e console | | |
| Rotas e navegação | | |
| Estado e gerenciamento de dados | | |
| Dados mock e onde vivem | | |
| APIs e integrações existentes | | |
| Integração com IA (existe? cliente ou servidor? chave?) | | |
| Persistência, autenticação, serviços externos | | |
| Dependência de rede (CDNs, fontes, imagens remotas) | | |
| Segredos no código | | |

## 5. Mapa de funcionalidades (requisitos aprovados × código)

> Estados: **real** (executa de verdade) · **simulada** (rotulada) · **incompleta** · **ausente**. Fonte dos requisitos: `experiencia.md` §2, §3 e §5.

| ID (S-/I-/F-) | O que é | Estado | Evidência | Ação (preservar / completar / simular / cortar) |
|---|---|---|---|---|
| | | | | |

Inconsistências entre a implementação e os requisitos aprovados: …

## 6. UI/UX × design system da Aprova (divergências, por impacto; máx. 12)

| # | Onde | Divergência (token, tipografia, componente, estado, contraste) | Referência (`design-system-aprova.md` §) | Corrigir? |
|---|---|---|---|---|
| | | | | |

## 7. Ordem de evolução aprovada (fatias verticais)

| Ordem | Fatia (tela / interação / funcionalidade) | Preserva | Estimativa | Dono | Aprovada por / hora |
|---|---|---|---|---|---|
| 1 | falhas que bloqueiam a execução | | | | |
| 2 | jornada central | | | | |
| 3 | lógica de negócio e validações da jornada | | | | |
| 4 | funcionalidade diferenciadora (IA real, se aplicável) | | | | |
| 5 | dados / persistência (só se a jornada pedir) | | | | |
| 6 | interações simuladas restantes | | | | |
| 7 | refino de UI e dados | | | | |
