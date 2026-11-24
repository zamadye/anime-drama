import React from 'react';
import { r1 } from '../../../engine/math';
import type { ViewAngle } from '../../contracts';
import { ARGA_PALETTE } from './argaTokens';

export interface ArgaTorsoProps {
  view: ViewAngle;
  torsoLeanDeg: number;
  shoulderTwistPx: number;
  coatTrailDeg: number;
  windSway: number;
  shoulderLeftX: number;
  shoulderRightX: number;
}

/**
 * Tailored navy overcoat back tails rendered behind pelvis and legs so
 * legs stride cleanly in front while coat skirt reacts to inertia & breeze.
 * Coordinate origin is anchored at hipY (-410).
 */
export const ArgaCoatBackTails: React.FC<ArgaTorsoProps> = ({
  view,
  torsoLeanDeg,
  coatTrailDeg,
  windSway,
}) => {
  if (view === 'back') {
    return null;
  }
  const ct = ARGA_PALETTE.coat;
  const sway = r1(coatTrailDeg * 3.0 + windSway * 7.5);

  if (view === 'profile-right' || view === 'profile-left') {
    const dir = view === 'profile-right' ? 1 : -1;
    return (
      <g transform={`translate(0, -445) rotate(${r1(torsoLeanDeg * 0.4)})`}>
        <path
          d={`M ${r1(-20 * dir)} 0 L ${r1(14 * dir)} 0 L ${r1(20 * dir + sway * 0.5)} 228 C ${r1(4 * dir + sway)} 234 ${r1(-28 * dir + sway * 1.15)} 232 ${r1(-48 * dir + sway * 1.25)} 220 C ${r1(-38 * dir + sway * 0.6)} 140 ${r1(-28 * dir)} 62 ${r1(-20 * dir)} 0 Z`}
          fill={ct.deep}
          stroke={ct.ink}
          strokeWidth={1.85}
          strokeLinejoin="round"
        />
        <path
          d={`M ${r1(-16 * dir)} 16 C ${r1(-22 * dir + sway * 0.45)} 105 ${r1(-30 * dir + sway * 0.85)} 175 ${r1(-36 * dir + sway)} 214`}
          fill="none"
          stroke={ct.shadow}
          strokeWidth={2.0}
          strokeLinecap="round"
        />
      </g>
    );
  }

  const shift =
    view === 'three-quarter-right' ? -9 : view === 'three-quarter-left' ? 9 : 0;
  return (
    <g transform={`translate(${shift}, -445) rotate(${r1(torsoLeanDeg * 0.35)})`}>
      <path
        d={`M -52 -6 L 52 -6 L ${r1(66 + sway * 0.85)} 232 C 28 240 -28 240 ${r1(-66 + sway * 0.85)} 232 Z`}
        fill={ct.deep}
        stroke={ct.ink}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <path
        d={`M -28 25 L ${r1(-36 + sway * 0.55)} 220 M 26 25 L ${r1(32 + sway * 0.55)} 220`}
        fill="none"
        stroke={ct.shadow}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </g>
  );
};

/**
 * Inner anatomical ribcage, collar/shirt placket, leather belt, and trouser pelvis.
 * Coordinate origin sits at hipY (-410).
 */
export const ArgaInnerTorso: React.FC<ArgaTorsoProps> = ({
  view,
  torsoLeanDeg,
  shoulderTwistPx,
}) => {
  if (view === 'back') {
    return null;
  }
  const sh = ARGA_PALETTE.shirt;
  const bt = ARGA_PALETTE.belt;
  const tr = ARGA_PALETTE.trousers;
  const sk = ARGA_PALETTE.skin;

  if (view === 'profile-right' || view === 'profile-left') {
    const dir = view === 'profile-right' ? 1 : -1;
    const isRight = dir > 0;
    return (
      <g transform={`translate(0, -410) rotate(${r1(torsoLeanDeg * 0.4)}, 0, 0)`}>
        {/* Trouser pelvis block in profile */}
        <path
          d={`M ${r1(-22 * dir)} -44 L ${r1(23 * dir)} -44 C ${r1(26 * dir)} -20 ${r1(24 * dir)} 4 ${r1(18 * dir)} 20 L ${r1(-18 * dir)} 20 C ${r1(-24 * dir)} 2 ${r1(-25 * dir)} -20 ${r1(-22 * dir)} -44 Z`}
          fill={tr.base}
          stroke={tr.ink}
          strokeWidth={1.9}
          strokeLinejoin="round"
        />
        <path
          d={`M ${r1(-22 * dir)} -42 C ${r1(-23 * dir)} -18 ${r1(-20 * dir)} 4 ${r1(-15 * dir)} 18 L ${r1(-2 * dir)} 18 L ${r1(-6 * dir)} -42 Z`}
          fill={tr.shadow}
        />

        {/* Shirt torso in profile */}
        <path
          d={`M ${r1(-15 * dir)} -206 L ${r1(14 * dir)} -206 C ${r1(24 * dir)} -165 ${r1(25 * dir)} -110 ${r1(21 * dir)} -44 L ${r1(-19 * dir)} -44 C ${r1(-21 * dir)} -110 ${r1(-20 * dir)} -162 ${r1(-15 * dir)} -206 Z`}
          fill={sh.base}
          stroke={sh.ink}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path
          d={`M ${r1(4 * dir)} -178 C ${r1(15 * dir)} -140 ${r1(15 * dir)} -90 ${r1(9 * dir)} -54`}
          fill="none"
          stroke={sh.shadow}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        {/* Open shirt collarbone skin + collar wing */}
        <path
          d={`M ${r1(1 * dir)} -210 L ${r1(14 * dir)} -202 L ${r1(10 * dir)} -180 L ${r1(-1 * dir)} -196 Z`}
          fill={sk.base}
          stroke={sk.ink}
          strokeWidth={1.1}
        />
        <path
          d={`M ${r1(-8 * dir)} -212 L ${r1(11 * dir)} -206 L ${r1(16 * dir)} -185 L ${r1(-1 * dir)} -183 Z`}
          fill={sh.highlight}
          stroke={sh.ink}
          strokeWidth={1.25}
          strokeLinejoin="round"
        />

        {/* Leather belt & profile buckle */}
        <path
          d={`M ${r1(-22 * dir)} -54 L ${r1(23.5 * dir)} -54 L ${r1(24 * dir)} -40 L ${r1(-22 * dir)} -40 Z`}
          fill={bt.base}
          stroke={bt.ink}
          strokeWidth={1.4}
        />
        <rect
          x={isRight ? 17 : -23}
          y={-55}
          width={6}
          height={16}
          rx={1.5}
          fill={bt.buckle}
          stroke={bt.ink}
          strokeWidth={1.15}
        />
      </g>
    );
  }

  // Front, three-quarter-right, three-quarter-left
  const cx =
    view === 'three-quarter-right'
      ? 11
      : view === 'three-quarter-left'
        ? -11
        : 0;
  const leftW = view === 'three-quarter-right' ? 39 : view === 'three-quarter-left' ? 50 : 48;
  const rightW = view === 'three-quarter-left' ? 39 : view === 'three-quarter-right' ? 50 : 48;
  const shadowDir = view === 'three-quarter-left' ? 1 : -1;

  return (
    <g transform={`translate(${r1(shoulderTwistPx * 0.2)}, -410) rotate(${r1(torsoLeanDeg * 0.35)}, 0, 0)`}>
      {/* Charcoal trouser pelvis */}
      <path
        d={`M ${-rightW * 0.74} -46 L ${leftW * 0.74} -46 C ${leftW * 0.82} -20 ${leftW * 0.76} 4 ${leftW * 0.65} 22 L ${cx * 0.4} 26 L ${-rightW * 0.65} 22 C ${-rightW * 0.76} 4 ${-rightW * 0.82} -20 ${-rightW * 0.74} -46 Z`}
        fill={tr.base}
        stroke={tr.ink}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      {/* Trouser fly seam & pocket folds matching Option B */}
      <path
        d={`M ${r1(cx)} -38 L ${r1(cx)} 14 M ${r1(cx - 20)} -34 C ${r1(cx - 24)} -16 ${r1(cx - 28)} -2 ${r1(cx - 30)} 8 M ${r1(cx + 20)} -34 C ${r1(cx + 24)} -16 ${r1(cx + 27)} -2 ${r1(cx + 29)} 8`}
        fill="none"
        stroke={tr.ink}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.78}
      />

      {/* Stone-gray dress shirt torso (subtle ribcage V taper) */}
      <path
        d={`M ${-rightW} -186 L ${cx - 19} -210 L ${cx + 19} -210 L ${leftW} -186 C ${leftW * 0.92} -132 ${leftW * 0.8} -86 ${leftW * 0.74} -46 L ${-rightW * 0.74} -46 C ${-rightW * 0.8} -86 ${-rightW * 0.92} -132 ${-rightW} -186 Z`}
        fill={sh.base}
        stroke={sh.ink}
        strokeWidth={1.45}
        strokeLinejoin="round"
      />
      {/* Shirt cel shadow along coat opening edge */}
      <path
        d={`M ${shadowDir < 0 ? -rightW : leftW * 0.35} -184 L ${shadowDir < 0 ? -rightW * 0.32 : leftW} -184 L ${shadowDir < 0 ? -rightW * 0.25 : leftW * 0.74} -46 L ${shadowDir < 0 ? -rightW * 0.74 : leftW * 0.28} -46 Z`}
        fill={sh.shadow}
        opacity={0.58}
      />
      {/* Shirt tuck folds near belt */}
      <path
        d={`M ${r1(cx - 13)} -80 C ${r1(cx - 12)} -64 ${r1(cx - 11)} -54 ${r1(cx - 9)} -46 M ${r1(cx + 15)} -86 C ${r1(cx + 13)} -68 ${r1(cx + 11)} -56 ${r1(cx + 9)} -46`}
        fill="none"
        stroke={sh.deep}
        strokeWidth={1.15}
        strokeLinecap="round"
      />

      {/* Open shirt neckline showing natural collarbones & V skin */}
      <path
        d={`M ${r1(cx - 17)} -212 L ${r1(cx + 17)} -212 L ${r1(cx + 12)} -192 L ${r1(cx)} -167 L ${r1(cx - 12)} -192 Z`}
        fill={sk.base}
        stroke={sk.ink}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(cx - 9)} -194 Q ${r1(cx)} -186 ${r1(cx + 9)} -194`}
        fill="none"
        stroke={sk.deep}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      {/* Clean dress shirt collar wings */}
      <path
        d={`M ${r1(cx - 20)} -214 L ${r1(cx - 10)} -188 L ${r1(cx - 24)} -182 L ${r1(cx - 30)} -202 Z`}
        fill={sh.highlight}
        stroke={sh.ink}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(cx + 20)} -214 L ${r1(cx + 10)} -188 L ${r1(cx + 24)} -182 L ${r1(cx + 30)} -202 Z`}
        fill={sh.highlight}
        stroke={sh.ink}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />

      {/* Button placket & 3 buttons */}
      <path
        d={`M ${r1(cx)} -167 L ${r1(cx + (view === 'front' ? 0 : cx * 0.08))} -46`}
        fill="none"
        stroke={sh.deep}
        strokeWidth={1.1}
      />
      {[-148, -116, -84].map((by) => (
        <circle
          key={by}
          cx={r1(cx + 3)}
          cy={by}
          r={2.1}
          fill={sh.highlight}
          stroke={sh.ink}
          strokeWidth={0.9}
        />
      ))}

      {/* Dark brown leather belt + silver buckle */}
      <path
        d={`M ${-rightW * 0.76} -54 L ${leftW * 0.76} -54 L ${leftW * 0.77} -40 L ${-rightW * 0.77} -40 Z`}
        fill={bt.base}
        stroke={bt.ink}
        strokeWidth={1.45}
      />
      <path
        d={`M ${-rightW * 0.76} -46 L ${leftW * 0.76} -46 L ${leftW * 0.77} -40 L ${-rightW * 0.77} -40 Z`}
        fill={bt.shadow}
        opacity={0.65}
      />
      <rect
        x={r1(cx - 9.5)}
        y={-55.5}
        width={19}
        height={17}
        rx={2}
        fill="none"
        stroke={bt.buckle}
        strokeWidth={2.7}
      />
      <rect
        x={r1(cx - 9.5)}
        y={-55.5}
        width={19}
        height={17}
        rx={2}
        fill="none"
        stroke={bt.ink}
        strokeWidth={1.0}
      />
      <line x1={r1(cx - 2)} y1={-47} x2={r1(cx + 4)} y2={-47} stroke={bt.buckleShadow} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
};

/**
 * Tailored dark navy overcoat front panels, natural sloping shoulders, turned coat collar
 * cradling sides of the neck (NO bar across front of throat), notched lapels, and rear shell.
 */
export const ArgaCoatFront: React.FC<ArgaTorsoProps> = ({
  view,
  torsoLeanDeg,
  shoulderTwistPx,
  coatTrailDeg,
  windSway,
  shoulderLeftX,
  shoulderRightX,
}) => {
  const ct = ARGA_PALETTE.coat;
  const sh = ARGA_PALETTE.shirt;
  const sway = r1(coatTrailDeg * 2.8 + windSway * 7);

  if (view === 'back') {
    return (
      <g transform={`translate(0, -410) rotate(${r1(torsoLeanDeg * 0.35)}, 0, 0)`}>
        <path
          d={`M -19 -212 L 19 -212 L 38 -195 C 57 -187 72 -181 74 -164 L 62 -62 C 62 32 66 120 ${r1(71 + sway * 0.7)} 194 L 4 196 L 0 138 L -4 196 L ${r1(-71 + sway * 0.7)} 194 C -66 120 -62 32 -62 -62 L -74 -164 C -72 -181 -57 -187 -38 -195 Z`}
          fill={ct.base}
          stroke={ct.ink}
          strokeWidth={2.0}
          strokeLinejoin="round"
        />
        <path
          d={`M -68 -164 C -56 -122 -52 -44 -54 192 L ${r1(-69 + sway * 0.65)} 192 C -65 116 -61 32 -60 -62 Z`}
          fill={ct.shadow}
          opacity={0.78}
        />
        <path
          d="M -56 -140 C -22 -133 22 -133 56 -140 L 54 -130 C 20 -123 -20 -123 -54 -130 Z"
          fill={ct.shadow}
          opacity={0.72}
        />
        {/* Turned-up rear coat collar hugging neck cleanly */}
        <path
          d="M -22 -215 C -8 -223 8 -223 22 -215 L 27 -194 C 12 -190 -12 -190 -27 -194 Z"
          fill={ct.highlight}
          stroke={ct.ink}
          strokeWidth={1.65}
          strokeLinejoin="round"
        />
        <path
          d="M -57 -140 Q 0 -132 57 -140 M 0 -186 L 0 138"
          fill="none"
          stroke={ct.ink}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.85}
        />
        <path
          d="M 0 130 L 6 194 M -27 65 C -29 120 -33 162 -37 190 M 27 65 C 29 120 33 162 37 190"
          fill="none"
          stroke={ct.shadow}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (view === 'profile-right' || view === 'profile-left') {
    const dir = view === 'profile-right' ? 1 : -1;
    return (
      <g transform={`translate(0, -410) rotate(${r1(torsoLeanDeg * 0.4)}, 0, 0)`}>
        <path
          d={`M ${r1(-21 * dir)} -214 C ${r1(-9 * dir)} -218 ${r1(4 * dir)} -216 ${r1(9 * dir)} -206 L ${r1(2 * dir)} -190 L ${r1(18 * dir)} -170 L ${r1(22 * dir)} -108 C ${r1(26 * dir)} -40 ${r1(28 * dir)} 66 ${r1(30 * dir + sway * 0.5)} 194 L ${r1(-26 * dir + sway * 1.05)} 190 C ${r1(-30 * dir + sway * 0.5)} 90 ${r1(-30 * dir)} -24 ${r1(-26 * dir)} -154 C ${r1(-26 * dir)} -184 ${r1(-23 * dir)} -202 ${r1(-21 * dir)} -214 Z`}
          fill={ct.base}
          stroke={ct.ink}
          strokeWidth={2.0}
          strokeLinejoin="round"
        />
        <path
          d={`M ${r1(-24 * dir)} -170 C ${r1(-27 * dir)} -78 ${r1(-25 * dir + sway * 0.4)} 56 ${r1(-23 * dir + sway * 0.9)} 188 L ${r1(-8 * dir + sway * 0.7)} 188 C ${r1(-11 * dir)} 60 ${r1(-11 * dir)} -72 ${r1(-13 * dir)} -170 Z`}
          fill={ct.shadow}
          opacity={0.86}
        />
        {/* Profile notched lapel */}
        <path
          d={`M ${r1(-8 * dir)} -214 L ${r1(12 * dir)} -202 L ${r1(23 * dir)} -160 L ${r1(12 * dir)} -140 L ${r1(23 * dir)} -105 L ${r1(6 * dir)} -114 L ${r1(-5 * dir)} -180 Z`}
          fill={ct.highlight}
          stroke={ct.ink}
          strokeWidth={1.55}
          strokeLinejoin="round"
        />
        <path
          d={`M ${r1(-6 * dir)} -14 L ${r1(17 * dir)} -11 L ${r1(17 * dir)} -2 L ${r1(-6 * dir)} -5 Z`}
          fill={ct.shadow}
          stroke={ct.ink}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </g>
    );
  }

  // Front, three-quarter-right, three-quarter-left
  const cx =
    view === 'three-quarter-right'
      ? 11
      : view === 'three-quarter-left'
        ? -11
        : 0;
  const leftGap = view === 'three-quarter-right' ? 14 : 20;
  const rightGap = view === 'three-quarter-left' ? 14 : 20;
  const sLeftX = shoulderLeftX;
  const sRightX = shoulderRightX;

  const outerL = sRightX + 2;
  const outerR = sLeftX - 2;

  return (
    <g transform={`translate(${r1(shoulderTwistPx * 0.2)}, -410) rotate(${r1(torsoLeanDeg * 0.35)}, 0, 0)`}>
      {/* VIEWER-LEFT Coat Panel (smooth tailored drape from shoulder to flared hem, zero waist pinch) */}
      <path
        d={`M ${r1(cx - 24)} -212 L ${r1(outerL)} -192 C ${r1(outerL - 2)} -168 ${r1(outerL + 2)} -118 ${r1(outerL + 5)} -56 C ${r1(outerL + 3)} 16 ${r1(outerL - 2 + sway * 0.4)} 96 ${r1(outerL - 6 + sway * 0.8)} 194 L ${r1(cx - rightGap - 18 + sway * 0.6)} 190 C ${r1(cx - rightGap - 5)} 86 ${r1(cx - rightGap)} -14 ${r1(cx - rightGap)} -94 C ${r1(cx - rightGap)} -134 ${r1(cx - 28)} -172 ${r1(cx - 24)} -212 Z`}
        fill={ct.base}
        stroke={ct.ink}
        strokeWidth={1.95}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(outerL + 3)} -118 C ${r1(outerL + 4)} -56 ${r1(outerL + 2)} 16 ${r1(outerL - 6 + sway * 0.8)} 190 L ${r1(outerL + 7 + sway * 0.7)} 190 C ${r1(outerL + 11)} -6 ${r1(outerL + 13)} -64 ${r1(outerL + 3)} -118 Z`}
        fill={ct.shadow}
        opacity={0.84}
      />
      {/* Left notched coat collar & lapel hugging side of neck cleanly */}
      <path
        d={`M ${r1(cx - 24)} -214 L ${r1(cx - 39)} -194 L ${r1(cx - 48)} -150 L ${r1(cx - 33)} -140 L ${r1(cx - 44)} -120 L ${r1(cx - rightGap)} -94 L ${r1(cx - 21)} -170 Z`}
        fill={ct.highlight}
        stroke={ct.ink}
        strokeWidth={1.45}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(cx - rightGap - 28)} -6 L ${r1(cx - rightGap - 6)} -2 L ${r1(cx - rightGap - 7)} 7 L ${r1(cx - rightGap - 29)} 3 Z`}
        fill={ct.shadow}
        stroke={ct.ink}
        strokeWidth={1.15}
      />
      <path
        d={`M ${r1(cx - 28)} -205 L ${r1(outerL + 4)} -188`}
        fill="none"
        stroke={ct.highlight}
        strokeWidth={2.0}
        strokeLinecap="round"
        opacity={0.72}
      />

      {/* VIEWER-RIGHT Coat Panel */}
      <path
        d={`M ${r1(cx + 24)} -212 L ${r1(outerR)} -192 C ${r1(outerR + 2)} -168 ${r1(outerR - 2)} -118 ${r1(outerR - 4)} -56 C ${r1(outerR - 2)} 16 ${r1(outerR + 2 + sway * 0.4)} 96 ${r1(outerR + 6 + sway * 0.8)} 194 L ${r1(cx + leftGap + 18 + sway * 0.6)} 190 C ${r1(cx + leftGap + 5)} 86 ${r1(cx + leftGap)} -14 ${r1(cx + leftGap)} -94 C ${r1(cx + leftGap)} -134 ${r1(cx + 28)} -172 ${r1(cx + 24)} -212 Z`}
        fill={ct.base}
        stroke={ct.ink}
        strokeWidth={1.95}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(outerR - 3)} -118 C ${r1(outerR - 4)} -56 ${r1(outerR - 2)} 16 ${r1(outerR + 6 + sway * 0.8)} 190 L ${r1(outerR - 7 + sway * 0.7)} 190 C ${r1(outerR - 11)} -6 ${r1(outerR - 13)} -64 ${r1(outerR - 3)} -118 Z`}
        fill={ct.shadow}
        opacity={view === 'three-quarter-right' ? 0.9 : 0.74}
      />
      {/* Right notched coat collar & lapel */}
      <path
        d={`M ${r1(cx + 24)} -214 L ${r1(cx + 39)} -194 L ${r1(cx + 48)} -150 L ${r1(cx + 33)} -140 L ${r1(cx + 44)} -120 L ${r1(cx + leftGap)} -94 L ${r1(cx + 21)} -170 Z`}
        fill={view === 'three-quarter-right' ? ct.base : ct.highlight}
        stroke={ct.ink}
        strokeWidth={1.45}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(cx + leftGap + 6)} -2 L ${r1(cx + leftGap + 28)} -6 L ${r1(cx + leftGap + 29)} 3 L ${r1(cx + leftGap + 7)} 7 Z`}
        fill={ct.shadow}
        stroke={ct.ink}
        strokeWidth={1.15}
      />
      <circle
        cx={r1(cx + leftGap + 8)}
        cy={-78}
        r={3.2}
        fill={sh.deep}
        stroke={ct.ink}
        strokeWidth={1.1}
      />
    </g>
  );
};
