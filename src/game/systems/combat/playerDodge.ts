import type { Point } from './combatMath';

export const PLAYER_DODGE_DURATION_MS = 560;
export const PLAYER_DODGE_COOLDOWN_MS = 2400;
export const PLAYER_DODGE_OFFSET_Y = 68;
export const PLAYER_DODGE_EVADE_DISTANCE = 42;

export interface PlayerDodgePose { offsetY: number; canEvade: boolean }

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/** Brief crouch curve: dip quickly, hold through the projectile window, then recover. */
export function samplePlayerDodgePose(
  remainingMs: number,
  durationMs = PLAYER_DODGE_DURATION_MS,
): PlayerDodgePose {
  if (!Number.isFinite(remainingMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError('dodge timing must be finite and duration positive');
  }
  const remaining = Math.max(0, Math.min(durationMs, remainingMs));
  const progress = 1 - remaining / durationMs;
  const rampIn = progress / 0.18;
  const rampOut = (1 - progress) / 0.20;
  const strength = smoothstep(Math.min(rampIn, rampOut));
  const offsetY = PLAYER_DODGE_OFFSET_Y * strength;
  return { offsetY, canEvade: offsetY >= PLAYER_DODGE_EVADE_DISTANCE };
}

/** A fired round misses only while the crouch has shifted the player's hit point far enough. */
export function isPlayerDodgeEvading(
  remainingMs: number,
  projectileTarget: Point,
  currentPlayerHitPoint: Point,
  durationMs = PLAYER_DODGE_DURATION_MS,
): boolean {
  if (![projectileTarget.x, projectileTarget.y, currentPlayerHitPoint.x, currentPlayerHitPoint.y].every(Number.isFinite)) {
    throw new RangeError('dodge and projectile coordinates must be finite');
  }
  const pose = samplePlayerDodgePose(remainingMs, durationMs);
  const distance = Math.hypot(projectileTarget.x - currentPlayerHitPoint.x, projectileTarget.y - currentPlayerHitPoint.y);
  return pose.canEvade && distance >= PLAYER_DODGE_EVADE_DISTANCE;
}