import type { EnemyType } from '../../data/enemies';

export type EnemyHitArea = 'head' | 'body';

export const ARMORED_RECOVERY_MS = 860;
export const ASSAULT_REPOSITION_MS = 260;

/**
 * Armored enemies absorb most body hits. The head remains an exposed weak point;
 * weapon precision headshot bonuses are applied separately by the caller.
 */
export function getEnemyHitAreaMultiplier(type: EnemyType, area: EnemyHitArea): number {
  if (type !== 'armored') return 1;
  return area === 'head' ? 1.55 : 0.45;
}

/** Alternates an assault enemy between two flanking lanes without leaving the authored arena. */
export function getAssaultFlankTargetX(
  baseX: number,
  phase: number,
  minX: number,
  maxX: number,
  distance = 150,
): number {
  if (![baseX, phase, minX, maxX, distance].every(Number.isFinite)
    || !Number.isInteger(phase) || phase < 0 || minX > maxX || distance < 0) {
    throw new RangeError('invalid assault flank coordinates or phase');
  }
  const direction = phase % 2 === 0 ? 1 : -1;
  return Math.max(minX, Math.min(maxX, baseX + direction * distance));
}
