import { BALANCE } from '../game/data/balance';

const STORAGE_KEY = 'shpy_save_v1';

export interface SaveData {
  schemaVersion: 1;
  reputation: number;
  upgrades: { damage: number; magazine: number; reload: number };
}

const DEFAULT_SAVE: SaveData = {
  schemaVersion: 1,
  reputation: 0,
  upgrades: { damage: 0, magazine: 0, reload: 0 },
};

export class SaveService {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return structuredClone(DEFAULT_SAVE);
      const data = parsed as Partial<SaveData>;
      if (data.schemaVersion !== 1 || typeof data.reputation !== 'number' || !data.upgrades) {
        return structuredClone(DEFAULT_SAVE);
      }
      return {
        schemaVersion: 1,
        reputation: Math.max(0, data.reputation),
        upgrades: {
          damage: clampLevel(data.upgrades.damage),
          magazine: clampLevel(data.upgrades.magazine),
          reload: clampLevel(data.upgrades.reload),
        },
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save(data: SaveData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  addReputation(amount: number): SaveData {
    const data = this.load();
    data.reputation += Math.max(0, Math.floor(amount));
    this.save(data);
    return data;
  }

  unlockUpgrade(kind: keyof SaveData['upgrades']): SaveData | null {
    const data = this.load();
    const current = data.upgrades[kind];
    const thresholds = BALANCE.upgradeUnlocks[kind];
    const next = current + 1;
    if (next >= thresholds.length || data.reputation < thresholds[next]) return null;
    data.upgrades[kind] = next;
    this.save(data);
    return data;
  }
}

function clampLevel(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(2, Math.floor(value)));
}

export const saveService = new SaveService();
