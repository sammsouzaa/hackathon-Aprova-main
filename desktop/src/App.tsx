/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReuniaoProvider } from './context/ReuniaoContext';
import { AoVivoProvider } from './context/AoVivoContext';
import { PainelPrumo } from './components/PainelPrumo';
import { PreviewDesktop } from './components/PreviewDesktop';

// No programa desktop (Electron) o preload expõe `window.prumoDesktop`: a janela do sistema
// já é o Prumo, então só o painel é renderizado. No navegador, o preview simula o desktop.
const emDesktop = typeof window !== 'undefined' && window.prumoDesktop !== undefined;

export default function App() {
  return (
    <ReuniaoProvider>
      <AoVivoProvider>
        {emDesktop ? (
          <div className="w-screen h-screen overflow-hidden">
            <PainelPrumo />
          </div>
        ) : (
          <PreviewDesktop />
        )}
      </AoVivoProvider>
    </ReuniaoProvider>
  );
}
