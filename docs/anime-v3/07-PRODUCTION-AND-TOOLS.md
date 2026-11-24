# Production & tools
Status: local development workflow; orchestration planned.

## Start
1. Read INDEX and handoff, git status/diff, applicable AGENTS.
2. Use codebase-memory graph and exact path coverage if available. Otherwise read/rg sources; record fallback. No MCP availability assumption.
3. Use installed lockfile/dependencies. Inspect package.json and local API declarations before changing code. No dependency upgrade without concrete need.
4. Run targeted check, inspect visible output, then full existing checks after integration.
5. Update QA/handoff with real exit status and artifact paths.

## Local commands
- npm run typecheck
- npm test (legacy + V3 once registered)
- npm run build
- npm run studio
- npm run render:v3-sheet
- npm run render:v3-motion
Use installed Remotion CLI; optional CHROME executable is supplied through CLI flags. Never regenerate legacy media while doing V3 QA.

## Tools and logic
Edit SVG/TS source with patch/editor. Browser is for visual inspection, not code discovery. FFmpeg/ffprobe inspect/mix media; Remotion renders. Read official documentation if installed types don't resolve API uncertainty. Image generation is not the character renderer and cannot replace authored views. Do not send messages, upload files or spend service quota implicitly.

Voicebox defaults to optional configuration, no personal absolute paths in reusable adapters. Import WAV works independently. No secrets in docs/manifests. Preserve existing local scripts rather than claiming they're portable.

## Efficient production
540p early previews, 1080p acceptance stills. Concurrency 1 initially on this i5/16GB machine. Benchmark actual wall-time + RSS for wide/close-up/effects. Do not extrapolate the previous A timing as a V3 guarantee.

Planned orchestration stages: draft → script review → asset preflight → timing → animatic → visual review → shot render → mix → QA. Content revisions invalidate dependent stages. Deterministic errors fail immediately; transient external errors get at most 2 retries with recorded reasons. Local render resumes only from verified complete artifacts.

Final render stays blocked if script/storyboard or required visual designs are unaccepted. A silent test clip is explicitly a preview; do not label it a finished dialogue episode.
