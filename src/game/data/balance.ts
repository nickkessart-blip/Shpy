export const BALANCE = {
  player: { maxHp: 100 },
  weapon: {
    name: 'Служебный пистолет',
    damage: [1, 2, 3],
    magazine: [6, 8, 10],
    reloadSeconds: [2, 1.5, 1],
    headMultiplier: 2,
    shotCooldownMs: 180,
  },
  rewards: { kill: 10, wave: 50, mission: 200 },
  upgradeUnlocks: {
    damage: [0, 30, 80],
    magazine: [0, 40, 100],
    reload: [0, 50, 120],
  },
} as const;
