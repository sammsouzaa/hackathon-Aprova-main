/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MascotePrumoProps {
  size?: number;
  className?: string;
  estado?: 'atento' | 'alerta' | 'sucesso' | 'descanso';
  animar?: boolean;
}

/**
 * Mascote "Prumo" original em SVG inline:
 * Um simpático fio de prumo com cordão, corpo cônico alongado,
 * ponta de alinhamento e dois olhinhos atentos e expressivos.
 */
export const MascotePrumo: React.FC<MascotePrumoProps> = ({
  size = 32,
  className = '',
  estado = 'atento',
  animar = false
}) => {
  // Cores semânticas baseadas nos tokens
  const corPrincipal = estado === 'alerta' ? '#c2410c' : '#0891b2';
  const corSecundaria = estado === 'alerta' ? '#ea580c' : '#06929f';
  const corOlhos = '#1c1c1c';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${animar ? 'animate-bounce-subtle' : ''} ${className}`}
      style={{ width: size, height: size }}
      title="Prumo - Mascote de Reunião"
      role="img"
      aria-label="Mascote Prumo"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        {/* Cordão do Prumo no topo */}
        <line
          x1="32"
          y1="2"
          x2="32"
          y2="14"
          stroke="#0e7490"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={estado === 'descanso' ? '2 2' : 'none'}
        />

        {/* Argola / Cabeçote superior do prumo */}
        <rect
          x="26"
          y="13"
          width="12"
          height="6"
          rx="2.5"
          fill={corSecundaria}
        />
        <circle cx="32" cy="11" r="3" stroke="#0e7490" strokeWidth="2" fill="#e6f5f8" />

        {/* Corpo principal do Prumo (gota alongada com ponta inferior) */}
        <path
          d="M32 60C32 60 48 38 48 27C48 18.1634 40.8366 17 32 17C23.1634 17 16 18.1634 16 27C16 38 32 60 32 60Z"
          fill={corPrincipal}
        />

        {/* Brilho de volume / reflexo sutil */}
        <path
          d="M23 23C20 27 20 33 24 39"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />

        {/* Olhos expressivos */}
        {estado === 'alerta' ? (
          // Olhos arregalados e atentos para contradição
          <>
            <ellipse cx="27" cy="28" rx="3.5" ry="4.5" fill="#ffffff" />
            <ellipse cx="37" cy="28" rx="3.5" ry="4.5" fill="#ffffff" />
            <circle cx="27" cy="28" r="2.2" fill={corOlhos} />
            <circle cx="37" cy="28" r="2.2" fill={corOlhos} />
            {/* Brilhos nos olhos */}
            <circle cx="28" cy="26.5" r="0.8" fill="#ffffff" />
            <circle cx="38" cy="26.5" r="0.8" fill="#ffffff" />
            {/* Sobrancelhas franzidas */}
            <path d="M24 22L30 24" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M40 22L34 24" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : estado === 'sucesso' ? (
          // Olhos piscando felizes (arcos sorridentes)
          <>
            <path
              d="M24 28Q27 24 30 28"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M34 28Q37 24 40 28"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          // Olhos simpáticos normais
          <>
            <ellipse cx="27" cy="28" rx="3" ry="3.5" fill="#ffffff" />
            <ellipse cx="37" cy="28" rx="3" ry="3.5" fill="#ffffff" />
            <circle cx="27.5" cy="28" r="1.8" fill={corOlhos} />
            <circle cx="37.5" cy="28" r="1.8" fill={corOlhos} />
            <circle cx="28.2" cy="27" r="0.7" fill="#ffffff" />
            <circle cx="38.2" cy="27" r="0.7" fill="#ffffff" />
          </>
        )}

        {/* Sorriso sutil e acolhedor */}
        <path
          d={estado === 'alerta' ? 'M29 36Q32 34 35 36' : 'M29 35Q32 38 35 35'}
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.9"
        />

        {/* Ponteira metálica de alinhamento na base */}
        <polygon points="30,56 34,56 32,61" fill="#e6f5f8" />
      </svg>
    </div>
  );
};
