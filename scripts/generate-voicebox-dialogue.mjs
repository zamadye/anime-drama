import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_OUT_DIR = path.join(PROJECT_ROOT, 'public', 'audio');

const VOICEBOX_URL = (process.env.VOICEBOX_URL || 'http://127.0.0.1:17493').replace(/\/$/, '');
const ENGINE = process.env.VOICEBOX_ENGINE || 'omnivoice';
const LANGUAGE = process.env.VOICEBOX_LANGUAGE || 'id';

const DEFAULT_REFS_DIR =
  '/home/nurkahfi/.gemini/antigravity/brain/d328dc91-c7fd-4a19-b311-afff35400f58/scratch/voice-refs';

const CAST_SPECS = {
  arga: {
    profileName: 'Arga - Anime Drama',
    description: 'Arga (27), arsitek muda Indonesia — bariton tenang melankolis',
    refPath: process.env.ARGA_REF_WAV || path.join(DEFAULT_REFS_DIR, 'arga-ref.wav'),
    refText:
      'Di pinggir jalan, laki-laki berbaju putih itu menurunkan tangannya. Senyumnya menghilang.',
  },
  kirana: {
    profileName: 'Kirana - Anime Drama',
    description: 'Kirana (25), ilustrator Indonesia — vokal perempuan jernih penuh emosi',
    refPath: process.env.KIRANA_REF_WAV || path.join(DEFAULT_REFS_DIR, 'kirana-ref.wav'),
    refText:
      'Bagus. Kontrakan satu juta, listrik sama air dua ratus lima puluh, belanja dapur tujuh ratus.',
  },
};

const DIALOGUE_LINES = [
  {
    id: 'pilot-arga-01',
    speakerKey: 'arga',
    speakerName: 'Arga',
    filename: 'pilot-arga-01.wav',
    text: 'Keretamu berangkat dua jam lagi, Kirana.',
    seed: 1011,
  },
  {
    id: 'pilot-arga-02',
    speakerKey: 'arga',
    speakerName: 'Arga',
    filename: 'pilot-arga-02.wav',
    text: 'Kalau masih ada yang ingin kau katakan, jangan tunggu sampai hujan turun.',
    seed: 2022,
  },
  {
    id: 'pilot-kirana-01',
    speakerKey: 'kirana',
    speakerName: 'Kirana',
    filename: 'pilot-kirana-01.wav',
    text: 'Aku cuma takut, kalau menoleh sekali lagi, aku tak jadi pergi.',
    seed: 3033,
  },
  {
    id: 'pilot-kirana-02',
    speakerKey: 'kirana',
    speakerName: 'Kirana',
    filename: 'pilot-kirana-02.wav',
    text: 'Jaga kota ini baik-baik, sampai senja berikutnya.',
    seed: 4044,
  },
];

async function apiJson(endpoint, options = {}) {
  const res = await fetch(`${VOICEBOX_URL}${endpoint}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voicebox HTTP ${res.status} ${endpoint}: ${body}`);
  }
  return res.json();
}

async function ensureProfile(spec) {
  const existing = await apiJson('/profiles');
  let profile = existing.find((p) => p.name === spec.profileName);
  if (!profile) {
    profile = await apiJson('/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: spec.profileName,
        description: spec.description,
        language: LANGUAGE,
        voice_type: 'cloned',
        default_engine: ENGINE,
      }),
    });
    console.log(`Created Voicebox profile: ${profile.name} (${profile.id})`);
  }

  if ((profile.sample_count ?? 0) === 0) {
    const audioBytes = await fs.readFile(spec.refPath);
    const form = new FormData();
    form.append('file', new Blob([audioBytes], { type: 'audio/wav' }), path.basename(spec.refPath));
    form.append('reference_text', spec.refText);
    const sampleRes = await fetch(`${VOICEBOX_URL}/profiles/${profile.id}/samples`, {
      method: 'POST',
      body: form,
    });
    if (!sampleRes.ok) {
      throw new Error(`Sample upload failed for ${profile.name}: ${await sampleRes.text()}`);
    }
    console.log(`Uploaded reference sample (${path.basename(spec.refPath)}) to ${profile.name}`);
  }
  return profile;
}

async function generateLine(line, profile, force = false) {
  const outPath = path.join(AUDIO_OUT_DIR, line.filename);
  const seedOverride = process.env[`SEED_${line.id.toUpperCase().replace(/-/g, '_')}`];
  const seed = seedOverride ? Number(seedOverride) : line.seed;

  if (!force && !seedOverride) {
    try {
      const stat = await fs.stat(outPath);
      if (stat.size > 4096) {
        const hist = await apiJson(`/history?profile_id=${profile.id}&limit=20`);
        const match = (hist.items || []).find(
          (item) => item.text === line.text && item.status === 'completed',
        );
        if (match) {
          console.log(`[${line.id}] Reusing completed Voicebox audio (${match.id})`);
          return {
            id: line.id,
            speaker: line.speakerName,
            profileId: profile.id,
            generationId: match.id,
            seed: match.seed ?? seed,
            text: line.text,
            file: line.filename,
            rawDurationSec: match.duration,
          };
        }
      }
    } catch {
      // File missing; generate below.
    }
  }

  const t0 = Date.now();
  const queued = await apiJson('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: profile.id,
      text: line.text,
      language: LANGUAGE,
      engine: ENGINE,
      seed,
      normalize: true,
    }),
  });

  let lastStatus = '';
  let deadline = Date.now() + 25 * 60 * 1000;
  let record = null;
  while (Date.now() < deadline) {
    record = await apiJson(`/history/${queued.id}`);
    if (record.status !== lastStatus) {
      lastStatus = record.status;
      if (lastStatus === 'generating') {
        deadline = Date.now() + 15 * 60 * 1000;
      }
      console.log(`[${line.id}] status=${lastStatus} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    if (record.status === 'completed') break;
    if (record.status === 'failed') {
      throw new Error(`Generation failed for ${line.id}: ${record.error}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!record || record.status !== 'completed') {
    throw new Error(`Timed out waiting for ${line.id}`);
  }

  const audioRes = await fetch(`${VOICEBOX_URL}/audio/${queued.id}`);
  if (!audioRes.ok) {
    throw new Error(`Failed downloading audio for ${line.id}: HTTP ${audioRes.status}`);
  }
  const bytes = Buffer.from(await audioRes.arrayBuffer());
  await fs.writeFile(outPath, bytes);
  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `Saved ${line.filename} (${bytes.length} bytes, ${Number(record.duration).toFixed(2)}s audio in ${elapsedSec}s)`,
  );

  return {
    id: line.id,
    speaker: line.speakerName,
    profileId: profile.id,
    generationId: queued.id,
    seed,
    text: line.text,
    file: line.filename,
    rawDurationSec: record.duration,
  };
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length);
  const force = process.argv.includes('--force');
  const health = await apiJson('/health');
  console.log(`Voicebox health: status=${health.status ?? 'ok'} gpu=${JSON.stringify(health)}`);

  await fs.mkdir(AUDIO_OUT_DIR, { recursive: true });

  const profiles = {};
  for (const [key, spec] of Object.entries(CAST_SPECS)) {
    profiles[key] = await ensureProfile(spec);
  }

  const targets = onlyArg ? DIALOGUE_LINES.filter((l) => l.id === onlyArg) : DIALOGUE_LINES;
  if (targets.length === 0) {
    throw new Error(`No line matched --only=${onlyArg}`);
  }

  const results = [];
  for (const line of targets) {
    results.push(await generateLine(line, profiles[line.speakerKey], force));
  }

  if (!onlyArg) {
    const manifestPath = path.join(AUDIO_OUT_DIR, 'voicebox-manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(
        {
          generator: 'jamiepine/voicebox',
          engine: ENGINE,
          language: LANGUAGE,
          generatedAt: new Date().toISOString(),
          lines: results,
        },
        null,
        2,
      ) + '\n',
    );
    console.log(`Wrote ${manifestPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
