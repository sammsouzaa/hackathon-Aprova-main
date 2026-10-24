# CLAUDE.md: regras para o agente de desenvolvimento deste repositório

Português do Brasil. Projeto: **Prumo**, copiloto de reunião de implantação (Desafio 2 do Hackathon Aprova).
Leia [`../README.md`](../README.md) antes de agir.

## Estrutura (não mude sem pedir)

| Pasta | O que é |
|---|---|
| `INSTRUCTIONS/` | instruções do agente de IA do produto; **fonte única** dos prompts |
| `backend/` | FastAPI + Gemini: contexto, sessão ao vivo, ata. Rotas em `backend/API.md` |
| `frontend/` | Hub de contexto (React + Vite) |
| `desktop/` | Prumo, painel compacto em Electron (reunião ao vivo, STT local, checklist) |
| `extensao-meet/` | extensão Chrome que captura o áudio do Google Meet e envia ao backend |

## Regras

1. **Prompts só em `INSTRUCTIONS/`.** Nunca recoloque texto de prompt em `backend/prompts.py`. Ao mudar um arquivo,
   mantenha os placeholders `{...}` (listados no cabeçalho do arquivo) e atualize o índice em `INSTRUCTIONS/README.md`.
2. **Nada inventado.** O copiloto só marca como respondido o que foi dito; só chama de `[confirmado]` o que o cliente
   confirmou. Preserve essa regra em qualquer instrução nova.
3. **Real × simulado explícito.** O que for simulado na UI leva rótulo ("dados fictícios", "ação demonstrativa").
   Os dados dos exemplos (MeuLab / IFPR, Serra do Sabiá) são fictícios.
4. **Segredos.** `GEMINI_API_KEY` só em `backend/.env` (ignorado pelo git). Nunca em código, log ou commit.
5. **Código clássico para o que é determinístico** (cobertura, prazos, ordenação); modelo só para linguagem.
6. **Verificar antes de dizer que funciona:** `python rodar.py` sobe backend (:8000) e frontend (:3000);
   `npm run lint` em `frontend/` e `desktop/`.
7. Mudança pequena e localizada; não reescreva o que funciona. Decisão de produto (o que cortar, o que é real) é da equipe.
