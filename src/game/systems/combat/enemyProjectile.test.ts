import { describe, expect, it } from 'vitest';
import { getEnemyProjectileTravelMs, sampleEnemyProjectile } from './enemyProjectile';

describe('enemy projectile travel', () => {
  it('uses readable travel speeds by archetype', () => {
    expect(getEnemyProjectileTravelMs('assault')).toBe(290);
    expect(getEnemyProjectileTravelMs('guard')).toBe(360);
    expect(getEnemyProjectileTravelMs('armored')).toBe(430);
    expect(getEnemyProjectileTravelMs('boss')).toBe(520);
  });

  it('travels linearly through world coordinates', () => {
    expect(sampleEnemyProjectile({ x: 100, y: 80 }, { x: 500, y: 680 }, 125, 500))
      .toEqual({ x: 200, y: 230, progress: 0.25 });
    expect(sampleEnemyProjectile({ x: 10, y: 20 }, { x: 50, y: 60 }, 250, 500))
      .toEqual({ x: 30, y: 40, progress: 0.5 });
  });

  it('starts at the muzzle and reaches the exact recorded target', () => {
    expect(sampleEnemyProjectile({ x: 40, y: 60 }, { x: 140, y: 260 }, 0, 400))
      .toEqual({ x: 40, y: 60, progress: 0 });
    expect(sampleEnemyProjectile({ x: 40, y: 60 }, { x: 140, y: 260 }, 400, 400))
      .toEqual({ x: 140, y: 260, progress: 1 });
  });

  it('clamps samples before launch and after impact', () => {
    expect(sampleEnemyProjectile({ x: 0, y: 0 }, { x: 100, y: 50 }, -20, 100))
      .toEqual({ x: 0, y: 0, progress: 0 });
    expect(sampleEnemyProjectile({ x: 0, y: 0 }, { x: 100, y: 50 }, 150, 100))
      .toEqual({ x: 100, y: 50, progress: 1 });
  });

  it('rejects invalid coordinates and travel times', () => {
    expect(() => sampleEnemyProjectile({ x: Number.NaN, y: 0 }, { x: 1, y: 1 }, 0, 100))
      .toThrow(RangeError);
    expect(() => sampleEnemyProjectile({ x: 0, y: 0 }, { x: 1, y: 1 }, 0, 0))
      .toThrow(RangeError);
    expect(() => sampleEnemyProjectile({ x: 0, y: 0 }, { x: 1, y: 1 }, 0, Number.POSITIVE_INFINITY))
      .toThrow(RangeError);
  });
});
