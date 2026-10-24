/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { MotorSTTDesktop } from './motor-desktop.ts';
import { MotorSTTSimulado } from './motor-simulado.ts';
import type { MotorSTT } from './tipos.ts';

export type * from './tipos.ts';
export { MotorSTTSimulado } from './motor-simulado.ts';
export { MotorSTTDesktop } from './motor-desktop.ts';

/** Motor real no programa desktop; fora dele (navegador, preview) o simulado, sempre rotulado como tal. */
export function criarMotorSTT(): MotorSTT {
  const emDesktop = typeof window !== 'undefined' && window.prumoDesktop?.stt !== undefined;
  return emDesktop ? new MotorSTTDesktop() : new MotorSTTSimulado();
}
