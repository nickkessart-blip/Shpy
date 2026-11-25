# SHPY — AUTOMATION AND ENDGAME DESIGN
Version 1.0 | Approved direction: 2026-11-25

## Core promise

The endgame fantasy is explicit: the player prepares and launches an operation, then watches the agency's systems execute it. In a fully automated operation the player does not aim, shoot, reload, activate a turret, call a support operative or use a medkit. The simulation performs those actions autonomously. The player's role has moved from field execution to building, equipping and directing the machine that executes the mission.

This is mission-bound autonomous gameplay, not an offline idle timer and not a passive reward claim. The operation is still played out as a visible rail-shooter sequence with enemies, location events, attacks, support actions, damage, success/failure and a debrief.

## Three layers of progression

### 1. Manual field operation

The player directly aims and fires, reloads, changes weapons and uses tactical items. The operation is a hands-on rail shooter. Support systems are absent or limited.

### 2. Assisted field operation

The player still chooses targets and makes the important decisions, while unlocked equipment reduces repetitive input:
- automatic weapon profiles continue firing while the player holds fire;
- assisted or automatic reload can be researched;
- medkits can be configured to auto-use at a selected health threshold;
- a turret can be deployed using a dedicated command and then attacks on its own;
- a support operative can be called into the scene if they are assigned to the operation and are not busy elsewhere;
- a drone can mark targets, provide suppressive fire or perform a specialist function.

These systems should arrive through meaningful unlocks, not all at once.

### 3. Autonomous operation

This is a late/endgame system. Before launch, the player configures:
- primary and secondary weapons;
- tactical and active supplies;
- available support operative;
- turret/drone/rocket support package;
- target priority and basic engagement doctrine;
- permitted automatic supply use and deployment rules;
- optional operation modifiers.

After launch, the whole operation is simulated autonomously. The AI:
- tracks the rail route and encounter timeline;
- identifies and prioritizes targets;
- aims and fires with the equipped weapon systems;
- reloads and switches weapons according to the configured policy;
- uses medkits and consumables according to configured thresholds;
- deploys turrets, drones and other unlocked support;
- calls the assigned operative and coordinates their role;
- responds to location mechanics and enemy telegraphs;
- advances through segments and reports success, partial success or failure.

The player watches. There are no required mid-operation clicks or hidden manual actions. Pausing, replay speed and leaving the report are presentation controls, not combat interventions.

## Unlocking autonomy fairly

- New story operations and newly opened sectors are first experienced in manual or assisted mode, so the player learns the location mechanic and story stakes.
- Research, account reputation, staff capability and successful reconnaissance can unlock automation for that operation or sector.
- An operation is not marked "automated" merely because the player owns a turret. The complete autonomous package must cover targeting, firing, defence, resource use and location-event response.
- Early sectors can later become routine autonomous assignments. Higher sectors, new bosses and unusual modifiers can still test the agency's preparation.
- Manual play remains available as an optional way to replay a known operation, but it is not mandatory once full autonomy is unlocked.

## Automation equipment ladder

The following is the intended content ladder, not a fixed account-level table:

1. Reliable sidearm and manual reload.
2. Improved weapon handling, larger magazines and assisted reload.
3. Automatic medkit protocol with a configurable health threshold.
4. First deployable turret: the player initially presses a button; the turret then acquires and attacks targets.
5. Support operative call-in: an assigned roster member enters the scene and fights according to their specialist role.
6. Recon/attack drone: target marking, threat detection or limited autonomous damage.
7. Laser gloves: a signature late-game weapon system inspired by the broad science-fiction gadget fantasy of Polar, not a reproduction of that film's design. In assisted mode it fires when the reticle is over a valid target; in full autonomy the targeting and firing are both automated.
8. Advanced support packages: additional turrets, rockets, multiple drones, automated weapon selection and coordinated support.
9. Full autonomous mission director: combines the systems above and runs the operation from entry to extraction.

## Operatives as a strategic constraint

A support operative called into a main operation must be reserved for that operation. They cannot simultaneously be assigned to a timed Brotherhood/roster assignment. The player chooses between:
- sending an operative away to gather components/intelligence/resources; or
- reserving their specialist ability for direct combat support.

Operative roles must create meaningful differences:
- scout: reveals threats, weak points and incoming location events;
- engineer: improves turrets, repairs equipment and disables technical hazards;
- infiltrator: disrupts enemy support/security and improves sabotage objectives;
- assault: suppresses enemies and deals direct combat damage.

The exact role effects and mission rewards are balance/content work. Do not make all operatives interchangeable damage sources.

## Agency research and infrastructure

A distinct "Agency development" track must unlock systems, capacity and policies rather than simply duplicating personal weapon perks. Examples:
- command and control: more concurrent assignments and better operation reports;
- logistics: supply capacity, consumable production and reduced preparation cost;
- engineering: turret tiers, drone functions and repair efficiency;
- intelligence: reconnaissance, modifier preview and target priority options;
- automation: auto-reload, auto-medkit, assisted targeting and ultimately autonomous operation.

The phone can serve as an event/message/contract inbox. The HQ computer is the main place for agency research, staff management and automation policies.

## Balance principles

- Automation trades player attention for equipment capacity, research, components, staff availability and operational budget.
- Fully automated operations must still be evaluated against enemy strength, location modifiers, durability, ammunition/supplies and support readiness.
- The player should feel powerful, not invulnerable by default. Preparation mistakes, hostile modifier combinations and under-levelled systems can still cause failure.
- Late-game spectacle comes from multiple systems coordinating, not simply multiplying one weapon's damage.
- Replaying known content autonomously should be useful but must not outpace every other progression route without cost or risk.
- Do not apply an arbitrary "manual play gives double rewards" rule. Reward parity and incentives require economy tests and a deliberate decision.
- The simulation must remain deterministic under a recorded seed for reproducible reports and balance tests.

## Runtime separation

The automation director makes decisions from game state and sends ordinary gameplay actions to the same combat interfaces used by the player. It must not bypass hitboxes, cover, enemy health, location hazards, weapon rules or mission conditions. Manual input and automation are two controllers over the same combat rules.

## Required future tests

- A fully automated build can clear a known baseline operation with no player combat input.
- A missing support operative does not get called into the mission.
- An operative reserved for a main mission cannot be assigned to a concurrent roster mission.
- Automatic medkit use respects charges and the chosen threshold.
- Turret/drone/rocket systems respect cooldowns, ammunition and deploy limits.
- A location hazard can affect autonomous systems, and the automation director can respond only using unlocked capabilities.
- Underpowered configurations can fail; autonomy must not guarantee success.
- Replaying the same seed and setup produces the same simulation outcome.
