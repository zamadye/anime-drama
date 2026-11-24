import React from 'react';
import { clamp, r1 } from '../../../engine/math';
import type { EmotionId, ViewAngle, VisemeId } from '../../contracts';
import { ARGA_PALETTE, makeActorDefsId } from './argaTokens';

export interface ArgaHeadProps {
  instanceId: string;
  view: ViewAngle;
  emotion: EmotionId;
  viseme: VisemeId;
  blink: number;
  gazeX: number;
  gazeY: number;
  headTiltDeg: number;
  hairSway: number;
}

type EmotionStyle = {
  browOffsetY: number;
  browInnerTilt: number;
  upperLidDrop: number;
  lowerLidLift: number;
  irisScale: number;
  tearGlisten: number;
};

const EMOTION_MAP: Record<EmotionId, EmotionStyle> = {
  neutral: { browOffsetY: 0, browInnerTilt: 0, upperLidDrop: 0.05, lowerLidLift: 0.02, irisScale: 1, tearGlisten: 0 },
  guarded: { browOffsetY: 1.4, browInnerTilt: -3.2, upperLidDrop: 0.16, lowerLidLift: 0.1, irisScale: 0.96, tearGlisten: 0 },
  melancholy: { browOffsetY: -0.4, browInnerTilt: 5.5, upperLidDrop: 0.18, lowerLidLift: 0.08, irisScale: 1.02, tearGlisten: 0.25 },
  determined: { browOffsetY: 1.8, browInnerTilt: -6.5, upperLidDrop: 0.12, lowerLidLift: 0.14, irisScale: 0.94, tearGlisten: 0 },
  shock: { browOffsetY: -5.2, browInnerTilt: 4.0, upperLidDrop: -0.08, lowerLidLift: 0, irisScale: 0.72, tearGlisten: 0 },
  'suppressed-tears': { browOffsetY: -1.0, browInnerTilt: 7.5, upperLidDrop: 0.2, lowerLidLift: 0.22, irisScale: 1.05, tearGlisten: 0.92 },
  'soft-smile': { browOffsetY: -1.6, browInnerTilt: 1.8, upperLidDrop: 0.08, lowerLidLift: 0.18, irisScale: 1.02, tearGlisten: 0 },
};

const renderVisemeMouth = (
  cx: number,
  cy: number,
  viseme: VisemeId,
  emotion: EmotionId,
  mode: 'front' | 'three-quarter-right' | 'three-quarter-left' | 'profile-right' | 'profile-left',
) => {
  const sk = ARGA_PALETTE.skin;
  const mouthIn = '#5E2E30';
  const tongue = '#B86E6F';
  const teeth = '#F5ECE9';

  if (mode === 'profile-right' || mode === 'profile-left') {
    const dir = mode === 'profile-right' ? 1 : -1;
    if (viseme === 'rest' || viseme === 'closed-m') {
      const smileBend = emotion === 'soft-smile' ? -1.4 : emotion === 'melancholy' ? 1.0 : 0;
      return (
        <path
          d={`M ${r1(cx + 0.4 * dir)} ${r1(cy)} L ${r1(cx - 7.5 * dir)} ${r1(cy + 0.7 + smileBend)}`}
          fill="none"
          stroke={sk.ink}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      );
    }
    const openH =
      viseme === 'open-a' ? 6.2 : viseme === 'round-o' ? 4.8 : viseme === 'narrow-e' ? 3.2 : 2.1;
    const jawIn = viseme === 'round-o' ? 4.2 : 5.8;
    return (
      <g>
        <path
          d={`M ${r1(cx)} ${r1(cy - 1)} C ${r1(cx - jawIn * dir)} ${r1(cy - 0.5)} ${r1(cx - (jawIn + 1.3) * dir)} ${r1(cy + openH * 0.5)} ${r1(cx - jawIn * dir)} ${r1(cy + openH)} L ${r1(cx - 0.4 * dir)} ${r1(cy + openH * 0.9)} Z`}
          fill={mouthIn}
          stroke={sk.ink}
          strokeWidth={1.15}
          strokeLinejoin="round"
        />
        {openH > 3.0 && (
          <path
            d={`M ${r1(cx - 1.0 * dir)} ${r1(cy - 0.4)} L ${r1(cx - (jawIn - 1) * dir)} ${r1(cy)} L ${r1(cx - (jawIn - 1.4) * dir)} ${r1(cy + 1.7)} L ${r1(cx - 0.7 * dir)} ${r1(cy + 1.5)} Z`}
            fill={teeth}
          />
        )}
      </g>
    );
  }

  const bias = mode === 'three-quarter-right' ? 1.5 : mode === 'three-quarter-left' ? -1.5 : 0;
  if (viseme === 'rest') {
    const curve =
      emotion === 'soft-smile' ? -1.8 : emotion === 'melancholy' || emotion === 'guarded' ? 1.1 : 0.35;
    return (
      <g>
        <path
          d={`M ${r1(cx - 7.4 + bias)} ${r1(cy)} Q ${r1(cx + bias)} ${r1(cy + curve)} ${r1(cx + 7.6 + bias)} ${r1(cy - 0.25)}`}
          fill="none"
          stroke={sk.ink}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <path
          d={`M ${r1(cx - 3 + bias)} ${r1(cy + 3.4)} Q ${r1(cx + bias)} ${r1(cy + 4.1)} ${r1(cx + 3 + bias)} ${r1(cy + 3.4)}`}
          fill="none"
          stroke={sk.deep}
          strokeWidth={0.85}
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (viseme === 'closed-m') {
    return (
      <path
        d={`M ${r1(cx - 8 + bias)} ${r1(cy)} Q ${r1(cx + bias)} ${r1(cy + 0.5)} ${r1(cx + 8 + bias)} ${r1(cy)}`}
        fill="none"
        stroke={sk.ink}
        strokeWidth={1.55}
        strokeLinecap="round"
      />
    );
  }

  if (viseme === 'round-o') {
    return (
      <g>
        <ellipse
          cx={r1(cx + bias)}
          cy={r1(cy + 1.4)}
          rx={4.6}
          ry={5.3}
          fill={mouthIn}
          stroke={sk.ink}
          strokeWidth={1.2}
        />
        <ellipse cx={r1(cx + bias)} cy={r1(cy + 4.1)} rx={2.6} ry={1.6} fill={tongue} />
      </g>
    );
  }

  const w = viseme === 'open-a' ? 8.2 : viseme === 'narrow-e' ? 8.8 : 7.4;
  const h = viseme === 'open-a' ? 7.2 : viseme === 'narrow-e' ? 4.2 : 3.0;

  return (
    <g>
      <path
        d={`M ${r1(cx - w + bias)} ${r1(cy - 0.5)} Q ${r1(cx + bias)} ${r1(cy - 1.4)} ${r1(cx + w + bias)} ${r1(cy - 0.5)} C ${r1(cx + w * 0.8 + bias)} ${r1(cy + h)} ${r1(cx - w * 0.8 + bias)} ${r1(cy + h)} ${r1(cx - w + bias)} ${r1(cy - 0.5)} Z`}
        fill={mouthIn}
        stroke={sk.ink}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d={`M ${r1(cx - w * 0.72 + bias)} ${r1(cy - 0.5)} L ${r1(cx + w * 0.72 + bias)} ${r1(cy - 0.5)} L ${r1(cx + w * 0.62 + bias)} ${r1(cy + 1.6)} L ${r1(cx - w * 0.62 + bias)} ${r1(cy + 1.6)} Z`}
        fill={teeth}
      />
      {h >= 4.0 && (
        <ellipse cx={r1(cx + bias)} cy={r1(cy + h * 0.68)} rx={r1(w * 0.45)} ry={1.9} fill={tongue} />
      )}
    </g>
  );
};

interface EyeRenderParams {
  clipId: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tiltDeg: number;
  emotion: EmotionStyle;
  blink: number;
  gazeX: number;
  gazeY: number;
  sideBias: 1 | -1;
}

const renderModernSeriesEye = ({
  clipId,
  cx,
  cy,
  rx,
  ry,
  tiltDeg,
  emotion,
  blink,
  gazeX,
  gazeY,
  sideBias,
}: EyeRenderParams) => {
  const ey = ARGA_PALETTE.eye;
  const sk = ARGA_PALETTE.skin;
  const openRatio = clamp(1 - Math.max(blink, emotion.upperLidDrop * 0.65 + emotion.lowerLidLift * 0.35), 0.04, 1);

  if (blink >= 0.86) {
    return (
      <g transform={`translate(${r1(cx)}, ${r1(cy)}) rotate(${r1(tiltDeg)})`}>
        <path
          d={`M ${r1(-rx - 1)} 1 Q 0 ${r1(4.2)} ${r1(rx + 1)} 0.5`}
          fill="none"
          stroke={ey.lash}
          strokeWidth={2.0}
          strokeLinecap="round"
        />
      </g>
    );
  }

  const effectiveRy = Math.max(2.4, ry * openRatio);
  const irisRx = Math.min(rx * 0.63, 6.0 * emotion.irisScale);
  const irisRy = Math.min(ry * 0.94, 5.7 * emotion.irisScale);
  const gx = clamp(gazeX, -1, 1) * rx * 0.22;
  const gy = clamp(gazeY, -1, 1) * ry * 0.16;

  const eyeShapeD = `M ${r1(-rx)} 0.6 C ${r1(-rx * 0.56)} ${r1(-effectiveRy * 1.14)} ${r1(rx * 0.56)} ${r1(-effectiveRy * 1.1)} ${r1(rx)} 0 C ${r1(rx * 0.64)} ${r1(effectiveRy * 0.92)} ${r1(-rx * 0.52)} ${r1(effectiveRy * 0.95)} ${r1(-rx)} 0.6 Z`;

  return (
    <g transform={`translate(${r1(cx)}, ${r1(cy)}) rotate(${r1(tiltDeg)})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={eyeShapeD} />
        </clipPath>
      </defs>

      <path d={eyeShapeD} fill={ey.sclera} />

      <g clipPath={`url(#${clipId})`}>
        <rect x={r1(-rx - 2)} y={r1(-ry - 2)} width={r1(rx * 2 + 4)} height={r1(effectiveRy * 0.44 + 2)} fill={ey.scleraShadow} opacity={0.58} />

        <g transform={`translate(${r1(gx)}, ${r1(gy)})`}>
          <ellipse cx={0} cy={0} rx={r1(irisRx)} ry={r1(irisRy)} fill={ey.irisBase} stroke={ey.pupil} strokeWidth={0.95} />
          <path
            d={`M ${r1(-irisRx)} ${r1(-irisRy * 0.05)} A ${r1(irisRx)} ${r1(irisRy)} 0 0 1 ${r1(irisRx)} ${r1(-irisRy * 0.05)} L ${r1(irisRx * 0.88)} ${r1(-irisRy * 0.22)} Q 0 0 ${r1(-irisRx * 0.88)} ${r1(-irisRy * 0.22)} Z`}
            fill={ey.irisDark}
          />
          <path
            d={`M ${r1(-irisRx * 0.7)} ${r1(irisRy * 0.25)} Q 0 ${r1(irisRy * 0.95)} ${r1(irisRx * 0.7)} ${r1(irisRy * 0.25)} Q 0 ${r1(irisRy * 0.62)} ${r1(-irisRx * 0.7)} ${r1(irisRy * 0.25)} Z`}
            fill={ey.irisLight}
          />
          <ellipse cx={0} cy={r1(irisRy * 0.04)} rx={r1(irisRx * 0.42)} ry={r1(irisRy * 0.46)} fill={ey.pupil} />
          <circle cx={r1(sideBias * irisRx * 0.42)} cy={r1(-irisRy * 0.36)} r={1.65} fill="#FFFFFF" />
        </g>

        {emotion.tearGlisten > 0.2 && (
          <path
            d={`M ${r1(-rx * 0.65)} ${r1(effectiveRy * 0.55)} Q 0 ${r1(effectiveRy * 0.95)} ${r1(rx * 0.65)} ${r1(effectiveRy * 0.55)}`}
            fill="none"
            stroke="#EAF4FF"
            strokeWidth={1.6}
            opacity={emotion.tearGlisten}
          />
        )}
      </g>

      <path
        d={`M ${r1(-rx - 0.8)} 0.8 C ${r1(-rx * 0.52)} ${r1(-effectiveRy * 1.18)} ${r1(rx * 0.54)} ${r1(-effectiveRy * 1.15)} ${r1(rx + 1.5)} -0.5`}
        fill="none"
        stroke={ey.lash}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d={`M ${r1(-rx * 0.7)} ${r1(-effectiveRy * 1.4 - 1.5)} Q 0 ${r1(-effectiveRy * 1.62 - 2)} ${r1(rx * 0.7)} ${r1(-effectiveRy * 1.38 - 1.5)}`}
        fill="none"
        stroke={sk.deep}
        strokeWidth={0.85}
        strokeLinecap="round"
      />
      <path
        d={`M ${r1(-rx * 0.55)} ${r1(effectiveRy * 0.85)} Q 0 ${r1(effectiveRy * 0.98)} ${r1(rx * 0.52)} ${r1(effectiveRy * 0.83)}`}
        fill="none"
        stroke={sk.ink}
        strokeWidth={0.85}
        strokeLinecap="round"
        opacity={0.72}
      />
    </g>
  );
};

/**
 * Rear cranium & tapered nape hair hugging closely behind neck/ears (no blocky cheek flaps).
 * Head origin is (0, -644) = chinY.
 */
export const ArgaBackHair: React.FC<ArgaHeadProps> = ({
  view,
  headTiltDeg,
  hairSway,
}) => {
  const hr = ARGA_PALETTE.hair;
  if (view === 'back') {
    return null;
  }

  const sw = r1(hairSway * 1.0);
  return (
    <g transform={`translate(0, -644) rotate(${r1(headTiltDeg)}, 0, 22)`}>
      {view === 'profile-right' && (
        <path
          d={`M -34 -74 C -39 -52 -39 -26 -30 -8 L -14 -4 C -17 2 -23 7 -27 9 L ${r1(-33 - Math.abs(sw))} 0 C -37 -18 -38 -50 -34 -74 Z`}
          fill={hr.shadow}
          stroke={hr.ink}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      )}
      {view === 'profile-left' && (
        <path
          d={`M 34 -74 C 39 -52 39 -26 30 -8 L 14 -4 C 17 2 23 7 27 9 L ${r1(33 + Math.abs(sw))} 0 C 37 -18 38 -50 34 -74 Z`}
          fill={hr.shadow}
          stroke={hr.ink}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      )}
      {view === 'three-quarter-right' && (
        <path
          d="M -34 -72 C -37 -44 -34 -18 -24 2 L -17 -4 L -12 4 L -5 -4 L 18 -6 L 26 -14 C 31 -32 32 -54 30 -72 Z"
          fill={hr.shadow}
          stroke={hr.ink}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
      {view === 'three-quarter-left' && (
        <path
          d="M 34 -72 C 37 -44 34 -18 24 2 L 17 -4 L 12 4 L 5 -4 L -18 -6 L -26 -14 C -31 -32 -32 -54 -30 -72 Z"
          fill={hr.shadow}
          stroke={hr.ink}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
      {view === 'front' && (
        <path
          d="M -32 -70 C -35 -44 -32 -20 -23 0 L -15 -6 L -10 3 L 10 3 L 15 -6 L 23 0 C 32 -20 35 -44 32 -70 Z"
          fill={hr.shadow}
          stroke={hr.ink}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
};

/**
 * Constructed jaw, proportioned neck, ears, brows, eyes, nose, and articulated mouth.
 * Head origin is (0, -644) = chinY, crown sits near y = -111 (-755 total).
 */
export const ArgaHeadAndFace: React.FC<ArgaHeadProps> = ({
  instanceId,
  view,
  emotion,
  viseme,
  blink,
  gazeX,
  gazeY,
  headTiltDeg,
  hairSway,
}) => {
  const sk = ARGA_PALETTE.skin;
  const hr = ARGA_PALETTE.hair;
  const em = EMOTION_MAP[emotion];

  return (
    <g transform={`translate(0, -644) rotate(${r1(headTiltDeg)}, 0, 22)`}>
      {view === 'back' && (
        <g>
          {/* Proportioned rear neck entering coat collar */}
          <path
            d="M -18 -14 L 18 -14 L 22 36 L -22 36 Z"
            fill={sk.shadow}
            stroke={sk.ink}
            strokeWidth={1.5}
          />
          <path d="M -33 -52 C -39 -50 -39 -36 -31 -32" fill={sk.base} stroke={sk.ink} strokeWidth={1.45} />
          <path d="M 33 -52 C 39 -50 39 -36 31 -32" fill={sk.shadow} stroke={sk.ink} strokeWidth={1.45} />
          {/* Fluffy feathered dark navy rear cranium + tousled crown tufts + tapered nape */}
          <path
            d={`M -37 -48 C -41 -76 -30 -98 -18 -104 L -16 -110 L -6 -105 L 4 -111 L 12 -105 L 22 -107 L 23 -99 C 35 -90 40 -68 37 -48 C 38 -32 34 -14 27 -2 L 20 -9 L 14 5 L 6 -7 L 0 6 L -7 -7 L ${r1(-15 + hairSway * 0.4)} 5 L -21 -9 L -27 -2 C -34 -14 -38 -32 -37 -48 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.9}
            strokeLinejoin="round"
          />
          <path
            d="M -36 -48 C -37 -72 -25 -96 -6 -102 C -22 -86 -26 -54 -25 -10 L -28 -2 Z"
            fill={hr.shadow}
            opacity={0.78}
          />
          <path
            d="M -22 -74 L -9 -82 L 4 -74 L 18 -81 L 24 -73 L 16 -67 L 4 -71 L -10 -66 Z"
            fill={hr.highlight}
            opacity={0.46}
          />
        </g>
      )}

      {(view === 'profile-right' || view === 'profile-left') && (() => {
        const isRight = view === 'profile-right';
        const d = isRight ? 1 : -1;
        const nearEyeId = makeActorDefsId(instanceId, `eye-${view}`);
        const browY = -58 + em.browOffsetY;

        return (
          <g>
            {/* Natural slight forward-tilted masculine cervical neck */}
            <path
              d={`M ${r1(-16 * d)} -34 L ${r1(12 * d)} -16 L ${r1(9 * d)} 36 L ${r1(-24 * d)} 36 Z`}
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.65}
              strokeLinejoin="round"
            />
            <path
              d={`M ${r1(-16 * d)} -18 L ${r1(12 * d)} -12 L ${r1(3 * d)} 8 L ${r1(-22 * d)} 14 Z`}
              fill={sk.shadow}
              opacity={0.85}
            />

            {/* Solid back skull hair backing ear & upper neck */}
            <path
              d={`M ${r1(-37 * d)} -52 C ${r1(-40 * d)} -78 ${r1(-24 * d)} -104 ${r1(5 * d)} -104 L ${r1(-6 * d)} -18 L ${r1(-28 * d)} 2 L ${r1(-36 * d)} -18 Z`}
              fill={hr.base}
            />

            {/* Side profile head silhouette */}
            <path
              d={`M ${r1(-24 * d)} -84 C ${r1(-8 * d)} -101 ${r1(20 * d)} -98 ${r1(27 * d)} -76 L ${r1(26 * d)} -59 L ${r1(36 * d)} -35 C ${r1(36.5 * d)} -32.5 ${r1(34 * d)} -30 ${r1(26 * d)} -29 L ${r1(27.5 * d)} -21 L ${r1(26 * d)} -14 C ${r1(27 * d)} -8.5 ${r1(25 * d)} -3 ${r1(19 * d)} 0 C ${r1(11 * d)} 1 ${r1(0 * d)} -5 ${r1(-13 * d)} -20 L ${r1(-20 * d)} -38 C ${r1(-27 * d)} -52 ${r1(-28 * d)} -68 ${r1(-24 * d)} -84 Z`}
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.75}
              strokeLinejoin="round"
            />
            <path
              d={`M ${r1(-16 * d)} -32 C ${r1(-7 * d)} -18 ${r1(7 * d)} -9 ${r1(19 * d)} -1 C ${r1(9 * d)} 1 ${r1(-2 * d)} -5 ${r1(-14 * d)} -20 Z`}
              fill={sk.shadow}
              opacity={0.6}
            />
            <path
              d={`M ${r1(-19 * d)} -49 C ${r1(-25 * d)} -49 ${r1(-26 * d)} -32 ${r1(-18 * d)} -30 C ${r1(-14 * d)} -30 ${r1(-13 * d)} -38 ${r1(-14 * d)} -46 Z`}
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.4}
            />
            <path
              d={`M ${r1(-20 * d)} -43 C ${r1(-22 * d)} -39 ${r1(-21 * d)} -35 ${r1(-18 * d)} -34`}
              fill="none"
              stroke={sk.deep}
              strokeWidth={1.05}
              strokeLinecap="round"
            />

            {renderModernSeriesEye({
              clipId: nearEyeId,
              cx: 15.5 * d,
              cy: -48,
              rx: 7.4,
              ry: 5.0,
              tiltDeg: isRight ? -2 : 2,
              emotion: em,
              blink,
              gazeX: gazeX + d * 0.25,
              gazeY,
              sideBias: d,
            })}

            <path
              d={`M ${r1(6 * d)} ${r1(browY + em.browInnerTilt * 0.25)} Q ${r1(16 * d)} ${r1(browY - 2.0)} ${r1(24 * d)} ${r1(browY + em.browInnerTilt * 0.4)}`}
              fill="none"
              stroke={hr.ink}
              strokeWidth={2.0}
              strokeLinecap="round"
            />

            {renderVisemeMouth(26 * d, -17.5, viseme, emotion, isRight ? 'profile-right' : 'profile-left')}
          </g>
        );
      })()}

      {view === 'front' && (() => {
        const leftId = makeActorDefsId(instanceId, 'eye-front-l');
        const rightId = makeActorDefsId(instanceId, 'eye-front-r');
        const browY = -58 + em.browOffsetY;
        return (
          <g>
            {/* Neck meeting collar naturally */}
            <path
              d="M -18 -20 L 18 -20 L 21 36 L -21 36 Z"
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.6}
            />
            <path d="M -17 -14 L 17 -14 C 14 2 5 9 0 9 C -7 9 -15 2 -17 -14 Z" fill={sk.shadow} />
            <path d="M -9 11 L -11 26 M 10 11 L 12 26" stroke={sk.deep} strokeWidth={1.0} strokeLinecap="round" opacity={0.72} />

            {/* Ears closer to head temple line */}
            <path d="M -32 -49 C -38 -49 -38 -31 -31 -29" fill={sk.base} stroke={sk.ink} strokeWidth={1.4} />
            <path d="M 32 -49 C 38 -49 38 -31 31 -29" fill={sk.shadow} stroke={sk.ink} strokeWidth={1.4} />

            {/* Adult jaw contour */}
            <path
              d="M -32 -74 C -33 -94 -19 -102 0 -102 C 19 -102 33 -94 32 -74 L 31 -37 C 30 -26 23 -17 11 -7 C 5 -2 3 0 0 0 C -3 0 -5 -2 -11 -7 C -23 -17 -30 -26 -31 -37 Z"
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.75}
              strokeLinejoin="round"
            />
            <path
              d="M 27 -70 L 30 -37 C 29 -26 22 -17 11 -7 C 5 -2 3 0 0 0 C 8 -7 19 -19 22 -33 C 24 -45 25 -57 27 -70 Z"
              fill={sk.shadow}
              opacity={0.48}
            />

            {renderModernSeriesEye({
              clipId: rightId,
              cx: -14.5,
              cy: -48,
              rx: 9.0,
              ry: 5.2,
              tiltDeg: -3,
              emotion: em,
              blink,
              gazeX,
              gazeY,
              sideBias: 1,
            })}
            {renderModernSeriesEye({
              clipId: leftId,
              cx: 14.5,
              cy: -48,
              rx: 9.0,
              ry: 5.2,
              tiltDeg: 3,
              emotion: em,
              blink,
              gazeX,
              gazeY,
              sideBias: 1,
            })}

            <path
              d={`M -25 ${r1(browY + em.browInnerTilt * 0.2)} Q -14 ${r1(browY - 2.2)} -4 ${r1(browY + em.browInnerTilt * 0.5)}`}
              fill="none"
              stroke={hr.ink}
              strokeWidth={1.95}
              strokeLinecap="round"
            />
            <path
              d={`M 4 ${r1(browY + em.browInnerTilt * 0.5)} Q 14 ${r1(browY - 2.2)} 25 ${r1(browY + em.browInnerTilt * 0.2)}`}
              fill="none"
              stroke={hr.ink}
              strokeWidth={1.95}
              strokeLinecap="round"
            />

            <path d="M -0.5 -43 L -1.8 -36" fill="none" stroke={sk.deep} strokeWidth={1.05} strokeLinecap="round" opacity={0.7} />
            <path d="M 0 -32 L 4 -31 L 0.5 -29 Z" fill={sk.shadow} />
            <path d="M -1.5 -31 L 1.2 -29.8" fill="none" stroke={sk.ink} strokeWidth={1.15} strokeLinecap="round" />

            {renderVisemeMouth(0, -17.5, viseme, emotion, 'front')}
          </g>
        );
      })()}

      {(view === 'three-quarter-right' || view === 'three-quarter-left') && (() => {
        const isRight = view === 'three-quarter-right';
        const d = isRight ? 1 : -1;
        const farEyeId = makeActorDefsId(instanceId, `eye-3q-far-${view}`);
        const nearEyeId = makeActorDefsId(instanceId, `eye-3q-near-${view}`);
        const browY = -58 + em.browOffsetY;

        const nearEyeX = -6.5 * d;
        const farEyeX = 19.5 * d;
        const noseX = 8.5 * d;

        return (
          <g>
            {/* Proportioned neck */}
            <path
              d={`M ${r1(-18 * d)} -20 L ${r1(14 * d)} -18 L ${r1(17 * d)} 36 L ${r1(-21 * d)} 36 Z`}
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.65}
            />
            <path
              d={`M ${r1(-17 * d)} -15 L ${r1(13 * d)} -15 L ${r1(5 * d)} 8 C ${r1(-4 * d)} 12 ${r1(-15 * d)} 6 ${r1(-17 * d)} -15 Z`}
              fill={sk.shadow}
              opacity={0.85}
            />
            <path d={`M ${r1(-8 * d)} 10 L ${r1(-9 * d)} 26`} stroke={sk.deep} strokeWidth={1.05} strokeLinecap="round" opacity={0.75} />

            {/* Near-side ear */}
            <path
              d={`M ${r1(-28 * d)} -49 C ${r1(-35 * d)} -49 ${r1(-35 * d)} -31 ${r1(-27 * d)} -29`}
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.45}
            />
            <path
              d={`M ${r1(-29.5 * d)} -43 C ${r1(-32 * d)} -39 ${r1(-31 * d)} -34 ${r1(-28.5 * d)} -32`}
              fill="none"
              stroke={sk.deep}
              strokeWidth={1.05}
              strokeLinecap="round"
            />

            {/* Asymmetric 3/4 adult face contour */}
            <path
              d={`M ${r1(-29 * d)} -74 C ${r1(-27 * d)} -94 ${r1(-10 * d)} -102 ${r1(7 * d)} -102 C ${r1(24 * d)} -100 ${r1(31 * d)} -84 ${r1(29 * d)} -62 L ${r1(31 * d)} -49 L ${r1(29 * d)} -37 C ${r1(28 * d)} -25 ${r1(22 * d)} -13 ${r1(11 * d)} -1 C ${r1(7.5 * d)} 0.5 ${r1(3 * d)} 0.5 ${r1(-6 * d)} -5 C ${r1(-19 * d)} -14 ${r1(-27 * d)} -25 ${r1(-29 * d)} -37 Z`}
              fill={sk.base}
              stroke={sk.ink}
              strokeWidth={1.75}
              strokeLinejoin="round"
            />
            <path
              d={`M ${r1(-28 * d)} -66 L ${r1(-28 * d)} -37 C ${r1(-26 * d)} -25 ${r1(-18 * d)} -14 ${r1(-5 * d)} -5 C ${r1(-13 * d)} -15 ${r1(-19 * d)} -28 ${r1(-19 * d)} -44 Z`}
              fill={sk.shadow}
              opacity={0.58}
            />

            {renderModernSeriesEye({
              clipId: nearEyeId,
              cx: nearEyeX,
              cy: -48,
              rx: 9.0,
              ry: 5.2,
              tiltDeg: isRight ? -3 : 3,
              emotion: em,
              blink,
              gazeX,
              gazeY,
              sideBias: d,
            })}
            {renderModernSeriesEye({
              clipId: farEyeId,
              cx: farEyeX,
              cy: -48,
              rx: 6.8,
              ry: 4.9,
              tiltDeg: isRight ? 3 : -3,
              emotion: em,
              blink,
              gazeX,
              gazeY,
              sideBias: d,
            })}

            <path
              d={`M ${r1(nearEyeX - 9.5 * d)} ${r1(browY + em.browInnerTilt * 0.25)} Q ${r1(nearEyeX)} ${r1(browY - 2.2)} ${r1(nearEyeX + 9 * d)} ${r1(browY + em.browInnerTilt * 0.5)}`}
              fill="none"
              stroke={hr.ink}
              strokeWidth={1.95}
              strokeLinecap="round"
            />
            <path
              d={`M ${r1(farEyeX - 7 * d)} ${r1(browY + em.browInnerTilt * 0.5)} Q ${r1(farEyeX)} ${r1(browY - 2.0)} ${r1(farEyeX + 7 * d)} ${r1(browY + em.browInnerTilt * 0.25)}`}
              fill="none"
              stroke={hr.ink}
              strokeWidth={1.85}
              strokeLinecap="round"
            />

            <path
              d={`M ${r1(noseX)} -41 L ${r1(noseX + 4.8 * d)} -31 L ${r1(noseX - 0.5 * d)} -29`}
              fill="none"
              stroke={sk.ink}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`M ${r1(noseX)} -41 L ${r1(noseX + 4.2 * d)} -31 L ${r1(noseX - 0.5 * d)} -29 Z`}
              fill={sk.shadow}
              opacity={0.78}
            />

            {renderVisemeMouth(7 * d, -17, viseme, emotion, isRight ? 'three-quarter-right' : 'three-quarter-left')}
          </g>
        );
      })()}
    </g>
  );
};

/**
 * Tousled organic anime hair silhouette with asymmetric lock widths (no uniform W-teeth or side helmet tabs).
 * Head origin is (0, -644) = chinY.
 */
export const ArgaFrontHair: React.FC<ArgaHeadProps> = ({
  view,
  headTiltDeg,
  hairSway,
}) => {
  if (view === 'back') {
    return null;
  }
  const hr = ARGA_PALETTE.hair;
  const sw = r1(hairSway * 1.9);

  return (
    <g transform={`translate(0, -644) rotate(${r1(headTiltDeg)}, 0, 22)`}>
      {view === 'front' && (
        <g>
          {/* Fluffy tousled crown silhouette breaking upper contour organically */}
          <path
            d={`M -34 -50 C -39 -74 -34 -94 -22 -103 L -24 -109 L -12 -106 L -3 -111 L 4 -105 L 15 -111 L 20 -103 C 33 -96 39 -78 35 -50 C 35 -44 33 -42 30 -52 C 26 -62 21 -67 16 -56 C 12 -65 6 -72 -1 -56 C -6 -66 -12 -64 -16 -52 C -21 -64 -26 -64 -30 -48 C -32 -44 -34 -46 -34 -50 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.85}
            strokeLinejoin="round"
          />
          {/* Close-hugging tapered temple sideburns (NOT sticking out wide!) */}
          <path
            d={`M -34 -52 L -31 -22 L -26 -35 L -27 -50 Z M 34 -52 L 31 -22 L 26 -35 L 27 -50 Z`}
            fill={hr.shadow}
            stroke={hr.ink}
            strokeWidth={1.35}
            strokeLinejoin="round"
          />
          {/* Asymmetric hanging bridge lock + temple accent wisp */}
          <path
            d={`M -3 -78 C -1 -64 1 -51 2 -41 C 5 -51 6 -63 4 -76 Z M 15 -78 C 19 -66 22 -52 22 -42 C 25 -54 25 -66 23 -76 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
          <path
            d="M -25 -77 L -13 -83 L -2 -76 L 10 -83 L 22 -76 L 18 -70 L 8 -77 L -3 -71 L -14 -77 L -23 -72 Z"
            fill={hr.highlight}
            opacity={0.48}
          />
          <path
            d={`M -16 -70 Q ${r1(-17 + sw * 0.35)} -56 ${r1(-15 + sw * 0.5)} -46`}
            fill="none"
            stroke={hr.ink}
            strokeWidth={1.0}
            strokeLinecap="round"
          />
        </g>
      )}

      {view === 'three-quarter-right' && (
        <g>
          {/* Three-quarter right: swept layered dark navy fringe & broken crown silhouette */}
          <path
            d={`M -33 -48 C -38 -74 -30 -96 -18 -104 L -20 -110 L -7 -106 L 3 -112 L 10 -105 L 22 -108 L 24 -99 C 34 -90 35 -72 32 -54 C 28 -64 23 -66 19 -54 C 13 -66 6 -70 -2 -52 C -8 -66 -15 -66 -20 -51 C -25 -62 -29 -58 -31 -46 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.85}
            strokeLinejoin="round"
          />
          <path
            d={`M -33 -52 L ${r1(-29 + sw * 0.3)} -20 L -24 -32 L -25 -48 Z`}
            fill={hr.shadow}
            stroke={hr.ink}
            strokeWidth={1.35}
            strokeLinejoin="round"
          />
          <path
            d="M 1 -78 C 5 -64 8 -50 9 -39 C 12 -51 12 -65 9 -77 Z"
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
          <path
            d="M -23 -76 L -11 -84 L 2 -76 L 16 -82 L 24 -74 L 18 -69 L 7 -74 L -6 -70 L -19 -70 Z"
            fill={hr.highlight}
            opacity={0.5}
          />
        </g>
      )}

      {view === 'three-quarter-left' && (
        <g>
          {/* Three-quarter left: independently swept asymmetric crown & fringe */}
          <path
            d={`M 33 -48 C 38 -74 29 -96 17 -104 L 19 -110 L 6 -106 L -4 -112 L -11 -105 L -22 -108 L -24 -99 C -34 -90 -35 -72 -32 -54 C -28 -64 -23 -66 -18 -54 C -12 -66 -5 -70 2 -52 C 8 -66 15 -66 20 -51 C 25 -62 29 -58 31 -46 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.85}
            strokeLinejoin="round"
          />
          <path
            d={`M 33 -52 L ${r1(29 + sw * 0.3)} -20 L 24 -32 L 25 -48 Z`}
            fill={hr.shadow}
            stroke={hr.ink}
            strokeWidth={1.35}
            strokeLinejoin="round"
          />
          <path
            d="M -1 -78 C -5 -64 -8 -50 -9 -39 C -12 -51 -12 -65 -9 -77 Z"
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
          <path
            d="M -24 -74 L -12 -82 L 1 -75 L 13 -83 L 23 -75 L 18 -70 L 7 -75 L -6 -70 L -18 -70 Z"
            fill={hr.highlight}
            opacity={0.48}
          />
        </g>
      )}

      {view === 'profile-right' && (
        <g>
          {/* Profile right: organic tousled top & short tapered nape */}
          <path
            d={`M -34 -50 C -39 -78 -26 -102 -8 -106 L -4 -112 L 6 -107 L 17 -109 L 21 -101 C 32 -92 34 -76 31 -62 L ${r1(37 + sw * 0.3)} -55 L 25 -60 L 22 -52 L 15 -63 L 6 -54 L 1 -64 C -6 -53 -10 -34 -13 -28 C -16 -36 -17 -46 -17 -54 L -23 -36 L -28 -48 L -33 -18 C -36 -28 -36 -40 -34 -50 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.85}
            strokeLinejoin="round"
          />
          <path
            d="M -32 -48 C -33 -68 -25 -90 -10 -98 C -20 -78 -23 -52 -22 -34 L -27 -46 Z"
            fill={hr.shadow}
            opacity={0.78}
          />
          <path
            d="M -22 -75 L -9 -84 L 6 -76 L 19 -81 L 24 -73 L 14 -69 L 1 -74 L -14 -69 Z"
            fill={hr.highlight}
            opacity={0.5}
          />
        </g>
      )}

      {view === 'profile-left' && (
        <g>
          {/* Profile left */}
          <path
            d={`M 34 -50 C 39 -78 26 -102 8 -106 L 4 -112 L -6 -107 L -17 -109 L -21 -101 C -32 -92 -34 -76 -31 -62 L ${r1(-36 + sw * 0.3)} -55 L -24 -60 L -21 -52 L -14 -63 L -6 -54 L 1 -64 C 7 -52 10 -33 13 -27 C 16 -35 17 -45 17 -54 L 23 -35 L 28 -48 L 33 -17 C 36 -28 36 -40 34 -50 Z`}
            fill={hr.base}
            stroke={hr.ink}
            strokeWidth={1.85}
            strokeLinejoin="round"
          />
          <path
            d="M 32 -48 C 33 -68 25 -90 10 -98 C 20 -78 23 -52 22 -34 L 27 -46 Z"
            fill={hr.shadow}
            opacity={0.78}
          />
          <path
            d="M -22 -74 L -10 -81 L 4 -75 L 16 -82 L 23 -74 L 13 -70 L -2 -74 L -15 -69 Z"
            fill={hr.highlight}
            opacity={0.48}
          />
        </g>
      )}
    </g>
  );
};
