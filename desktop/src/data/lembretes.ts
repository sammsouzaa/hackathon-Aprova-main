/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DadosMensagemLembrete } from '../types';

export const LEMBRETES_SIMULADOS: DadosMensagemLembrete[] = [
  {
    dataSimulada: '28/10/2026 09:15',
    texto: 'Lembrete automático enviado à Helena: planta de zoneamento (vence amanhã), com link do ticket.',
    tipo: 'envio',
    ticketId: 'TCK-8841',
    compromissoId: 'CMP-01'
  },
  {
    dataSimulada: '28/10/2026 09:15',
    texto: 'Lembrete automático enviado: confirmação do prazo de análise (vence em 2 dias).',
    tipo: 'envio',
    ticketId: 'TCK-8842',
    compromissoId: 'CMP-02'
  },
  {
    dataSimulada: '29/10/2026 11:40',
    texto: 'Helena respondeu no ticket: "planta_zoneamento_v2.pdf" recebido com sucesso. Compromisso fechado sem nova reunião ✔',
    tipo: 'resposta',
    ticketId: 'TCK-8841',
    compromissoId: 'CMP-01',
    concluido: true
  }
];
