import { describe, expect, it } from 'vitest';
import {
  PLAYER_DODGE_COOLDOWN_MS,
  PLAYER_DODGE_DURATION_MS,
  isPlayerDodgeEvading,
  samplePlayerDodgePose,
} from './playerDodge';

describe('player duck and evade window', () => {
  it('has a bounded dodge duration and cooldown', () => {
    expect(PLAYER_DODGE_DURATION_MS).toBe(560);
    expect(PLAYER_DODGE_COOLDOWN_MS).toBe(2400);
  });

  it('returns to standing at the start and end of the dodge', () => {
    expect(samplePlayerDodgePose(560)).toEqual({ offsetY: 0, canEvade: false });
    expect(samplePlayerDodgePose(0)).toEqual({ offsetY: 0, canEvade: false });
  });

  it('holds a readable crouch through the central evasion window', () => {
    const pose = samplePlayerDodgePose(280);
    expect(pose.offsetY).toBe(68);
    expect(pose.canEvade).toBe(true);
  });

  it('does not evade before the body has lowered enough or after recovery', () => {
    expect(samplePlayerDodgePose(540).canEvade).toBe(false);
    expect(samplePlayerDodgePose(45).canEvade).toBe(false);
  });

  it('only avoids a projectile when crouched away from its recorded target', () => {
    const target = { x: 640, y: 624 };
    expect(isPlayerDodgeEvading(280, target, { x: 640, y: 692 })).toBe(true);
    expect(isPlayerDodgeEvading(280, target, { x: 640, y: 624 })).toBe(false);
    expect(isPlayerDodgeEvading(30, target, { x: 640, y: 692 })).toBe(false);
  });

  it('rejects invalid timing and coordinates', () => {
    expect(() => samplePlayerDodgePose(Number.NaN)).toThrow(RangeError);
    expect(() => samplePlayerDodgePose(100, 0)).toThrow(RangeError);
    expect(() => isPlayerDodgeEvading(100, { x: Number.NaN, y: 0 }, { x: 0, y: 0 })).toThrow(RangeError);
  });
});