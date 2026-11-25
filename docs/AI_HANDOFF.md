# SHPY — AI handoff
Updated: 2026-11-26 | Active task: East Express layered art integration

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

## Latest completed visual slice — enemy archetype silhouette pass (2026-11-26)

- Feature branch: `art/enemy-archetype-silhouettes-2026-11-26`.
- Updated four SVG enemy sources: guard cap/shoulder insignia, armored broad shoulder plates and reinforced chest, assault balaclava/goggles/red gear, broader boss coat silhouette.
- Existing runtime state atlas remains 3×4 aim/fire/hit, generated from committed SVG sources; Kenney CC0 fallback remains.
- The 1024×1536 RGBA 4×4 character atlas in Library was visually inspected but is not committed or runtime-loaded. It remains an explicit follow-up, not an integrated asset.
- No new image generation used. Browser visual inspection and physical Android QA remain outstanding.

## Latest completed visual slice — East Express layered carriage (2026-11-26)\n\n- PR #33 merged into `main` as `88ad60e23c1cccb8b7106011afa7e038550d4362`.\n- Added three transparent 1280×720 SVG overlays aligned to the committed carriage base: distant night city through windows, rain/reflections on glass, and foreground seat backs/trim.\n- Registered the three layers and enabled the same independent parallax path already used by Casino. Existing single-background fallback remains.\n- External research checked SpriteCanvas CC0, the Tiddybub CC0 2D collection and OpenGameArt CC0 background elements. No unsuitable fantasy/top-down pack was forced into the realistic rail-shooter art style.\n- No image-generation credits were used.\n- PR verification CI passed; main CI run `45707674614` passed; Pages deployment run `45707674764` passed. `prototype-build` contains the three compiled assets (`train-carriage-far`, `train-carriage-mid`, `train-carriage-near`). Browser visual inspection and physical Android QA remain unperformed.\n\n## Repository and Git state

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


## Release slice: HQ inbox and agency research (2026-11-25)

- Combined release branch: `release/pages-first-inbox-research-2026-11-25`, based on the current `main` after mobile aiming PR #19.
- HQ phone now opens `HQInboxScene`: timed operative assignments, completed reports, claim through `AgentService.collectMission`, Components rewards and route back to Agency Computer.
- Agency Computer research: informant network (+5 percentage points mission success/level), logistics (-10% dispatch duration/level), training (+20% operative XP/level). Components-funded; unlocks at account level 3.
- Save schema v6 migrates older saves; research effects do not rewrite active runs.
- The combined branch carries implementation files from PR #20 and #21 while preserving the latest `main` documentation and the Pages-first release rule.
- Required CI: typecheck, Vitest, lint and production build. Publish only after merge to `main`; then verify the Pages deployment/source SHA.


## Current verified repository state — 2026-11-25

- The live default branch at task start was main commit 2ccc6dfb1d20e46669282aeedc9ea420efdd1069; PR #22 is merged and the previous handoff branch references above are historical/stale. Always prefer live GitHub state.
- Pages deployment workflow run 45691184243 initially failed at actions/deploy-pages@v4: artifact upload succeeded, but the deploy action received zero artifacts from GitHub's artifact metadata API. The failed deploy job was re-run; verify its latest attempt before claiming Pages deployment.
- CI run 45691184298 succeeded (typecheck, Vitest, lint, build, artifact upload and publish-build). prototype-build was updated to 1524ae2a97bd300eec4fad3b99add7d1e0cac1d5. Important: this is the downloadable build branch, not by itself proof that the Pages deployment workflow succeeded.
- Current feature branch: feat/operative-auto-dispatch-2026-11-25, based on the live main commit above. Current implementation commits include AgentService auto-dispatch selection, focused tests and ComputerScene action. Re-fetch live branch head before editing.
- Assisted automation slice: AgentService.dispatchRecommended(now, randomValue) enumerates unlocked legal team combinations, scores expected Components/minute using current intel/logistics research, then delegates to the existing validated dispatch path. The Agency Computer exposes an explicit “АВТОПОДБОР + ОТПРАВКА” action. It sends one operation only; it does not silently run in the background or auto-claim reports.
- Tests added for best expected-value dispatch and no-eligible-team handling. CI evidence is pending until the feature PR run completes.
- Next: verify focused tests/CI, fix any failures, update this handoff with exact PR/commit/run, then merge only after checks pass. After merge, verify both the Pages deployment workflow and the published build branch SHA before reporting the Pages URL.


## Latest release state — 2026-11-25

- Current main: a04726a69c96eaa9745dc35741597916261c0c06. PR #23 (assisted operative auto-dispatch), PR #24 (Pages artifact read permission) and PR #25 (batch report collection) are merged.
- PR #23: AgentService.dispatchRecommended enumerates unlocked legal teams and missions, scores expected Components/minute with current intel/logistics research, then uses the normal dispatch validation and save flow. Agency Computer exposes “АВТОПОДБОР + ОТПРАВКА”. It is a user-triggered single dispatch, not background autonomy.
- PR #23 final push CI run 45692381951 passed typecheck, 81 tests, lint and build. Initial failing assertion was corrected to test an already-assigned operative; final run passed.
- PR #24 added actions: read to .github/workflows/deploy-pages.yml. This resolved deploy-pages artifact discovery. Main CI run 45692713204 passed; Pages run 45692713553 deployed main SHA dd38b2e338fdc30ebf04340541c5ac882375f41f. prototype-build was updated to 9fe8759543eaf03a91d343343579b39065d15c92.
- PR #25: AgentService.collectReadyMissions(now) claims all completed assignment reports through collectMission; the HQ phone inbox has “ПОЛУЧИТЬ ВСЕ ОТЧЁТЫ”, shows aggregate successes and Components. Unfinished operations remain untouched.
- PR #25 CI push run 45692992413 passed typecheck, tests, lint and build. PR CI run 45693015209 also passed. Main CI run 45693097642 passed typecheck, tests, lint, build and publish-build. Pages deployment run 45693097726 succeeded and deployed main SHA a04726a69c96eaa9745dc35741597916261c0c06. prototype-build output branch updated to cf370e57c453451940c36ab9ad5c37032ea52219.
- Live GitHub Pages: https://nickkessart-blip.github.io/Shpy/ . Physical Android QA has not been performed.
- Current gameplay progression: manual dispatch/claim remains available; assisted one-click best-value dispatch and batch report collection are now functional. Persistent dispatch doctrine, opt-in auto-claim/auto-dispatch, assignment history and app-lifecycle background processing remain unimplemented.
- Next recommended slice: implement persistent, opt-in agency assignment policy with a tested save migration and a lifecycle-safe processor. Avoid calling it autonomous until it actually runs while the player is in other scenes and obeys operative availability, mission slots, research effects and failure/reward rules.


## User-reported blocker — 2026-11-25

The user reports a complete failure in graphics quality and mobile shooting and refuses to test other systems until these are fixed. Pause agency/economy feature work. Prioritize a graphics and mobile-combat recovery pass. Physical Android testing has not been performed; do not claim the fix is verified on-device.

### Mobile combat diagnosis and patch in progress
- Main at task start: 77939fc86d5da2ead1e91e0b9abd12999eab1a87.
- Code review found the mobile DOM control overlay was anchored to the full-size #game host, while Phaser Scale.FIT can center a smaller 16:9 canvas inside that host (especially portrait orientation). This can place touch controls outside the actual gameplay canvas.
- Code review found the virtual aim stick's base speed was 1.35 px/ms; at default sensitivity 1.8 that is ~2,430 px/s at full deflection, far too fast for precise thumb aiming.
- Patch branch fix/mobile-combat-controls-and-aim-2026-11-25 aligns overlay to canvas bounds on resize/orientation changes, tracks the aim pointer globally so a second finger on fire cannot break it, and reduces stick speed to a controllable range. CI and manual Android QA pending.
- Visual assets are also still weak: Casino backgrounds are sparse flat SVG geometry, enemy runtime atlas is synthesized from static SVG poses rather than true animation, and first-person weapon atlas is only 192x144 per frame while displayed enlarged. User-facing art upgrade is required, not optional cosmetic polish.


## Current blocker recovery work — 2026-11-25

### Mobile controls PR #26
- PR #26 merged: https://github.com/nickkessart-blip/Shpy/pull/26
- Merge commit: 80ce798f2d24237bc2e62c5ea5e1bb4f366c479d.
- PR CI run 45694183354 succeeded (typecheck, Vitest, lint, production build). Main CI run 45694299114 succeeded, including publish-build; prototype-build updated to 4c3a45da183d4e60e2e29e43386f5c9e6981ed96.
- Pages deployment run 45694299113 initially failed because deploy-pages could not immediately discover the uploaded artifact. The artifact was confirmed in the Actions artifacts endpoint; deploy job 139487545258 was re-run and the latest attempt completed successfully. Main SHA 80ce798f2d24237bc2e62c5ea5e1bb4f366c479d is now deployed to Pages.
- Changes: controls overlay aligns with actual canvas rect and scales to FIT viewport; resize/orientation listeners update layout; aim-stick pointer tracked globally to avoid second-finger interruption; base aim speed lowered from 1.35 to 0.24 px/ms. Regression tests added.
- Physical Android QA remains outstanding.

### Graphics branch
- Active branch: feat/combat-visual-rebuild-2026-11-25, based on main 80ce798f.
- Rebuilt all eight Casino main/bar SVG background layers with stronger architectural detail, slot machines, roulette table, shelving, bottles, lighting, stools and bar counter.
- Combat now prefers the original individual weapon SVG viewmodels at 720×1240 raster resolution instead of the low-resolution 192×144-per-frame first-person atlas; the viewmodel rotates toward the world-space aim on mobile and its muzzle point follows that rotation.
- Enemy SVG source textures are rasterized at 2× resolution; generated runtime atlas upgraded from 128×256 cells to 192×384 cells (576×1536 overall), with aspect-ratio-preserving display sizing.
- Documentation updated in ASSET_CATALOG, ENEMY_ANIMATION_ATLAS, ROADMAP and src/assets/README. Full hand-authored animation cycles and additional location art remain outstanding.
- PR #27 merged: https://github.com/nickkessart-blip/Shpy/pull/27. Merge commit 338149fef3b793fd148f72f4b3c86efef5167011. PR CI run 45695320789 and main CI run 45695411598 passed typecheck, Vitest, lint and production build. Pages deployment run 45695411580 succeeded for the same main SHA. prototype-build updated to a67f85e902cc8e900f49b993128e8ab9493565e0. Live Pages: https://nickkessart-blip.github.io/Shpy/.


## Follow-up mobile control recovery — 2026-11-25

- New branch: fix/mobile-combat-touch-targets-2026-11-25, based on main 723857c3.
- Code review found the touch overlay still scaled all controls by the Phaser logical-to-CSS canvas ratio. At a 640×360 landscape canvas this reduced the 96px fire control to about 48px and the 154px aim stick to about 77px. The overlay was correctly positioned, but the hit areas were too small.
- The follow-up introduces a physical control scale based on an 800×450 reference viewport, clamped to 0.8–1.15, with deterministic sizing tests.
- Fire now captures its pointer when supported, handles pointerup/pointercancel/lostpointercapture, and releases on window blur. Window-level release remains as fallback.
- CI/Pages publication pending. Physical Android QA still required.


## Mobile controls publication and aim feedback — 2026-11-25

- PR #28 merged: https://github.com/nickkessart-blip/Shpy/pull/28, merge commit 7f0ebecb15350462b85e511cc21999e754c0acd3.
- Main CI run 45696323499 passed typecheck, Vitest, lint and production build. Pages run 45696323494 succeeded for the same commit; prototype-build advanced to 27c085ff604a141ca0d56b81677e88d8f8e806ba.
- Correct touch scale measurements: at 640×360, the old 0.65 floor rendered the 96px fire button at ~62px and 154px stick at ~100px. New 0.8 floor renders them at ~77px and ~123px.
- Follow-up branch feat/mobile-target-feedback-2026-11-25 adds target-aware feedback: green reticle/fire rim for a clear hit, amber for cover-blocked, white when no target overlaps. It reuses the same head/body radii and cover geometry as actual shots; no aim assist or hitbox changes. Unit tests added.
- Follow-up CI/Pages pending. Physical Android QA remains outstanding.


## Latest mobile aim feedback release — 2026-11-25

- PR #29 merged: https://github.com/nickkessart-blip/Shpy/pull/29. Main commit 3b537faedde2111094fc7b809c91ce070580e8a4.
- PR CI run 45697402784 and main CI run 45697492795 passed typecheck, Vitest, lint and production build.
- Pages run 45697492821 initially failed to find its uploaded artifact due to a transient Actions artifact metadata race. The artifact (ID 15061911596) was confirmed and the Pages job was rerun; the rerun completed successfully for the same main SHA.
- prototype-build updated to f70202d3ef790027a98dcd8803c20eb94308192d.
- Live Pages: https://nickkessart-blip.github.io/Shpy/.
- Aim feedback uses the same hit radii and cover geometry as firing. Green = clear target, amber = cover blocked, white = no target. It does not modify aim, hitboxes or damage.
- Physical Android QA remains outstanding.


## Pages deployment reliability fix — 2026-11-25

- Repeated Pages failures were caused by GitHub Actions reporting zero artifacts immediately after a successful upload; the artifact became visible later and a manual rerun succeeded.
- Added an 8-second Wait for Pages artifact registration step between upload-pages-artifact@v4 and deploy-pages@v4 in .github/workflows/deploy-pages.yml.
- Workflow fix commit: 9b5a1a883dc58d3b0b04de5949187f86bee50d52.
- CI run 45698016511 and Pages run 45698016497 both completed successfully. Pages run used the same main SHA; prototype-build updated to 5a6d63ff14b99b1316ccb2b3248dc1130a119382.
- Current main SHA: 9b5a1a883dc58d3b0b04de5949187f86bee50d52.

## Enemy defeat feedback slice — 2026-11-26

- Branch: `feat/enemy-defeat-feedback-2026-11-26`, based on current `main` at `e303af143fa268486079dcc3c9d7cfec7a421388`.
- Added a short readable defeat reaction to the existing enemy sprites: defeated enemies remain visible for 520 ms, tip/fall, shift slightly and fade instead of disappearing on the kill frame.
- Wave completion/reward/transition waits until all defeat reactions finish, preventing the next wave from clearing the sprites immediately.
- Applied to normal weapon kills and grenade kills. Hitboxes, damage, target coordinates and spawn/combat timing are unchanged.
- This is a code-driven death feedback pass, not a hand-authored full animation cycle. Idle/walk/fire/hit/death sprite sheets and physical Android visual QA remain open.
- Validation and Pages publication are pending until PR CI and main deployment complete.

## Directional enemy hit reaction — 2026-11-26

- Branch: `feat/enemy-hit-reaction-2026-11-26`, based on main `94afadeaa0599eba74b73221b9972a2409c09724`.
- Added pure `sampleEnemyHitReaction`: deterministic per-enemy knockback direction, short horizontal shove, lean and subtle squash/stretch, decaying with the existing 230 ms hit flash.
- Integrated into enemy sprite rendering only. No authoritative enemy coordinates, hitboxes, cover geometry, aim, damage or combat timing changed.
- Added Vitest coverage for neutral pose, stable directional response, decay and clamping.
- Full authored hit/recoil animation frames, broader idle/walk/fire cycles and physical Android visual QA remain outstanding.
- PR CI and Pages publication pending.

## Enemy attack charge telegraph — 2026-11-26

- Branch: `feat/enemy-attack-telegraph-2026-11-26`, based on main `39e6ae13b416c0cff26ab1d501c236287050c0df`.
- During `Aiming`, a 28-segment ring fills according to the existing enemy aim timer; the target line intensifies and a pulsing marker indicates the player's danger point.
- Added pure `sampleEnemyAimCharge` and tests for progress, clamping and invalid values.
- Presentation only: enemy state transitions, damage timing, hitboxes and aim remain unchanged.
- CI/Pages publication pending; physical Android visual QA remains outstanding.



## Authored enemy atlas import — 2026-11-26

- The Library source `Спрайт-лист оперативников в боевых позах.png` (1024×1536 RGBA) was converted to an optimized transparent PNG at `src/assets/enemies/animation-atlas.png`: 768×1152, 4×4 cells at 192×288, 96 indexed palette entries, 63,266 bytes.
- SHA-256: `6af559f7b2b6fd4950cdd098e4792e6e56c9ca3bbb8324a691335f030fa3cc67`.
- Mapping: rows guard/armored/assault/boss; columns idle/aim/fire/hit; frame ID = row × 4 + column (0–15).
- AssetCatalog loads the PNG as a spritesheet. MissionScene picks idle, aim, fire or hit based on the active enemy state. A same-geometry CanvasTexture built from the committed SVG sources remains fallback.
- Added `src/game/assets/enemyAnimationFrames.ts`, a 16-frame mapping test and updated `npm run verify:enemy-atlas` to check PNG signature, geometry, transparency, byte size and SHA-256.
- User-reported upload issue: the WebP transfer to Git did not work in the current workflow. PNG was used successfully as the committed format. Do not generalize this as Vite/Phaser WebP incompatibility; the Vite asset glob still includes WEBP.
- Validation boundary: unit/CI checks can prove build and frame mapping but cannot prove visual quality. Browser screenshot inspection and physical Android QA remain required.


## Enemy archetype combat rules — 2026-11-26

- Guard preserves the predictable seek-cover → hidden → peek → reposition loop.
- Armored: torso damage multiplier 0.45, head weak-point multiplier 1.55 (normal weapon precision headshot multiplier applies additionally); after its attack it holds position for an 860 ms recovery/exposure window instead of using the guard cover loop. Waves containing armored enemies show the hint "БРОНЯ: ЦЕЛЬСЯ В ГОЛОВУ".
- Assault: uses the existing 820 ms aim wind-up, then moves 150 world pixels to an alternating adjacent lane over 260 ms. The target X is clamped to [110, GAME_WIDTH - 110].
- Boss multi-phase attack timing and damage escalation remain unchanged.
- Pure rules live in `src/game/systems/combat/enemyCombatRules.ts`; tests cover damage multipliers, timings, alternating flanks, arena clamping and invalid input.
- Damage resolution uses the same authored head/body hits as before. This slice changes damage scaling and enemy movement policy only; no hitbox geometry or attack damage timing is changed.
- Browser visual inspection and physical Android QA remain outstanding.
