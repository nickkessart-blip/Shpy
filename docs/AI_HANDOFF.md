# SHPY — AI handoff
Updated: 2026-11-25 | Canon rebaseline branch: `docs/shpy-canon-rebaseline-2026-11-25`

## Mandatory reading order

Before any code or content task:
1. `README.md`
2. `AGENTS.md` and `docs/GIT_WORKFLOW.md`
3. `.ai/skills/README.md`, then the relevant SKILL.md files
4. `docs/GAME_BIBLE.md` — current approved canon
5. `docs/DECISIONS.md` — accepted decisions and open questions
6. `docs/ROADMAP.md` and `docs/MVP_SCOPE.md`
7. Relevant specs: `GAME_DESIGN.md`, `COMBAT_SPEC.md`, `CAMPAIGN_AND_LOCATIONS.md`, `AUTOMATION_DESIGN.md`, `UI_UX_SPEC.md`, `TECHNICAL_ARCHITECTURE.md`
8. Asset catalog/research and asset-pipeline skill before asset work.

Do not start a new project. Do not silently change canon. Do not generate or edit images without the user's explicit request in the current turn.

## Repository and Git state

- Repository: `nickkessart-blip/Shpy`; default branch: `main`.
- Latest verified main commit at the start of this task: `0b0fe7ab1946e3e4e788be9f339a3e1a05212a40`.
- PR #15, #16 and #17 are historical/integrated work; do not recreate their branches or duplicate their changes.
- Active feature branch and PR: `docs/shpy-canon-rebaseline-2026-11-25` → PR #18 (base `main`). PR #18 now includes both the approved canon rebaseline and the first Casino rail-timeline code slice; it is still open and must not be assumed merged.
- Branch head before this handoff refresh: `eee681cf92bf7bb3cd846a0d59b73603fcdf05d6`. Always query the live branch/PR head before writing; subsequent commits may move it.
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

The current implementation does not yet have the approved moving rail timeline, complete location event framework, full autonomous mission director, fully separated first-person arm/hand/weapon cosmetic layers, or balanced late-game economy. Do not claim these systems are implemented because their specs now exist.

### First Casino rail-timeline implementation slice (PR #18)

- Added `src/game/systems/missions/RailTimeline.ts`, a Phaser-independent deterministic route clock with validated config, distance/progress/completion, reset and per-layer wrapped offsets.
- Added six focused Vitest cases in `RailTimeline.test.ts` for deterministic advance, completion clamp, reset, layer offsets, invalid deltas and invalid configuration.
- Integrated the clock into `MissionScene`: reset per mission segment, advance only during active play, move the existing far/mid/near procedural layers at separate factors and draw a route-progress meter in the HUD.
- Decorative layer offsets do not alter pointer, weapon rig or authoritative enemy hitbox coordinates.
- Kept the current art and combat model. This is the first route-motion foundation, **not** the completed rail-shooter: authored seamless Casino layers, enemy route lanes, seeded spawn composition, physical cover occlusion, projectile feedback and the Casino signature event remain open.
- The test-only commit was pushed before the implementation to follow a test-first sequence, but the intermediate GitHub Actions runs were cancelled by later pushes. Do not claim a confirmed red/green local TDD cycle.
- The container could not clone GitHub (DNS/network unavailable), so no local npm test/build was run. Use the latest PR #18 GitHub Actions run as the source of truth; until it completes, checks are pending.
- No Library image was committed or edited. The 384×1024 transparent enemy state atlas remains prepared in Library only. The larger East Express art sheets are opaque contact sheets, not ready-to-load sprite atlases.

### Skills and asset research

- Read the project gameplay, asset-pipeline and release/validation skills.
- Identified Phaser 4.2.1-compatible `phaser-core` plus `create-game-assets`, `game-ai`, `input-systems`, `game-feel`, `level-design`, `audio-design` and `game-ui-ux` in `gamedev-skills/awesome-gamedev-agent-skills`.
- The `games-workspace` Phaser skill is Phaser 3.80-specific and must not be copied directly into SHPY. GameDevkit sprite/audio/Playwright/visual scripts are useful references; check their dependencies and Phaser 3 atlas output before reuse.
- Free CC0 candidates and exact Library asset status are recorded in `docs/AI_SKILLS_RESEARCH.md`, `docs/ASSET_CATALOG.md` and `docs/ASSET_RESEARCH.md`. None of the newly researched external packs has been downloaded or integrated.

## Next production work

1. Check the latest CI run for PR #18 and fix any typecheck/test/lint/build failures before continuing.
2. Continue P0 with genuinely authored, independent Casino far/mid/near/foreground layers (use seamless TileSprite sources only where tiling is valid; do not repeat contact sheets or whole non-seamless paintings).
3. Add route-lane enemy entry/exit and a seeded SpawnDirector with minimum separation and composition limits.
4. Correct the pointer-to-world/reticle mapping before any camera/world transform is introduced.
5. Make cover a physical occluder shared by rendering, hit-testing and shot blocking; hidden enemies must not simply vanish.
6. Differentiate enemy attack patterns and add readable attack launch/projectile/impact effects.
7. Implement the Casino signature lighting/distraction mechanic with warnings and counterplay.
8. Perform desktop/browser visual QA, then physical Android touch/orientation testing. CI is not a substitute.
9. Only after the combat foundation passes, continue P1 UI/HQ, P2 prologue/tutorial, P3 economy, P4 operative department/location framework and P5 autonomy.

The exact first-slice acceptance and deferred work are in `docs/superpowers/plans/2026-11-25-casino-rail-timeline.md` and `docs/ROADMAP.md`.

## Validation and handoff rules

- Run focused tests, then typecheck, lint, tests and production build when code changes.
- CI is not desktop visual QA and is not physical Android validation.
- Record exact evidence and unresolved limitations.
- For mobile work, retain a physical-device checklist.
- Commit code, tests, assets and relevant docs together for each coherent implementation task.
- Keep the user out of routine Git operations; do not ask them to connect Git or create commits.
