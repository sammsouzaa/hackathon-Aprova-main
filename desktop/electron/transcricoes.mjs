/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gravador de transcrições do processo principal do Prumo Desktop.
 * Módulo puro em Node.js (sem dependências de Electron nem do DOM).
 */
import fs from 'node:fs';
import path from 'node:path';

const LIMITE_MAX_SEGMENTOS = 20000;
const LIMITE_MAX_TEXTO = 5000;

function calcularMediana(valores) {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) {
    return ordenados[meio];
  }
  return Math.round((ordenados[meio - 1] + ordenados[meio]) / 2);
}

function formatarDataIsoComFuso(data) {
  const pad = (n) => String(n).padStart(2, '0');
  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());
  const hora = pad(data.getHours());
  const min = pad(data.getMinutes());
  const seg = pad(data.getSeconds());

  const offsetMin = -data.getTimezoneOffset();
  const sinal = offsetMin >= 0 ? '+' : '-';
  const offsetHoras = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offsetRestoMin = pad(Math.abs(offsetMin) % 60);

  return `${ano}-${mes}-${dia}T${hora}:${min}:${seg}${sinal}${offsetHoras}:${offsetRestoMin}`;
}

function formatarPrefixoNomeArquivo(data) {
  const pad = (n) => String(n).padStart(2, '0');
  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());
  const hora = pad(data.getHours());
  const min = pad(data.getMinutes());
  const seg = pad(data.getSeconds());
  return `${ano}-${mes}-${dia}T${hora}-${min}-${seg}`;
}

export function criarGravador({
  diretorioDados,
  agora = () => new Date(),
  escreverSincrono = false
}) {
  if (!diretorioDados) {
    throw new Error('diretorioDados é obrigatório');
  }

  fs.mkdirSync(diretorioDados, { recursive: true });

  let sessaoAtiva = null;

  function recalcularEstatisticas(dados) {
    const segmentos = dados.segmentos;
    let descartadosPorEco = 0;
    const porFalante = { implantadora: 0, prefeitura: 0, indefinido: 0 };
    const latencias = [];
    let maiorFim = 0;

    for (const seg of segmentos) {
      if (seg.descartadoPorEco) descartadosPorEco++;
      if (porFalante[seg.falante] !== undefined) {
        porFalante[seg.falante]++;
      } else {
        porFalante.indefinido++;
      }
      if (typeof seg.latenciaMs === 'number' && seg.latenciaMs >= 0) {
        latencias.push(seg.latenciaMs);
      }
      if (seg.fimMs > maiorFim) maiorFim = seg.fimMs;
    }

    let maiorEvento = 0;
    for (const ev of dados.eventos) {
      if (ev.tMs > maiorEvento) maiorEvento = ev.tMs;
    }

    dados.estatisticas = {
      segmentos: segmentos.length,
      descartadosPorEco,
      duracaoMs: Math.max(maiorFim, maiorEvento, 0),
      porFalante,
      latenciaMedianaMs: calcularMediana(latencias)
    };
  }

  function gravarAtomicamente(caminhoArquivo, dados) {
    const caminhoTmp = `${caminhoArquivo}.tmp`;
    const jsonStr = JSON.stringify(dados, null, 2);
    fs.writeFileSync(caminhoTmp, jsonStr, 'utf-8');
    fs.renameSync(caminhoTmp, caminhoArquivo);
  }

  function agendarGravacao() {
    if (!sessaoAtiva || sessaoAtiva.semGuardar) return;

    sessaoAtiva.dirty = true;
    if (escreverSincrono) {
      flushSincrono();
      return;
    }

    if (!sessaoAtiva.timerDebounce) {
      sessaoAtiva.timerDebounce = setTimeout(() => {
        if (sessaoAtiva && sessaoAtiva.dirty) {
          recalcularEstatisticas(sessaoAtiva.dados);
          gravarAtomicamente(sessaoAtiva.caminhoArquivo, sessaoAtiva.dados);
          sessaoAtiva.dirty = false;
        }
        if (sessaoAtiva) sessaoAtiva.timerDebounce = null;
      }, 500);
    }
  }

  function flushSincrono() {
    if (sessaoAtiva && !sessaoAtiva.semGuardar && sessaoAtiva.caminhoArquivo) {
      if (sessaoAtiva.timerDebounce) {
        clearTimeout(sessaoAtiva.timerDebounce);
        sessaoAtiva.timerDebounce = null;
      }
      recalcularEstatisticas(sessaoAtiva.dados);
      gravarAtomicamente(sessaoAtiva.caminhoArquivo, sessaoAtiva.dados);
      sessaoAtiva.dirty = false;
    }
  }

  function iniciar(meta) {
    if (!meta || typeof meta !== 'object') {
      throw new Error('Metadados da reunião inválidos');
    }

    if (!meta.id || typeof meta.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(meta.id)) {
      throw new Error(`ID da reunião inválido: "${meta.id}". Use apenas letras, números, hífen e underline.`);
    }

    if (!meta.processo || typeof meta.processo !== 'string') {
      throw new Error('Nome do processo é obrigatório');
    }

    if (meta.modoEscuta === 'modo_notas') {
      throw new Error("Modo de escuta 'modo_notas' não permite gravação de transcrição");
    }

    if (!meta.participantesAvisados) {
      throw new Error('Gravação não autorizada: os participantes devem ser avisados antes de iniciar');
    }

    if (meta.modoEscuta !== 'gravacao_com_aviso' && meta.modoEscuta !== 'escuta_sem_guardar') {
      throw new Error(`Modo de escuta desconhecido: "${meta.modoEscuta}"`);
    }

    // Se houver sessão aberta anterior, encerrá-la como 'interrompida'
    if (sessaoAtiva) {
      finalizar({ estado: 'interrompida' });
    }

    const dataAgora = agora();
    const iniciadaEmIso = meta.iniciadaEm || formatarDataIsoComFuso(dataAgora);

    // Modo escuta_sem_guardar: não grava nada no disco
    if (meta.modoEscuta === 'escuta_sem_guardar') {
      sessaoAtiva = {
        semGuardar: true,
        caminhoArquivo: null,
        idArquivo: null,
        dados: {
          versaoEsquema: 1,
          reuniao: {
            id: meta.id,
            processo: meta.processo,
            iniciadaEm: iniciadaEmIso,
            encerradaEm: null,
            estado: 'em_andamento',
            modoEscuta: 'escuta_sem_guardar',
            participantesAvisados: true
          },
          motor: {
            nome: meta.motor?.nome || 'whisper-base-q8',
            biblioteca: meta.motor?.biblioteca || '@huggingface/transformers + onnxruntime-node',
            idioma: meta.motor?.idioma || 'pt',
            threads: meta.motor?.threads ?? null,
            rtfMedio: meta.motor?.rtfMedio ?? null
          },
          falantes: meta.falantes || [],
          segmentos: [],
          eventos: [{ tMs: 0, tipo: 'reuniao_iniciada', detalhe: 'Modo escuta sem guardar' }],
          estatisticas: {
            segmentos: 0,
            descartadosPorEco: 0,
            duracaoMs: 0,
            porFalante: { implantadora: 0, prefeitura: 0, indefinido: 0 },
            latenciaMedianaMs: null
          }
        },
        timerDebounce: null,
        dirty: false
      };
      return { caminho: null, idArquivo: null };
    }

    // Gerar nome de arquivo único
    const prefixo = formatarPrefixoNomeArquivo(dataAgora);
    let nomeArquivo = `${prefixo}_${meta.id}.json`;
    let caminhoArquivo = path.join(diretorioDados, nomeArquivo);
    let contador = 2;
    while (fs.existsSync(caminhoArquivo)) {
      nomeArquivo = `${prefixo}_${meta.id}-${contador++}.json`;
      caminhoArquivo = path.join(diretorioDados, nomeArquivo);
    }

    const dados = {
      versaoEsquema: 1,
      reuniao: {
        id: meta.id,
        processo: meta.processo,
        iniciadaEm: iniciadaEmIso,
        encerradaEm: null,
        estado: 'em_andamento',
        modoEscuta: 'gravacao_com_aviso',
        participantesAvisados: true
      },
      motor: {
        nome: meta.motor?.nome || 'whisper-base-q8',
        biblioteca: meta.motor?.biblioteca || '@huggingface/transformers + onnxruntime-node',
        idioma: meta.motor?.idioma || 'pt',
        threads: meta.motor?.threads ?? null,
        rtfMedio: meta.motor?.rtfMedio ?? null
      },
      falantes: meta.falantes || [
        { id: 'implantadora', rotulo: 'Implantadora', canal: 'microfone', dispositivo: 'Microfone' },
        { id: 'prefeitura', rotulo: 'Prefeitura', canal: 'monitor', dispositivo: 'Monitor' }
      ],
      segmentos: [],
      eventos: [
        { tMs: 0, tipo: 'reuniao_iniciada', detalhe: 'Reunião iniciada' }
      ],
      estatisticas: {
        segmentos: 0,
        descartadosPorEco: 0,
        duracaoMs: 0,
        porFalante: { implantadora: 0, prefeitura: 0, indefinido: 0 },
        latenciaMedianaMs: null
      }
    };

    sessaoAtiva = {
      semGuardar: false,
      caminhoArquivo,
      idArquivo: nomeArquivo,
      dados,
      timerDebounce: null,
      dirty: true
    };

    // Primeira escrita atômica imediata
    flushSincrono();

    return {
      caminho: caminhoArquivo,
      idArquivo: nomeArquivo
    };
  }

  function anexar(segmento) {
    if (!sessaoAtiva) {
      throw new Error('Nenhuma sessão de transcrição ativa');
    }
    if (sessaoAtiva.semGuardar) {
      return false;
    }

    if (!segmento || typeof segmento !== 'object') {
      throw new Error('Segmento inválido');
    }

    if (sessaoAtiva.dados.segmentos.length >= LIMITE_MAX_SEGMENTOS) {
      throw new Error(`Limite máximo de segmentos excedido (${LIMITE_MAX_SEGMENTOS})`);
    }

    if (typeof segmento.texto === 'string' && segmento.texto.length > LIMITE_MAX_TEXTO) {
      throw new Error(`Texto do segmento excede o limite máximo de ${LIMITE_MAX_TEXTO} caracteres`);
    }

    if (!Number.isInteger(segmento.inicioMs) || !Number.isInteger(segmento.fimMs)) {
      throw new Error('inicioMs e fimMs do segmento devem ser números inteiros');
    }

    const segClonado = {
      id: Number(segmento.id),
      falante: segmento.falante || 'indefinido',
      atribuicao: segmento.atribuicao || 'indefinido',
      canal: segmento.canal === 'monitor' ? 'monitor' : 'microfone',
      inicioMs: Math.round(segmento.inicioMs),
      fimMs: Math.round(segmento.fimMs),
      texto: String(segmento.texto || ''),
      confianca: typeof segmento.confianca === 'number' ? segmento.confianca : null,
      descartadoPorEco: Boolean(segmento.descartadoPorEco),
      motivoDescarte: segmento.motivoDescarte ?? null,
      latenciaMs: typeof segmento.latenciaMs === 'number' ? Math.round(segmento.latenciaMs) : null,
      forcadoPorTamanho: Boolean(segmento.forcadoPorTamanho)
    };

    // Inserção ordenada estritamente por inicioMs
    const lista = sessaoAtiva.dados.segmentos;
    let idx = lista.length;
    while (idx > 0 && lista[idx - 1].inicioMs > segClonado.inicioMs) {
      idx--;
    }
    lista.splice(idx, 0, segClonado);

    agendarGravacao();
    return true;
  }

  function evento(ev) {
    if (!sessaoAtiva) {
      throw new Error('Nenhuma sessão de transcrição ativa');
    }
    if (sessaoAtiva.semGuardar) {
      return false;
    }

    if (!ev || typeof ev !== 'object') {
      throw new Error('Evento inválido');
    }

    const evClonado = {
      tMs: Number.isInteger(ev.tMs) ? ev.tMs : 0,
      tipo: ev.tipo || 'aviso'
    };
    if (ev.detalhe !== undefined) {
      evClonado.detalhe = String(ev.detalhe);
    }

    sessaoAtiva.dados.eventos.push(evClonado);
    agendarGravacao();
    return true;
  }

  function finalizar(resumo = {}) {
    if (!sessaoAtiva) return null;

    if (sessaoAtiva.semGuardar) {
      const retorno = { ...sessaoAtiva.dados, reuniao: { ...sessaoAtiva.dados.reuniao, estado: 'concluida' } };
      sessaoAtiva = null;
      return retorno;
    }

    if (sessaoAtiva.timerDebounce) {
      clearTimeout(sessaoAtiva.timerDebounce);
      sessaoAtiva.timerDebounce = null;
    }

    const dataAgora = agora();
    const encerradaEmIso = resumo.encerradaEm || formatarDataIsoComFuso(dataAgora);
    const estadoFinal = resumo.estado || 'concluida';

    sessaoAtiva.dados.reuniao.encerradaEm = encerradaEmIso;
    sessaoAtiva.dados.reuniao.estado = estadoFinal;

    if (typeof resumo.rtfMedio === 'number') {
      sessaoAtiva.dados.motor.rtfMedio = Number(resumo.rtfMedio.toFixed(3));
    }

    // Adicionar evento de encerramento se ainda não existir
    const tMsFinal = sessaoAtiva.dados.estatisticas.duracaoMs;
    sessaoAtiva.dados.eventos.push({
      tMs: tMsFinal,
      tipo: 'encerrada',
      detalhe: `Reunião finalizada com estado ${estadoFinal}`
    });

    recalcularEstatisticas(sessaoAtiva.dados);
    gravarAtomicamente(sessaoAtiva.caminhoArquivo, sessaoAtiva.dados);

    const copiaFinal = JSON.parse(JSON.stringify(sessaoAtiva.dados));
    sessaoAtiva = null;
    return copiaFinal;
  }

  function estadoAtual() {
    if (!sessaoAtiva) return null;
    return JSON.parse(JSON.stringify(sessaoAtiva.dados));
  }

  function listar() {
    try {
      const arquivos = fs.readdirSync(diretorioDados);
      const jsonFiles = arquivos.filter(
        (f) => f.endsWith('.json') && !f.endsWith('.tmp')
      );

      const lista = [];
      for (const f of jsonFiles) {
        const caminhoCompleto = path.join(diretorioDados, f);
        try {
          const stats = fs.statSync(caminhoCompleto);
          lista.push({
            nomeArquivo: f,
            caminhoCompleto,
            tamanhoBytes: stats.size,
            modificadoEm: stats.mtime
          });
        } catch {}
      }

      // Ordenar mais recente primeiro
      lista.sort((a, b) => b.modificadoEm.getTime() - a.modificadoEm.getTime());
      return lista;
    } catch (err) {
      console.warn('[prumo:gravador] Erro ao listar transcrições:', err.message);
      return [];
    }
  }

  function recuperarOrfas() {
    const recuperados = [];
    try {
      const arquivos = fs.readdirSync(diretorioDados);
      for (const f of arquivos) {
        if (!f.endsWith('.json') || f.endsWith('.tmp')) continue;
        const caminho = path.join(diretorioDados, f);
        try {
          const conteudo = fs.readFileSync(caminho, 'utf-8');
          const dados = JSON.parse(conteudo);
          if (dados && dados.reuniao && dados.reuniao.estado === 'em_andamento') {
            console.log(`[prumo:gravador] Sessão órfã encontrada: ${f}. Marcando como 'interrompida'...`);
            dados.reuniao.estado = 'interrompida';
            if (!dados.reuniao.encerradaEm) {
              dados.reuniao.encerradaEm = formatarDataIsoComFuso(agora());
            }
            gravarAtomicamente(caminho, dados);
            recuperados.push(f);
          }
        } catch {}
      }
    } catch {}
    return recuperados;
  }

  return {
    iniciar,
    anexar,
    evento,
    finalizar,
    estadoAtual,
    flushSincrono,
    listar,
    recuperarOrfas
  };
}
