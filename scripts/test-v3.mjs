import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const cache = new Map();
const load = (p) => {
  p = path.resolve(p);
  if (cache.has(p)) return cache.get(p);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    const candidates = [
      p + '.ts',
      p + '.tsx',
      p + '.json',
      path.join(p, 'index.ts'),
      path.join(p, 'index.tsx'),
    ];
    p = candidates.find((c) => fs.existsSync(c)) ?? p;
  }
  let code = ts.transpileModule(fs.readFileSync(p, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  code = code.replace(
    /from\s+(['"])([^'"]+)\1/g,
    (_, q, spec) =>
      `from ${q}${spec.startsWith('.') ? load(path.resolve(path.dirname(p), spec)) : import.meta.resolve(spec)}${q}`,
  );
  const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  cache.set(p, url);
  return url;
};

const { mixHexColor, springValue, seededUnit } = await import(load('src/engine/math.ts'));
const { computeHairPhysics } = await import(load('src/engine/physics.ts'));
const { evaluateAnimeCamera } = await import(load('src/engine/camera.ts'));
const { solveTwoBoneIK } = await import(load('src/animation/TwoBoneIK.ts'));

const { compileEpisode } = await import(load('src/v3/compiler.ts'));
const { makeActorDefsId, ARGA_CANONICAL_DIMENSIONS } = await import(
  load('src/v3/art/arga/argaTokens.ts')
);
const {
  ARGA_STUDY_DIALOGUE_TRACK,
  sampleVerifiedViseme,
} = await import(load('src/v3/audio/argaStudyDialogue.ts'));
const {
  ARGA_MOTION_STUDY_FRAMES,
  ARGA_STUDY_LEFT_FOOTSTEPS,
  ARGA_STUDY_RIGHT_FOOTSTEPS,
  buildNeutralArgaPose,
  evaluateArgaStudyFrame,
} = await import(load('src/v3/acting.ts'));

// 1. Reusable math / physics / camera / IK primitives
assert.equal(mixHexColor('#000000', '#ffffff', 0.5), '#808080');
assert.ok(Math.abs(springValue(24, 24) - 1) < 0.08);
assert.equal(seededUnit('v3-det'), seededUnit('v3-det'));
const hA = computeHairPhysics('arga-v3', 36, 24, 1.5, 0.2, 0.35);
const hB = computeHairPhysics('arga-v3', 36, 24, 1.5, 0.2, 0.35);
assert.deepEqual(hA, hB);
const cam = evaluateAnimeCamera([{ frame: 0, x: 960, y: 540, zoom: 1 }], 10, 24, 1920, 1080, { handheldAmp: 0 });
assert.equal(cam.zoom, 1);
const ikProbe = solveTwoBoneIK({ x: 0, y: -400 }, { x: 20, y: -30 }, 204, 188, 1);
assert.equal(ikProbe.clamped, false);

// 2. V3 Boundary Compiler checks
const validJson = JSON.parse(fs.readFileSync('content/examples/valid-preview-episode.json', 'utf8'));
const compiledPreview = compileEpisode(validJson, 'preview');
assert.equal(compiledPreview.totalFrames, 192);
assert.equal(compiledPreview.totalSeconds, 8);
assert.equal(compiledPreview.shots.length, 1);

const invalidViewJson = JSON.parse(fs.readFileSync('content/examples/invalid-unsupported-view.json', 'utf8'));
assert.throws(
  () => compileEpisode(invalidViewJson, 'preview'),
  /unsupported view angle/i,
);
assert.throws(
  () => compileEpisode(validJson, 'production'),
  /user-accepted/i,
);
const badCoords = structuredClone(validJson);
badCoords.motionClips[0].rootStartStage.x = 'not-a-number';
assert.throws(() => compileEpisode(badCoords, 'preview'), /finite numbers/i);
const badActor = structuredClone(validJson);
badActor.shots[0].characterId = 'missing_actor';
assert.throws(() => compileEpisode(badActor, 'preview'), /unknown character/i);

// 3. Out-of-order seek determinism
const sampleSeq = [0, 120, 45, 191, 84, 120, 45];
const evaluatedSeq = sampleSeq.map((f) => evaluateArgaStudyFrame(f, 24));
assert.deepEqual(evaluatedSeq[1], evaluatedSeq[5]);
assert.deepEqual(evaluatedSeq[2], evaluatedSeq[6]);

// 4. Full-timeline IK health, bone-length stability, and <=2px stance contact lock
let maxObservedStanceDrift = 0;
let maxObservedTargetError = 0;

const checkChain = (chain, expectedA, expectedB, label) => {
  for (const pt of [chain.root, chain.joint, chain.end]) {
    assert.ok(Number.isFinite(pt.x) && Number.isFinite(pt.y), `${label} non-finite coord`);
  }
  assert.equal(chain.clamped, false, `${label} IK clamped! excess=${chain.clampExcessPx}`);
  const lenA = Math.hypot(chain.joint.x - chain.root.x, chain.joint.y - chain.root.y);
  const lenB = Math.hypot(chain.end.x - chain.joint.x, chain.end.y - chain.joint.y);
  assert.ok(Math.abs(lenA - expectedA) < 0.25, `${label} upper length drift: ${lenA} vs ${expectedA}`);
  assert.ok(Math.abs(lenB - expectedB) < 0.25, `${label} lower length drift: ${lenB} vs ${expectedB}`);
};

const dim = ARGA_CANONICAL_DIMENSIONS;
for (let f = 0; f < ARGA_MOTION_STUDY_FRAMES; f++) {
  const s = evaluateArgaStudyFrame(f, 24);
  assert.equal(s.ikDiagnostics.anyClamped, false, `frame ${f} triggered IK clamping`);
  checkChain(s.ikDiagnostics.chains.leftLeg, dim.thighLength, dim.shinLength, `f${f}.leftLeg`);
  checkChain(s.ikDiagnostics.chains.rightLeg, dim.thighLength, dim.shinLength, `f${f}.rightLeg`);
  checkChain(s.ikDiagnostics.chains.leftArm, dim.upperArmLength, dim.forearmLength, `f${f}.leftArm`);
  checkChain(s.ikDiagnostics.chains.rightArm, dim.upperArmLength, dim.forearmLength, `f${f}.rightArm`);

  maxObservedTargetError = Math.max(maxObservedTargetError, s.footContacts.maxTargetErrorPx);
  assert.ok(
    s.footContacts.maxTargetErrorPx <= 2.0,
    `frame ${f} ankle target error ${s.footContacts.maxTargetErrorPx}px exceeds 2.0px`,
  );

  for (const anchor of ARGA_STUDY_LEFT_FOOTSTEPS) {
    if (f >= anchor.plantFrame && f <= anchor.liftFrame) {
      const d = Math.hypot(
        s.footContacts.leftActualStageAnkle.x - anchor.stageX,
        s.footContacts.leftActualStageAnkle.y - anchor.stageY,
      );
      maxObservedStanceDrift = Math.max(maxObservedStanceDrift, d);
      assert.ok(d <= 2.0, `left foot stance drift ${d}px at frame ${f}`);
    }
  }
  for (const anchor of ARGA_STUDY_RIGHT_FOOTSTEPS) {
    if (f >= anchor.plantFrame && f <= anchor.liftFrame) {
      const d = Math.hypot(
        s.footContacts.rightActualStageAnkle.x - anchor.stageX,
        s.footContacts.rightActualStageAnkle.y - anchor.stageY,
      );
      maxObservedStanceDrift = Math.max(maxObservedStanceDrift, d);
      assert.ok(d <= 2.0, `right foot stance drift ${d}px at frame ${f}`);
    }
  }
}

// 5. All 6 Model Sheet views valid & non-clamped
for (const view of [
  'front',
  'three-quarter-right',
  'three-quarter-left',
  'profile-right',
  'profile-left',
  'back',
]) {
  const pose = buildNeutralArgaPose(`test-${view}`, view, 500, 900, 0.7);
  assert.equal(pose.leftLeg.clamped, false, `model sheet ${view} leftLeg clamped`);
  assert.equal(pose.rightLeg.clamped, false, `model sheet ${view} rightLeg clamped`);
  assert.equal(pose.leftArm.clamped, false, `model sheet ${view} leftArm clamped`);
  assert.equal(pose.rightArm.clamped, false, `model sheet ${view} rightArm clamped`);
}

// 6. Real audio provenance & strict silence=rest checks
const wavBytes = fs.readFileSync(path.join('public', ARGA_STUDY_DIALOGUE_TRACK.audioFile));
const wavSha256 = crypto.createHash('sha256').update(wavBytes).digest('hex');
assert.equal(wavSha256, ARGA_STUDY_DIALOGUE_TRACK.audioSha256);

for (let f = 0; f < 98; f++) {
  assert.equal(sampleVerifiedViseme(ARGA_STUDY_DIALOGUE_TRACK, f), 'rest', `pre-speech frame ${f} not rest`);
}
for (let f = 157; f < ARGA_MOTION_STUDY_FRAMES; f++) {
  assert.equal(sampleVerifiedViseme(ARGA_STUDY_DIALOGUE_TRACK, f), 'rest', `post-speech frame ${f} not rest`);
}
assert.equal(sampleVerifiedViseme(ARGA_STUDY_DIALOGUE_TRACK, 134), 'rest', 'comma pause frame 134 must be rest');
assert.notEqual(sampleVerifiedViseme(ARGA_STUDY_DIALOGUE_TRACK, 114), 'rest', 'active syllable frame 114 should move');

// 7. Unique SVG defs IDs across actor instances
assert.notEqual(makeActorDefsId('arga-1', 'eye-front-l'), makeActorDefsId('arga-2', 'eye-front-l'));

console.log(
  `V3 TESTS PASSED: compiler boundary, 6 views, seek determinism, 192-frame IK (0 clamped, maxStanceDrift=${maxObservedStanceDrift.toFixed(2)}px, maxTargetError=${maxObservedTargetError.toFixed(2)}px), audio SHA-256 & silence=rest verified.`,
);
