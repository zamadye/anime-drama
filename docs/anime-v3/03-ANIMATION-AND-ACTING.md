# Animation & acting
Status: production specification; prototype is explicitly smaller.

## Full-motion standard
Continuous intentional performance with physical movement. Holds support emotion; periodic bobbing is not acting. Include locomotion, orientation changes, gestures, sit/stand and object handling. Camera movement must not substitute for body movement.

Evaluation order: clip/root trajectory → authored acting pose → contact/IK constraints → expression/viseme → secondary motion → camera. Use pure functions of frame + stable inputs; seeking and out-of-order rendering must produce the same pose.

## Timing
Integer frames at 24fps. Plan anticipation, action, overshoot and settle. Camera can evaluate each frame; selective animation on twos is allowed when intentional. Never reduce frame rate globally to hide bad transitions.

## Locomotion
A clip stores stage-space planted foot targets and swing intervals. Root travels relative to those targets. Two-bone legs solve ankle targets, with knees bending in the intended direction. Contact shadow follows actual feet. Boot stays oriented to floor during stance. Start/stop includes weight transfer, not an abrupt cycle freeze. Root path and gait stride must agree.

Targets outside reach are reported; never hide systematic IK clamping. Contact tests are necessary but do not prove an attractive walk.

## Interaction
Prop ownership states: world → left/right hand → other hand/world. Each transfer has a frame and attachment transform. A chair has seat height and contact point. Sitting changes pelvis, legs, coat/skirt; do not rotate one whole-body image.

## View transitions
Draw compatible contour landmarks and in-betweens for turns. Switch occlusion order at defined points. Profile must show one near eye, proper nose silhouette and far-side compression. Do not crossfade two whole faces. Head turn leads torso; shoulders/pelvis follow with different timing.

## Performance library
Walk-start/loop/stop, turn, weight-shift, sit/stand, reach/grasp/release/pass, dialogue open-hand/point, listening, recoil, sigh, contained tears. Store valid views and required assets on each clip. Missing capability → actionable preflight error.

Arga's eight-second study is a development sample, not the completed library. No audio means no claimed lip-sync. Record demonstration mouth cues as demonstration, separate from audio-derived cues.
