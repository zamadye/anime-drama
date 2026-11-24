import React from 'react';
import { r1 } from '../../../engine/math';
import type { EmotionId, HandShape, ViewAngle, VisemeId } from '../../contracts';
import type { IKChainResult } from '../../kinematics';
import { ARGA_CANONICAL_DIMENSIONS, makeActorDefsId } from './argaTokens';
import { ArgaBackHair, ArgaFrontHair, ArgaHeadAndFace } from './ArgaHead';
import { ArgaArm, ArgaLeg } from './ArgaLimbs';
import { ArgaCoatBackTails, ArgaCoatFront, ArgaInnerTorso } from './ArgaTorso';

export type ArgaJointLayout = {
  leftShoulder: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftHip: { x: number; y: number };
  rightHip: { x: number; y: number };
  facingDir: 1 | -1;
  farSide: 'left' | 'right' | 'none';
};

export const getArgaJointLayout = (
  view: ViewAngle,
  pelvisDropY = 0,
  torsoLeanDeg = 0,
): ArgaJointLayout => {
  const d = ARGA_CANONICAL_DIMENSIONS;
  const leanShift = r1(Math.sin((torsoLeanDeg * Math.PI) / 180) * 185);
  const sy = r1(d.shoulderY + pelvisDropY * 0.85);
  const hy = r1(d.hipY + pelvisDropY);

  switch (view) {
    case 'front':
      return {
        leftShoulder: { x: d.shoulderHalfWidthFront + leanShift, y: sy },
        rightShoulder: { x: -d.shoulderHalfWidthFront + leanShift, y: sy },
        leftHip: { x: d.hipHalfWidthFront, y: hy },
        rightHip: { x: -d.hipHalfWidthFront, y: hy },
        facingDir: 1,
        farSide: 'none',
      };
    case 'three-quarter-right':
      return {
        leftShoulder: { x: 46 + leanShift, y: sy },
        rightShoulder: { x: -56 + leanShift, y: sy },
        leftHip: { x: 18, y: hy },
        rightHip: { x: -20, y: hy },
        facingDir: 1,
        farSide: 'left',
      };
    case 'three-quarter-left':
      return {
        leftShoulder: { x: 56 + leanShift, y: sy },
        rightShoulder: { x: -46 + leanShift, y: sy },
        leftHip: { x: 20, y: hy },
        rightHip: { x: -18, y: hy },
        facingDir: -1,
        farSide: 'right',
      };
    case 'profile-right':
      return {
        leftShoulder: { x: 6 + leanShift, y: sy },
        rightShoulder: { x: -8 + leanShift, y: sy },
        leftHip: { x: 4, y: hy },
        rightHip: { x: -4, y: hy },
        facingDir: 1,
        farSide: 'left',
      };
    case 'profile-left':
      return {
        leftShoulder: { x: 8 + leanShift, y: sy },
        rightShoulder: { x: -6 + leanShift, y: sy },
        leftHip: { x: 4, y: hy },
        rightHip: { x: -4, y: hy },
        facingDir: -1,
        farSide: 'right',
      };
    case 'back':
      // From behind, anatomical left arm/leg sits viewer-left (-X), right sits viewer-right (+X)
      return {
        leftShoulder: { x: -d.shoulderHalfWidthFront + leanShift, y: sy },
        rightShoulder: { x: d.shoulderHalfWidthFront + leanShift, y: sy },
        leftHip: { x: -d.hipHalfWidthFront, y: hy },
        rightHip: { x: d.hipHalfWidthFront, y: hy },
        facingDir: -1,
        farSide: 'none',
      };
  }
};

export interface ArgaActorPoseProps {
  instanceId: string;
  stageX: number;
  stageY: number;
  scale: number;
  view: ViewAngle;
  emotion: EmotionId;
  viseme: VisemeId;
  blink: number;
  gazeX: number;
  gazeY: number;
  pelvisDropY: number;
  torsoLeanDeg: number;
  headTiltDeg: number;
  shoulderTwistPx: number;
  coatTrailDeg: number;
  hairSway: number;
  windSway: number;
  leftLeg: IKChainResult;
  rightLeg: IKChainResult;
  leftBootPitchDeg: number;
  rightBootPitchDeg: number;
  leftArm: IKChainResult;
  rightArm: IKChainResult;
  leftHandShape: HandShape;
  rightHandShape: HandShape;
  leftHandAngleDeg?: number;
  rightHandAngleDeg?: number;
  renderFloorShadow?: boolean;
}

export const ArgaActor: React.FC<ArgaActorPoseProps> = (props) => {
  const {
    instanceId,
    stageX,
    stageY,
    scale,
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
    hairSway,
    windSway,
    leftLeg,
    rightLeg,
    leftBootPitchDeg,
    rightBootPitchDeg,
    leftArm,
    rightArm,
    leftHandShape,
    rightHandShape,
    leftHandAngleDeg,
    rightHandAngleDeg,
    renderFloorShadow = true,
  } = props;

  const layout = getArgaJointLayout(view, pelvisDropY, torsoLeanDeg);
  const bodyDrop = r1(pelvisDropY * 0.85);
  const headShiftX = r1(Math.sin((torsoLeanDeg * Math.PI) / 180) * 195);
  const shadowMaskId = makeActorDefsId(instanceId, 'shadow');

  const isFarLeft = layout.farSide === 'left';
  const isFarRight = layout.farSide === 'right';

  const footSpanMinX = Math.min(leftLeg.end.x, rightLeg.end.x) - 24;
  const footSpanMaxX = Math.max(leftLeg.end.x, rightLeg.end.x) + 28;
  const shadowCx = r1((footSpanMinX + footSpanMaxX) / 2);
  const shadowRx = r1(Math.max(46, (footSpanMaxX - footSpanMinX) * 0.56));
  const maxFootClearance = Math.max(
    0,
    Math.min(
      Math.abs(leftLeg.end.y - ARGA_CANONICAL_DIMENSIONS.ankleRestY),
      Math.abs(rightLeg.end.y - ARGA_CANONICAL_DIMENSIONS.ankleRestY),
    ),
  );

  const headProps = {
    instanceId,
    view,
    emotion,
    viseme,
    blink,
    gazeX,
    gazeY,
    headTiltDeg,
    hairSway,
  };

  const torsoProps = {
    view,
    torsoLeanDeg,
    shoulderTwistPx,
    coatTrailDeg,
    windSway,
    shoulderLeftX: layout.leftShoulder.x,
    shoulderRightX: layout.rightShoulder.x,
  };

  const renderLeftArm = (
    <ArgaArm
      chain={leftArm}
      handShape={leftHandShape}
      handAngleDeg={leftHandAngleDeg}
      side="left"
      view={view}
      isFarSide={isFarLeft}
    />
  );

  const renderRightArm = (
    <ArgaArm
      chain={rightArm}
      handShape={rightHandShape}
      handAngleDeg={rightHandAngleDeg}
      side="right"
      view={view}
      isFarSide={isFarRight}
    />
  );

  const renderLeftLeg = (
    <ArgaLeg
      chain={leftLeg}
      bootPitchDeg={leftBootPitchDeg}
      view={view}
      side="left"
      isFarSide={isFarLeft}
    />
  );

  const renderRightLeg = (
    <ArgaLeg
      chain={rightLeg}
      bootPitchDeg={rightBootPitchDeg}
      view={view}
      side="right"
      isFarSide={isFarRight}
    />
  );

  return (
    <g
      id={shadowMaskId}
      transform={`translate(${r1(stageX)}, ${r1(stageY)}) scale(${scale})`}
    >
      {/* Contact shadow driven directly by actual ankle/foot positions on floor plane y=0 */}
      {renderFloorShadow && (
        <g opacity={r1(Math.max(0.28, 0.42 - maxFootClearance * 0.005))}>
          <ellipse cx={shadowCx} cy={2} rx={shadowRx} ry={10} fill="#141824" />
          <ellipse cx={r1(leftLeg.end.x + 6)} cy={1.5} rx={22} ry={5.5} fill="#0E111B" opacity={0.7} />
          <ellipse cx={r1(rightLeg.end.x + 6)} cy={1.5} rx={22} ry={5.5} fill="#0E111B" opacity={0.7} />
        </g>
      )}

      {view === 'back' ? (
        <>
          {renderLeftLeg}
          {renderRightLeg}
          {renderLeftArm}
          {renderRightArm}
          <g transform={`translate(0, ${bodyDrop})`}>
            <ArgaCoatFront {...torsoProps} />
          </g>
          <g transform={`translate(${headShiftX}, ${bodyDrop})`}>
            <ArgaHeadAndFace {...headProps} />
          </g>
        </>
      ) : (
        <>
          {/* 1. Far arm (behind coat tails and torso when turned) */}
          {isFarLeft && renderLeftArm}
          {isFarRight && renderRightArm}

          {/* 2. Rear hair & coat tails behind striding legs */}
          <g transform={`translate(${headShiftX}, ${bodyDrop})`}>
            <ArgaBackHair {...headProps} />
          </g>
          <g transform={`translate(0, ${bodyDrop})`}>
            <ArgaCoatBackTails {...torsoProps} />
          </g>

          {/* 3. Articulated trouser legs & grounded boots (far leg behind near leg) */}
          {isFarLeft ? (
            <>
              {renderLeftLeg}
              {renderRightLeg}
            </>
          ) : (
            <>
              {renderRightLeg}
              {renderLeftLeg}
            </>
          )}

          {/* 4. Inner ribcage shirt, belt, pelvis & open overcoat panels */}
          <g transform={`translate(0, ${bodyDrop})`}>
            <ArgaInnerTorso {...torsoProps} />
            <ArgaCoatFront {...torsoProps} />
          </g>

          {/* 5. Neck, head, brows, eyes & articulated mouth */}
          <g transform={`translate(${headShiftX}, ${bodyDrop})`}>
            <ArgaHeadAndFace {...headProps} />
          </g>

          {/* 6. Near / front arm(s) */}
          {!isFarLeft && renderLeftArm}
          {!isFarRight && renderRightArm}

          {/* 7. Front hair locks & crown silhouette framing face cleanly */}
          <g transform={`translate(${headShiftX}, ${bodyDrop})`}>
            <ArgaFrontHair {...headProps} />
          </g>
        </>
      )}
    </g>
  );
};
