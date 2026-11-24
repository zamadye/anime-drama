# Product & baseline
Status: agreed brief; implementation staged.

## Problem
The rejected prototype cuts actors out of an AI lineup and rotates/translates image layers. It improves illustration detail but cannot provide consistent perspective changes or full body acting. Do not repeat that architecture for V3 characters.

## Product
A local, data-driven anime production engine: series bible → episode script → continuity review → storyboard/shot plan → user review → audio/timing → animation → per-shot render → mix → QA. Support multiple series through data and character packages, not duplicated JSX episodes.

Primary audience: Indonesian viewers of episodic drama. Example: Arga (27, architect with regret), Kirana (25, illustrator leaving home), Pak Hendra (54, her father/ex-train driver), Sena (16, her brother). Existing identities are source facts; new events remain proposed until reviewed.

## Baseline evidence
Commit 265a563: React 19.2.3, Remotion 4.0.545, Vite 7.3.8, TS 5.9.3. Current pilot is 360 frames with hard-coded dialogue. Four legacy compositions exist. Shared math, camera and IK are reusable after tests; old SVG geometry is reference, not accepted final art.

Preserve untracked public/audio and Voicebox/sync scripts. They are user work, not approved production integrations. Legacy qa-report.md describes Direction A only.

## Boundaries
Build inside anime-drama. No automatic publishing, paid-service dependency, automatic cast cloning, root project rewrite or dependency upgrades. Portrait is a later reframe pass, never a blind crop of landscape. Audio provenance is recorded, not invented.

Completion means accepted visual acting plus verified output, not merely a green build. A ten-minute placeholder slideshow does not satisfy an episode.
