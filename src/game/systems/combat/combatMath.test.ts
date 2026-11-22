import { describe, expect, it } from 'vitest';
import { isShotBlocked, resolveHit, segmentIntersectsRect } from './combatMath';

describe('combat geometry', () => {
  it('detects a cover crossing the shot segment', () => {
    expect(segmentIntersectsRect({ x: 0, y: 100 }, { x: 100, y: 0 }, { x: 40, y: 40, width: 20, height: 20 })).toBe(true);
  });

  it('does not block a shot when cover is outside the line', () => {
    expect(isShotBlocked({ x: 0, y: 100 }, { x: 100, y: 0 }, [{ x: 70, y: 70, width: 10, height: 10 }])).toBe(false);
  });

  it('distinguishes head and body hits', () => {
    expect(resolveHit({ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 40 }, 12, 22)).toBe('head');
    expect(resolveHit({ x: 10, y: 40 }, { x: 10, y: 10 }, { x: 10, y: 40 }, 12, 22)).toBe('body');
    expect(resolveHit({ x: 100, y: 100 }, { x: 10, y: 10 }, { x: 10, y: 40 }, 12, 22)).toBeNull();
  });
});
