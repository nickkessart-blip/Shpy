# SHPY Asset Catalog

## Integrated third-party assets

### Kenney Top-down Shooter

- **Source:** https://kenney.nl/assets/top-down-shooter
- **Mirror used for source files:** https://github.com/Tiddybub/2d-assets/tree/main/modern-urban/top-down-shooter
- **License:** CC0 1.0 (public domain; commercial use permitted).
- **Integrated file:** `src/assets/enemies/kenney-topdown-shooter.png`
- **Atlas metadata:** `src/assets/licenses/Kenney-Topdown-Shooter-atlas.xml`
- **License copy:** `src/assets/licenses/Kenney-Topdown-Shooter-CC0.txt`
- **Runtime texture key:** `enemy-kenney-atlas`
- **Used frames:** guard, armored, assault, boss.
- **Integration:** `src/game/assets/AssetCatalog.ts`, `src/game/assets/assetSlots.ts`, `src/game/scenes/MissionScene.ts`.

The source pack is distributed as a ZIP by the original publisher. The current integration copied the required atlas and metadata from a public, already-extracted mirror; the original full ZIP has **not** been added to this repository. This avoids committing a duplicate archive when only one atlas is currently used. The original archive remains available from the source page.

## SHPY original HUD ornaments (2026-11-25)

- `src/assets/ui/hud-health-frame.svg` — ornamental health panel frame; runtime key `hud-health-frame`.
- `src/assets/ui/hud-ammo-frame.svg` — ornamental ammunition panel frame; runtime key `hud-ammo-frame`.
- Registered in `src/game/assets/assetSlots.ts`; explicit SVG raster sizes are configured in `src/game/assets/AssetCatalog.ts`.
- Runtime uses code-rendered segmented HP (12 segments) and ammo meter (up to 30 segments based on magazine capacity). Dynamic values are intentionally not baked into image assets.
- Frame art is decorative only. Keep panel backing, fill, icons/text and border in a deliberate render-depth order.

## Enemy state atlas (runtime-integrated)

- Runtime source: four original project SVGs in src/assets/enemies/ (guard, armored, assault, boss).
- Runtime builder: AssetCatalog.ensureEnemyAnimationAtlas() composes a deterministic 384×1024 Phaser CanvasTexture after BootScene preload. Frame geometry is 3×4, 128×256; rows are enemy types and columns are aim/fire/hit.
- Visual states: aim uses the source pose; fire adds a restrained muzzle flash/recoil offset; hit adds a source-atop red tint. These are state variants, not hand-drawn animation cycles.
- MissionScene creates the atlas once and selects frames by enemy combat state. An authored atlas is preserved; missing SVGs or canvas failure leave Kenney/SVG fallback intact.
- Prepared Library WebP remains uncommitted (384×1024 RGBA; 115,008 bytes; SHA-256 27893c782fb375ea892f53ed0ca9d256fffd23ec2ad7cfdac2fa6cc8632faf04). It is not the runtime source.
- Full implementation and limits: docs/ENEMY_ANIMATION_ATLAS.md.


## Enemy archetype silhouette pass (2026-11-26)

The original SHPY SVG fallback assets now have distinct shape cues: guard cap/shoulder insignia, armored wide shoulder plates and reinforced chest, assault balaclava/goggles/red gear markers, and a broader boss coat. Runtime atlas generation and combat state selection remain unchanged.

## Existing project artwork

- `src/assets/weapons/first-person-atlas.webp` — first-person weapon atlas.
- `src/assets/backgrounds/train-carriage-real.webp` — East Express carriage background.
- `src/assets/effects/muzzle-flare.png` and `impact-smoke.png` — Kenney CC0 effects; both are loaded through `AssetCatalog`. `muzzle-flare.png` is now used by the mission muzzle-flash visual and `impact-smoke.png` is used for hit feedback.
- `src/assets/licenses/Kenney-CC0.txt` — license record for the existing effects.

## Archive handling policy

Keep original archives outside the runtime asset folders. Before importing a pack:
1. Verify the publisher's license and retain the license file.
2. Inspect the archive contents and reject executables, scripts, and path traversal entries.
3. Copy only the files actually used by the game into `src/assets/`.
4. Record the original source, license, selected files, and runtime integration here.


## Library asset audit — 2026-11-25

| Library source | Technical inspection | Runtime status |
|---|---|---|
| `SHPY_enemy_animation_atlas.webp` | 384×1024 RGBA; transparent; 3×4 fixed cells, 128×256. Rows: guard, armored, assault, boss. Columns: aim, fire, hit/reaction. | Prepared in Library only; not committed, registered or loaded. It matches the existing authored-atlas loader contract and is the strongest next asset candidate. |
| `SHPY_enemy_character_atlas.webp` | 1024×1536 RGBA; multiple rows/poses. Visible panel-like remnants require alpha-edge/frame inspection. | Research only; not sliced or integrated. |
| `Спрайт-лист оперативников в боевых позах.png` | 1024×1536 RGBA; four rows with four poses each; exact cell bounds and alpha need validation. | Research only; not sliced or integrated. |
| `Атлас игровых ассетов: Восточный экспресс.png` | 1536×1024 RGB, opaque labelled contact sheet. | Art reference only; not a runtime atlas. |
| `Игровой артбук: поезд и оружие.png` | 1536×1024 RGB, opaque contact sheet/mockup. | Art reference only; not a runtime atlas. |

The Library files are not repository assets. Do not describe them as integrated until the exact binary is committed, its frame map and provenance are recorded, the loader registers it, and a runtime screenshot confirms correct rendering. See `docs/AI_SKILLS_RESEARCH.md`.


## Casino authored parallax planes — 2026-11-25

The original Casino SVG scenes were split into transparent, same-canvas vector planes. This is source-asset separation, not generated background art or a labelled contact sheet.

| Scene | Base | Far | Mid | Near |
|---|---|---|---|---|
| Main Casino | `casino-main-base.svg` — wall/floor/perspective | `casino-main-far.svg` — windows and side lamp glow | `casino-main-mid.svg` — columns, vault/door, sign and chandelier | `casino-main-near.svg` — lower shadow and frame |
| Royale Bar | `casino-bar-base.svg` — wall/floor | `casino-bar-far.svg` — back cabinets and shelves | `casino-bar-mid.svg` — bottles, lamps and sign | `casino-bar-near.svg` — floor perspective and lower trim |

All eight SVGs use the original 1280×720 viewBox and transparent overlay planes. AssetCatalog loads each plane at 1280×720. MissionScene scrolls the planes independently at 0.16/0.42/0.74 camera factors and applies a bounded route pan; the original full-scene SVG remains the fallback if a complete plane set is unavailable.


## SHPY combat art recovery — 2026-11-25

The Casino main room and bar now use a rebuilt four-layer SVG environment: architectural shell, distant windows/lighting, midground machines/bar shelving, and foreground furniture/counter. The assets remain lightweight, locally loaded vector files. The four first-person weapon illustrations are rasterized at 720×1240 (2×) and used directly by the combat rig instead of enlarging the low-resolution 192×144 atlas frames. Enemy source art is rasterized at 2× and composed into a larger 192×384 runtime state atlas.

This is an improvement to the current art baseline, not a claim that the final game art is complete: true frame-by-frame character animation, additional location backgrounds, and physical mobile visual QA remain outstanding.


## East Express layered carriage pass (2026-11-26)

- Added `train-carriage-far.svg`, `train-carriage-mid.svg` and `train-carriage-near.svg`, each a transparent 1280×720 overlay aligned to the existing `train-carriage.svg` base.
- Far layer: distant night city silhouette and warm lit windows, clipped to the four existing carriage windows.
- Mid layer: rain streaks and glass reflections, also clipped to the window apertures.
- Near layer: foreground seat backs, brass trim and lower carriage rails.
- All three layers are registered in `assetSlots.ts` and rasterized at 1280×720 by `AssetCatalog`.
- `MissionScene` now selects the four-layer set for `backgrounds/train-carriage`; the existing single-image fallback remains intact.
- These overlays are original vector cutouts aligned to the committed carriage artwork, not downloaded third-party art. No new third-party license obligations were introduced.
