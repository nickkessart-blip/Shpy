import { describe, expect, it } from 'vitest';
import {
  ARMORED_RECOVERY_MS,
  ASSAULT_REPOSITION_MS,
  getAssaultFlankTargetX,
  getEnemyHitAreaMultiplier,
} from './enemyCombatRules';

describe('enemy archetype combat rules', () => {
  it('makes the armored torso resistant while keeping the head a weak point', () => {
    expect(getEnemyHitAreaMultiplier('armored', 'body')).toBe(0.45);
    expect(getEnemyHitAreaMultiplier('armored', 'head')).toBe(1.55);
    expect(getEnemyHitAreaMultiplier('guard', 'body')).toBe(1);
    expect(getEnemyHitAreaMultiplier('assault', 'head')).toBe(1);
    expect(getEnemyHitAreaMultiplier('boss', 'body')).toBe(1);
  });

  it('uses deliberate recovery and quick flank timings', () => {
    expect(ARMORED_RECOVERY_MS).toBe(860);
    expect(ASSAULT_REPOSITION_MS).toBe(260);
  });

  it('alternates assault flank lanes around the current base position', () => {
    expect(getAssaultFlankTargetX(640, 0, 110, 1170)).toBe(790);
    expect(getAssaultFlankTargetX(790, 1, 110, 1170)).toBe(640);
  });

  it('clamps flank movement to the authored arena bounds', () => {
    expect(getAssaultFlankTargetX(1120, 0, 110, 1170)).toBe(1170);
    expect(getAssaultFlankTargetX(160, 1, 110, 1170)).toBe(110);
  });

  it('rejects invalid flank coordinates and phases', () => {
    expect(() => getAssaultFlankTargetX(Number.NaN, 0, 110, 1170)).toThrow(RangeError);
    expect(() => getAssaultFlankTargetX(640, 1.5, 110, 1170)).toThrow(RangeError);
    expect(() => getAssaultFlankTargetX(640, -1, 110, 1170)).toThrow(RangeError);
    expect(() => getAssaultFlankTargetX(640, 0, 1170, 110)).toThrow(RangeError);
  });
});
