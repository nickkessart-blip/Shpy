import { BALANCE } from './balance';
import { ACCOUNT_UNLOCKS } from './progression';

export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rifle';
export type TacticalItemId = 'none' | 'grenade';
export type ActiveItemId = 'none' | 'medkit';

export interface LoadoutSelection {
  weapons: WeaponId[];
  tacticalItem: TacticalItemId;
  activeItem: ActiveItemId;
}

export type WeaponFireMode = 'semi' | 'auto' | 'pump';

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  role: string;
  description: string;
  unlockLevel: number;
  damageMultiplier: number;
  fireCooldownMs: number;
  baseMagazine: number;
  reserveAmmo: number;
  baseReloadSeconds: number;
  intermissionAmmo: number;
  fireMode: WeaponFireMode;
  spreadRadius: number;
  pellets: number;
  pelletDamageMultiplier: number;
  recoil: number;
}

export const WEAPONS: readonly WeaponDefinition[] = [
  {
    id: 'pistol', name: 'СЛУЖЕБНЫЙ ПИСТОЛЕТ', role: 'Сбалансированное оружие',
    description: 'Надёжный вариант для первой операции. Хорошая точность и умеренный темп.',
    unlockLevel: 1, damageMultiplier: 1, fireCooldownMs: 210, baseMagazine: 6,
    reserveAmmo: 120, baseReloadSeconds: 2, intermissionAmmo: 48,
    fireMode: 'semi', spreadRadius: 2, pellets: 1, pelletDamageMultiplier: 1, recoil: 16,
  },
  {
    id: 'smg', name: 'КОМПАКТНЫЙ ПП', role: 'Высокая скорострельность',
    description: 'Быстро выпускает очередь. Урон одного попадания ниже, зато промахи прощаются чаще.',
    unlockLevel: ACCOUNT_UNLOCKS.smg, damageMultiplier: 0.58, fireCooldownMs: 105, baseMagazine: 24,
    reserveAmmo: 180, baseReloadSeconds: 1.9, intermissionAmmo: 48,
    fireMode: 'auto', spreadRadius: 16, pellets: 1, pelletDamageMultiplier: 1, recoil: 28,
  },
  {
    id: 'shotgun', name: 'ТАКТИЧЕСКИЙ ДРОБОВИК', role: 'Мощный одиночный выстрел',
    description: 'Медленный темп и небольшой магазин. Подходит для опасных целей.',
    unlockLevel: ACCOUNT_UNLOCKS.shotgun, damageMultiplier: 2, fireCooldownMs: 680, baseMagazine: 5,
    reserveAmmo: 45, baseReloadSeconds: 2.8, intermissionAmmo: 15,
    fireMode: 'pump', spreadRadius: 40, pellets: 7, pelletDamageMultiplier: 0.18, recoil: 48,
  },
  {
    id: 'rifle', name: 'ШТУРМОВАЯ ВИНТОВКА', role: 'Универсальное оружие',
    description: 'Больше магазин и стабильный урон. Хороший выбор для длинных волн.',
    unlockLevel: ACCOUNT_UNLOCKS.rifle, damageMultiplier: 1.22, fireCooldownMs: 165, baseMagazine: 24,
    reserveAmmo: 144, baseReloadSeconds: 2.2, intermissionAmmo: 36,
    fireMode: 'auto', spreadRadius: 5, pellets: 1, pelletDamageMultiplier: 1, recoil: 22,
  },
] as const;

export const LOADOUT_UNLOCKS = {
  weaponSlots: [
    { slots: 1, accountLevel: 1 },
    { slots: 2, accountLevel: ACCOUNT_UNLOCKS['weapon-slot-2'] },
    { slots: 3, accountLevel: ACCOUNT_UNLOCKS['weapon-slot-3'] },
  ],
  grenadeLevel: ACCOUNT_UNLOCKS.grenade,
  medkitLevel: ACCOUNT_UNLOCKS.medkit,
  grenadesPerMission: 2,
  medkitsPerMission: 1,
  grenadeDamage: 5.5,
  grenadeRadius: 245,
  medkitHealRatio: 0.4,
} as const;

export const DEFAULT_LOADOUT: LoadoutSelection = {
  weapons: ['pistol'],
  tacticalItem: 'none',
  activeItem: 'none',
};

export interface WeaponUpgradeLevels {
  damage: number;
  magazine: number;
  reload: number;
}

export interface WeaponStats {
  damage: number;
  magazine: number;
  reserveAmmo: number;
  reloadSeconds: number;
  shotCooldownMs: number;
  intermissionAmmo: number;
}

export function getWeapon(id: WeaponId): WeaponDefinition {
  return WEAPONS.find((weapon) => weapon.id === id) ?? WEAPONS[0];
}

export function getWeaponSlotLimit(accountLevel: number): number {
  let slots = 1;
  for (const unlock of LOADOUT_UNLOCKS.weaponSlots) {
    if (accountLevel >= unlock.accountLevel) slots = unlock.slots;
  }
  return slots;
}

export function getNextWeaponSlotUnlock(accountLevel: number): { slots: number; accountLevel: number } | null {
  return LOADOUT_UNLOCKS.weaponSlots.find((unlock) => unlock.accountLevel > accountLevel) ?? null;
}

export function isWeaponUnlocked(id: WeaponId, accountLevel: number): boolean {
  return getWeapon(id).unlockLevel <= accountLevel;
}

export function normalizeLoadout(value: unknown, accountLevel: number): LoadoutSelection {
  const raw = value && typeof value === 'object'
    ? value as { weapons?: unknown; tacticalItem?: unknown; activeItem?: unknown }
    : {};
  const selected: WeaponId[] = [];
  if (Array.isArray(raw.weapons)) {
    for (const item of raw.weapons) {
      if (typeof item !== 'string' || !WEAPONS.some((weapon) => weapon.id === item)) continue;
      const id = item as WeaponId;
      if (!isWeaponUnlocked(id, accountLevel) || selected.includes(id)) continue;
      selected.push(id);
    }
  }
  const weapons = selected.slice(0, getWeaponSlotLimit(accountLevel));
  if (weapons.length === 0) weapons.push('pistol');

  return {
    weapons,
    tacticalItem: raw.tacticalItem === 'grenade' && accountLevel >= LOADOUT_UNLOCKS.grenadeLevel ? 'grenade' : 'none',
    activeItem: raw.activeItem === 'medkit' && accountLevel >= LOADOUT_UNLOCKS.medkitLevel ? 'medkit' : 'none',
  };
}

export function getWeaponStats(id: WeaponId, upgrades: WeaponUpgradeLevels): WeaponStats {
  const weapon = getWeapon(id);
  const damageLevel = clamp(upgrades.damage, BALANCE.weapon.damage.length - 1);
  const magazineLevel = clamp(upgrades.magazine, BALANCE.weapon.magazine.length - 1);
  const reloadLevel = clamp(upgrades.reload, BALANCE.weapon.reloadSeconds.length - 1);
  const magazine = id === 'pistol'
    ? BALANCE.weapon.magazine[magazineLevel]
    : Math.max(1, Math.round(weapon.baseMagazine * (1 + magazineLevel * 0.08)));
  const reloadSeconds = id === 'pistol'
    ? BALANCE.weapon.reloadSeconds[reloadLevel]
    : Math.max(0.55, weapon.baseReloadSeconds
      * (BALANCE.weapon.reloadSeconds[reloadLevel] / BALANCE.weapon.reloadSeconds[0]));

  return {
    damage: BALANCE.weapon.damage[damageLevel] * weapon.damageMultiplier,
    magazine,
    reserveAmmo: weapon.reserveAmmo,
    reloadSeconds,
    shotCooldownMs: weapon.fireCooldownMs,
    intermissionAmmo: weapon.intermissionAmmo,
  };
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.floor(value)));
}
