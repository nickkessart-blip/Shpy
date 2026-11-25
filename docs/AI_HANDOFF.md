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
- Latest verified main commit before this documentation branch: `0b0fe7ab1946e3e4e788be9f339a3e1a05212a40`.
- Previously integrated work includes mobile hybrid controls, visual polish and the enemy state atlas. PR #15, #16 and #17 are historical/integrated work; do not recreate their branches or duplicate their changes.
- Current documentation branch: `docs/shpy-canon-rebaseline-2026-11-25`, created from the verified main commit above.
- The branch contains the documentation rebaseline and follow-up consistency corrections; always inspect its current HEAD rather than relying on a remembered SHA.
- This branch has not yet been merged. It contains documentation changes only.
- Start new work from the latest `main`; keep one shared game codebase for Web, Android and desktop.

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
- `docs/DECISIONS.md` — D-009 through D-020 and remaining open questions.

## Implementation truth and limitations

The current prototype already has Start/HQ/Operations/Loadout/Computer/Settings/Mission/Results scenes, Casino and East Express slices, four weapon definitions, personal upgrade tracks, consumables, account progression, timed operative assignments, basic enemy states/cover/telegraphs, mobile input, audio/effects and an enemy state atlas.

These are prototype implementations, not proof of final quality. The user's 2026-11-25 feedback identifies unresolved issues: weak/inconsistent menu and screen layout, confusing/platform-irrelevant settings, inactive/unclear HQ props, chart-like operations map and missing story/tutorial, weak tab states and shallow armory/progression, overlap/predictable enemy spawns, disappearing cover behaviour, limited enemy attack feedback, incorrect reticle movement, insufficiently layered background/parallax and economy runaway.

The current implementation does not yet have the approved moving rail timeline, complete location event framework, full autonomous mission director, fully separated first-person arm/hand/weapon cosmetic layers, or balanced late-game economy. Do not claim these systems are implemented because their specs now exist.

No gameplay code, numeric balance, save schema, image or audio asset was changed by this rebaseline.

## Next production work

Follow P0 onward in `docs/ROADMAP.md`. First make one Casino route a reliable moving rail-shooter slice:
1. Direct pointer-to-world aim and coordinate correctness.
2. Independent background layers and a real rail timeline.
3. Physical cover occlusion and consistent hit/shot blocking.
4. Enemy spacing, varied seeded spawns and distinct behaviour.
5. Telegraph/attack effects and clear lower-screen first-person rig.
6. Casino's permanent lighting/distraction mechanic with readable warnings.

Add deterministic focused tests for coordinate transforms, route events, spawn spacing and cover/line-of-sight. Do not attempt all five locations or full autonomy in one change.

After the combat foundation, follow the roadmap for shared UI/HQ, prologue/tutorial, economy, operative management, location modifiers and the automation ladder.

## Validation and handoff rules

- Run focused tests, then typecheck, lint, tests and production build when code changes.
- CI is not desktop visual QA and is not physical Android validation.
- Record exact evidence and unresolved limitations.
- For mobile work, retain a physical-device checklist.
- Commit code, tests, assets and relevant docs together for each coherent implementation task.
- Keep the user out of routine Git operations; do not ask them to connect Git or create commits.
