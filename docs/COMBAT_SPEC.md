# SHPY — COMBAT SPECIFICATION
Version 2.0 | Rebaseline: 2026-11-25

## 1. Combat goals

- Deliver a readable spy-action rail shooter, not a set of unrelated stationary target screens.
- Keep combat responsive and fair on desktop and touch devices.
- Make enemy archetypes mechanically distinct.
- Ensure cover, environmental events and support systems obey visible world rules.
- Support manual, assisted and autonomous controllers over the same combat simulation.

## 2. Rail and coordinate model

A mission progresses along an authored route. The rail timeline controls camera travel, background movement, segment transitions, enemy entry windows and location events. Background art is split into independent far/mid/near/foreground layers with authored scroll multipliers and looping/transition rules. Foreground props and hazards are separate objects with their own world positions.

Maintain distinct coordinate spaces:
- route/world coordinates;
- camera coordinates and transform;
- screen coordinates;
- HUD/viewport coordinates;
- hitbox coordinates.

Pointer input is transformed from screen to world using the current camera transform. On touch devices, the default left virtual stick moves a world-space reticle at a deliberately thumb-controllable speed; the camera follows the reticle after it crosses a 28% viewport safe margin, until authored mission bounds are reached. The DOM control overlay must be laid out against the actual Phaser canvas rectangle (not the full browser viewport), and must recalculate after resize/orientation changes. Track the active aim pointer at window level so a second finger pressing fire cannot interrupt the aim pointer. The alternate tap-and-drag scheme accumulates finger deltas in world space and uses the same camera-follow contract. Aim sensitivity affects reticle travel, not an arbitrary camera offset. The reticle may travel beyond the visible viewport while remaining inside mission bounds. Visual shake, parallax offsets and decorative layers must never shift authoritative enemy hitboxes. Desktop reticle mapping remains direct after the camera transform; do not apply a curved movement response or position-dependent arc. Any optional aim smoothing must be explicitly tuned, bounded and disabled for precision debugging.

## 3. Weapon and first-person rig

The weapon rig occupies the lower foreground. Its hierarchy separates:
- agent torso/arm and uniform sleeve;
- hand/glove;
- weapon body;
- attachments;
- muzzle point and firing effects.

Weapon skins affect the weapon layer, agent uniforms affect the arm/sleeve layer, and attachments affect their own visible geometry. One combined sprite tinted in code is not an acceptable final cosmetic pipeline.

Each weapon definition exposes at least: role, damage per projectile/shot, fire interval, magazine, reserve, reload time, spread, recoil, projectile/pellet count, damage modifiers and special behaviour. Comparison UI derives DPS where mathematically meaningful and explains limitations (pellet spread, sustained reload cycle, status effects).

Feedback: muzzle flash, tracer/projectile where appropriate, impact effect, hit reaction, damage feedback, enemy attack wind-up, attack launch and player damage. Audio mix must make the music audible without masking critical combat cues.

## 4. Enemy archetypes

Enemies are not differentiated only by HP. Each archetype has an attack/defence loop and a tactical counter:
- Guard: baseline firearm, predictable cover use and controlled attack timing. After each shot it uses the established seek-cover → hidden → peek → reposition cycle.
- Armored: slow, resilient pressure unit. Body hits deal 0.45× damage; head hits deal 1.55× damage before the weapon's normal precision headshot bonus. It holds its ground and has an 860 ms recovery window after firing instead of immediately hiding.
- Assault: fast lane flanker with the existing short 820 ms aim wind-up. After firing it moves 150 world pixels toward an alternating adjacent lane over 260 ms, clamped to the playable arena, rather than repeating the guard's cover loop.
- Specialist (future): uses grenades, suppression, shields, cameras or other location interactions.
- Boss: multi-phase encounter with a unique pattern, arena interaction and clear phase transitions; the existing boss phase timing/damage escalation remains separate from the three regular archetypes.

Every enemy exposes visible state cues: idle/positioning, preparing attack, attacking, seeking cover, hidden, peeking, repositioning, hit and defeated. Damage/animation offsets never move the authoritative hitbox unexpectedly.

## 5. Cover

Cover is a spatial object, not an invisibility toggle.
- Hidden: the object occludes the relevant body/head hit region and blocks shots along the corresponding line of sight.
- Peeking: only the visible exposed region can be hit.
- Repositioning: the enemy travels between valid cover positions and remains targetable where line of sight exists.
- Attack: the enemy exposes the appropriate body/weapon silhouette and communicates its attack.
- Destroyed/moved cover, if supported, updates both render and collision/occlusion state.

Enemies must not simply disappear when taking cover. Their body should be occluded behind the cover with a readable head/weapon silhouette when appropriate. The same geometry must drive rendering, hit-testing and shot blocking.

## 6. Spawn composition and spacing

Spawn points are authored lanes/regions, not a repeated fixed set of exact coordinates. A seeded director selects from valid candidates while enforcing:
- minimum screen/world separation between living enemies;
- no spawn inside cover or a blocked line-of-sight region;
- no overlap with HUD or first-person rig;
- role and difficulty composition limits;
- readable entrance direction and warning where needed;
- bounded repeat protection so the same wave pattern is not shown every run.

Do not solve overlap by randomly shifting sprite art without updating the authoritative collision/hitbox data.

## 7. Location events

Location-specific events are part of combat and obey a common event contract:
- stable event ID and location ID;
- trigger window/condition;
- warning duration and warning presentation;
- affected world/screen region;
- duration and recovery;
- gameplay effect;
- counterplay or safe response;
- interaction with enemy, player and automation controllers.

Examples:
- East Express tunnel darkness: lights warn before the tunnel; darkness changes visibility but not hitbox math.
- East Express steam: a marked vent emits a bounded cloud that temporarily obscures a region.
- Train shake: camera feedback is visual and does not alter aim/hitbox mapping.
- Warehouse crane/cargo: movement has a path, timing and collision/occlusion update.
- Embassy camera sweep: visible scan area and alarm state.
- Vulkan infrastructure: warning stages, hazard volume and disable points.

## 8. Modifiers

Modifiers are operation-level data layered over a location's permanent signature mechanic. They must state effect, frequency/trigger, counterplay, reward adjustment and compatibility tags. Never produce unavoidable damage or permanent total obscuration. Seed random event selection for repeatable tests.

## 9. Manual, assisted and autonomous controllers

All controllers use the same combat command interface:
- Manual controller: player aim, fire, reload and item actions.
- Assisted controller: selected actions handled by unlocked equipment; player retains target selection and intervention.
- Autonomous controller: after mission preparation and launch, the simulation handles all combat actions, including target selection, aim, fire, reload, healing, weapon switching and support deployment. The player watches the operation and does not need to click during combat.

Automation cannot bypass weapon cooldowns, ammo, cover, hitboxes, enemy state, location events or mission objective checks. Full autonomy is late-game and is unlocked after the player has learned the relevant operation/sector. A missing/busy support operative cannot appear. An agent assigned to the main operation is unavailable for timed roster assignments.

## 10. Attack and damage feedback

Enemy attack sequence: acquire/select target → visible telegraph → attack launch → travel/impact → damage or miss → recovery. Player can interrupt an attack by defeating or disabling the enemy where design allows. Every damaging hazard needs a warning and a readable affected region.

Player-facing effects should communicate shots, hits, blocked shots, reload state, low supplies, incoming attack and location hazards. Camera shake is optional and must not be required to understand that an event occurred.

## 11. Balance and validation

Balance must be tested across:
- initial pistol/manual play;
- early upgrades and first boss;
- one new weapon and one tactical item;
- first turret and support operative;
- late-game assisted builds;
- fully autonomous operation with low-, medium- and high-investment configurations.

Metrics include time to kill by enemy type, player time-to-failure, ammo consumed, hit/miss ratio, damage received, support contribution, clear time, reward per minute and failure cause. A stronger system should reduce repetitive input while preserving investment, preparation and encounter readability.

Current numeric values in `balance.ts` and `enemies.ts` are prototype values, not approved final balance.


## Visual asset contract — 2026-11-25

- Casino main/bar use independent base/far/mid/near layers, all authored at 1280×720 and loaded locally. Keep background parallax layers behind gameplay hitboxes.
- The first-person rig uses a transparent 2×2 atlas at `src/assets/weapons/first-person-atlas.png`: pistol, SMG, shotgun and rifle, each in a full-arm composition with gloved hands and forearms (384×288 per cell). Mobile and desktop viewmodels rotate toward the world-space reticle. The visible barrel tip is transformed through the same rig container position/rotation used to draw the sprite, so muzzle flash and projectile origin stay attached to the weapon. Individual weapon SVGs remain fallback/catalog art; a fully separate uniform/arm cosmetic layer is still future work.
- The authored enemy sheet is committed at `src/assets/enemies/animation-atlas.png`: 4 columns × 4 rows, 192×288 per frame; rows guard/armored/assault/boss and columns idle/aim/fire/hit. `MissionScene` maps the 16 frames to combat states. This is a four-pose state atlas, not continuous multi-frame walk, reload or death animation; those cycles remain future work.


## Mobile control sizing and fire lifecycle — 2026-11-25

- Previous overlay scaling followed the Phaser logical-to-physical canvas ratio. On a 640×360 landscape phone, the old 0.65 minimum rendered the 96px fire button at roughly 62px and the 154px aim stick at roughly 100px. The new 0.8 minimum increases them to roughly 77px and 123px, with larger landscape screens scaling further up.
- New layout scaling targets usable physical touch controls: scale is clamped to 0.8–1.15 using a 800×450 reference viewport, while the overlay remains aligned to the actual FIT canvas.
- Fire now captures its active pointer where supported, releases on pointerup/pointercancel/lostpointercapture, and clears held-fire state on window blur. Window-level release remains a fallback.
- This is a code-level fix with deterministic sizing tests. It is not a substitute for physical Android verification.


## Reticle and mobile fire target feedback — 2026-11-25

- Reticle state is computed from the exact same head/body hit radii and cover-segment test used by shooting.
- Clear target: green reticle and green fire-button rim. Target under the reticle but behind cover: amber reticle and amber rim. No target: neutral white reticle and original fire-button rim.
- The mobile reticle is enlarged slightly for thumb-based play. Feedback is visual only; it does not change hitboxes, damage, or aim position.
- Unit tests cover clear target, cover-blocked target, no target and overlapping target cases.

### Enemy hit reaction presentation — 2026-11-26

- A confirmed hit now produces a deterministic directional knockback pose: horizontal displacement, brief lean and slight squash/stretch, decaying with the existing 230 ms hit flash.
- Direction is stable per enemy identity to avoid random visual jitter. The sampler is pure and covered by Vitest.
- The sampled pose is render-only. It does not alter enemy world coordinates, target hitboxes, cover tests, aim or damage.
- This improves readability but does not replace hand-authored hit/recoil frames.

### Enemy attack charge telegraph — 2026-11-26

- While an enemy is in `Aiming`, its warning ring now fills clockwise according to the remaining authored aim timer.
- The target line intensifies and a pulsing marker highlights the player's incoming danger point as the attack approaches.
- Charge progress is clamped by a pure helper with deterministic unit tests. The telegraph is visual only; existing state transitions and damage timing are unchanged.
- This is intended to make the existing wind-up readable on small screens, but requires physical Android visual QA.


## Enemy projectile launch and impact — 2026-11-26

- Completing the Aiming wind-up launches a visible round from the enemy muzzle toward the player's chest-level world point. The attack no longer removes health at launch.
- Travel time is archetype-specific: Assault 290 ms, Guard 360 ms, Armored 430 ms and Boss 520 ms. The projectile is drawn as a bright head with a short coloured trail; the muzzle flash and player impact each have their own visual effect.
- Damage is applied only when the projectile reaches its recorded target. Existing boss-phase damage scaling and armour reduction remain in the damage path.
- A shot already fired remains in flight even if its shooter is defeated. Wave rewards/transition wait for all in-flight rounds to resolve so damage cannot leak into the next scene.
- This is a readable incoming-fire timeline, not player dodge or projectile interception. The current player position is fixed; adding dodge/cover/interception counterplay is a separate design task.
- Unit tests cover linear trajectory, boundary clamping, exact endpoints and invalid timing/coordinates. Physical Android readability and latency checks remain required.

## Player duck/evade counterplay — 2026-11-26

- Desktop: press Shift. Touch: use the persistent УКЛОН button in the lower-left utility row beside grenade/medkit.
- The dodge lasts 560 ms, uses a 2,400 ms cooldown, and dips the player's viewmodel and chest hit point downward by up to 68 world/screen pixels. Its safe window exists only through the central portion of the animation; pressing too early or after recovery does not avoid a hit.
- Enemy rounds retain their original recorded world target. At arrival, the projectile is compared with the current ducked player hit point; it misses only when the active crouch has moved the hit point far enough away. A projectile launched while the player is already crouching aims at the crouched point.
- The button shows the remaining cooldown in seconds. A green dodge effect and confirmation feedback mark a successful miss; damage, armour and hit flash remain unchanged when the dodge is mistimed.
- This is a timing-based crouch, not lateral movement, cover destruction or projectile interception. Physical Android layout/readability and balance tuning remain required.
## First-operation interactive tutorial — 2026-11-26

- A genuinely new save starts the Casino operation with a six-step contextual card: aim/fire, reload, enemy telegraph, timed duck, cover/peek, and finish a target. Prompts advance only after corresponding live game events.
- The enemy signal prompt explains the red aim ring. When an enemy launches its round, the card switches to evade instructions; a successful dodge advances to cover education. The cover step waits for an enemy to peek. A kill completes onboarding; if the player eliminates the entire group before a peek, the tutorial closes after the group is cleared.
- Desktop inputs are mouse/fire, R and Shift. Touch inputs are aim stick, FIRE/RELOAD and the dedicated dodge button. Prompt copy adapts to the detected mobile control layout.
- Skip is always available. Completion or skip is persisted in SaveData schema v7. New saves default to incomplete; migrated schema v1-v6 saves are marked complete to avoid interrupting existing careers.
- Tutorial is limited to the first Casino operation. It is a non-pausing overlay; enemies and mission timing continue while the player reads and acts.
## Casino signature lighting event — 2026-11-26

- Casino main hall and bar now run a deterministic, repeating 10,000 ms lighting cycle per room. The first cue begins at 4,800 ms: an 1,100 ms warning, a 620 ms localized flash, then 780 ms recovery. The remaining time is calm interval.
- Spotlight target lanes alternate left/centre/right each cycle; the bar starts one lane offset from the main hall. Warning identifies the affected sector before the flash.
- During the event, a tapered spotlight cone is drawn behind enemies/cover. The flash adds a bounded warm glare ellipse and temporarily highlights enemies inside the lit lane. It does not change enemy positions, hitbox geometry, aim coordinates, damage, accuracy or cover line-of-sight.
- Counterplay: use the warning interval to shift aim to a different sector, or wait for the 620 ms glare to clear. The event pauses with the mission and does not advance during transitions.
- This is the first functional signature slice, not the final Casino set-piece system. Moving spotlight fixtures, slot-machine jackpot flashes, roulette lighting and modifiers remain later additions. Desktop/browser and physical Android visual QA are still required.
## Casino slot-machine jackpot distraction — 2026-11-26

- A second Casino signature event runs independently from the spotlight. Every 15,000 ms, a slot-machine sequence warns a lane for 900 ms, flashes for 420 ms and recovers for 900 ms. The cycle is deterministic; the bar uses a different lane offset.
- At the flash, eligible stationary enemies in the illuminated lane receive a brief distraction: Guard 1,350 ms, Assault 900 ms, Armored 420 ms, Boss 0 ms. Exposed/Aiming/Attacking/Peeking states qualify; Entering/Hidden/SeekingCover/Repositioning do not. Their current AI timer is suspended while distracted; active movement tweens are never stopped mid-path. Enemy hitboxes/coordinates and HP are unchanged.
- Any projectile already launched continues along its recorded trajectory and can still hit the player. The event only delays a later AI transition/attack; it is not an interrupt that deletes incoming fire.
- A 777 callout and a gold sparkle above affected enemies make the effect readable. The warning names the affected sector. Player counterplay is to shift aim into the sector and exploit the brief action window.
- The slot event is not yet player-triggered; interactive slot machines and the optional Jackpot Sequence modifier remain future work. Physical/browser visual QA remains outstanding.
## Player-triggered roulette jackpot — 2026-11-26

- In Casino main hall, one manual jackpot can be triggered per room by aiming at the central roulette wheel and firing. The target is an authored 96×64 logical hit region centred on (640,505), mapped through the same 0.42 parallax transform as the mid-background artwork.
- The reticle shows a gold target frame and the hint `РУЛЕТКА • ВЫСТРЕЛ ДЛЯ ДЖЕКПОТА`. If existing cover line-of-sight blocks the shot, the target turns amber and the trigger is rejected.
- A successful shot consumes one round, counts as a fired shot, marks the roulette wheel spent for that room, and triggers an immediate 420 ms central jackpot flash. This manual pulse distracts eligible stationary security in a wider 300 px lane radius; it does not deal damage or cancel incoming projectiles.
- The interaction is disabled during first-operation onboarding and after one successful activation. The automatic slot-bank jackpot cycle remains separate.
- Touch aim uses screen-to-world camera conversion while the roulette target uses the mid-layer parallax factor; deterministic geometry tests cover zero and non-zero camera offsets. Physical Android visual/tolerance QA remains required.
## Enemy projectile impact with cover — 2026-11-26

- Enemy rounds now test their muzzle-to-player segment against the same authored cover rectangles used by player-shot line-of-sight.
- If a table/barrier intersects the segment, the projectile's recorded endpoint is moved to the first near-side intersection and its travel time is scaled by the distance fraction. The round renders the same tracer, then creates a yellow cover impact ring/sparks and does not damage the player.
- When no cover blocks the line, existing dodge/impact resolution remains unchanged. Cover collision is decided at launch; an already-launched round retains its recorded path even if the room changes state.
- The collision does not destroy cover or move enemies/player. It models solid tabletop/partition interception. The player duck remains a separate countermeasure for rounds with a clear line.
- Deterministic tests cover no-hit, single cover, nearest of multiple covers, boundary contact, starting inside a rectangle and invalid geometry.
## Destructible cover — 2026-11-26

- Authored cover now has per-room durability. Casino tables: 260/240 HP, bar counter: 360 HP, train seats: 190 HP; unknown cover defaults to 220 HP.
- A shot aimed at cover, or a shot whose nearest enemy target is behind cover, damages the first solid cover intersected by the muzzle-to-target ray. Shotguns apply damage per pellet that intersects the cover.
- At or below 55% durability, cover enters a visibly cracked/damaged stage and remains fully blocking. At 0 HP it becomes low rubble and is removed from all collision/LOS checks.
- Enemy rounds use only non-destroyed cover. Guards assigned to destroyed cover lose that assignment, exit Hidden/SeekingCover/Peeking and return to exposed combat. Future waves ignore destroyed cover for spawn clearance.
- Cover damage does not add enemy hit/kill credit and does not grant XP. It consumes regular ammo. Cover state resets on entering a new authored room, not on each wave.
- Deterministic tests cover type-specific HP, damage threshold, lethal clamp and invalid inputs.