import { describe, expect, it } from 'vitest';
import { getAimVelocity, moveAim } from './aimMath';

describe('mobile aim response', () => {
  it('ignores only the tiny radial dead zone', () => {
    expect(getAimVelocity({ x: 0.02, y: 0.02 }, 1.8)).toEqual({ x: 0, y: 0 });
    expect(getAimVelocity({ x: 0.12, y: 0 }, 1.8).x).toBeGreaterThan(0);
  });

  it('keeps small, intentional thumb movements responsive', () => {
    const small = getAimVelocity({ x: 0.25, y: 0 }, 1.8);
    const full = getAimVelocity({ x: 1, y: 0 }, 1.8);
    expect(small.x).toBeGreaterThan(0.8);
    expect(full.x).toBeGreaterThan(small.x * 1.5);
    expect(full.y).toBe(0);
  });

  it('keeps diagonal movement at the same total speed as horizontal movement', () => {
    const horizontal = getAimVelocity({ x: 1, y: 0 }, 1.8);
    const diagonal = getAimVelocity({ x: 1, y: 1 }, 1.8);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(horizontal.x, 8);
  });

  it('caps over-range stick input without increasing diagonal speed', () => {
    const capped = getAimVelocity({ x: 4, y: 4 }, 1.8);
    const full = getAimVelocity({ x: 1, y: 1 }, 1.8);
    expect(Math.hypot(capped.x, capped.y)).toBeCloseTo(Math.hypot(full.x, full.y), 8);
  });

  it('uses full input time on low frame rates up to a safety cap', () => {
    const start = { x: 300, y: 300 };
    const velocity = getAimVelocity({ x: 1, y: 0 }, 1.8).x;
    const step50 = moveAim(start, { x: 1, y: 0 }, 1.8, 50, 1280, 720);
    const step100 = moveAim(start, { x: 1, y: 0 }, 1.8, 100, 1280, 720);
    expect(step50.x - start.x).toBeCloseTo(velocity * 50, 8);
    expect(step100.x - start.x).toBeCloseTo(velocity * 100, 8);
  });

  it('clamps the cursor inside the playable field', () => {
    expect(moveAim({ x: 1270, y: 710 }, { x: 1, y: 1 }, 4, 50, 1280, 720))
      .toEqual({ x: 1262, y: 590 });
  });
});
