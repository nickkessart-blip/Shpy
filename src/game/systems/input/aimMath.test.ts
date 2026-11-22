import { describe, expect, it } from 'vitest';
import { getAimVelocity, moveAim } from './aimMath';

describe('mobile aim response', () => {
  it('ignores the radial dead zone to prevent cursor drift', () => {
    expect(getAimVelocity({ x: 0.05, y: 0.05 }, 1.4)).toEqual({ x: 0, y: 0 });
  });

  it('moves substantially faster at full deflection than a small stick movement', () => {
    const small = getAimVelocity({ x: 0.25, y: 0 }, 1.4);
    const full = getAimVelocity({ x: 1, y: 0 }, 1.4);
    expect(full.x).toBeGreaterThan(small.x * 3);
    expect(full.y).toBe(0);
  });

  it('keeps diagonal movement at the same total speed as horizontal movement', () => {
    const horizontal = getAimVelocity({ x: 1, y: 0 }, 1.6);
    const diagonal = getAimVelocity({ x: 1, y: 1 }, 1.6);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(horizontal.x, 8);
  });

  it('caps over-range stick input without increasing diagonal speed', () => {
    const capped = getAimVelocity({ x: 4, y: 4 }, 1.6);
    const full = getAimVelocity({ x: 1, y: 1 }, 1.6);
    expect(Math.hypot(capped.x, capped.y)).toBeCloseTo(Math.hypot(full.x, full.y), 8);
  });

  it('clamps the cursor inside the playable field', () => {
    expect(moveAim({ x: 1270, y: 710 }, { x: 1, y: 1 }, 2.5, 50, 1280, 720))
      .toEqual({ x: 1262, y: 590 });
  });
});
