<!--
Consolidação do contexto e geração do checklist
Responsabilidade: Junta as extrações em um `contexto.md` único, glossário, checklist de implantação (um valor por item) e perguntas rápidas.
Chamada por: `Contexto._consolidar` (backend/contexto.py)
Variáveis: `{nome}`, `{descricao}`, `{max_chars}`, `{max_termos}`, `{checklist_atual}`, `{extracoes}`
Saída: JSON `Consolidacao`
O texto abaixo deste comentário é o prompt enviado ao modelo, exatamente como está.
-->
Abaixo estão extrações de vários arquivos sobre o mesmo cliente/projeto: "{nome}".
{descricao}

Produza:
- contexto: um único documento Markdown consolidado (no máximo ~{max_chars} caracteres), sem duplicações, organizado em seções
  (Cliente e pessoas, Produto e escopo contratado, Situação atual, Regras de negócio, Números prazos e quantidades,
  Decisões já tomadas, Problemas e riscos, Pendências).
  Em "Produto e escopo contratado", descreva o que o produto faz, os módulos e as fases, mesmo que pareça óbvio.
  Preserve todos os números, prazos, quantidades e nomes; resuma o texto, nunca os dados.
  Quando houver informações conflitantes, mantenha a mais recente e registre o conflito.
- glossario: até {max_termos} termos (nomes, siglas, sistemas, lugares) com a grafia correta, os mais importantes primeiro.
- checklist: itens que precisam estar alinhados para configurar o sistema. UM VALOR POR ITEM: nunca agrupe
  (ex.: taxa de ocupação, coeficiente e recuo de uma zona são 3 itens separados). Cada item tem:
  titulo curto em frase normal, sem Title Case (até ~40 caracteres, ex.: "Recuo frontal mínimo na ZR2"),
  pergunta objetiva, categoria curta (ex.: "Parâmetros", "Taxas", "Prazos", "Documentos", "Fluxo", "Responsáveis"),
  obrigatoria=true para o que bloqueia a implantação,
  valor_referencia = só o valor, bem curto, que o material indica mas ainda precisa ser confirmado
  (ex.: "58%", "4,50 m", "R$ 3,85 por m²", "20 dias úteis", "Modelo não prevê"; null se não houver),
  confirmado_no_contexto=true SOMENTE se alguém do cliente confirmou explicitamente aquele valor (ex.: "Confirmado",
  "Sim, sou eu", "Isso mesmo") e nada posterior o colocou em dúvida; aí preencha resposta_contexto, curta
  (ex.: "ZR1, ZR2 e ZC1", "Diretor de Planejamento Urbano").
  NÃO são confirmações: minutas/rascunhos não publicados, tabelas marcadas "confirmar", e-mails com "ainda estou
  confirmando" ou "precisa ser decidido", preferências ("a Renata prefere") e qualquer coisa listada como pendência.
  Esses ficam confirmado_no_contexto=false com o valor em valor_referencia.
  Inclua os itens já confirmados (escopo, documentos, etapas do fluxo, quem assina etc.) para a equipe ver o quadro
  completo, e todos os pendentes. Ordene: confirmados primeiro, depois pendentes por importância.
  NÃO repita itens que já estão no checklist atual.
- perguntas_rapidas: 3 a 6 perguntas bem curtas (até ~25 caracteres) que o implantador pode querer fazer ao copiloto
  durante a reunião (ex.: "Qual o recuo?", "Qual a taxa?", "Qual o prazo?").

CHECKLIST ATUAL:
{checklist_atual}

EXTRAÇÕES:
{extracoes}
