import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { ENEMIES } from '../../data/enemies';

describe('prototype progression data', () => {
  it('keeps the base pistol at six rounds and damage upgrades gradual', () => {
    expect(BALANCE.weapon.magazine[0]).toBe(6);
    expect(BALANCE.weapon.damage[0]).toBe(1);
    expect(BALANCE.weapon.damage[1]).toBeGreaterThan(BALANCE.weapon.damage[0]);
    expect(BALANCE.weapon.damage[2]).toBeGreaterThan(BALANCE.weapon.damage[1]);
    expect(BALANCE.weapon.damage[2] * BALANCE.weapon.headMultiplier).toBeLessThan(ENEMIES.guard.hp);
  });
  it('provides a measured resupply between casino zones', () => {
    expect(BALANCE.weapon.reserveAmmo).toBeGreaterThan(BALANCE.weapon.magazine[0]);
    expect(BALANCE.supplies.intermissionAmmo).toBeGreaterThan(0);
    expect(BALANCE.supplies.intermissionHealing).toBeGreaterThan(0);
  });
  it('keeps the boss reward above a regular kill and wave', () => {
    expect(BALANCE.rewards.kill).toBeGreaterThan(0);
    expect(BALANCE.rewards.wave).toBeGreaterThan(BALANCE.rewards.kill);
    expect(BALANCE.rewards.boss).toBeGreaterThan(BALANCE.rewards.wave);
    expect(BALANCE.rewards.mission).toBeGreaterThan(BALANCE.rewards.boss);
  });
});
