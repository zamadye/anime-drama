"""Deterministic waveform-gated lip-sync & beat timing generator for anime-drama.

Decodes the Voicebox-synthesized Indonesian WAV lines at 24 kHz mono via ffmpeg,
measures 24 fps per-frame RMS energy, maps Indonesian vowel/consonant cadence
across active vocal frames, and emits typed TypeScript timing & viseme data
into `src/audio/pilotDialogueAudio.ts`.
"""

import array
import json
import math
import subprocess
from pathlib import Path

FPS = 24
RATE = 24000
SAMPLES_PER_FRAME = RATE // FPS

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_AUDIO_DIR = PROJECT_ROOT / "public" / "audio"
MANIFEST_PATH = PUBLIC_AUDIO_DIR / "voicebox-manifest.json"
OUT_TS_PATH = PROJECT_ROOT / "src" / "audio" / "pilotDialogueAudio.ts"

LINES = [
    {
        "id": "pilot-arga-01",
        "speaker": "Arga",
        "file": "pilot-arga-01.wav",
        "text": "Keretamu berangkat dua jam lagi, Kirana…",
    },
    {
        "id": "pilot-arga-02",
        "speaker": "Arga",
        "file": "pilot-arga-02.wav",
        "text": "Kalau masih ada yang ingin kau katakan, jangan tunggu sampai hujan turun.",
    },
    {
        "id": "pilot-kirana-01",
        "speaker": "Kirana",
        "file": "pilot-kirana-01.wav",
        "text": "Aku cuma takut… kalau menoleh sekali lagi, aku tak jadi pergi.",
    },
    {
        "id": "pilot-kirana-02",
        "speaker": "Kirana",
        "file": "pilot-kirana-02.wav",
        "text": "Jaga kota ini baik-baik, sampai senja berikutnya.",
    },
]

VISEME_MAP = {
    "a": "A",
    "e": "E",
    "i": "E",
    "o": "O",
    "u": "U",
    "b": "MBP",
    "p": "MBP",
    "m": "MBP",
    "f": "FV",
    "v": "FV",
    "l": "L",
}


def analyze_clip(wav_path: Path, text: str) -> tuple[float, list[dict]]:
    if not wav_path.is_file():
        raise FileNotFoundError(f"Missing pilot WAV: {wav_path}")

    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-i",
            str(wav_path),
            "-f",
            "s16le",
            "-ac",
            "1",
            "-ar",
            str(RATE),
            "-loglevel",
            "error",
            "-",
        ]
    )
    samples = array.array("h", raw)
    total_samples = len(samples)
    if total_samples == 0:
        raise RuntimeError(f"Decoded 0 samples from {wav_path}")

    duration_sec = total_samples / RATE
    num_frames = max(1, math.ceil(total_samples / SAMPLES_PER_FRAME))

    rms_values: list[float] = []
    for f in range(num_frames):
        chunk = samples[f * SAMPLES_PER_FRAME : min(total_samples, (f + 1) * SAMPLES_PER_FRAME)]
        if not chunk:
            rms_values.append(0.0)
        else:
            rms_values.append(math.sqrt(sum(v * v for v in chunk) / len(chunk)))

    peak_rms = max(rms_values) if rms_values else 0.0
    if peak_rms <= 0.0:
        raise RuntimeError(f"Audio clip is completely silent: {wav_path}")

    active_indices = [i for i, e in enumerate(rms_values) if e > peak_rms * 0.08]
    phonemes = [c for c in text.lower() if c in VISEME_MAP] or ["a"]

    visemes: list[dict] = []
    active_count = len(active_indices)
    for i, energy in enumerate(rms_values):
        if i not in active_indices:
            visemes.append({"viseme": "rest", "openness": 0.0})
        else:
            pos = active_indices.index(i)
            rank = pos / max(1, active_count - 1)
            ph_idx = min(len(phonemes) - 1, int(rank * len(phonemes)))
            viseme = VISEME_MAP[phonemes[ph_idx]]
            openness = round(min(1.0, max(0.32, (energy / peak_rms) * 1.45)), 3)
            visemes.append({"viseme": viseme, "openness": openness})

    return round(duration_sec, 4), visemes


def main() -> None:
    manifest = {}
    if MANIFEST_PATH.is_file():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    manifest_lines = {item["id"]: item for item in manifest.get("lines", [])}

    built_lines: list[dict] = []
    cursor = 18  # beat1 starts at frame 18

    pause_after = [12, 16, 14, 0]
    cuts: dict[str, int] = {}

    for idx, spec in enumerate(LINES):
        wav_path = PUBLIC_AUDIO_DIR / spec["file"]
        dur_sec, visemes = analyze_clip(wav_path, spec["text"])
        dur_frames = len(visemes)
        start_frame = cursor
        end_frame = start_frame + dur_frames
        if idx == 0:
            cuts["cutToArgaMcu"] = end_frame + 6
        elif idx == 1:
            cuts["cutToKiranaEcu"] = end_frame + 8
        elif idx == 2:
            cuts["cutToRainWide"] = end_frame + 6

        meta = manifest_lines.get(spec["id"], {})
        built_lines.append(
            {
                "id": spec["id"],
                "speaker": spec["speaker"],
                "text": spec["text"],
                "audioSrc": f"audio/{spec['file']}",
                "startFrame": start_frame,
                "endFrame": end_frame,
                "durationFrames": dur_frames,
                "durationSec": dur_sec,
                "seed": meta.get("seed"),
                "generationId": meta.get("generationId"),
                "visemes": visemes,
            }
        )
        cursor = end_frame + pause_after[idx]

    last_end = built_lines[-1]["endFrame"]
    mood_start = max(cuts["cutToArgaMcu"] + 12, cuts["cutToKiranaEcu"] - 6)
    mood_end = max(cuts["cutToKiranaEcu"] + 24, cuts["cutToRainWide"] - 2)
    timing = {
        "fps": FPS,
        "beat1Start": built_lines[0]["startFrame"],
        "beat1End": built_lines[0]["endFrame"],
        "cutToArgaMcu": cuts["cutToArgaMcu"],
        "beat2Start": built_lines[1]["startFrame"],
        "beat2End": built_lines[1]["endFrame"],
        "moodTransitionStart": mood_start,
        "moodTransitionEnd": mood_end,
        "cutToKiranaEcu": cuts["cutToKiranaEcu"],
        "beat3Start": built_lines[2]["startFrame"],
        "beat3End": built_lines[2]["endFrame"],
        "cutToRainWide": cuts["cutToRainWide"],
        "beat4Start": built_lines[3]["startFrame"],
        "beat4End": built_lines[3]["endFrame"],
        "titleCardStart": last_end + 8,
        "totalFrames": last_end + 44,
    }

    voicebox_meta = {
        "generator": manifest.get("generator", "jamiepine/voicebox"),
        "engine": manifest.get("engine", "omnivoice"),
        "model": "k2-fsa/OmniVoice",
        "language": manifest.get("language", "id"),
    }

    OUT_TS_PATH.parent.mkdir(parents=True, exist_ok=True)
    ts_body = (
        "// Auto-generated by scripts/sync-pilot-audio.py — do not hand-edit.\n"
        "import type { AnimeViseme } from '../animation/animeFaceTypes';\n\n"
        "export type PilotAudioVisemeFrame = {\n"
        "  viseme: AnimeViseme;\n"
        "  openness: number;\n"
        "};\n\n"
        "export type PilotAudioLine = {\n"
        "  id: string;\n"
        "  speaker: 'Arga' | 'Kirana';\n"
        "  text: string;\n"
        "  audioSrc: string;\n"
        "  startFrame: number;\n"
        "  endFrame: number;\n"
        "  durationFrames: number;\n"
        "  durationSec: number;\n"
        "  seed?: number | null;\n"
        "  generationId?: string | null;\n"
        "  visemes: PilotAudioVisemeFrame[];\n"
        "};\n\n"
        "export const PILOT_VOICEBOX_META = "
        + json.dumps(voicebox_meta, indent=2, ensure_ascii=False)
        + " as const;\n\n"
        "export const PILOT_TIMING = "
        + json.dumps(timing, indent=2, ensure_ascii=False)
        + " as const;\n\n"
        "export const PILOT_AUDIO_LINES: PilotAudioLine[] = "
        + json.dumps(built_lines, indent=2, ensure_ascii=False)
        + ";\n"
    )
    OUT_TS_PATH.write_text(ts_body, encoding="utf-8")

    summary = [(l["id"], l["speaker"], l["startFrame"], l["endFrame"], f"{l['durationSec']}s") for l in built_lines]
    print(f"Generated {OUT_TS_PATH.relative_to(PROJECT_ROOT)} (totalFrames={timing['totalFrames']}, {(timing['totalFrames']/FPS):.2f}s)")
    print("Beats:", summary)


if __name__ == "__main__":
    main()
