# Stack e estrutura técnica

| Campo | Valor |
|---|---|
| Status / versão / hora | v1 · 24/10/2026 ~11:22 · orientação-base e itens reais definidos; **stack real ainda não descoberta** (não há código) |
| Dono | X (D registra) |
| Base | `proposta.md` §6; `../../D09_kit_desenvolvimento/referencias/ai-studio-e-claude-code.md`; `base-ai-studio.md` §4 |

## 1. Plataforma e stack (orientação-base × stack real descoberta)

> A coluna "Orientação-base" é o ponto de partida do kit (documentação do AI Studio, 23/10/2026). A coluna "Stack real" é **o que o código mostra**; em divergência, vale a real e ela é **preservada** se estiver adequada (`../../D09_kit_desenvolvimento/CLAUDE.md` §7).

| Camada | Orientação-base | Stack real (auditoria, fase 4) | Rótulo |
|---|---|---|---|
| Plataforma | **desktop**: mascote em web (AI Studio) empacotada com **Electron**, só na reunião; **web** da plataforma (outro integrante) para pendências e lembretes | [VALIDAR NA AUDITORIA] | `[DEC]` desktop só na reunião (24/10); Electron `[NV]` não testado |
| Frontend | React | [VALIDAR NA AUDITORIA] | |
| Linguagem | TypeScript ou JavaScript | [VALIDAR NA AUDITORIA] | |
| Bundler / dev server | (depende da geração) | [VALIDAR NA AUDITORIA] | |
| Estilo | CSS, Tailwind ou outra | [VALIDAR NA AUDITORIA] | |
| Componentes / UI | os da base | [VALIDAR NA AUDITORIA] | |
| Roteamento e estado | (depende da geração) | [VALIDAR NA AUDITORIA] | |
| Servidor | Node.js, se houver funcionalidade de servidor (**necessário aqui**: chamada ao LLM e, se houver, ao serviço de fala) | [VALIDAR NA AUDITORIA] | |
| IA | serviço e modelo adequados ao problema; provedor **a definir** (API do Claude com chave da própria equipe é a hipótese; Gemini é opção) | [VALIDAR NA AUDITORIA] | `[A]` provedor/chave |
| Persistência | mock por padrão; estado da sessão no navegador | [VALIDAR NA AUDITORIA] | |
| Autenticação | **nenhuma real**; usuária fictícia fixa (Marina Duarte) | [VALIDAR NA AUDITORIA] | |
| Versões (Node, npm, principais pacotes) | — | [VALIDAR NA AUDITORIA] | |

## 2. Estrutura de pastas

Como o projeto exportado está organizado (pastas de componentes, telas, dados, servidor) e o dono de cada uma: [VALIDAR NA AUDITORIA]. Pastas fixas do **repositório de entrega** (exigência do portal), à parte do código exportado: `INSTRUCTIONS/` (ver §7), `README.md` (problema escolhido e como rodar), `prototipo/` (código). Desvios feitos e motivo: …

## 3. Dependências (cada uma com motivo)

| Dependência | Para quê | Por que o que existe não basta (só para as adicionadas por nós) | Funciona offline? |
|---|---|---|---|
| Fonte Inter local | tipografia do design | CDN não funciona sem rede | sim |
| SDK ou chamada HTTP ao provedor de IA | análise de trechos e resumo | é o item real do diferencial | **não** (queda gravada rotulada) |
| Serviço de transcrição de fala `[A]` (candidatos vistos na pesquisa: Deepgram, AssemblyAI, Gladia; qualidade em português do Brasil e preço atual `[NV]`) | transcrever microfone e áudio da aba **só no stretch** | o LLM não recebe áudio (`[NV]`) | **não** |
| Electron + electron-builder (devDependencies) | empacotar a janela web como programa desktop (bandeja, janela sem moldura, sempre no topo) e gerar AppImage e deb | pedido da equipe; a web sozinha não vira janela de bandeja. **Configurado** na branch `feat/electron` (worktree `projetos/prumo-desktop-electron`), ainda não mesclada | sim, depois de instalado (rede só para instalar e para o build) |
| (nenhuma outra prevista) | | | |

## 4. Comandos verificados (copie só o que foi executado)

| Ação | Comando | Verificado em (data / máquina) |
|---|---|---|
| Versões | `node --version` v24.13.0 · `npm --version` 11.6.2 · `electron` 45.0.0 · `electron-builder` 26.18.0 | 24/10/2026, notebook da equipe (Ubuntu, GNOME, Wayland) |
| Instalar | `npm install` (worktree `prumo-desktop-electron`) | 24/10/2026, notebook da equipe |
| Rodar (desenvolvimento) | `npm run electron:dev` (Vite em 127.0.0.1:3000 + Electron; abriu, sem erro de console, encerrou limpo) · `npm run dev` no navegador **não executado por mim** | 24/10/2026, notebook da equipe |
| Build | `npm run lint` (tsc, sem erros) · `npm run build` (vite) · `npm run electron:pack` (release/linux-unpacked) · `npm run electron:dist` (AppImage 126 MB e deb 101 MB) | 24/10/2026, notebook da equipe |
| Rodar o build / produção local | `npm run electron:start` · `npm run electron:smoke` (abre, marca o aviso, inicia a reunião, confere janela, sempre no topo e ocultar/mostrar; salva capturas em `.tmp/`) · pacote `release/linux-unpacked/prumo-desktop --ozone-platform=x11` e AppImage, ambos com `PRUMO_SMOKE=1` → `ok=true`, 0 erros de console | 24/10/2026, notebook da equipe |
| Reiniciar a demonstração | | |
| Varredura de rotas | | |

## 5. Estado e persistência da demonstração

Mocks = estado inicial · ações da sessão = estado compartilhado (e `sessionStorage`, se precisar sobreviver a recarregamento) · persistência real: nenhuma · reset: botão "Reiniciar demonstração" restaura os mocks, o checklist, os compromissos e `DEMO_NOW` (26/10/2026 14:00) · "hoje" fixo: `DEMO_NOW` · comportamento sem armazenamento do navegador: o cenário volta ao início a cada recarga (aceitável).

## 6. Execução e disponibilização

Decisão (`../../D09_kit_desenvolvimento/referencias/publicacao-e-execucao.md` §2): **local** (o mascote roda como programa Electron ou, na queda, como janela web compacta) (comandos no README) `[HIP]`, com **vídeo de backup** (portal pede "demo funcionando ou vídeo") · URL (se houver): — · instruções aos avaliadores: `demo/roteiro-demo.md` §8 · tempo máximo gasto: 20 min.

## 7. Itens REAIS: o que executa de verdade (contrato e queda)

> Cada item real tem contrato, prova de que é real e queda rotulada. Padrões e checklist: `../../D09_kit_desenvolvimento/referencias/padroes-de-integracao-ia.md`. A pasta `INSTRUCTIONS/` (raiz do repositório, exigência do portal) tem um arquivo por função de IA, mais um índice `00-LEIA-ME.md` que diz **quando cada uma é chamada** e qual é a sua responsabilidade.

Por trecho de fala, o servidor chama em paralelo as instruções 01, 02 e 03; ao encerrar, a 04. Todas usam o mesmo padrão de chamada (um endpoint do servidor existente), saída JSON validada por esquema e a mesma queda.

| Item | Função / por que é real (diferencial, exigência) | Entrada → Saída (validada) | Onde roda (servidor) e onde fica a chave | Queda rotulada | Prova (P3) |
|---|---|---|---|---|---|
| R-1a `01-analisar-trecho` | Marca os itens do checklist que a fala responde, com a **frase de evidência** (diferencial; portal: "agente + código clássico") | `{trecho, checklist[], hoje}` → `{itens:[{id, valor, evidencia}]}`; o código confere que `evidencia` existe literalmente no trecho; fora do formato = erro tratado | Endpoint no servidor Node; chave em variável de ambiente do servidor, nunca no cliente | Resposta gravada (execução real anterior, datada) com rótulo "Análise gravada em <data>" | duas falas diferentes geram marcações diferentes; resposta crua e linha de log |
| R-1b `02-verificar-contradicao` | Compara a fala com os trechos de documento e devolve a contradição **com o id e o texto do trecho** | `{trecho, documentos[]}` → `{alertas:[{falaTrecho, docId, diferenca}]}`; o código confere que `docId` existe e exibe o texto **do arquivo**, não o texto do modelo | idem | idem | a fala "3 metros" gera o alerta contra DOC-02; uma fala sem conflito não gera |
| R-1c `03-extrair-compromissos` | Extrai quem prometeu o quê e até quando | `{trecho, hoje}` → `{compromissos:[{quem, o_que, prazo}]}`; data resolvida por código a partir de "até quinta" e `DEMO_NOW` | idem | idem | "até quinta" vira 29/10; "até sexta", 30/10 |
| R-2 `04-gerar-resumo` | Gera o contexto reunido (regras confirmadas, campos que mudam, regras locais, pendências) para o agente da empresa | estado final → JSON/markdown com campos obrigatórios; o código confere que os valores citados batem com o checklist | idem | Resumo gravado, rotulado | resumo reflete uma decisão diferente (ex.: "Ignorar" no alerta) |
| R-3 Transcrição de áudio **(stretch; só entra se passar P3 até 14:00)** | Converter a fala (canal do microfone = implantadora; canal da aba da chamada = prefeitura) em texto | áudio → texto por canal, enviado ao mesmo pipeline | serviço externo `[A]`; chave no servidor | áudio gravado → roteiro, sempre rotulados; **nunca "ao vivo" na queda** | uma frase falada gera a marcação do item; teste real de rede e português |

Sem itens reais fora desta tabela: lembretes, ticket, envio ao agente e tempo são simulados (`experiencia.md` §7).

## 8. Ambiente (`.env`)

Variáveis usadas (**nomes** e significado; sem valores secretos): [VALIDAR NA AUDITORIA]. Nomes propostos `[HIP]`: `LLM_API_KEY` (chave do provedor de IA), `STT_API_KEY` (serviço de fala, só no stretch), `DEMO_MODE` (`ao_vivo` · `gravado`; força a queda rotulada), `PORT`. `.env` fora do Git; `.env.example` versionado. **Nenhuma chave no código cliente.**
