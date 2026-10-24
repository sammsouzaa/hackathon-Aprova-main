/**
 * API do Prumo simulada (só para testes): implementa as rotas que o app usa, com respostas fixas.
 * Uso: node scripts/teste/api-simulada.mjs [porta]   (padrão 38123)
 */
import http from 'node:http';

const ITENS = Array.from({ length: 14 }, (_, i) => ({
  id: `item${i + 1}`,
  codigo: `CHK-${String(i + 1).padStart(2, '0')}`,
  titulo: `Item de teste ${i + 1}`,
  pergunta: `Pergunta do item ${i + 1}?`,
  valor_referencia: `${i + 1},00 m`
}));

export function iniciarApiSimulada(porta = 38123) {
  const sessoes = new Map();
  const log = [];
  const servidor = http.createServer((req, res) => {
    const partes = [];
    req.on('data', (c) => partes.push(c));
    req.on('end', () => {
      const corpo = Buffer.concat(partes);
      const url = new URL(req.url, 'http://x');
      log.push(`${req.method} ${url.pathname}`);
      const json = (dados, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(dados));
      };
      const rota = url.pathname.split('/').filter(Boolean);
      if (req.method === 'GET' && url.pathname === '/contextos') {
        return json([{ id: 'meulab-ifpr-cascavel', nome: 'MeuLab · IFPR Cascavel', tem_contexto: true, itens_checklist: ITENS.length }]);
      }
      if (req.method === 'GET' && url.pathname === '/contextos/meulab-ifpr-cascavel') {
        return json({
          id: 'meulab-ifpr-cascavel',
          nome: 'MeuLab · IFPR Cascavel',
          tem_contexto: true,
          perguntas_rapidas: ['Qual a antecedência mínima da reserva?', 'Quem aprova a prática?'],
          checklist: ITENS.map((item, i) => ({ ...item, confirmado_no_contexto: i < 4, resposta_contexto: i < 4 ? item.valor_referencia : null }))
        });
      }
      if (req.method === 'POST' && url.pathname === '/sessoes') {
        const dados = JSON.parse(corpo.toString() || '{}');
        sessoes.set(dados.id, { trechos: 0, estado: 'preparando', modo: dados.modo, finalizada: false });
        return json({ id: dados.id, estado: 'preparando' });
      }
      const sessao = sessoes.get(rota[1]);
      if (rota[0] === 'sessoes' && !sessao) return json({ detail: 'sessão inexistente' }, 404);
      if (rota[2] === 'iniciar') {
        sessao.estado = 'ouvindo';
        return json({ estado: 'ouvindo' });
      }
      if (rota[2] === 'audio') {
        sessao.trechos += 1;
        const seq = /name="seq"\r\n\r\n(\d+)/.exec(corpo.toString('latin1'))?.[1] ?? sessao.trechos;
        return json({ seq: Number(seq), hora: '14:00:00', status: 'ok', texto: `Trecho ${seq}: o recuo frontal ficou em 5 metros.` });
      }
      if (rota[2] === 'copiloto' || rota[2] === 'analisar') {
        const respondidas = Math.min(ITENS.length, 3 + sessao.trechos);
        return json({
          estado: sessao.finalizada ? 'finalizada' : sessao.estado,
          perguntas_rapidas: ['Qual a antecedência mínima da reserva?', 'Quem aprova a prática?', 'Qual o prazo?'],
          sugestao_pergunta_imediata: sessao.trechos > 0 ? 'A vistoria vale para todo projeto acima de 500 m²?' : null,
          checklist: ITENS.map((item, i) => ({
            ...item,
            status: i < respondidas ? 'respondida' : 'pendente',
            resposta: i < respondidas ? `${i + 1},00 m` : null,
            fonte: i < 3 ? 'contexto' : i < respondidas ? 'conversa' : null,
            diverge: i === 3 && respondidas > 3
          })),
          progresso: { respondida: respondidas, total: ITENS.length, percentual: 0 },
          anotacoes: { ia: sessao.trechos > 1 ? ['Diverge do contexto: recuo frontal é 5 m.'] : [] }
        });
      }
      if (rota[2] === 'perguntar') return json({ hora: '14:00:00', pergunta: '?', resposta: 'O recuo frontal mínimo é de 5 metros.' });
      if (rota[2] === 'finalizar') {
        sessao.finalizada = true;
        return json({ ata: true });
      }
      if (rota[2] === 'checklist') return json({ ok: true });
      return json({ detail: 'rota desconhecida' }, 404);
    });
  });
  return new Promise((resolver) => servidor.listen(porta, '127.0.0.1', () => resolver({ servidor, sessoes, log, porta })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { porta } = await iniciarApiSimulada(Number(process.argv[2]) || 38123);
  console.log(`API simulada em http://127.0.0.1:${porta}`);
}
