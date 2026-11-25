# SHPY enemy animation atlas

## Exported source

The generated reference sheet was segmented by its actual alpha mask, not by equal-sized grid guesses. Only the 16 connected character silhouettes were retained; transparent panel artwork and stray marks were excluded.

The prepared export is available in the user's Library as `SHPY_enemy_animation_atlas.webp` (115,008 bytes; 3 columns × 4 rows, 384×1024 px). Each cell is exactly 128×256 px, RGBA transparency is retained, and the character baseline is aligned to y=248 in every cell. SHA-256: `27893c782fb375ea892f53ed0ca9d256fffd23ec2ad7cfdac2fa6cc8632faf04`. It has **not yet been committed to this Git branch**.

## Frame map

| Enemy row | Enemy | Frame 0 | Frame 1 | Frame 2 |
|---|---|---|---|---|
| 0 | guard | aim | fire | hit |
| 1 | armored | aim | fire | hit |
| 2 | assault | aim | fire | hit |
| 3 | boss | aim | fire | hit |

Frames are row-major: `row * 3 + column`. Use `aim` as the stable combat pose, play `fire` briefly on attack, and `hit` briefly after damage. Do not loop the hit frame. Idle should use the aim pose with a restrained breathing/bob tween until a dedicated idle drawing is available.

## Slicing and alignment rules

- Cell size is fixed at 128×256 px; never crop each frame to its own runtime dimensions.
- Each enemy row uses one shared scale factor across its three poses.
- Every pose is bottom-aligned to the same baseline and horizontally centered.
- Keep alpha edges; do not apply a dark matte or a lossy background-removal pass.
- Do not stretch cells independently. Display size must be identical for all poses of the same enemy.
- The original first-column portraits were intentionally excluded from animation because the guard portrait is a cropped, shorter pose and would cause visible scale popping.
- The runtime loader slot and state-selection code are prepared in `assetSlots.ts`, `AssetCatalog.ts` and `MissionScene.ts`, but the Library-only file is absent from `src/assets/` in the current branch. Therefore the atlas is **not loaded or displayed by the build**; active enemies continue to use Kenney CC0/SVG fallbacks.
- Once the binary file is present at `src/assets/enemies/enemy-animation-atlas.webp`, the existing code will select aim/fire/hit frames by combat state. This is **state-based pose switching**, not a continuously looping animation. The sheet has no dedicated idle cycle, reload or death poses.

## Binary integrity check

Run `npm run verify:enemy-atlas` after placing the exact prepared file at `src/assets/enemies/enemy-animation-atlas.webp`. The script checks the WebP/VP8X signature, alpha flag, 384×1024 dimensions, 3×4 frame geometry, exact byte size and SHA-256. It accepts an alternate file path as its first argument, which is useful for checking a separately materialized copy. This check validates the source file only; it does not prove Phaser runtime rendering.

## Validation still required

- Run the CI typecheck, lint, unit tests and production build for the integrating commit; do not infer these from successful file writes.
- Check pose transitions at runtime on desktop and Android, especially armored aim-to-hit scale consistency and boss hit silhouette.
- Verify that the 1:2 frame aspect ratio and baseline look correct at gameplay size on narrow Android screens.
- The loader slot and gameplay selection path are committed, but the binary asset is Library-only and has not been added to the repo. Until that file is committed, runtime uses the fallback sprites. Visual/runtime validation remains pending.
