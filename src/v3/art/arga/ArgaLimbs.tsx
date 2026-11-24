import React from 'react';
import { lerp as lerpLinear, r1 } from '../../../engine/math';
import type { HandShape, ViewAngle } from '../../contracts';
import type { IKChainResult } from '../../kinematics';
import { ARGA_PALETTE } from './argaTokens';
import { ArgaHand } from './ArgaHands';

type Pt = { x: number; y: number };

const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (v: Pt, s: number): Pt => ({ x: v.x * s, y: v.y * s });
const perpRight = (a: Pt, b: Pt): Pt => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
};
const mixPt = (a: Pt, b: Pt, t: number): Pt => ({
  x: r1(a.x + (b.x - a.x) * t),
  y: r1(a.y + (b.y - a.y) * t),
});
const pt = (p: Pt): string => `${r1(p.x)} ${r1(p.y)}`;

const buildTaperedTube = (
  a: Pt,
  b: Pt,
  rA: number,
  rMid: number,
  rB: number,
  shadowSide: 1 | -1,
) => {
  const n = perpRight(a, b);
  const d = sub(b, a);
  const mid = mixPt(a, b, 0.48);

  const aL = add(a, scale(n, -rA));
  const aR = add(a, scale(n, rA));
  const mL = add(mid, scale(n, -rMid));
  const mR = add(mid, scale(n, rMid));
  const bL = add(b, scale(n, -rB));
  const bR = add(b, scale(n, rB));

  const c1L = add(add(a, scale(d, 0.25)), scale(n, -rMid * 1.03));
  const c2L = add(add(a, scale(d, 0.72)), scale(n, -(rMid * 0.55 + rB * 0.45)));
  const c1R = add(add(a, scale(d, 0.72)), scale(n, rMid * 0.55 + rB * 0.45));
  const c2R = add(add(a, scale(d, 0.25)), scale(n, rMid * 1.03));

  const mainD = [
    `M ${pt(aL)}`,
    `C ${pt(c1L)} ${pt(mL)} ${pt(mL)}`,
    `C ${pt(mL)} ${pt(c2L)} ${pt(bL)}`,
    `L ${pt(bR)}`,
    `C ${pt(c1R)} ${pt(mR)} ${pt(mR)}`,
    `C ${pt(mR)} ${pt(c2R)} ${pt(aR)}`,
    'Z',
  ].join(' ');

  // Cel shadow along trailing edge of limb
  const outer = shadowSide > 0 ? [aR, mR, bR] : [aL, mL, bL];
  const innerA = add(a, scale(n, shadowSide * rA * 0.15));
  const innerMid = add(mid, scale(n, shadowSide * rMid * 0.22));
  const innerB = add(b, scale(n, shadowSide * rB * 0.15));

  const shadowD = [
    `M ${pt(outer[0])}`,
    `Q ${pt(outer[1])} ${pt(outer[2])}`,
    `L ${pt(innerB)}`,
    `Q ${pt(innerMid)} ${pt(innerA)}`,
    'Z',
  ].join(' ');

  // Restrained highlight edge on lit side
  const litEdge = shadowSide > 0 ? [mixPt(a, mL, 0.18), mixPt(mid, bL, 0.65)] : [mixPt(a, mR, 0.18), mixPt(mid, bR, 0.65)];
  const highlightD = `M ${pt(litEdge[0])} L ${pt(litEdge[1])}`;

  return { mainD, shadowD, highlightD };
};

export interface ArgaLegProps {
  chain: IKChainResult;
  bootPitchDeg: number;
  view: ViewAngle;
  side: 'left' | 'right';
  isFarSide: boolean;
}

export const ArgaLeg: React.FC<ArgaLegProps> = ({
  chain,
  bootPitchDeg,
  view,
  side,
  isFarSide,
}) => {
  const tr = ARGA_PALETTE.trousers;
  const bt = ARGA_PALETTE.boots;

  const isProfile = view === 'profile-right' || view === 'profile-left';
  const facingLeft = view === 'profile-left' || view === 'three-quarter-left';
  const bootDir = view === 'front' ? (side === 'left' ? 1 : -1) : view === 'back' ? (side === 'left' ? -1 : 1) : facingLeft ? -1 : 1;
  const shadowSide: 1 | -1 = facingLeft ? 1 : -1;

  const hip = chain.root;
  // In straight front/back standing views, keep knee aligned naturally along the leg line
  // instead of jutting sideways like a profile knee bend.
  const isFrontOrBack = view === 'front' || view === 'back';
  const knee = isFrontOrBack
    ? {
        x: r1(lerpLinear(hip.x, chain.end.x, 0.52) + (side === 'left' ? 2.5 : -2.5) * (view === 'back' ? -1 : 1)),
        y: r1(lerpLinear(hip.y, chain.end.y, 0.52)),
      }
    : chain.joint;
  const ankle = chain.end;

  // Trouser taper matches Option B slim straight cut with natural knee mass
  const thighR = isProfile ? 25.5 : 23;
  const kneeR = isProfile ? 17.5 : 16.5;
  const ankleR = isProfile ? 13.8 : 13.2;

  const thigh = buildTaperedTube(hip, knee, thighR, thighR * 0.88, kneeR, shadowSide);
  const shin = buildTaperedTube(knee, { x: ankle.x, y: ankle.y + 4 }, kneeR * 0.96, kneeR * 0.86, ankleR, shadowSide);

  const kneeFlex = Math.abs(chain.lowerAngleDeg - chain.upperAngleDeg);
  const creaseScale = Math.min(1.4, 0.55 + kneeFlex / 48);

  return (
    <g opacity={isFarSide ? 0.96 : 1}>
      {/* Upper hip socket dome to seal groin/belt transition */}
      <circle cx={r1(hip.x)} cy={r1(hip.y + 4)} r={r1(thighR * 0.92)} fill={isFarSide ? tr.shadow : tr.base} />

      {/* Upper trouser thigh */}
      <path d={thigh.mainD} fill={isFarSide ? tr.shadow : tr.base} stroke={tr.ink} strokeWidth={1.9} strokeLinejoin="round" />
      <path d={thigh.shadowD} fill={tr.shadow} opacity={isFarSide ? 0.55 : 0.88} />
      {!isFarSide && (
        <path d={thigh.highlightD} stroke={tr.highlight} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
      )}

      {/* Articulated knee cap sealing upper & lower trouser bend */}
      <circle cx={r1(knee.x)} cy={r1(knee.y)} r={r1(kneeR - 0.5)} fill={isFarSide ? tr.shadow : tr.base} />

      {/* Lower trouser shin */}
      <path d={shin.mainD} fill={isFarSide ? tr.shadow : tr.base} stroke={tr.ink} strokeWidth={1.9} strokeLinejoin="round" />
      <path d={shin.shadowD} fill={tr.shadow} opacity={isFarSide ? 0.55 : 0.85} />
      {!isFarSide && (
        <path d={shin.highlightD} stroke={tr.highlight} strokeWidth={2.0} strokeLinecap="round" opacity={0.5} />
      )}

      {/* Purposeful trouser fabric folds at knee & ankle break */}
      <path
        d={`M ${r1(knee.x - 7 * shadowSide)} ${r1(knee.y - 3)} Q ${r1(knee.x)} ${r1(knee.y + 4 * creaseScale)} ${r1(knee.x + 7 * shadowSide)} ${r1(knee.y - 1)}`}
        fill="none"
        stroke={tr.ink}
        strokeWidth={1.05}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d={`M ${r1(ankle.x - ankleR * 0.65)} ${r1(ankle.y - 10)} Q ${r1(ankle.x)} ${r1(ankle.y - 5)} ${r1(ankle.x + ankleR * 0.72)} ${r1(ankle.y - 8)}`}
        fill="none"
        stroke={tr.ink}
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.75}
      />

      {/* Sculpted dark brown lace-up leather boot anchored at ankle joint with sole at ankle.y + 30 */}
      <g transform={`translate(${r1(ankle.x)}, ${r1(ankle.y)}) rotate(${r1(bootPitchDeg)})`}>
        {view === 'front' || view === 'back' ? (
          <g transform={`scale(${bootDir}, 1)`}>
            {/* Front / slightly turned three-quarter boot silhouette */}
            <path
              d="M -12 -6 L 12 -6 L 14.5 14 C 17 20 18.5 24.5 15.5 29 L -13.5 29 C -15 24 -13.2 16 -12 -6 Z"
              fill={isFarSide ? bt.shadow : bt.base}
              stroke={bt.ink}
              strokeWidth={1.85}
              strokeLinejoin="round"
            />
            {/* Boot cel shadow plane */}
            <path
              d="M 2 -5 L 11.5 -5 L 13.8 14 C 16 20 16.5 24.5 14 27.5 L 1 27.5 Z"
              fill={bt.shadow}
              opacity={0.85}
            />
            {/* Heavy dark sole */}
            <path
              d="M -14 24.5 L 16 24.5 L 16.2 30 L -14.2 30 Z"
              fill={bt.sole}
              stroke={bt.ink}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            {view === 'front' && (
              <>
                <path
                  d="M -4 2 L 4 2 M -4 7 L 4 7 M -4 12 L 4 12"
                  stroke={bt.ink}
                  strokeWidth={1.15}
                  strokeLinecap="round"
                />
                <path
                  d="M -7 18 C -2 16 5 16.5 9 19"
                  fill="none"
                  stroke={bt.highlight}
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              </>
            )}
          </g>
        ) : (
          <g transform={`scale(${bootDir}, 1)`}>
            {/* Profile / 3/4 right or left leather derby boot (sole bottom strictly at y = 30) */}
            <path
              d="M -14 -7 L 11 -7 C 13 4 16 11 26 16.5 C 33 19.5 34.5 23 32.5 26.5 L -15.5 26.5 C -16.5 20 -15 8 -14 -7 Z"
              fill={isFarSide ? bt.shadow : bt.base}
              stroke={bt.ink}
              strokeWidth={1.85}
              strokeLinejoin="round"
            />
            {/* Instep & heel shadow */}
            <path
              d="M -13.5 10 L -1.5 10 C 3 18 11 22 25 22.5 L 31.5 24.5 L 31 26 L -14.5 26 Z"
              fill={bt.shadow}
              opacity={0.88}
            />
            {/* Highlight ridge over toe cap & vamp */}
            <path
              d="M 10 9 C 14 14 20 17 28 19.5"
              fill="none"
              stroke={bt.highlight}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.78}
            />
            {/* Lace eye ticks */}
            <path
              d="M 5 -1 L 10 1 M 6 4 L 11.5 6 M 7.5 9 L 13 10.5"
              stroke={bt.ink}
              strokeWidth={1.15}
              strokeLinecap="round"
            />
            {/* Stacked heel & lugged outsole */}
            <path
              d="M -16 25.5 L 33 25.5 L 32.5 29.8 L 8 29.8 L 4 28.4 L -2.5 28.4 L -4 30 L -16 30 Z"
              fill={bt.sole}
              stroke={bt.ink}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>

      {/* Trouser hem cuff overlapping top of boot cleanly */}
      <path
        d={`M ${r1(ankle.x - ankleR - 1)} ${r1(ankle.y - 3)} Q ${r1(ankle.x)} ${r1(ankle.y + 3)} ${r1(ankle.x + ankleR + 1)} ${r1(ankle.y - 2)}`}
        fill={isFarSide ? tr.shadow : tr.base}
        stroke={tr.ink}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </g>
  );
};

export interface ArgaArmProps {
  chain: IKChainResult;
  handShape: HandShape;
  handAngleDeg?: number;
  side: 'left' | 'right';
  view: ViewAngle;
  isFarSide: boolean;
}

export const ArgaArm: React.FC<ArgaArmProps> = ({
  chain,
  handShape,
  handAngleDeg,
  side,
  view,
  isFarSide,
}) => {
  const ct = ARGA_PALETTE.coat;
  const sh = ARGA_PALETTE.shirt;

  const isProfile = view === 'profile-right' || view === 'profile-left';
  const facingLeft = view === 'profile-left' || view === 'three-quarter-left';
  const shadowSide: 1 | -1 = facingLeft ? 1 : -1;

  const shoulder = chain.root;
  const elbow = chain.joint;
  const wrist = chain.end;

  const shoulderR = isProfile ? 19.5 : 18;
  const elbowR = 14.5;
  const cuffR = 11.5;

  const upper = buildTaperedTube(shoulder, elbow, shoulderR, elbowR * 1.08, elbowR, shadowSide);
  const fore = buildTaperedTube(elbow, wrist, elbowR, elbowR * 0.94, cuffR, shadowSide);

  const foreDirDeg = chain.lowerAngleDeg;
  const resolvedHandRot = handAngleDeg ?? (foreDirDeg - 90);

  return (
    <g opacity={isFarSide ? 0.96 : 1}>
      {/* Seamless hidden shoulder cap (no harsh outer stroke so coat shoulder blends cleanly) */}
      <circle
        cx={r1(shoulder.x)}
        cy={r1(shoulder.y + 3)}
        r={r1(shoulderR - 0.8)}
        fill={isFarSide ? ct.shadow : ct.base}
      />

      {/* Upper sleeve */}
      <path d={upper.mainD} fill={isFarSide ? ct.shadow : ct.base} stroke={ct.ink} strokeWidth={1.85} strokeLinejoin="round" />
      <path d={upper.shadowD} fill={ct.shadow} opacity={isFarSide ? 0.55 : 0.86} />
      {!isFarSide && (
        <path d={upper.highlightD} stroke={ct.highlight} strokeWidth={2.0} strokeLinecap="round" opacity={0.58} />
      )}

      {/* Elbow cap + sleeve bend fold */}
      <circle cx={r1(elbow.x)} cy={r1(elbow.y)} r={r1(elbowR - 0.5)} fill={isFarSide ? ct.shadow : ct.base} />

      {/* Forearm sleeve */}
      <path d={fore.mainD} fill={isFarSide ? ct.shadow : ct.base} stroke={ct.ink} strokeWidth={1.85} strokeLinejoin="round" />
      <path d={fore.shadowD} fill={ct.shadow} opacity={isFarSide ? 0.55 : 0.86} />
      {!isFarSide && (
        <path d={fore.highlightD} stroke={ct.highlight} strokeWidth={1.8} strokeLinecap="round" opacity={0.52} />
      )}

      {/* Elbow cloth tension crease */}
      <path
        d={`M ${r1(elbow.x - 7)} ${r1(elbow.y - 2)} Q ${r1(elbow.x)} ${r1(elbow.y + 4)} ${r1(elbow.x + 7)} ${r1(elbow.y - 1)}`}
        fill="none"
        stroke={ct.ink}
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.78}
      />

      {/* Hand mounted at wrist before shirt cuff cap */}
      <g transform={`translate(${r1(wrist.x)}, ${r1(wrist.y)}) rotate(${r1(resolvedHandRot)})`}>
        <ArgaHand shape={handShape} side={side} view={view} />
      </g>

      {/* Crisp gray shirt cuff + coat sleeve cuff trim */}
      <g transform={`translate(${r1(wrist.x)}, ${r1(wrist.y)}) rotate(${r1(foreDirDeg - 90)})`}>
        <path
          d={`M ${-cuffR + 2} -4 L ${cuffR - 2} -4 L ${cuffR - 3.5} 3.5 C 0 5 -0.5 5 ${-cuffR + 3.5} 3.5 Z`}
          fill={sh.base}
          stroke={sh.ink}
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
        <path
          d={`M ${-cuffR - 0.5} -12 L ${cuffR + 0.5} -12 L ${cuffR} -2 C 0 0 0 0 ${-cuffR} -2 Z`}
          fill={isFarSide ? ct.shadow : ct.base}
          stroke={ct.ink}
          strokeWidth={1.65}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};
