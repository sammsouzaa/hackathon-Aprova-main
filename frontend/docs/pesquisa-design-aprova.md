# Pesquisa de design e UX dos produtos da Aprova Digital: relatório, fontes e rastreabilidade

| Campo | Valor |
|---|---|
| Versão / data | 1.1 · 22/10/2026 (todas as fontes acessadas nesta data) |
| Escopo | Identidade visual, design system, componentes, UI/UX e linguagem dos produtos digitais da Aprova (marca atual "Aprova"; razão social Aprova Digital S.A.) |
| Método | Leitura de HTML/CSS/JS estáticos **públicos** (sem login); Storybook público; páginas públicas renderizadas em navegador com medição de estilo computado; ficha e capturas oficiais da App Store; busca na web; medição de cor por pixel |
| Uso | Evidência por trás de [`design-system-aprova.md`](design-system-aprova.md). Quem só constrói interface não precisa ler este arquivo. |
| Limites éticos respeitados | Nenhum login, cadastro, envio de formulário ou contorno de restrição; nenhum campo foi preenchido; páginas de autenticação foram apenas **vistas** |

## 1. Conclusão em 10 linhas

1. A Aprova **tem design system próprio** ("ADS", Angular) com **Storybook público** (gerado em 17/05/2024) cobrindo Colors, Typography, Button, Input, Alert e Icon. Ele **não é linkado** no site institucional; foi localizado ao testar nomes de subdomínio convencionais (F-17).
2. Os **tokens atuais** estão no CSS público de todas as plataformas por prefeitura (`*.aprova.com.br`): escalas de espaçamento, traço, raio, paleta Aprova/Greyscale/Red/Orange/Green/Blue e **tokens semânticos** de fundo, texto, ícone e borda (F-18).
3. A plataforma é uma SPA **Angular** que mistura **ADS + Angular Material + Bootstrap** (classes e variáveis `--bs-*`, `mdc-*`) (`[INF]`).
4. Fonte da plataforma e do ADS: **Inter**. App de IA: **Geist**. Site: Inter + Geist + Space Grotesk.
5. Cor de marca: **verde-azulado `#06929f`** (botão ADS), **ciano `#00dae7`**, escuro `#003a40`/`#074a4e`. Há tom **acessível** oficial `#0d787e` (`Aprova---90`) para fundos com texto branco.
6. O **portal público atual** (ex.: Cascavel, sede do hackathon) usa botão primário **escuro `#1c1c1c`**, contorno cinza no secundário, cartões de 16 px e **login em tela dividida** (F-19, F-20). As capturas de 2022 mostram um acabamento mais antigo (F-12).
7. A **IA** tem identidade própria (ciano `#0891b2`, shadcn/Geist neutro) e um padrão de UX explícito: propor → pré-visualizar → **Recusar/Aprovar** (F-06, F-10).
8. Há **tema por co-marca** (Banco do Brasil `#3853ff`; Cascavel roda em `bbgovernodigital.com.br`).
9. **Não foi possível** inspecionar a interface interna autenticada (caixa, tabela, detalhe de processo) na versão atual; só capturas de 2022 e vitrines.
10. O Storybook cobre **apenas 4 componentes**; tabela, cartão, aba, modal e selo não têm especificação pública.

## 2. Fontes

Natureza: **O** oficial da empresa · **P** pública oficial de terceiro (loja) · **S** secundária. Confiança: **A** alta · **M** média · **B** baixa.

| ID | Fonte (URL) | Natureza | Data da fonte | O que forneceu | Conf. |
|---|---|---|---|---|---|
| F-01 | https://aprova.com.br/ (HTML) | O, institucional | n/d | Estrutura, `theme-marca`, CTA, referências de fonte | A |
| F-02 | https://aprova.com.br/_astro/CookieConsentBanner.B59nXtOv.css | O, CSS público | n/d | `--color-aprova-*`, escala de texto, raios, easing | A |
| F-03 | https://aprova.com.br/_astro/DarkLayout.jXAJj2fo.css | O, CSS público | n/d | `.theme-marca`, navegação, menus, `prefers-reduced-motion` | A |
| F-04 | https://aprova.com.br/_astro/TelaMockup.BcyGy2bO.css · `/_astro/index.CWHIsCfN.css` | O, CSS público | n/d | Estilo das telas de produto **desenhadas** (V5) | A (representação) |
| F-05 | https://aprova.com.br/funcionalidades/aprova-ia | O, institucional | n/d | Textos de telas demonstrativas da IA | M |
| F-06 | https://ai.aprova.com.br/ · `/assets/index-DF-0iaiD.css` | O, **aplicação web** pública | n/d | Tokens `shadcn`, `--ia*`, `--positive/--negative/--attention`, temas, layout "surface", citação de `@aprova/design-system` | A |
| F-07 | https://aprova.com.br/solucoes/planejamento-urbano | O, institucional | n/d | Telas desenhadas: lista, detalhe com abas, linha do tempo, validação, documento | M (dados fictícios) |
| F-08 | https://aprova.com.br/solucoes/licenciamento-ambiental · /funcionalidades · /funcionalidades/portal-de-servicos · /software-prefeitura | O, institucional | n/d | Contexto e vocabulário | M |
| F-09 | https://aprova.com.br/login | O, portal de acesso | n/d | Seletor de ambiente por cidade/UF (links para cada prefeitura) | A |
| F-10 | https://ai.aprova.com.br/assets/index-C2HMuR5s.js (strings) | O, aplicação web | n/d | Microcopy real de erro, vazio, aprovação, feedback (JS **não executado**) | M |
| F-11 | https://apps.apple.com/br/app/aprova-digital/id1640310090 · API `https://itunes.apple.com/lookup?id=1640310090&country=br` | P, loja | publicado 24/08/2022; v1.2 em 09/03/2024 | Vendedor "APROVA DIGITAL SA", descrição, versão, `bundleId com.prefeituras.net.aprova` | A |
| F-12 | Capturas oficiais da F-11 (10 iPhone + 10 iPad; campos `screenshotUrls` / `ipadScreenshotUrls`) | P, loja (simulador, **10/08/2022**) | 10/08/2022 | Telas da plataforma em ambiente-demo fictício | M (2022) |
| F-13 | https://aprova.movidesk.com/kb/pt-br | O, central de ajuda | n/d | Apenas títulos ("Central de ajuda ao Usuário Interno" / "ao Cidadão"); categorias HTTP 403 | B |
| F-14 | Base do kit: `D01_aprova_digital.md` §3–§4 | Interna | 20–22/10/2026 | Lista de produtos e módulos | M |
| F-15 | Busca na web ("Aprova Digital design system / manual / app") | S | n/d | Nada utilizável sobre interface | B (não usada) |
| F-16 | https://play.google.com/store/apps/details?id=com.prefeituras.net.aprova | P, loja | — | **HTTP 404**: Android não confirmado | — |
| **F-17** | **https://storybook.aprova.com.br/** (`/index.json`, `/project.json`, `iframe.html?id=…`) | **O, design system público** (Storybook 7.6.16, Angular 17.2, gerado 17/05/2024) | 17/05/2024 | **Cores, tipografia, Button, Input, Alert, Icon** com CSS computado das histórias | **A** |
| **F-18** | https://design.aprova.com.br/ e qualquer `*.aprova.com.br` → `styles.3d1f9467ee20e71e.css` (1,8 MB) | O, **CSS da plataforma** (SPA pública não autenticada) | n/d (hash no nome) | `:root` com Spacing/Stroke/Radius, paletas, tokens semânticos, Charts, Focus-Ring; bases Bootstrap/Material | **A** |
| **F-19** | https://cascavel.bbgovernodigital.com.br/home (Portal de Serviços) | O/cliente, **página pública renderizada** | acessada 22/10/2026 | Layout, cabeçalho, cartões, botões, lista, ajuda (medidos por estilo computado) | **A** (estado atual) |
| **F-20** | https://app.aprova.com.br/cascavelpr (login; redirecionado de `/login`) | O, **página de login pública** (vista, **sem preencher nem enviar**) | acessada 22/10/2026 | Layout dividido, formulário, uso do Button do ADS em produção | **A** |

**Nome homônimo:** "Aprova Fácil" (programa de Cascavel) e o "Aprova Digital" da Prefeitura de São Paulo **não** foram usados como evidência de design (D01 §1).

**Conteúdo de órgãos:** o bloco "Instituto de Planejamento de Cascavel" do portal é texto editado pelo município; foi tratado como **conteúdo**, não como padrão.

## 3. Produtos e interfaces pesquisados

### 3.1 ADS: design system (V ADS)

| Item | Registro |
|---|---|
| Finalidade / público | Biblioteca de componentes e tokens da plataforma de processos (desenvolvedores internos) |
| Evidências | F-17 (Storybook) e F-18 (tokens em produção) |
| Padrões | Inter; escalas `Spacing/Stroke/Radius`; paleta `Aprova---10…100`; semânticos; `Button` (3 tamanhos, loading, disabled), `Input`, `Alert`, `Icon`; classes `ads-*` |
| Confiança | **Alta** |
| Não verificado | Hover/foco de Input, variantes do Alert (erro/aviso), ícones individuais, componentes não publicados |
| Observações | O Storybook diz `Aprova Pay` como marca irmã (cores `#00353A`, `#0FAF7F`). `font-weight: 100` no botão: possível defeito. Não há documentação de uso (só as histórias) |

### 3.2 Plataforma de processos (atual e histórica)

| Item | Registro |
|---|---|
| Finalidade / público | Protocolo e tramitação; servidores, analistas, cidadãos e profissionais externos |
| Acesso | Ambiente por prefeitura. **Interna autenticada: não acessada.** Pública e login: vistos |
| Evidências atuais | F-18, F-19, F-20 |
| Evidências históricas | F-12 (ago/2022), F-07/F-08 (vitrines), F-11 |
| Padrões atuais | Portal com cabeçalho do órgão, busca grande, cartões de 16 px, lista de serviços, botão de chat de terceiro; login dividido com foto; Button do ADS |
| Padrões históricos | Barra superior com ações, abas com ícone, *breadcrumb*, tabela com filtro por coluna, estado vazio, assistente "Passo n de N", fundo com ilustração |
| Confiança | **Alta** para o portal/login e tokens; **média/baixa** para telas internas |
| Não verificado | Caixa de entrada, tabela, detalhe de processo, formulários, mensagens de validação, permissões, modo escuro na versão atual |
| Observação | O invólucro iOS exibe "Prefeituras.net" e o *bundle* é `com.prefeituras.net.aprova`: origem/ambiente com esse domínio `[INF]` |

### 3.3 Aprova IA

| Item | Registro |
|---|---|
| Finalidade / público | Assistente conversacional para servidor público; plano gratuito; parceria Banco do Brasil e Aprova (F-10) |
| Evidências | F-06 (CSS/HTML reais), F-10 (textos), F-05 (representação) |
| Padrões | shadcn/ui neutro; Geist; "surface" + trilho; ciano de IA; temas claro/escuro/`bb`/`bb-legacy` |
| UX | Aprovação explícita; sugestões só preenchem a caixa; histórico; feedback; login por link por e-mail; mensagens "frase + ação" |
| Confiança | **Alta** para tokens e microcopy; média para layout (SPA não executada) |
| Não verificado | Telas pós-login |

### 3.4 Site institucional (V1)

| Item | Registro |
|---|---|
| Finalidade | Marketing e geração de demonstrações |
| Evidências | F-01 a F-04 |
| Padrões | `#fdfdfd`/`#222`; seções escuras; CTA ciano com texto escuro; menu suspenso; navegação com desfoque |
| Confiança | Alta para tokens; **não** representa o sistema interno |

### 3.5 App iOS "Aprova Digital" (V4)

| Item | Registro |
|---|---|
| Finalidade | Acesso móvel ao ambiente de licenciamento de obras |
| Evidências | F-11, F-12 |
| Achados | Barra azul `#2196f3` + "Bem vindo ao Prefeituras.net" são do invólucro; conteúdo = web da plataforma; v1.2 (03/2024) só ajustou a altura dos itens da lista de cidades |
| Não verificado | Android (F-16), versão atual |

### 3.6 Telas desenhadas em páginas de solução (V5)

Representações com **dados fictícios** (ex.: "Construtora Horizonte Ltda.", "2481-26-ALV"): evidência de **composição e densidade pretendidas**, não do DOM real.

### 3.7 Não pesquisado / sem evidência suficiente

- **Aplicativo de fiscalização offline**: não encontrado em lojas nem em material público.
- **Portal de transparência / mapa de georreferenciamento**: só mencionados em F-12.
- **Módulos internos** (assinatura, formulário inteligente, Lume, análise online): sem tela pública além de vitrines.
- **Vídeos** do canal oficial (YouTube): não assistidos.
- **Central de ajuda** (Movidesk): HTTP 403 nas categorias.
- **`emkt.aprova.com.br`**: ferramenta de e-mail marketing com tela de login; **não acessada** (provável serviço de terceiros).
- **Outras prefeituras**: só Cascavel foi renderizada; cada tenant pode variar em marca, conteúdo e tema (ex.: Joinville usa domínio próprio).

## 4. Limitações da pesquisa

1. O Storybook publica **apenas** 4 componentes e 2 páginas de base; o resto é inferido ou observado.
2. As histórias mostram o ADS isolado; o CSS da plataforma mistura Bootstrap e Material, então telas internas podem não seguir 100 % o ADS.
3. Cores de capturas são **renderizadas** (PNG de loja, ±1–2 níveis); as capturas têm **4 anos**.
4. O portal e o login de Cascavel foram medidos em **um** viewport (1440×900 e 800×600); o comportamento responsivo não foi testado.
5. O CSS/JS compilado mostra tokens e classes; estados de hover/foco/erro de vários componentes não foram exercitados.
6. Vitrines do site são peças comerciais e podem idealizar a interface.
7. Nenhuma interface foi usada nem testada com usuários.

## 5. Como reproduzir a coleta (somente leitura, sem login)

```bash
# Storybook (design system): lista de histórias e versão
curl -sL https://storybook.aprova.com.br/index.json
curl -sL https://storybook.aprova.com.br/project.json
# Tokens da plataforma (ADS): hash do arquivo muda a cada publicação; descubra em <link rel="stylesheet">
curl -sL https://design.aprova.com.br/ | grep -oE 'styles\.[a-z0-9]+\.css'
curl -sL https://design.aprova.com.br/styles.<hash>.css | grep -oE -- '--(Spacing|Radius|Stroke|Aprova|Greyscale|Focus)[A-Za-z0-9-]*:[^;}]+'
# Tokens do site e do app de IA; ficha e capturas do app
curl -sL https://aprova.com.br/_astro/CookieConsentBanner.B59nXtOv.css | grep -oE -- '--color-aprova-[a-z-]+:[^;}]+'
curl -sL https://ai.aprova.com.br/assets/index-DF-0iaiD.css | grep -oE -- '--(ia|positive|negative|attention|brand-bb-blue)[a-z-]*:[^;}]+'
curl -sL "https://itunes.apple.com/lookup?id=1640310090&country=br"
```

Estilos computados de Button/Alert/Input foram lidos abrindo `https://storybook.aprova.com.br/iframe.html?id=design-system-components-button--default&viewMode=story` (e `--small`, `--medium`, `--large`, `--medium-disabled`, `--medium-loading`, `alert--default`, `input--default`) em navegador e consultando `getComputedStyle`. O portal de Cascavel foi lido do mesmo modo em `https://cascavel.bbgovernodigital.com.br/home` e no login `https://app.aprova.com.br/cascavelpr`.

Os nomes de arquivos têm *hash* e mudam a cada publicação. **[NV]** executados nesta data: os comandos acima (versões com `<hash>` foram feitos com o *hash* vigente). **Nenhuma cópia** de CSS, JS, imagem ou captura foi guardada no repositório (conteúdo de terceiros): só valores de token e observações.

## 6. Validação final desta pesquisa

| Verificação | Resultado |
|---|---|
| Valores apresentados como oficiais sem evidência | Revisado: `[CONF]` só para valor literal em Storybook/CSS/HTML públicos; medidas de captura `[EST]`; equivalências Tailwind declaradas como tais |
| Recomendações separadas de fatos | `design-system-aprova.md` §2–§5 = fatos/inferências; §6 = `[REC]`. `aprova-tokens.css` etiqueta cada bloco |
| Hexadecimais sem função documentada | Do site (`#006d73`, `#465eff` etc.) **não** entram como token; a escolha de cor com texto usa `Aprova---90`, que é oficial |
| Correção em relação à versão 1.0 | A v1.0 afirmava que a Aprova "não publica design system"; era falso: existe Storybook público (F-17) e tokens no CSS (F-18). Documentos reescritos |
| Links | HTTP 200 em 22/10/2026, exceto F-16 (404) e F-13 categorias (403), já registrados |
| Produtos não pesquisados | §3.7 |
| Inspeção manual pendente | §6.1 |

### 6.1 O que ainda exige humano

1. Pedir à organização do evento **capturas atuais** ou **conta de demonstração** da plataforma interna e conferir `design-system-aprova.md` §3.4.
2. Assistir aos vídeos do canal oficial e anotar telas.
3. Abrir manualmente a central de ajuda (usuário interno e cidadão).
4. Confirmar com a Aprova o peso 100 do botão e se há documentação além do Storybook.
5. Verificar licença de Inter e dos ícones antes de redistribuir.
6. Se a organização entregar guia de marca ou identidade do evento, **ele prevalece** sobre este material.
