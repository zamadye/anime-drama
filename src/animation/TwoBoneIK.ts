export type Vec2 = { x: number; y: number };
export type TwoBoneSolution = {
  elbow: Vec2;
  upperAngle: number;
  lowerAngle: number;
  reach: number;
  clamped: boolean;
};

const deg = (r: number) => (r * 180) / Math.PI;

export const solveTwoBoneIK = (
  root: Vec2,
  target: Vec2,
  lengthA: number,
  lengthB: number,
  bend: 1 | -1 = 1,
): TwoBoneSolution => {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const raw = Math.hypot(dx, dy) || 1e-6;
  const min = Math.abs(lengthA - lengthB) + 1e-3;
  const max = lengthA + lengthB - 1e-3;
  const dist = Math.max(min, Math.min(max, raw));
  const ux = dx / raw;
  const uy = dy / raw;
  const tx = root.x + ux * dist;
  const ty = root.y + uy * dist;
  const base = Math.atan2(ty - root.y, tx - root.x);
  const cos = Math.max(
    -1,
    Math.min(
      1,
      (lengthA * lengthA + dist * dist - lengthB * lengthB) /
        (2 * lengthA * dist),
    ),
  );
  const offset = Math.acos(cos) * bend;
  const upperAngle = base - offset;
  const ex = root.x + Math.cos(upperAngle) * lengthA;
  const ey = root.y + Math.sin(upperAngle) * lengthA;
  return {
    elbow: { x: ex, y: ey },
    upperAngle: deg(upperAngle),
    lowerAngle: deg(Math.atan2(ty - ey, tx - ex)),
    reach: dist,
    clamped: Math.abs(raw - dist) > 0.01,
  };
};

const angle = (a: Vec2, b: Vec2) => deg(Math.atan2(b.y - a.y, b.x - a.x));

export const solveArmRotations = (
  shoulder: Vec2,
  target: Vec2,
  elbowBase: Vec2,
  wristBase: Vec2,
  bend: 1 | -1 = 1,
) => {
  const l1 = Math.hypot(elbowBase.x - shoulder.x, elbowBase.y - shoulder.y);
  const l2 = Math.hypot(wristBase.x - elbowBase.x, wristBase.y - elbowBase.y);
  const solved = solveTwoBoneIK(shoulder, target, l1, l2, bend);
  const baseUpper = angle(shoulder, elbowBase);
  const baseLower = angle(elbowBase, wristBase);
  const shoulderRotation = solved.upperAngle - baseUpper;
  const elbowRotation =
    solved.lowerAngle - solved.upperAngle - (baseLower - baseUpper);
  return { ...solved, shoulderRotation, elbowRotation };
};

export const solveArmRotationsFacing = (
  shoulder: Vec2,
  target: Vec2,
  elbowBase: Vec2,
  wristBase: Vec2,
  side: -1 | 1,
) => {
  const a = solveArmRotations(shoulder, target, elbowBase, wristBase, -1);
  const b = solveArmRotations(shoulder, target, elbowBase, wristBase, 1);
  return side < 0
    ? a.elbow.x <= b.elbow.x
      ? a
      : b
    : a.elbow.x >= b.elbow.x
      ? a
      : b;
};
