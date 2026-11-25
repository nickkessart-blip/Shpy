# Skill: asset pipeline and animation slicing

## User authorization and asset reuse
- Never generate or edit images unless the user explicitly asks for image generation/editing in the current request.
- Visual-polish, asset-integration or general development requests do not authorize image generation.
- Search the repository, current conversation files and Library for the existing approved source and already-sliced variants before doing any new asset work.
- Reuse prepared material; preserve its visual content and provenance. Do not ask for manual re-upload when it is already accessible.

## Inspection before slicing
- Inspect the original image at full resolution and note dimensions, color mode, alpha coverage and visible grid guides.
- Determine real cell boundaries from content and transparent gutters. Never divide by rows/columns blindly when the source contains labels, panels or decorative clutter.
- For character sheets, isolate complete silhouettes and preserve soft alpha edges. Reject frames with baked backgrounds, accidental overlap, clipped limbs or inconsistent scale.

## Animation atlas contract
- Use equal-size frame canvases for a given actor, shared baseline, shared pivot and consistent character scale.
- Keep the feet baseline stable; align head/torso proportions across frames. Do not trim each pose to its own bounding box.
- Define a machine-readable or documented frame map: animation name, row/column, frame index, frame duration, loop flag and intended trigger.
- Validate each frame independently and inspect animation strips in sequence for popping, jitter, clipping and accidental mirroring.
- Separate idle/aim, fire, hit, reload and death. Do not pretend one static pose is a complete animation.
- Record source, generation provenance, license, pixel dimensions, export format and whether the asset is prepared, committed, registered, loaded or runtime-tested.

## UI and HUD
- Extract reusable decorative components (frames, corners, dividers, icons, badges, panels) from references only when they are clean and separable.
- Keep dynamic numbers, health fills, ammo counts, cooldowns and progress as code-rendered UI. Images should provide frame, texture and ornament, not stale game-state values.
- SVG is preferred for crisp scalable borders and simple ornaments. Use PNG/WebP for painted art and sprites with alpha.
- Register every asset in `assetSlots.ts`; set explicit raster sizes for SVG in `AssetCatalog.ts`; confirm it is loaded before using it.
- Keep UI layers ordered intentionally: panel backing, fills, icons/text, decorative frame. Verify depth and transparent areas.
