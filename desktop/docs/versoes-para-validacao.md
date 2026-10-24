# Duas versões da ideia (Implantação) para validar com o demandante

> Status: propostas `[HIP]`, nenhuma é `[DEC]`. Base: portal `https://zenith.aprova.com.br/hackathon.html` (aba Implantação) e as ideias de `desafio.md` §9. Escopo e desafio ainda a confirmar pela equipe.

## Problemas do portal a que cada versão responde

| Código | Problema (trecho do portal) |
|---|---|
| D-a | A regra não chega: "está na cabeça dos analistas e raramente escrita; pedidos assíncronos quase nunca voltam" |
| D-b | Chega sem padrão: "PDF de lei, foto de formulário, planilha, print, texto solto" |
| D-c | Só se valida testando: formulários clonados da cidade modelo, particularidades aparecem no teste, um por vez |
| D-d | Escala: ~100 processos por prefeitura, 12–13 secretarias, 4 projetos ao mesmo tempo (~400 processos em ~40 dias úteis) |

Objetivos do portal: O1 menos horas de reunião por processo · O2 menos idas e vindas até a regra completa · O3 menos tempo para validar formulário clonado · O4 mais processos no ar com regras inteligentes.

---

## Versão 1 — Prefeitura ↔ responsável pela implantação (agente web)

**Em uma frase.** O responsável pela implantação sobe o material solto de uma secretaria; o agente organiza em fichas segundo um padrão, vê o que falta e manda as perguntas, em um link simples para o analista da prefeitura responder quando puder, sem reunião.

**Perfis.** Implantador da Aprova (usuário principal) · analista da prefeitura (responde pelo celular) · secretário (opcional, aprova em 1 toque).

### Como cada parte da ideia original se adapta

| Parte | Na versão 1 |
|---|---|
| p1 padrão de documentação | O implantador define (ou escolhe, a partir de modelos da "cidade modelo") o que um processo precisa ter para ser considerado completo. Vira as instruções do agente. |
| p2 funil | O implantador joga tudo o que o cliente mandou, por secretaria. O agente identifica a que processo cada arquivo pertence e monta a ficha segundo o p1, com **trecho de origem**, lacunas e contradições. |
| p3 mascote | **Agente web**: painel lateral/botão flutuante em todas as telas. O implantador consulta a documentação organizada. Quando falta algo, abre uma **pendência** (modelo de ticket do suporte) **endereçada ao analista da prefeitura**, não só ao implantador. |
| p3.2 roteiro | Continuação do p3: para o que não existe em documento, o agente conduz um roteiro curto adaptado ao processo, como **micro-reunião assíncrona** com o analista da prefeitura (perguntas de 1 toque, campo de texto, foto). Gera o rascunho da regra e pendências priorizadas. |
| p4 progresso | Etapa de cada **processo e secretaria** (sem regra, perguntado, respondido, validado), calculada por estado, com projeção do prazo usando os números do portal. |
| p5 critérios de aceite | Gerados pelo agente a partir da regra validada; aprovados em 1 clique pelo implantador. Servem de roteiro para testar o formulário clonado. |
| considerar: 2ª prefeitura | A 2ª prefeitura herda as regras validadas e só recebe perguntas sobre a diferença. |

### Fluxo principal (demo)
1. Implantador escolhe a prefeitura e a secretaria e vê o padrão exigido (p1).
2. Sobe o material solto (PDF, foto, planilha, print, texto).
3. Agente organiza em fichas por processo, destacando fonte, lacuna e contradição.
4. Implantador revisa e dispara o pacote de perguntas; a mensagem de WhatsApp é gerada com um link (envio simulado).
5. Analista da prefeitura abre o link no celular e responde em 1 toque ou com uma foto/texto.
6. O agente atualiza a ficha, fecha a lacuna ou gera uma pergunta de acompanhamento.
7. O implantador aprova a regra; o agente gera os critérios de aceite; o implantador aprova em 1 clique.
8. Painel mostra o avanço dos ~100 processos e a projeção; a 2ª prefeitura mostra só o delta.

### Telas (P0, máximo 6)
1. Padrão e modelos (p1) · 2. Funil e fichas (p2) · 3. Pendências do implantador (modelo suporte) · 4. Página do analista da prefeitura (mobile, via link) · 5. Painel de progresso e prazo (p4) · 6. Critérios de aceite (p5). O copiloto (p3) é o painel lateral comum; o delta é um estado das telas 3 e 5.

### Real × simulado × adiado
- **Real:** organização dos insumos em fichas com fonte; respostas do copiloto com citação; geração das perguntas e do rascunho de regra; critérios de aceite; página do analista funcionando de verdade (ele responde e a ficha atualiza); cálculos do painel por código.
- **Simulado e rotulado:** entrega pelo WhatsApp (mensagem e link gerados, não enviados); integração com ticket do suporte; dados das prefeituras (fictícios).
- **Adiado:** WhatsApp Business real, áudio transcrito, teste automático no formulário clonado, login.

### Pasta `INSTRUCTIONS` (exigência do portal)
Um arquivo por função: organizador de insumos · copiloto com citação · entrevistador (pendências e roteiro) · gerador de critérios. No pitch, mostrar qual é chamado em cada passo.

### Cobertura dos problemas `[HIP]`
D-a **sim** (analista responde assíncrono) · D-b **sim** · D-c **parcial** (critérios e delta, sem rodar teste) · D-d **sim**. Objetivos: O1, O2, O4 diretos; O3 em parte.

### Indicadores medidos na demo
Perguntas por processo (com e sem o delta) · rodadas até a regra completa · % de campos com fonte · contradições detectadas · tempo do agente por processo. "Horas de reunião evitadas" só como estimativa rotulada.

### Riscos
Resposta da prefeitura errada gravada sem revisão (mitigação: o implantador aprova antes de gravar) · vazamento entre prefeituras (`D06:RISK-007`; dados fictícios e uma prefeitura por vez) · extração de imagem ruim (queda gravada rotulada).

### Viabilidade `[HIP]`
V5 · C5 · A5 · D3 · F3 → ≈ 21. **Cortes, em ordem:** delta da 2ª prefeitura → critérios (p5) → progresso vira cartão. Não se corta: p1, p2, pendências com a página do analista, copiloto.

### Perguntas ao demandante
1. A dor hoje é a espera da resposta da prefeitura? Quem faz a pergunta e por qual canal?
2. O analista da prefeitura aceitaria abrir um link simples por WhatsApp, sem login?
3. Que mistura de insumos chega (lei, foto, planilha, print) e em que quantidade por secretaria?
4. O que costuma divergir quando o formulário é clonado da cidade modelo?
5. Quem aprova a regra: só o implantador, ou também o analista da prefeitura?

---

## Versão 2 — Responsável pela implantação (tech leader) ↔ desenvolvedor (agente desktop)

**Em uma frase.** O tech leader sobe toda a documentação que tem; o agente a organiza segundo o padrão que ele definiu; os desenvolvedores consultam um mascote instalado no computador; o que falta vira pendência para o tech leader, que contata a prefeitura por fora.

**Perfis.** Tech leader ("Superior", usuário do painel) · desenvolvedores da implantação (usuários do mascote) · prefeitura **fora do produto**.

### Partes (como a equipe entendeu)

| Parte | Na versão 2 |
|---|---|
| p1 padrão | O tech leader monta o padrão de documentação exigida por feature/implementação. O agente passa a seguir esse padrão para garantir alinhamento e complemento. |
| p2 funil | O tech leader sobe toda a documentação solta; o agente identifica a que processo/feature cada arquivo pertence e monta a ficha segundo o p1. |
| p3 mascote desktop | Agente instalado no computador, em segundo plano e sempre acessível, que funciona como chat: o desenvolvedor consulta e o agente responde **com base na documentação**. Se faltar informação, abre uma pendência (modelo do ticket do suporte) no painel do tech leader, que responde ou adiciona documento e manda o agente rodar novamente. |
| p3.2 roteiro | Continuação do p3: para o que não existe em documento, o agente conduz um roteiro curto adaptado ao processo, como micro-reunião assíncrona **com o tech leader** `[HIP]`, gerando o rascunho da regra com pendências priorizadas. |
| p4 progresso | O agente estima em que etapa o desenvolvedor está com base nas perguntas que ele faz e mostra essa estimativa ao tech leader. *Cuidado:* sinal indireto e sensível (monitora perguntas de pessoas); melhor combinar com estado objetivo das fichas. |
| p5 critérios | Critérios de aceite gerados pelo agente a partir da documentação inicial; o tech leader aprova em 1 clique. |
| considerar | A 2ª prefeitura herda as regras validadas e só se pergunta a diferença. |
| Prefeitura | O tech leader a contata por fora. Opcional e barato: o agente gera um **pacote de perguntas consolidado**, pronto para o tech leader copiar e enviar (envio simulado). |

### Fluxo principal (demo)
1. Tech leader define o padrão (p1) e sobe a documentação (p2).
2. Agente organiza em fichas e mostra o que está completo.
3. Desenvolvedor pergunta ao mascote algo de um processo; o agente responde com citação.
4. Desenvolvedor faz uma pergunta que a documentação não cobre; o agente abre a pendência.
5. Tech leader vê a pendência no painel, responde ou sobe documento novo e manda reexecutar.
6. O agente responde agora, com citação, e a ficha se completa.
7. Painel do tech leader mostra a etapa estimada de cada desenvolvedor e os critérios de aceite gerados, para aprovação em 1 clique.
8. A 2ª prefeitura herda as regras e mostra só o delta.

### Telas (P0, máximo 6 mais o shell)
1. Padrão e upload (p1, p2) · 2. Fichas organizadas · 3. Mascote (chat) · 4. Pendências do tech leader · 5. Acompanhamento dos desenvolvedores (p4) · 6. Critérios de aceite (p5).

### Mascote desktop: custo
Empacotar a web em um shell (por exemplo Electron) é mudança ampla (kit §10): dependência grande, instalação com rede `[NV]`, e jurados precisam rodar o README. Sugestão: construir tudo como web primeiro (rota `/mascote` em janela pequena) e deixar o shell por último, como acabamento. Alternativa a verificar: expor o copiloto como servidor MCP para o desenvolvedor chamar da IDE ou do Claude Code `[HIP]`.

### Real × simulado × adiado
- **Real:** organização dos insumos; respostas do mascote com citação; geração de pendências e do rascunho de regra; critérios de aceite; cálculos do painel por código.
- **Simulado e rotulado:** contato com a prefeitura, ticket do suporte, desenvolvedores e dados fictícios.
- **Adiado:** shell desktop (stretch), integração real, resposta da prefeitura dentro do produto.

### Pasta `INSTRUCTIONS`
Um arquivo por função: organizador · copiloto/mascote · analista de pendências e roteiro · gerador de critérios.

### Cobertura dos problemas `[HIP]`
D-a **parcial** (consolida e prioriza as perguntas; a resposta da prefeitura fica fora do produto) · D-b **sim** · D-c **parcial** · D-d **parcial**. Objetivos: O2 em parte; O1 e O3 em parte; O4 em parte.

### Indicadores medidos na demo
Perguntas respondidas pela documentação sem acionar o tech leader · pendências abertas e fechadas · % de campos com fonte · rodadas até a regra completa · tempo do agente por consulta.

### Riscos
Não ataca a reunião com o cliente, que é o foco do portal (principal risco) · sinal indireto no p4 · shell desktop pesa em 6 h · RAG desnecessário com poucos documentos (basta colocar as fichas no contexto).

### Viabilidade `[HIP]`
V4 · C4 · A3 · D3 · F2 → ≈ 16 (sobe para ≈ 18–19 com os cortes). **Cortes, em ordem:** shell desktop → delta → progresso vira cartão → critérios. Não se corta: p1, p2, pendências com painel do tech leader, mascote em versão web.

### Perguntas ao demandante
1. A dor está na espera pela prefeitura ou na coordenação interna entre tech leader e desenvolvedores?
2. Existe o papel de tech leader na implantação? Os desenvolvedores falam direto com a prefeitura?
3. Quem hoje reúne e guarda a documentação de cada processo?
4. Aceitam mascote em janela web em vez de app desktop?
5. Faz sentido monitorar as perguntas do desenvolvedor para estimar a etapa?

---

## Comparação

| | Versão 1 (prefeitura) | Versão 2 (tech leader) |
|---|---|---|
| Usuário principal | Implantador | Tech leader e desenvolvedores |
| Quem tem a regra | Analista da prefeitura (responde dentro do produto) | Tech leader (a prefeitura está fora) |
| Dores cobertas | D-a, D-b, D-d; D-c em parte | D-b; D-a, D-c, D-d em parte |
| Aderência literal ao portal | Alta | Baixa: o portal não cita tech leader nem desenvolvedor |
| Complexidade | Média (página mobile do analista) | Alta se o shell desktop entrar |
| Nota indicativa | ≈ 21 | ≈ 16 (18–19 com cortes) |
| Núcleo em comum | padrão (p1), funil (p2), critérios (p5), delta | |

As duas versões compartilham o núcleo. A versão 2 pode virar um **modo interno** da versão 1 (o copiloto passa a atender também os desenvolvedores) se o demandante confirmar que a dor interna existe.
