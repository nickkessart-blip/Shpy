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
  rewards: { kill: 12, boss: 180, wave: 60, mission: 250 },
  upgradeUnlocks: {
    damage: [0, 120, 350, 750, 1250],
    magazine: [0, 90, 260, 600, 1050],
    reload: [0, 100, 300, 650, 1100],
    health: [0, 60, 180, 420, 800],
    armor: [0, 180, 480, 950, 1550],
    precision: [0, 150, 400, 800, 1300],
  },
} as const;
