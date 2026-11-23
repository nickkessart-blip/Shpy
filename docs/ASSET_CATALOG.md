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

## Existing project artwork

- `src/assets/weapons/first-person-atlas.webp` — first-person weapon atlas.
- `src/assets/backgrounds/train-carriage-real.webp` — East Express carriage background.
- `src/assets/effects/muzzle-flare.png` and `impact-smoke.png` — Kenney CC0 effects.
- `src/assets/licenses/Kenney-CC0.txt` — license record for the existing effects.

## Archive handling policy

Keep original archives outside the runtime asset folders. Before importing a pack:
1. Verify the publisher's license and retain the license file.
2. Inspect the archive contents and reject executables, scripts, and path traversal entries.
3. Copy only the files actually used by the game into `src/assets/`.
4. Record the original source, license, selected files, and runtime integration here.
