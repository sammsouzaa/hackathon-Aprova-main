# Prompt do AI Studio: base do mascote desktop (Prumo)

> Complementa `base-ai-studio.md` §1 (que descreve o sistema completo de 6 telas). Este prompt gera **só o mascote**: um painel compacto de chat, pensado para virar programa desktop com Electron depois. O web simples (login, chat de conversa, envio de arquivos) é feito por outra pessoa e **não** entra aqui. Uso do AI Studio ainda `[A]` (ver `desafio.md` §1, D1): se for vetado, o mesmo texto vai ao Claude Code. Dados e valores são fictícios.

```text
Você é um(a) designer e engenheiro(a) front-end sênior. Crie a PRIMEIRA VERSÃO de um protótipo chamado "Prumo", um mascote de reunião: um painel compacto de chat que acompanha uma reunião de trabalho e manda mensagens ao usuário. O objetivo é uma base visualmente convincente, organizada e fácil de continuar desenvolvendo, e NÃO um produto completo. Esta aplicação será empacotada depois como programa desktop com Electron: ela vive em uma janela pequena, no canto superior da tela do Linux, aberta a partir de um ícone da bandeja. Aqui você cria somente a interface web dessa janela.

CONTEXTO E PROBLEMA
Implantadores de um software de processos eletrônicos para prefeituras reúnem-se com analistas da prefeitura para coletar a regra de negócio de cada processo (por exemplo, alvará de construção). O que faltou perguntar, o que a fala do cliente contradiz no documento modelo e o que o cliente ficou de enviar só aparecem depois da reunião e geram novas reuniões. O Prumo fica aberto ao lado da videochamada, escuta a reunião e, ao longo dela, manda mensagens curtas ao implantador.

USUÁRIA
Marina Duarte (fictícia), implantadora. Fala com Helena Prado (fictícia), analista de Planejamento Urbano da Prefeitura de Serra do Sabiá (município fictício). Sem tela de login.

O QUE ESTA APLICAÇÃO É (formato e tamanho)
- É UMA ÚNICA JANELA COMPACTA em formato de chat, nunca uma página de site com menu e rodapé. O elemento raiz ocupa 100% da largura e da altura da janela (100vw x 100vh), sem rolagem na página, só na lista de mensagens.
- Tamanho de referência: 480 x 640 px (no máximo cerca de 1/4 de uma tela de 1440 x 900). Deve funcionar bem de 360 x 480 até 640 x 800 px. Sem layout de duas colunas, sem barra lateral.
- Cabeçalho (altura 56 px) que também serve de área de arrastar a janela: coloque a classe CSS "drag-region" no cabeçalho (com -webkit-app-region: drag) e "no-drag" nos botões do cabeçalho. No cabeçalho: avatar do mascote, nome "Prumo", chip de status (Preparando · Em reunião 00:12 · Pausada · Encerrada) e um menu "⋯".
- Abas abaixo do cabeçalho: "Conversa" (padrão) e "Checklist".
- Faixa fina "Última fala" logo abaixo das abas, mostrando a fala mais recente da reunião (canal e texto, truncada em 2 linhas).
- Lista de mensagens (rolável, rola sozinha para a mais nova), campo de texto com botão Enviar na base, e um selo discreto "Protótipo demonstrativo · dados fictícios" sempre visível.
- O mascote é um personagem ORIGINAL em SVG inline (um fio de prumo simpático: gota alongada com dois olhos), nas cores de IA abaixo. Não copie logotipos ou marcas de nenhuma empresa.

PRÉ-VISUALIZAÇÃO DE DESKTOP (somente para o preview; fica separada do painel)
Crie um componente PreviewDesktop, ativo por padrão no preview e desativável por um parâmetro de URL (?desktop=0), que simula a tela do Linux: fundo escuro #1c1c1c de 1440 x 900 reduzido para caber, uma barra superior fina com relógio e ícones de sistema, e, nela, um ícone do mascote (a bandeja). Clicar no ícone abre e fecha o painel como uma janela flutuante de 480 x 640 px ancorada no canto superior direito, com sombra. O painel em si NÃO depende desse componente: ele é um componente independente (PainelPrumo) que só preenche o espaço que recebe. Não use APIs que só funcionam no navegador completo (várias abas, window.open, alert, localStorage como único lugar do estado). Sem rotas: o painel é uma tela só.

COMPORTAMENTO (máquina de estados da reunião)
Estados: preparando → em reunião → pausada → encerrando → concluída.
1. PREPARANDO: mensagem inicial do Prumo: "Reunião de hoje, 14:00: Alvará de construção residencial, Serra do Sabiá. O checklist tem 10 itens: 4 já estão confirmados pelo contexto do cliente e 6 faltam perguntar." Mostre os 6 itens a perguntar. Um aviso de gravação em cartão: "Esta reunião será acompanhada pelo Prumo. Avise os participantes." com seletor de modo de escuta (Gravação com aviso · Escuta sem guardar · Modo notas) e caixa "Participantes avisados" obrigatória. O botão "Iniciar reunião" só habilita com a caixa marcada.
2. EM REUNIÃO: as falas do roteiro (abaixo) chegam uma a uma a cada ~4 segundos (botões Pausar/Continuar e Avançar fala em uma pequena faixa "Controles da demonstração" no menu ⋯ ou colapsável). A cada fala o Prumo pode mandar uma mensagem (tabela de efeitos abaixo). Seletor de fonte da fala (Roteiro · Áudio gravado · Ao vivo): "Roteiro" e "Áudio gravado" reproduzem o mesmo roteiro e mostram o rótulo da fonte; "Ao vivo" mostra "Ação demonstrativa: na versão completa isto ouviria a reunião".
3. A mensagem de alerta de contradição PAUSA o roteiro até a usuária decidir.
4. O botão "Encerrar reunião" está sempre no cabeçalho durante a reunião. Ao clicar, o Prumo manda uma mensagem listando as lacunas e as contradições abertas, com "Voltar à reunião" (continua o roteiro) e "Encerrar mesmo assim".
5. CONCLUÍDA: o Prumo manda um cartão de resumo ("Cobertura do checklist 9/10 · 2 regras locais · 2 compromissos") com o botão "Ver resumo", que abre um painel deslizante com o resumo estruturado editável (regras confirmadas, campos que mudam, regras locais, pendências), botões Recusar e Aprovar, Exportar JSON (baixa um arquivo de verdade) e Enviar ao agente de implantação (mostra "Envio ao agente (simulado)").
6. No menu ⋯: "Avançar 3 dias (demo)" dispara as mensagens de lembrete (tabela abaixo); "Reiniciar demonstração" devolve tudo ao estado inicial; "Sobre" abre um painel curto com o que é real e o que é simulado.
7. Campo de texto: a usuária pode perguntar ao Prumo (consulta à documentação). Respostas pré-definidas e rotuladas "Resposta simulada": se a pergunta contiver "recuo" → responde 4,50 m com a citação do DOC-02; "taxa" → R$ 3,85 por m² com a citação do DOC-04; "prazo" → 20 dias úteis com a citação do DOC-05; qualquer outra → "Não encontrei isso na documentação. Abri uma pendência (simulado)." com um cartão de pendência.

TIPOS DE MENSAGEM DO PRUMO (cartões de chat, lado esquerdo, com o avatar; as ações da usuária aparecem como balões compactos do lado direito)
- Texto simples.
- Item marcado: "✔ <item> · <valor>" com a frase de evidência em citação (borda esquerda) e o chip "Análise gravada" (nunca "ao vivo"); botão "Desmarcar".
- Alerta de contradição: cartão de aviso com "Possível contradição: <item>", a fala do cliente, o trecho exato do documento (título, artigo e texto) e três ações: Perguntar ao cliente · Aceitar como regra local · Ignorar. A decisão é sempre da usuária; o Prumo só avisa. Após decidir, o cartão mostra o resultado e o roteiro continua.
- Compromisso: "Compromisso detectado: <o quê> · <quem> · prazo <data>" com Confirmar e Editar prazo.
- Lacunas, resumo e lembrete: cartões com título, texto curto e ações.
A aba "Checklist" lista os 10 itens com estado (confirmado pelo contexto · pendente · respondido · regra local · lacuna), evidência e permite marcar/desmarcar na mão, com a cobertura (n/10) no topo.

DADOS DE DEMONSTRAÇÃO (todos FICTÍCIOS e coerentes; em arquivos de dados separados dos componentes, uma coleção por arquivo; data de "hoje" fixa: segunda-feira 26/10/2026, 14:00; nada de lorem ipsum nem valores aleatórios)
Checklist do alvará (10 itens): CHK-01 zonas abrangidas (ZR1, ZR2, ZC1), confirmado no contexto; CHK-02 documentos obrigatórios (matrícula, ART/RRT, projeto, certidão negativa), confirmado; CHK-03 etapas (análise técnica, fiscal, emissão), confirmado; CHK-04 quem assina o alvará (Diretor de Planejamento), confirmado; CHK-05 taxa de ocupação máxima na ZR2 (modelo 58%); CHK-06 coeficiente de aproveitamento na ZR2 (modelo 1,35); CHK-07 recuo frontal mínimo (modelo 4,50 m); CHK-08 taxa do alvará (modelo R$ 3,85 por m²); CHK-09 prazo de análise (modelo 20 dias úteis); CHK-10 parecer em área de preservação (modelo não prevê).
Documentos do modelo (trechos literais): DOC-01 "Lei de Uso e Ocupação do Solo (modelo, fictício), art. 8º: na ZR2, taxa de ocupação máxima de 58% e coeficiente de aproveitamento de 1,35."; DOC-02 "Plano Diretor (modelo, fictício), art. 14, §2º: o recuo frontal mínimo na ZR2 é de 4,50 m."; DOC-03 "Código de Obras (modelo, fictício), art. 31: documentos obrigatórios: matrícula do imóvel, ART/RRT, projeto arquitetônico e certidão negativa de débitos."; DOC-04 "Decreto de Taxas (modelo, fictício), art. 5º: taxa de alvará residencial de R$ 3,85 por metro quadrado."; DOC-05 "Código de Obras (modelo, fictício), art. 40: prazo de análise técnica de 20 dias úteis."
Roteiro da reunião (16 falas, neste texto e nesta ordem):
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
12 Implantadora: "Combinado. Acho que podemos encerrar por aqui, certo?" (o roteiro pausa aqui até a usuária clicar em Encerrar reunião ou continuar)
13 Implantadora: "Antes de desligar, faltaram dois pontos: a taxa do alvará e o prazo de análise."
14 Prefeitura: "A taxa é igual à do modelo, R$ 3,85 por metro quadrado."
15 Prefeitura: "O prazo de análise eu preciso confirmar com o secretário. Te respondo até sexta."
16 Implantadora: "Perfeito, Helena. Obrigada, e até a próxima."
Efeitos das falas: 4 marca CHK-05 (evidência "Na ZR2 é 58% do lote."); 6 marca CHK-06; 8 gera o alerta de contradição contra DOC-02 (3 m contra 4,50 m) e pausa o roteiro; 10 marca CHK-10 como regra local; 11 cria o compromisso CMP-01 (planta de zoneamento atualizada, Helena Prado, quinta 29/10/2026); ao encerrar, as lacunas são CHK-08 e CHK-09; 14 marca CHK-08; 15 cria o compromisso CMP-02 (confirmar o prazo de análise com o secretário, Helena Prado, sexta 30/10/2026); depois da 16 vem o cartão de resumo.
Lembretes ao "Avançar 3 dias (demo)", em sequência e rotulados "Tempo simulado": 28/10: "Lembrete enviado à Helena: planta de zoneamento (vence amanhã), com link do ticket (simulado)" e "Lembrete enviado: prazo de análise (vence em 2 dias)"; 29/10: "Helena respondeu no ticket: planta_zoneamento_v2.pdf recebido. Compromisso fechado sem nova reunião ✔". Um botão "Abrir ticket (simulado)" nos lembretes abre um painel pequeno que imita o ticket do cliente (pedido, campo de resposta, anexo fictício, Enviar), rotulado "Ticket simulado"; enviar atualiza o compromisso.

LINGUAGEM VISUAL (seguir exatamente; vem do design system público da Aprova, só tokens e padrões)
Calma, confiável e discreta: o mascote não pode roubar a atenção de quem está em reunião. Aplique estes tokens como variáveis CSS em um único lugar e reutilize-os em todo o painel:
- fundo da janela #f5f7f7; superfície/cartões #ffffff; texto #1c1c1c; texto suave #656666; borda #cacccc; divisor #dee0e0;
- ação principal #0d787e (hover #074a4e, texto branco); marca para ícone, foco e barras #06929f (nunca texto pequeno branco sobre ela); foco visível: anel 2 px #1c1c1c com offset branco;
- blocos gerados pelo Prumo e o avatar: ícone #0891b2, texto #0e7490, fundo #e6f5f8;
- sucesso: fundo #eefff9, texto #055b40; alerta: fundo #ffefe7, texto #702600; erro: fundo #ffebeb, texto #ba1515; informação: fundo #ebf4ff, texto #0856af (o estado nunca depende só da cor: sempre ícone e texto).
- fonte Inter instalada localmente (por exemplo pelo pacote @fontsource-variable/inter), nunca de CDN; escala 12, 14, 16, 20, 24; títulos 700, corpo 400, botões 500/600; corpo do chat 14 px.
- espaçamento 4, 8, 12, 16, 24; raio 8 px em controles e botões, 16 px em cartões e balões, 999 px em chips; sem sombra nos cartões (sombra só na janela flutuante do preview: 0 8px 24px rgba(0,0,0,.16)); altura de controle 36 px (pequeno) e 44 px (padrão); movimento de 150 ms, respeitando prefers-reduced-motion.
Hierarquia clara: uma ação principal por mensagem, cartões compactos, muito espaço em branco. Não copie telas, logotipos ou marcas de nenhuma empresa nem use a palavra "Aprova" como nome do produto.

FUNCIONALIDADE REAL
Nenhuma chamada externa nesta geração, e nenhuma chave de API no código. Crie a COSTURA para a funcionalidade real que será ligada depois: um módulo de serviço com as funções analisarTrecho(fala, checklist, documentos, hoje) e gerarResumo(estado), que nesta versão leem respostas pré-calculadas de um arquivo de dados ("respostas gravadas", uma por fala) e devolvem o mesmo formato JSON que um modelo devolveria (itens marcados com a frase de evidência, alertas com o id do documento e a diferença, compromissos com responsável, o quê e prazo). A interface mostra "Análise gravada" (nunca "ao vivo") enquanto for assim e tem estados de carregando, sucesso e erro.

SIMULAÇÕES (devem ser identificadas)
O roteiro da reunião, o áudio gravado, a transcrição, as respostas à pergunta digitada, os lembretes e a passagem de tempo ("Tempo simulado"), o ticket do cliente ("Ticket simulado") e o envio ao agente de implantação ("Envio ao agente (simulado)"). Toda saída simulada traz um rótulo discreto. O selo "Protótipo demonstrativo · dados fictícios" fica sempre visível.

ESTRUTURA DE CÓDIGO (importante para continuar o desenvolvimento e empacotar com Electron)
- Aplicação web com React. Use TypeScript se for o padrão do gerador.
- Componentes: PainelPrumo (raiz do painel, sem dependência do preview), CabecalhoPrumo, ListaDeMensagens, mensagens por tipo (cartões), AbaChecklist, CampoDeMensagem, ModalAvisoGravacao, PainelResumo, PainelTicketSimulado, MenuPrumo, e PreviewDesktop (somente preview).
- Pastas: componentes de UI reutilizáveis, painel, dados de demonstração (checklist, documentos, roteiro, respostas gravadas, lembretes), serviços (o módulo de análise), estado da reunião e utilitários.
- Um componente por responsabilidade; sem lógica duplicada; estado da reunião em um único lugar.
- Todo controle visível deve fazer algo: mudar um estado visível, abrir um painel ou mostrar "Ação demonstrativa: na versão completa isto…". Não deixe botões sem reação.
- Estados visuais: carregando, vazio, sucesso e erro nas áreas que os têm.
- Poucas dependências; sem imagens, fontes ou scripts remotos: funciona sem internet.
- NÃO crie: login, rotas, banco de dados, pagamentos, integrações externas, backend, página inicial de site, menu lateral nem rodapé. Não coloque segredo no código.

AO TERMINAR
Escreva um resumo curto: a estrutura de pastas, como executar, o que é REAL, o que é SIMULADO e o que ficou de fora.
```


## Histórico das iterações (24/10)

- **Iteração 1:** geração inicial com o prompt acima.
- **Iteração 2 (descartada):** atualização "dois modos de uso" (em reunião e fora da reunião). Foi um erro de escopo: acrescentou abas Pendências, Consultar e Reuniões na janela de 480x640. Decisão de ~12:00: o desktop fica só na reunião; o "fora da reunião" vive na plataforma web (`ESTADO.md` §5).
- **Iteração 3 (corretiva):** o prompt abaixo remove o modo "fora da reunião" e mantém só "em reunião", conservando os ajustes de discrição.

### Iteração 3 — prompt corretivo

```text
Corrija o protótipo Prumo: a atualização dos "dois modos de uso" foi um erro de escopo. REMOVA o modo "Fora da reunião" e tudo que veio com ele, e deixe somente o comportamento "Em reunião". NÃO recrie o projeto do zero: preserve a estrutura, os tokens visuais, o roteiro de 16 falas, o PreviewDesktop, o PainelPrumo independente, as classes drag-region e no-drag, os rótulos de simulação e o selo "Protótipo demonstrativo · dados fictícios".

REMOVER
- O seletor "Em reunião · Fora da reunião" e o estado modoDeUso.
- A faixa "Reunião em andamento · Voltar" e o contador de itens novos.
- O modo "Fora da reunião" inteiro: as abas Pendências, Consultar e Reuniões, o cartão "Reunião de hoje", a lista de compromissos, os indicadores, o painel "Cobrar agora", o painel de resumo somente leitura, a lista de documentos em cartões e as sugestões em chips.
- Os componentes criados para isso: SeletorDeModo, FaixaReuniaoEmAndamento, ModoForaDaReuniao, AbaPendencias, AbaConsultar, AbaReunioes, CartaoReuniaoDeHoje, ListaDeCompromissos, PainelLembrete e PainelResumoSomenteLeitura.
- Os dados que só eles usavam: os 5 compromissos de outras reuniões, as reuniões anteriores e próximas, os resumos curtos dessas reuniões e a mensagem-modelo de lembrete do "Cobrar agora". Mantenha somente os compromissos criados durante a reunião (CMP-01 e CMP-02).
- Qualquer importação, rota ou estilo sem uso depois da remoção.

RESULTADO ESPERADO (uma única interface)
- O app abre direto no estado "preparando": na aba "Conversa", o Prumo manda a mensagem inicial (reunião de hoje, 14:00, Alvará de construção residencial, Serra do Sabiá; checklist de 10 itens, 4 confirmados e 6 a perguntar), com o cartão de preparação: aviso de gravação, modo de escuta, caixa "Participantes avisados" obrigatória e o botão "Iniciar reunião".
- Abas: "Conversa" e "Checklist", apenas. Faixa "Última fala" abaixo das abas. Cabeçalho com avatar, nome, chip de status, botão "Encerrar reunião" (durante a reunião) e o menu "⋯".
- Fluxo da reunião existente: preparando, em reunião, pausada, encerrando, concluída; alerta de contradição que pausa o roteiro até a decisão; compromissos CMP-01 e CMP-02; aviso de lacunas ao encerrar; cartão de resumo com "Ver resumo" (PainelResumo com Recusar, Aprovar, Exportar JSON e "Enviar ao agente de implantação (simulado)").
- Ao concluir, o Prumo manda uma mensagem de encerramento e o cartão de resumo, e o app continua na mesma tela.

MANTER DOS AJUSTES DE DISCRIÇÃO
- Item marcado do checklist aparece como UMA LINHA compacta com o chip "Análise gravada". Só o alerta de contradição, o compromisso detectado, o aviso de lacunas e o resumo são cartões completos. Mensagens do Prumo com no máximo 2 linhas.
- Rodapé do chat: "Ouvindo · fonte: Roteiro". Campo de texto com o placeholder "Pergunte algo rápido"; respostas pré-definidas (recuo, taxa, prazo) com no máximo 2 linhas, rotuladas "Resposta simulada"; qualquer outra pergunta gera "Não encontrei isso na documentação. Abri uma pendência (simulado)." com um cartão de pendência dentro do chat.

MENU ⋯
"Avançar 3 dias (demo)" dispara, no próprio chat, as mensagens de lembrete e a resposta do ticket (rotuladas "Tempo simulado"), com o botão "Abrir ticket (simulado)"; "Reiniciar demonstração" volta ao estado "preparando" com compromissos e relógio zerados; "Sobre" abre o painel curto atualizado: "O Prumo acompanha a reunião. A gestão de pendências, a consulta à documentação e o histórico ficam na plataforma web, fora desta janela. Tudo aqui é demonstrativo: o roteiro, a análise gravada, os lembretes e o ticket são simulados."

NÃO CRIE nada novo além do necessário para esta correção. Sem chamadas externas, sem chaves.

AO TERMINAR
Liste os arquivos removidos e alterados e confirme que o projeto compila e roda sem erros ou avisos de importação, que o app abre em "preparando" e que o fluxo completo (preparar, iniciar, alerta, compromissos, encerrar, resumo, avançar 3 dias, reiniciar) funciona.
```

### Iteração 4 — polimento de UI e UX (sem mudar comportamento)

Pré-condição: a iteração 3 (um só modo) já aplicada. Depois desta iteração: exportar e continuar no Claude Code.

```text
Faça uma passada de POLIMENTO VISUAL E DE UX no protótipo Prumo. NÃO mude comportamento, dados, roteiro, máquina de estados, nomes de componentes, rótulos de simulação nem a funcionalidade; só melhore a interface para ficar limpa, intuitiva e com acabamento de produto. Não adicione recursos nem telas. Trabalhe pela ordem abaixo e olhe o preview a cada etapa em 480 x 640 px (e confira 360 x 480 e 640 x 800).

PRINCÍPIOS
- Em reunião a usuária olha de relance: em cada instante UMA coisa chama a atenção (o alerta, se houver; senão a última mensagem). Tudo o mais é calmo e neutro.
- Densidade compacta mas respirável; sem cartões dentro de cartões; sem sombra nos cartões (só borda 1 px #cacccc); espaço em branco em vez de linhas e caixas.
- Escala de espaçamento 4, 8, 12, 16, 24 (nenhum outro valor); margem lateral 16 px; intervalo entre mensagens 8 px; padding interno de cartão 12 px; alinhamento rigoroso, sem desvio de 1 a 2 px.
- Tokens apenas (variáveis CSS já definidas); nenhuma cor solta. Texto ≥ 14 px no chat e ≥ 12 px em legendas; títulos informativos e curtos; números com tabular-nums.
- Ícones SVG de um único conjunto (traço 1,5 a 2 px, 20 px), com função; troque todos os emojis e caracteres como ✔ por ícones SVG. Estado nunca só por cor: ícone e texto sempre.
- Evite sinais de interface genérica: cartões idênticos repetidos sem hierarquia, cor padrão de framework, gradientes, efeitos de vidro, ícones decorativos, sombras grandes.
- Fonte Inter local (sem CDN); movimento de 150 ms (250 ms em painéis), respeitando prefers-reduced-motion.

1. CABEÇALHO E ABAS
- Cabeçalho de 56 px: avatar do Prumo (SVG original, 32 px), nome, chip de status com ponto + texto (Preparando = cinza, Em reunião 00:12 = verde com ponto pulsante discreto, Pausada = âmbar, Concluída = azul) e o menu "⋯" (36 x 36 px). O botão "Encerrar reunião" é secundário, em contorno, ícone + texto, nunca o botão mais forte da tela; aparece só durante a reunião.
- Abas "Conversa" e "Checklist" com sublinhado de 2 px #0d787e na ativa, texto 14 px peso 600, altura 40 px, contador discreto no Checklist ("5/10").
- Faixa "Última fala": uma linha, fundo #ffffff, borda inferior #dee0e0, canal em rótulo pequeno ("Helena" ou "Marina") e texto em até 2 linhas com reticências, com a transição suave quando a fala muda.

2. LISTA DE MENSAGENS
- Mensagens consecutivas do Prumo agrupadas sob um único avatar; hora pequena (12 px, #656666) em formato relativo ("agora", "há 2 min"); separador de dia "Hoje, 26/10".
- Linha compacta de item marcado: ícone de check em círculo, texto "Taxa de ocupação ZR2" + valor em peso 600, chip "Análise gravada" pequeno na cor de IA, e a frase de evidência recolhida atrás de um chevron "Ver frase" (expande com 150 ms). Botão "Desmarcar" como ação de texto, só no foco ou hover e sempre acessível por teclado.
- Cartão de ALERTA DE CONTRADIÇÃO (o único elemento "forte" do chat): fundo #ffefe7, barra esquerda de 4 px, título "Possível contradição: Recuo frontal", dois blocos lado a lado (ou empilhados em 360 px) com rótulos "Helena disse" e "Documento (Plano Diretor, art. 14, §2º)", valores em destaque (3 m × 4,50 m). Ações: "Aceitar como regra local" (primário), "Perguntar ao cliente" (secundário), "Ignorar" (texto). Role="alert". Após decidir, o cartão colapsa para uma linha com a decisão e o ícone.
- Cartão de COMPROMISSO: fundo #ebf4ff, linhas chave-valor (O quê, Quem, Prazo com data e "em 3 dias"), ações "Confirmar" (primário) e "Editar prazo" (secundário); depois de confirmado vira linha compacta com ícone.
- Cartões de lacunas, resumo e lembrete: mesmo desenho (título 14/600, texto 14/400, no máximo 2 ações, a principal à direita). Mensagens simples sem cartão, em balão de 16 px de raio com fundo #e6f5f8 para o Prumo; as ações da usuária em balões compactos à direita com fundo #0d787e e texto branco.
- Indicador de "Analisando a fala…" como três pontos animados + texto curto no lugar da próxima mensagem (carregando); vazio: "Aguardando a fala…" com ícone suave; erro: "Não consegui analisar este trecho. Tentar de novo" com botão, mais o rótulo da queda.
- Rolagem automática suave apenas se a usuária está no fim da lista; se ela rolou para cima, mostrar a pílula "Novas mensagens ↓". O contêiner da lista tem role="log" e aria-live="polite".

3. ABA CHECKLIST
- Topo: cobertura em destaque ("5 de 10 itens", barra de progresso de 8 px com raio total, cor #0d787e).
- Itens agrupados em seções com títulos pequenos: "Confirmados pelo contexto", "Respondidos", "Regras locais", "Pendentes". Cada item numa linha de 44 px: ícone de estado (SVG), nome, valor ou "pendente" em #656666, evidência recolhida (chevron). Alternar marcação por clique, teclado (Espaço) e com área de toque de 44 px.

4. PREPARAÇÃO E AVISO DE GRAVAÇÃO
- Um único cartão limpo com três blocos: resumo ("4 de 10 já confirmados · 6 a perguntar", com os 6 itens em lista curta), aviso de gravação (fundo #ebf4ff, ícone de informação, texto "Esta reunião será acompanhada pelo Prumo. Avise os participantes."), e o modo de escuta como três cartões de opção selecionáveis (radio) com título e uma linha de explicação.
- Caixa "Participantes avisados" com rótulo claro; botão "Iniciar reunião" em largura total, 44 px, desabilitado até marcar a caixa, com dica "Marque a caixa para iniciar" visível enquanto desabilitado.

5. RODAPÉ E CAMPO DE MENSAGEM
- Campo de 44 px, placeholder "Pergunte algo rápido", botão de enviar apenas com ícone e aria-label, foco visível #1c1c1c com offset branco. Linha de status abaixo: ponto + "Ouvindo · fonte: Roteiro" (barras de áudio sutis; paradas com prefers-reduced-motion) e, à direita, o selo "Protótipo demonstrativo · dados fictícios" em 12 px.

6. PAINÉIS (RESUMO E TICKET SIMULADO)
- Painel de resumo desliza da direita em 250 ms, cobrindo o chat, com seta de voltar e título; seções com títulos pequenos ("Regras confirmadas", "Campos que mudam", "Regras locais", "Pendências"); cada regra tem um selo "Modelo" ou "Regra local" e a origem em texto pequeno. Rodapé fixo: "Recusar" (secundário) e "Aprovar" (primário); depois de aprovar, aparecem "Exportar JSON" e "Enviar ao agente (simulado)". Esc fecha o painel.
- Ticket simulado: mesmo desenho, rótulo "Ticket simulado" no topo, pedido, campo de resposta com rótulo, anexo fictício e botão "Enviar"; ao enviar, mostrar sucesso com o próximo passo.

7. MENU ⋯, "SOBRE" E CONTROLES DA DEMONSTRAÇÃO
- Menu em popover de 240 px, com ícones, separador e uma seção "Controles da demonstração" (Pausar/Continuar, Avançar fala, fonte da fala em seletor segmentado, Avançar 3 dias, Reiniciar demonstração). Navegação por setas, Esc fecha, foco devolvido ao botão. "Reiniciar" pede confirmação curta.
- "Sobre" em painel simples, texto curto, com a lista "Real / Simulado" em duas colunas.

8. PREVIEW DE DESKTOP
- Dê realismo ao PreviewDesktop (sem mexer no painel): barra superior com relógio e ícones de sistema, ícone do Prumo na bandeja com um pequeno indicador de novidade, janela com raio de 12 px, sombra 0 8px 24px rgba(0,0,0,.16) e uma borda sutil, animação de abrir e fechar de 150 ms.

9. MICROCOPY E ACESSIBILIDADE
- Voz informal e direta, verbos nos botões, frases curtas com a próxima ação. Mesma palavra para a mesma coisa: "regra local", "compromisso", "lacuna", "checklist". Nunca "Item 1" nem textos de exemplo genéricos.
- Foco visível em todo controle, ordem de tabulação lógica, aria-label nos botões só de ícone, role="alert" no alerta de contradição, alvos ≥ 36 px (44 px nos principais), contraste ≥ 4,5:1.

AO TERMINAR
Faça uma SEGUNDA PASSADA crítica olhando o preview: alinhamentos, espaçamentos, hierarquia e microcopy. Depois liste, em poucas linhas, o que melhorou por tela, o que ainda incomoda e confirme que nenhum comportamento, dado ou rótulo de simulação mudou e que o projeto compila sem avisos.
```
