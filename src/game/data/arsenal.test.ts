import { describe, expect, it } from 'vitest';
import {
  getWeaponSlotLimit, getNextWeaponSlotUnlock, getWeaponStats, normalizeLoadout, WEAPONS,
} from './arsenal';

describe('arsenal progression', () => {
  it('unlocks one, two and three weapon slots by account level', () => {
    expect(getWeaponSlotLimit(1)).toBe(1);
    expect(getWeaponSlotLimit(2)).toBe(2);
    expect(getWeaponSlotLimit(4)).toBe(2);
    expect(getWeaponSlotLimit(5)).toBe(3);
    expect(getNextWeaponSlotUnlock(1)).toEqual({ slots: 2, accountLevel: 2 });
    expect(getNextWeaponSlotUnlock(5)).toBeNull();
  });

  it('keeps a fresh agent on the pistol and filters locked or duplicate weapons', () => {
    expect(normalizeLoadout({ weapons: ['rifle', 'pistol', 'pistol'] }, 1).weapons).toEqual(['pistol']);
    expect(normalizeLoadout({ weapons: ['smg', 'pistol'] }, 2).weapons).toEqual(['smg', 'pistol']);
    expect(normalizeLoadout({ weapons: [] }, 1).weapons).toEqual(['pistol']);
  });

  it('unlocks utilities at account ranks, not by spending account XP', () => {
    expect(normalizeLoadout({ weapons: ['pistol'], tacticalItem: 'grenade', activeItem: 'medkit' }, 2))
      .toEqual({ weapons: ['pistol'], tacticalItem: 'none', activeItem: 'none' });
    expect(normalizeLoadout({ weapons: ['pistol'], tacticalItem: 'grenade', activeItem: 'medkit' }, 7))
      .toEqual({ weapons: ['pistol'], tacticalItem: 'grenade', activeItem: 'medkit' });
  });

  it('uses account rank unlocks for the four weapons', () => {
    expect(WEAPONS.map((weapon) => weapon.unlockLevel)).toEqual([1, 2, 4, 6]);
  });

  it('keeps all weapons below a normal guard one-shot body threshold at max damage upgrade', () => {
    for (const weapon of WEAPONS) {
      expect(getWeaponStats(weapon.id, { damage: 4, magazine: 4, reload: 4 }).damage).toBeLessThan(5);
    }
  });

  it('gives weapons distinct firing modes and projectile profiles', () => {
    expect(WEAPONS.map(({ id, fireMode, pellets }) => [id, fireMode, pellets])).toEqual([
      ['pistol', 'semi', 1],
      ['smg', 'auto', 1],
      ['shotgun', 'pump', 7],
      ['rifle', 'auto', 1],
    ]);
    const smg = WEAPONS.find((weapon) => weapon.id === 'smg')!;
    const rifle = WEAPONS.find((weapon) => weapon.id === 'rifle')!;
    const shotgun = WEAPONS.find((weapon) => weapon.id === 'shotgun')!;
    expect(smg.fireCooldownMs).toBeLessThan(rifle.fireCooldownMs);
    expect(shotgun.spreadRadius).toBeGreaterThan(rifle.spreadRadius);
    expect(shotgun.pelletDamageMultiplier).toBeLessThan(1);
  });

  it('keeps pistol legacy upgrade values intact', () => {
    expect(getWeaponStats('pistol', { damage: 2, magazine: 2, reload: 2 })).toMatchObject({
      damage: 2, magazine: 10, reloadSeconds: 1,
    });
  });
});
