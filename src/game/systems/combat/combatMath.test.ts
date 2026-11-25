import { describe, expect, it } from 'vitest';
import { findVisiblePeekX, getAimFeedbackState, isShotBlocked, resolveHit, segmentIntersectsRect } from './combatMath';

describe('combat geometry', () => {
  it('detects a cover crossing the shot segment', () => {
    expect(segmentIntersectsRect({ x: 0, y: 100 }, { x: 100, y: 0 }, { x: 40, y: 40, width: 20, height: 20 })).toBe(true);
  });

  it('does not block a shot when cover is outside the line', () => {
    expect(isShotBlocked({ x: 0, y: 100 }, { x: 100, y: 0 }, [{ x: 70, y: 70, width: 10, height: 10 }])).toBe(false);
  });

  it('blocks a shot at an enemy physically behind cover', () => {
    expect(isShotBlocked(
      { x: 640, y: 662 },
      { x: 380, y: 480 },
      [{ x: 250, y: 420, width: 260, height: 94 }],
    )).toBe(true);
  });

  it('allows a shot at an enemy peeking beyond the cover edge', () => {
    expect(isShotBlocked(
      { x: 640, y: 662 },
      { x: 580, y: 350 },
      [{ x: 250, y: 420, width: 260, height: 94 }],
    )).toBe(false);
  });

  it('places enemies on the player-facing side of cover', () => {
    expect(findVisiblePeekX({ x: 640, y: 662 }, { x: 250, y: 420, width: 260, height: 94 })).toBe(580);
    expect(findVisiblePeekX({ x: 640, y: 662 }, { x: 720, y: 425, width: 180, height: 100 })).toBe(650);
  });

  it('distinguishes head and body hits', () => {
    expect(resolveHit({ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 40 }, 12, 22)).toBe('head');
    expect(resolveHit({ x: 10, y: 40 }, { x: 10, y: 10 }, { x: 10, y: 40 }, 12, 22)).toBe('body');
    expect(resolveHit({ x: 100, y: 100 }, { x: 10, y: 10 }, { x: 10, y: 40 }, 12, 22)).toBeNull();
  });
});


describe('aim target feedback', () => {
  const target = { head: { x: 100, y: 80 }, body: { x: 100, y: 120 }, headRadius: 20, bodyRadius: 30 };

  it('marks a clear enemy under the reticle as targetable', () => {
    expect(getAimFeedbackState({ x: 100, y: 80 }, { x: 0, y: 180 }, [target], []))
      .toBe('clear');
  });

  it('marks a target behind cover as blocked', () => {
    expect(getAimFeedbackState({ x: 100, y: 80 }, { x: 0, y: 180 }, [target],
      [{ x: 40, y: 110, width: 40, height: 30 }])).toBe('blocked');
  });

  it('keeps the neutral reticle when no target overlaps it', () => {
    expect(getAimFeedbackState({ x: 300, y: 300 }, { x: 0, y: 180 }, [target], []))
      .toBe('none');
  });

  it('prefers a clear target if overlapping target zones include a blocked one', () => {
    const clear = { head: { x: 110, y: 50 }, body: { x: 110, y: 90 }, headRadius: 40, bodyRadius: 30 };
    expect(getAimFeedbackState({ x: 100, y: 80 }, { x: 0, y: 180 }, [target, clear],
      [{ x: 40, y: 110, width: 40, height: 30 }])).toBe('clear');
  });
});
