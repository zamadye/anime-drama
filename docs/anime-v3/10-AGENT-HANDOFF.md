# Agent handoff
Status: active implementation; read qa/latest.md before continuing.
Date: 2026-11-24, Asia/Kuching. Baseline commit 265a563.

## Locked user intent
B Modern Series, authored vector actors, full-motion drama, 8–12min landscape, multiple serials, imported audio + optional Voicebox, script/storyboard review per episode. User rejected the A cutout prototype as lifeless/inconsistent.

## Resume
1. Read INDEX, DECISIONS, git diff and latest QA.
2. Run typecheck/tests before modifying the candidate.
3. Inspect V3 sheet and motion study artifacts; do not assume artistic acceptance.
4. Work ART-01/ART-02, then request concrete visual review using delivered artifacts.
5. Only then expand cast and production scene.

## Ownership
V3 code under src/v3, V3 tests/tools under scripts, brief under docs/anime-v3, data under content. Legacy and untracked Voicebox/audio work remain user-owned. Coordinate any shared entrypoint change with other agents.

## Stop/resume record
Before ending a session record: exact changed files or git diff summary, checks/exit statuses, artifacts with local paths, known defects, next single command/task, user acceptance state. Do not make the next agent replay the chat or redo research.

## Tool independence
Codex/Gemini/Argon may use different editors, shell or graph tools. Required outcome and contracts are identical. No model-specific internal memory is authoritative. Read installed tooling; use source fallback when MCP unavailable. Never claim a tool was used when it was absent.

## Current limit
This delivery is the foundation and design review candidate, not a finished production system or episode. User gates in the approved plan intentionally precede M3–M6.
