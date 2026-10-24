# Design

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · §1–§4 e §9 preenchidas; §5–§8 no kit |
| Dono | I |
| Base | `proposta.md` §1; `experiencia.md` §3 |

## 1. Direção visual

Base escolhida `[DEC]` (24/10, MARCO-1 pendente de ok da equipe): **ADS** da Aprova (tokens públicos, `[CONF]`) + receita **C (Assistente)** para o mascote e **A (Área de trabalho)** para as listas; cor de IA (`#0891b2`/`#0e7490`/`#e6f5f8`) só nos blocos de IA, como no padrão de aprovação "Recusar/Aprovar" da Aprova (`[CONF]` do app de IA). Motivo: o evento é da Aprova e o público é um implantador que alterna entre lista, reunião e aprovação. Fontes: tokens em `../../D09_kit_desenvolvimento/referencias/aprova-tokens.css`; guia e limites em `design-system-aprova.md` §6. Marca, nome e logotipo próprios: produto fictício **Prumo**; nada de logotipo "A", brasões nem capturas. No pitch: "inspirado na linguagem visual pública da Aprova", nunca "segue o design system oficial". O `[CONF]` (valores literais públicos) está na coluna "Origem" de §2; as escolhas do kit são `[REC]`.

Três adjetivos: **calmo**, **confiável**, **discreto** · por que servem a este público e a este problema: o implantador está falando com um cliente ao vivo e o mascote não pode roubar a atenção; o alerta de contradição só vale se for sóbrio e mostrar a evidência; a decisão é sempre do humano · referência de tom (tipo de produto, não marca a copiar): painel de apoio de chamada, como as notas laterais de um assistente de reunião, e não uma tela de chat.

## 2. Tokens

| Token | Valor | Uso | Origem |
|---|---|---|---|
| `cor-primaria` | `#0d787e` (hover `#074a4e`), texto branco | ação principal, links | `[CONF]` ADS `Aprova---90/100` (5,24:1) |
| `cor-marca-ícone` | `#06929f` | ícones, foco, barras grandes (nunca texto pequeno com branco) | `[CONF]` ADS Button |
| `cor-superficie` / `cor-fundo` | `#ffffff` / `#f5f7f7` | cartões / página | `[CONF]` ADS |
| `cor-texto` / `cor-texto-suave` | `#1c1c1c` / `#656666` | corpo / secundário | `[CONF]` ADS |
| `cor-borda` | `#cacccc` (divisor `#dee0e0`) | cartões, divisores | `[CONF]` ADS |
| `cor-sucesso` · `cor-alerta` · `cor-erro` · `cor-info` | fundos `#eefff9` · `#ffefe7` · `#ffebeb` · `#ebf4ff`; texto `#055b40` · `#702600` · `#ba1515` · `#0856af` | status (nunca só por cor) | `[CONF]` ADS semânticos |
| `cor-ia` | ícone `#0891b2` · texto `#0e7490` · fundo `#e6f5f8` | blocos gerados por IA e o mascote | `[CONF]` V3 (fundo é aproximação sRGB, não literal) |
| `fonte-titulo` / `fonte-corpo` | Inter, instalada localmente (`@fontsource-variable/inter` `[NV]` não executado), sem CDN | | `[CONF]` ADS; instalação `[REC]` |
| Escala de texto | 12 · 14 · 16 · 20 · 24 · 32 (títulos 700; corpo 400; botão 500/600) | | `[REC]` |
| Espaçamento | 4 · 8 · 12 · 16 · 24 · 32 · 48 | | `[CONF]` ADS |
| Raio · sombra | controle 8 · cartão 16 · selo 999 · alerta 10; sombra só em flutuantes: `0 8px 24px rgba(0,0,0,.16)` (janela do mascote) | cartões, modais | `[CONF]` ADS/portal |
| Altura de controle | 36 (pequeno) · 44 (padrão) | | `[CONF]` |
| Movimento | 150 ms; 250 ms em painéis; respeita `prefers-reduced-motion` | | `[REC]` |

Contraste conferido (texto/fundo ≥ 4,5:1): [ ] sim *(valores do kit calculados; conferir na tela)*

## 3. Componentes

| Componente | Variantes | Onde é usado | Pronto? |
|---|---|---|---|
| botão | primário (`#0d787e`), secundário (contorno), texto, perigo | todas | |
| cartão / indicador | cartão de reunião, cartão de compromisso, indicador numérico (lacunas, cobertura, atrasados) | S-01, S-05 | |
| tabela / lista | lista de reuniões, lista de compromissos (filtro/busca), checklist | S-01, S-02, S-03, S-05 | |
| selo de status | agendada, em andamento, concluída; pendente, recebido, atrasado; texto + cor | S-01, S-05 | |
| item de checklist | pendente, confirmado pelo contexto, respondido (com evidência), regra local, lacuna; toggle manual | S-02, S-03, S-04 | |
| bloco de IA | marcador "Análise de IA · ao vivo" × "Análise gravada em <data>" × "Resposta simulada" | S-03, S-04 | |
| alerta de contradição | fala do cliente + trecho do documento lado a lado; ações Perguntar · Aceitar como regra local · Ignorar | S-03, `/mascote` | |
| linha de transcrição | por canal (Implantadora / Prefeitura), com hora; rótulo da fonte | S-03 | |
| cartão de aprovação | pré-visualização editável + Recusar/Aprovar (padrão V3) | S-04 | |
| modal / painel | aviso de gravação, aviso de lacunas ao encerrar | S-02, S-03 | |
| toast | lembrete enviado, resposta recebida | S-05 | |
| campo / seletor | modo de escuta, fonte da fala, "Avançar tempo" | S-02, S-03, S-05 | |
| aba / filtro | Hoje / Agendadas / Concluídas | S-01 | |
| estado vazio | ícone + frase + ação | S-01, S-03, S-05 | |
| menu superior | Reuniões · Compromissos; avatar; "Reiniciar demonstração" | todas | |
| janela do mascote | compacta (360 px), sombra, checklist + alertas | `/mascote` | |

## 4. Layout e dispositivo da demonstração

Estrutura (shell): **barra superior** (marca fictícia Prumo, menu Reuniões · Compromissos, selo permanente, reiniciar, avatar) + conteúdo de largura máxima 1200 px; S-03 em duas colunas (transcrição · checklist e alertas); `/mascote` em coluna única de 360 px · tela-alvo: monitor/notebook do evento (≈ 1440 px) e **celular ≈ 390 px** só para S-06 · zoom de apresentação: 110–125 % · responsividade necessária: S-06 em coluna única; as demais só em desktop (mobile fora da demonstração). Janela do mascote pensada para ficar ao lado do Meet/Teams.

## 5. Ícones, imagens e ilustrações

Conjunto de ícones (SVG local): … · imagens/ilustrações (locais, com direito de uso, sem pessoa real identificável): … · logotipo/nome do produto fictício: …

## 6. Microinterações

Só as que ajudam: … (hover, transição de status, entrada de toast, contagem de números, esqueleto de carregamento). Duração ≤ 250 ms.

## 7. Textos e tom

Voz: … · glossário (mesma palavra para a mesma coisa): … · rótulos de botão em verbo · mensagens de erro acionáveis · **sem** lorem ipsum.

## 8. Checklist de fidelidade (fase 5; marque só o que viu na tela)

```text
[ ] UMA ação principal evidente por tela do cenário
[ ] Mesmo shell, componentes e tokens em todas as telas; nada fora da escala
[ ] Títulos informativos; nenhum placeholder, "Teste" ou lorem ipsum
[ ] Dados coerentes entre telas; variedade de estados
[ ] Indicadores e gráficos respondem a uma pergunta e batem com as tabelas
[ ] Estados do cenário existem (carregando, vazio, sucesso, erro típico)
[ ] Todo controle visível reage; menus sem destino removidos
[ ] Foco de teclado e contraste conferidos; status não depende só de cor
[ ] Visto na resolução e no monitor da demonstração; console sem erro
```

## 9. Rótulos obrigatórios

| Rótulo | Onde | Texto |
|---|---|---|
| Selo de demonstração | permanente, discreto | "Protótipo demonstrativo · dados fictícios" |
| Simulação | junto da saída que imita IA/integração | "Resposta simulada" / "Integração demonstrativa" |
| Ação demonstrativa | controles sem implementação | "Ação demonstrativa: na versão completa isto…" |
