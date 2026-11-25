# Skill: gameplay engineering

- Read `docs/GAME_BIBLE.md`, `docs/COMBAT_SPEC.md`, `docs/TECHNICAL_ARCHITECTURE.md` and `docs/DECISIONS.md` before gameplay changes.
- Phaser scene lifecycle matters: reset run-scoped state in `create()`, detach listeners/tweens on shutdown, and avoid duplicate display objects.
- Keep gameplay coordinates, camera transforms, pointer coordinates and HUD screen-space coordinates distinct.
- Preserve independent pointer IDs for multi-touch; never let fire input steal aim input.
- Keep combat feedback readable but non-blocking: recoil is impulse + damped return, not oscillating side-to-side drift.
- Enemy pose animation must not modify authoritative hitbox coordinates. Visual offsets/scales are cosmetic only.
- Use deterministic animation curves based on elapsed scene time; avoid accumulating per-frame position offsets.
- Do not change balance, progression, save schemas or canon silently. Add migration/tests for save changes.
- Add focused tests for pure logic and document manual gameplay/device checks that cannot be automated.
