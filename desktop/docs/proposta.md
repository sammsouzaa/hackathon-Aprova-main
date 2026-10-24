# Proposta

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · direção confirmada pela equipe (`desafio.md` §9); detalhes marcados `[HIP]` até validação |
| Dono | D |
| Base | `desafio.md` §3, §4 e §9 |

## 1. Problema e público

| Item | Conteúdo | Rótulo |
|---|---|---|
| Quem sofre (cargo/papel) | **Implantador** da Aprova (adapta formulários, configura, testa, treina; depende do retorno do cliente). Do outro lado da reunião: **analista da prefeitura** (tem a regra, vive no WhatsApp). | `[FATO]` portal, aba Implantação ("Personas") |
| Quando e em que tarefa | Na **reunião de coleta** da regra de um processo e nos dias seguintes, cobrando o que o cliente ficou de enviar. | `[FATO]` relato do demandante via equipe; portal: "Pedidos assíncronos quase nunca voltam" |
| Como é hoje e onde trava | O implantador reúne o contexto do chat, marca a reunião e preenche com o cliente um formulário (campos que mudam, regras de negócio) com base na cidade/documento modelo; depois consolida e entrega ao agente da empresa, que altera o sistema; o ciclo se repete. Trava: o que faltou perguntar, o que o cliente prometeu e não mandou e o que contradiz o documento só aparecem **depois**, gerando mais uma reunião ("bola de neve"). O WhatsApp serve mais para cobrança. | `[FATO]` relato do demandante (segunda mão); "bola de neve" `[HIP]` quanto à causa |
| Custo da dor (tempo, retrabalho, erro) | Meta do portal: ~100 processos por prefeitura em 45–60 dias, ~10 processos/dia por implantador; com 4 prefeituras ao mesmo tempo, ~400 processos em ~40 dias úteis. Quantas reuniões de repetição existem por processo hoje: **desconhecido**. | números do portal `[FATO]`; custo real `[A]` (nenhum dado da Aprova será fornecido) |

## 2. Proposta de valor

> Para o **implantador**, que hoje **sai da reunião sem ter perguntado tudo, sem notar o que contradiz o documento e sem registrar o que o cliente ficou de enviar**, o **Prumo** **acompanha a reunião: lembra o que falta perguntar, marca o que o cliente responde, avisa quando a fala contradiz um documento e cobra, ao longo da semana, o que ficou combinado**, de modo que **a regra fica completa em menos reuniões e a reunião necessária acontece uma vez só**.

Alternativas consideradas (conceitos, não tecnologias) e por que esta: ver `desafio.md` §9. Descartadas: funil de insumos + página do analista (a Aprova já tem chat e agente que interpreta); copiloto interno tech leader × desenvolvedor (leitura errada de Implantação); só painel de progresso (não atua no momento em que a regra é coletada).

## 3. Diferencial

O que esta solução mostra que as outras (e o que a Aprova já oferece, `D01` §3.5, alegação da empresa) não mostram: atua **durante** a reunião, com o contexto da empresa (cidade modelo, regras e documentos), e **depois dela**, com compromissos e cobrança. A Aprova já tem o chat de contexto, o agente que interpreta e o agente que altera o sistema (relato do demandante); o Prumo preenche o buraco entre eles: a conversa em que a regra nasce. Uma ata genérica de videoconferência não conhece o checklist do processo nem o documento que a fala contradiz.
Como isso aparece na tela: S-03 (reunião ao vivo): checklist se marcando com a frase do cliente como evidência e o alerta de contradição com o trecho do documento; S-05: compromissos com lembrete e resposta do cliente.

## 4. Critérios de avaliação → onde mostramos

O portal **não publica critérios nem pesos** `[A]`; usamos o que ele diz (tudo `[FATO]` do portal, seções Regras e Dicas):

| Critério (da banca, ou `[HIP]` se desconhecido) | Peso | Onde mostramos (tela / momento do pitch) |
|---|---|---|
| "Nível da entrega" e solução agêntica (agente + código clássico) | `[A]` | S-03: agente (LLM) lê a transcrição; código clássico faz o checklist, os prazos, os lembretes e os totais |
| Pasta `INSTRUCTIONS` legível: "quais instruções são chamadas, como e qual a responsabilidade" | `[A]` | Tour da pasta no pitch (4 arquivos, um por função); cada passo da demo diz qual instrução foi chamada |
| "Mostre o indicador que mexe" | `[A]` | S-05 e S-04: lacunas, compromissos, cobertura do checklist; "reuniões de repetição evitadas" só como estimativa rotulada |
| "Poucos objetivos, bem atacados" | `[A]` | Objetivos atacados: menos reuniões de repetição e menos idas e vindas (O1, O2); o resto fica fora |
| Demo funcionando ou vídeo de backup | `[A]` | Plano de falha em 3 níveis (`demo/roteiro-demo.md` §6) e vídeo |
| Canal real do cliente (WhatsApp) | `[A]` | Lembrete com link do ticket (envio simulado); WhatsApp real fica adiado |

## 5. Momentos de destaque (2–3)

| # | O que o avaliador vê | Tela | Por que impressiona |
|---|---|---|---|
| 1 | O cliente fala e o item do checklist **se marca sozinho**, com a frase dele como evidência | S-03 | Valor visível em 5 segundos; é a parte real (LLM) |
| 2 | O cliente diz "recuo de 3 metros" e aparece o alerta com **o trecho do documento** que diz 5 metros; o implantador decide | S-03 | Mostra contexto da empresa + humano decidindo |
| 3 | "Avançar 3 dias": o lembrete sai com o link do ticket e a resposta do cliente fecha o compromisso | S-05 / S-06 | Fecha o ciclo da cobrança sem nova reunião |

## 6. Plataforma

Escolha `[DEC]` (24/10 ~12:00): **mascote = programa desktop** (base web gerada no AI Studio, refinada no Claude Code e empacotada com **Electron**), usado **somente na reunião**; mais a **plataforma web** para pendências, lembretes e consulta (outro integrante). Motivo, ligado ao problema: o implantador está no computador durante a reunião e o mascote fica ao lado do Meet/Teams, em janela pequena no topo; a gestão contínua precisa de espaço, e a web já existe. Queda: se o Electron não fechar, o mesmo painel roda como janela web compacta.
Dispositivo da demonstração: notebook/monitor do evento + um celular para a página do ticket do cliente (`design.md` §4).

## 7. Fora de escopo (declarado)

- **Real** (executa de verdade; entra em `stack.md` §7): análise de trechos da transcrição por LLM (marcar checklist com evidência, detectar contradição com trecho, extrair compromissos) e geração do resumo estruturado; cálculos por código (cobertura, prazos, contagens). Transcrição de áudio ao vivo: **tentativa** (stretch), só real se testada.
- **Simulado** (rotulado; `experiencia.md` §7): reunião (roteiro fictício ou áudio gravado), cidade modelo, documentos, chat de contexto, ticket do cliente, lembretes (tempo acelerado), envio ao agente de implantação, "cliente responde".
- **Adiado / não será demonstrado**: gestão de pendências, consulta e histórico **dentro do desktop** (ficam na web), captura de áudio de Meet/Teams instalados, integração real com WhatsApp, ticket, chat ou agente da Aprova, várias prefeituras, diarização de vários participantes no mesmo canal, login, qualquer afirmação de conformidade com a LGPD.

## 8. Impacto esperado (hipóteses a validar; nunca resultado)

| Hipótese | Lógica da estimativa | Como seria validada |
|---|---|---|
| Menos reuniões de repetição por processo | O que faltou perguntar e o que contradiz o documento aparecem durante a reunião, não na seguinte | Contar reuniões por processo antes e depois, num piloto com implantadores reais (`[A]` sem baseline hoje) |
| Menos itens prometidos e esquecidos | Compromisso guardado e cobrado automaticamente | Taxa de entregas dentro do prazo no ticket antes e depois |
| O implantador confia no alerta de contradição | Mostrar o trecho do documento e deixar a decisão com ele | Taxa de alertas aceitos × ignorados no piloto |
