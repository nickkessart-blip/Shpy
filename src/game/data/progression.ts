export const ACCOUNT_LEVELS = [
  { level: 1, xp: 0, title: 'СТАЖЁР' },
  { level: 2, xp: 350, title: 'МЛАДШИЙ АГЕНТ' },
  { level: 3, xp: 700, title: 'ПОЛЕВОЙ АГЕНТ' },
  { level: 4, xp: 850, title: 'ОПЕРАТИВНИК' },
  { level: 5, xp: 1200, title: 'СТАРШИЙ ОПЕРАТИВНИК' },
  { level: 6, xp: 1400, title: 'ВЕТЕРАН' },
  { level: 7, xp: 1800, title: 'ЭЛИТНЫЙ АГЕНТ' },
  { level: 8, xp: 2400, title: 'РУКОВОДИТЕЛЬ ГРУППЫ' },
  { level: 9, xp: 3200, title: 'НАЧАЛЬНИК ОТДЕЛА' },
  { level: 10, xp: 4200, title: 'ЗАМЕСТИТЕЛЬ ДИРЕКТОРА' },
  { level: 11, xp: 5400, title: 'ДИРЕКТОР' },
  { level: 12, xp: 6800, title: 'СТАРШИЙ ДИРЕКТОР' },
  { level: 13, xp: 8400, title: 'РУКОВОДИТЕЛЬ АГЕНТСТВА' },
  { level: 14, xp: 10200, title: 'ЗАМЕСТИТЕЛЬ БОССА' },
  { level: 15, xp: 12200, title: 'БОСС АГЕНТСТВА' },
] as const;

export type AccountUnlockId =
  | 'weapon-slot-2' | 'smg' | 'grenade' | 'shotgun' | 'weapon-slot-3'
  | 'rifle' | 'medkit' | 'survival-perks' | 'precision-perks';

export const ACCOUNT_UNLOCKS: Record<AccountUnlockId, number> = {
  'weapon-slot-2': 2,
  smg: 2,
  grenade: 3,
  shotgun: 4,
  'weapon-slot-3': 5,
  rifle: 6,
  medkit: 7,
  'survival-perks': 3,
  'precision-perks': 5,
};

export function getAccountLevel(accountXp: number): number {
  let level = 1;
  for (const rank of ACCOUNT_LEVELS) {
    if (accountXp >= rank.xp) level = rank.level;
    else break;
  }
  return level;
}

export function getAccountRank(accountXp: number): (typeof ACCOUNT_LEVELS)[number] {
  return ACCOUNT_LEVELS[getAccountLevel(accountXp) - 1] ?? ACCOUNT_LEVELS[0];
}

export function getNextAccountRank(accountXp: number): (typeof ACCOUNT_LEVELS)[number] | null {
  return ACCOUNT_LEVELS.find((rank) => rank.xp > accountXp) ?? null;
}

export function getAccountProgress(accountXp: number): { current: number; next: number; progress: number } {
  const level = getAccountLevel(accountXp);
  const currentRank = ACCOUNT_LEVELS[level - 1] ?? ACCOUNT_LEVELS[0];
  const nextRank = getNextAccountRank(accountXp);
  if (!nextRank) return { current: accountXp, next: currentRank.xp, progress: 1 };
  const span = nextRank.xp - currentRank.xp;
  return {
    current: accountXp - currentRank.xp,
    next: span,
    progress: Math.max(0, Math.min(1, (accountXp - currentRank.xp) / span)),
  };
}

export function isAccountUnlockAvailable(id: AccountUnlockId, accountXp: number): boolean {
  return getAccountLevel(accountXp) >= ACCOUNT_UNLOCKS[id];
}
