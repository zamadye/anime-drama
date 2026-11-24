# Technical contracts
Status: starter contracts/compiler implemented in src/v3; full pipeline backlog.

## Sources of truth
Executable types: src/v3/contracts.ts. Runtime validation/compiler: src/v3/compiler.ts. Test fixtures: content/examples. Documents describe intent; code tests verify supported subset. Do not advertise planned fields as working rendering features.

## Time and coordinates
Frame intervals [start,end), integer, 24fps. Seconds-to-frames: ceil(durationSeconds * fps) for clip allocation; onset events round to nearest frame. Keep original seconds in audio manifest. Shot local time + startFrame = episode time. Never reset actor noise/physics seed at chunk boundaries.

Stage: 1920×1080 units, x right/y down; camera transforms stage to screen. Actor local feet baseline documented by renderer. Motion targets use stage coordinates; convert once to local coordinates before IK. Avoid mixing normalized anchor ratios, pixel coordinates and world coordinates.

## Core data
SeriesBible, EpisodeScript, ShotPlan, CharacterModel, MotionClip, DialogueTrack, CompiledEpisode, ProductionCheckpoint. IDs are stable nonempty strings. Schema version 1 for the V3 data family. Profiles and series packages have explicit capability lists.

Compiler takes unknown input and validates shape, IDs, references, positive durations and finite numbers before constructing a timeline. Preview may use shorter fixtures; final requires 8–12 minutes, matching reviewed content, supported capabilities and resolved audio. Unsupported IDs/views/motions fail; no silent actor substitution.

Pure compilation does not assert that physical files exist. A separate file preflight must verify local media, sample rates, durations and decoding before production. This preflight and final production export remain backlog until implemented.

## Compatibility
Legacy scenes and composition IDs stay intact. V3 composition IDs are separate. Existing untracked audio/scripts are preserved. No global cast rewrite until design approval.

## Future interfaces
Audio provider resolves stable line IDs to local files, voice ID, text hash and source metadata. Alignment produces timed visemes with provenance (manual/forced/energy-estimate). Renderer consumes CompiledEpisode only; no network.

Shot cache key includes shot data, incoming state, content/assets hash, renderer version and render settings. Never trust filename alone. Add cache/mixer only after visual gate; do not fake resume success with missing artifact files.
