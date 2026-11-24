import { applyEasing, clamp, clamp01, lerp, multiHarmonicWave, r1, type EasingCurve } from './math';

export type AnimeCameraKeyframe = {
  frame: number;
  x: number;
  y: number;
  zoom: number;
  rotateDeg?: number;
  bgBlurPx?: number;
  letterboxPx?: number;
  curve?: EasingCurve;
};

export type EvaluatedAnimeCamera = {
  x: number;
  y: number;
  zoom: number;
  rotateDeg: number;
  bgBlurPx: number;
  letterboxPx: number;
  transform: string;
};

/** Evaluates cinematic anime camera with rack-focus DOF blur, letterbox, and subtle handheld drift. */
export const evaluateAnimeCamera = (
  keyframes: AnimeCameraKeyframe[],
  frame: number,
  fps: number,
  width: number,
  height: number,
  options: { handheldAmp?: number; reducedMotion?: boolean } = {},
): EvaluatedAnimeCamera => {
  if (keyframes.length === 0) {
    return {
      x: width / 2,
      y: height / 2,
      zoom: 1,
      rotateDeg: 0,
      bgBlurPx: 0,
      letterboxPx: 0,
      transform: 'none',
    };
  }
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  let base = sorted[0];
  let next = sorted[sorted.length - 1];
  let t = 0;

  if (frame <= sorted[0].frame) {
    base = sorted[0];
    next = sorted[0];
    t = 0;
  } else if (frame >= next.frame) {
    base = next;
    t = 1;
  } else {
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (frame >= a.frame && frame <= b.frame) {
        base = a;
        next = b;
        const span = Math.max(1, b.frame - a.frame);
        t = applyEasing((frame - a.frame) / span, b.curve ?? 'easeInOutCubic');
        break;
      }
    }
  }

  const amp = options.reducedMotion ? 0 : (options.handheldAmp ?? 1.0);
  const driftX = multiHarmonicWave(frame, fps, 0.22, 1.1) * 3.5 * amp;
  const driftY = multiHarmonicWave(frame, fps, 0.19, 2.7) * 2.4 * amp;
  const driftRot = multiHarmonicWave(frame, fps, 0.16, 4.2) * 0.18 * amp;

  const zoom = clamp(lerp(base.zoom, next.zoom, t), 0.75, 4.5);
  const cx = clamp(lerp(base.x, next.x, t) + driftX, 0, width);
  const cy = clamp(lerp(base.y, next.y, t) + driftY, 0, height);
  const rotateDeg = r1(
    lerp(base.rotateDeg ?? 0, next.rotateDeg ?? 0, t) + driftRot,
  );
  const bgBlurPx = r1(lerp(base.bgBlurPx ?? 0, next.bgBlurPx ?? 0, t));
  const letterboxPx = Math.round(
    lerp(base.letterboxPx ?? 58, next.letterboxPx ?? 58, t),
  );

  const tx = r1(width / 2 - cx * zoom);
  const ty = r1(height / 2 - cy * zoom);

  return {
    x: cx,
    y: cy,
    zoom: Math.round(zoom * 1000) / 1000,
    rotateDeg,
    bgBlurPx,
    letterboxPx,
    transform: `translate(${tx}px, ${ty}px) scale(${Math.round(zoom * 1000) / 1000}) rotate(${rotateDeg}deg)`,
  };
};
