export const V3_SCHEMA_VERSION = 1 as const;
export const V3_FPS = 24 as const;
export const V3_STAGE_WIDTH = 1920 as const;
export const V3_STAGE_HEIGHT = 1080 as const;
export const V3_MIN_PRODUCTION_SECONDS = 8 * 60;
export const V3_MAX_PRODUCTION_SECONDS = 12 * 60;

export type ViewAngle =
  | 'front'
  | 'three-quarter-right'
  | 'three-quarter-left'
  | 'profile-right'
  | 'profile-left'
  | 'back';

export type HandShape = 'relaxed' | 'open' | 'fist' | 'point' | 'grip';

export type EmotionId =
  | 'neutral'
  | 'guarded'
  | 'melancholy'
  | 'determined'
  | 'shock'
  | 'suppressed-tears'
  | 'soft-smile';

export type VisemeId =
  | 'rest'
  | 'closed-m'
  | 'narrow-e'
  | 'open-a'
  | 'round-o'
  | 'fric-fv';

export type AudioProvenance =
  | 'imported-wav-verified'
  | 'energy-assisted-manual'
  | 'forced-alignment'
  | 'manual'
  | 'demonstration-silent';

export type ApprovalStatus = 'draft' | 'review-candidate' | 'user-accepted';

export interface SeriesBible {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  id: string;
  revision: string;
  status: ApprovalStatus;
  title: string;
  language: string;
  visualDirection: 'modern-series-b';
  characterIds: string[];
}

export interface CharacterModel {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  id: string;
  displayName: string;
  visualDirection: 'modern-series-b';
  status: ApprovalStatus;
  headScaleHeads: number;
  floorBaselineY: number;
  supportedViews: ViewAngle[];
  supportedMotions: string[];
  supportedHands: HandShape[];
  supportedEmotions: EmotionId[];
}

export interface TimedViseme {
  startFrame: number;
  endFrame: number;
  viseme: VisemeId;
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  text: string;
  delivery: string;
  textSha256: string;
}

export interface DialogueTrack {
  lineId: string;
  speakerId: string;
  startFrame: number;
  endFrame: number;
  durationSeconds: number;
  audioFile: string;
  audioSha256: string;
  textSha256: string;
  text: string;
  provenance: AudioProvenance;
  visemes: TimedViseme[];
}

export interface StagePoint {
  x: number;
  y: number;
}

export interface MotionClip {
  id: string;
  characterId: string;
  motionType: string;
  durationSeconds: number;
  requiredViews: ViewAngle[];
  rootStartStage: StagePoint;
  rootEndStage: StagePoint;
}

export interface ShotPlan {
  id: string;
  sceneId: string;
  durationSeconds: number;
  framing: 'wide' | 'two-shot' | 'medium' | 'close-up' | 'extreme-close-up' | 'over-shoulder' | 'reaction' | 'insert';
  characterId: string;
  initialView: ViewAngle;
  requiredViews: ViewAngle[];
  motionClipId: string;
  dialogueLineIds: string[];
  cameraMode: 'fixed' | 'pan' | 'tracking' | 'push' | 'pull';
}

export interface EpisodeScript {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  seriesId: string;
  episodeId: string;
  revision: string;
  reviewStatus: ApprovalStatus;
  reviewFingerprint?: string;
  fps: number;
  width: number;
  height: number;
  characters: CharacterModel[];
  motionClips: MotionClip[];
  dialogueLines: DialogueLine[];
  dialogueTracks: DialogueTrack[];
  shots: ShotPlan[];
}

export interface CompiledShot {
  id: string;
  sceneId: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  characterId: string;
  initialView: ViewAngle;
  requiredViews: ViewAngle[];
  motionClip: MotionClip;
  dialogueTracks: DialogueTrack[];
  cameraMode: ShotPlan['cameraMode'];
}

export interface CompiledEpisode {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  seriesId: string;
  episodeId: string;
  revision: string;
  reviewStatus: ApprovalStatus;
  mode: 'preview' | 'production';
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  totalSeconds: number;
  shots: CompiledShot[];
  charactersById: Record<string, CharacterModel>;
}

export interface ProductionCheckpoint {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  episodeId: string;
  shotId: string;
  shotHash: string;
  rendererVersion: string;
  completed: boolean;
  outputPath: string;
}

export const ALL_VIEW_ANGLES: readonly ViewAngle[] = [
  'front',
  'three-quarter-right',
  'three-quarter-left',
  'profile-right',
  'profile-left',
  'back',
];

export const ALL_HAND_SHAPES: readonly HandShape[] = [
  'relaxed',
  'open',
  'fist',
  'point',
  'grip',
];

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

export const secondsToClipFrames = (durationSeconds: number, fps: number = V3_FPS): number =>
  Math.ceil(durationSeconds * fps);

export const secondsToOnsetFrame = (offsetSeconds: number, fps: number = V3_FPS): number =>
  Math.round(offsetSeconds * fps);
