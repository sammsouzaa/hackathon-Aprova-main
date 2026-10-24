/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** A transcrição ao vivo precisa do motor, do gravador e do áudio do programa desktop. */
export function aoVivoDisponivel(): boolean {
  if (typeof window === 'undefined') return false;
  const api = window.prumoDesktop;
  return Boolean(api?.stt && api.transcricao && api.audio);
}
