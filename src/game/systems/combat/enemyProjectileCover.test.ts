import { describe, expect, it } from 'vitest';
import { findEnemyProjectileCoverImpact } from './enemyProjectileCover';

describe('enemy projectile cover collision', () => {
  it('returns null when every cover is outside the firing line', () => {
    expect(findEnemyProjectileCoverImpact(
      { x: 0, y: 100 }, { x: 100, y: 0 },
      [{ x: 70, y: 70, width: 10, height: 10 }],
    )).toBeNull();
  });

  it('stops the round at the near edge of a crossed cover', () => {
    const progress = 132 / 336;
    expect(findEnemyProjectileCoverImpact(
      { x: 387, y: 288 }, { x: 640, y: 624 },
      [{ x: 250, y: 420, width: 260, height: 94 }],
    )).toEqual({ point: { x: 387 + 253 * progress, y: 420 }, progress, coverIndex: 0 });
  });

  it('selects the earliest cover when several rectangles cross the line', () => {
    const result = findEnemyProjectileCoverImpact(
      { x: 100, y: 0 }, { x: 900, y: 600 },
      [
        { x: 500, y: 300, width: 100, height: 100 },
        { x: 250, y: 100, width: 80, height: 80 },
      ],
    );
    expect(result?.coverIndex).toBe(1);
    expect(result?.point.x).toBeCloseTo(250);
    expect(result?.point.y).toBeCloseTo(112.5);
  });

  it('counts edge contact as a solid impact', () => {
    const result = findEnemyProjectileCoverImpact(
      { x: 0, y: 50 }, { x: 100, y: 50 },
      [{ x: 40, y: 50, width: 20, height: 10 }],
    );
    expect(result).toEqual({ point: { x: 40, y: 50 }, progress: 0.4, coverIndex: 0 });
  });

  it('handles a projectile starting inside a cover as immediate contact', () => {
    expect(findEnemyProjectileCoverImpact(
      { x: 50, y: 50 }, { x: 100, y: 50 },
      [{ x: 40, y: 40, width: 30, height: 30 }],
    )).toEqual({ point: { x: 50, y: 50 }, progress: 0, coverIndex: 0 });
  });

  it('rejects non-finite segment or invalid cover geometry', () => {
    expect(() => findEnemyProjectileCoverImpact({ x: Number.NaN, y: 0 }, { x: 1, y: 1 }, []))
      .toThrow(RangeError);
    expect(() => findEnemyProjectileCoverImpact(
      { x: 0, y: 0 }, { x: 1, y: 1 }, [{ x: 0, y: 0, width: -1, height: 2 }],
    )).toThrow(RangeError);
  });
});