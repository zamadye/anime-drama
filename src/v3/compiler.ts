import {
  ALL_HAND_SHAPES,
  ALL_VIEW_ANGLES,
  V3_FPS,
  V3_MAX_PRODUCTION_SECONDS,
  V3_MIN_PRODUCTION_SECONDS,
  V3_SCHEMA_VERSION,
  V3_STAGE_HEIGHT,
  V3_STAGE_WIDTH,
  isFiniteNumber,
  isNonEmptyString,
  isRecord,
  secondsToClipFrames,
  type CharacterModel,
  type CompiledEpisode,
  type CompiledShot,
  type DialogueLine,
  type DialogueTrack,
  type EpisodeScript,
  type HandShape,
  type MotionClip,
  type ShotPlan,
  type ViewAngle,
} from './contracts';

const fail = (path: string, reason: string): never => {
  throw new Error(`V3 Compiler validation error at ${path}: ${reason}`);
};

const asRecord = (val: unknown, ctx: string): Record<string, unknown> => {
  if (!isRecord(val)) {
    throw new Error(`V3 Compiler validation error at ${ctx}: expected object`);
  }
  return val;
};

const requireNonEmptyString = (obj: Record<string, unknown>, key: string, ctx: string): string => {
  const val = obj[key];
  if (!isNonEmptyString(val)) {
    fail(`${ctx}.${key}`, 'expected non-empty string');
  }
  return val as string;
};

const requirePositiveFinite = (obj: Record<string, unknown>, key: string, ctx: string): number => {
  const val = obj[key];
  if (!isFiniteNumber(val) || val <= 0) {
    fail(`${ctx}.${key}`, 'expected positive finite number');
  }
  return val as number;
};

const requireStagePoint = (val: unknown, ctx: string): { x: number; y: number } => {
  const rec = asRecord(val, ctx);
  const x = rec.x;
  const y = rec.y;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
    fail(ctx, 'stage point x and y must be finite numbers');
  }
  return { x: x as number, y: y as number };
};

const validateViewAngle = (val: unknown, ctx: string): ViewAngle => {
  if (!isNonEmptyString(val) || !(ALL_VIEW_ANGLES as readonly string[]).includes(val)) {
    fail(ctx, `unsupported view angle "${String(val)}"`);
  }
  return val as ViewAngle;
};

const validateApprovalStatus = (
  val: unknown,
  ctx: string,
): CharacterModel['status'] => {
  if (val !== 'draft' && val !== 'review-candidate' && val !== 'user-accepted') {
    fail(ctx, `invalid status "${String(val)}"`);
  }
  return val as CharacterModel['status'];
};

export const validateCharacterModel = (rawVal: unknown, ctx: string): CharacterModel => {
  const raw = asRecord(rawVal, ctx);
  if (raw.schemaVersion !== V3_SCHEMA_VERSION) {
    fail(`${ctx}.schemaVersion`, `expected ${V3_SCHEMA_VERSION}`);
  }
  const id = requireNonEmptyString(raw, 'id', ctx);
  const displayName = requireNonEmptyString(raw, 'displayName', ctx);
  if (raw.visualDirection !== 'modern-series-b') {
    fail(`${ctx}.visualDirection`, 'only modern-series-b is valid for V3 actors');
  }
  const status = validateApprovalStatus(raw.status, `${ctx}.status`);
  const headScaleHeads = requirePositiveFinite(raw, 'headScaleHeads', ctx);
  if (!isFiniteNumber(raw.floorBaselineY)) {
    fail(`${ctx}.floorBaselineY`, 'expected finite number');
  }
  if (!Array.isArray(raw.supportedViews) || raw.supportedViews.length === 0) {
    fail(`${ctx}.supportedViews`, 'expected non-empty array');
  }
  const supportedViews = (raw.supportedViews as unknown[]).map((v, i) =>
    validateViewAngle(v, `${ctx}.supportedViews[${i}]`),
  );
  if (!Array.isArray(raw.supportedMotions) || raw.supportedMotions.length === 0) {
    fail(`${ctx}.supportedMotions`, 'expected non-empty array');
  }
  const supportedMotions = (raw.supportedMotions as unknown[]).map((m, i) => {
    if (!isNonEmptyString(m)) fail(`${ctx}.supportedMotions[${i}]`, 'expected non-empty string');
    return m as string;
  });
  if (!Array.isArray(raw.supportedHands) || raw.supportedHands.length === 0) {
    fail(`${ctx}.supportedHands`, 'expected non-empty array');
  }
  const supportedHands = (raw.supportedHands as unknown[]).map((h, i) => {
    if (!isNonEmptyString(h) || !(ALL_HAND_SHAPES as readonly string[]).includes(h)) {
      fail(`${ctx}.supportedHands[${i}]`, `invalid hand shape "${String(h)}"`);
    }
    return h as HandShape;
  });
  if (!Array.isArray(raw.supportedEmotions) || raw.supportedEmotions.length === 0) {
    fail(`${ctx}.supportedEmotions`, 'expected non-empty array');
  }
  return {
    schemaVersion: V3_SCHEMA_VERSION,
    id,
    displayName,
    visualDirection: 'modern-series-b',
    status,
    headScaleHeads,
    floorBaselineY: raw.floorBaselineY as number,
    supportedViews,
    supportedMotions,
    supportedHands,
    supportedEmotions: raw.supportedEmotions as CharacterModel['supportedEmotions'],
  };
};

const validateMotionClip = (rawVal: unknown, ctx: string): MotionClip => {
  const raw = asRecord(rawVal, ctx);
  const id = requireNonEmptyString(raw, 'id', ctx);
  const characterId = requireNonEmptyString(raw, 'characterId', ctx);
  const motionType = requireNonEmptyString(raw, 'motionType', ctx);
  const durationSeconds = requirePositiveFinite(raw, 'durationSeconds', ctx);
  if (!Array.isArray(raw.requiredViews) || raw.requiredViews.length === 0) {
    fail(`${ctx}.requiredViews`, 'expected non-empty array');
  }
  const requiredViews = (raw.requiredViews as unknown[]).map((v, i) =>
    validateViewAngle(v, `${ctx}.requiredViews[${i}]`),
  );
  return {
    id,
    characterId,
    motionType,
    durationSeconds,
    requiredViews,
    rootStartStage: requireStagePoint(raw.rootStartStage, `${ctx}.rootStartStage`),
    rootEndStage: requireStagePoint(raw.rootEndStage, `${ctx}.rootEndStage`),
  };
};

const validateDialogueLine = (rawVal: unknown, ctx: string): DialogueLine => {
  const raw = asRecord(rawVal, ctx);
  return {
    id: requireNonEmptyString(raw, 'id', ctx),
    speakerId: requireNonEmptyString(raw, 'speakerId', ctx),
    text: requireNonEmptyString(raw, 'text', ctx),
    delivery: requireNonEmptyString(raw, 'delivery', ctx),
    textSha256: requireNonEmptyString(raw, 'textSha256', ctx),
  };
};

const validateDialogueTrack = (rawVal: unknown, ctx: string): DialogueTrack => {
  const raw = asRecord(rawVal, ctx);
  const lineId = requireNonEmptyString(raw, 'lineId', ctx);
  const speakerId = requireNonEmptyString(raw, 'speakerId', ctx);
  if (!isFiniteNumber(raw.startFrame) || !Number.isInteger(raw.startFrame) || raw.startFrame < 0) {
    fail(`${ctx}.startFrame`, 'expected non-negative integer frame');
  }
  if (!isFiniteNumber(raw.endFrame) || !Number.isInteger(raw.endFrame) || raw.endFrame <= (raw.startFrame as number)) {
    fail(`${ctx}.endFrame`, 'expected integer frame > startFrame');
  }
  const durationSeconds = requirePositiveFinite(raw, 'durationSeconds', ctx);
  const audioFile = requireNonEmptyString(raw, 'audioFile', ctx);
  const audioSha256 = requireNonEmptyString(raw, 'audioSha256', ctx);
  const textSha256 = requireNonEmptyString(raw, 'textSha256', ctx);
  const text = requireNonEmptyString(raw, 'text', ctx);
  const provenance = requireNonEmptyString(raw, 'provenance', ctx) as DialogueTrack['provenance'];
  if (!Array.isArray(raw.visemes)) {
    fail(`${ctx}.visemes`, 'expected visemes array');
  }
  const visemes = (raw.visemes as unknown[]).map((vItem, i) => {
    const v = asRecord(vItem, `${ctx}.visemes[${i}]`);
    if (!isFiniteNumber(v.startFrame) || !isFiniteNumber(v.endFrame) || (v.endFrame as number) <= (v.startFrame as number)) {
      fail(`${ctx}.visemes[${i}]`, 'invalid frame interval [startFrame, endFrame)');
    }
    const viseme = requireNonEmptyString(v, 'viseme', `${ctx}.visemes[${i}]`) as DialogueTrack['visemes'][number]['viseme'];
    return {
      startFrame: v.startFrame as number,
      endFrame: v.endFrame as number,
      viseme,
    };
  });
  return {
    lineId,
    speakerId,
    startFrame: raw.startFrame as number,
    endFrame: raw.endFrame as number,
    durationSeconds,
    audioFile,
    audioSha256,
    textSha256,
    text,
    provenance,
    visemes,
  };
};

const validateShotPlan = (rawVal: unknown, ctx: string): ShotPlan => {
  const raw = asRecord(rawVal, ctx);
  const id = requireNonEmptyString(raw, 'id', ctx);
  const sceneId = requireNonEmptyString(raw, 'sceneId', ctx);
  const durationSeconds = requirePositiveFinite(raw, 'durationSeconds', ctx);
  const framing = requireNonEmptyString(raw, 'framing', ctx) as ShotPlan['framing'];
  const characterId = requireNonEmptyString(raw, 'characterId', ctx);
  const initialView = validateViewAngle(raw.initialView, `${ctx}.initialView`);
  if (!Array.isArray(raw.requiredViews) || raw.requiredViews.length === 0) {
    fail(`${ctx}.requiredViews`, 'expected non-empty array');
  }
  const requiredViews = (raw.requiredViews as unknown[]).map((v, i) =>
    validateViewAngle(v, `${ctx}.requiredViews[${i}]`),
  );
  const motionClipId = requireNonEmptyString(raw, 'motionClipId', ctx);
  if (!Array.isArray(raw.dialogueLineIds)) {
    fail(`${ctx}.dialogueLineIds`, 'expected string array');
  }
  const dialogueLineIds = (raw.dialogueLineIds as unknown[]).map((d, i) => {
    if (!isNonEmptyString(d)) fail(`${ctx}.dialogueLineIds[${i}]`, 'expected non-empty string');
    return d as string;
  });
  const cameraMode = requireNonEmptyString(raw, 'cameraMode', ctx) as ShotPlan['cameraMode'];
  return {
    id,
    sceneId,
    durationSeconds,
    framing,
    characterId,
    initialView,
    requiredViews,
    motionClipId,
    dialogueLineIds,
    cameraMode,
  };
};

export const validateEpisodeInput = (rawInput: unknown): EpisodeScript => {
  const input = asRecord(rawInput, 'root');
  if (input.schemaVersion !== V3_SCHEMA_VERSION) {
    fail('schemaVersion', `expected ${V3_SCHEMA_VERSION}`);
  }
  const seriesId = requireNonEmptyString(input, 'seriesId', 'root');
  const episodeId = requireNonEmptyString(input, 'episodeId', 'root');
  const revision = requireNonEmptyString(input, 'revision', 'root');
  const reviewStatus = validateApprovalStatus(input.reviewStatus, 'reviewStatus');
  if (input.fps !== V3_FPS) {
    fail('fps', `V3 requires exact ${V3_FPS}fps`);
  }
  if (input.width !== V3_STAGE_WIDTH || input.height !== V3_STAGE_HEIGHT) {
    fail('resolution', `V3 stage requires ${V3_STAGE_WIDTH}x${V3_STAGE_HEIGHT}`);
  }
  if (!Array.isArray(input.characters) || input.characters.length === 0) {
    fail('characters', 'expected non-empty array');
  }
  const characters = (input.characters as unknown[]).map((c, i) =>
    validateCharacterModel(c, `characters[${i}]`),
  );
  if (!Array.isArray(input.motionClips) || input.motionClips.length === 0) {
    fail('motionClips', 'expected non-empty array');
  }
  const motionClips = (input.motionClips as unknown[]).map((m, i) =>
    validateMotionClip(m, `motionClips[${i}]`),
  );
  if (!Array.isArray(input.dialogueLines)) {
    fail('dialogueLines', 'expected array');
  }
  const dialogueLines = (input.dialogueLines as unknown[]).map((l, i) =>
    validateDialogueLine(l, `dialogueLines[${i}]`),
  );
  if (!Array.isArray(input.dialogueTracks)) {
    fail('dialogueTracks', 'expected array');
  }
  const dialogueTracks = (input.dialogueTracks as unknown[]).map((t, i) =>
    validateDialogueTrack(t, `dialogueTracks[${i}]`),
  );
  if (!Array.isArray(input.shots) || input.shots.length === 0) {
    fail('shots', 'expected non-empty array');
  }
  const shots = (input.shots as unknown[]).map((s, i) => validateShotPlan(s, `shots[${i}]`));

  return {
    schemaVersion: V3_SCHEMA_VERSION,
    seriesId,
    episodeId,
    revision,
    reviewStatus,
    reviewFingerprint: isNonEmptyString(input.reviewFingerprint) ? (input.reviewFingerprint as string) : undefined,
    fps: V3_FPS,
    width: V3_STAGE_WIDTH,
    height: V3_STAGE_HEIGHT,
    characters,
    motionClips,
    dialogueLines,
    dialogueTracks,
    shots,
  };
};

export const compileEpisode = (
  input: unknown,
  mode: 'preview' | 'production' = 'preview',
): CompiledEpisode => {
  const script = validateEpisodeInput(input);

  const charactersById: Record<string, CharacterModel> = {};
  for (const ch of script.characters) {
    if (charactersById[ch.id]) {
      fail(`characters.${ch.id}`, 'duplicate character ID');
    }
    charactersById[ch.id] = ch;
  }

  const clipsById: Record<string, MotionClip> = {};
  for (const clip of script.motionClips) {
    if (clipsById[clip.id]) {
      fail(`motionClips.${clip.id}`, 'duplicate motionClip ID');
    }
    const ch = charactersById[clip.characterId];
    if (!ch) {
      fail(`motionClips.${clip.id}.characterId`, `unknown character "${clip.characterId}"`);
    }
    if (!ch.supportedMotions.includes(clip.motionType)) {
      fail(
        `motionClips.${clip.id}.motionType`,
        `character "${ch.id}" does not support motion "${clip.motionType}"`,
      );
    }
    for (const view of clip.requiredViews) {
      if (!ch.supportedViews.includes(view)) {
        fail(
          `motionClips.${clip.id}.requiredViews`,
          `character "${ch.id}" does not support required view "${view}"`,
        );
      }
    }
    clipsById[clip.id] = clip;
  }

  const linesById: Record<string, DialogueLine> = {};
  for (const line of script.dialogueLines) {
    if (linesById[line.id]) {
      fail(`dialogueLines.${line.id}`, 'duplicate dialogueLine ID');
    }
    if (!charactersById[line.speakerId]) {
      fail(`dialogueLines.${line.id}.speakerId`, `unknown speaker "${line.speakerId}"`);
    }
    linesById[line.id] = line;
  }

  const tracksByLineId: Record<string, DialogueTrack> = {};
  for (const track of script.dialogueTracks) {
    const line = linesById[track.lineId];
    if (!line) {
      fail(`dialogueTracks.${track.lineId}`, `missing matching dialogueLine "${track.lineId}"`);
    }
    if (track.speakerId !== line.speakerId) {
      fail(`dialogueTracks.${track.lineId}.speakerId`, 'speakerId mismatch with dialogueLine');
    }
    if (track.textSha256 !== line.textSha256) {
      fail(`dialogueTracks.${track.lineId}.textSha256`, 'text hash mismatch with approved dialogueLine');
    }
    tracksByLineId[track.lineId] = track;
  }

  const compiledShots: CompiledShot[] = [];
  const seenShotIds = new Set<string>();
  let cursorFrame = 0;

  for (const shot of script.shots) {
    if (seenShotIds.has(shot.id)) {
      fail(`shots.${shot.id}`, 'duplicate shot ID');
    }
    seenShotIds.add(shot.id);

    const ch = charactersById[shot.characterId];
    if (!ch) {
      fail(`shots.${shot.id}.characterId`, `unknown character "${shot.characterId}"`);
    }
    if (!ch.supportedViews.includes(shot.initialView)) {
      fail(
        `shots.${shot.id}.initialView`,
        `character "${ch.id}" does not support view "${shot.initialView}"`,
      );
    }
    for (const view of shot.requiredViews) {
      if (!ch.supportedViews.includes(view)) {
        fail(
          `shots.${shot.id}.requiredViews`,
          `character "${ch.id}" does not support view "${view}"`,
        );
      }
    }

    const clip = clipsById[shot.motionClipId];
    if (!clip) {
      fail(`shots.${shot.id}.motionClipId`, `unknown motionClip "${shot.motionClipId}"`);
    }
    if (clip.characterId !== ch.id) {
      fail(
        `shots.${shot.id}.motionClipId`,
        `clip belongs to "${clip.characterId}", not shot character "${ch.id}"`,
      );
    }

    const shotTracks: DialogueTrack[] = [];
    for (const lineId of shot.dialogueLineIds) {
      if (!linesById[lineId]) {
        fail(`shots.${shot.id}.dialogueLineIds`, `unknown dialogueLine "${lineId}"`);
      }
      const track = tracksByLineId[lineId];
      if (!track) {
        if (mode === 'production') {
          fail(`shots.${shot.id}.dialogueLineIds`, `missing audio track for "${lineId}"`);
        }
      } else {
        if (mode === 'production' && track.provenance === 'demonstration-silent') {
          fail(
            `shots.${shot.id}.dialogueLineIds`,
            `demonstration-silent audio is forbidden in production for "${lineId}"`,
          );
        }
        shotTracks.push(track);
      }
    }

    const durationFrames = secondsToClipFrames(shot.durationSeconds, script.fps);
    if (durationFrames <= 0) {
      fail(`shots.${shot.id}.durationSeconds`, 'compiled durationFrames must be positive');
    }
    const startFrame = cursorFrame;
    const endFrame = cursorFrame + durationFrames;
    cursorFrame = endFrame;

    compiledShots.push({
      id: shot.id,
      sceneId: shot.sceneId,
      startFrame,
      endFrame,
      durationFrames,
      characterId: ch.id,
      initialView: shot.initialView,
      requiredViews: shot.requiredViews,
      motionClip: clip,
      dialogueTracks: shotTracks,
      cameraMode: shot.cameraMode,
    });
  }

  const totalSeconds = cursorFrame / script.fps;
  if (mode === 'production') {
    if (script.reviewStatus !== 'user-accepted' || !script.reviewFingerprint) {
      fail('reviewStatus', 'production compilation requires user-accepted reviewStatus and reviewFingerprint');
    }
    if (totalSeconds < V3_MIN_PRODUCTION_SECONDS || totalSeconds > V3_MAX_PRODUCTION_SECONDS) {
      fail(
        'duration',
        `production episode must be 8-12 minutes (${V3_MIN_PRODUCTION_SECONDS}-${V3_MAX_PRODUCTION_SECONDS}s), got ${totalSeconds.toFixed(1)}s`,
      );
    }
    for (const ch of script.characters) {
      if (ch.status !== 'user-accepted') {
        fail(`characters.${ch.id}.status`, 'production requires user-accepted character model');
      }
    }
  }

  return {
    schemaVersion: V3_SCHEMA_VERSION,
    seriesId: script.seriesId,
    episodeId: script.episodeId,
    revision: script.revision,
    reviewStatus: script.reviewStatus,
    mode,
    fps: script.fps,
    width: script.width,
    height: script.height,
    totalFrames: cursorFrame,
    totalSeconds,
    shots: compiledShots,
    charactersById,
  };
};
