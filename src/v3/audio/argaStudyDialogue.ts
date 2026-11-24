import type { DialogueTrack, VisemeId } from '../contracts';

/**
 * Verified timing and viseme map derived directly from 24kHz PCM16 energy analysis
 * of `public/audio/pilot-arga-01.wav` (2.450s, 59 frames at 24fps).
 *
 * Speech placement in `V3-Arga-Motion-Study`: frames [98, 157).
 * Lead frames [98..101] and comma pause [133..136] and tail silence [152..157)
 * intentionally resolve to `'rest'` matching measured WAV RMS drops (< 0.08 peak).
 */
export const ARGA_STUDY_DIALOGUE_TRACK: DialogueTrack = {
  lineId: 'pilot-arga-01',
  speakerId: 'arga_v3',
  startFrame: 98,
  endFrame: 157,
  durationSeconds: 2.45,
  audioFile: 'audio/pilot-arga-01.wav',
  audioSha256: 'efea5817c6af95f85bfa939cebb98b0636fdaacc46fdc2520130a2c569168947',
  textSha256: '677547a6d2909db4eb2b0c15228d305148248a2dba2625e14c3ed0238b72af0d',
  text: 'Keretamu berangkat dua jam lagi, Kirana.',
  provenance: 'energy-assisted-manual',
  visemes: [
    // "Ke-re-" (track f04..f08 -> global 102..107)
    { startFrame: 102, endFrame: 104, viseme: 'narrow-e' },
    { startFrame: 104, endFrame: 107, viseme: 'open-a' },
    // "-ta-mu" (track f09..f12 -> global 107..111)
    { startFrame: 107, endFrame: 109, viseme: 'open-a' },
    { startFrame: 109, endFrame: 110, viseme: 'closed-m' },
    { startFrame: 110, endFrame: 112, viseme: 'round-o' },
    // "be-rang-kat" (track f13..f19 -> global 111..118)
    { startFrame: 112, endFrame: 113, viseme: 'closed-m' },
    { startFrame: 113, endFrame: 116, viseme: 'open-a' },
    { startFrame: 116, endFrame: 118, viseme: 'narrow-e' },
    // "du-a" (track f20..f23 -> global 118..122)
    { startFrame: 118, endFrame: 120, viseme: 'round-o' },
    { startFrame: 120, endFrame: 122, viseme: 'open-a' },
    // "jam la-gi" (track f24..f34 -> global 122..133)
    { startFrame: 122, endFrame: 124, viseme: 'open-a' },
    { startFrame: 124, endFrame: 125, viseme: 'closed-m' },
    { startFrame: 125, endFrame: 128, viseme: 'open-a' },
    { startFrame: 128, endFrame: 133, viseme: 'narrow-e' },
    // comma silence [133..136) -> rest
    // "Ki-ra-na" (track f38..f53 -> global 136..152, with pause dip 144..148)
    { startFrame: 136, endFrame: 138, viseme: 'narrow-e' },
    { startFrame: 138, endFrame: 142, viseme: 'open-a' },
    { startFrame: 142, endFrame: 144, viseme: 'narrow-e' },
    { startFrame: 148, endFrame: 151, viseme: 'open-a' },
    { startFrame: 151, endFrame: 152, viseme: 'narrow-e' },
    // tail silence [152..157) -> rest
  ],
};

export const sampleVerifiedViseme = (track: DialogueTrack, frame: number): VisemeId => {
  if (frame < track.startFrame || frame >= track.endFrame) {
    return 'rest';
  }
  for (const seg of track.visemes) {
    if (frame >= seg.startFrame && frame < seg.endFrame) {
      return seg.viseme;
    }
  }
  return 'rest';
};
