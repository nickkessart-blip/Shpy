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

describe('SaveService storage and migration', () => {
  it('keeps progress in memory when browser storage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('Storage access denied'); },
        setItem: () => { throw new Error('Storage access denied'); },
      },
    });
    const service = new SaveService();
    service.addReputation(25);
    service.addReputation(10);
    expect(service.load().reputation).toBe(35);
    expect(service.hasSave()).toBe(true);
  });

  it('migrates schema v1 without losing reputation or existing upgrades', () => {
    const values = useMemoryStorage({
      shpy_save_v1: JSON.stringify({
        schemaVersion: 1, reputation: 240,
        upgrades: { damage: 2, magazine: 1, reload: 2 },
      }),
    });
    const service = new SaveService();
    const migrated = service.load();
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.reputation).toBe(240);
    expect(migrated.upgrades).toEqual({
      damage: 2, magazine: 1, reload: 2, health: 0, armor: 0, precision: 0,
    });
    expect(JSON.parse(values.get('shpy_save_v1') ?? '{}').schemaVersion).toBe(2);
  });

  it('starts a clean new game and clears every perk', () => {
    useMemoryStorage();
    const service = new SaveService();
    service.addReputation(500);
    service.unlockUpgrade('damage');
    const fresh = service.reset();
    expect(service.hasSave()).toBe(true);
    expect(fresh.reputation).toBe(0);
    expect(Object.values(fresh.upgrades).every((level) => level === 0)).toBe(true);
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
    expect(data.reputation).toBe(0);
    expect(data.schemaVersion).toBe(2);
    expect(values.get('shpy_save_recovery_backup')).toBeTruthy();
    expect(service.hasSave()).toBe(false);
  });
});
