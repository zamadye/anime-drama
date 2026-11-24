import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
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
import './studio.css';

type V3DemoId = 'v3-motion-study' | 'v3-model-sheet';

const DEMOS: {
  id: V3DemoId;
  label: string;
  width: number;
  height: number;
  fps: number;
  frames: number;
}[] = [
  {
    id: 'v3-model-sheet',
    label: 'M1: Arga Model Sheet (6 Views + Hands)',
    width: 1920,
    height: 1080,
    fps: MODEL_SHEET_FPS,
    frames: MODEL_SHEET_FRAMES,
  },
  {
    id: 'v3-motion-study',
    label: 'M2: Arga 8s Walk/Turn/Dialogue Study',
    width: 1920,
    height: 1080,
    fps: MOTION_STUDY_FPS,
    frames: MOTION_STUDY_FRAMES,
  },
];

const StudioApp: React.FC = () => {
  const [selected, setSelected] = useState<V3DemoId>('v3-model-sheet');
  const [showHud, setShowHud] = useState(true);

  const demo = DEMOS.find((d) => d.id === selected) ?? DEMOS[0];

  return (
    <div className="anime-studio-shell">
      <header className="anime-studio-header">
        <div>
          <h1>Anime Drama V3 · Modern Series B</h1>
          <p>
            Full Procedural SVG Vector Rigs · Deterministic 24fps Kinematics · Stage-Locked Contacts
          </p>
        </div>
        <div className="anime-studio-controls">
          <div className="anime-tabs">
            {DEMOS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === selected ? 'active' : ''}
                onClick={() => setSelected(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {selected === 'v3-motion-study' && (
            <label className="reduced-toggle">
              <input
                type="checkbox"
                checked={showHud}
                onChange={(e) => setShowHud(e.target.checked)}
              />
              Telemetry HUD
            </label>
          )}
        </div>
      </header>

      <main className="anime-stage">
        {selected === 'v3-model-sheet' ? (
          <Player
            component={ArgaModelSheet}
            durationInFrames={demo.frames}
            fps={demo.fps}
            compositionWidth={demo.width}
            compositionHeight={demo.height}
            controls
            style={{ width: '100%', maxWidth: 1180, aspectRatio: '16 / 9' }}
          />
        ) : (
          <Player
            component={ArgaMotionStudy}
            inputProps={{ showHud, muted: false }}
            durationInFrames={demo.frames}
            fps={demo.fps}
            compositionWidth={demo.width}
            compositionHeight={demo.height}
            controls
            style={{ width: '100%', maxWidth: 1180, aspectRatio: '16 / 9' }}
          />
        )}
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<StudioApp />);
