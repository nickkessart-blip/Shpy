import { BALANCE } from './balance';

export type WeaponId = 'pistol' | 'smg' | 'shotgun' | 'rifle';
export type TacticalItemId = 'none' | 'grenade';
export type ActiveItemId = 'none' | 'medkit';

export interface LoadoutSelection {
  weapons: WeaponId[];
  tacticalItem: TacticalItemId;
  activeItem: ActiveItemId;
}

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  role: string;
  description: string;
  unlockAt: number;
  damageMultiplier: number;
  fireCooldownMs: number;
  baseMagazine: number;
  reserveAmmo: number;
  baseReloadSeconds: number;
  intermissionAmmo: number;
}

export const WEAPONS: readonly WeaponDefinition[] = [
  {
    id: 'pistol', name: 'СЛУЖЕБНЫЙ ПИСТОЛЕТ', role: 'Сбалансированное оружие',
    description: 'Надёжный вариант для первой операции. Хорошая точность и умеренный темп.',
    unlockAt: 0, damageMultiplier: 1, fireCooldownMs: 210, baseMagazine: 6,
    reserveAmmo: 120, baseReloadSeconds: 2, intermissionAmmo: 48,
  },
  {
    id: 'smg', name: 'КОМПАКТНЫЙ ПП', role: 'Высокая скорострельность',
    description: 'Быстро выпускает очередь. Урон одного попадания ниже, зато промахи прощаются чаще.',
    unlockAt: 350, damageMultiplier: 0.58, fireCooldownMs: 105, baseMagazine: 24,
    reserveAmmo: 180, baseReloadSeconds: 1.9, intermissionAmmo: 48,
  },
  {
    id: 'shotgun', name: 'ТАКТИЧЕСКИЙ ДРОБОВИК', role: 'Мощный одиночный выстрел',
    description: 'Медленный темп и небольшой магазин. Подходит для опасных целей.',
    unlockAt: 850, damageMultiplier: 2, fireCooldownMs: 680, baseMagazine: 5,
    reserveAmmo: 45, baseReloadSeconds: 2.8, intermissionAmmo: 15,
  },
  {
    id: 'rifle', name: 'ШТУРМОВАЯ ВИНТОВКА', role: 'Универсальное оружие',
    description: 'Больше магазин и стабильный урон. Хороший выбор для длинных волн.',
    unlockAt: 1400, damageMultiplier: 1.22, fireCooldownMs: 165, baseMagazine: 24,
    reserveAmmo: 144, baseReloadSeconds: 2.2, intermissionAmmo: 36,
  },
] as const;

export const LOADOUT_UNLOCKS = {
  weaponSlots: [
    { slots: 1, reputation: 0 },
    { slots: 2, reputation: 350 },
    { slots: 3, reputation: 1200 },
  ],
  grenade: 700,
  medkit: 1800,
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

export function getWeaponSlotLimit(reputation: number): number {
  let slots = 1;
  for (const unlock of LOADOUT_UNLOCKS.weaponSlots) {
    if (reputation >= unlock.reputation) slots = unlock.slots;
  }
  return slots;
}

export function getNextWeaponSlotUnlock(reputation: number): { slots: number; reputation: number } | null {
  return LOADOUT_UNLOCKS.weaponSlots.find((unlock) => unlock.reputation > reputation) ?? null;
}

export function isWeaponUnlocked(id: WeaponId, reputation: number): boolean {
  return getWeapon(id).unlockAt <= reputation;
}

export function normalizeLoadout(value: unknown, reputation: number): LoadoutSelection {
  const raw = value && typeof value === 'object'
    ? value as { weapons?: unknown; tacticalItem?: unknown; activeItem?: unknown }
    : {};
  const selected: WeaponId[] = [];
  if (Array.isArray(raw.weapons)) {
    for (const item of raw.weapons) {
      if (typeof item !== 'string' || !WEAPONS.some((weapon) => weapon.id === item)) continue;
      const id = item as WeaponId;
      if (!isWeaponUnlocked(id, reputation) || selected.includes(id)) continue;
      selected.push(id);
    }
  }
  const weapons = selected.slice(0, getWeaponSlotLimit(reputation));
  if (weapons.length === 0) weapons.push('pistol');

  return {
    weapons,
    tacticalItem: raw.tacticalItem === 'grenade' && reputation >= LOADOUT_UNLOCKS.grenade ? 'grenade' : 'none',
    activeItem: raw.activeItem === 'medkit' && reputation >= LOADOUT_UNLOCKS.medkit ? 'medkit' : 'none',
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
