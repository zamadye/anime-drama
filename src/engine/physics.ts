import { multiHarmonicWave, r1, seededUnit } from './math';

export type HairPhysicsResult = {
  backSwayDeg: number;
  sideLockLeftDeg: number;
  sideLockRightDeg: number;
  bangsShiftX: number;
  ahogeBounceDeg: number;
  coatHemSwayDeg: number;
};

/** Deterministic secondary motion with phase lag for anime hair strands, ahoge, and coats. */
export const computeHairPhysics = (
  seed: string,
  frame: number,
  fps: number,
  headTilt = 0,
  headTurn = 0,
  windStrength = 0.5,
): HairPhysicsResult => {
  const phaseOffset = seededUnit(`hair:${seed}`) * Math.PI * 2;
  const f = Math.max(0, frame);
  const wBack = multiHarmonicWave(f - 3, fps, 0.52, phaseOffset);
  const wLocks = multiHarmonicWave(f - 2, fps, 0.68, phaseOffset + 1.1);
  const wAhoge = multiHarmonicWave(f - 1, fps, 1.05, phaseOffset + 2.4);
  const wCoat = multiHarmonicWave(f - 4, fps, 0.44, phaseOffset + 0.5);

  const windBoost = windStrength * 6.5;
  const inertiaTilt = -headTilt * 0.45;
  const turnDrag = -headTurn * 3.8;

  return {
    backSwayDeg: r1(inertiaTilt + turnDrag + windBoost * (0.45 + 0.55 * wBack)),
    sideLockLeftDeg: r1(-headTilt * 0.35 + windBoost * (0.3 + 0.45 * wLocks) + 0.8),
    sideLockRightDeg: r1(-headTilt * 0.35 + windBoost * (0.35 + 0.45 * wLocks) - 0.6),
    bangsShiftX: r1(windStrength * (1.8 + 1.2 * wLocks) + headTurn * -1.4),
    ahogeBounceDeg: r1(-headTilt * 0.75 + (4.5 + windStrength * 5) * wAhoge),
    coatHemSwayDeg: r1(windStrength * (3.2 + 2.4 * wCoat) + headTurn * -1.5),
  };
};

export type AtmosphericParticle = {
  id: number;
  x: number;
  y: number;
  lengthOrRadius: number;
  opacity: number;
  dx: number;
  dy: number;
};

/** Frame-addressable deterministic rain streaks, dust motes, or drifting sakura petals. */
export const computeAtmosphericParticles = (
  count: number,
  seed: string,
  width: number,
  height: number,
  frame: number,
  fps: number,
  mode: 'rain' | 'motes' | 'petals',
): AtmosphericParticle[] => {
  const t = Math.max(0, frame) / Math.max(1, fps);
  const out: AtmosphericParticle[] = [];

  for (let i = 0; i < count; i++) {
    const u0 = seededUnit(`${seed}:x:${i}`);
    const u1 = seededUnit(`${seed}:y:${i}`);
    const u2 = seededUnit(`${seed}:v:${i}`);
    const u3 = seededUnit(`${seed}:o:${i}`);

    if (mode === 'rain') {
      const speedY = 920 + u2 * 560;
      const speedX = -210 - u2 * 80;
      const px = ((u0 * width + t * speedX) % width + width) % width;
      const py = ((u1 * height + t * speedY) % height + height) % height;
      const len = 34 + u2 * 28;
      const norm = Math.hypot(speedX, speedY) || 1;
      out.push({
        id: i,
        x: r1(px),
        y: r1(py),
        lengthOrRadius: r1(len),
        opacity: r1(0.24 + u3 * 0.34),
        dx: r1((speedX / norm) * len),
        dy: r1((speedY / norm) * len),
      });
    } else if (mode === 'petals') {
      const driftX = -48 - u2 * 38;
      const fallY = 58 + u2 * 44;
      const sway = Math.sin(t * 2.1 + u3 * 6.28) * 18;
      const px = ((u0 * width + t * driftX + sway) % width + width) % width;
      const py = ((u1 * height + t * fallY) % height + height) % height;
      out.push({
        id: i,
        x: r1(px),
        y: r1(py),
        lengthOrRadius: r1(4.2 + u2 * 4.5),
        opacity: r1(0.45 + u3 * 0.4),
        dx: r1(Math.cos(t * 2.4 + i) * 6),
        dy: r1(Math.sin(t * 2.4 + i) * 3.5),
      });
    } else {
      const driftX = 16 + u2 * 22;
      const floatY = -12 - u2 * 16;
      const wobble = Math.sin(t * 1.4 + u3 * 6.28) * 14;
      const px = ((u0 * width + t * driftX) % width + width) % width;
      const py = ((u1 * height + t * floatY + wobble) % height + height) % height;
      out.push({
        id: i,
        x: r1(px),
        y: r1(py),
        lengthOrRadius: r1(2.2 + u2 * 4.2),
        opacity: r1(0.22 + (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.3)) * 0.45 * (0.4 + u3 * 0.6)),
        dx: 0,
        dy: 0,
      });
    }
  }

  return out;
};
