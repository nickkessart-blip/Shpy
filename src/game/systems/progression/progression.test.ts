import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { ENEMIES } from '../../data/enemies';

describe('progression balance', () => {
  it('provides five upgrade tiers for every permanent perk', () => {
    for (const thresholds of Object.values(BALANCE.upgradeCosts)) expect(thresholds).toHaveLength(5);
    expect(BALANCE.upgradeCosts.damage[4]).toBeGreaterThan(BALANCE.upgradeCosts.damage[3]);
  });

  it('gates advanced perk tiers behind account levels', () => {
    expect(BALANCE.upgradeTierUnlockLevels.damage).toEqual([0, 1, 3, 5, 8]);
    expect(BALANCE.upgradeTierUnlockLevels.health).toEqual([0, 3, 5, 7, 10]);
    expect(BALANCE.upgradeTierUnlockLevels.precision[4]).toBe(12);
  });

  it('makes every upgrade level meaningfully stronger', () => {
    for (let level = 1; level < 5; level += 1) {
      expect(BALANCE.weapon.damage[level]).toBeGreaterThan(BALANCE.weapon.damage[level - 1]);
      expect(BALANCE.weapon.magazine[level]).toBeGreaterThan(BALANCE.weapon.magazine[level - 1]);
      expect(BALANCE.weapon.reloadSeconds[level]).toBeLessThan(BALANCE.weapon.reloadSeconds[level - 1]);
      expect(BALANCE.weapon.headMultiplier[level]).toBeGreaterThan(BALANCE.weapon.headMultiplier[level - 1]);
      expect(BALANCE.player.maxHp[level]).toBeGreaterThan(BALANCE.player.maxHp[level - 1]);
      expect(BALANCE.player.damageReduction[level]).toBeGreaterThan(BALANCE.player.damageReduction[level - 1]);
    }
  });

  it('keeps unupgraded and upgraded enemies out of one-shot territory by body shots', () => {
    expect(BALANCE.weapon.damage[4]).toBeLessThan(ENEMIES.guard.hp);
    expect(BALANCE.weapon.damage[4] * BALANCE.weapon.headMultiplier[4]).toBeLessThan(ENEMIES.guard.hp);
  });

  it('keeps the casino boss stronger than regular enemies', () => {
    expect(ENEMIES.boss.hp).toBeGreaterThan(ENEMIES.armored.hp);
    expect(BALANCE.rewards.xp.boss).toBeGreaterThan(BALANCE.rewards.xp.wave);
    expect(BALANCE.rewards.dollars.boss).toBeGreaterThan(BALANCE.rewards.dollars.wave);
  });
});
