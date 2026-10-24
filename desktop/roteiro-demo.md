# Roteiro de demonstração e pitch

| Campo | Valor |
|---|---|
| Status / versão / hora | rascunho v1 · 24/10/2026 ~11:22 · §1–§3 (o resto após o MARCO-4) |
| Dono | D (apresenta: [DECIDIR]) |
| Tag demonstrada | `demo-ready` |
| Tempo do pitch / formato | pitch aberto de **5 a 10 min**, para explicar o contexto e mostrar a solução `[FATO]` (equipe); demo ao vivo obrigatória? `[A]` |
| Máquina e rede da demonstração | [PREENCHER NO EVENTO] |

## 1. Mensagem central (20 segundos)

Problema → solução → diferencial em uma frase: **"A reunião de implantação continua, mas o implantador sai dela com a regra completa: o Prumo lembra o que perguntar, avisa quando a fala contradiz o documento e cobra o que ficou combinado, e assim a gente não precisa de uma segunda reunião para repetir a primeira."** *(dados fictícios; a ideia é hipótese, não resultado medido)*

## 2. Estrutura do pitch (para 8 min; encurte a demo se a banca der 5 min, alongue o contexto se der 10)

| Bloco | % | Min | Conteúdo | Slide / tela |
|---|---|---|---|---|
| Problema e público | 15 % | ~1:15 | o implantador, ~100 processos por prefeitura, 4 prefeituras ao mesmo tempo (~400 processos em ~40 dias úteis, números do portal); a reunião fica, o que pesa é a reunião de repetição; o que faltou perguntar, o que contradiz o documento e o que ficou de ser enviado só aparecem depois (dito como hipótese do que ouvimos do demandante) | slide 1 |
| Solução em uma frase | 10 % | ~0:50 | mensagem central (§1) | slide 2 |
| **Demonstração** | 45 % | ~3:40 | §3: momentos de destaque 1 (checklist se marca), 2 (contradição), 3 (cobrança e resposta) | S-01 → S-05 → S-06 |
| Diferencial, `INSTRUCTIONS` e encaixe | 15 % | ~1:15 | tour da pasta `INSTRUCTIONS` (qual instrução é chamada em cada passo e o que cada uma faz); agente + código clássico; o que é real, simulado e pendente | slide 3 + editor/pasta |
| Como evoluiria | 8 % | ~0:40 | próximos passos como hipótese: áudio de reunião real, integração com ticket e agente da empresa, piloto com implantadores para medir reuniões por processo | slide 4 |
| Encerramento | 7 % | ~0:30 | frase final e agradecimento | slide 5 |

## 3. Roteiro da demonstração (≈ 4 min; só após reset e com `DEMO_MODE` definido)

> **Nota (24/10 ~12:00):** o mascote desktop cobre da preparação ao resumo e os lembretes (menu ⋯). As telas S-01, S-05 e S-06 passam a ser da plataforma web. Ajustar a tabela abaixo quando a divisão com a web estiver fechada (`ESTADO.md` §8, pergunta 11).

| t | Ação exata (cliques, arquivo a colar) | O que o avaliador vê | Fala | Se falhar |
|---|---|---|---|---|
| 0:00 | Abrir o protótipo no estado inicial (reset); apontar o selo "dados fictícios" | S-01 com 5 reuniões e 3 indicadores | "Marina é implantadora; hoje tem reunião com a prefeitura de Serra do Sabiá, fictícia" | vídeo |
| 0:20 | Abrir a reunião "Alvará de construção residencial" | S-02: checklist de 10 itens (4 já confirmados), aviso de gravação | "o Prumo prepara o que falta perguntar; só o que a cidade modelo ainda não confirmou" | idem |
| 0:45 | Escolher "Gravação com aviso", marcar "Participantes avisados", **Iniciar reunião** | S-03; relógio da reunião | "a reunião é roteirizada; o rótulo diz a fonte" | trocar a fonte para "Roteiro" |
| 1:00 | Deixar chegar as falas 1–6 | CHK-05 e CHK-06 se marcam com a frase como evidência | "ele marcou sozinho, e mostra a frase; se errar, é só desmarcar" | análise gravada (rótulo "Análise gravada em <data>") |
| 1:40 | Fala 8 ("3 metros") | Alerta com a fala e o trecho do documento (4,50 m) | "o documento diz 4,50; quem decide é a implantadora" → **Aceitar como regra local** | idem |
| 2:05 | Fala 11 | Cartão de compromisso, prazo quinta 29/10 | "ele guardou o que ficou combinado" | idem |
| 2:20 | **Encerrar reunião** | Aviso com 2 lacunas; falas 13–15; CMP-02 criado | "antes de encerrar, ele lembra o que faltou" | idem |
| 2:50 | Abrir S-04; **Aprovar**; "Enviar ao agente" | Resumo estruturado; confirmação "Envio ao agente (simulado)" | "o pacote é o que o agente da empresa receberia; aqui o envio é simulado" | resumo gravado |
| 3:15 | S-05 → **Avançar 3 dias** | Lembretes enviados com link; CMP-01 vence | "tempo simulado: no dia anterior ele cobra, com o link do ticket" | — |
| 3:35 | Abrir o ticket do cliente (S-06) e responder com o anexo | Compromisso "Recebido"; indicador de pendências resolvidas sobe | "sem nova reunião" | S-06 em modal |
| 4:00 | Mostrar a pasta `INSTRUCTIONS` | 4 instruções + índice | "são estas as instruções que o agente segue e o que cada uma faz" | slide |

## 4. O que é real, simulado e pendente (será dito em voz alta)

| Elemento | Realidade | Frase |
|---|---|---|
| (copie de `experiencia.md` §7) | | |

## 5. Perguntas prováveis e respostas honestas

| Pergunta | Resposta |
|---|---|
| Isso funciona de verdade? | (modelo em `referencias/honestidade-e-dados.md` §8) |
| A IA é real? | |
| Usaram dados reais? | |
| E a LGPD? | |
| O que falta para virar produto? | |
| Como validariam o impacto? | |

## 6. Plano de falha

| Falha | Como se percebe | Ação em ≤ 10 s | Frase ao público |
|---|---|---|---|
| Tela ou passo trava | | vídeo de backup / reset | |
| Sem rede | | demonstração local (sem CDN); IA em queda rotulada | |
| Serviço de IA externo falha (chave, cota, rede, latência) | erro, timeout, resposta fora do formato | queda rotulada (resposta gravada/simulada, com rótulo na tela) | "agora vou mostrar uma resposta gravada de uma execução anterior" |
| Notebook falha | | segundo notebook em `demo-ready` | |

## 7. Ensaios

| # | Data/hora | Quem apresentou | Tempo | O que falhou | Ajuste |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

## 8. Instruções para os avaliadores

Cole no README ou entregue com o repositório: como abrir (comandos ou URL) · requisitos · usuário fictício e dados de acesso (se houver tela de entrada) · roteiro de exploração em 5 passos · como reiniciar a demonstração · o que é real, simulado e pendente (e o que acontece sem chave ou sem rede) · contato da equipe: [PREENCHER NO EVENTO]
