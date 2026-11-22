export const BALANCE = {
  player: {
    maxHp: [120, 135, 150, 170, 190],
    damageReduction: [0, 0.06, 0.13, 0.21, 0.30],
  },
  weapon: {
    name: 'Служебный пистолет',
    damage: [1, 1.5, 2, 2.1, 2.2],
    magazine: [6, 8, 10, 12, 15],
    reserveAmmo: 120,
    reloadSeconds: [2, 1.5, 1, 0.85, 0.7],
    headMultiplier: [2, 2.05, 2.1, 2.15, 2.2],
    shotCooldownMs: 210,
  },
  supplies: { intermissionAmmo: 48, intermissionHealing: 30 },
  rewards: {
    xp: { kill: 12, boss: 180, wave: 60, mission: 250 },
    dollars: { kill: 35, boss: 450, wave: 150, mission: 700 },
  },
  upgradeCosts: {
    damage: [0, 180, 400, 750, 1200],
    magazine: [0, 130, 300, 600, 1000],
    reload: [0, 160, 350, 700, 1100],
    health: [0, 130, 300, 650, 1050],
    armor: [0, 250, 500, 900, 1400],
    precision: [0, 200, 450, 850, 1300],
  },
  upgradeTierUnlockLevels: {
    damage: [0, 1, 3, 5, 8],
    magazine: [0, 1, 3, 5, 8],
    reload: [0, 1, 3, 5, 8],
    health: [0, 3, 5, 7, 10],
    armor: [0, 4, 6, 8, 11],
    precision: [0, 5, 7, 9, 12],
  },
} as const;
