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

- [x] Уточнить визуальное различие архетипов противников в SVG fallback: охранник, тяжёлый, штурмовик и босс получили отдельные силуэтные признаки (2026-11-26).
- [ ] Импортировать библиотечный 4×4 character atlas как бинарный asset, зарегистрировать кадры idle/aim/fire/hit и проверить отображение в браузере/на Android. Сам файл пока не включён в репозиторий.

Implementation status (2026-11-25): PR #18 adds a deterministic route clock, route progress HUD and eight transparent 1280×720 SVG planes extracted from the existing Casino/Bar source art. The follow-up P0 slice adds a seeded SpawnDirector: wave enemy roles remain authored, while lane assignments, entrance order and stagger timing vary per run; placements enforce 135px target separation and cover clearance. Enemies now enter from alternating route edges into assigned lanes with archetype-specific travel durations. Hidden enemies remain rendered behind cover, and cover geometry blocks shots along the muzzle-to-hitbox segment. This is still a prototype: no continuous rail travel during the whole operation, route exits, dynamic role-composition budgets, full cover destruction/peek validation, attack projectiles or Casino signature event yet.
- [~] Add deterministic route timeline and independent authored far/mid/near SVG planes to the Casino prototype (first code slice; enemy lanes, spawn director and cover remain open). See [implementation plan](superpowers/plans/2026-11-25-casino-rail-timeline.md).
- [~] Use genuinely independent background layers and separate foreground/environment set pieces: Casino layers remain in place; East Express now has separate night exterior, rainy glass and foreground-seat SVG planes. Further locations and visual validation remain open.
- [~] Fix pointer-to-world mapping and off-screen target access: world-space reticle, bounded camera follow and sensitivity applied to aim travel. Verify on desktop browser and physical Android before marking complete.
- [~] Make cover render as physical occlusion; hidden enemies remain drawn behind the cover and line-of-sight shots are blocked. Validate in browser; add physical cover-state polish.
- [~] Seeded SpawnDirector varies lane assignment, enemy entry order and stagger timing, enforcing minimum spacing. Authored enemy role composition remains fixed per wave; seeded composition variants and route-lane entry/exit remain open.
- [x] Differentiate Guard, Armored and Assault combat loops beyond HP: predictable cover cycle, armored head weak point/body resistance, and alternating assault flanks; retain the separate multi-phase boss pattern.
- [x] Add readable enemy attack launch/effects: per-archetype projectiles travel toward the player and apply damage on impact; muzzle/tracer/impact feedback is visible and wave transitions wait for fired rounds.
- [x] Restore a clear lower-screen arms/hands/weapon presentation with a transparent 2×2 first-person atlas: full pistol/SMG/shotgun/rifle viewmodels include gloved hands and forearms; muzzle coordinates are mapped from the actual frame and rig transform.
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
- [x] Build a contextual first-operation tutorial for aim/fire, reload, attack telegraph, timed dodge, cover/peek and first elimination. Steps advance from live gameplay events; skip/completion persist in save schema v7. The Casino signature mechanic explanation remains a follow-up.
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
- [~] Give roster assignments clear stages, visible progress and useful reports: timed runs and inbox reports exist; batch claim is implemented, persistent automation/report history remain open.
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
- [x] Integrate authored 4×4 enemy state atlas (idle/aim/fire/hit), with a tested 0–15 frame map and SVG CanvasTexture fallback. Full multi-frame locomotion/death cycles, additional location art and browser/Android visual QA remain open.
- [~] Rebuild initial Casino combat art: detailed four-layer main/bar backgrounds and 2× weapon viewmodels are integrated; broader location art and physical mobile visual QA remain open.
- [ ] Profile low-end desktop and mobile; validate actual Android controls and rendering.
- [ ] Extend the visual rebuild to East Express, Warehouse, Embassy and Vulkan's Lair; add hand-authored idle/walk/fire/hit/death cycles and complete physical Android visual QA.
- [ ] Review save migration, persistence and release packaging.

## Validation policy

- Run focused tests first, then typecheck, lint, tests and production build.
- Add deterministic tests for rail events, spawn spacing, cover/line-of-sight, modifier compatibility, reward pacing and automation decisions.
- Desktop/browser visual review and physical Android testing are manual checks; a green CI run does not replace them.
- Never mark a backlog item complete because its UI exists. Verify the mechanic in the running game.


## Pages-first release rule

Every completed, CI-validated implementation slice must be integrated into `main` and deployed to GitHub Pages before the next feature begins. Verify the main deployment workflow and deployed commit SHA, then include the live Pages URL in the completion report. PR CI alone is not publication. The user checks builds through Pages, primarily on a phone.


### Mobile touch target recovery — 2026-11-25
- [~] Increase physical mobile control hit-area size on compact landscape screens and harden fire press/release lifecycle. CI and Pages publication pending; physical Android QA remains required.


### Combat target feedback — 2026-11-25
- [x] Reticle changes color for a clear enemy hit, a shot blocked by cover, or no target; mobile fire button mirrors the same feedback. Deterministic geometry tests added and PR #29 published to Pages. Physical Android QA remains required.

### Enemy defeat readability — 2026-11-26
- [~] Add a brief visible fall/fade reaction on enemy defeat and let the wave transition wait for it. This is a code-driven presentation effect; authored death frames and complete idle/walk/fire/hit/death cycles remain open.

### Directional enemy hit reaction — 2026-11-26
- [x] Add a deterministic, short directional knockback/lean pose on confirmed hits; unit tests verify direction and decay. Full authored hit/recoil animation frames remain open.

### Enemy attack charge telegraph — 2026-11-26
- [x] Make the existing enemy aim wind-up readable with a filling warning ring, intensifying target line and player danger marker; add charge-sampling tests. Physical Android readability check remains open.



### Authored enemy state atlas — 2026-11-26
- [x] Import the Library 4×4 operative sheet as a transparent, optimized PNG (768×1152; 192×288 cells).
- [x] Register all 16 idle/aim/fire/hit frames in AssetCatalog and select the frame from enemy state in MissionScene.
- [x] Add a pure frame mapper, 16-frame uniqueness/order tests and an exact PNG integrity script.
- [ ] Browser screenshot inspection and physical Android checks remain outstanding; CI is not visual QA.
- [ ] Add genuine multi-frame walk/idle/reload/death cycles in a later art pass.


### Enemy archetype combat rules — 2026-11-26
- [x] Armored body damage is reduced to 0.45× while head weak-point damage is 1.55× before normal precision bonuses; the wave intro explains the counter.
- [x] Armored holds its lane and uses an 860 ms recovery window instead of automatically entering the guard cover loop.
- [x] Assault alternates between adjacent flank lanes with a 260 ms reposition and arena-bound clamping.
- [x] Guard cover loop and the existing multi-phase boss behaviour remain distinct.
- [x] Added deterministic unit tests for multipliers, timings, alternating flank direction, bounds and invalid inputs.
- [ ] Attack launch/projectile travel, specialist enemy mechanics and full visual Android validation remain separate work.


### Enemy projectile attacks — 2026-11-26
- [x] Replace immediate enemy attack damage with a launched projectile and archetype-specific travel time.
- [x] Render muzzle flash, coloured tracer and chest-level impact confirmation; play a quieter enemy-fire sound.
- [x] Keep fired shots active after the source enemy is defeated and wait for all rounds before wave rewards or location transitions.
- [x] Add deterministic trajectory tests for intermediate positions, progress clamping, exact arrival and invalid values.
- [~] Add player projectile counterplay: a timed 560 ms duck (Shift / mobile УКЛОН) with a 2,400 ms cooldown avoids rounds only during its central 68 px hitbox-shift window; cover destruction/interception and physical Android validation remain open.

### First-person arms and weapon viewmodels — 2026-11-26
- [x] Integrate the Library's transparent 2×2 set of pistol/SMG/shotgun/rifle viewmodels with gloved hands and forearms.
- [x] Replace the small clipped weapon-only atlas branch with a primary full-arm viewmodel at 360×270 display size.
- [x] Align diagonal SMG/shotgun/rifle poses to the reticle and calculate muzzle positions from the same container transform that draws the sprite.
- [x] Add a deterministic frame integrity check and geometry tests; keep per-weapon SVG/procedural fallback.
- [ ] Split gloves/sleeves/weapon into separately swappable cosmetic layers; validate viewmodel size and aim alignment on physical Android.
### Player duck/evade counterplay — 2026-11-26
- [x] Add a timed crouch ability on Shift and a dedicated mobile button.
- [x] Move the first-person rig and chest hit point down through a short duck curve; resolve enemy rounds against the current point rather than automatically damaging the player.
- [x] Add a 2.4 s cooldown, button countdown, success VFX, sound/haptic feedback and deterministic dodge-window tests.
- [ ] Add other counterplay methods (cover/interception) and tune readability/timing on physical Android.
### First-operation interactive tutorial — 2026-11-26
- [x] New careers enter a six-step contextual guide (aim/fire → reload → enemy telegraph → dodge → cover/peek → first elimination).
- [x] Advance from real shots, reload input, launched enemy rounds, successful evasion, cover peek and kill events.
- [x] Add adaptive desktop/touch instructions, always-available skip and persistent completion.
- [x] Migrate v1-v6 saves as already tutorial-complete so existing players are not forced through onboarding.
- [ ] Add the Casino signature-mechanic lesson and browser/physical Android usability validation.
### Casino signature lighting event — 2026-11-26
- [~] Add a deterministic spotlight/distraction cycle to Casino main hall and bar: lane warning, short local flash, silhouette highlight and recovery. It changes target readability only; hitboxes and damage remain unchanged.
- [x] Add a predictable 10 s cycle with a 1.1 s warning, 620 ms flash and 780 ms recovery; alternate spotlight lanes between cycles and offset the bar sequence.
- [x] Freeze the event during pause/transitions and reset it for each authored room.
- [x] Add deterministic tests for boundaries, event phases, lane rotation and invalid inputs.
- [ ] Validate visual balance/readability on desktop browser and physical Android; extend moving spotlights and slot/roulette set-piece interactions after review.
### Casino jackpot distraction event — 2026-11-26
- [~] Add a deterministic slot-machine jackpot sequence to Casino rooms, separate from the spotlight event. The warning identifies a sector; the brief 777 flash interrupts the action timers of eligible security staff in that lane.
- [x] Guard and assault are distracted for different durations; armored enemies recover faster and the boss is unaffected. Only stationary exposed/aiming/attacking/peeking states qualify; active cover/reposition tweens are not interrupted. A projectile already launched remains in flight.
- [x] Add an event clock that pauses with the mission, lane rotation per room/cycle, temporary enemy sparkle/tint, and tests for phase boundaries and enemy response durations.
- [ ] Browser and physical Android review; add player-triggered slot interactions and a separate optional jackpot modifier only after the baseline signature is validated.