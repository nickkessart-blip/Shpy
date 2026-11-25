import { describe, expect, it } from 'vitest';
import { sampleEnemyAimCharge, sampleEnemyHitReaction } from './enemyPresentation';

describe('enemy hit presentation', () => {
  it('returns a neutral pose when the hit flash has expired', () => {
    expect(sampleEnemyHitReaction(0, 1)).toEqual({
      offsetX: 0, offsetY: 0, angle: 0, scaleX: 1, scaleY: 1,
    });
  });

  it('pushes enemies in a deterministic direction based on their identity', () => {
    const left = sampleEnemyHitReaction(230, 1);
    const right = sampleEnemyHitReaction(230, 2);
    expect(left.offsetX).toBe(-13);
    expect(right.offsetX).toBe(13);
    expect(left.angle).toBe(-7);
    expect(right.angle).toBe(7);
  });

  it('fades the knockback smoothly with the existing hit flash timer', () => {
    const half = sampleEnemyHitReaction(115, 4);
    expect(half.offsetX).toBe(6.5);
    expect(half.angle).toBe(3.5);
    expect(half.scaleX).toBe(1.0225);
    expect(sampleEnemyHitReaction(-10, 4).offsetX).toBe(0);
  });
});

describe('enemy aim charge', () => {
  it('progresses from zero to full charge as the aim timer expires', () => {
    expect(sampleEnemyAimCharge(1000, 1000)).toBe(0);
    expect(sampleEnemyAimCharge(500, 1000)).toBe(0.5);
    expect(sampleEnemyAimCharge(0, 1000)).toBe(1);
  });

  it('clamps invalid and out-of-range timer values safely', () => {
    expect(sampleEnemyAimCharge(1200, 1000)).toBe(0);
    expect(sampleEnemyAimCharge(-10, 1000)).toBe(1);
    expect(sampleEnemyAimCharge(20, 0)).toBe(0);
    expect(sampleEnemyAimCharge(Number.NaN, 1000)).toBe(0);
  });
});
