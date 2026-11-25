export interface EnemyHitReaction {
  offsetX: number;
  offsetY: number;
  angle: number;
  scaleX: number;
  scaleY: number;
}

/** A short deterministic knockback pose. Presentation only; never feeds combat coordinates. */
export function sampleEnemyHitReaction(hitFlashMs: number, uid: number): EnemyHitReaction {
  const strength = Math.max(0, Math.min(1, hitFlashMs / 230));
  if (strength === 0) return { offsetX: 0, offsetY: 0, angle: 0, scaleX: 1, scaleY: 1 };
  const direction = uid % 2 === 0 ? 1 : -1;
  return {
    offsetX: direction * 13 * strength,
    offsetY: -4 * strength,
    angle: direction * 7 * strength,
    scaleX: 1 + 0.045 * strength,
    scaleY: 1 - 0.025 * strength,
  };
}

/** Returns 0 before the aim wind-up begins and 1 when the attack is ready. */
export function sampleEnemyAimCharge(timerMs: number, aimDurationMs: number): number {
  if (!Number.isFinite(timerMs) || !Number.isFinite(aimDurationMs) || aimDurationMs <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - timerMs / aimDurationMs));
}
