# SHPY enemy animation atlas

## Runtime-integrated authored atlas

- Asset: `src/assets/enemies/animation-atlas.png`.
- Texture key: `enemy-animation-atlas`.
- File geometry: 768×1152 PNG, indexed colour, 96 palette entries and transparency table.
- Sprite geometry: 4 columns × 4 rows, 192×288 pixels per frame (2:3 aspect ratio).
- Source: Library file «Спрайт-лист оперативников в боевых позах.png», originally 1024×1536 RGBA with 256×384 cells. It was resized cell-for-cell to 192×288 and palette-optimized for the mobile build; frame boundaries and alpha were retained.
- SHA-256: `6af559f7b2b6fd4950cdd098e4792e6e56c9ca3bbb8324a691335f030fa3cc67`.
- Runtime loading: AssetCatalog.preload() loads the PNG as a Phaser spritesheet; MissionScene selects the frame from the enemy type and current combat state.

| Row | Archetype | Frame IDs |
|---:|---|---|
| 0 | Guard | 0–3 |
| 1 | Armored | 4–7 |
| 2 | Assault | 8–11 |
| 3 | Boss | 12–15 |

Columns are ordered left to right: **idle**, **aim**, **fire**, **hit**. Frame index is `row * 4 + column`. The mapping lives in `src/game/assets/enemyAnimationFrames.ts` and is covered by unit tests.

## Presentation behaviour and limits

- Idle is used for entering, exposed, cover, hidden and repositioning states where the enemy is not currently aiming or firing.
- Aim is selected during the existing Aiming state.
- Fire is selected during the existing Attacking state.
- Hit overrides the state frame while the existing hit-flash timer is active.
- Existing code-driven breathing, small idle bob, aiming lean, recoil, directional hit reaction and defeat fall/fade remain active. These effects do not modify authoritative coordinates, hitboxes, damage or combat timing.

This is a four-pose authored **state atlas**, not a multi-frame walk/idle loop. It provides distinct authored silhouettes for idle/ready, aiming, firing and hit reaction. Continuous locomotion, reload and multi-frame death animations remain future art work.

## Fallback and validation

If the PNG is unavailable, AssetCatalog builds a compatible 4×4, 192×288 CanvasTexture from the four committed SHPY SVG archetypes. The fallback preserves the same 0–15 frame mapping and provides restrained offset/muzzle-flash/hit-tint variants. Kenney CC0 and SVG fallback rendering remains available if neither atlas path can be completed.

Run `npm run verify:enemy-atlas` to validate the exact PNG signature, dimensions, indexed transparency, 4×4 frame grid, byte size and SHA-256. Unit tests validate that all 16 type/pose combinations map to unique contiguous frame IDs. CI typecheck/tests/build do not visually inspect the rendered scene.

## Import note — 2026-11-26

The user's attempt to upload the WebP version through the Git workflow did not succeed. The selected Library source was therefore committed as an optimized PNG instead. This records a limitation of that upload path, **not** a claim that Vite or Phaser categorically cannot load WebP; the asset discovery glob still lists WebP as a supported extension. PNG is the committed source of truth for this atlas.

The desktop image inspection confirmed a transparent 4×4 sheet and the final PNG retained alpha. Browser screenshot review and physical Android validation are still outstanding; do not mark them complete based on CI alone.
