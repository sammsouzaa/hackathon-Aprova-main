# F5 — Sessão de Transcrição e Gravador de JSON

Documentação da arquitetura, esquema JSON v1, fluxo de áudio, modos de escuta, persistência atômica e guia de integração para a F6.

---

## 1. Visão Geral da Arquitetura

A frente F5 conecta a segmentação com VAD/eco (F3) e o motor STT (F4), gerindo o ciclo de vida completo de uma sessão de reunião, coordenando a transcrição e persistindo os segmentos e eventos em arquivos JSON atômicos no processo principal (Node/Electron).

```
[Captura de Áudio (Microfone / Monitor)]
                 │
                 ▼
     [CoordenadorDeSegmentacao (F3)]
                 │
                 ├─ Fala no microfone com eco de sinal detectado
                 │    └─► Persiste direto como texto: "", motivoDescarte: "eco_sinal" (sem chamar STT)
                 │
                 └─ Segmentos válidos para transcrição
                      │
                      ▼
             [Fila FIFO Concorrente = 1]
                      │
                      ▼
               [MotorSTT (F4)]
                      │
                      ▼ (transcrição concluída)
             [Deduplicação de Texto]
                      │  Monitor: persiste imediatamente.
                      │  Microfone: aguarda segmentos concorrentes do monitor
                      │             (janela de 4s / timeout 8s). Se o texto
                      │             for repetição da Prefeitura -> descartadoPorEco: true.
                      │
                      ▼
         [PersistenciaTranscricao (IPC)]
                      │
                      ▼
       [Gravador no Main (transcricoes.mjs)]
       - Escrita atômica via .tmp + rename
       - Debounce 500ms
       - Recálculo dinâmico de estatísticas
       - Limpeza de sessões órfãs na inicialização
```

---

## 2. Esquema JSON v1

O arquivo é persistido em `dados/transcricoes/AAAA-MM-DDTHH-mm-ss_<reuniaoId>.json` (ou no `userData/transcricoes` em ambiente empacotado, configurável via `PRUMO_DADOS`).

```json
{
  "versaoEsquema": 1,
  "reuniao": {
    "id": "REU-01",
    "processo": "Alvará de construção residencial",
    "iniciadaEm": "2026-10-24T14:02:11-03:00",
    "encerradaEm": null,
    "estado": "em_andamento",
    "modoEscuta": "gravacao_com_aviso",
    "participantesAvisados": true
  },
  "motor": {
    "nome": "whisper-base-pt-q8",
    "biblioteca": "onnxruntime-node",
    "idioma": "pt",
    "threads": null,
    "rtfMedio": 0.162
  },
  "falantes": [
    { "id": "implantadora", "rotulo": "Implantadora", "canal": "microfone", "dispositivo": "Microfone Padrão" },
    { "id": "prefeitura", "rotulo": "Prefeitura", "canal": "monitor", "dispositivo": "Monitor de Áudio do Sistema" }
  ],
  "segmentos": [
    {
      "id": 1,
      "falante": "implantadora",
      "atribuicao": "canal",
      "canal": "microfone",
      "inicioMs": 1200,
      "fimMs": 4800,
      "texto": "Boa tarde, estamos conferindo os recuos do alvará.",
      "confianca": null,
      "descartadoPorEco": false,
      "motivoDescarte": null,
      "latenciaMs": 1850,
      "forcadoPorTamanho": false
    }
  ],
  "eventos": [
    { "tMs": 0, "tipo": "reuniao_iniciada", "detalhe": "Início da sessão de transcrição" }
  ],
  "estatisticas": {
    "segmentos": 1,
    "descartadosPorEco": 0,
    "duracaoMs": 3600,
    "porFalante": {
      "implantadora": 1,
      "prefeitura": 0,
      "indefinido": 0
    },
    "latenciaMedianaMs": 1850,
    "segmentosSemTexto": 0
  }
}
```

### Regras do Esquema:
1. **Ordenação Cronológica:** O array `segmentos` é **sempre** mantido ordenado por `inicioMs`. O campo `id` representa a ordem de chegada / geração do segmento.
2. **Eco de Sinal:** Descarta sem chamar o motor STT. Registra `texto: ""`, `descartadoPorEco: true`, `motivoDescarte: "eco_sinal"`.
3. **Eco de Texto:** Quando o microfone capta a fala remota da prefeitura (vazamento acústico não cancelado pelo correlacionador). O texto transcrito é mantido intacto, marcando `descartadoPorEco: true` e `motivoDescarte: "eco_texto"`.
4. **Resultados Vazios de STT:** Transcrições que retornam texto vazio não viram segmento no array `segmentos`, sendo contabilizadas em `estatisticas.segmentosSemTexto`.
5. **Tempos:** Todos os tempos (`inicioMs`, `fimMs`, `tMs`, `duracaoMs`, `latenciaMs`) são números inteiros em milissegundos.

---

## 3. Modos de Escuta e Garantias de Privacidade

As garantias são forçadas **em ambas as camadas** (Renderer na `SessaoDeTranscricao` e Main no `GravadorDeTranscricao`):

| Modo | Grava em Disco? | `participantesAvisados` Obrigatório | Comportamento |
|---|---|---|---|
| `gravacao_com_aviso` | **Sim** | **Sim (`true`)** | Grava o JSON atômico com debounce de 500 ms. |
| `escuta_sem_guardar` | **Não** | **Sim (`true`)** | Mantém em memória para consumo da UI (F6); Main recusa qualquer criação de arquivo temporário ou persistente. |
| `modo_notas` | N/A | N/A | **Recusa estrita:** Lança exceção e não inicia a sessão (modo de notas é manual, sem escuta). |

Caso `participantesAvisados !== true`, tanto o Renderer quanto o Main abortam imediatamente com erro explícito de segurança.

---

## 4. Limites e Premissas Técnicas

1. **Vários interlocutores remotos no mesmo canal:** O canal `monitor` agrupa todos os interlocutores da chamada remota sob o falante `prefeitura`. Diferenciação individual adicional (diarização) fica fora do escopo do desktop local.
2. **Vazamento acústico / Eco:** Tratado em dois estágios:
   - *Estágio 1 (Sinal):* Detecção de correlação cruzada de envelopes pelo `CoordenadorDeSegmentacao`.
   - *Estágio 2 (Texto):* Deduplicação lexical (`idsDuplicadosPorEco`) com janela temporal de 4 segundos.
3. **Limites de Payload:**
   - Texto de segmento limitado a 5.000 caracteres.
   - Máximo de 20.000 segmentos por sessão (~40 horas de fala contínua).
4. **Persistência Atômica:**
   - Gravação sempre em `*.tmp` seguida de `renameSync`.
   - Flushes garantidos em `before-quit` e `will-quit` do Electron.
   - Recuperação automática de sessões órfãs (`recuperarOrfas()`) ao iniciar o app, convertendo reuniões `em_andamento` para `interrompida`.

---

## 5. Guia de Integração para a F6 (Como usar a Sessão)

No Renderer (React / Contexto da Reunião), a F6 deve instanciar e injetar os serviços na `SessaoDeTranscricao`:

```typescript
import { SessaoDeTranscricao, PersistenciaDesktop } from './services/transcricao';
import { servicoCaptura } from './services/audio/captura';
import { criarMotorSTT } from './services/stt'; // Fornecido pela F4

// Instanciação
const sessao = new SessaoDeTranscricao({
  fonteDeBlocos: servicoCaptura,
  motor: criarMotorSTT(),
  persistencia: new PersistenciaDesktop()
});

// Assinatura de callbacks reativos para a UI
sessao.aoSegmento((segmento) => {
  console.log('Novo segmento para a UI:', segmento.falante, segmento.texto);
});

sessao.aoEstado((estado, detalhe) => {
  console.log('Estado da sessão:', estado, detalhe);
});

// Início da reunião
await sessao.iniciar({
  id: "REU-01",
  processo: "Alvará 123/2026",
  modoEscuta: "gravacao_com_aviso",
  participantesAvisados: true
}, {
  dispositivoMicrofone: "Microfone Realtek",
  dispositivoMonitor: "Monitor de Áudio PulseAudio"
});

// Pausar / Retomar / Finalizar
await sessao.pausar();
await sessao.retomar();
const transcricaoFinal = await sessao.finalizar();
```

---

## 6. Comandos e Testes

- **Validar arquivo JSON avulso:**
  ```bash
  npm run validar:transcricao -- dados/exemplo/reuniao-exemplo.json
  ```
- **Executar testes de sessão e persistência (F5):**
  ```bash
  npm run teste:sessao
  ```
- **Executar testes de segmentação e VAD (F3):**
  ```bash
  npm run teste:segmentacao
  ```
- **Checar tipagem e lint:**
  ```bash
  npm run lint
  ```

---

## 7. Decisões Tomadas e Perguntas ao Usuário

1. **Nome do arquivo:**
   - *Decisão adotada:* Formato `AAAA-MM-DDTHH-mm-ss_<reuniaoId>.json` (apenas com `reuniaoId` sanitizado, sem o processo no nome do arquivo, garantindo caminhos concisos e padronizados no sistema de arquivos).
2. **Rótulos de Falante:**
   - *Decisão adotada:* Rótulos padronizados `"Implantadora"` e `"Prefeitura"`. Personalizações com nomes de participantes da demo cabem à camada de visualização (F6).

---

## 8. Orientações para a Mesclagem (Merge)

> **ATENÇÃO:** Para preservar a integridade das branches paralelas (F4 e F6), os arquivos `docs/ESTADO.md` e `docs/stack.md` **NÃO foram editados** nesta branch. A pessoa responsável pelo merge deve atualizar os seguintes pontos:

1. **`docs/ESTADO.md`:**
   - Marcar a entrega da **F5 (Sessão de Transcrição e Gravador de JSON)** como concluída.
   - Atualizar a lista de testes disponíveis com `npm run teste:sessao` e `npm run validar:transcricao`.
2. **`docs/stack.md`:**
   - Adicionar o esquema de persistência de transcrições em `dados/transcricoes/` e os canais IPC `prumo:transcricao:*`.
