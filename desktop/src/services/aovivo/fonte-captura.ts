/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adaptador da captura de áudio (F2) para o contrato `FonteDeAudio` do controlador da F6.
 */
import type { servicoCaptura } from '../audio/captura.ts';
import type { FonteDeAudio } from './tipos.ts';

export function criarFonteDeCaptura(servico: typeof servicoCaptura): FonteDeAudio {
  return {
    onBloco: (fn) => servico.onBloco(fn),
    onEstado: (fn) =>
      servico.onEstado((estado) =>
        fn({
          ativo: estado.ativo,
          modoUmCanal: estado.modoUmCanal,
          microfone: estado.microfoneLabel,
          monitor: estado.monitorLabel
        })
      ),
    async iniciar() {
      await servico.iniciarCaptura(Date.now());
      const estado = servico.obterEstado();
      return { modoUmCanal: estado.modoUmCanal, microfone: estado.microfoneLabel, monitor: estado.monitorLabel };
    },
    parar: () => servico.pararCaptura(),
    pausar: () => servico.pausarCaptura(),
    retomar: () => servico.retomarCaptura(),
    tempoContextoMs: () => servico.tempoContextoMs()
  };
}
