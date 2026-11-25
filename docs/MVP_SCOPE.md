# SHPY — PRODUCTION SCOPE AND ACCEPTANCE
Version 2.0 | Rebaseline: 2026-11-25

## Product direction

The approved target is a spy-comedy incremental rail shooter that grows from manual field combat into fully autonomous mission execution. The first goal is not to ship every planned feature. It is to rebuild a reliable vertical slice that demonstrates the core loop and can be expanded without throwing away its architecture.

## Current prototype status

The repository already contains a working Phaser/TypeScript prototype with:
- Start, HQ, Operations, Loadout, Computer, Settings, Mission and Results scenes;
- Casino and East Express content slices;
- four weapon definitions, six personal upgrade tracks, grenades/medkit, account progression and local saves;
- an operative roster with timed side assignments and components;
- basic enemy types, waves, cover states and attack telegraphs;
- mobile hybrid/aim-stick controls, HUD feedback, local audio and a runtime enemy state atlas.

These are prototype implementations. Their presence does not imply the quality issues reported in the November 25 feedback are resolved. In particular, visual polish, rail movement, cover rendering/occlusion, enemy spacing, progression balance, contextual onboarding and full autonomy remain unvalidated or incomplete.

## Rebaseline priorities

### P0 — Combat foundation and rail-shooter integrity
- Restore a coherent rail timeline with independent background layers and actual moving environmental set pieces.
- Correct pointer-to-world mapping and remove the reported curved reticle movement.
- Make cover visible and spatially consistent; hidden enemies must not vanish.
- Prevent enemy overlap and predictable repeated spawn compositions.
- Distinguish enemy archetypes through behaviour, attacks and counters.
- Add readable enemy attack launch/effects and a proper lower-foreground hand/weapon rig.
- Verify music/SFX balance.
- Acceptance: a complete Casino route can be played from entry to extraction without broken aim, invisible enemies, unfair hazards or overlapping targets.

### P1 — UI and HQ identity
- Establish a shared typography, spacing, button, tab, card, tooltip and modal system.
- Redesign Start with consistent button geometry and stronger spy-agency identity.
- Make Settings platform-aware; desktop gets key rebinding, mobile gets touch layout/sensitivity; explain graphics and vibration; remove normal parallax toggle.
- Rebuild HQ as an operative's workstation, with meaningful phone and a recognizable interactive cat.
- Replace chart-like Operations screen with a map/dossier presentation.
- Ensure active Armory and Computer tabs remain visibly selected after redraw.
- Acceptance: all primary screens have consistent hierarchy and every interactive prop/control has a clear purpose.

### P2 — Story and onboarding
- Build the first-operation prologue/tutorial.
- Introduce player-agent terminology and distinguish roster operatives.
- Deliver mission narrative via briefing, radio, character exchanges, documents and debrief.
- Establish the first campaign's antagonist network with Vulkan as one major antagonist.
- Acceptance: a new player understands the immediate objective, core controls, first progression reward and why the next operation matters.

### P3 — Progression and economy
- Rebalance dollars, reputation and components around full-operation outcomes.
- Reduce early-wave/death farming; make mission completion and objectives the dominant reward.
- Separate personal perks, agency development and mission loadout.
- Expand perks into meaningful branches/synergies and weapon modifications into a real attachment system.
- Add concrete descriptions and comparable weapon statistics.
- Acceptance: the first failure cannot finance a large fraction of the arsenal; normal successful progression remains rewarding; late-game power grows through new systems, not only stat inflation.

### P4 — Operatives and agency systems
- Make operative assignments produce useful components, supplies and intelligence.
- Add visible assignment stages, reports and clear team/role effects.
- Add main-mission support assignment, with availability conflict against timed roster missions.
- Add an agency development/research tab distinct from personal combat perks.
- Acceptance: operatives create an understandable strategic choice and are useful without becoming mandatory timer chores.

### P5 — Combat automation ladder
- Add assisted systems in a staged order: automatic supplies, turrets, operative call-in, drones and advanced weapons.
- Add late-game laser gloves and target automation.
- Build the autonomous mission director and configuration/preparation UI.
- Acceptance: a configured known operation can run from entry through extraction with zero player combat input, using normal combat rules and producing a meaningful report. Underpowered configurations can still fail.

### P6 — Campaign expansion and polish
- Expand each of the five initial locations with sectors and signature events.
- Add compatible operation modifiers and new antagonist/boss encounters.
- Add cosmetics and full sprite/rig layers, animation cycles, audio and quality optimization.
- Add more campaign locations only after each initial location's signature mechanic is proven.

## Explicitly not required in the immediate vertical slice

- All five locations fully built.
- Every proposed modifier.
- Full autonomous endgame.
- Final prestige structure.
- Dozens of weapons, skins or operatives.
- Online features, ads or monetization.
- Full cinematic cutscenes.

## Validation

Automated checks: typecheck, lint, unit tests and production build. Add focused deterministic tests for reward calculations, rail-event schedules, spawn spacing, cover/line-of-sight, modifier compatibility and automation decisions.

Manual checks: desktop visual QA and physical Android touch/multitouch/orientation/audio. CI is not evidence of physical-device validation. Keep these statuses separate in the handoff.

## Documentation hierarchy

- `GAME_BIBLE.md`: approved product identity and canon.
- `GAME_DESIGN.md`: core loop, screens, mission and progression rules.
- `CAMPAIGN_AND_LOCATIONS.md`: story framing, location mechanics and modifier pools.
- `COMBAT_SPEC.md`: combat simulation and event rules.
- `AUTOMATION_DESIGN.md`: assisted and autonomous mission execution.
- `UI_UX_SPEC.md`: visual/interaction rules for screens and controls.
- `DECISIONS.md`: accepted decisions and unresolved questions.
- `ROADMAP.md`: production order and status.
