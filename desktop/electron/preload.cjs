'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const chamar = (canal, ...argumentos) => ipcRenderer.invoke(`prumo:${canal}`, ...argumentos);

contextBridge.exposeInMainWorld(
  'prumoDesktop',
  Object.freeze({
    plataforma: process.platform,
    versoes: Object.freeze({
      electron: process.versions.electron,
      chrome: process.versions.chrome
    }),
    janela: Object.freeze({
      ocultar: () => chamar('janela:ocultar'),
      minimizar: () => chamar('janela:minimizar'),
      sempreNoTopo: (valor) => chamar('janela:sempre-no-topo', valor),
      restaurarPosicao: () => chamar('janela:restaurar-posicao'),
      sair: () => chamar('app:sair')
    }),
    audio: Object.freeze({
      statusMonitor: () => chamar('audio:status-monitor'),
      ativarMonitor: () => chamar('audio:ativar-monitor'),
      desativarMonitor: () => chamar('audio:desativar-monitor'),
      obterPreferencias: () => chamar('audio:obter-preferencias'),
      salvarPreferencias: (prefs) => chamar('audio:salvar-preferencias', prefs),
      aoMudarSink: (callback) => {
        const handler = (_event, dados) => callback(dados);
        ipcRenderer.on('prumo:audio:sink-alterado', handler);
        return () => ipcRenderer.removeListener('prumo:audio:sink-alterado', handler);
      }
    }),

    // ---- F4 (motor de transcrição): preencher somente este bloco ----
    stt: (() => {
      // Os canais devolvem { ok, ... }; aqui os erros viram exceções com mensagem limpa.
      const abrir = (resposta, campo) => {
        if (!resposta || resposta.ok !== true) throw new Error(resposta?.erro ?? 'Falha na transcrição');
        return resposta[campo];
      };
      return Object.freeze({
        estado: () => chamar('stt:estado'),
        preaquecer: async () => abrir(await chamar('stt:preaquecer'), 'estado'),
        transcrever: async (pcm, opcoes) => abrir(await chamar('stt:transcrever', pcm, opcoes), 'resultado'),
        descarregar: async () => abrir(await chamar('stt:descarregar'), 'estado'),
        aoMudarEstado: (callback) => {
          const handler = (_event, estado) => callback(estado);
          ipcRenderer.on('prumo:stt:estado-alterado', handler);
          return () => ipcRenderer.removeListener('prumo:stt:estado-alterado', handler);
        }
      });
    })(),

    // ---- fim do bloco da F4 ----

    // ---- API do Prumo (transcrição e análise no servidor) ----
    api: Object.freeze({
      base: () => chamar('api:base'),
      chamar: (pedido) => chamar('api:chamar', pedido),
      enviarAudio: (dados) => chamar('api:enviar-audio', dados)
    }),

    // ---- F5 (sessão e JSON): preencher somente este bloco ----
    transcricao: Object.freeze({
      iniciar: (meta) => chamar('transcricao:iniciar', meta),
      anexar: (segmento) => chamar('transcricao:anexar', segmento),
      evento: (ev) => chamar('transcricao:evento', ev),
      finalizar: (resumo) => chamar('transcricao:finalizar', resumo),
      listar: () => chamar('transcricao:listar'),
      abrirPasta: () => chamar('transcricao:abrir-pasta')
    })
    // ---- fim do bloco da F5 ----
  })
);
