# Prumo - Mascote de Reunião

Painel compacto de apoio ao implantador durante reuniões de coleta de regras de negócio para processos municipais (Desafio Implantação).

## Problema

Nas reuniões de coleta de regras com analistas municipais, muitas regras já existem no modelo ou foram confirmadas previamente, mas divergências locais passam despercebidas e compromissos combinados verbalmente se perdem, gerando retrabalho e reuniões repetidas. O Prumo acompanha a reunião com checklist inteligente, detecta contradições com documentos modelo e registra compromissos com prazos para cobrança posterior.

## Como Instalar e Rodar

### Pré-requisitos
- Node.js (versão 20+ recomendada)
- npm

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000/`. Para ver apenas a janela compacta do mascote (sem a moldura do desktop de preview), acesse `http://localhost:3000/?desktop=0`.

### Programa desktop (Electron)

O mascote é um programa de bandeja: ao abrir o executável ele inicia em **segundo plano** (sem janela). Um clique no ícone do Prumo na barra superior abre o painel direto, **fixo na borda direita da tela, em toda a altura útil**, sempre no topo e em todas as áreas de trabalho. Nenhuma rede é usada.

```bash
npm run electron:dev      # Vite + Electron com recarga; abre o painel já na partida (PRUMO_ABRIR=1)
npm run electron:start    # build do front e abre o Electron a partir de dist/ (só bandeja)
npm run electron:smoke    # teste de fumaça: abre, inicia a reunião, salva capturas em .tmp/
npm run electron:pack     # empacota sem instalador: release/linux-unpacked/prumo-desktop
npm run electron:dist     # instaladores Linux: release/Prumo-0.1.0.AppImage e .deb
npm run icones            # regera os ícones a partir do SVG do mascote (precisa de sessão gráfica)
```

Uso:
- **Abrir/ocultar:** clique no ícone da bandeja (botão secundário abre o menu). O X do cabeçalho oculta o painel; o Prumo continua na bandeja. Atalho `Ctrl+Alt+P` (pode não funcionar em algumas sessões Wayland). Abrir o executável de novo também traz o painel.
- **Sair:** menu da bandeja "Sair do Prumo" ou `Ctrl+Q` com o painel em foco.
- Menu da bandeja: Mostrar/Ocultar, "Sempre no topo" e "Reancorar na tela".
- O painel é fixo (não arrasta). Em multimonitor ele abre no monitor onde está o ponteiro.
- Instalar o `.deb`: `sudo apt install ./release/prumo-desktop_0.1.0_amd64.deb`. O AppImage roda com `chmod +x release/Prumo-0.1.0.AppImage && ./release/Prumo-0.1.0.AppImage`.

Variáveis de ambiente (todas opcionais):

| Variável | Efeito |
|---|---|
| `PRUMO_OZONE=wayland` | Usa Wayland nativo. Por padrão, em sessão Wayland o app reinicia uma vez em X11 (XWayland), que é o que permite "sempre no topo" e o posicionamento. |
| `PRUMO_ABRIR=1` | Mostra o painel já na partida, em vez de iniciar só na bandeja. |
| `PRUMO_GPU=1` | Liga a aceleração por GPU (desligada no Linux por padrão: o processo de GPU falhou nesta máquina). |
| `PRUMO_DEV_URL` | URL do Vite usada só fora do pacote (definida por `electron:dev`). |
| `PRUMO_DEVTOOLS=1` | Abre as ferramentas de desenvolvedor no modo `electron:dev`. |

Se o Chromium reclamar do sandbox (`chrome-sandbox` sem permissão, comum em AppImage no Ubuntu 24.04), abra com `--no-sandbox`.

### Verificação de Tipos e Build
```bash
npm run lint
npm run build
```

## O que é Real e o que é Simulado

- **Real nesta versão (Front-end):**
  - Interface do painel compacto e navegação entre abas (Conversa e Checklist).
  - Cálculo de cobertura do checklist, regras locais e compromissos a partir do estado da reunião.
  - Decisão interativa humana de alertas de contradição (perguntar, aceitar como regra local, ignorar).
  - Confirmação e edição de prazos de compromissos.
  - Aprovação do resumo estruturado e exportação real em JSON.
  - Reinício completo do estado demonstrativo.

- **Simulado / Fictício:**
  - **Dados e Entidades:** Município (Serra do Sabiá), servidores (Helena Prado), documentos e leis são fictícios (Selo permanente "Protótipo demonstrativo · dados fictícios").
  - **Áudio e Transcrição:** Roteiro gravado de falas simulando a conversa da reunião.
  - **Análise de Trecho e Detecção:** Respostas gravadas demonstrativas representando a costura futura para modelo de IA.
  - **Lembretes e Tickets:** Simulação de avanço no tempo (cobrança após 3 dias) e envio/resposta de ticket simulado.
  - **Envio ao Agente:** Integração demonstrativa com retorno simulado.
