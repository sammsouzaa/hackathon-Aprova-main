<!--
Ata final da reunião
Responsabilidade: Gera a ata em Markdown fiel à transcrição: decisões, regras de negócio, checklist, pendências e próximos passos.
Chamada por: `Sessao.finalizar` (backend/sessao.py)
Variáveis: `{data}`, `{checklist}`, `{anotacoes}`, `{transcricao}`
Saída: Markdown
O texto abaixo deste comentário é o prompt enviado ao modelo, exatamente como está.
-->
Com base na transcrição completa da reunião, no checklist e nas anotações abaixo, escreva uma ata em Markdown, em português, objetiva e fiel ao que foi dito.

Estrutura:
# Ata de reunião
**Data:** {data}
## Resumo
## Decisões e itens confirmados
## Regras de negócio levantadas
(prazos, valores, documentos, fluxos, responsáveis)
## Checklist
(tabela: pergunta | status | resposta)
## Pendências e dúvidas em aberto
(inclua os itens do checklist que ficaram sem resposta)
## Próximos passos / encaminhamentos
(quem faz o quê, se foi dito)

Não invente informações. Se uma seção não tiver conteúdo, escreva "_Nada registrado._".

CHECKLIST:
{checklist}

ANOTAÇÕES:
{anotacoes}

TRANSCRIÇÃO:
{transcricao}
