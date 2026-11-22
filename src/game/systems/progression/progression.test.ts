import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';

describe('prototype progression data', () => {
  it('keeps the base pistol at six rounds and the configured damage', () => {
    expect(BALANCE.weapon.magazine[0]).toBe(6);
    expect(BALANCE.weapon.damage[0]).toBe(1);
  });
  it('keeps reputation rewards positive and increasing by milestone', () => {
    expect(BALANCE.rewards.kill).toBeGreaterThan(0);
    expect(BALANCE.rewards.wave).toBeGreaterThan(BALANCE.rewards.kill);
    expect(BALANCE.rewards.mission).toBeGreaterThan(BALANCE.rewards.wave);
  });
});
