import { afterEach, describe, expect, it } from 'vitest';
import { SaveService } from './SaveService';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

function useMemoryStorage(initial: Record<string, string> = {}): Map<string, string> {
  const values = new Map(Object.entries(initial));
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    },
  });
  return values;
}

describe('SaveService economy and migration', () => {
  it('keeps progress in memory when browser storage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('Storage access denied'); },
        setItem: () => { throw new Error('Storage access denied'); },
      },
    });
    const service = new SaveService();
    service.addProgress(25, 40);
    service.addProgress(10, 15);
    expect(service.load()).toMatchObject({ accountXp: 35, dollars: 55 });
    expect(service.hasSave()).toBe(true);
  });

  it('migrates schema v1 without losing XP or owned perks', () => {
    const values = useMemoryStorage({
      shpy_save_v1: JSON.stringify({
        schemaVersion: 1, reputation: 240,
        upgrades: { damage: 2, magazine: 1, reload: 2 },
      }),
    });
    const migrated = new SaveService().load();
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.accountXp).toBe(240);
    expect(migrated.dollars).toBe(240);
    expect(migrated.upgrades).toEqual({
      damage: 2, magazine: 1, reload: 2, health: 0, armor: 0, precision: 0,
    });
    expect(JSON.parse(values.get('shpy_save_v1') ?? '{}').schemaVersion).toBe(5);
  });

  it('migrates schema v2 and v3 without losing existing progression', () => {
    for (const schemaVersion of [2, 3]) {
      const values = useMemoryStorage({
        shpy_save_v1: JSON.stringify({
          schemaVersion, reputation: 1800,
          upgrades: { damage: 3, magazine: 2, reload: 2, health: 1, armor: 2, precision: 1 },
          loadout: { weapons: ['pistol', 'smg', 'rifle'], tacticalItem: 'grenade', activeItem: 'medkit' },
        }),
      });
      const migrated = new SaveService().load();
      expect(migrated.schemaVersion).toBe(5);
      expect(migrated.accountXp).toBe(1800);
      expect(migrated.dollars).toBe(1800);
      expect(migrated.loadout).toEqual({
        weapons: ['pistol', 'smg', 'rifle'], tacticalItem: 'grenade', activeItem: 'medkit',
      });
      expect(migrated.upgrades).toMatchObject({ damage: 3, health: 1, armor: 2, precision: 1 });
      expect(JSON.parse(values.get('shpy_save_v1') ?? '{}').schemaVersion).toBe(5);
    }
  });

  it('earns dollars and account XP independently', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addProgress(700, 525);
    expect(service.load()).toMatchObject({ accountXp: 700, dollars: 525 });
    service.addProgress(60, 35);
    expect(service.load()).toMatchObject({ accountXp: 760, dollars: 560 });
  });

  it('spends dollars when buying an upgrade and leaves account XP untouched', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addProgress(1200, 1000);
    const result = service.purchaseUpgrade('damage');
    expect(result.success).toBe(true);
    expect(result.data.accountXp).toBe(1200);
    expect(result.data.dollars).toBe(820);
    expect(result.data.upgrades.damage).toBe(1);
  });

  it('gates perk branches by account level and purchases by cash', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addProgress(0, 5000);
    expect(service.purchaseUpgrade('health').reason).toBe('level');
    service.reset();
    service.addProgress(850, 100);
    expect(service.purchaseUpgrade('damage').reason).toBe('funds');
    expect(service.load().upgrades.damage).toBe(0);
  });

  it('gates advanced levels of an already unlocked perk by account rank', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addProgress(0, 5000);
    expect(service.purchaseUpgrade('damage').success).toBe(true);
    expect(service.purchaseUpgrade('damage').reason).toBe('level');
    service.addProgress(700, 0);
    expect(service.purchaseUpgrade('damage').success).toBe(true);
  });

  it('saves and reloads the selected loadout using account rank unlocks', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addProgress(1800, 0);
    service.setLoadout({
      weapons: ['pistol', 'smg', 'rifle'], tacticalItem: 'grenade', activeItem: 'medkit',
    });
    expect(service.load().loadout).toEqual({
      weapons: ['pistol', 'smg', 'rifle'], tacticalItem: 'grenade', activeItem: 'medkit',
    });
  });

  it('starts a clean new game and clears all currencies, perks and item selection', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addProgress(1800, 3000);
    service.setLoadout({
      weapons: ['pistol', 'smg', 'rifle'], tacticalItem: 'grenade', activeItem: 'medkit',
    });
    const fresh = service.reset();
    expect(service.hasSave()).toBe(true);
    expect(fresh.accountXp).toBe(0);
    expect(fresh.dollars).toBe(0);
    expect(Object.values(fresh.upgrades).every((level) => level === 0)).toBe(true);
    expect(fresh.loadout).toEqual({ weapons: ['pistol'], tacticalItem: 'none', activeItem: 'none' });
  });

  it('backs up malformed saves instead of silently overwriting them', () => {
    const values = useMemoryStorage({
      shpy_save_v1: JSON.stringify({
        schemaVersion: 1, reputation: Number.NaN,
        upgrades: { damage: 0, magazine: 0, reload: 0 },
      }),
    });
    const service = new SaveService();
    const data = service.load();
    expect(data.accountXp).toBe(0);
    expect(data.schemaVersion).toBe(5);
    expect(values.get('shpy_save_recovery_backup')).toBeTruthy();
    expect(service.hasSave()).toBe(false);
  });

  it('migrates schema v4 and adds empty agency systems without losing progress', () => {
    const values = useMemoryStorage({
      shpy_save_v1: JSON.stringify({
        schemaVersion: 4,
        accountXp: 900,
        dollars: 410,
        upgrades: { damage: 1, magazine: 2, reload: 0, health: 1, armor: 0, precision: 0 },
        loadout: { weapons: ['pistol'], tacticalItem: 'none', activeItem: 'none' },
      }),
    });
    const migrated = new SaveService().load();
    expect(migrated).toMatchObject({
      schemaVersion: 5,
      accountXp: 900,
      dollars: 410,
      components: 0,
      agents: [],
      agentMissions: [],
      gearUpgrades: { grenadeCapacity: 0, medkitEfficiency: 0 },
      cosmetics: { heroSkinId: 'hero-standard', weaponSkinId: 'weapon-standard' },
    });
    expect(JSON.parse(values.get('shpy_save_v1') ?? '{}').schemaVersion).toBe(5);
  });

  it('spends agent components on modifications and cosmetics without touching main progress', () => {
    useMemoryStorage();
    const service = new SaveService();
    const initial = service.load();
    initial.accountXp = 700;
    initial.dollars = 900;
    initial.components = 120;
    service.save(initial);

    expect(service.purchaseGearUpgrade('grenadeCapacity').success).toBe(true);
    expect(service.purchaseCosmetic('hero-night').success).toBe(true);
    service.equipCosmetic('hero-night');

    const updated = service.load();
    expect(updated.components).toBe(50);
    expect(updated.gearUpgrades.grenadeCapacity).toBe(1);
    expect(updated.cosmetics.heroSkinId).toBe('hero-night');
    expect(updated.dollars).toBe(900);
    expect(updated.accountXp).toBe(700);
  });
});
