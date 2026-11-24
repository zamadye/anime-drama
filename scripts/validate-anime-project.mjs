import fs from 'node:fs';
import assert from 'node:assert/strict';

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'src/remotion.tsx',
  'src/remotion-entry.ts',
  'src/main.tsx',
  'src/studio.css',
  'src/engine/math.ts',
  'src/engine/physics.ts',
  'src/engine/camera.ts',
  'src/animation/TwoBoneIK.ts',
  'src/v3/contracts.ts',
  'src/v3/compiler.ts',
  'src/v3/kinematics.ts',
  'src/v3/acting.ts',
  'src/v3/audio/argaStudyDialogue.ts',
  'src/v3/art/arga/argaTokens.ts',
  'src/v3/art/arga/ArgaHands.tsx',
  'src/v3/art/arga/ArgaLimbs.tsx',
  'src/v3/art/arga/ArgaTorso.tsx',
  'src/v3/art/arga/ArgaHead.tsx',
  'src/v3/art/arga/ArgaActor.tsx',
  'src/v3/art/arga/index.ts',
  'src/v3/scenes/ArgaModelSheet.tsx',
  'src/v3/scenes/ArgaMotionStudy.tsx',
  'content/examples/valid-preview-episode.json',
  'content/examples/invalid-unsupported-view.json',
  'content/series/senja/README.md',
  'references/character-options/option-b-modern-series.png',
  'public/audio/pilot-arga-01.wav',
];

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(file), `missing required V3 file: ${file}`);
}

const forbiddenLegacyFiles = [
  'src/animation/AnimeLive2DActor.tsx',
  'src/animation/live2dAssets.ts',
  'src/world/AnimePaintedWorld.tsx',
  'public/assets/anime-live2d',
  'references/live2d-raw',
  'scripts/prepare-live2d-assets.py',
  'assets-manifest.json',
  'qa-report.md',
  'anime-drama-pilot.mp4',
  'anime-cast-showcase.mp4',
  'src/animation/AnimeCharacterRig.tsx',
  'src/scenes/AnimeDramaPilot.tsx',
  'src/scenes/AnimeCastShowcase.tsx',
  'src/scenes/AnimeEmotionMatrix.tsx',
];

for (const legacy of forbiddenLegacyFiles) {
  assert.equal(fs.existsSync(legacy), false, `rejected legacy file still present: ${legacy}`);
}

const sourceFiles = fs
  .readdirSync('src', { recursive: true })
  .filter((p) => /\.(ts|tsx|css)$/.test(String(p)));

for (const rawFile of sourceFiles) {
  const file = String(rawFile);
  const text = fs.readFileSync(`src/${file}`, 'utf8');
  assert.doesNotMatch(
    text,
    /Date\.now\(|requestAnimationFrame|Math\.random\(|@keyframes/,
    `non-deterministic or CSS-animated construct found in src/${file}`,
  );
  if (file.endsWith('.css')) {
    assert.doesNotMatch(
      text,
      /\btransition\s*:/,
      `CSS transition prohibited in src/${file}`,
    );
  }
  if (file.startsWith('v3/art/')) {
    assert.doesNotMatch(
      text,
      /<img\b|<image\b|anime-live2d|raster/i,
      `raster actor dependency prohibited in V3 vector artwork src/${file}`,
    );
  }
}

const rootSource = fs.readFileSync('src/remotion.tsx', 'utf8');
for (const compId of ['V3-Arga-Model-Sheet', 'V3-Arga-Motion-Study']) {
  assert.ok(
    rootSource.includes(compId),
    `V3 Remotion composition missing from src/remotion.tsx: ${compId}`,
  );
}
for (const removedComp of [
  'Anime-Drama-Pilot-Landscape',
  'Anime-Cast-Showcase',
  'Anime-Emotion-Matrix',
]) {
  assert.equal(
    rootSource.includes(removedComp),
    false,
    `Removed legacy composition still present in src/remotion.tsx: ${removedComp}`,
  );
}

console.log(
  `V3 PROJECT VALIDATED: ${requiredFiles.length} required files present, ${sourceFiles.length} pure deterministic files, zero raster actor deps, 2 V3 compositions registered.`,
);
