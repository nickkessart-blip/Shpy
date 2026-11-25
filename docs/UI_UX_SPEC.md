# SHPY — UI, HQ AND UX SPECIFICATION
Version 1.0 | Approved direction: 2026-11-25

## Visual identity

The interface should feel like a stylish spy-agency operations system, not a generic dark admin dashboard. Use a consistent design language across Start, HQ, Operations, Armory, Preparation, Agency Computer, Settings and Results.

Recommended visual ingredients:
- spy-noir editorial typography with a distinctive display face and a highly readable UI face;
- clear typographic hierarchy, strong spacing rhythm and a limited set of panel shapes;
- restrained paper/map/file details, redacted labels, stamps, dossier marks and agency insignia;
- controlled brass/red/ink accents rather than uniform gold text on every panel;
- motion and sound for selection, confirmation, warnings and new unlocks;
- one reusable button, tab, card, meter, tooltip and modal system.

Do not use a font solely because it looks "tactical". Readability and correct Cyrillic coverage are mandatory. Keep layout dimensions consistent; primary menu buttons must share a baseline, width, height and spacing. Tab components must visibly distinguish active, hover, pressed, disabled and locked states.

## Navigation and screen responsibilities

- Start menu: New Game, Continue, Settings and a concise profile summary. All menu buttons share consistent dimensions and hierarchy.
- HQ: a spatial, interactive operative's desk/office. It is the navigation hub, not a flat menu or a pile of unrelated props on a floor.
- Operations map: a legible geographic/operational map with named locations, routes, status, intel, threat and unlock requirements. Do not use chart-like rising lines as a substitute for geography.
- Armory: collection and inspection of weapons, upgrades, weapon attachments, cosmetics and locked content. It is not the final mission loadout confirmation.
- Mission Preparation: select weapon slots, grenades, medkits, gadgets, support operative, turret/drone packages, modifier cards and automation policy before launch.
- Agency Computer: separate tabs for personal improvements, agency infrastructure/research and operative management.
- Phone: messages, story briefings, event notices and later prestige/special contracts. It must be active from the beginning with at least a small useful function.
- Agency cat: a recognizable cat silhouette with distinct head, ears, body, legs, tail and face. Clicks produce small contextual reactions and flavour lines; later morale bonuses must be transparent and modest.
- Results: clear success/failure, objectives, elapsed time, combat summary, damage/resources lost, rewards, intel and unlocks.

## HQ composition

The HQ should read as a workstation:
- foreground desk surface with visible physical perspective and desk accessories;
- wall area behind the desk for the operations map, mission photos and pinned evidence;
- computer terminal placed on the desk, with the visible screen facing the player;
- weapon cabinet or rack as a separate object;
- telephone on the desktop or side table;
- cat placed naturally in the room, not as an abstract decorative blob.

Every interactive object needs a visible interaction affordance. On hover/tap show the object's name and what it does. Clicking the phone opens Inbox/Briefings, not a dead-end notice. Clicking the cat triggers a small reaction. Keep hit areas aligned with the visible object, not a large invisible rectangle that steals clicks from nearby controls.

## Settings

Settings should be platform-aware and explain every control in plain language.

### Graphics
- Quality: Low / Balanced / High with an explicit description of what changes (particle count, decorative detail, optional lighting/effects and background detail).
- Parallax is a core part of the game's visual identity and is enabled by default. It is not a separate normal user-facing toggle. Quality presets may reduce layer detail or update frequency on low-power devices but must preserve depth movement.
- Screen shake is optional and independently adjustable.

### Audio
- Music volume and effects volume are separate.
- Provide a sample playback control.
- The music mix must remain audible beside weapon/UI sound effects.

### Controls
- Desktop: mouse aim/fire plus keyboard bindings, with a key-rebinding screen and conflict validation.
- Mobile: show touch scheme, aim sensitivity and an explanation of the selected layout. Do not show irrelevant Android-only options in a desktop browser.
- Mobile control options must not be confused with keyboard bindings.
- Input settings should describe what actions are bound, not expose unexplained implementation labels.

### Feedback
- Rename "tactile recoil" to "Device vibration" or equivalent.
- Explain that supported devices can provide short vibration pulses for shots, hits and damage.
- Provide a test button and an unsupported-device explanation/fallback.
- Do not imply browser vibration works on every platform.

## Armory and Preparation

Armory tabs: Arsenal, Perks, Attachments/Modifications, Appearance. Active tabs must remain visibly selected after every redraw. Every item card must include:
- name, role and unlock requirement;
- specific, comparable stats;
- an explicit gameplay description;
- current/next tier and cost;
- an equipped/unlocked/locked state.

Weapon comparison should show actual values and derived DPS where meaningful: damage per shot, fire interval/rate, magazine size, reload time, spread/accuracy, recoil and special behaviour. Do not rely on arbitrary unlabelled bars. Explain how shotguns/pellets or damage over time affect the figure.

Weapon attachments should become a real progression category (sights, barrel, magazine, grip and specialist modules) with meaningful trade-offs. Cosmetic variants must have real visual representation. The first-person rig should separate arm/sleeve, hand and weapon layers so weapon finishes and agent uniforms do not depend on tinting one combined sprite.

Perks should be expanded beyond six isolated linear stat ladders. Use readable branches with meaningful effects, unlock prerequisites and limited synergies. Descriptions must state concrete cause and effect. Exact branch content is defined separately during balancing.

## Loadout preparation

Move selection of equipped weapon slots, grenades, medkits and tactical gadgets to Mission Preparation. Armory remains the catalogue/workshop. The player must see the exact active kit before launch and understand which consumables are limited per operation.

## Agency Computer

Use distinct active tab states and three clear divisions:
1. Personal upgrades: body/field performance of the player-agent.
2. Agency development: staff capacity, logistics, intelligence, research and automation systems.
3. Operatives: roster, recruitment, training, current assignments and direct support availability.

The agency-development tab is not a duplicate of personal perk upgrades.

## Onboarding

The first launch should start a guided prologue/tutorial, not drop the player into an unexplained loop. Introduce only the controls and systems needed for the current moment. Later unlocks receive contextual one-time explainers and can be revisited in a field manual/agency dossier.

## Accessibility and clarity

- Keep text readable at desktop and phone sizes.
- Icons must have labels or tooltips until their meaning is learned.
- Locked content explains exactly what requirement is missing.
- Quality, vibration and control options explain effects and platform support.
- Every major screen has consistent Back/Close behaviour and preserves context where appropriate.
