# Prumo: copiloto de reunião de implantação

Hackathon Aprova · **Desafio escolhido: 2, Implantação** ("como coletar e validar a regra de negócio de ~100 processos
sem depender de reunião?").

## O problema

Cada prefeitura tem 12–13 secretarias e ~100 processos para implantar em 45–60 dias. O implantador coleta a regra de
negócio em reuniões, mas sai delas sem ter perguntado tudo, sem notar o que contradiz o documento e sem registrar o
que o cliente ficou de enviar. Resultado: reunião de repetição ("bola de neve") e processos no ar como protocolo genérico.

## A solução

O **Prumo** é um agente que acompanha o implantador:

1. **Antes:** lê os arquivos do cliente (conversas, PDFs, planilhas, prints) e monta contexto, glossário e um checklist
   do que precisa ser alinhado, já marcando o que o cliente confirmou.
2. **Durante:** transcreve a reunião, marca o checklist com a frase que comprova, avisa quando a fala diverge do
   contexto e sugere a próxima pergunta. O implantador também pode perguntar ao copiloto.
3. **Depois:** gera a ata com decisões, regras, pendências e próximos passos.

**Indicadores que mexe:** reuniões de repetição por processo, idas e vindas até a regra completa, tempo para validar
a regra, processos implantados por dia. (Sem dados reais da Aprova, não há medição; os números são metas do desafio.)

**Agente + código clássico:** o modelo (Gemini) cuida da linguagem; cobertura do checklist, janelas de análise, cache e
persistência são código. As instruções do agente estão na pasta **[`INSTRUCTIONS/`](INSTRUCTIONS/README.md)**, com o
que cada uma faz e quem a chama.

## Estrutura

```
INSTRUCTIONS/     instruções do agente (prompts reais carregados pelo backend) + regras do agente de desenvolvimento
backend/          API FastAPI + Gemini: contexto, sessão ao vivo, ata · rotas em backend/API.md
frontend/         hub de contexto (React + Vite)
desktop/          Prumo desktop: painel compacto em Electron para a reunião ao vivo
extensao-meet/    extensão Chrome que captura o áudio do Google Meet e envia ao backend
rodar.py          sobe backend + frontend com um comando
```

## Como rodar

**Pré-requisitos:** Python 3.10+, Node.js 20+, uma chave do Gemini ([AI Studio](https://aistudio.google.com/apikey)).

```bash
cp backend/.env.example backend/.env   # preencha GEMINI_API_KEY
python rodar.py
```

`rodar.py` cria o venv do backend, instala o front, sobe a API em `http://localhost:8000` e o front em
`http://localhost:3000`, e na primeira vez carrega o contexto de exemplo **MeuLab · IFPR Cascavel** (1–2 min, usa a
chave). Ctrl+C encerra tudo. Os dados do exemplo são fictícios.

### Prumo desktop (reunião ao vivo)

Com o backend no ar:

```bash
cd desktop
npm install
npm run electron:dev      # abre o painel; atalhos e variáveis no desktop/README.md
```

Aponte para outra API com `PRUMO_API_URL=http://<host>:8000`. A transcrição local usa o modelo Whisper em
`desktop/modelos/` (gerado por `npm run modelos`, não versionado). Sem o Electron, `npm run dev` mostra a versão web
com a reunião **simulada** (roteiro gravado).

### Extensão do Meet

`chrome://extensions` → modo desenvolvedor → "Carregar sem compactação" → pasta `extensao-meet/`. Backend em `:8000`.

## O que é real e o que é simulado

| Real | Simulado / fictício |
|---|---|
| Extração, consolidação, checklist, chat sobre o contexto, análise ao vivo e ata (Gemini, via `INSTRUCTIONS/`) | Cliente MeuLab/IFPR e município Serra do Sabiá, pessoas e documentos |
| Transcrição ao vivo (local no desktop ou via API), exportação JSON da reunião | Modo demo web/desktop sem áudio: roteiro de falas, análise gravada, envio de ticket e lembretes |

## Demo

Roteiro: [`desktop/roteiro-demo.md`](desktop/roteiro-demo.md). Documentação de trabalho do desktop (proposta, design,
decisões): [`desktop/docs/`](desktop/docs/). Vídeo de backup: _[adicionar link aqui]_.
