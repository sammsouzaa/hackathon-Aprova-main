import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTADOS_REUNIAO = new Set(['em_andamento', 'concluida', 'interrompida']);
const MODOS_ESCUTA = new Set(['gravacao_com_aviso', 'escuta_sem_guardar', 'modo_notas']);
const FALANTES = new Set(['implantadora', 'prefeitura', 'indefinido']);
const ATRIBUICOES = new Set(['canal', 'manual', 'indefinido']);
const CANAIS = new Set(['microfone', 'monitor']);
const MOTIVOS_ECO = new Set(['eco_sinal', 'eco_texto', null]);
const TIPOS_EVENTO = new Set([
  'reuniao_iniciada',
  'pausada',
  'retomada',
  'encerrada',
  'dispositivo_ausente',
  'erro_stt',
  'aviso'
]);

// ISO-8601 com timezone (ex.: 2026-10-24T14:02:11-03:00 ou 2026-10-24T17:02:11Z)
const REGEX_ISO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Valida um objeto de transcrição contra o esquema v1.
 * Retorna { valido: boolean, erros: string[] }.
 */
export function validarTranscricao(obj) {
  const erros = [];

  function erro(caminho, mensagem) {
    erros.push(`${caminho}: ${mensagem}`);
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valido: false, erros: ['raiz: objeto JSON esperado'] };
  }

  // 1. versaoEsquema
  if (obj.versaoEsquema !== 1) {
    erro('versaoEsquema', `deve ser 1 (recebido: ${obj.versaoEsquema})`);
  }

  // 2. reuniao
  const r = obj.reuniao;
  if (!r || typeof r !== 'object' || Array.isArray(r)) {
    erro('reuniao', 'objeto obrigatório ausente ou inválido');
  } else {
    if (typeof r.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(r.id)) {
      erro('reuniao.id', `deve ser string alfanumérica/hífen/underline (recebido: "${r.id}")`);
    }
    if (typeof r.processo !== 'string' || r.processo.trim() === '') {
      erro('reuniao.processo', 'deve ser string não vazia');
    }
    if (typeof r.iniciadaEm !== 'string' || !REGEX_ISO_TZ.test(r.iniciadaEm)) {
      erro('reuniao.iniciadaEm', `deve ser data ISO-8601 com fuso horário (recebido: "${r.iniciadaEm}")`);
    }
    if (r.encerradaEm !== null && (typeof r.encerradaEm !== 'string' || !REGEX_ISO_TZ.test(r.encerradaEm))) {
      erro('reuniao.encerradaEm', `deve ser null ou data ISO-8601 com fuso horário (recebido: "${r.encerradaEm}")`);
    }
    if (!ESTADOS_REUNIAO.has(r.estado)) {
      erro('reuniao.estado', `valor inválido "${r.estado}". Esperado: em_andamento | concluida | interrompida`);
    }
    if (!MODOS_ESCUTA.has(r.modoEscuta)) {
      erro('reuniao.modoEscuta', `valor inválido "${r.modoEscuta}"`);
    }
    if (typeof r.participantesAvisados !== 'boolean') {
      erro('reuniao.participantesAvisados', 'deve ser booleano');
    }
  }

  // 3. motor
  const m = obj.motor;
  if (!m || typeof m !== 'object' || Array.isArray(m)) {
    erro('motor', 'objeto obrigatório ausente');
  } else {
    if (typeof m.nome !== 'string') erro('motor.nome', 'deve ser string');
    if (typeof m.biblioteca !== 'string') erro('motor.biblioteca', 'deve ser string');
    if (typeof m.idioma !== 'string') erro('motor.idioma', 'deve ser string');
    if (m.threads !== null && (!Number.isInteger(m.threads) || m.threads <= 0)) {
      erro('motor.threads', `deve ser inteiro positivo ou null (recebido: ${m.threads})`);
    }
    if (m.rtfMedio !== null && (typeof m.rtfMedio !== 'number' || m.rtfMedio < 0)) {
      erro('motor.rtfMedio', `deve ser número positivo ou null (recebido: ${m.rtfMedio})`);
    }
  }

  // 4. falantes
  if (!Array.isArray(obj.falantes)) {
    erro('falantes', 'deve ser um array');
  } else {
    obj.falantes.forEach((f, idx) => {
      const p = `falantes[${idx}]`;
      if (!FALANTES.has(f?.id)) erro(`${p}.id`, `falante inválido: ${f?.id}`);
      if (typeof f?.rotulo !== 'string') erro(`${p}.rotulo`, 'deve ser string');
      if (!CANAIS.has(f?.canal)) erro(`${p}.canal`, `canal inválido: ${f?.canal}`);
      if (typeof f?.dispositivo !== 'string') erro(`${p}.dispositivo`, 'deve ser string');
    });
  }

  // 5. segmentos
  const idsVistos = new Set();
  const contagemFalantes = { implantadora: 0, prefeitura: 0, indefinido: 0 };
  let contagemEco = 0;

  if (!Array.isArray(obj.segmentos)) {
    erro('segmentos', 'deve ser um array');
  } else {
    let ultimoInicio = -Infinity;

    obj.segmentos.forEach((s, idx) => {
      const p = `segmentos[${idx}]`;
      if (!s || typeof s !== 'object') {
        erro(p, 'deve ser objeto');
        return;
      }

      // ID
      if (!Number.isInteger(s.id) || s.id <= 0) {
        erro(`${p}.id`, `deve ser inteiro positivo (recebido: ${s.id})`);
      } else {
        if (idsVistos.has(s.id)) {
          erro(`${p}.id`, `id duplicado: ${s.id}`);
        }
        idsVistos.add(s.id);
      }

      // Falante e contagem
      if (!FALANTES.has(s.falante)) {
        erro(`${p}.falante`, `valor inválido "${s.falante}"`);
      } else {
        contagemFalantes[s.falante]++;
      }

      if (!ATRIBUICOES.has(s.atribuicao)) erro(`${p}.atribuicao`, `valor inválido "${s.atribuicao}"`);
      if (!CANAIS.has(s.canal)) erro(`${p}.canal`, `canal inválido "${s.canal}"`);

      // Tempos e ordenação por inicioMs
      if (!Number.isInteger(s.inicioMs) || s.inicioMs < 0) {
        erro(`${p}.inicioMs`, `deve ser inteiro >= 0 (recebido: ${s.inicioMs})`);
      }
      if (!Number.isInteger(s.fimMs) || s.fimMs < s.inicioMs) {
        erro(`${p}.fimMs`, `deve ser inteiro >= inicioMs (recebido: ${s.fimMs})`);
      }

      // Checagem de ordenação estrita
      if (s.inicioMs < ultimoInicio) {
        erro(`${p}.inicioMs`, `segmentos devem estar ordenados por inicioMs (${s.inicioMs} < anterior ${ultimoInicio})`);
      }
      ultimoInicio = s.inicioMs;

      // Texto e Eco
      if (typeof s.texto !== 'string') erro(`${p}.texto`, 'deve ser string');
      if (typeof s.descartadoPorEco !== 'boolean') erro(`${p}.descartadoPorEco`, 'deve ser booleano');
      if (!MOTIVOS_ECO.has(s.motivoDescarte)) erro(`${p}.motivoDescarte`, `valor inválido "${s.motivoDescarte}"`);

      if (s.descartadoPorEco) {
        contagemEco++;
        if (s.motivoDescarte === null) {
          erro(`${p}.motivoDescarte`, 'deve ser "eco_sinal" ou "eco_texto" quando descartadoPorEco é true');
        }
        if (s.motivoDescarte === 'eco_sinal' && s.texto !== '') {
          erro(`${p}.texto`, 'segmento com eco_sinal deve ter texto vazio ""');
        }
      } else {
        if (s.motivoDescarte !== null) {
          erro(`${p}.motivoDescarte`, 'deve ser null quando descartadoPorEco é false');
        }
      }

      // Confiança e latência
      if (s.confianca !== null && (typeof s.confianca !== 'number' || s.confianca < 0 || s.confianca > 1)) {
        erro(`${p}.confianca`, `deve ser número entre 0 e 1 ou null (recebido: ${s.confianca})`);
      }
      if (s.latenciaMs !== null && (!Number.isInteger(s.latenciaMs) || s.latenciaMs < 0)) {
        erro(`${p}.latenciaMs`, `deve ser inteiro >= 0 ou null (recebido: ${s.latenciaMs})`);
      }
      if (typeof s.forcadoPorTamanho !== 'boolean') {
        erro(`${p}.forcadoPorTamanho`, 'deve ser booleano');
      }
    });
  }

  // 6. eventos
  if (!Array.isArray(obj.eventos)) {
    erro('eventos', 'deve ser um array');
  } else {
    obj.eventos.forEach((e, idx) => {
      const p = `eventos[${idx}]`;
      if (!Number.isInteger(e?.tMs) || e.tMs < 0) erro(`${p}.tMs`, `deve ser inteiro >= 0 (recebido: ${e?.tMs})`);
      if (!TIPOS_EVENTO.has(e?.tipo)) erro(`${p}.tipo`, `tipo inválido "${e?.tipo}"`);
      if (e?.detalhe !== undefined && typeof e?.detalhe !== 'string') erro(`${p}.detalhe`, 'deve ser string quando presente');
    });
  }

  // 7. estatisticas
  const est = obj.estatisticas;
  if (!est || typeof est !== 'object' || Array.isArray(est)) {
    erro('estatisticas', 'objeto obrigatório ausente');
  } else {
    if (est.segmentos !== (obj.segmentos?.length || 0)) {
      erro('estatisticas.segmentos', `valor ${est.segmentos} não bate com contagem real ${obj.segmentos?.length || 0}`);
    }
    if (est.descartadosPorEco !== contagemEco) {
      erro('estatisticas.descartadosPorEco', `valor ${est.descartadosPorEco} não bate com contagem real ${contagemEco}`);
    }
    if (!Number.isInteger(est.duracaoMs) || est.duracaoMs < 0) {
      erro('estatisticas.duracaoMs', 'deve ser inteiro >= 0');
    }
    if (est.latenciaMedianaMs !== null && (typeof est.latenciaMedianaMs !== 'number' || est.latenciaMedianaMs < 0)) {
      erro('estatisticas.latenciaMedianaMs', 'deve ser número >= 0 ou null');
    }
    if (!est.porFalante || typeof est.porFalante !== 'object') {
      erro('estatisticas.porFalante', 'objeto obrigatório ausente');
    } else {
      for (const falante of ['implantadora', 'prefeitura', 'indefinido']) {
        const esperado = contagemFalantes[falante];
        const informado = est.porFalante[falante];
        if (informado !== esperado) {
          erro(`estatisticas.porFalante.${falante}`, `valor ${informado} não bate com contagem real ${esperado}`);
        }
      }
    }
  }

  return {
    valido: erros.length === 0,
    erros
  };
}

// Execução como script CLI direto
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const arquivos = process.argv.slice(2);
  if (arquivos.length === 0) {
    console.error('Uso: node scripts/validar-transcricao.mjs <arquivo.json> [...]');
    process.exit(1);
  }

  let temFalhas = false;
  for (const arq of arquivos) {
    const caminho = path.resolve(arq);
    console.log(`\nValidando: ${caminho}`);
    if (!fs.existsSync(caminho)) {
      console.error(`  [ERRO] Arquivo não encontrado: ${caminho}`);
      temFalhas = true;
      continue;
    }

    try {
      const conteudo = fs.readFileSync(caminho, 'utf-8');
      const json = JSON.parse(conteudo);
      const resultado = validarTranscricao(json);
      if (resultado.valido) {
        console.log(`  [OK] Esquema JSON v1 válido (${json.segmentos?.length || 0} segmentos, duracao: ${json.estatisticas?.duracaoMs} ms)`);
      } else {
        temFalhas = true;
        console.error(`  [FALHA] ${resultado.erros.length} erro(s) de validação:`);
        resultado.erros.forEach((err) => console.error(`    - ${err}`));
      }
    } catch (err) {
      temFalhas = true;
      console.error(`  [ERRO JSON] Falha ao analisar JSON: ${err.message}`);
    }
  }

  process.exit(temFalhas ? 1 : 0);
}
