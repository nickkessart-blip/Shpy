# SHPY enemy animation atlas

## Runtime implementation

AssetCatalog.ensureEnemyAnimationAtlas() builds a deterministic 384×1024 Phaser CanvasTexture from the four committed SVG enemy assets after BootScene preload. This removes the runtime dependency on transferring the prepared Library-only WebP. The implementation uses Phaser's documented CanvasTexture API (createCanvas, getContext, refresh and add), makes no network requests, and does not mutate source assets or combat coordinates.

- Texture key: enemy-animation-atlas.
- Geometry: 3 columns × 4 rows; 128×256 per cell.
- Rows: guard, armored, assault, boss.
- Columns: aim, fire, hit.
- Frame index: row * 3 + column (0–11).
- Baseline: y=248 in each cell.
- Source/license: original SHPY SVG assets; no third-party material and no newly generated image.
- Runtime integration: in-memory texture registered with Phaser TextureManager and selected by MissionScene.drawEnemies().

## Meaning and limits of states

This is a state atlas, not a hand-drawn frame animation:
- aim: original SVG pose, fitted into a fixed transparent cell and baseline-aligned.
- fire: same silhouette with a restrained recoil offset and muzzle flash.
- hit: same silhouette with a small offset and red source-atop damage tint.

These variants provide deterministic state feedback. They do not invent limb motion, idle cycles, reload or death animation. Existing code-driven breathing, aiming lean, recoil timing and hit feedback remain separate and do not alter hitboxes. The prepared hand-authored WebP remains a possible future replacement, not a prerequisite for the current runtime path.

## Safety and fallback

- If a complete authored spritesheet is already loaded under enemy-animation-atlas, it is preserved and used as-is.
- The runtime atlas is created only when that key is absent and all four SVG textures are loaded.
- If a source texture is missing or canvas creation fails, the builder returns false and the existing Kenney CC0/SVG fallback remains active.
- A malformed/partial authored texture is never overwritten.
- No external fetch, image generation, filesystem writes or persistent asset mutation occurs at runtime.
- The generated-atlas marker is tracked per Phaser Scene, so authored atlases do not receive generated-atlas sizing adjustments.

## Validation and replacement

CI typecheck and production build validate Phaser API usage. Frame IDs 0–11 are created and checked before hasEnemyAnimationFrame reports success. CI does not visually inspect rendered sprites; desktop/browser and physical Android checks remain required for baseline, crop and appearance. The optional npm run verify:enemy-atlas script validates only the exact prepared WebP, not the runtime CanvasTexture.

The separate Library copy SHPY_enemy_animation_atlas.webp remains uncommitted: 384×1024 RGBA WebP, 115,008 bytes, SHA-256 27893c782fb375ea892f53ed0ca9d256fffd23ec2ad7cfdac2fa6cc8632faf04. It is not the current runtime source and must not be described as integrated. The current path is reproducible from four committed SVG files and uses the same frame mapping/state selection, so a future approved replacement does not require rewriting combat code.


## Prepared Library atlases audited on 2026-11-25

Two native Library files were visually inspected; neither is committed or runtime-loaded.

### SHPY_enemy_animation_atlas.webp
- 384×1024 RGBA WebP; 3 columns × 4 rows; each cell 128×256.
- Rows: guard, armored, assault, boss.
- Columns: aim, fire, hit.
- Alpha channel is present. All 12 cells have a consistent bottom bound at y=248, so the sheet is structurally more suitable for direct Phaser spritesheet loading than the larger contact sheet.
- This is a real multi-pose authored state sheet, unlike the runtime-generated SVG atlas below.

### SHPY_enemy_character_atlas.webp
- 1024×1536 RGBA WebP; visually arranged as 4 columns × 4 rows of 256×384.
- Rows appear to represent guard, armored, assault and boss; columns show idle/ready, aim, fire and hit/reaction.
- Alpha channel is present, but bottom bounds vary by cell; normalize baselines and pivots before using it for frame animation.

### Current integration status
- The committed runtime still uses the generated 384×1024 CanvasTexture from four static SVGs, with aim, fire and hit state variants. It is not using either Library atlas.
- A prepared asset is not integrated until the exact binary is committed, loaded by BootScene, registered with AssetCatalog, mapped to runtime animation states and visually validated.
- The available tool path in this audit could inspect/materialize the Library WebP but could not pass its binary bytes to GitHub. Do not claim integration or silently substitute the runtime-generated state atlas for the prepared sheet.
