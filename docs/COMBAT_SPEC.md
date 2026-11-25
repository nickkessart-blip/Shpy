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
- Guard: baseline firearm, predictable cover use and controlled attack timing.
- Armored: slow, resilient and equipped with protected zones/weak points or a vulnerability window.
- Assault: fast lane changes, aggressive repositioning and short attack wind-ups.
- Specialist (future): uses grenades, suppression, shields, cameras or other location interactions.
- Boss: multi-phase encounter with a unique pattern, arena interaction and clear phase transitions.

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
- First-person weapon artwork is a separate transparent viewmodel layer, rasterized at 2× from 360×620 SVG source. Mobile viewmodel rotates toward the world-space reticle; muzzle position must be derived from the same rig transform used to draw it.
- Enemy source SVGs are rasterized at 2× and composed into a 3×4 atlas with 192×384 cells. Current aim/fire/hit variants are still derived from one source pose; do not describe them as full frame animation.


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
