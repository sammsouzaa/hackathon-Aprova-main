# Validação

| Campo | Valor |
|---|---|
| Status / versão / hora | [PREENCHER NO EVENTO] |
| Dono | D (integrador) com todos |
| Base | `experiencia.md` §2 e §5; `dados-mock.md` §7 |

## 1. Cenário de demonstração (3 execuções após reset)

| # | Data/hora | Quem | Tag / commit | Ambiente (máquina, navegador, resolução) | Passos que passaram (de F-01…) | Resultado | Defeitos |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |

Critério: 3 de 3 sem intervenção, sem erro de console, com reset entre as execuções. Um passo que falhou uma vez **não** é mostrado como pronto.

## 2. Varredura de rotas e de botões

**Rotas** (P1; **não** prova P3): ajuste a lista às rotas do projeto e execute.

```bash
BASE=${BASE:-http://localhost:PORTA}   # URL/porta do comando de stack.md §4
for rota in /; do   # acrescente as rotas GET reais do menu e do fluxo (descobertas na auditoria)
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$rota")
  [ "$code" = "200" ] && echo "OK    $rota" || echo "FALHA $rota ($code)"
done
```

**Botões e links** (regra do botão vivo): percorra cada tela do cenário.

| Tela | Controle | Reação esperada (`experiencia.md` §5) | Reagiu? | Defeito |
|---|---|---|---|---|
| | | | | |

## 3. Integrações reais e IA (se houver; `stack.md` §7)

| Item real | Chave / variáveis presentes no ambiente da demo? | Entrada 1 → saída | Entrada 2 → saída (diferente) | Log/resposta crua guardado | Queda rotulada ensaiada (rede ou chave removida) | Data |
|---|---|---|---|---|---|---|
| nenhum `[VALIDAR]` | | | | | | |

Sem chamada real vista, o item é **simulado** para todos os efeitos do pitch.

## 4. Coerência dos dados

Conferir o checklist de `dados-mock.md` §7 olhando as telas: contagens, nomes, datas, usuário logado, efeito do caminho dourado nos indicadores, reset restaurando o estado inicial (inclusive persistido). Divergências: [PREENCHER NO EVENTO]

## 5. Visual e dispositivos

| Verificação | Ambiente | Resultado | Data |
|---|---|---|---|
| Notebook (~1440 px) / monitor do evento | | | |
| Celular (~390 px), se a demonstração usa | | | |
| Zoom 110–125 % | | | |
| Console do navegador sem erro | | | |
| Checklist de fidelidade (`design.md` §8) | | | |

## 6. Máquina limpa, dependências e disponibilização

| Verificação | Resultado | Data |
|---|---|---|
| Clone novo + README em ≤ 3 comandos abre o cenário | | |
| Dependências externas (rede, serviços, chaves, cotas) listadas e testadas | | |
| Funciona sem internet (sem CDN no caminho do cenário), exceto a chamada real, que cai na queda rotulada | | |
| Versão publicada (URL), se houver: cenário percorrido em janela anônima | | |
| Vídeo de backup gravado e aberto num segundo aparelho | | |

## 7. Defeitos

| ID | Onde | O que acontece | Gravidade (bloqueia o cenário / incomoda / cosmético) | Decisão (corrigir / remover / aviso demonstrativo) | Status |
|---|---|---|---|---|---|
| DEF-01 | | | | | |

## 8. Critérios de `demo-ready`

```text
[ ] Cenário 3/3 após reset, no ambiente da demonstração
[ ] Nenhum botão morto no cenário; menus sem destino removidos
[ ] Nenhum erro de console no cenário
[ ] Integração real vista (2 entradas, 2 saídas) ou queda rotulada ativada e ensaiada
[ ] Dados coerentes (checklist) e selo de demonstração visível; real e simulado rotulados
[ ] Máquina limpa ok; instruções aos avaliadores testadas
[ ] Vídeo de backup gravado; tag demo-ready criada
```
