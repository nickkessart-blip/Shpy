# SHPY — GAME DESIGN DOCUMENT
Version 2.0 | Rebaseline: 2026-11-25
Canonical companion: [GAME_BIBLE.md](GAME_BIBLE.md)

## 1. Core loop

1. HQ: review messages, campaign map, agency status and current resources.
2. Select a main operation or roster assignment.
3. Mission Preparation: select weapons, consumables, gadgets, support operative, support equipment and operation modifiers.
4. Launch a rail-shooter operation.
5. Early/mid game: manually aim and shoot, with unlocked assistance and support.
6. Late game: launch a configured autonomous operation and watch it execute without combat input.
7. Debrief: review objective outcome, combat performance, resources consumed, operative status, new intel and rewards.
8. Invest dollars, reputation and components; recruit/train operatives; research agency systems; unlock further sectors and operations.

## 2. Rail-shooter mission structure

A main operation is a route containing segments, encounter groups, location events, transitions and a climax. The camera/environment advances along a authored rail. During combat, the player remains in a first-person fixed position relative to the route; the route and environment supply the forward motion. The visual background must use independently moving layers and separate set pieces, not one flat image duplicated at different scroll factors.

Each segment defines:
- route distance/duration and transition;
- background layers and foreground occluders;
- spawn windows and valid spawn lanes;
- enemy groups, roles and entry directions;
- cover objects with visibility and collision rules;
- location events and warning windows;
- wave/encounter completion conditions;
- rewards and story events.

The first implementation target is not five completed campaigns. It is one robust Casino route that proves the rail timeline, independent parallax, spatially consistent aim/hitboxes, enemy spacing, usable cover and a readable boss encounter.

## 3. Mission modes

- Manual: the player aims, fires, reloads and uses equipment.
- Assisted: the player retains target selection while equipment performs selected actions (auto-reload, auto-medkit, turret deployment after command, called operative support).
- Autonomous: a late-game mode in which the complete operation is simulated after preparation. The player watches; no combat actions are required.

New operation sectors must be introduced in manual/assisted mode before the autonomous package for that sector is unlocked. Routine known sectors can later become autonomous assignments.

## 4. Combat flow and readability

Combat is continuous within an encounter and respects the rail timeline. Enemy entry, cover use, aiming, attack telegraph, attack, repositioning and defeat must be visually legible. Enemies must not overlap in ways that hide targets or create ambiguous hitboxes. Spawn composition should vary within authored constraints and seeded randomness, not repeat a predictable fixed sequence every run.

The player weapon/hands rig is anchored in the lower foreground. Arms, hands and weapon are separate visual layers. Aim response must be a direct coordinate mapping after camera transforms, not an unexplained arc or easing offset. Recoil is a short impulse with damped return.

## 5. Location mechanics and modifiers

Each location has a permanent signature mechanic. Casino uses changing light/distraction; East Express uses train motion, tunnel darkness, vibration and steam; Warehouse uses moving cargo/machinery; Embassy uses surveillance/security systems and reinforced sightlines; Vulkan's Lair uses dangerous infrastructure and power systems.

Operation modifiers are selected before launch and modify event frequency, hazards, route constraints, enemies or security. Each shows an explanation, warning/counterplay and reward/risk before launch. Combination compatibility is validated. Full location design and candidate modifiers: [CAMPAIGN_AND_LOCATIONS.md](CAMPAIGN_AND_LOCATIONS.md).

## 6. HQ and management screens

HQ is a spatial office/workstation with a campaign dossier wall, desk terminal, armory, telephone and cat. Clickable props must have visible affordances and accurate hit areas. Phone opens messages/briefings from the start; the cat has a recognizable silhouette and small contextual interactions.

Responsibilities:
- Operations map: campaign/story operations only.
- Armory: browse, compare and upgrade catalogue items, attachments, perks and cosmetics.
- Mission Preparation: select the actual kit for the next operation.
- Agency Computer: personal upgrades, agency development/research, operative roster/assignments.
- Telephone: inbox/story/event delivery; future prestige.
- Operatives: recruited people, not bots with no role.

## 7. Economy and progression

Three resource types:
- Dollars: spendable purchases, personal improvements, recruitment.
- Reputation: persistent career/agency unlock progress. The existing `accountXp` save field remains the storage representation pending a deliberate migration.
- Components: crafting, attachments, equipment upgrades and cosmetics.

Reward hierarchy:
- kills are a small tactical reward;
- encounter/wave completion is a modest progress reward;
- mission objectives and completion provide the main payout;
- bonus objectives and risky modifiers add a controlled premium;
- repeated farming of early content is reduced relative to current progression, without making old missions worthless.

Exact values must be established by running representative simulations: first failure, first clear, repeated early mission, new sector unlock, boss clear, assisted clear and autonomous clear. Verify the player cannot finance a large share of the armory from one early wave plus a couple of deaths. Also verify the player is not forced into a long grind after normal successful play.

## 8. Perks, attachments and agency research

Personal perks become several readable branches with specific effects and selected synergies. Candidate themes:
- Marksmanship: weak-point/critical interactions, accuracy under sustained fire.
- Weapon handling: reload, recoil, magazine handling and weapon swap.
- Survival: health, damage mitigation, recovery and emergency response.
- Tactical equipment: grenade/medkit/gadget capacity and effectiveness.
- Support coordination: turret/operative/drone coordination and cooldown efficiency.

Agency research is a separate track for command capacity, logistics, intelligence, engineering and automation. Do not merely rename personal perk upgrades as agency upgrades.

Weapon attachments should create build choices: sights, barrel, magazine, grip and specialist modules, each with trade-offs. Cosmetics must visibly alter the correct independent layer.

## 9. Operative roster and assignments

Operatives have a specialist role, level, XP, equipment/readiness and current availability. Roster assignments produce components, supplies, intelligence or other defined operational resources. A roster operative assigned to the main mission is unavailable for concurrent assignments. A mission report should show what they did, what was consumed, what was found and their status on return.

Roster assignments should be useful but not mandatory chores. The main campaign remains completable without waiting for an agent timer.

## 10. Tutorial and story pacing

The first mission is the prologue/tutorial:
- agency briefing and protagonist introduction;
- aim/fire;
- reload/ammunition;
- enemy telegraph and damage;
- cover and target visibility;
- first location mechanic;
- simple climax and evidence reveal;
- HQ return and first useful investment.

Only teach one system when needed. Future systems get contextual unlock tutorials and a reference manual.

## 11. Results and feedback

Debrief includes success/failure, objectives, route/segment progress, kills by source (player, turret, drone, operative, autonomous weapon), accuracy where applicable, damage received, supplies consumed, operative contribution, modifier effects, rewards and new intel/unlocks.

## 12. Technical boundaries

Combat logic remains separate from scenes and UI. Mission route, location mechanics, modifiers, automation decisions and rewards are data-driven. Randomness is seeded. Save changes require schema migration and tests. See [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md), [COMBAT_SPEC.md](COMBAT_SPEC.md) and [AUTOMATION_DESIGN.md](AUTOMATION_DESIGN.md).
