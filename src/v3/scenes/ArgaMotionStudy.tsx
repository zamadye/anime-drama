import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { r1 } from '../../engine/math';
import {
  ARGA_MOTION_STUDY_FPS,
  ARGA_MOTION_STUDY_FRAMES,
  STAGE_FLOOR_Y,
  evaluateArgaStudyFrame,
} from '../acting';
import { ARGA_STUDY_DIALOGUE_TRACK } from '../audio/argaStudyDialogue';
import { ArgaActor } from '../art/arga';

export const MOTION_STUDY_FPS = ARGA_MOTION_STUDY_FPS;
export const MOTION_STUDY_FRAMES = ARGA_MOTION_STUDY_FRAMES;

export interface ArgaMotionStudyProps {
  showHud?: boolean;
  muted?: boolean;
}

const RAILING_POST_XS = [140, 360, 580, 800, 1020, 1240, 1460, 1680, 1860];
const FLOOR_MARKERS = [600, 700, 800, 900, 960, 1000];

export const ArgaMotionStudy: React.FC<ArgaMotionStudyProps> = ({
  showHud = true,
  muted = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const state = evaluateArgaStudyFrame(frame, fps, 'arga-study-main');

  const isSpeaking =
    frame >= ARGA_STUDY_DIALOGUE_TRACK.startFrame &&
    frame < ARGA_STUDY_DIALOGUE_TRACK.endFrame;

  const speechDurationFrames =
    ARGA_STUDY_DIALOGUE_TRACK.endFrame - ARGA_STUDY_DIALOGUE_TRACK.startFrame;

  const skySkylinePts =
    '0,660 0,585 95,585 95,532 165,532 165,574 250,574 250,492 340,492 340,560 445,560 445,515 530,515 530,582 650,582 650,545 770,545 770,588 890,588 890,520 980,520 980,568 1120,568 1120,502 1210,502 1210,572 1360,572 1360,536 1465,536 1465,582 1595,582 1595,512 1705,512 1705,574 1825,574 1825,545 1920,545 1920,660';

  return (
    <AbsoluteFill style={{ backgroundColor: '#192030' }}>
      {!muted && (
        <Sequence
          from={ARGA_STUDY_DIALOGUE_TRACK.startFrame}
          durationInFrames={speechDurationFrames + 2}
        >
          <Audio src={staticFile(ARGA_STUDY_DIALOGUE_TRACK.audioFile)} />
        </Sequence>
      )}

      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fixed-camera Modern Series B dusk overpass sky (cel color bands) */}
        <rect x={0} y={0} width={1920} height={240} fill="#6F7D96" />
        <rect x={0} y={240} width={1920} height={190} fill="#8F97AA" />
        <rect x={0} y={430} width={1920} height={140} fill="#B8ACAE" />
        <rect x={0} y={570} width={1920} height={125} fill="#DEC2AD" />

        {/* Soft dusk cloud silhouettes */}
        <path
          d="M 120 355 Q 240 315 390 348 Q 520 322 650 358 L 120 365 Z"
          fill="#A9A5B2"
          opacity={0.48}
        />
        <path
          d="M 1140 310 Q 1300 265 1470 302 Q 1620 278 1780 316 L 1140 324 Z"
          fill="#9DA2B4"
          opacity={0.45}
        />

        {/* Far city skyline silhouette */}
        <polygon points={skySkylinePts} fill="#5C6277" opacity={0.72} />
        <rect x={0} y={655} width={1920} height={90} fill="#4E5468" />

        {/* Overhead rail gantry hints across horizon */}
        <line x1={0} y1={624} x2={1920} y2={624} stroke="#3E4354" strokeWidth={2.4} />
        <line x1={0} y1={635} x2={1920} y2={635} stroke="#3E4354" strokeWidth={1.6} />

        {/* Midground pedestrian overpass balustrade */}
        <rect x={0} y={836} width={1920} height={24} fill="#545B6E" stroke="#2D3241" strokeWidth={1.6} />
        <line x1={0} y1={722} x2={1920} y2={722} stroke="#333A4B" strokeWidth={8} />
        <line x1={0} y1={719} x2={1920} y2={719} stroke="#7A839B" strokeWidth={2} />
        <line x1={0} y1={776} x2={1920} y2={776} stroke="#3B4255" strokeWidth={4} />
        {RAILING_POST_XS.map((px) => (
          <g key={px}>
            <rect x={px - 6} y={716} width={12} height={122} fill="#3A4052" stroke="#232836" strokeWidth={1.4} />
            <rect x={px - 2} y={720} width={3} height={114} fill="#5A637C" />
          </g>
        ))}

        {/* Sidewalk ground plane deck with crisp STAGE_FLOOR_Y = 935 calibration strip */}
        <rect x={0} y={860} width={1920} height={220} fill="#898D99" />
        <rect x={0} y={860} width={1920} height={16} fill="#6F7482" />
        <rect x={0} y={962} width={1920} height={118} fill="#767A86" />

        {/* Pavement perspective expansion joints & floor-lock ticks */}
        {Array.from({ length: 13 }).map((_, idx) => {
          const xTop = 60 + idx * 155;
          return (
            <line
              key={idx}
              x1={xTop}
              y1={860}
              x2={xTop - 90}
              y2={1080}
              stroke="#686C78"
              strokeWidth={1.5}
              opacity={0.75}
            />
          );
        })}
        <line x1={0} y1={STAGE_FLOOR_Y} x2={1920} y2={STAGE_FLOOR_Y} stroke="#5F6575" strokeWidth={1.6} strokeDasharray="8 8" />
        {FLOOR_MARKERS.map((mx) => (
          <g key={mx}>
            <line x1={mx} y1={STAGE_FLOOR_Y - 5} x2={mx} y2={STAGE_FLOOR_Y + 7} stroke="#363B48" strokeWidth={1.5} />
            {showHud && (
              <text
                x={mx}
                y={STAGE_FLOOR_Y + 21}
                textAnchor="middle"
                fill="#444A59"
                fontSize={10.5}
                fontFamily="monospace"
              >
                {mx}
              </text>
            )}
          </g>
        ))}

        {/* Arga character evaluated cleanly per integer frame */}
        <ArgaActor {...state.actor} />

        {/* Anime Drama Subtitle anchored inside dialogue window [98..157) */}
        {isSpeaking && (
          <g>
            <rect
              x={510}
              y={978}
              width={900}
              height={54}
              rx={8}
              fill="rgba(16, 20, 32, 0.82)"
              stroke="rgba(232, 210, 178, 0.35)"
              strokeWidth={1.2}
            />
            <text
              x={960}
              y={1012}
              textAnchor="middle"
              fill="#F8F3EC"
              fontSize={25}
              fontWeight={600}
              fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
              letterSpacing={0.3}
            >
              “{ARGA_STUDY_DIALOGUE_TRACK.text}”
            </text>
          </g>
        )}

        {/* Engineering inspection telemetry bar */}
        {showHud && (
          <g>
            <rect x={24} y={20} width={1872} height={42} rx={7} fill="rgba(16, 21, 34, 0.88)" stroke="#33405C" strokeWidth={1.2} />
            <text x={42} y={46} fill="#E8EEF9" fontSize={13.5} fontWeight={700} fontFamily="monospace">
              V3 ARGA MOTION STUDY · FIXED CAMERA (1920x1080 @ 24fps)
            </text>
            <text x={555} y={46} fill="#9DB6DE" fontSize={13} fontFamily="monospace">
              {`FRAME ${String(frame).padStart(3, '0')}/${ARGA_MOTION_STUDY_FRAMES - 1} · PHASE: ${state.phase.toUpperCase()} · VIEW: ${state.view} · VISEME: ${state.viseme}`}
            </text>
            <text x={1380} y={46} fill={state.ikDiagnostics.anyClamped || state.footContacts.maxTargetErrorPx > 2 ? '#FF8F8F' : '#8CE3B0'} fontSize={13} fontWeight={700} fontFamily="monospace">
              {`STANCE ERR: ${r1(state.footContacts.maxTargetErrorPx)}px · IK CLAMP: ${state.ikDiagnostics.anyClamped ? 'YES' : 'NO'}`}
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
