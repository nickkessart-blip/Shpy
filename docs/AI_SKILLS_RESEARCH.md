# SHPY — AI skills and tooling research
Reviewed: 2026-11-25

## Compatibility rule

SHPY is pinned to Phaser **4.2.1**, TypeScript 6 and Vite 8. Skills and examples must be checked against that engine version before code is copied. In particular, the `games-workspace/.opencode/skills/game-2d-phaser` guide is explicitly for Phaser 3.80 and its no-build/vendor assumptions do not match SHPY. Do not apply its Phaser-specific snippets directly.

## Recommended external skills

Source repository: https://github.com/gamedev-skills/awesome-gamedev-agent-skills

| Skill | Use in SHPY | When to read |
|---|---|---|
| [phaser-core](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/web-engines/phaser-core) | Phaser 4.2 scene lifecycle, loading, cameras, TileSprite, transitions and v3→v4 compatibility | Every Phaser scene/runtime change |
| [create-game-assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/create-game-assets) | Asset manifests, alpha checks, slicing, contact sheets, provenance and license QA | Any sprite/background/atlas work |
| [game-ai](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/game-ai) | Enemy FSMs, perception, target selection and autonomous mission behaviour | Enemy and automation work |
| [input-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/input-systems) | Rebinding, keyboard/mouse/touch action mapping and multi-pointer rules | Controls/settings work |
| [game-feel](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/game-feel) | Readable hit/shot feedback, anticipation, response and camera effects | Combat feedback and UI transitions |
| [level-design](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/level-design) | Encounter pacing, route composition, enemy entry windows and modifier placement | Mission/sector design |
| [audio-design](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/audio-design) | Music/SFX bus balance, ducking, repetition variation and loudness QA | Music, combat SFX and dialogue |
| [game-ui-ux](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/game-ui-ux) | Resolution scaling, safe areas, interaction states, screen flow and accessibility | Menu, HQ, HUD and settings |

These skills are guidance, not a replacement for SHPY's canonical specs and project-specific skills. If a generic skill conflicts with `AGENTS.md`, `GAME_BIBLE.md`, `DECISIONS.md` or the relevant specification, the project documents win.

## Existing user repositories

### `nickkessart-blip/games-workspace`
Contains `.opencode/skills` for Phaser 3, game assets, animation, audio, Playwright QA, release and visual review. The visual-review and Playwright QA workflows are useful as process references. The Phaser 3.80 engine instructions are **not** directly compatible with SHPY's Phaser 4.2.1.

### `nickkessart-blip/OpencodeSkills`
Contains the same reusable skill family. Use it as a source index; do not duplicate large generic skills into SHPY without a reason and license review.

### `nickkessart-blip/GameDevkit`
Contains:
- `_devkit/scripts/sprite.mjs` — sprite sheet packing and contact-sheet preview.
- `_devkit/scripts/audio.mjs` — audio generation/analysis and waveform/spectrogram reports.
- `_devkit/scripts/capture.mjs`, `smoke.mjs`, `play-test.mjs`, `visual.mjs` — browser capture, console smoke tests, scripted play and visual inspection (check exact script availability in the current tree before use).

The sprite helper emits Phaser 3-style atlas metadata; use it for frame extraction/contact sheets only unless the generated metadata is explicitly validated against the Phaser 4 loader. The GameDevkit's bundled Phaser 3 template is not SHPY's runtime.

## External engine references

- [Phaser 4 TileSprite API](https://docs.phaser.io/api-documentation/class/gameobjects-tilesprite) — `setTilePosition` scrolls a repeating texture independently of the object position.
- [Phaser Tile Sprite concept](https://docs.phaser.io/phaser/concepts/gameobjects/tile-sprite) — use a viewport-sized TileSprite and scroll its tile position; do not create huge background objects that waste memory.

This supports the P0 plan for independently scrolling far/mid/near layers. Each layer still needs a genuinely seamless source texture; repeating a labelled contact sheet or a non-seamless painted scene is not acceptable.

## Free asset candidates (not yet integrated)

| Resource | License | Possible use | Status |
|---|---|---|---|
| [Kenney UI Pack](https://kenney.nl/assets/ui-pack) | CC0 | Prototype UI glyphs/panels; recolour/recompose only if it fits the spy-agency art direction | Candidate; download and inspect first |
| [Kenney UI Audio](https://kenney.nl/assets/ui-audio) | CC0 | UI click, confirm, toggle and navigation sounds | Candidate; not downloaded |
| [OpenGameArt Interface Sounds by Kenney](https://opengameart.org/content/interface-sounds) | CC0 | UI interaction sound pool | Candidate; not downloaded |
| [OpenGameArt Sci-Fi Sounds by Kenney](https://opengameart.org/content/sci-fi-sounds) | CC0 | Laser, device, drone and futuristic support effects for later automation tech | Candidate; not downloaded |
| [Kenney Casino Audio](https://kenney.nl/assets/casino-audio) | CC0 | Casino ambience and machine sounds | Candidate; verify exact pack contents before selection |

Do not add any candidate to runtime until the archive is inspected, exact files are selected, the license is retained in `src/assets/licenses/`, and provenance is recorded in `ASSET_CATALOG.md`.

## Asset provenance discovered in the user's Library

- `SHPY_enemy_animation_atlas.webp`: 384×1024 RGBA, transparent background, 3×4 cells at 128×256. Prepared and visually inspected; it is suitable for the existing loader's authored-atlas path but is **not committed or runtime-integrated**.
- `SHPY_enemy_character_atlas.webp`: 1024×1536 RGBA; multiple character rows and state poses. Requires cell-boundary and alpha-edge validation before slicing.
- `Спрайт-лист оперативников в боевых позах.png`: 1024×1536 RGBA; four character rows and four poses per row. Background/alpha and exact cell boundaries need further QA.
- `Атлас игровых ассетов: Восточный экспресс.png`: 1536×1024 RGB contact sheet with labels, backgrounds, character poses, props, effects and HUD. It is not a ready-to-load atlas.
- `Игровой артбук: поезд и оружие.png`: 1536×1024 RGB contact sheet/mockup. Treat as art direction and crop source only after careful isolation; do not load the whole board into the game.

No images were generated or edited during this audit. Do not treat a Library file as a committed asset or assume its use in runtime.

## Required workflow for future agents

1. Read `AGENTS.md`, `.ai/skills/README.md`, the project skill for the task and the relevant game spec.
2. Check engine version and API compatibility before reusing external code.
3. Search repo, current conversation attachments and Library before sourcing/generating new art.
4. Inspect full-resolution dimensions, alpha, frame boundaries, scale and baseline.
5. Keep license/source and runtime status explicit: found → inspected → prepared → committed → registered → loaded → visually validated.
6. Run focused tests, TypeScript, lint, tests, production build and visual checks; record physical-device checks separately.


## Другие репозитории пользователя: аудит применимости

Проверены также `Triglav`, `Rubezh`, `Chernaya-Flyaga`, `AshVeil` и `NeoGrad` (в репозитории NeoGrad README указывает название Riftblade: Zero).

### Наиболее полезные находки

| Репозиторий | Что найдено | Что применяем в SHPY |
|---|---|---|
| [NeoGrad / Riftblade: Zero](https://github.com/nickkessart-blip/NeoGrad) | `city_far.png`, `city_mid.png`, `city_road.png`, `industrial_mid.png`, `perimeter_mid.png`; manifest хранит размеры, SHA-256 и роль; `tools/art/inspect_assets.cjs` проверяет размеры, alpha, байты, SHA-256 и pivot каждого кадра. | Берём как эталон проверки многослойного фона и asset manifest. Сами PNG помечены в manifest как legacy 2.0 source (not preloaded), по 0.8–2.4 MB каждый; не импортировать в SHPY без проверки лицензии, визуального соответствия и размера. |
| [Triglav](https://github.com/nickkessart-blip/Triglav) | Явный `asset-pack.json` с типом ресурса, ключом, путём и frameConfig; отдельные source sheets, runtime sprites и музыкальные темы с score metadata. | Использовать manifest-first подход и явные размеры кадров для будущих врагов/оперативников SHPY. Архив v10.10.0 исторический; код и ассеты не переносить автоматически. |
| [AshVeil](https://github.com/nickkessart-blip/AshVeil) | `ASSET_CREDITS.md`, отдельный файл лицензии Kenney Blaster Kit (CC0), точные страницы Quaternius; Playwright browser tests и визуальные проверки. | Копируем дисциплину provenance/license и тестовую схему. 3D-модели Quaternius/Kenney не соответствуют текущему 2D-спрайтовому SHPY; можно вернуться к ним только при отдельном 3D-рендер-пайплайне. |
| [Чёрная Фляга](https://github.com/nickkessart-blip/Chernaya-Flyaga) | QA отчёт: 22 state checks + 23 Chromium сценария; проверка page errors, console errors, HTTP 4xx/5xx и скриншотов. | Хороший образец отдельного browser regression слоя для SHPY. Сценарии используют debug API и не заменяют ручное прохождение/ощущение игры. |
| [РУБЕЖ](https://github.com/nickkessart-blip/Rubezh) | Development pipeline с таблицами проверок, asset manifests, атрибуцией источников и разделением CI/runtime/physical-device evidence. | Использовать структуру отчётности и правила лицензий. Godot-специфичные импортеры и 3D-ассеты не переносить в Phaser-проект. |

### Приоритет внедрения инструментов

1. Добавить в SHPY автоматический asset inspection report: размеры, alpha, размер файла, SHA-256, frame bounds и baseline/pivot.
2. Добавить Playwright browser smoke/visual suite с фиксацией console/network errors и скриншотов на 1280×720 и мобильном viewport.
3. Ввести явный manifest для аудио: назначение, громкость, длительность, loop, license/source и runtime key.
4. Не переносить чужие 2D/3D ассеты только потому, что они есть в соседнем репозитории. Сначала проверять авторство, лицензию, стиль и производительность.

Это аудит применимости, а не заявление о переносе исходников. Ссылки на другие репозитории оставлены как источники методик и кандидатов.
