import { describe, expect, it } from 'vitest';
import { followAimWithCamera, getAimVelocity, moveAim, moveAimByPointerDelta, moveAimInWorld } from './aimMath';

describe('mobile aim response', () => {
  it('ignores only the tiny radial dead zone', () => {
    expect(getAimVelocity({ x: 0.02, y: 0.02 }, 1.8)).toEqual({ x: 0, y: 0 });
    expect(getAimVelocity({ x: 0.12, y: 0 }, 1.8).x).toBeGreaterThan(0);
  });

  it('keeps small, intentional thumb movements responsive', () => {
    const small = getAimVelocity({ x: 0.25, y: 0 }, 1.8);
    const full = getAimVelocity({ x: 1, y: 0 }, 1.8);
    expect(small.x).toBeGreaterThan(0.1);
    expect(full.x).toBeGreaterThan(small.x * 1.5);
    expect(full.x).toBeLessThan(0.5);
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
    expect(velocity).toBeLessThan(0.5);
    expect(step100.x - start.x).toBeCloseTo(velocity * 100, 8);
  });

  it('clamps the cursor inside the playable field', () => {
    expect(moveAim({ x: 1270, y: 710 }, { x: 1, y: 1 }, 4, 50, 1280, 720))
      .toEqual({ x: 1262, y: 590 });
  });
});


describe('world-space mobile aim and camera follow', () => {
  const worldBounds = { minX: -420, maxX: 1700, minY: -180, maxY: 900 };
  const scrollBounds = { minX: -420, maxX: 420, minY: -180, maxY: 180 };
  const viewport = { width: 1280, height: 720 };

  it('moves the reticle beyond the visible screen without clamping it to the viewport', () => {
    const moved = moveAimInWorld({ x: 1260, y: 360 }, { x: 1, y: 0 }, 4, 120, worldBounds);
    expect(moved.x).toBeGreaterThan(1280);
    expect(moved.y).toBe(360);
  });

  it('clamps world aim only at the authored mission limits', () => {
    expect(moveAimInWorld({ x: 1699, y: 899 }, { x: 1, y: 1 }, 4, 120, worldBounds))
      .toEqual({ x: 1700, y: 900 });
  });

  it('moves the camera to keep an off-screen target inside the safe viewport', () => {
    const scroll = followAimWithCamera({ x: 1500, y: 600 }, { x: 0, y: 0 }, viewport, scrollBounds);
    expect(scroll.x).toBe(420);
    expect(scroll.y).toBeCloseTo(81.6, 8);
    expect(1500 - scroll.x).toBeGreaterThanOrEqual(1280 * 0.28);
    expect(600 - scroll.y).toBeGreaterThanOrEqual(720 * 0.28);
  });

  it('does not move the camera while the reticle remains in the safe region', () => {
    expect(followAimWithCamera({ x: 640, y: 360 }, { x: 20, y: -10 }, viewport, scrollBounds))
      .toEqual({ x: 20, y: -10 });
  });

  it('keeps camera movement inside authored limits when aim exceeds them', () => {
    expect(followAimWithCamera({ x: 2200, y: 1200 }, { x: 0, y: 0 }, viewport, scrollBounds))
      .toEqual({ x: 420, y: 180 });
  });

  it('keeps full-stick movement controllable at maximum sensitivity', () => {
    const velocity = getAimVelocity({ x: 1, y: 0 }, 4);
    expect(velocity.x).toBeLessThanOrEqual(1);
    const moved = moveAimInWorld({ x: 640, y: 360 }, { x: 1, y: 0 }, 1.8, 100,
      { minX: -420, maxX: 1700, minY: -180, maxY: 900 });
    expect(moved.x - 640).toBeLessThan(50);
  });

  it('applies drag sensitivity to world-space reticle travel', () => {
    expect(moveAimByPointerDelta({ x: 500, y: 300 }, { x: 20, y: -10 }, 2, worldBounds))
      .toEqual({ x: 540, y: 280 });
  });
});

describe('mobile control physical sizing', () => {
  it('keeps controls large enough on compact landscape phones', () => {
    expect(getMobileControlScale(640, 360)).toBe(0.8);
    expect(96 * getMobileControlScale(640, 360)).toBeGreaterThanOrEqual(76);
  });

  it('scales controls up on larger phones without making them oversized', () => {
    expect(getMobileControlScale(854, 480)).toBeCloseTo(1.0675, 4);
    expect(getMobileControlScale(1280, 720)).toBe(1.15);
  });

  it('never shrinks touch targets below the minimum scale', () => {
    expect(getMobileControlScale(480, 270)).toBe(0.8);
  });
});
