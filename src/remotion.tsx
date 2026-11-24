import React from 'react';
import { Composition } from 'remotion';
import {
  ArgaModelSheet,
  MODEL_SHEET_FPS,
  MODEL_SHEET_FRAMES,
} from './v3/scenes/ArgaModelSheet';
import {
  ArgaMotionStudy,
  MOTION_STUDY_FPS,
  MOTION_STUDY_FRAMES,
} from './v3/scenes/ArgaMotionStudy';

export const AnimeRemotionRoot: React.FC = () => (
  <>
    <Composition
      id="V3-Arga-Model-Sheet"
      component={ArgaModelSheet}
      durationInFrames={MODEL_SHEET_FRAMES}
      fps={MODEL_SHEET_FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="V3-Arga-Motion-Study"
      component={ArgaMotionStudy}
      durationInFrames={MOTION_STUDY_FRAMES}
      fps={MOTION_STUDY_FPS}
      width={1920}
      height={1080}
      defaultProps={{ showHud: true, muted: false }}
    />
  </>
);
