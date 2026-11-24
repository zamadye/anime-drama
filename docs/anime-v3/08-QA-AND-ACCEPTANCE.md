# QA & acceptance
Status: acceptance rules; execution evidence below is maintained separately.
See [latest evidence](qa/latest.md).

## Automated
Typecheck, existing tests and V3 tests. Validate unknown JSON at boundary, IDs/references, finite values, supported capabilities, durations and review fingerprints. Reject missing voices/media for production. Foot contacts are checked numerically; max target drift 2px at 1080p stance. IK targets reachable, lengths stable, no NaN.

Seek frames out of order and compare pure state. Check visual clip/mask IDs unique when multiple actors render. Verify no image tags/raster dependencies in V3 character artwork. Render a frame in isolation and as part of a range; compare under same browser/environment.

## Visual
Sheet: identity across all six views, adult anatomy, distinct silhouette, correct material colors. Motion: watch at 1× and inspect contact/turn/gesture frames. No sliding feet, broken wrist, doubled face, flipped hair part, clothing gaps or ghosted contours. Head, torso, hands and gaze express intention independently.

Fixed-camera walk → stop → turn → gesture must read without camera movement. Tests passing is not artistic acceptance. User acceptance of Arga sheet gates mass cast production; M2/M3 acceptance gates long-episode production.

## Audio/story
Approved text matches voice file/text hash. Silence means rest mouth. Lip sync within 2 frames on verified samples, not a blanket claim for energy-only estimation. Subtitles follow same line IDs/timing. No clipped words at cuts; no missing audio in final export. Canon/knowledge/props consistent across scenes.

## Performance
Record resolution, fps, concurrency, browser, render duration and memory. Avoid expensive repeated filters. Full episode within 8–12min; no filler/slideshow to satisfy runtime. Runtime target does not override acting quality.

## Evidence standard
Every claim: command or inspection → result → artifact → limitation. Separate 'implemented', 'tested', 'visually inspected', 'accepted by user'. Never copy the previous qa-report's assertions into V3 evidence.
