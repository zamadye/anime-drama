import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const bundleDir = '/tmp/v3-bundle';
const framesDir = '/tmp/v3-study-frames';
const entryOrBundle = fs.existsSync(bundleDir) ? bundleDir : 'src/remotion-entry.ts';
const browserFlags = [
  '--concurrency=1',
  '--browser-executable=/usr/bin/google-chrome',
  '--chrome-mode=chrome-for-testing',
];

fs.mkdirSync('docs/anime-v3/qa', { recursive: true });
fs.mkdirSync(framesDir, { recursive: true });

const runRemotion = (label, args) => {
  const t0 = process.hrtime.bigint();
  console.log(`\n=== ${label} ===`);
  execFileSync('npx', ['remotion', ...args, ...browserFlags], { stdio: 'inherit' });
  const sec = Number(process.hrtime.bigint() - t0) / 1e9;
  console.log(`${label} elapsed: ${sec.toFixed(2)}s`);
  return sec;
};

const timings = {};
timings.sheetSec = runRemotion('M1 Model Sheet Still (1080p)', [
  'still',
  entryOrBundle,
  'V3-Arga-Model-Sheet',
  'docs/anime-v3/qa/arga-model-sheet.png',
  '--frame=0',
]);

for (const frame of [14, 36, 62, 83, 118, 146, 178]) {
  const name = `f${String(frame).padStart(3, '0')}.png`;
  timings[name] = runRemotion(`M2 Key Frame ${frame} (1080p)`, [
    'still',
    entryOrBundle,
    'V3-Arga-Motion-Study',
    `${framesDir}/${name}`,
    `--frame=${frame}`,
  ]);
}

timings.preview540pSec = runRemotion('M2 Motion Study Preview MP4 (540p)', [
  'render',
  entryOrBundle,
  'V3-Arga-Motion-Study',
  'docs/anime-v3/qa/arga-motion-study-540p.mp4',
  '--scale=0.5',
  '--codec',
  'h264',
  '--crf',
  '22',
]);

timings.render1080pSec = runRemotion('M2 Motion Study Acceptance MP4 (1080p)', [
  'render',
  entryOrBundle,
  'V3-Arga-Motion-Study',
  'docs/anime-v3/qa/arga-motion-study.mp4',
  '--codec',
  'h264',
  '--crf',
  '20',
]);

console.log('\n=== V3 QA RENDER SUMMARY ===');
console.log(JSON.stringify({ entryOrBundle, timings }, null, 2));
