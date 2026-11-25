import type { EnemyType } from '../../data/enemies';
import type { Point } from './combatMath';

const TRAVEL_TIME_MS: Record<EnemyType, number> = {
  guard: 360,
  armored: 430,
  assault: 290,
  boss: 520,
};

export interface EnemyProjectileSample extends Point {
  progress: number;
}

/** Slower, heavier rounds travel more slowly than the assault enemy's quick burst. */
export function getEnemyProjectileTravelMs(type: EnemyType): number {
  return TRAVEL_TIME_MS[type];
}

/** Samples a straight world-space tracer. Progress is clamped so the endpoint is exact. */
export function sampleEnemyProjectile(
  start: Point,
  target: Point,
  elapsedMs: number,
  durationMs: number,
): EnemyProjectileSample {
  if (![start.x, start.y, target.x, target.y, elapsedMs, durationMs].every(Number.isFinite)
    || durationMs <= 0) {
    throw new RangeError('enemy projectile coordinates and timing must be finite; duration must be positive');
  }
  const progress = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return {
    x: start.x + (target.x - start.x) * progress,
    y: start.y + (target.y - start.y) * progress,
    progress,
  };
}
