import { describe, expect, it } from 'vitest';
import {
  getWeaponSlotLimit, getNextWeaponSlotUnlock, getWeaponStats, normalizeLoadout, WEAPONS,
} from './arsenal';

describe('arsenal progression', () => {
  it('unlocks one, two and three weapon slots at reputation milestones', () => {
    expect(getWeaponSlotLimit(0)).toBe(1);
    expect(getWeaponSlotLimit(349)).toBe(1);
    expect(getWeaponSlotLimit(350)).toBe(2);
    expect(getWeaponSlotLimit(1199)).toBe(2);
    expect(getWeaponSlotLimit(1200)).toBe(3);
    expect(getNextWeaponSlotUnlock(0)).toEqual({ slots: 2, reputation: 350 });
    expect(getNextWeaponSlotUnlock(1200)).toBeNull();
  });

  it('keeps a fresh agent on the pistol and filters locked or duplicate weapons', () => {
    expect(normalizeLoadout({ weapons: ['rifle', 'pistol', 'pistol'] }, 0).weapons).toEqual(['pistol']);
    expect(normalizeLoadout({ weapons: ['smg', 'pistol'] }, 350).weapons).toEqual(['smg', 'pistol']);
    expect(normalizeLoadout({ weapons: [] }, 0).weapons).toEqual(['pistol']);
  });

  it('does not keep utilities before their unlock milestones', () => {
    expect(normalizeLoadout({ weapons: ['pistol'], tacticalItem: 'grenade', activeItem: 'medkit' }, 0))
      .toEqual({ weapons: ['pistol'], tacticalItem: 'none', activeItem: 'none' });
    expect(normalizeLoadout({ weapons: ['pistol'], tacticalItem: 'grenade', activeItem: 'medkit' }, 1800))
      .toEqual({ weapons: ['pistol'], tacticalItem: 'grenade', activeItem: 'medkit' });
  });

  it('keeps all weapons below a normal guard one-shot body threshold at max damage upgrade', () => {
    for (const weapon of WEAPONS) {
      expect(getWeaponStats(weapon.id, { damage: 4, magazine: 4, reload: 4 }).damage).toBeLessThan(5);
    }
  });

  it('keeps pistol legacy upgrade values intact', () => {
    expect(getWeaponStats('pistol', { damage: 2, magazine: 2, reload: 2 })).toMatchObject({
      damage: 2, magazine: 10, reloadSeconds: 1,
    });
  });
});
