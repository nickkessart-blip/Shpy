import { BALANCE } from '../game/data/balance';
import {
  DEFAULT_LOADOUT, normalizeLoadout, type LoadoutSelection, type WeaponId,
} from '../game/data/arsenal';

const STORAGE_KEY = 'shpy_save_v1';
const RECOVERY_KEY = 'shpy_save_recovery_backup';

export type UpgradeKind = 'damage' | 'magazine' | 'reload' | 'health' | 'armor' | 'precision';

export interface SaveData {
  schemaVersion: 3;
  reputation: number;
  upgrades: Record<UpgradeKind, number>;
  loadout: LoadoutSelection;
}

const DEFAULT_SAVE: SaveData = {
  schemaVersion: 3,
  reputation: 0,
  upgrades: { damage: 0, magazine: 0, reload: 0, health: 0, armor: 0, precision: 0 },
  loadout: structuredClone(DEFAULT_LOADOUT),
};

export class SaveService {
  private volatileSave: SaveData = structuredClone(DEFAULT_SAVE);
  private volatileSaveExists = false;
  private storageWarningShown = false;

  load(): SaveData {
    let raw: string | null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      this.warnStorageUnavailable();
      return structuredClone(this.volatileSave);
    }
    if (!raw) return structuredClone(this.volatileSave);

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        this.backupCorruptSave(raw);
        this.volatileSave = structuredClone(DEFAULT_SAVE);
        this.volatileSaveExists = false;
        return structuredClone(DEFAULT_SAVE);
      }

      const data = parsed as {
        schemaVersion?: unknown;
        reputation?: unknown;
        upgrades?: Partial<Record<UpgradeKind, unknown>>;
        loadout?: unknown;
      };
      if ((data.schemaVersion !== 1 && data.schemaVersion !== 2 && data.schemaVersion !== 3)
        || typeof data.reputation !== 'number' || !data.upgrades || typeof data.upgrades !== 'object') {
        this.backupCorruptSave(raw);
        this.volatileSave = structuredClone(DEFAULT_SAVE);
        this.volatileSaveExists = false;
        return structuredClone(DEFAULT_SAVE);
      }

      const reputation = Number.isFinite(data.reputation) ? Math.max(0, Math.floor(data.reputation)) : 0;
      const normalized: SaveData = {
        schemaVersion: 3,
        reputation,
        upgrades: {
          damage: clampLevel(data.upgrades.damage, BALANCE.upgradeUnlocks.damage.length - 1),
          magazine: clampLevel(data.upgrades.magazine, BALANCE.upgradeUnlocks.magazine.length - 1),
          reload: clampLevel(data.upgrades.reload, BALANCE.upgradeUnlocks.reload.length - 1),
          health: clampLevel(data.upgrades.health, BALANCE.upgradeUnlocks.health.length - 1),
          armor: clampLevel(data.upgrades.armor, BALANCE.upgradeUnlocks.armor.length - 1),
          precision: clampLevel(data.upgrades.precision, BALANCE.upgradeUnlocks.precision.length - 1),
        },
        loadout: normalizeLoadout(data.schemaVersion === 3 ? data.loadout : DEFAULT_LOADOUT, reputation),
      };

      this.volatileSave = structuredClone(normalized);
      this.volatileSaveExists = true;
      if (data.schemaVersion !== 3) this.save(normalized);
      return normalized;
    } catch {
      this.backupCorruptSave(raw);
      this.volatileSave = structuredClone(DEFAULT_SAVE);
      this.volatileSaveExists = false;
      return structuredClone(DEFAULT_SAVE);
    }
  }

  hasSave(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.volatileSaveExists;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        this.backupCorruptSave(raw);
        return false;
      }
      const data = parsed as { schemaVersion?: unknown; reputation?: unknown; upgrades?: unknown };
      const valid = (data.schemaVersion === 1 || data.schemaVersion === 2 || data.schemaVersion === 3)
        && typeof data.reputation === 'number'
        && Boolean(data.upgrades && typeof data.upgrades === 'object');
      if (!valid) this.backupCorruptSave(raw);
      return valid;
    } catch {
      this.warnStorageUnavailable();
      return this.volatileSaveExists;
    }
  }

  private backupCorruptSave(raw: string): void {
    try {
      localStorage.setItem(RECOVERY_KEY, raw);
      console.warn('[SHPY] Некорректное сохранение скопировано в резервный ключ:', RECOVERY_KEY);
    } catch {
      this.warnStorageUnavailable();
    }
  }

  private warnStorageUnavailable(): void {
    if (this.storageWarningShown) return;
    this.storageWarningShown = true;
    console.warn('[SHPY] Локальное хранилище недоступно. Прогресс будет храниться до закрытия игры.');
  }

  save(data: SaveData): void {
    const normalized = structuredClone(data);
    this.volatileSave = normalized;
    this.volatileSaveExists = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      this.warnStorageUnavailable();
    }
  }

  setLoadout(loadout: LoadoutSelection): SaveData {
    const data = this.load();
    data.loadout = normalizeLoadout(loadout, data.reputation);
    this.save(data);
    return data;
  }

  reset(): SaveData {
    const freshSave = structuredClone(DEFAULT_SAVE);
    this.save(freshSave);
    return freshSave;
  }

  addReputation(amount: number): SaveData {
    const data = this.load();
    const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
    data.reputation += safeAmount;
    this.save(data);
    return data;
  }

  unlockUpgrade(kind: UpgradeKind): SaveData | null {
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

function clampLevel(value: unknown, maxLevel: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(maxLevel, Math.floor(value)));
}

export const saveService = new SaveService();
