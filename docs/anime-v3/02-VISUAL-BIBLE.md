# Visual bible — Modern Series B
Status: direction locked; Arga design candidate awaits user review.

Reference: [B lineup](../../references/character-options/option-b-modern-series.png). Reference only: no crop, trace-to-bitmap, raster face, or AI-generated replacement actor in the V3 renderer.

## Drawing system
Author editable SVG paths with deliberate anatomy and silhouette. Adult target roughly 7–7.5 heads; Sena slightly shorter. Natural neck, clavicle and shoulder slope; credible ribcage/pelvis; hands reach upper/mid thigh at rest. Do not reuse the previous extremely narrow straight torso.

Three values per material: base, cel shadow, restrained highlight. Ink is a dark local hue rather than uniform heavy black. Exterior contour stronger than facial detail. Avoid broad gradients, plastic gloss and excessively symmetrical polygon hair. Use crisp two-step shadows and purposeful folds at elbows, waist, knee and fabric tension.

## Identity locks
| Actor | Invariants |
|---|---|
| Arga | Adult angular jaw; blue-gray eyes; tousled dark navy hair; navy open coat, light shirt, charcoal trousers, boots; restrained manner. |
| Kirana | Adult soft oval face; reddish-brown almond eyes; mark under left eye; long chestnut hair; terracotta cardigan, cream blouse, plum pleated midi skirt. |
| Hendra | Clearly 54, broad shoulders, salt-and-pepper swept hair, wrinkles and mature lids; slate blazer and oxford shoes. |
| Sena | Clearly 16, shorter, green eyes, youthful jaw, dark cowlick; teal hoodie with mustard trim and sneakers. |

## Views and construction
Required production views: front, left/right three-quarter, left/right profile, back. Use view-specific eye spacing, nose, ear, jaw, hair silhouette, costume overlap. Preserve asymmetry; do not mirror the entire finished actor. Build perspective-specific high/low-angle pose assets before using strong camera elevations.

Keep a canonical joint/landmark map and shared palette. Draw hair back/front/fringe, brows, eyes/lids/iris, mouth, torso/pelvis, each limb segment, hand and shoe separately. Hidden surfaces must exist behind moving pieces. Hand shapes: relaxed, open, fist, point, grip. Foreshortened hands/arms need authored replacements.

## Review sheet
Neutral light background, consistent scale, full body and face details. Compare views side by side, plus expression and hand sheet. Label draft views honestly. No production angle is 'supported' until silhouette and identity are visually accepted. A computed parameter or label alone is not an authored view.

First review: Arga. Do not scale unaccepted anatomy to all four cast members. High/low angles and back-body drawings may remain explicit backlog; unsupported production shots fail validation.
