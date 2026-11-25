# SHPY — GAME BIBLE
Version 2.0 | Approved canon rebaseline: 2026-11-25

## High concept

SHPY is an incremental spy-action rail shooter and agency-management comedy. The player begins as a new field agent with a service pistol, personally survives short operations and gradually builds an agency whose weapons, staff, infrastructure and automation can eventually execute entire missions without manual combat input.

The endgame fantasy is not "the player has a very large damage number". It is: the player launches an operation, watches an elite autonomous system clear it, reviews the result and improves the organization for the next assignment.

## Genre and platforms

- Incremental progression + spy-action rail shooter + agency management.
- Single-player, offline-first.
- Shared game codebase for Web, Android, iOS and desktop targets.
- Phaser 4 + TypeScript + Vite remain the current technical foundation.
- Lightweight 2D/2.5D presentation; maintain performance on modest devices.

## Approved tone and character direction

The primary tone is option A: broad spy parody and comedy, with dark humour. The reference mix includes Johnny English, Leslie Nielsen parody films, The Gentlemen, Tropic Thunder, Austin Powers and Inglourious Basterds. These are tonal references only; SHPY uses original characters, dialogue and set pieces.

The protagonist uses the recommended B+C blend: a new agent who is initially awkward and unusually lucky, but gradually becomes genuinely competent. They are increasingly calm and capable while the surrounding agency, criminals and villains remain absurd. Do not keep the protagonist permanently incompetent.

Vulkan is one of several major antagonists. He is a major villain with a dedicated location/arc, not the universal mastermind behind every event. The campaign features a network of competing criminal interests and independent antagonists.

## Core progression fantasy

1. Rookie: manual aim, manual fire, reload, simple equipment and survival.
2. Field agent: improved weapon handling, expanded loadout and first support tools.
3. Experienced operative: attachments, deeper perk branches, specialist operatives and tactical support.
4. Agency leader: turrets, drones, automatic supplies, laser gloves and operation-specific automation.
5. Director: prepare and launch a fully autonomous operation. From mission entry to extraction, the game plays the battle itself; the player watches the simulation and then evaluates the report. No combat clicks are required in this mode.

Autonomous operations are an earned late-game capability, not the default for the first mission. New story sectors are introduced manually or with assistance before automation can be researched/unlocked for routine execution.

## The gameplay loop

HQ → briefing and operation map → mission preparation → rail-shooter operation → debrief/results → HQ investment and recruitment → new sectors, systems and operations.

There are two complementary forms of automation:
- in-operation automation: equipment and AI systems execute combat while the player watches in late game;
- roster assignments: operatives conduct separate timed intelligence/logistics/supply assignments while the player is elsewhere.

These systems must share operative availability and agency resources. They must not be isolated reward menus.

## Mission model

A mission is a cinematic rail-shooter route composed of linked combat segments, transitions and location events. The environment/camera moves along a authored route; enemies and hazards enter and leave the composition. The player aims and fires during early/mid progression. The rail path, enemy positions, hitboxes and background layers use a consistent world coordinate system.

The location's signature mechanic is always present. Optional operation modifiers alter the challenge and reward. Each location grows by adding sectors, routes, enemy types, story reveals and combinations of modifiers. Old sectors remain part of the campaign and can become routine autonomous assignments later.

## HQ

HQ is a spatial interactive operative's office, not a generic menu:
- wall map/dossier board: main campaign operations and evidence;
- desk terminal: personal upgrades, agency research and operative department;
- armory/cabinet: weapon catalogue, attachments, perks and cosmetics;
- mission preparation area: final loadout and support selection;
- telephone: briefing inbox, story messages, event notices and later prestige/special contracts;
- agency cat: recognizable interactive cat and small source of humour/morale flavour.

The current low-detail geometric HQ is a prototype, not final visual direction.

## Economy

Three resources have distinct roles:
- Dollars: spendable cash for personal upgrades, recruitment, purchases and selected services.
- Reputation: persistent agency/agent career progression. Existing save code stores this as `accountXp`; that storage field is retained until a deliberate save migration, while the player-facing concept is Reputation.
- Components: operational materials used for crafted consumables, attachments, equipment improvements and cosmetics.

Do not add new currencies without an explicit design reason. Avoid rewarding repetitive early-wave farming more than successful mission progress. Exact values remain balance hypotheses until measured through complete run simulations and playtests.

## Weapons, perks and equipment

Weapon identity is defined by role, feel, handling, attachments and trade-offs, not only damage. The armory is a catalogue/workshop; equipped weapon slots, grenades, medkits, gadgets and support packages are selected in Mission Preparation.

Perks must become meaningful connected branches with explicit effects and synergies, not a small collection of vague linear stat upgrades. Agency research unlocks new operational systems and automation capacity; it is separate from personal combat perks.

The first-person presentation must separate agent arms/sleeves, hands and weapon so uniforms, weapon finishes and attachments can render independently.

## Operatives

Terminology:
- Player-agent: the character directly controlled in manual/assisted operations.
- Operative: a recruited roster member, used for separate assignments or assigned as direct mission support.

Operatives have individual roles, progression and availability. An operative assigned to a main-operation support slot cannot simultaneously run a timed roster assignment. Specialist roles affect mission outcomes, reconnaissance, hazards, logistics or direct support.

## Narrative delivery

The first mission includes the prologue and contextual tutorial. Campaign story is delivered through short cinematic introductions/outros, radio chatter, dialogue, documents, messages and mission events. Each main operation should reveal a concrete piece of the larger criminal network while providing a self-contained local objective.

The first campaign's five locations and provisional signature mechanics are documented in [CAMPAIGN_AND_LOCATIONS.md](CAMPAIGN_AND_LOCATIONS.md). The working story premise is an investigation into a network moving weapons, surveillance and experimental technology. Specific villain relationships and twists remain expandable content work.

## Location and modifier principles

The initial five destinations are Casino «Рояль», Восточный экспресс, Склад контрабандистов, Посольство and Логово Вулкана. Each has a permanent signature gameplay mechanic and a pool of compatible modifiers. See [CAMPAIGN_AND_LOCATIONS.md](CAMPAIGN_AND_LOCATIONS.md).

## Automation canon

The endgame includes fully autonomous missions. The player configures the loadout, available operatives, support modules, target priority and automation doctrine before launch. Once launched in full-autonomy mode, aim, firing, reloads, healing, turret/drone/rocket deployment and operative support are all executed by the simulation. The player watches the operation; pause and playback speed are presentation controls, not combat commands.

Autonomy must use the same combat rules as manual play: hitboxes, cover, ammunition, cooldowns, hazards, enemy behaviour and mission objectives still apply. Underprepared configurations can fail. Full details: [AUTOMATION_DESIGN.md](AUTOMATION_DESIGN.md).

## UI/UX canon

The visual and interaction rules for menus, tabs, HQ, map, settings, armory, preparation, agency computer and onboarding are in [UI_UX_SPEC.md](UI_UX_SPEC.md). The current prototype screens are not accepted as final UX.

## Visual direction

Spy-noir with deliberate parody. A restrained palette, editorial display typography, strong silhouettes and light 2D/2.5D depth. Interfaces should feel like an agency dossier/operations room, not anonymous generic dashboard panels. Use scalable/vector art and restrained effects where possible. Keep backgrounds separated into layers for motion. Do not sacrifice readability for decoration or use heavy textures by default.

## Production principles

1. Preserve the approved core fantasy: rookie field agent → competent operator → agency director.
2. Make the world funny, but play combat and consequences clearly.
3. Build the rail-shooter foundation before multiplying mission content.
4. Each location needs a gameplay signature, not just a different backdrop.
5. A modifier must be telegraphed and offer readable counterplay.
6. Manual, assisted and autonomous controllers use the same combat rules.
7. Economy must reward progress and preparation, not repeated low-risk farming.
8. New systems are taught when unlocked.
9. Do not claim visual assets or platform tests are integrated unless verified.
10. Preserve the shared Web/mobile/desktop codebase.
