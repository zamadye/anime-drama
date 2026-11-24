import { applyEasing, clamp01, lerp, multiHarmonicWave, r1, smoothstep } from '../engine/math';
import { computeHairPhysics } from '../engine/physics';
import { ARGA_STUDY_DIALOGUE_TRACK, sampleVerifiedViseme } from './audio/argaStudyDialogue';
import {
  ARGA_CANONICAL_DIMENSIONS,
  type ArgaActorPoseProps,
  getArgaJointLayout,
} from './art/arga';
import type { EmotionId, HandShape, ViewAngle, VisemeId } from './contracts';
import {
  evaluateFootContact,
  solveArmChain,
  solveLegChain,
  stageToActorLocal,
  type FootContactState,
  type FootstepAnchor,
  type IKChainResult,
} from './kinematics';

export const ARGA_MOTION_STUDY_FPS = 24;
export const ARGA_MOTION_STUDY_FRAMES = 192; // 8.0 seconds
export const STAGE_FLOOR_Y = 935;
export const ARGA_STUDY_SCALE = 0.72;

export type StudyPhase =
  | 'walk'
  | 'stop-settle'
  | 'turn'
  | 'dialogue-gesture'
  | 'exhale-hold';

export type EvaluatedArgaStudyFrame = {
  frame: number;
  phase: StudyPhase;
  view: ViewAngle;
  emotion: EmotionId;
  viseme: VisemeId;
  actor: ArgaActorPoseProps;
  footContacts: {
    left: FootContactState;
    right: FootContactState;
    leftActualStageAnkle: { x: number; y: number };
    rightActualStageAnkle: { x: number; y: number };
    maxTargetErrorPx: number;
  };
  ikDiagnostics: {
    anyClamped: boolean;
    chains: Record<'leftLeg' | 'rightLeg' | 'leftArm' | 'rightArm', IKChainResult>;
  };
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
};

// Stage-space planted footsteps guaranteeing <= 2px (target 0px) floor contact drift.
// Right side ends viewer-LEFT (938); Left side ends viewer-RIGHT (982) for front stance.
export const ARGA_STUDY_RIGHT_FOOTSTEPS: readonly FootstepAnchor[] = [
  { plantFrame: 0, liftFrame: 15, stageX: 598, stageY: STAGE_FLOOR_Y, heelStrikeDeg: 0, toeOffDeg: 13 },
  { plantFrame: 29, liftFrame: 45, stageX: 792, stageY: STAGE_FLOOR_Y, heelStrikeDeg: -12, toeOffDeg: 14 },
  { plantFrame: 58, liftFrame: 192, stageX: 938, stageY: STAGE_FLOOR_Y, heelStrikeDeg: -10, toeOffDeg: 0 },
];

export const ARGA_STUDY_LEFT_FOOTSTEPS: readonly FootstepAnchor[] = [
  { plantFrame: -14, liftFrame: -1, stageX: 510, stageY: STAGE_FLOOR_Y, heelStrikeDeg: 0, toeOffDeg: 14 },
  { plantFrame: 13, liftFrame: 31, stageX: 696, stageY: STAGE_FLOOR_Y, heelStrikeDeg: -12, toeOffDeg: 14 },
  { plantFrame: 43, liftFrame: 59, stageX: 888, stageY: STAGE_FLOOR_Y, heelStrikeDeg: -12, toeOffDeg: 13 },
  { plantFrame: 70, liftFrame: 82, stageX: 986, stageY: STAGE_FLOOR_Y, heelStrikeDeg: -8, toeOffDeg: 0 },
  { plantFrame: 92, liftFrame: 192, stageX: 982, stageY: STAGE_FLOOR_Y, heelStrikeDeg: -3, toeOffDeg: 0 },
];

const sampleWindowedCurve = (
  frame: number,
  waypoints: readonly [number, number][],
): number => {
  if (frame <= waypoints[0][0]) return waypoints[0][1];
  const last = waypoints[waypoints.length - 1];
  if (frame >= last[0]) return last[1];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [f0, v0] = waypoints[i];
    const [f1, v1] = waypoints[i + 1];
    if (frame >= f0 && frame <= f1) {
      const t = (frame - f0) / Math.max(1, f1 - f0);
      return lerp(v0, v1, applyEasing(t, 'easeInOut'));
    }
  }
  return last[1];
};

const evaluateStudyBlink = (frame: number): number => {
  // Planned deliberate blinks: walk transition f34, turn head lead mask f79 & f90, calm post-speech f169
  const pulse = (center: number, halfWidth: number) => {
    const dist = Math.abs(frame - center);
    if (dist > halfWidth) return 0;
    return clamp01(Math.cos((dist / halfWidth) * (Math.PI / 2)) ** 1.6);
  };
  return Math.max(
    pulse(34, 2.5),
    pulse(79, 2.2),
    pulse(90, 2.2),
    pulse(169, 3.0),
  );
};

/**
 * Pure deterministic evaluation of Arga's 8-second motion study following the
 * V3 evaluation order:
 * 1. Clip/root trajectory
 * 2. Authored acting pose
 * 3. Contact/IK constraints
 * 4. Expression & audio-verified viseme
 * 5. Secondary motion
 * 6. Fixed camera
 */
export const evaluateArgaStudyFrame = (
  frame: number,
  fps = ARGA_MOTION_STUDY_FPS,
  instanceId = 'arga-study-main',
): EvaluatedArgaStudyFrame => {
  const f = Math.max(0, Math.min(ARGA_MOTION_STUDY_FRAMES - 1, Math.round(frame)));
  const dim = ARGA_CANONICAL_DIMENSIONS;

  // ── 1. CLIP / ROOT TRAJECTORY ────────────────────────────────────────────
  const rootStageX = r1(
    sampleWindowedCurve(f, [
      [0, 562],
      [14, 647],
      [30, 744],
      [44, 840],
      [58, 926],
      [70, 962], // gentle deceleration overshoot
      [78, 960],
      [105, 956], // slight melancholic hip weight shift toward right leg while speaking
      [162, 957],
      [191, 959],
    ]),
  );

  // Subtle vertical gait compression (kept within knee-flex envelope so ZERO IK clamping)
  let walkDropY = 2;
  if (f < 58) {
    const cycle = Math.sin((f / 14.5) * Math.PI);
    walkDropY = 20 - Math.abs(cycle) * 8; // contact lower (+20), passing higher (+12)
  } else if (f < 72) {
    const u = smoothstep((f - 58) / 14);
    walkDropY = lerp(20, 2, u);
  } else {
    walkDropY = 2 + multiHarmonicWave(f, fps, 0.24, 0.4) * 1.0;
  }
  const pelvisDropY = r1(walkDropY);

  const rootVelocityX =
    f < 56 ? 6.8 : f < 72 ? lerp(6.8, 0, smoothstep((f - 56) / 16)) : 0;

  // ── 2. AUTHORED ACTING POSE & LEAD-FOLLOW VIEW TURN ──────────────────────
  const phase: StudyPhase =
    f < 56
      ? 'walk'
      : f < 72
        ? 'stop-settle'
        : f < 98
          ? 'turn'
          : f < 158
            ? 'dialogue-gesture'
            : 'exhale-hold';

  // Head leads turn at f79, shoulders/torso follow through three-quarter at f90 (masked on blink!)
  const view: ViewAngle =
    f < 79 ? 'profile-right' : f < 90 ? 'three-quarter-right' : 'front';

  const torsoLeanDeg = r1(
    f < 56
      ? 3.2
      : f < 72
        ? lerp(3.2, -0.4, smoothstep((f - 56) / 16))
        : f < 98
          ? lerp(-0.4, 0.8, smoothstep((f - 72) / 26))
          : f < 160
            ? 1.1 + Math.sin(((f - 98) / 30) * Math.PI) * 1.0
            : lerp(1.1, 1.8, smoothstep((f - 160) / 31)),
  );

  // Head tilts thoughtfully while turning and delivering lines
  const headTiltDeg = r1(
    f < 72
      ? 1.5
      : f < 98
        ? lerp(1.5, -3.5, smoothstep((f - 72) / 26))
        : f < 158
          ? -3.5 + Math.sin(((f - 98) / 28) * Math.PI) * -2.0
          : lerp(-3.5, 3.2, smoothstep((f - 158) / 33)),
  );

  const shoulderTwistPx = r1(
    f >= 72 && f <= 98 ? Math.sin(((f - 72) / 26) * Math.PI) * 5.5 : 0,
  );

  const emotion: EmotionId =
    f < 80
      ? 'guarded'
      : f < 158
        ? 'melancholy'
        : 'guarded';

  const blink = r1(evaluateStudyBlink(f));
  const gazeX = r1(
    f < 79
      ? 0.28
      : f < 96
        ? lerp(0.28, 0.14, smoothstep((f - 79) / 17))
        : f < 160
          ? 0.12
          : lerp(0.12, -0.05, smoothstep((f - 160) / 31)),
  );
  const gazeY = r1(f >= 160 ? lerp(0, 0.25, smoothstep((f - 160) / 24)) : 0.04);

  // ── 3. CONTACT / IK CONSTRAINTS ──────────────────────────────────────────
  const leftContact = evaluateFootContact(ARGA_STUDY_LEFT_FOOTSTEPS, f, 36);
  const rightContact = evaluateFootContact(ARGA_STUDY_RIGHT_FOOTSTEPS, f, 36);

  const rootStage = { x: rootStageX, y: STAGE_FLOOR_Y };
  const ankleLocalBaseY = dim.ankleRestY; // -30 local -> bottom of boot at 0 local (= STAGE_FLOOR_Y)

  const leftAnkleTargetLocal = stageToActorLocal(
    { x: leftContact.stagePos.x, y: leftContact.stagePos.y - dim.bootHeight * ARGA_STUDY_SCALE },
    rootStage,
    ARGA_STUDY_SCALE,
  );
  const rightAnkleTargetLocal = stageToActorLocal(
    { x: rightContact.stagePos.x, y: rightContact.stagePos.y - dim.bootHeight * ARGA_STUDY_SCALE },
    rootStage,
    ARGA_STUDY_SCALE,
  );
  // Keep vertical alignment exact when foot height offsets round cleanly
  void ankleLocalBaseY;

  const layout = getArgaJointLayout(view, pelvisDropY, torsoLeanDeg);
  const leftLeg = solveLegChain(
    layout.leftHip,
    leftAnkleTargetLocal,
    dim.thighLength,
    dim.shinLength,
    layout.facingDir,
  );
  const rightLeg = solveLegChain(
    layout.rightHip,
    rightAnkleTargetLocal,
    dim.thighLength,
    dim.shinLength,
    layout.facingDir,
  );

  // Authored arm targets in actor-local space with anticipation, gesture hold, emphasis pulse, and settle
  const swingWave = Math.cos((f / 14.5) * Math.PI);
  const walkFade = f < 56 ? 1 : f < 74 ? 1 - smoothstep((f - 56) / 18) : 0;

  // Right arm (viewer-left in front, near arm in walk): delivers open-hand emphasis while speaking
  const rightWristWalk = {
    x: layout.rightShoulder.x - swingWave * 58 * walkFade,
    y: layout.rightShoulder.y + 236 - Math.abs(swingWave) * 14 * walkFade,
  };
  const rightWristRest = {
    x: layout.rightShoulder.x - 16,
    y: layout.rightShoulder.y + 242,
  };
  let rightWristTarget = {
    x: lerp(rightWristRest.x, rightWristWalk.x, walkFade),
    y: lerp(rightWristRest.y, rightWristWalk.y, walkFade),
  };
  let rightHandShape: HandShape = 'relaxed';
  let rightHandAngleDeg: number | undefined = undefined;

  if (f >= 94 && f < 176) {
    if (f < 100) {
      // Anticipation dip down-left before raising hand
      const u = smoothstep((f - 94) / 6);
      rightWristTarget = {
        x: lerp(rightWristRest.x, layout.rightShoulder.x - 24, u),
        y: lerp(rightWristRest.y, layout.rightShoulder.y + 250, u),
      };
    } else if (f < 112) {
      const u = applyEasing((f - 100) / 12, 'easeOut');
      rightWristTarget = {
        x: lerp(layout.rightShoulder.x - 24, layout.rightShoulder.x - 36, u),
        y: lerp(layout.rightShoulder.y + 250, -456, u),
      };
      rightHandShape = u > 0.45 ? 'open' : 'relaxed';
      rightHandAngleDeg = lerp(-12, -138, u);
    } else if (f < 156) {
      // Open dialogue gesture with subtle emphasis beats on "dua jam" (f120..128) & "Kirana" (f138..148)
      const beat1 = f >= 118 && f <= 130 ? Math.sin(((f - 118) / 12) * Math.PI) : 0;
      const beat2 = f >= 136 && f <= 148 ? Math.sin(((f - 136) / 12) * Math.PI) : 0;
      const pulse = beat1 * 12 + beat2 * 14;
      rightWristTarget = {
        x: layout.rightShoulder.x - 36 - pulse * 0.45,
        y: -456 + pulse * 0.85,
      };
      rightHandShape = 'open';
      rightHandAngleDeg = -138 - pulse * 0.9;
    } else {
      const u = smoothstep((f - 156) / 20);
      rightWristTarget = {
        x: lerp(layout.rightShoulder.x - 36, rightWristRest.x, u),
        y: lerp(-456, rightWristRest.y, u),
      };
      rightHandShape = u < 0.45 ? 'open' : 'relaxed';
      rightHandAngleDeg = u < 0.7 ? lerp(-138, 12, u) : undefined;
    }
  }

  // Left arm: counter-swings cleanly in walk, holds supportive poised curve during speech
  const leftWristWalk = {
    x: layout.leftShoulder.x + swingWave * 56 * walkFade,
    y: layout.leftShoulder.y + 236 - Math.abs(swingWave) * 12 * walkFade,
  };
  const leftWristRest = {
    x: layout.leftShoulder.x + (view === 'front' ? 14 : 10),
    y: layout.leftShoulder.y + 242,
  };
  const speechSupportU =
    f >= 98 && f < 158
      ? Math.sin(clamp01((f - 98) / 60) * Math.PI)
      : 0;
  const leftWristTarget = {
    x: r1(lerp(leftWristRest.x, leftWristWalk.x, walkFade) + speechSupportU * 8),
    y: r1(lerp(leftWristRest.y, leftWristWalk.y, walkFade) - speechSupportU * 14),
  };

  // Anatomical elbow direction:
  // In profile-right/3-4-right: walk forward swing pulls elbow slightly back (-1).
  // In front/speaking raise: right arm elbow flares slightly outward-left (-1), left arm outward-right (+1).
  const rightArm = solveArmChain(
    layout.rightShoulder,
    rightWristTarget,
    dim.upperArmLength,
    dim.forearmLength,
    -1,
  );
  const leftArm = solveArmChain(
    layout.leftShoulder,
    leftWristTarget,
    dim.upperArmLength,
    dim.forearmLength,
    view === 'profile-right' ? -1 : 1,
  );

  // ── 4. EXPRESSION & REAL AUDIO VISEME ────────────────────────────────────
  const viseme = sampleVerifiedViseme(ARGA_STUDY_DIALOGUE_TRACK, f);

  // ── 5. SECONDARY MOTION (COAT TAILS & HAIR) ──────────────────────────────
  const hairPhys = computeHairPhysics('arga-v3', f, fps, headTiltDeg, rootVelocityX * 0.12, 0.35);
  const coatTrailDeg = r1(
    -rootVelocityX * 0.58 + hairPhys.coatHemSwayDeg * 0.38 - (f >= 72 && f <= 98 ? 1.8 : 0),
  );
  const windSway = r1(hairPhys.bangsShiftX * 0.25);

  // Convert actual solved ankle back to stage space to audit target tracking numerically
  const leftActualStageAnkle = {
    x: r1(rootStage.x + leftLeg.end.x * ARGA_STUDY_SCALE),
    y: r1(rootStage.y + (leftLeg.end.y + dim.bootHeight) * ARGA_STUDY_SCALE),
  };
  const rightActualStageAnkle = {
    x: r1(rootStage.x + rightLeg.end.x * ARGA_STUDY_SCALE),
    y: r1(rootStage.y + (rightLeg.end.y + dim.bootHeight) * ARGA_STUDY_SCALE),
  };

  const errL = Math.hypot(
    leftActualStageAnkle.x - leftContact.stagePos.x,
    leftActualStageAnkle.y - leftContact.stagePos.y,
  );
  const errR = Math.hypot(
    rightActualStageAnkle.x - rightContact.stagePos.x,
    rightActualStageAnkle.y - rightContact.stagePos.y,
  );

  return {
    frame: f,
    phase,
    view,
    emotion,
    viseme,
    actor: {
      instanceId,
      stageX: rootStageX,
      stageY: STAGE_FLOOR_Y,
      scale: ARGA_STUDY_SCALE,
      view,
      emotion,
      viseme,
      blink,
      gazeX,
      gazeY,
      pelvisDropY,
      torsoLeanDeg,
      headTiltDeg,
      shoulderTwistPx,
      coatTrailDeg,
      hairSway: windSway,
      windSway,
      leftLeg,
      rightLeg,
      leftBootPitchDeg: leftContact.pitchDeg,
      rightBootPitchDeg: rightContact.pitchDeg,
      leftArm,
      rightArm,
      leftHandShape: 'relaxed',
      rightHandShape,
      leftHandAngleDeg: undefined,
      rightHandAngleDeg,
      renderFloorShadow: true,
    },
    footContacts: {
      left: leftContact,
      right: rightContact,
      leftActualStageAnkle,
      rightActualStageAnkle,
      maxTargetErrorPx: r1(Math.max(errL, errR)),
    },
    ikDiagnostics: {
      anyClamped:
        leftLeg.clamped || rightLeg.clamped || leftArm.clamped || rightArm.clamped,
      chains: { leftLeg, rightLeg, leftArm, rightArm },
    },
    // ── 6. FIXED CAMERA ────────────────────────────────────────────────────
    camera: { x: 960, y: 540, zoom: 1 },
  };
};

/**
 * Builds a clean, balanced standing model-sheet pose for any of Arga's 6 production views.
 */
export const buildNeutralArgaPose = (
  instanceId: string,
  view: ViewAngle,
  stageX: number,
  stageY: number,
  scale: number,
  options: {
    emotion?: EmotionId;
    viseme?: VisemeId;
    leftHandShape?: HandShape;
    rightHandShape?: HandShape;
  } = {},
): ArgaActorPoseProps => {
  const dim = ARGA_CANONICAL_DIMENSIONS;
  const pelvisDropY = 2;
  const layout = getArgaJointLayout(view, pelvisDropY, 0);

  const footOffsets: Record<ViewAngle, { lx: number; rx: number; lWristDx: number; rWristDx: number }> = {
    front: { lx: 28, rx: -28, lWristDx: 4, rWristDx: -4 },
    'three-quarter-right': { lx: 22, rx: -24, lWristDx: 4, rWristDx: -4 },
    'three-quarter-left': { lx: 24, rx: -22, lWristDx: 4, rWristDx: -4 },
    'profile-right': { lx: 12, rx: -12, lWristDx: 8, rWristDx: -2 },
    'profile-left': { lx: 12, rx: -12, lWristDx: 2, rWristDx: -8 },
    back: { lx: -28, rx: 28, lWristDx: -4, rWristDx: 4 },
  };
  const cfg = footOffsets[view];

  const leftLeg = solveLegChain(
    layout.leftHip,
    { x: cfg.lx, y: dim.ankleRestY },
    dim.thighLength,
    dim.shinLength,
    layout.facingDir,
  );
  const rightLeg = solveLegChain(
    layout.rightHip,
    { x: cfg.rx, y: dim.ankleRestY },
    dim.thighLength,
    dim.shinLength,
    layout.facingDir,
  );

  const leftArm = solveArmChain(
    layout.leftShoulder,
    { x: layout.leftShoulder.x + cfg.lWristDx, y: layout.leftShoulder.y + 249 },
    dim.upperArmLength,
    dim.forearmLength,
    view === 'profile-right' || view === 'three-quarter-right' || view === 'back' ? -1 : 1,
  );
  const rightArm = solveArmChain(
    layout.rightShoulder,
    { x: layout.rightShoulder.x + cfg.rWristDx, y: layout.rightShoulder.y + 249 },
    dim.upperArmLength,
    dim.forearmLength,
    view === 'profile-left' || view === 'three-quarter-left' || view === 'back' ? 1 : -1,
  );

  return {
    instanceId,
    stageX,
    stageY,
    scale,
    view,
    emotion: options.emotion ?? 'neutral',
    viseme: options.viseme ?? 'rest',
    blink: 0,
    gazeX: 0.08,
    gazeY: 0,
    pelvisDropY,
    torsoLeanDeg: 0,
    headTiltDeg: 0,
    shoulderTwistPx: 0,
    coatTrailDeg: 0,
    hairSway: 0,
    windSway: 0,
    leftLeg,
    rightLeg,
    leftBootPitchDeg: 0,
    rightBootPitchDeg: 0,
    leftArm,
    rightArm,
    leftHandShape: options.leftHandShape ?? 'relaxed',
    rightHandShape: options.rightHandShape ?? 'relaxed',
    renderFloorShadow: true,
  };
};
