/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ItemChecklist } from '../../types/index';
import type { ItemChecklistApi } from '../api/cliente.ts';

/** Itens do copiloto da API → itens da tela do Prumo. */
export function mapearChecklist(itens: ItemChecklistApi[]): ItemChecklist[] {
  return itens.map((i) => {
    const respondida = i.status === 'respondida';
    const status: ItemChecklist['status'] = !respondida
      ? 'pendente'
      : i.fonte === 'contexto'
        ? 'confirmado_contexto'
        : i.diverge
          ? 'regra_local'
          : 'respondido';
    return {
      id: i.codigo,
      titulo: i.titulo,
      descricao: i.pergunta ?? i.categoria ?? '',
      valorModelo: i.valor_referencia ?? '—',
      status,
      valorRespondido: i.resposta ?? undefined,
      evidencia: i.trecho ? `"${i.trecho}"${i.hora ? ` (${i.hora})` : ''}` : undefined,
      regraLocal: Boolean(i.diverge)
    };
  });
}
