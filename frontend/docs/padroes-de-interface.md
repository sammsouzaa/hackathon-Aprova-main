# Padrões de interface para um protótipo visual de alta fidelidade

| Campo | Valor |
|---|---|
| Versão | 2.0 — modo protótipo (FASE 4, 22/10/2026); reescrita da v1.1 (que tratava interface como parte secundária do MVP) |
| Natureza | Orientação prática **[REC]**. Vale para web e mobile; adapte ao meio. |
| Não testado | Nenhuma interface foi construída ou avaliada com usuários a partir deste guia. |
| Linguagem visual da Aprova | Valores, componentes e vocabulário observados nos produtos públicos da Aprova: [`design-system-aprova.md`](design-system-aprova.md) (tokens em [`aprova-tokens.css`](aprova-tokens.css)). Este guia dá princípios genéricos; aquele dá a base visual padrão. |

**Princípio.** Neste evento a interface **é** o produto entregue. Em 3 minutos o avaliador precisa entender **o que é**, **o que fazer** e **por que importa**. Aparência profissional = hierarquia clara + consistência + feedback + estados tratados + dados que fazem sentido. Não = muitos elementos, muitas telas ou efeitos.

**A qualidade visual apoia a proposta de valor; não é decoração.** Cada elemento relevante da tela deve ajudar a explicar a solução. Dashboard genérico com gráficos aleatórios e números sem significado é o erro mais comum.

## 1. Hierarquia de informação

1. **Uma ação principal por tela**, visualmente dominante (tamanho, cor de destaque, posição). As demais, secundárias ou terciárias (só texto/ícone).
2. Ordem de leitura do topo à base: onde estou → o que importa agora → o que posso fazer → detalhes.
3. O elemento que **conta a história da tela** (o resultado, o indicador-chave, o item que precisa de decisão) é o mais legível; metadados ficam menores, mas visíveis.
4. No máximo **2 níveis de ênfase** além do texto comum por tela. Use espaço em branco para agrupar, não bordas em tudo.
5. Cada tela responde a **uma pergunta do usuário** ("o que precisa da minha atenção hoje?", "qual o status do meu pedido?"). Se não souber a pergunta, a tela não está pronta.

## 2. Tipografia

- **Uma família** (duas no máximo: títulos e texto) com pesos limitados (400/500/600/700). Prefira fonte local (pacote npm ou arquivo em `public/fonts/`) a fonte por CDN: sem internet no evento, fonte remota cai para a padrão do sistema e desmonta o visual.
- Escala curta e fixa (ex.: 12 · 14 · 16 · 20 · 24 · 32 px). Corpo ≥ 14 px na tela do notebook; ≥ 16 px para projeção.
- Títulos curtos e informativos ("12 chamados aguardando você", não "Dashboard"). Números grandes e tabulares (`tabular-nums`) em indicadores e tabelas.
- Altura de linha 1,4–1,6 no corpo. Linhas de texto de ≤ 70 caracteres.

## 3. Espaçamento e layout

- **Escala única de espaçamento** (4/8/12/16/24/32/48). Não improvise valores.
- Estrutura de aplicação (*shell*) fixa: barra lateral ou superior com poucas áreas (≤ 5–6), título da página, área de conteúdo com largura máxima. Mantenha o *shell* idêntico em todas as telas.
- Alinhamento rigoroso: elementos na mesma linha base e na mesma grade. Desalinhamento de 2 px é o que separa "protótipo" de "produto".
- Densidade coerente com o produto: sistema administrativo = densidade legível; aplicativo para cidadão = ar e botões grandes.
- Defina o tamanho de tela da demonstração (monitor do evento, notebook, celular) em `design.md` e **construa para ele primeiro**. Se a demonstração for só em notebook, não gaste tempo com celular.

## 4. Cor e contraste

- Paleta pequena com **função**: primária (ação), neutros (texto e superfícies, 4–6 tons), sucesso, alerta, erro, e no máximo uma cor de destaque. Escolha a partir do **tema do problema** (saúde, educação, tributos, obras…), não da cor padrão do framework.
- Contraste de texto ≥ 4,5:1 (confira com uma ferramenta); informação nunca só por cor (ícone + texto no status).
- Fundo claro com superfícies em cartões é o padrão mais seguro para projetor. Modo escuro só se for o conceito e se for tratado em todas as telas.
- Defina as cores como **tokens** (variáveis CSS ou do Tailwind, conforme a base) uma vez; nenhuma cor hexadecimal solta nas telas.

## 5. Componentes

- Conjunto pequeno, usado em **todas** as telas: botão (primário/secundário/texto), campo, seletor, cartão, indicador, tabela, selo de status (badge), aba, modal, aviso (*toast*), estado vazio, avatar, item de lista, barra de progresso.
- Mesma palavra para a mesma coisa em todas as telas; rótulo de botão é verbo ("Aprovar", "Enviar para análise").
- Estados interativos em todo componente clicável: normal, *hover*, foco visível, ativo, desabilitado, carregando.
- Crie o componente **antes** de usá-lo duas vezes. Na base exportada (React): um componente por responsabilidade na pasta de componentes que a auditoria identificou (`ai-studio-e-claude-code.md` §4).

## 6. Dados na interface (tabelas, cartões, gráficos, dashboards)

- **Tabelas:** colunas por importância; números à direita; status como selo; linha clicável leva ao detalhe; filtro e ordenação nos 1–2 campos que o usuário realmente usa; estado vazio tratado; 6–12 linhas visíveis bastam (mais parece mock grande demais).
- **Cartões de indicador:** número + rótulo + variação/contexto ("▲ 12 % vs. semana passada" é dado fictício coerente com os mocks, não resultado). 3 a 5 indicadores que respondem a **uma pergunta**. Nenhuma métrica de enfeite.
- **Gráficos:** o tipo certo para a pergunta (linha para tempo, barras para comparação, rosca só para ≤ 4 partes que somam 100 %). Rótulos de eixo legíveis, título que diz o que o gráfico mostra, mesma paleta da interface. Números derivados dos mesmos mocks das tabelas.
- **Listas e linhas do tempo:** nomes, datas relativas ("há 2 dias") e avatares reais-sob-aparência (fictícios) tornam o produto crível. Variedade de estados (um atrasado, um aguardando, um concluído).
- **Mapas e calendários:** só se o problema pedir; pontos e eventos vêm do mock; não dependa de serviço externo de mapas (precisa de internet e chave): use imagem/SVG local com marcadores.

## 7. Formulários

- Poucos campos; só o que o fluxo precisa. Botão "usar exemplo" nas demonstrações para não digitar ao vivo.
- Rótulo acima do campo, ajuda curta abaixo, erro **junto ao campo** com o que corrigir ("Informe ao menos 10 caracteres"), não "Entrada inválida".
- Validação visual no cliente basta (obrigatório, formato); não há validação complexa de servidor. O envio mostra carregamento breve (300–800 ms simulados) e confirmação com o que aconteceu.
- Campo, máscara e seletor devem ter a aparência dos de um produto real (data, moeda, CPF fictício).

## 8. Estados: carregando, vazio, sucesso, erro

| Estado | Mostre | Evite |
|---|---|---|
| Carregando | esqueleto (*skeleton*) ou indicador + o que está acontecendo ("Consultando 124 documentos…"); 0,5–2 s simulados onde dá credibilidade | tela congelada; spinner sem texto; espera longa só para "parecer real" |
| Vazio | explicação + ação sugerida | tabela vazia sem texto |
| Sucesso | o que aconteceu, onde ver, próximo passo | só "OK" |
| Erro | linguagem do usuário + o que fazer | *stack trace*, JSON cru |

Construa só os estados que **aparecem no cenário** (e um erro típico para mostrar maturidade). Os demais ficam no `design.md` como "fora do escopo".

## 9. Navegação

- ≤ 5–6 áreas; onde estou sempre visível (item ativo, *breadcrumb* em detalhe); o fluxo principal acessível em 1–2 cliques da entrada.
- Toda tela tem **saída**: botão de voltar, próximo passo ou menu. Nenhuma tela é beco.
- Links do menu que levam a telas fora do escopo: ou somem, ou abrem o aviso padrão de ação demonstrativa ("Disponível na versão completa"). Nunca um menu que não faz nada.

## 10. Microinterações e movimento

- Discretos e com função: transição de 150–250 ms em *hover*, abertura de modal/painel, entrada de *toast*, mudança de status (cor + ícone), contagem de números ao carregar. Nada que atrase o avaliador.
- Respeite `prefers-reduced-motion`. Sem animações de entrada longas, sem parallax, sem partículas.
- Gaste o orçamento de movimento no **momento de destaque** (`proposta.md` §5): é ali que uma animação ajuda a explicar.

## 11. Responsividade e apresentação

- Comece pela largura da demonstração. Se houver celular, teste ~390 px de largura: menu vira gaveta, tabela vira lista de cartões ou rolagem contida.
- Na projeção, use zoom de 110–125 %. Teste no monitor do evento antes de ensaiar (o evento fornece monitores).
- Imagens e ilustrações: só locais e leves (SVG, WebP), com direito de uso; nada de foto de pessoa real identificável; não dependa de URL externa.

## 12. Checklist de fidelidade (fase 5; marque só o que viu na tela)

```text
[ ] Cada tela do cenário tem UMA ação principal evidente
[ ] Mesmo shell, mesmos componentes, mesmos tokens em todas as telas
[ ] Nenhuma cor/tamanho/espaçamento fora da escala; alinhamentos conferidos
[ ] Títulos informativos; textos sem lorem ipsum, sem "Teste", sem placeholder
[ ] Dados: nomes, números e datas coerentes entre as telas; variedade de estados
[ ] Indicadores/gráficos respondem a uma pergunta e batem com as tabelas
[ ] Estados que aparecem no cenário (carregando, vazio, sucesso, erro típico) existem
[ ] Todo controle visível reage (regra do botão vivo); menus sem destino foram removidos
[ ] Foco por teclado visível; contraste conferido; status não depende só de cor
[ ] Selo "Protótipo demonstrativo · dados fictícios" visível; simulações rotuladas
[ ] Vista na resolução e no monitor da demonstração; zoom ok
[ ] Console do navegador sem erro no cenário
```

## 13. Como pedir interfaces profissionais ao agente

1. Entregue `design.md` (direção, tokens, componentes) e `experiencia.md` (telas, fluxo, estados) e peça **uma tela por vez**, começando pela do momento de maior valor.
2. Peça primeiro o **layout base e os tokens**, aprove, e só então as telas: mudar identidade com 6 telas prontas custa caro.
3. Exija os estados do cenário e o selo de demonstração; dados do arquivo de mock, nunca escritos dentro do componente de tela.
4. Peça que o agente **abra a página e olhe** (captura de tela) em vez de afirmar que "ficou bom". Sem navegador, ele deve dizer "não vi a tela".
5. Rejeite o primeiro layout aceitável: peça uma segunda passada em hierarquia, espaçamento e conteúdo antes de seguir.

## 14. Sinais de interface genérica (corrija)

Cartões idênticos repetidos sem hierarquia · gráficos de exemplo sem relação com o problema · cor padrão do framework · ícones decorativos sem função · nomes como "Item 1", "Usuário Teste" · todos os registros no mesmo estado · números redondos demais (100, 200, 300) · tela que só funciona se o apresentador explicar · menu com 12 itens que levam ao mesmo lugar.

Critério de parada: a tela é boa o bastante quando alguém que não conhece o projeto completa o fluxo principal sem ajuda em 3 minutos.
