import { afterEach, describe, expect, it } from 'vitest';
import { SaveService } from './SaveService';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('SaveService storage fallback', () => {
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
  });

  it('ignores invalid reputation values instead of poisoning the save', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => JSON.stringify({
          schemaVersion: 1,
          reputation: Number.NaN,
          upgrades: { damage: 0, magazine: 0, reload: 0 },
        }),
        setItem: () => undefined,
      },
    });

    expect(new SaveService().load().reputation).toBe(0);
  });
});
