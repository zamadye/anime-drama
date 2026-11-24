import { solveTwoBoneIK, type Vec2 } from '../animation/TwoBoneIK';
import { applyEasing, clamp01, lerp, r1 } from '../engine/math';

export type StagePoint = {
  x: number;
  y: number;
};

export type FootstepAnchor = {
  plantFrame: number;
  liftFrame: number;
  stageX: number;
  stageY: number;
  heelStrikeDeg?: number;
  toeOffDeg?: number;
};

export type FootContactState = {
  stagePos: StagePoint;
  isPlanted: boolean;
  pitchDeg: number;
  clearancePx: number;
  activeAnchorIndex: number;
};

export type IKChainResult = {
  root: Vec2;
  joint: Vec2;
  end: Vec2;
  upperAngleDeg: number;
  lowerAngleDeg: number;
  lengthA: number;
  lengthB: number;
  actualDist: number;
  clamped: boolean;
  clampExcessPx: number;
};

const deg = (r: number) => (r * 180) / Math.PI;

export const stageToActorLocal = (
  stagePt: StagePoint,
  actorRootStage: StagePoint,
  actorScale: number,
): Vec2 => {
  const s = Math.max(0.05, actorScale);
  return {
    x: r1((stagePt.x - actorRootStage.x) / s),
    y: r1((stagePt.y - actorRootStage.y) / s),
  };
};

export const actorLocalToStage = (
  localPt: Vec2,
  actorRootStage: StagePoint,
  actorScale: number,
): StagePoint => ({
  x: r1(actorRootStage.x + localPt.x * actorScale),
  y: r1(actorRootStage.y + localPt.y * actorScale),
});

export const solveLimbIK = (
  root: Vec2,
  target: Vec2,
  lengthA: number,
  lengthB: number,
  bend: 1 | -1,
): IKChainResult => {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const rawDist = Math.hypot(dx, dy);
  const minDist = Math.abs(lengthA - lengthB) + 1e-3;
  const maxDist = lengthA + lengthB - 1e-3;
  const solved = solveTwoBoneIK(root, target, lengthA, lengthB, bend);

  const clampedUpper = rawDist > maxDist;
  const clampedLower = rawDist < minDist;
  const clampExcessPx = clampedUpper
    ? r1(rawDist - maxDist)
    : clampedLower
      ? r1(minDist - rawDist)
      : 0;

  const endX = clampedUpper || clampedLower
    ? root.x + ((dx / (rawDist || 1)) * solved.reach)
    : target.x;
  const endY = clampedUpper || clampedLower
    ? root.y + ((dy / (rawDist || 1)) * solved.reach)
    : target.y;

  return {
    root: { x: r1(root.x), y: r1(root.y) },
    joint: { x: r1(solved.elbow.x), y: r1(solved.elbow.y) },
    end: { x: r1(endX), y: r1(endY) },
    upperAngleDeg: r1(deg(Math.atan2(solved.elbow.y - root.y, solved.elbow.x - root.x))),
    lowerAngleDeg: r1(deg(Math.atan2(endY - solved.elbow.y, endX - solved.elbow.x))),
    lengthA,
    lengthB,
    actualDist: r1(rawDist),
    clamped: clampExcessPx > 0.05,
    clampExcessPx,
  };
};

/**
 * Evaluates a leg IK chain choosing the bend side that keeps the knee pointing
 * forward relative to `facingDir` (1 = stage right, -1 = stage left).
 */
export const solveLegChain = (
  hipLocal: Vec2,
  ankleLocal: Vec2,
  thighLength: number,
  shinLength: number,
  facingDir: 1 | -1,
): IKChainResult => {
  const optA = solveLimbIK(hipLocal, ankleLocal, thighLength, shinLength, -1);
  const optB = solveLimbIK(hipLocal, ankleLocal, thighLength, shinLength, 1);
  if (facingDir >= 0) {
    return optA.joint.x >= optB.joint.x ? optA : optB;
  }
  return optA.joint.x <= optB.joint.x ? optA : optB;
};

/**
 * Evaluates an arm IK chain choosing the bend side matching anatomical elbow direction.
 */
export const solveArmChain = (
  shoulderLocal: Vec2,
  wristLocal: Vec2,
  upperArmLength: number,
  forearmLength: number,
  elbowBackDir: 1 | -1,
): IKChainResult => {
  const optA = solveLimbIK(shoulderLocal, wristLocal, upperArmLength, forearmLength, -1);
  const optB = solveLimbIK(shoulderLocal, wristLocal, upperArmLength, forearmLength, 1);
  if (elbowBackDir < 0) {
    return optA.joint.x <= optB.joint.x ? optA : optB;
  }
  return optA.joint.x >= optB.joint.x ? optA : optB;
};

/**
 * Evaluates stage-space foot contact with zero drift inside stance intervals
 * and smooth parabolic swing arc with heel-strike / toe-off boot pitch.
 */
export const evaluateFootContact = (
  anchors: readonly FootstepAnchor[],
  frame: number,
  swingClearancePx = 38,
): FootContactState => {
  if (anchors.length === 0) {
    return {
      stagePos: { x: 0, y: 0 },
      isPlanted: true,
      pitchDeg: 0,
      clearancePx: 0,
      activeAnchorIndex: -1,
    };
  }

  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    if (frame >= a.plantFrame && frame <= a.liftFrame) {
      const span = Math.max(1, a.liftFrame - a.plantFrame);
      const t = clamp01((frame - a.plantFrame) / span);
      const heelStrike = a.heelStrikeDeg ?? 0;
      const toeOff = a.toeOffDeg ?? 0;
      let pitchDeg = 0;
      if (t < 0.22) {
        pitchDeg = lerp(heelStrike, 0, clamp01(t / 0.22));
      } else if (t > 0.78) {
        pitchDeg = lerp(0, toeOff, clamp01((t - 0.78) / 0.22));
      }
      return {
        stagePos: { x: a.stageX, y: a.stageY },
        isPlanted: true,
        pitchDeg: r1(pitchDeg),
        clearancePx: 0,
        activeAnchorIndex: i,
      };
    }
  }

  if (frame < anchors[0].plantFrame) {
    return {
      stagePos: { x: anchors[0].stageX, y: anchors[0].stageY },
      isPlanted: true,
      pitchDeg: 0,
      clearancePx: 0,
      activeAnchorIndex: 0,
    };
  }

  for (let i = 0; i < anchors.length - 1; i++) {
    const prev = anchors[i];
    const next = anchors[i + 1];
    if (frame > prev.liftFrame && frame < next.plantFrame) {
      const span = Math.max(1, next.plantFrame - prev.liftFrame);
      const u = clamp01((frame - prev.liftFrame) / span);
      const easedX = applyEasing(u, 'easeInOutCubic');
      const liftArc = Math.sin(u * Math.PI);
      const stepDist = Math.abs(next.stageX - prev.stageX);
      const clearance = Math.min(swingClearancePx, Math.max(10, stepDist * 0.24)) * liftArc;
      const startPitch = prev.toeOffDeg ?? 14;
      const endPitch = next.heelStrikeDeg ?? -11;
      const pitchDeg = lerp(startPitch, endPitch, applyEasing(u, 'easeInOut'));
      return {
        stagePos: {
          x: r1(lerp(prev.stageX, next.stageX, easedX)),
          y: r1(lerp(prev.stageY, next.stageY, easedX) - clearance),
        },
        isPlanted: false,
        pitchDeg: r1(pitchDeg),
        clearancePx: r1(clearance),
        activeAnchorIndex: -1,
      };
    }
  }

  const last = anchors[anchors.length - 1];
  return {
    stagePos: { x: last.stageX, y: last.stageY },
    isPlanted: true,
    pitchDeg: 0,
    clearancePx: 0,
    activeAnchorIndex: anchors.length - 1,
  };
};
