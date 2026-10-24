/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Monta o controlador da transcrição ao vivo com as peças reais (captura F2, motor F4, sessão F5).
 * Só existe no programa desktop: no navegador/preview não há motor nem gravador, e a interface cai
 * no roteiro simulado.
 */
import { servicoCaptura } from '../audio/captura.ts';
import { criarMotorSTT } from '../stt/index.ts';
import { MotorSTTHibrido } from '../stt/motor-hibrido.ts';
import { criarServicoAnalise } from './analise.ts';
import { PersistenciaDesktop, PersistenciaNula } from '../transcricao/persistencia.ts';
import { SessaoDeTranscricao } from '../transcricao/sessao.ts';
import { ControladorAoVivo } from './controlador.ts';
import { criarFonteDeCaptura } from './fonte-captura.ts';

export { aoVivoDisponivel } from './disponibilidade.ts';


/** Tamanho máximo de cada trecho enviado à API (a API recomenda de 4 a 12 s). */
export const DURACAO_MAXIMA_TRECHO_API_MS = 5000;

export function criarControladorAoVivo(): ControladorAoVivo {
  // Transcreve pela API do Prumo; sem API, cai no Whisper local (e a interface avisa).
  const motor = new MotorSTTHibrido(criarMotorSTT());
  return new ControladorAoVivo({
    motor,
    fonte: criarFonteDeCaptura(servicoCaptura),
    analise: criarServicoAnalise(motor),
    criarSessao: (modoEscuta) =>
      new SessaoDeTranscricao({
        fonteDeBlocos: servicoCaptura,
        motor,
        // Com a API, trechos de até 5 s (corte no ponto mais silencioso): a resposta volta mais cedo.
        configVad: motor.modo === 'api' ? { duracaoMaximaMs: DURACAO_MAXIMA_TRECHO_API_MS } : undefined,
        // "Escuta sem guardar": nada vai para o disco, nem arquivo temporário.
        persistencia: modoEscuta === 'escuta_sem_guardar' ? new PersistenciaNula() : new PersistenciaDesktop()
      })
  });
}
