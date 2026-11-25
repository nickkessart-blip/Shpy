# SHPY — ROADMAP
Rebased 2026-11-25 | Approved product direction: see [GAME_BIBLE.md](GAME_BIBLE.md).

## Current source-of-truth order

1. `GAME_BIBLE.md` — approved identity and canon.
2. `DECISIONS.md` — accepted decisions versus open questions.
3. `GAME_DESIGN.md`, `COMBAT_SPEC.md`, `CAMPAIGN_AND_LOCATIONS.md`, `AUTOMATION_DESIGN.md`, `UI_UX_SPEC.md` — system specifications.
4. This file — production order and status.
5. `AI_HANDOFF.md` — exact current branch, PR, implementation evidence and next action.

Older roadmap sections and numeric SHPY prototype phase labels are historical implementation records only; where they conflict with the 2026-11-25 canon rebaseline, the new specifications take precedence.

## Rebaseline accepted

- [x] Spy parody/comedy with black humour; original characters and story.
- [x] Awkward/lucky rookie becomes genuinely competent and ultimately an agency director.
- [x] Vulkan is one of several major antagonists.
- [x] Restore a moving rail-shooter mission structure.
- [x] Five persistent launch locations, each with a signature gameplay mechanic and compatible operation modifiers.
- [x] Three resources: Dollars, Reputation and Components (`accountXp` remains the current persisted Reputation field).
- [x] Manual → assisted → fully autonomous mission progression.
- [x] Full-autonomy endgame: after preparation and launch, the game executes the operation and the player watches.
- [x] Player-agent and recruited operatives are separate roles; direct support reserves an operative.
- [x] Armory is catalogue/workshop; the actual kit is selected in Mission Preparation.
- [x] Prologue/tutorial in the first operation; story delivered through short cinematic and in-world channels.
- [x] UI/UX design requirements and platform-aware settings documented.

## Implemented in the current prototype (quality still requires review)

- [x] Phaser 4 + TypeScript + Vite shared game codebase.
- [x] Start, HQ, Operations, Loadout, Computer, Settings, Mission and Results scenes.
- [x] Casino operation slice and East Express passenger-carriage slice.
- [x] Four weapon definitions, six personal upgrade tracks, grenades and medkit.
- [x] Account progression, Dollars and local save migration through schema v6.
- [x] Operative roster with timed assignments and component rewards.
- [x] Basic enemy archetypes, state machine, wave flow, cover states and attack telegraphs.
- [~] Mobile world-space aim stick is now the default; camera follows the reticle through authored mission bounds. Hybrid tap-and-drag uses the same world-space camera-follow contract. Physical Android validation remains open.
- [x] Local audio, HUD feedback, muzzle/impact effects and enemy state atlas.
- [ ] Do not treat the above as proof that the current visual design, balance, cover visuals, rail movement, enemy spacing, UX or mobile experience meet the new specification.

## Production order

### P0 — Rebuild and validate combat foundation

Implementation status (2026-11-25): PR #18 adds a deterministic route clock, route progress HUD and eight transparent 1280×720 SVG planes extracted from the existing Casino/Bar source art. The follow-up P0 slice adds a seeded SpawnDirector: wave enemy roles remain authored, while lane assignments, entrance order and stagger timing vary per run; placements enforce 135px target separation and cover clearance. Enemies now enter from alternating route edges into assigned lanes with archetype-specific travel durations. Hidden enemies remain rendered behind cover, and cover geometry blocks shots along the muzzle-to-hitbox segment. This is still a prototype: no continuous rail travel during the whole operation, route exits, dynamic role-composition budgets, full cover destruction/peek validation, attack projectiles or Casino signature event yet.
- [~] Add deterministic route timeline and independent authored far/mid/near SVG planes to the Casino prototype (first code slice; enemy lanes, spawn director and cover remain open). See [implementation plan](superpowers/plans/2026-11-25-casino-rail-timeline.md).
- [ ] Use genuinely independent background layers and separate foreground/environment set pieces.
- [~] Fix pointer-to-world mapping and off-screen target access: world-space reticle, bounded camera follow and sensitivity applied to aim travel. Verify on desktop browser and physical Android before marking complete.
- [~] Make cover render as physical occlusion; hidden enemies remain drawn behind the cover and line-of-sight shots are blocked. Validate in browser; add physical cover-state polish.
- [~] Seeded SpawnDirector varies lane assignment, enemy entry order and stagger timing, enforcing minimum spacing. Authored enemy role composition remains fixed per wave; seeded composition variants and route-lane entry/exit remain open.
- [ ] Differentiate enemy behaviour, attack patterns and counters beyond HP.
- [ ] Add readable enemy attack launch/effects and restore a clear lower-screen arms/hands/weapon presentation.
- [ ] Rebalance music and combat SFX.
- [ ] Acceptance: the Casino route is playable from entry to extraction with consistent aim/hitboxes, readable cover, distinct enemies and fair hazards.

### P1 — Shared UI system and agency HQ
- [ ] Create reusable typography, spacing, button, tab, card, tooltip, meter and modal components.
- [ ] Rebuild Start with consistent button geometry and a distinctive spy-agency identity.
- [ ] Make Settings platform-aware; add desktop key rebinding and clear quality/vibration explanations; remove the normal parallax toggle.
- [~] HQ phone opens an operative inbox with live assignment timers and claimable reports; stronger desk composition and recognizable cat remain open.
- [ ] Replace the chart-like Operations screen with a geographic/dossier map.
- [ ] Fix persistent active-tab states in Armory and Agency Computer.
- [ ] Ensure all controls and physical objects have clear interaction affordances and descriptions.

### P2 — Prologue, campaign writing and onboarding
- [ ] Write the first campaign's actual narrative beats and antagonist cast; retain Vulkan as one major villain.
- [ ] Build the first-operation tutorial for aim, fire, reload, enemy telegraphs, cover and the Casino signature mechanic.
- [ ] Add short operation intros/outros, radio dialogue, messages and evidence/debrief delivery.
- [ ] Introduce player-agent/operative terminology consistently.

### P3 — Economy, armory and meaningful progression
- [ ] Simulate first failure, first clear, repeated early farming, new-sector unlock and boss clear.
- [ ] Rebalance kill/wave/completion rewards and escalating costs; prevent early-wave/death farming.
- [~] Separate personal upgrades from agency infrastructure/research: three Components-funded research branches (intel, logistics, training) are implemented; deeper infrastructure and automation doctrine remain open.
- [ ] Expand perks into concrete branches with readable effects and selected synergies.
- [ ] Add a meaningful attachment pool and real weapon/agent visual layer separation.
- [ ] Move actual kit confirmation to Mission Preparation.
- [ ] Acceptance: the first failed attempt cannot buy a large share of the arsenal; normal successful progress stays satisfying.

### P4 — Operative department and location framework
- [ ] Give roster assignments clear stages, visible progress and useful reports.
- [ ] Expand assignment rewards to components, supplies and intelligence without making them mandatory chores.
- [ ] Add main-operation support assignment and operative availability rules.
- [ ] Implement the shared location-event contract and modifier compatibility rules.
- [ ] Prove the Casino signature mechanic and one modifier before scaling the framework to all five locations.
- [ ] Add each location's signature mechanic one location at a time.

### P5 — Assisted and autonomous combat
- [ ] Auto-supplies and configurable medkit threshold.
- [ ] Deployable turrets with target selection, cooldown and limited capacity.
- [ ] Direct operative call-in and specialist behaviour.
- [ ] Recon/attack drones and advanced support.
- [ ] Late-game laser gloves and automated targeting/fire.
- [~] Agency research for automation policies and capacity: first functional assisted-automation slice auto-selects an unlocked assignment and strongest legal team by expected Components per minute; persistent doctrine policies and autonomous combat remain open.
- [ ] Full autonomous mission director, setup screen, spectator presentation and detailed debrief.
- [ ] Acceptance: a known prepared operation runs from entry through extraction with zero combat input, obeys combat rules and can fail if its loadout/doctrine is insufficient.

### P6 — Campaign expansion and release polish
- [ ] Extend the Casino and East Express with further sectors and story reveals.
- [ ] Build Warehouse, Embassy and Vulkan's Lair around their signature mechanics.
- [ ] Add compatible operation modifier pools, elite encounters and distinct bosses.
- [ ] Expand weapon/attachment, operative, gadget and cosmetic content.
- [ ] Add full animation cycles and high-quality visual/audio treatment when approved assets are available.
- [ ] Profile low-end desktop and mobile; validate actual Android controls and rendering.
- [ ] Review save migration, persistence and release packaging.

## Validation policy

- Run focused tests first, then typecheck, lint, tests and production build.
- Add deterministic tests for rail events, spawn spacing, cover/line-of-sight, modifier compatibility, reward pacing and automation decisions.
- Desktop/browser visual review and physical Android testing are manual checks; a green CI run does not replace them.
- Never mark a backlog item complete because its UI exists. Verify the mechanic in the running game.


## Pages-first release rule

Every completed, CI-validated implementation slice must be integrated into `main` and deployed to GitHub Pages before the next feature begins. Verify the main deployment workflow and deployed commit SHA, then include the live Pages URL in the completion report. PR CI alone is not publication. The user checks builds through Pages, primarily on a phone.
