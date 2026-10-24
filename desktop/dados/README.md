# Dados e Esquema de Transcrições do Prumo Desktop

Este diretório contém a especificação e persistência local das sessões de transcrição de reuniões realizadas no Prumo Desktop (Electron).

## 1. Princípios e Diretrizes

1. **Apenas Texto e Metadados:** Nenhum arquivo ou fluxo de áudio é gravado em disco. Toda persistência se limita estritamente ao JSON estruturado da transcrição.
2. **Localização dos Arquivos:**
   - Em desenvolvimento / execução desempacotada: `dados/transcricoes/` na raiz do repositório.
   - Em produção (app empacotado): `app.getPath('userData')/transcricoes`.
   - Sobrescrita opcional: variável de ambiente `PRUMO_DADOS` (o app criará a pasta `transcricoes/` dentro do diretório especificado).
3. **Escrita Atômica:** Cada gravação é feita em arquivo temporário `.tmp` e renomeada atomicamente, protegendo contra corrupção em caso de queda de energia ou encerramento abrupto (`kill -9`).
4. **Debounce e Flush Imediato:** Atualizações são agrupadas em intervalos de 500 ms com flush síncrono imediato ao finalizar a reunião ou ao fechar o aplicativo.

## 2. Comportamento por Modo de Escuta

| Modo | Comportamento | Garantia em Disco |
|---|---|---|
| `gravacao_com_aviso` | Captura os canais, transcreve localmente e grava o JSON | Exige `participantesAvisados === true` em ambas as camadas (renderer e main) |
| `escuta_sem_guardar` | Captura, transcreve e exibe no painel em tempo real | **Garantia imposta no processo principal:** nenhum arquivo, nem temporário, é criado |
| `modo_notas` | Modo silencioso sem captura de áudio | A sessão se recusa a iniciar qualquer gravação |

## 3. Nomenclatura dos Arquivos

Os arquivos de transcrição seguem o padrão cronológico sanitizado:
```text
dados/transcricoes/AAAA-MM-DDTHH-mm-ss_<reuniaoId>.json
```
Exemplo: `2026-10-24T14-02-11_REU-01.json`

## 4. Esquema JSON v1

O contrato completo validado por `scripts/validar-transcricao.mjs`:

```json
{
  "versaoEsquema": 1,
  "reuniao": {
    "id": "REU-01",
    "processo": "Alvará de construção residencial",
    "iniciadaEm": "2026-10-24T14:02:11-03:00",
    "encerradaEm": "2026-10-24T14:32:45-03:00",
    "estado": "concluida",
    "modoEscuta": "gravacao_com_aviso",
    "participantesAvisados": true
  },
  "motor": {
    "nome": "whisper-base-q8",
    "biblioteca": "@huggingface/transformers@4.3.1 + onnxruntime-node",
    "idioma": "pt",
    "threads": 4,
    "rtfMedio": 0.186
  },
  "falantes": [
    { "id": "implantadora", "rotulo": "Implantadora", "canal": "microfone", "dispositivo": "Microfone Built-in" },
    { "id": "prefeitura", "rotulo": "Prefeitura", "canal": "monitor", "dispositivo": "Prumo-Reuniao" }
  ],
  "segmentos": [
    {
      "id": 1,
      "falante": "implantadora",
      "atribuicao": "canal",
      "canal": "microfone",
      "inicioMs": 1200,
      "fimMs": 4800,
      "texto": "Boa tarde, vamos revisar os parâmetros do alvará residencial.",
      "confianca": 0.95,
      "descartadoPorEco": false,
      "motivoDescarte": null,
      "latenciaMs": 850,
      "forcadoPorTamanho": false
    }
  ],
  "eventos": [
    { "tMs": 0, "tipo": "reuniao_iniciada" },
    { "tMs": 1834000, "tipo": "encerrada" }
  ],
  "estatisticas": {
    "segmentos": 1,
    "descartadosPorEco": 0,
    "duracaoMs": 1834000,
    "porFalante": {
      "implantadora": 1,
      "prefeitura": 0,
      "indefinido": 0
    },
    "latenciaMedianaMs": 850
  }
}
```

## 5. Validação Automática

Para validar arquivos existentes ou gerados:
```bash
npm run validar:transcricao -- dados/exemplo/reuniao-exemplo.json
```
