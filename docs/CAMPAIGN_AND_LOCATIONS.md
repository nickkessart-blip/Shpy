# SHPY — CAMPAIGN AND LOCATION DESIGN
Version 1.0 | Canon rebaseline: 2026-11-25

## Purpose

This document defines the first campaign's narrative structure and the signature gameplay identity of its five launch locations. It expands the approved SHPY concept; it does not replace the original concept document as historical provenance.

## Campaign tone

The campaign is a spy-action comedy with strong parody and black humour. Its tonal reference mix includes:
- Johnny English: an agent who can be awkward and lucky without remaining useless forever.
- Leslie Nielsen's parody films: deadpan delivery, literal-minded absurdity and jokes played with complete seriousness.
- The Gentlemen: criminal networks, double-crosses, sharp dialogue and competing interests.
- Tropic Thunder: action-movie parody and institutional vanity.
- Austin Powers: extravagant spy clichés, gadgets and theatrical villains.
- Inglourious Basterds: tense conversations, chapter-like set pieces and dark humour.

These are tonal references, not requests to reproduce protected characters, dialogue, scenes or exact jokes. SHPY needs its own characters, institutions, locations and punchlines.

### Protagonist

The player character starts as a new field agent with more nerve than experience. They can be awkward, unlucky-looking and socially out of depth, but must remain capable enough for the player to enjoy controlling them. Early successes can look like a mixture of skill and absurd luck. Over the campaign the agent becomes genuinely competent, then increasingly well-equipped, and finally the director of a machine that can operate without them.

The world around the protagonist is often more ridiculous than the protagonist: vain executives, overconfident villains, incompetent bureaucracy, dangerous people with petty motives and a cat whose influence exceeds its job title. The protagonist's growing competence provides contrast.

### Antagonists and campaign premise

Vulkan is one of several major antagonists, not the single mastermind behind every event. The first campaign gradually reveals a network of rival criminal interests, corrupt intermediaries and competing technology suppliers. Vulkan controls one important branch of that network and receives a major campaign arc, but other antagonists must have independent motives, methods and visual identities.

Working premise (story outline remains expandable): the agency investigates a chain of suspicious transfers involving weapons, surveillance equipment and experimental devices. The first operation exposes a laundering route; later operations reveal logistics, political protection and the rival groups exploiting the same network. Evidence connects the locations, but each operation should also tell a complete local story.

Do not present the working premise as final chapter dialogue or a fully locked villain roster. Names, relationships, twists and ending remain content-design work.

## Campaign structure

The five initial locations are persistent campaign destinations. They are not disposable levels replaced by new maps. As the agency's rank rises, each location gains further sectors, alternate routes, stronger security and new set pieces. An early Casino run and a late Casino run should feel like different operations in a familiar place.

Every major operation should contain:
1. A short briefing with a clear objective and one story clue.
2. A distinctive location introduction.
3. A sequence of rail-shooter segments with waves, encounters and environmental events.
4. A location-specific climax, elite encounter or boss.
5. A short extraction/debrief that advances the story and explains rewards.

The campaign is delivered through short cinematic intros/outros, radio chatter, character exchanges, mission documents, messages and environmental storytelling. Do not rely on long cutscenes or expensive full-motion animation.

## Location signature mechanics

A signature mechanic is part of the location's identity and is present in every version of that location. It must be telegraphed, readable, fair and mechanically relevant. Random modifiers are layered on top; they do not replace the signature mechanic.

### 01 — Casino «Рояль»

**Fantasy:** luxury, fraud, misdirection and armed security hiding behind a polished customer experience.

**Signature: changing light and visual distractions.**
- Moving spotlights reveal or obscure selected areas.
- Slot machines, roulette and stage lighting create short, bounded flashes.
- Some security staff use furniture, partitions and crowd routes to reposition.
- Light changes affect target readability, not the underlying hitbox coordinates.

**First runtime slices (2026-11-26):** the Casino main hall and bar run a deterministic lane spotlight (1.1 s warning, 620 ms localized flash) plus a separate slot-machine jackpot sequence (900 ms warning, 420 ms flash). Spotlight changes readability; the jackpot briefly delays exposed security AI in the affected lane. Neither event changes hitboxes, positions or damage, and fired projectiles remain dangerous. The central roulette wheel can now be shot once per main-hall entry to trigger an immediate, wider jackpot distraction pulse. Actual slot-bank levers, further roulette set-pieces and the optional Jackpot Sequence modifier remain open.

**Possible operation modifiers:**
- Emergency lighting: parts of the hall periodically go dark.
- Jackpot sequence: a predictable light sequence briefly distracts or obscures.
- Private security: more disciplined guards and a tighter alarm response.
- VIP lockdown: shutters divide the arena into smaller firing lanes.

### 02 — Восточный экспресс

**Fantasy:** a moving train, narrow sightlines, expensive passengers and escalating mechanical chaos.

**Signature: train motion and carriage events.**
- The camera and layered environment communicate forward travel.
- Entering a tunnel produces a warned blackout or low-light interval.
- Carriage vibration causes controlled visual shake; it must not distort aim math or hitboxes.
- Steam vents obscure defined screen regions for a limited duration.
- Compartment doors and inter-carriage doors change spawn routes or firing lanes.

**Possible operation modifiers:**
- Long tunnel: longer darkness windows, with warning lights and sound cues.
- Damaged heating: steam vents trigger more frequently.
- Damaged suspension: stronger but telegraphed carriage jolts.
- Emergency stop: the moving background pauses and enemy approach patterns change.
- Security partition: some doors lock, changing which carriage entrances are available.

### 03 — Склад контрабандистов

**Fantasy:** industrial clutter, stolen cargo and a workplace where every machine is a potential hazard.

**Signature: moving cargo and industrial machinery.**
- Forklifts cross selected lanes on predictable, telegraphed paths.
- Cranes move containers and change sightlines or available cover.
- Conveyors move cargo and can carry some cover objects.
- Selected machinery can be activated or disabled by shooting its control point.
- Environmental interactions can harm enemies as well as the player, but must be legible.

**Possible operation modifiers:**
- Crane fault: a hanging load becomes unstable.
- Conveyor overload: moving cargo changes lanes more often.
- Chemical leak: a marked area becomes temporarily unsafe.
- Warehouse fire: smoke reduces visibility in a limited section.
- Cargo audit: additional protected containers and security teams appear.

### 04 — Посольство

**Fantasy:** diplomatic politeness concealing surveillance, security procedure and political blackmail.

**Signature: security network and restricted sightlines.**
- Cameras scan marked sectors and can raise an alarm.
- Reinforced glass blocks selected shots and creates alternate firing routes.
- Security shutters and access doors divide the combat space.
- Control nodes can be disabled to change camera coverage or unlock routes.
- The operation rewards target selection and disabling the security system, not just raw damage.

**Possible operation modifiers:**
- Diplomatic reception: more civilian movement and stricter firing lanes.
- High alert: faster response and overlapping camera coverage.
- False alarm: misleading alarm events that must be distinguished from real threats.
- Reinforced security glass: more blocked lines of fire.
- Blackout protocol: disabling one system also removes selected lights.

### 05 — Логово Вулкана

**Fantasy:** an extravagant villain complex built around over-engineered industrial and security systems.

**Signature: dangerous infrastructure and power control.**
- Steam, heat and pressure systems create marked hazard zones.
- Bulkhead doors divide the arena and change enemy routes.
- Power relays can be disabled to remove hazards or expose security weak points.
- The boss encounter uses the facility itself as part of its combat pattern.
- The location should feel like a culmination of earlier industrial/security mechanics, not a random sci-fi room.

**Possible operation modifiers:**
- Reactor overload: hazard cycles accelerate with visible warning stages.
- Ventilation failure: heat and smoke persist longer.
- Emergency bulkheads: routes close in a staged sequence.
- Backup generators: disabled systems reactivate unless their power source is handled.
- Vulkan's contingency plan: an additional defensive layer or elite response is enabled.

## Modifier system contract

Each operation is composed from:
- one permanent location signature;
- zero or more operation modifiers selected before launch;
- scripted story events required by the mission;
- optional seeded encounter variation.

Modifiers must describe their effects in plain language before the player commits. Each modifier should state:
- what changes;
- how often or under what trigger it happens;
- what warning or counterplay exists;
- what reward/risk adjustment applies;
- whether it can combine with other modifiers.

Do not combine modifiers that create unavoidable damage, permanently obscure all targets, or invalidate a location mechanic. Combination rules need tags and compatibility checks rather than unrestricted random stacking.

## Tutorial and narrative onboarding

The first playable operation is also the tutorial and prologue:
1. Establish the agency, the protagonist's new position and the immediate assignment.
2. Teach aim and firing in a safe first encounter.
3. Teach reload and ammunition through a clear prompt and a low-pressure pause in enemy pressure.
4. Introduce a visible enemy attack warning and a readable response.
5. Demonstrate the first cover interaction.
6. End with a small reveal that creates the next objective.
7. Return to HQ and explain the first useful upgrade.

Teach one idea at a time in context. Do not front-load every HUD symbol, currency, menu and future system. When a feature unlocks later, explain it at the point of first use.

## Content quality rules

- Humour must not obscure combat readability or mission objectives.
- Black humour may target villain vanity, bureaucracy, institutional absurdity and the consequences of bad decisions. Avoid relying on random shock lines as a substitute for character writing.
- Each location must have a unique visual identity, unique sound layer, signature mechanic and at least one signature encounter.
- Repeated locations need new routes, sectors, enemy compositions or modifier combinations, not only higher HP.
- All random events need deterministic seeds in automated tests and visible warnings in live play.
