# Design system e UX inspirados nos produtos da Aprova Digital

| Campo | Valor |
|---|---|
| Versão | 1.1 (pesquisa de 22/10/2026) |
| Natureza | Referência **operacional** para o agente construir interfaces com linguagem visual coerente com a da Aprova. O que vem de fonte oficial pública traz `[CONF]`; o resto é inferência ou recomendação do kit. **Não é guia de marca** nem autorização de uso de marca. |
| Evidência por trás | [`pesquisa-design-aprova.md`](pesquisa-design-aprova.md) (fontes F-nn, limites, como reproduzir). Tokens prontos: [`aprova-tokens.css`](aprova-tokens.css). |
| Confiança geral | **Alta** para tokens e componentes básicos (Storybook oficial + CSS público da plataforma atual). **Média/baixa** para telas internas (a plataforma autenticada **não** foi inspecionada; só há capturas de 2022). |
| Não é | Cópia de tela, nem afirmação de que o protótipo é produto da Aprova. |

## 0. Leia só isto se tiver pouco tempo

1. A Aprova **tem um design system próprio ("ADS", Angular)**, com Storybook público e tokens publicados no CSS da plataforma. Ele é a **base** deste documento (§2).
2. Etiquetas: `[CONF]` valor literal em fonte oficial pública · `[EST]` medido em captura de tela · `[INF]` inferido de várias evidências · `[REC]` recomendação do kit (não é regra da Aprova) · `[NV]` não verificado.
3. **Marca:** verde-azulado `#06929f` (botão padrão do ADS), ciano `#00dae7` (destaque), escuro `#003a40` (hover) e `#074a4e` (texto) `[CONF]`.
4. **Fonte:** **Inter** (ADS, plataforma e site) `[CONF]`. O app de IA usa Geist (§1).
5. **Forma:** botão e campo com raio 8 px; cartões de 16 px; borda 1 px cinza-neutra; sem sombra no cartão; muito espaço em branco `[CONF]`.
6. **Contraste:** texto branco sobre `#06929f` tem **3,74:1** (calculado; sobre `#12949c`, 3,66:1): não passa em AA para texto pequeno. O próprio ADS traz o tom acessível: `Aprova---90 = #0d787e` (5,24:1) `[CONF]`. **Use `#0d787e` em botões com texto.**
7. **Padrão de tela de trabalho** (plataforma): barra superior + abas + *breadcrumb* + cabeçalho com ícone + tabela com filtro por coluna + estado vazio com ação `[EST, 2022]` (§3.4).
8. **Princípio de UX mais explícito da empresa:** a IA propõe, o humano aprova — "Nada é feito até você aprovar" `[CONF]` (§5.3).
9. Não use o logotipo, o nome "Aprova" como produto, brasões nem capturas. Mantenha o selo "Protótipo demonstrativo · dados fictícios" (`design.md` §9).

## 1. Mapa das linguagens visuais (não force uma só)

| ID | Contexto | Aparência resumida | Evidência | Quando inspira o hackathon |
|---|---|---|---|---|
| **ADS** | Design system da plataforma de processos (Angular) | Inter; teal `#06929f`; cinzas `#1c1c1c…#f5f7f7`; raio 8/16 px; escala de espaçamento 2–56 px; tokens semânticos (fundo, texto, ícone, borda) | Storybook público (05/2024) + CSS público da plataforma atual `[CONF]` | **Base padrão** para sistemas administrativos, portais, formulários |
| **V2 Plataforma atual (2026)** | Portal público e login de cada prefeitura (ex.: Cascavel) | Fundo branco, cartões com borda de 16 px, botão primário **escuro** `#1c1c1c` e secundário em contorno, login em tela dividida com foto da cidade | Renderizado e medido nas páginas públicas `[CONF]`; área interna **não vista** | Portal do cidadão, login, página de serviços |
| **V2h Plataforma 2022** | Telas internas e públicas em capturas da App Store (ago/2022) | Botões teal em caixa alta, azuis escuros, abas com ícone, tabela com filtro por coluna, fundo com ilustração em linhas | Capturas oficiais `[EST]` | **Composição** de caixa de entrada/processos; o acabamento é mais antigo |
| **V3 Aprova IA** | App `ai.aprova.com.br` | Monocromático neutro (shadcn/ui), Geist, raio 10 px, moldura "surface", ciano `#0891b2` só para IA, temas claro/escuro/Banco do Brasil | CSS do app `[CONF]` | Qualquer interface com IA/chat/aprovação |
| **V1 Site** | `aprova.com.br` | Fundo `#fdfdfd`, CTA ciano com texto escuro, Inter/Geist/Space Grotesk | CSS público `[CONF]` | Landing/abertura do pitch; **não** para telas internas |
| **V4 App iOS** | App Store, v1.2 (03/2024) | *Wrapper* da web; barra azul `#2196f3` do invólucro (não é marca) | Ficha + capturas `[CONF]` | Nada novo; mobile = mesma web |
| **V5 Vitrines** | Telas desenhadas nas páginas de solução | Cartões 12 px, abas com sublinhado `#0891b2`, selos amarelo/verde, linha do tempo | CSS/HTML `[CONF]` como **representação** | Densidade e composição de telas de processo |

Regra: **escolha uma base por projeto** e registre em `design.md` §1 (`[DEC]`). Padrão do kit: **ADS** (§2) + composição V2h/V5 (§3.4, §5) + acabamento sóbrio de V3. V1 só fora do aplicativo. IA: combine ADS (cor/forma) com o padrão de aprovação de V3.

## 2. A. Padrões confirmados: tokens do ADS `[CONF]`

Fonte: CSS público da plataforma, bloco `:root` (F-18), e Storybook (F-17). Nomes originais entre crases.

### 2.1 Escalas

| Grupo | Valores |
|---|---|
| Espaçamento `--Spacing-*` | 2XS 2 · XS 4 · S 8 · M 12 · L 16 · XL 20 · 2XL 24 · 3XL 28 · 4XL 32 · 5XL 40 · 6XL 48 · 7XL 52 · 8XL 56 px |
| Traço `--Stroke-*` | XS .5 · S 1 · M 2 · L 4 px |
| Raio `--Radius-*` | 2XS 2 · XS 4 · S 8 · M 12 · L 16 · XL 24 · 2XL 32 · Full 999 px |
| Pontos de quebra | sm 576 · md 768 · lg 992 · xl 1200 px (herdados do Bootstrap) |
| Foco `--Focus-Ring` / `--Focus-Ring-Offset` | `#1c1c1c` / `#ffffff` (e o inverso no tema escuro) |

### 2.2 Paleta

| Escala | Passos (hex literais) |
|---|---|
| **Aprova** (`--Aprova---nn`) | 10 `#f6fbfb` · 20 `#e0f6f7` · 30 `#c2f2f5` · **40 `#00dae7`** · 50 `#16cfda` · 60 `#14bac4` · 70 `#11aab3` · 80 `#12949c` · 85 `#10838a` · **90 `#0d787e`** · **100 `#074a4e`** |
| **Greyscale** | 0 `#ffffff` · 10 `#f5f7f7` · 20 `#eef0f0` · 30 `#dee0e0` · 40 `#cacccc` · 50 `#aeb0b0` · 60 `#9a9c9c` · 65 `#949494` · 70 `#868787` · 75 `#6b6b6b` · 80 `#656666` · 90 `#404141` · **100 `#1c1c1c`** |
| **Red** | 10 `#ffebeb` · 20 `#ffbfbf` · **60 `#dc2626`** · 70 `#ba1515` · 80 `#980808` · 90 `#760000` · 100 `#540000` |
| **Orange** | 10 `#ffefe7` · 20 `#ffd2bb` · **60 `#ea580c`** · 70 `#c14200` · 80 `#983400` · 90 `#702600` · 100 `#471800` |
| **Green** | 10 `#eefff9` · 20 `#cffff0` · 70 `#35e8b0` · **80 `#19bf8b`** · 90 `#059669` · 100 `#055b40` |
| **Blue** | 10 `#ebf4ff` · 20 `#c8e1ff` · **70 `#1d74d8`** · 80 `#0856af` · 90 `#003f86` · 100 `#002c5d` |
| Gráficos `--Charts-*` | Red `#dc2626` · Blue `#1d74d8` · Orange `#ea580c` · Green `#19bf8b` · Yellow `#e6b52f` · Purple `#c25dc4` |
| Auxiliares | `--Alt-Color-Neutral-Inverse-1/2` `#00b2bf` / `#36cab2` |

Passos omitidos na tabela existem no CSS (10 a 100 por família). Tokens antigos ("Neutral"/"New" e o Storybook de 05/2024) ainda presentes: `Neutral-Black #111827`, `Medium-Gray #B6BEC5`, `Neutral-Blue #0369A1`, `Light-Blue #E0F2FE`, `New-Blue #2975CC`, `New-Light-Blue #E4F1FF`, `New-Dark-Blue #023E82`, `New-Green #3CA663`, `New-Red #D64457`, `New-Yellow #DB9754`; suporte `Disabled-dark #A9ACB1`, `Disabled-light #D4D5D8`, `Error-background #FEE2E2`, `Error-text #9F2828`; Storybook ainda lista `Aprova Pay` (`#00353A`, `#0FAF7F`, `#E5EBEC`, `#CFEFE5`) como marca irmã. **Tokens novos (escala Aprova/Greyscale) prevalecem sobre os antigos.**

### 2.3 Tokens semânticos (papel → escala)

| Papel | Token | Resolve para |
|---|---|---|
| Fundo da página / secundário / terciário | `Background-Neutral-Primary / Secondary / Tertiary` | Greyscale 10 `#f5f7f7` / 20 `#eef0f0` / 30 `#dee0e0` |
| Superfície | `Background-Neutral-White` | `#ffffff` |
| Fundo desabilitado | `Background-Neutral-Disabled` | Greyscale 30 |
| Fundo de marca (suave) | `Background-Aprova-Secondary / Tertiary` | Aprova 10 / 20 |
| **Fundo invertido (ação de marca)** | `Background-Neutral-Inverse-Primary / Secondary / Tertiary` | **Aprova 90 `#0d787e`** / 85 `#10838a` / 100 `#074a4e` |
| Texto | `Text-Neutral-Primary / Secondary / Tertiary / Disabled` | Greyscale 100 `#1c1c1c` / 80 `#656666` / 75 `#6b6b6b` / 50 `#aeb0b0` |
| Texto de marca / invertido | `Text-Aprova-Primary` / `Text-Neutral-Inverse-Primary` | Aprova 100 `#074a4e` / Aprova 10 |
| Ícone | `Icon-Neutral-Primary / Secondary / Tertiary`; `Icon-Aprova-Primary` | Greyscale 80 / 70 / 60; Aprova 90 |
| Borda | `Border-Neutral-Primary / Secondary / Tertiary / Disabled`; `Border-Aprova-Primary` | Greyscale 70 / 40 / 30 / 20; Aprova 90 |
| Sucesso (fundo suave · forte · texto · borda) | `…Success-Subtle / Bold`, `Text-…-Primary`, `Border-…-Primary` | Green 10 · Green 80 · Green 100 · Green 90 |
| Alerta | idem `Warning` | Orange 10 · Orange 60 · Orange 90 · Orange 80 |
| Erro | idem `Error` | Red 10 · Red 60 · Red 70 · Red 60 |
| Informação | idem `Info` | Blue 10 · Blue 70 · Blue 80 · Blue 80 |

Cada família semântica tem ainda `Tertiary` (passo 20 da escala) e variante `Inverse` (texto/ícone branco sobre o fundo forte).

### 2.4 Tipografia

| Item | Valor `[CONF]` |
|---|---|
| Família | **Inter** (ADS, plataforma, site); alternativas na pilha: "Nunito Sans" (só nos componentes), "Helvetica Neue", Arial, sans-serif |
| Pesos documentados no ADS | 400 (regular), 700 (bold), 800 (extrabold), 900 (black); na plataforma aparecem 100, 400, 500, 700, 800 |
| Títulos (`ads-h1…h6`) | H1 56/64 · H2 48/54 · H3 40/48 · H4 32/40 · H5 24/32 · H6 20/28 px (tamanho/entrelinha); variante `-bold` = 700 |
| Corpo (`ads-body-*`) | paragraph 16/24 · small 14/20 · extra-small 12/16 px |
| Botão (`ads-button-*`) | large 18/26 · medium 16/24 · small 14/20 px |
| Em uso no portal atual | nome do órgão 30 px, peso **100** · título de seção 24 px/700 · subtítulo 20 px/800 · item de lista 14 px `#404040` · botões 14 px/500 · rótulo de campo 14 px/500 `#1c1c1c` |

Atenção: o ADS publica `font-weight: 100` no botão (computado). É **fino** na intenção ou defeito de CSS `[INF]`; **não replique**: use 500/600 (`[REC]`).

### 2.5 Fonte, ícones e movimento

| Item | Valor |
|---|---|
| Ícones | Pacote próprio (`Icon`, `Icons/Outline`, `Icons/Solid`): SVG 24 px, traço 2, extremidades arredondadas `[CONF]`; estilo equivalente a conjuntos "outline/solid" tipo Heroicons `[INF]`. A plataforma ainda carrega Material Design Icons e Simple Line Icons `[CONF]` |
| Carregamento | Spinner SVG de 16 px (1 s, linear) dentro do botão; entrada do spinner 0,3 s `[CONF]` |
| Foco | Anel `#1c1c1c` com *offset* branco `[CONF]` |

## 3. A. Componentes confirmados

### 3.1 Componentes do ADS (Storybook, Angular) `[CONF]`

| Componente | Valores publicados |
|---|---|
| **Button** | Fundo `#06929f`, texto branco, **raio 8 px**, sem borda, largura 100 % do contêiner. Tamanhos: **small** 36 px de altura · 14 px · padding 10×16 · **medium** 44 px · 16 px · 11×20 · **large** 60 px · 18 px · 12×24. **Hover** `#003a40`. **Disabled** fundo `#a9acb1`, texto `#d4d5d8`, cursor *not-allowed*, sem mudança no hover. **Loading** spinner branco de 16 px à esquerda do rótulo (`role="status"`), padding-left 30 px. Só existe a variante primária publicada |
| **Input** | Rótulo 14 px `#808b98` acima; campo **44 px** de altura, padding 10×14, **raio 8 px**, borda 1 px `#c4cbd1`, fundo branco, *placeholder* 16 px `#808b98` ("Digite o seu e-mail"); mensagem de erro em vermelho abaixo |
| **Alert** (aviso/*snackbar*) | Cartão branco **355 px**, raio 10 px, borda 1 px `#eee`, sombra `2px 5px 15px rgba(0,0,0,.2)`, padding 16; ícone circular de 24 px à esquerda (sucesso `#10b981`); título 14 px preto; descrição 14 px/600 `#6b7280` (máx. 2 linhas); ações em texto 14 px/600: confirmar `#06929f`, cancelar `#6b7280`; botão de fechar (X) à direita |
| **Icon** | 24 px, `stroke="currentColor"`, traço 2 |
| **Typography** | Classes `ads-h1…`, `ads-body-*`, `ads-button-*` (§2.4) |

**Não existem no Storybook:** tabela, cartão, aba, modal, selo, *breadcrumb*, seletor, checkbox. Esses ficam em §3.2/§3.4 (observados) ou §6 (recomendados).

### 3.2 Produção atual (2026): portal público e login (Cascavel) `[CONF]` (medido na página renderizada, sem autenticar)

| Componente | Aparência medida |
|---|---|
| Cabeçalho do órgão | Altura **105 px**, fundo branco, borda inferior 1 px `#cacccc`; brasão + nome em 30 px/100 + "Fone" em 14 px/700; à direita **Criar conta** (contorno) e **Acessar minha conta** (primário escuro) |
| Botão primário | Fundo `#1c1c1c`, texto branco, **36 px** de altura, padding 8×16, 14 px/500, raio 8 px |
| Botão secundário | Fundo branco, borda 1 px `#868787`, texto `#656666`, mesmas medidas |
| Botão-busca grande | Altura 50 px, padding 12×16, 16 px/500, **raio 16 px**, contorno `#868787`, ícone de lupa |
| Cartão da página | Fundo branco, borda 1 px `#cacccc`, **raio 16 px**, padding 24 (40 em telas ≥ xl), sem sombra; 2 colunas de 612 px com intervalo de 24 px (em 1440 px) |
| Lista de serviços | Itens 14 px `#404040`, padding 6×0, divisor 1 px `#d4d4d4`; botão de contorno **Ver mais** |
| Bloco "Precisa de ajuda?" | Título 20 px/800 e lista com links 16 px/700 `#656666` |
| Botão de chat | Círculo 56 px `#10838a` (Aprova 85), sombra `0 8px 24px rgba(0,0,0,.16)`; é *widget* de terceiro (classe `pylon-prechat-launcher`) |
| Conteúdo do órgão | Bloco "Instituto de Planejamento…" com fundo rosado e texto `#003a40`: **conteúdo editado pelo órgão**, não é padrão do ADS |
| **Login** | **Tela dividida:** à esquerda painel claro com brasão, nome, telefone e "Powered by Aprova"; à direita **foto da cidade em tela cheia** com cartão branco central (442 px, padding 40, raio 8 px). Título "Acesse sua conta", link "Crie sua conta" (`#074a4e`, 14 px/500), rótulos 14 px/500, campos de 42 px com ícone de olho na senha, caixa "Lembrar de mim", link "Esqueci minha senha", **Entrar** = Button medium do ADS (teal, largura total) |

### 3.3 Componentes do site e do app de IA `[CONF]`

| Componente | Valores |
|---|---|
| Botão do site (V1) | Fundo `#00dae7`, texto `#020a0f` 14 px, padding 10×24, raio 7 px, hover `brightness(1.05)` |
| Aba "pílula" (V1) | Raio 9999, ativa em ciano com texto escuro |
| Menu suspenso (V1) | Borda `#d9d9d9`, fundo `#fdfdfd`, sombra `0 18px 40px -18px #0000002e`, seta de 10 px, 0,26 s |
| Barra de navegação (V1) | *Sticky*; linha inferior 1 px; ao rolar: fundo `#fdfdfda6` + `blur(12px)` |
| Moldura "surface" (V3) | Trilho lateral + conteúdo branco, raio 12 px, margem 8 px; fundo da moldura `oklch(95.5% 0 0)`; temas `aprova-light`, `aprova-dark`, `bb` (azul `#3853ff`) |
| Aprovação de IA (V3) | Cartão "Precisa da sua confirmação" com **Recusar / Aprovar**, pré-visualização, "Escrito pelo agente — revise antes de criar." |
| Cores de IA (V3) | `--ia #0891b2` · `--ia-fg #0e7490` · `--ia-bg oklch(96.5% .02 215)` · `--positive #16a34a` · `--negative #dc2626` · `--attention #f59e0b` |
| Selos (V5) | `Em trâmite` `#fef3c7`/`#92400e`; `Concluído` `#dcfce7`/`#166534`; ícone de status em círculo de 18 px |
| Abas de detalhe (V5) | Linha 1 px; ativa com sublinhado de 2 px `#0891b2` |
| Carregamento (V3) | Logo + trilho de 3 px animado + "Carregando…"; respeita `prefers-reduced-motion` |

Raios do site e vitrines: botão 7 px · campo 8 px · cartão 12 px · moldura 16 px · chip 6 px. Sombra de cartão (V5): `0 1px 2px #0000000a, 0 12px 32px -12px #00000014`. Duração padrão `.15s`; menus `.14–.26s`; todas respeitam `prefers-reduced-motion`.

### 3.4 Telas internas da plataforma (V2h, 2022) `[EST]`

Capturas oficiais de 10/08/2022 (F-12), ambiente-demo fictício. **Acabamento anterior ao ADS atual**, mas a **composição** é a melhor evidência pública de tela de trabalho. Cores medidas no pixel; `#0369a1` coincide com `Neutral-Blue` do ADS e `#05919e`/`#00dae7` com a marca; `#1d4ed8`, `#dbeafe`, `#f9fafb`, `#f3f4f6` coincidem com a paleta padrão do Tailwind (blue-700/100, gray-50/100) e **não** são tokens do ADS `[INF]`.

| Componente | Observado |
|---|---|
| Barra superior | Logotipo; à direita **Treinamento** (azul-escuro `#0369a1`), **+ Criar** (`#05919e`), sino, "?", avatar com iniciais |
| Navegação | Abas com ícone + rótulo: *Minha caixa · Processos · Processos para aceite*; ativa com fundo cinza-claro |
| *Breadcrumb* | Faixa `#f3f4f6` de largura total com setas |
| Cabeçalho de página | Ícone em círculo `#dbeafe` + título ~24 px/500 + subtítulo cinza |
| Abas de visão | "▦ Padrão" com barra azul grossa sob a aba |
| Tabela | Cabeçalho em CAIXA ALTA pequena; **linha de filtros "Buscar aqui" por coluna**; ordenação por seta; colunas: *Nº do processo, Requerimento, Requerente, Proprietário, Criado em, Última ação, Status atual, Com quem estava, Recebido em, Ações* |
| Barra de ferramentas | Busca com lupa ("Procurar") + botão azul `#1d4ed8` **Atualizar** |
| Estado vazio | Ícone de prancheta + "Parece que você ainda não tem processos" + "Crie um processo para começar" + botão **+ Criar processo** |
| Catálogo de serviços | Grade de 2 colunas de cartões (título, descrição, botão cinza **Solicitar ▾**); grupos "01. Licenciamento de Obras"; botão **Meus rascunhos**; busca |
| Assistente de criação | "‹ Voltar", **"Passo 1 de 2"**, 3 blocos selecionáveis com ícone (*Nominal · Sigiloso · Anônimo*), nota explicativa, rodapé com **Continuar** |
| Formulário de cadastro | 2 colunas, rótulos em caixa alta, caixa de termos, botão **CRIAR CONTA** claro até o formulário ficar válido |
| Consulta pública | "Verifique a autenticidade do seu processo": *Número do processo* + *Código validador* + **VERIFICAR**; "Código do processo" + **ACOMPANHAR PROCESSO** |
| Ajuda e novidades | Botão flutuante ciano "?" em todas as páginas; botão de presente com contador vermelho abrindo cartão "NOVIDADES · Nova Análise Online!" |

## 4. B. Padrões recorrentes inferidos `[INF]`

Sustentados por mais de uma fonte, **não confirmados como regra da empresa**.

1. **Neutro primeiro; cor só onde há ação, status ou IA.** ADS, V2, V3 e V1 concordam.
2. **Duas famílias de ação coexistem:** *escura neutra* (`#1c1c1c`, portal atual e `--action` da IA) e *teal* (`#06929f`, botão do ADS e login). Teal = marca/ação de formulário; escuro = ação de página.
3. **Raio 8 px em controles e 16 px em contêineres** (ADS e portal); 10–12 px na IA e vitrines.
4. **Bordas de 1 px em vez de sombra**; sombra só em flutuantes (alerta, chat, menu).
5. **Estado = texto + ícone/cor** ("Em trâmite", "conferida", "vencida", "aguardando aprovação").
6. **Rótulos de campo curtos** ("Requerente", "Criado em"); **botões em verbo** ("Solicitar", "Criar", "Entrar", "Aprovar").
7. **Filtro por coluna na tabela** e **visões salvas** em abas (V2h).
8. **Ajuda sempre à mão** (botão flutuante, "?", Treinamento, "Precisa de ajuda?").
9. **Co-marca/tenant como tema**: crest e nome do órgão no cabeçalho, "Powered by Aprova"; temas `bb`/`aprova-*` (V3); domínio `bbgovernodigital.com.br` para Cascavel `[CONF]`.
10. **Identidade de processo realista** (em vitrines): número `NNNN-AA-SIGLA` ou `AAAA/NNNN`, datas `dd/mm/aaaa`, atores nomeados ("Robô Sisobra").
11. A plataforma se apoia em **Bootstrap 4 + Angular Material + ADS** (classes `badge-pill`, `mdc-snackbar`, variáveis `--bs-*` no CSS) `[INF]`: telas internas provavelmente misturam componentes desses três.

## 5. UX, fluxos e linguagem

### 5.1 Fluxos observados

| Fluxo | Passos | Fonte |
|---|---|---|
| Cidadão acessa | Portal → **Consultar status de documentos/processos** (busca grande) ou lista de serviços → Criar conta / Acessar minha conta → Login | F-19, F-20 `[CONF]` |
| Cidadão cria processo | Portal → serviço → **privacidade** (Nominal/Sigiloso/Anônimo) → continuar (passo 1 de 2) | F-12 `[EST]` |
| Cidadão acompanha | Código do processo → "Acompanhar processo"; ou nº + código validador → "Verificar" | F-12 `[EST]` |
| Servidor trabalha | Caixa de entrada → abrir processo → abas **Resumo · Área interna · Taxas · Histórico · Documentos** → ação | F-12, F-07 `[INF]` |
| Linha do tempo | Ação · data·hora · ator (ex.: "Taxa paga — Confirmação automática") | F-07 (vitrine) |
| Validação automática | Cartão com valores ("48% de 60%", "4,0 m de 4,0 m") e frase de próximo passo | F-07 (vitrine) |
| Leitura de documentos | Estado por documento: *conferida · assinado · vencida* | F-07 (vitrine) |
| Aprovação de IA | IA escreve → pré-visualização → **Recusar / Aprovar** → só então grava | F-05, F-10 `[CONF]` |

**Não observado (não invente):** análise técnica completa, detalhe real do processo, formulário longo, mensagens de validação da plataforma, permissões/ações indisponíveis, interface interna atual (2026).

### 5.2 Linguagem, nomenclatura e microcopy

| Domínio | Termos |
|---|---|
| Navegação | Minha caixa, Caixa de Entrada, Processos, Meus processos, Processos para aceite, Criar, Treinamento, Novidades, Portal de Serviços, Serviços disponíveis, Precisa de ajuda? |
| Entidades | Processo, Requerimento, Requerente, Proprietário, Detentor, Despacho, Assunto, Modelo, Formulário, Etapa, Prazo, Taxa, Condicionante, Alvará, Habite-se, Licença |
| Estados | Em trâmite, Em andamento, Concluído, Em criação, Retornou para análise, Aguardando sua assinatura, aguardando aprovação, conferida, vencida, assinado |
| Ações | Solicitar, Criar conta, Acessar minha conta, Entrar, Esqueci minha senha, Ver mais, Criar processo, Atualizar, Procurar, Continuar, Voltar, Verificar, Acompanhar processo, Aprovar, Recusar |
| Privacidade | Nominal, Sigiloso, Anônimo |

Voz (mensagens reais do app de IA, F-10): **frase direta + próxima ação** ("Este link expirou. Peça um novo."; "Não achei processos deste assunto que você possa ver."); **2ª pessoa informal** ("você", "pra"); **estado vazio que convida** ("Parece que você ainda não tem processos / Crie um processo para começar."); **garantia de controle** ("Sem o seu Aprovar, nada entra no processo"); **prazos relativos** ("há 3 dias"). Placeholders de campo em exemplo ("Digite o seu e-mail"; 2022: "exemplo: joao@prefeitura.org.br").

### 5.3 Padrão de UX com IA `[CONF]`

1. A IA **propõe**; cartão com **o que será feito** + "Recusar / Aprovar".
2. Saída **editável** antes de gravar e **rotulada** ("Escrito pelo agente — revise antes de criar").
3. Cada dado tem **origem** ("Cada campo tem uma origem. É o que impede a IA de inventar").
4. Dado ausente é dito como ausente ("Informa quando um dado não consta no documento").
5. Sugestões clicáveis **só escrevem na caixa**; quem envia é o usuário.

No protótipo, a IA simulada continua **rotulada** ("Resposta simulada", `honestidade-e-dados.md`).

## 6. C. Recomendações para o hackathon `[REC]`

> Nada desta seção é regra da Aprova. O protótipo é **original**.

### 6.1 Tokens recomendados (prontos em [`aprova-tokens.css`](aprova-tokens.css))

| Papel | Valor | Origem |
|---|---|---|
| Fundo da página / superfície | `#f5f7f7` / `#ffffff` | ADS `Background-Neutral-Primary` / `White` |
| Texto principal / secundário / apoio | `#1c1c1c` / `#656666` / `#6b6b6b` (≥ 14 px) | ADS `Text-Neutral-*` (AA ok) |
| Borda de cartão / divisor | `#cacccc` / `#dee0e0` | ADS `Border-Neutral-Secondary/Tertiary` |
| **Ação de marca (botão com texto)** | `#0d787e`, hover `#074a4e`, texto branco | ADS `Aprova---90/100` (5,24 : 1 / 10,0 : 1) |
| Marca para ícone, borda, foco, barras grandes | `#06929f` | ADS Button (`[CONF]`; texto branco < 4,5 : 1) |
| Destaque | `#00dae7` com texto `#020a0f` | Site/ADS `Aprova---40` |
| Fundo suave de marca | `#e0f6f7` / `#f6fbfb` | `Aprova---20/10` |
| Ação de página neutra | `#1c1c1c`, texto branco (17 : 1) | Portal atual |
| Sucesso · alerta · erro · info | fundo `#eefff9` · `#ffefe7` · `#ffebeb` · `#ebf4ff`; texto `#055b40` · `#702600` · `#ba1515` · `#0856af`; forte `#19bf8b`* · `#ea580c`* · `#dc2626` · `#1d74d8` | ADS semânticos (*só ícone/fundo, não texto) |
| IA | `#0891b2` (ícone) · `#0e7490` (texto) · fundo `#e6f5f8` (aproximação sRGB de `oklch(96.5% .02 215)`, não literal) | V3 |
| Raios | controle 8 · cartão 16 · selo 999 · alerta 10 | ADS |
| Espaçamento | 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 | ADS `Spacing` |
| Fonte | **Inter**, local (`npm i @fontsource-variable/inter` `[NV]` não executado) | ADS |
| Escala | 12 · 14 · 16 · 20 · 24 · 32 · 40 · 48 · 56 (títulos 700; corpo 400; botão 500/600) | ADS `ads-*` |
| Altura de controle | 36 (pequeno) · 44 (padrão) · 50–60 (destaque) | ADS/portal |
| Sombra | só em flutuantes: `0 8px 24px rgba(0,0,0,.16)` | portal (chat) |
| Duração | 150 ms, 250 ms em painéis; respeite `prefers-reduced-motion` | V1/V3 |

### 6.2 Receita de tela pelo público do desafio

| Se o desafio é… | Receita | Elementos |
|---|---|---|
| Sistema para **servidor/analista** | **A. Área de trabalho** | Barra superior (marca fictícia, "Criar", ajuda, avatar) · abas com ícone · *breadcrumb* · cabeçalho com ícone e subtítulo · abas de visão · tabela com filtro por coluna · estado vazio com ação · detalhe com abas *Resumo/Histórico/Documentos* · linha do tempo com ator e hora |
| Serviço para **cidadão/empresa** | **B. Portal público** | Cabeçalho do órgão (borda inferior 1 px) · busca grande no topo · cartões de 16 px · lista de serviços com divisores · "Ver mais" · "Precisa de ajuda?" · login em **tela dividida** com foto · assistente "Passo n de N" |
| **IA/assistente** | **C. Assistente** | Trilho lateral + conteúdo branco sobre cinza · conversa · cartão de confirmação **Recusar/Aprovar** · pré-visualização editável · cor de IA só nos blocos de IA |
| **Mobile em campo** | A/B em coluna única | Alvos ≥ 44 px (altura de controle do ADS; a v1.2 do app aumentou itens de lista "para melhorar o clique" `[CONF]`), menu em gaveta, tabela vira cartões |

Desafio de "análise assistida por IA": **A** (a fila) + **C** (o painel de aprovação).

### 6.3 Aplicação sem copiar

1. **Traduza a lógica, não a tela:** hierarquia (onde estou → o que importa → o que fazer), com **sua** marca fictícia, dados e fluxo.
2. Reaproveite **estrutura** (cabeçalho + abas + tabela + estado vazio) e **vocabulário** (§5.2) quando o domínio for processo/serviço público; fora dele, só tokens e acabamento.
3. **Nome e logotipo próprios.** Nada de logotipo "A", brasões ou capturas.
4. Dados no padrão realista, **todos fictícios**, "hoje" fixo.
5. Componente novo só se nenhum de §3 serve; registre em `design.md` §3.
6. Em conflito entre ADS e outro produto, **o ADS vence**, salvo se o projeto for de IA (então V3 para o painel de aprovação).

### 6.4 Prioridade de polimento em tempo curto (≈ 6 h)

1. **Tokens + shell** (cor, Inter local, raio, borda, cabeçalho): 20–30 min, muda tudo.
2. **Hierarquia da tela-vitrine:** título informativo, uma ação primária, subtítulo, grade de 4 px.
3. **Selos de status e linha do tempo** com ator/data/hora.
4. **Estados:** vazio (ícone + frase + botão), carregando (spinner no botão), sucesso, erro típico.
5. **Microcopy** do vocabulário §5.2 ("frase + próxima ação").
6. **Dados plausíveis e variados** (um atrasado, um aguardando, um concluído).
7. Foco visível (`#1c1c1c` + offset branco), contraste (§2 e `aprova-tokens.css`), tela vista no monitor do evento.
8. Só depois: foto/ilustração de fundo, ícones extras, animação.

Cortes seguros: modo escuro, múltiplos temas, ilustração, mapas, gráficos sem pergunta. Máximo ≈ 1 h em identidade; clareza do problema e do fluxo pesam mais (`CLAUDE.md` do kit §1).

### 6.5 Honestidade e coerência

- Interface convincente **não** é funcional: rotule simulações (`design.md` §9); regra do botão vivo (`CLAUDE.md` do kit §6).
- No pitch: "inspirado na linguagem visual pública da Aprova", nunca "segue o design system oficial".
- Não reuse números das vitrines ("2%", "mais de 130 prefeituras") como seus (`honestidade-e-dados.md`).
- Se a organização do evento fornecer guia de marca ou identidade, **ele prevalece** sobre este documento.

### 6.6 Checklist "coerência Aprova" (marque só o que viu na tela)

```text
[ ] Fundo neutro claro (#f5f7f7/#fff); cor só em ação principal, status e IA
[ ] Botão com texto: fundo ≥ 4,5:1 (#0d787e ou #1c1c1c), nunca branco sobre #06929f em texto pequeno
[ ] Controles raio 8 px; cartões 16 px; bordas 1 px #cacccc; sem sombra em cartão
[ ] Inter local; escala curta; corpo ≥ 14 px; títulos 700
[ ] Altura de controle 36/44 px; espaçamento em múltiplos de 4
[ ] Cabeçalho de página: título informativo + subtítulo + UMA ação principal
[ ] Tabela com filtro/busca, status com texto+cor, estado vazio com ação
[ ] Foco visível (#1c1c1c + offset branco); prefers-reduced-motion respeitado
[ ] Se há IA: cor própria, rótulo, pré-visualização, Recusar/Aprovar, origem do dado
[ ] Marca e nome próprios; selo "Protótipo demonstrativo · dados fictícios"
```

## 7. Lacunas e como fechá-las

| Lacuna | Impacto | Como fechar (exige humano) |
|---|---|---|
| Interface interna autenticada atual (2026) não inspecionada | Tabela, abas, detalhe e formulários internos seguem só por capturas de 2022 e vitrines | Pedir à organização capturas ou conta de demonstração; registrar em `ESTADO.md` §8 |
| Storybook cobre só Button, Input, Alert, Icon, Colors, Typography (05/2024) | Tabela, cartão, aba, modal, selo sem especificação oficial | Inspecionar a plataforma logada no evento; até lá usar §3.4 e §6 |
| `font-weight: 100` no botão do ADS | Possível defeito | Confirmar com a equipe da Aprova se há mentores |
| Android, vídeos (YouTube), central de ajuda (HTTP 403) | Menos exemplos de telas | Conferir manualmente |
| Licença de Inter e dos ícones | — | Conferir a do pacote instalado |
