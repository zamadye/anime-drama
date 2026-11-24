import React from 'react';
import type { HandShape, ViewAngle } from '../../contracts';
import { ARGA_PALETTE } from './argaTokens';

export interface ArgaHandProps {
  shape: HandShape;
  side: 'left' | 'right';
  view?: ViewAngle;
  palmTowardViewer?: boolean;
}

/**
 * Authored cel-shaded vector hand for Arga.
 * Origin (0, 0) sits at the wrist joint center; +Y extends toward fingertips.
 * Right-hand geometry faces inward thumb on +X by default and mirrors chirality cleanly per side/view.
 */
export const ArgaHand: React.FC<ArgaHandProps> = ({
  shape,
  side,
  view = 'front',
  palmTowardViewer = false,
}) => {
  const s = ARGA_PALETTE.skin;
  // Determine visual thumb orientation without inverting lighting globally.
  const thumbRight =
    view === 'profile-right'
      ? true
      : view === 'profile-left'
        ? false
        : side === 'right'
          ? !palmTowardViewer
          : palmTowardViewer;
  const dir = thumbRight ? 1 : -1;

  return (
    <g transform={`scale(${dir}, 1)`}>
      {shape === 'relaxed' && (
        <g>
          {/* Wrist neck + tapered back of hand */}
          <path
            d="M -6.5 0 L 7.5 0 C 9.2 7 10.5 14 9.5 24 C 9 32 7.5 41 4.2 47 C 1.8 49 -1.5 48 -3.4 43 C -4.6 38 -5.2 28 -6 19 C -7.2 13 -7.5 6 -6.5 0 Z"
            fill={s.base}
            stroke={s.ink}
            strokeWidth={1.45}
            strokeLinejoin="round"
          />
          {/* Cel shadow along inner finger curve and outer edge */}
          <path
            d="M 1.5 2 C 6.2 9 7.5 21 5.6 35 C 4.6 41 2.8 45 0.5 45 C 3.4 39 4.4 25 2.5 14 C 1.2 8 0.2 4 1.5 2 Z"
            fill={s.shadow}
          />
          {/* Thumb + relaxed curled index separator */}
          <path
            d="M 6.5 9 C 11 14 12.2 22 9.5 28 C 8.1 30.5 6.4 29 5.5 25"
            fill={s.base}
            stroke={s.ink}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M -1.5 27 C -1.2 35 -0.4 41 0.8 45 M 2.5 28 C 3 34 3.4 39 3.6 43"
            fill="none"
            stroke={s.ink}
            strokeWidth={0.95}
            strokeLinecap="round"
          />
        </g>
      )}

      {shape === 'open' && (
        <g>
          {/* Expressive open dialogue hand: thumb extended, splayed fingers */}
          <path
            d="M -6.5 0 L 7 0 C 8.5 7 12.5 11 16.5 16.5 C 18.2 18.8 17.5 21.5 15 21.8 C 12.2 22 9.5 19.5 8 18 L 7.8 25 L 11.2 43.5 C 11.5 46 9 47.5 7.4 45.2 L 4.2 30.5 L 3.8 49 C 3.6 51.5 0.8 51.8 0.3 49 L -0.4 31 L -2.6 48 C -3.2 50.2 -5.8 49.5 -5.6 46.8 L -4.4 30 L -8.2 43 C -9.1 45 -11.4 44 -10.8 41.4 L -7.6 21 C -8 12 -7.5 6 -6.5 0 Z"
            fill={s.base}
            stroke={s.ink}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Palm plane cel shadow */}
          <path
            d="M -5.8 4 C -3.2 11 -1.5 20 -2.5 28 C 0.5 29 4.5 28 7 23 C 5.8 14 4.8 7 4.2 2 Z"
            fill={s.shadow}
            opacity={0.72}
          />
          {/* Subtle palm creases */}
          <path
            d="M -4 18 C -0.5 20 3.2 19 6 16 M -2 23 C 1.2 24.5 4.2 24 6.5 22"
            fill="none"
            stroke={s.deep}
            strokeWidth={0.95}
            strokeLinecap="round"
          />
        </g>
      )}

      {shape === 'fist' && (
        <g>
          {/* Clenched fist with angular knuckles and wrapped thumb */}
          <path
            d="M -7 0 L 7.5 0 C 9.8 6 11.4 13 10.6 21 C 10.1 26.5 7.5 29 3 29.5 L -5.8 29 C -9 28.4 -10.6 24.5 -10 18.5 C -9.6 11.5 -8.5 5 -7 0 Z"
            fill={s.base}
            stroke={s.ink}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {/* Curled finger shadow pocket */}
          <path
            d="M -7.5 16 C -4 14.5 3.5 15 8.5 17 C 9.2 22.5 7.5 27.5 2.5 28 L -5 27.8 C -7.8 27 -8.8 22 -7.5 16 Z"
            fill={s.shadow}
          />
          {/* Wrapped thumb across fingers */}
          <path
            d="M 6.8 8 C 11 10.5 11.5 16.5 8 19.2 L -1.5 19.8 C -3.8 19.8 -4.5 16.5 -2.2 15.2 L 5 14"
            fill={s.highlight}
            stroke={s.ink}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Finger fold ticks */}
          <path
            d="M -5.8 19.5 L -5.2 27.2 M -1.6 19.8 L -1.2 27.5 M 2.8 19.5 L 2.8 27"
            fill="none"
            stroke={s.ink}
            strokeWidth={1.05}
            strokeLinecap="round"
          />
        </g>
      )}

      {shape === 'point' && (
        <g>
          {/* Extended index finger + tucked middle/ring/pinky + thumb */}
          <path
            d="M -6.5 0 L 7 0 C 9 7 10.5 14 9.5 22 C 9.2 24.5 7.2 26.5 4.8 27 L 4.5 51.5 C 4.5 54 1.2 54.2 0.8 51.4 L -0.8 27.5 L -6.8 26.5 C -9.2 25.5 -9.8 20 -8.8 14 C -8 8 -7.2 3.5 -6.5 0 Z"
            fill={s.base}
            stroke={s.ink}
            strokeWidth={1.45}
            strokeLinejoin="round"
          />
          {/* Shadow under curled fingers */}
          <path
            d="M -7.5 15 C -5 14.5 -1 15 0.4 17.5 L 0 26.2 L -6.4 25.4 C -8.2 24 -8.6 19 -7.5 15 Z"
            fill={s.shadow}
          />
          {/* Wrapped thumb */}
          <path
            d="M 6.8 9 C 10.2 11.5 10.5 17 7.2 19.5 L 0.5 19.8 C -1.5 19.8 -2 17 -0.2 15.6 L 5 14.5"
            fill={s.highlight}
            stroke={s.ink}
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M -4.2 18 L -4 25.5 M -7 18 L -6.8 24.8"
            fill="none"
            stroke={s.ink}
            strokeWidth={0.95}
            strokeLinecap="round"
          />
        </g>
      )}

      {shape === 'grip' && (
        <g>
          {/* Curved C-grip for coat lapel, bag handle, or rail */}
          <path
            d="M -6.5 0 L 7.5 0 C 10.8 6 12.2 14 10.2 21.5 C 8.5 27.5 2.5 31 -3.5 30 C -8.2 29.2 -10.5 24.5 -9.5 19 C -8.4 13 -7.5 6 -6.5 0 Z"
            fill={s.base}
            stroke={s.ink}
            strokeWidth={1.45}
            strokeLinejoin="round"
          />
          {/* Inner curved finger cup shadow */}
          <path
            d="M -7 16 C -2.5 15.5 3.5 16.5 6.8 19.5 C 5.5 25.5 1 29.2 -3.8 28.5 C -7.5 27.8 -8.6 22 -7 16 Z"
            fill={s.shadow}
          />
          {/* Opposed thumb pad framing grip hollow */}
          <path
            d="M 7.5 8 C 12.5 11.5 12.5 19 8.2 22.8 C 5.8 24.5 3.5 22.5 4.2 19.5 L 6.5 15"
            fill={s.highlight}
            stroke={s.ink}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M -5 19 L -4.5 28 M -1.2 19.5 L -1 28.5 M 2.5 20 L 2.2 28"
            fill="none"
            stroke={s.ink}
            strokeWidth={1.0}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};
