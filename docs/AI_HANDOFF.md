# SHPY — AI handoff
Updated: 2026-11-25 | Active task: world-space mobile aiming and camera follow

## Mandatory reading order

Before any code or content task:
1. `README.md`
2. `AGENTS.md` and `docs/GIT_WORKFLOW.md`
3. `.ai/skills/README.md`, then the relevant SKILL.md files
4. `docs/AI_SKILLS_RESEARCH.md` before importing external skills/tools or sourcing new materials; verify engine and license compatibility
5. `docs/GAME_BIBLE.md` — current approved canon
6. `docs/DECISIONS.md` — accepted decisions and open questions
7. `docs/ROADMAP.md` and `docs/MVP_SCOPE.md`
8. Relevant specs: `GAME_DESIGN.md`, `COMBAT_SPEC.md`, `CAMPAIGN_AND_LOCATIONS.md`, `AUTOMATION_DESIGN.md`, `UI_UX_SPEC.md`, `TECHNICAL_ARCHITECTURE.md`
9. Asset catalog/research and asset-pipeline skill before asset work.

Do not start a new project. Do not silently change canon. Do not generate or edit images without the user's explicit request in the current turn.

## Repository and Git state

- Repository: `nickkessart-blip/Shpy`; default branch: `main`.
- Latest verified main commit at the start of this task: `a99476fe254e3c235dad5bb12de02fd0f2c0d56c`.
- PR #15, #16 and #17 are historical/integrated work; do not recreate their branches or duplicate their changes.
- PR #18 (`docs/shpy-canon-rebaseline-2026-11-25`) was merged into `main` as `a99476fe254e3c235dad5bb12de02fd0f2c0d56c`. Do not recreate it.
- Active feature branch for mobile world-space aim: `fix/mobile-world-aim-and-camera-2026-11-25` → PR #19 (base `main`). Latest verified feature code commit: `381c55fa62404b03ff2ba038050634e89932c1ac`. Latest verified main: `a99476fe254e3c235dad5bb12de02fd0f2c0d56c`.
- Historical branch head before the first handoff refresh in this work session: `5a27635d3661f9887d8b47b61acefbe31171a03d`. Always query the live branch HEAD before editing. Query live branch HEAD before any subsequent edit; documentation commits may have moved it. Always query the live branch/PR head before writing; subsequent commits may move it.
- Keep one shared game codebase for Web, Android and desktop. Do not create separate PC/mobile gameplay branches.
- The latest user environment report is Node.js 24.19.0, npm 11.17.0 and Git 2.55.0.windows.3. CI currently uses Node.js 26.

## Approved design rebaseline

The user's decisions from 2026-11-25 are now recorded in D-009 through D-020:
- Spy parody/action comedy with black humour. Tonal references: Johnny English, Leslie Nielsen parody films, The Gentlemen, Tropic Thunder, Austin Powers and Inglourious Basterds. Use original characters and writing.
- Protagonist is an awkward/lucky rookie who gradually becomes genuinely competent and eventually directs the agency.
- Vulkan is one of several major antagonists.
- Restore the moving rail-shooter structure; the old static-scenes-only framing is superseded.
- Five persistent launch locations each have a signature mechanic and compatible optional modifiers.
- Three resources: Dollars, Reputation and Components. The current persisted `accountXp` field remains the technical representation of Reputation until a tested migration.
- Full-autonomy endgame: player prepares and launches an operation, then watches the game execute combat through extraction with no required combat input.
- New sectors are first introduced manually or with assistance; autonomy is unlocked for known/prepared sectors.
- Player-agent is the directly controlled protagonist; roster members are operatives. An operative supporting a main operation is unavailable for a simultaneous timed assignment.
- Armory is catalogue/workshop; actual per-operation equipment is selected in Mission Preparation.
- First operation doubles as prologue/tutorial. Story is delivered through short cinematics, radio, dialogue, documents, messages and debriefs.

## New/rewritten canonical documents

- `docs/GAME_BIBLE.md` — version 2.0 product canon.
- `docs/GAME_DESIGN.md` — loop, screens, mission structure, economy and progression.
- `docs/COMBAT_SPEC.md` — rail coordinates, combat, cover, spawn, events and controllers.
- `docs/CAMPAIGN_AND_LOCATIONS.md` — campaign frame, five signature locations and modifier model.
- `docs/AUTOMATION_DESIGN.md` — manual, assisted and fully autonomous operation design.
- `docs/UI_UX_SPEC.md` — menu, HQ, map, settings, armory, computer and onboarding UX.
- `docs/MVP_SCOPE.md` and `docs/ROADMAP.md` — prioritized production scope.
- `docs/TECHNICAL_ARCHITECTURE.md` — future rail/event/automation service boundaries.
- `docs/AI_SKILLS_RESEARCH.md` — Phaser 4-compatible external skills, other user repositories, GameDevkit tools, free asset candidates and Library asset provenance.
- `docs/superpowers/plans/2026-11-25-casino-rail-timeline.md` — scoped implementation plan and acceptance criteria for the first rail slice.
- `docs/DECISIONS.md` — D-009 through D-020 and remaining open questions.

## Implementation truth and limitations

The current prototype already has Start/HQ/Operations/Loadout/Computer/Settings/Mission/Results scenes, Casino and East Express slices, four weapon definitions, personal upgrade tracks, consumables, account progression, timed operative assignments, basic enemy states/cover/telegraphs, mobile input, audio/effects and an enemy state atlas.

These are prototype implementations, not proof of final quality. The user's 2026-11-25 feedback identifies unresolved issues: weak/inconsistent menu and screen layout, confusing/platform-irrelevant settings, inactive/unclear HQ props, chart-like operations map and missing story/tutorial, weak tab states and shallow armory/progression, overlap/predictable enemy spawns, disappearing cover behaviour, limited enemy attack feedback, incorrect reticle movement, insufficiently layered background/parallax and economy runaway.

The first deterministic rail timeline and independently moving Casino/Royale Bar SVG planes are now implemented in PR #18. This is a bounded pan of the authored rooms, not the complete rail-shooter route. The complete location event framework, continuous enemy route-lane movement, seeded dynamic role-composition director, full autonomous mission director, fully separated first-person arm/hand/weapon cosmetic layers, and balanced late-game economy remain unimplemented. The current P0 follow-up now has seeded lane assignment/entry staggering and first-pass physical cover occlusion; these are prototype slices requiring browser validation. Do not claim these systems are complete because their specs now exist.

### First Casino rail-timeline implementation slice (PR #18)

- Added `src/game/systems/missions/RailTimeline.ts`, a Phaser-independent deterministic route clock with validated config, distance/progress/completion, reset, wrapped offsets for repeatable layers and bounded travel for non-tileable authored planes.
- Added seven focused Vitest cases in `RailTimeline.test.ts` for deterministic advance, completion clamp, reset, wrapped offsets, bounded authored-layer travel, invalid deltas and invalid configuration.
- Split the existing `casino-main.svg` and `casino-bar.svg` into eight transparent 1280×720 base/far/mid/near SVG planes. Registered them in AssetCatalog; MissionScene loads authored planes when the complete set is present and falls back to the original full-scene SVGs otherwise.
- Integrated the clock into `MissionScene`: reset per mission segment, advance only during active play, move the authored Casino planes at separate factors and draw a route-progress meter in the HUD. East Express retains its window-masked procedural exterior layers.
- Decorative layer travel does not alter pointer, weapon rig or authoritative enemy hitbox coordinates.
- The Casino art is now genuinely split into independently moving vector planes, but it is still a bounded pan of one authored room, not an infinite seamless route. Enemy route lanes, seeded spawn composition, physical cover occlusion, projectile feedback and the Casino signature event remain open.
- The test-only commit was pushed before the implementation to follow a test-first sequence, but intermediate GitHub Actions runs were cancelled by later pushes. Do not claim a confirmed red/green local TDD cycle.
- The container could not clone GitHub (DNS/network unavailable), so no local npm test/build or browser screenshot was run. GitHub Actions PR run `45674036540` on commit `5a27635d3661f9887d8b47b61acefbe31171a03d` completed successfully: dependency install, TypeScript, Vitest, ESLint and production build all passed. Publish-build was skipped because this is a feature PR, not a main deployment. Physical Android and desktop visual QA remain unperformed.
- No Library image was committed or edited. The 384×1024 transparent enemy state atlas remains prepared in Library only. The larger East Express art sheets are opaque contact sheets, not ready-to-load sprite atlases.

### Seeded spawn and cover occlusion follow-up (current P0 slice)

- Added `src/game/systems/waves/SpawnDirector.ts`, a Phaser-independent seeded planner. It uses authored spawn points plus bounded lane candidates, filters cover collision margins, enforces 135px preferred separation (105px fallback), and varies enemy order, lane assignment and staggered entry timing by run seed.
- The director deliberately preserves the authored enemy-role roster for each wave. It does not yet generate dynamic role compositions or difficulty budgets; those remain balance-sensitive follow-up work.
- Integrated staggered `Entering` state in MissionScene with a fading enemy appearance and pulsing lane marker.
- Enemies taking cover remain rendered at their cover position behind the cover layer. The muzzle-to-target segment is checked against the same cover rectangles before damage is applied; hidden targets cannot be shot through cover. Enemies sharing a cover use distinct peek offsets to reduce stacking.
- Added eight SpawnDirector tests (seed determinism, seed variation, bounds, separation/cover clearance, stagger/order with roster preservation, single boss, route-entry interpolation and clamping) and two cover line-of-sight tests.
- This is a code-level implementation only. Browser screenshots, manual combat QA and physical Android checks have not yet been performed. GitHub Actions run `45677650389` on current head `c7c2b48dbaf9a354fc9a20b5136eda824495e87a` passed dependency install, TypeScript, Vitest, ESLint and production build. Publish-build was skipped because this is a feature PR, not a main deployment.

### Skills and asset research

- Read the project gameplay, asset-pipeline and release/validation skills.
- Identified Phaser 4.2.1-compatible `phaser-core` plus `create-game-assets`, `game-ai`, `input-systems`, `game-feel`, `level-design`, `audio-design` and `game-ui-ux` in `gamedev-skills/awesome-gamedev-agent-skills`.
- The `games-workspace` Phaser skill is Phaser 3.80-specific and must not be copied directly into SHPY. GameDevkit sprite/audio/Playwright/visual scripts are useful references; check their dependencies and Phaser 3 atlas output before reuse.
- Cross-repo audit covered NeoGrad/Riftblade: Zero, Triglav, AshVeil, Chernaya-Flyaga and Rubezh. Reuse their asset-manifest, alpha/pivot inspection, licensing and Playwright QA patterns, not project-specific art/code without compatibility review. Details are in `docs/AI_SKILLS_RESEARCH.md`.
- Free CC0 candidates and exact Library asset status are recorded in `docs/AI_SKILLS_RESEARCH.md`, `docs/ASSET_CATALOG.md` and `docs/ASSET_RESEARCH.md`. None of the newly researched external packs has been downloaded or integrated.

## Next production work

1. Run desktop/browser visual QA at 1280×720 and a desktop viewport; verify Casino/Bar planes, spawn spacing, route-edge entrance timing and cover occlusion.
2. Add route exits/despawn and continuous rail movement through the full operation; current movement is an entrance animation into screen lanes.
3. Add seeded role-composition budgets and wave difficulty constraints without changing balance until simulation tests exist.
4. Correct the pointer-to-world/reticle mapping before any camera/world transform is introduced.
5. Validate cover peeking, line-of-sight, visual occlusion and hitboxes in browser; add authored attack launch/projectile/impact effects and stronger archetype differences.
6. Implement the Casino signature lighting/distraction mechanic with warnings and counterplay.
7. Perform physical Android touch/orientation testing. CI is not a substitute.
8. Only after the combat foundation passes, continue P1 UI/HQ, P2 prologue/tutorial, P3 economy, P4 operative department/location framework and P5 autonomy.

The exact first-slice acceptance and deferred work are in `docs/superpowers/plans/2026-11-25-casino-rail-timeline.md` and `docs/ROADMAP.md`.

## Validation and handoff rules

- Run focused tests, then typecheck, lint, tests and production build when code changes.
- CI is not desktop visual QA and is not physical Android validation.
- Record exact evidence and unresolved limitations.
- For mobile work, retain a physical-device checklist.
- Commit code, tests, assets and relevant docs together for each coherent implementation task.
- Keep the user out of routine Git operations; do not ask them to connect Git or create commits.


## 2026-11-25 — Mobile world-space aim and camera follow

User explicitly asked to continue development after reporting that the prior release did not fix camera range, off-screen enemies, aim sensitivity and mobile controls. This task implements a gameplay/input correction rather than another docs-only slice.

- Feature branch: `fix/mobile-world-aim-and-camera-2026-11-25`, based on `main`.
- Old mobile camera code set scroll from the finger's absolute screen position and hard-clamped stick aim to the current viewport. The left stick could not target world coordinates beyond the visible 1280×720 field.
- Added pure world-space aim movement, pointer-drag delta movement and camera-follow math in `src/game/systems/input/aimMath.ts`, with focused unit tests.
- Camera follows the world-space reticle after it crosses a 28% viewport safe margin, independently on X/Y, within authored camera bounds (-420..420 X, -180..180 Y). Reticle world limits are -420..1700 X and -180..900 Y.
- Default mobile scheme is now the left virtual aim stick plus the existing right-side fire button. Legacy v1 settings migrate to v2 and select stick mode while preserving sensitivity, audio and graphics preferences. Alternate tap+drag remains available and now accumulates world-space pointer deltas rather than setting a fixed camera offset from absolute finger position.
- Aim sensitivity controls reticle travel for both mobile schemes; camera follow is a consequence of reticle position.
- Settings copy explains the stick/camera behaviour.
- Physical Android and visual browser validation have not yet been performed. Do not mark mobile acceptance complete until real-device checks confirm multi-touch, orientation, safe-area layout, reticle visibility and shots near all four world bounds.
- Manual Android checklist: (1) left stick moves reticle smoothly in eight directions; (2) camera pans when reticle reaches safe margin and does not snap; (3) right fire button can be held simultaneously; (4) targets at left/right/top/bottom mission bounds remain aimable; (5) sensitivity changes reticle speed immediately; (6) rotate device and verify controls remain anchored and no black screen; (7) reload/switch/grenade/medkit/pause remain independently tappable.


### Mobile world-space aim — CI evidence and release boundary
- PR #19: https://github.com/nickkessart-blip/Shpy/pull/19
- Latest gameplay-code commit: `381c55fa62404b03ff2ba038050634e89932c1ac`.
- GitHub Actions run `45684886138` completed successfully on the latest code commit: typecheck, Vitest, ESLint and production build all passed. The publish-build job was skipped as expected for a PR.
- This work is not yet in `main` or GitHub Pages. Do not send the live game URL as though this PR were deployed.
- Physical Android/browser QA is still outstanding.

### Asset audit — 2026-11-25
- Inspected Library `SHPY_enemy_animation_atlas.webp`: 384×1024 RGBA, 3 columns × 4 rows, 128×256 cells, alpha present and common bottom baseline at y=248. It is a prepared, hand-authored state atlas, but remains Library-only and is not integrated into the runtime.
- Inspected Library `SHPY_enemy_character_atlas.webp`: 1024×1536 RGBA, 4×4 cells of 256×384, alpha present. It is a larger candidate, but cell content has inconsistent bottom bounds and needs baseline normalization before runtime use.
- Neither file is in the repository. The current runtime still composes its 3-state atlas from four committed SVGs. Do not describe either Library atlas as integrated.
- Binary transfer from the materialized Library file into a GitHub blob was not available through the current tool path in this run. Do not replace this with an external fetch or a text file disguised as an image. Resume only with a verified binary-transfer route and then add the atlas to AssetCatalog/BootScene, test its frame map and inspect the rendered result.
