# SHPY — Casino rail timeline implementation plan
Date: 2026-11-25
Spec: `docs/COMBAT_SPEC.md`, `docs/TECHNICAL_ARCHITECTURE.md`, `docs/ROADMAP.md`

## Goal
Begin P0 with a deterministic route clock that drives independent environment-layer travel in the existing Casino mission. Keep the player, reticle, weapon rig, HUD and combat hitboxes in stable viewport coordinates. The camera must not be used as a shortcut for visual parallax.

## Scope of this first slice
- Add a Phaser-independent `RailTimeline` domain module.
- Advance route distance only while the mission is actively running; pause/transition states must not advance it.
- Split the existing Casino main/bar SVG source art into transparent, same-canvas base/far/mid/near planes; do not generate replacement art.
- Give authored Casino far, mid and near planes separate bounded travel; retain wrapped procedural offsets for East Express window layers.
- Show route progress in the existing mission HUD.
- Preserve the existing input profiles, save schema, rewards, weapons and enemy combat state machine.
- Do not claim the entire rail-shooter foundation is complete: enemy lane motion, authored multi-plane casino art, physical cover occlusion, spawn director and attack projectile feedback remain subsequent P0 tasks.

## Implementation tasks
1. Add focused tests for deterministic distance, progress, completion clamp, reset and wrapped layer offsets. Run them before implementation and confirm the expected missing-module failure.
2. Implement `src/game/systems/missions/RailTimeline.ts` as plain TypeScript with validated configuration and no Phaser dependency.
3. Integrate the timeline into `MissionScene`: reset per mission segment, advance only in active play, load and scroll authored Casino base/far/mid/near SVG planes at distinct factors, retaining original full-scene fallback, and render a compact route progress meter.
4. Update ROADMAP, RELEASE_NOTES, ASSET_CATALOG/RESEARCH only where implementation state changed, and AI_HANDOFF with exact branch/PR/test evidence.
5. Run focused tests, typecheck, lint, full tests and production build through GitHub Actions. Review the resulting diff before declaring the slice complete.

## Acceptance
- Identical delta sequences and configuration produce identical route state.
- Route distance never exceeds route length; progress remains within 0..1.
- Paused and transition phases do not advance the route.
- Far/mid/near offsets wrap independently and do not alter aim or hitbox coordinates.
- Existing combat, mobile input and save tests remain unchanged and pass.
- The implementation is explicitly labelled as the first rail-motion slice, not a complete rail-shooter.

## Deferred P0 work
- Enemy route lanes and additional authored location-specific foreground set pieces.
- World/route coordinate model and enemies entering/leaving along route lanes.
- Direct pointer-to-world mapping for any future camera travel.
- Shared physical cover geometry for rendering, shot blocking and hit-testing.
- Seeded spawn spacing/composition and distinct enemy behaviour.
- Visible attack launches/projectiles and audio mix validation.
- Desktop/browser visual QA and physical Android validation.
