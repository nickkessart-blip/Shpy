# SHPY — AI handoff
Updated: 2026-11-25 | Canon rebaseline branch: `docs/shpy-canon-rebaseline-2026-11-25`

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
- Latest verified main commit at the start of this task: `0b0fe7ab1946e3e4e788be9f339a3e1a05212a40`.
- PR #15, #16 and #17 are historical/integrated work; do not recreate their branches or duplicate their changes.
- Active feature branch and PR: `docs/shpy-canon-rebaseline-2026-11-25` → PR #18 (base `main`). PR #18 includes the approved canon rebaseline, Casino rail-timeline slice, seeded enemy spawn director and first-pass physical cover occlusion; it is still open and must not be assumed merged.
- Latest branch head at handoff refresh: `41c6064f49309df8525af13fa28b6a291b61ac41`. Latest verified main remains `0b0fe7ab1946e3e4e788be9f339a3e1a05212a40`.
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

## Latest implementation handoff — HQ phone inbox (2026-11-25)

- Feature branch: `feat/hq-phone-inbox-2026-11-25` (base `main`).
- Added `src/game/scenes/HQInboxScene.ts` and registered it in `GameConfig.ts`.
- The HQ desk phone now opens a functional inbox instead of a placeholder notice.
- The inbox reads persisted operative assignments, refreshes remaining time every second, distinguishes completed reports and lets the player collect the report. Successful assignments award the existing Components reward through `AgentService.collectMission`; failed assignments are reported without a reward.
- The screen links back to the Agency Computer, where operative assignments are managed. It does not invent a second assignment system or duplicate reward logic.
- Scope is deliberately limited: story messages, event notices and prestige contracts are still future work. This does not complete the full HQ redesign.
- Validation still required: TypeScript, lint, tests, production build, then browser visual review. No physical Android QA has been performed.
