import { BALANCE } from '../game/data/balance';
import { AGENCY_RESEARCH, DEFAULT_AGENCY_RESEARCH, normalizeAgencyResearch, type AgencyResearchId } from '../game/data/agencyResearch';
import { getAccountLevel } from '../game/data/progression';
import {
  DEFAULT_LOADOUT, normalizeLoadout, type LoadoutSelection,
} from '../game/data/arsenal';
import {
  normalizeAgentMissionRuns, normalizeAgentRoster, type AgencyAgent, type AgentMissionRun,
} from '../game/data/agents';
import {
  COSMETICS, DEFAULT_COSMETICS, normalizeCosmetics, type CosmeticId, type CosmeticLoadout,
} from '../game/data/cosmetics';

const STORAGE_KEY = 'shpy_save_v1';
const RECOVERY_KEY = 'shpy_save_recovery_backup';

export type UpgradeKind = 'damage' | 'magazine' | 'reload' | 'health' | 'armor' | 'precision';
export type GearUpgradeKind = 'grenadeCapacity' | 'medkitEfficiency';

export interface SaveData {
  schemaVersion: 6;
  accountXp: number;
  dollars: number;
  upgrades: Record<UpgradeKind, number>;
  loadout: LoadoutSelection;
  agents: AgencyAgent[];
  agentMissions: AgentMissionRun[];
  components: number;
  gearUpgrades: Record<GearUpgradeKind, number>;
  cosmetics: CosmeticLoadout;
  agencyResearch: Record<AgencyResearchId, number>;
}

export const GEAR_UPGRADE_COSTS: Record<GearUpgradeKind, readonly number[]> = {
  grenadeCapacity: [0, 25, 55],
  medkitEfficiency: [0, 35, 70],
};

const DEFAULT_SAVE: SaveData = {
  schemaVersion: 6,
  accountXp: 0,
  dollars: 0,
  upgrades: { damage: 0, magazine: 0, reload: 0, health: 0, armor: 0, precision: 0 },
  loadout: structuredClone(DEFAULT_LOADOUT),
  agents: [],
  agentMissions: [],
  components: 0,
  gearUpgrades: { grenadeCapacity: 0, medkitEfficiency: 0 },
  cosmetics: structuredClone(DEFAULT_COSMETICS),
  agencyResearch: structuredClone(DEFAULT_AGENCY_RESEARCH),
};

export class SaveService {
  private volatileSave: SaveData = structuredClone(DEFAULT_SAVE);
  private volatileSaveExists = false;
  private storageWarningShown = false;

  load(): SaveData {
    let raw: string | null;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch { this.warnStorageUnavailable(); return structuredClone(this.volatileSave); }
    if (!raw) return structuredClone(this.volatileSave);

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return this.rejectCorruptSave(raw);
      const data = parsed as {
        schemaVersion?: unknown; reputation?: unknown; accountXp?: unknown; dollars?: unknown;
        upgrades?: Partial<Record<UpgradeKind, unknown>>; loadout?: unknown;
        agents?: unknown; agentMissions?: unknown; components?: unknown;
        gearUpgrades?: unknown; cosmetics?: unknown; agencyResearch?: unknown;
      };
      const version = data.schemaVersion;
      if (![1, 2, 3, 4, 5, 6].includes(version as number) || !data.upgrades || typeof data.upgrades !== 'object') {
        return this.rejectCorruptSave(raw);
      }
      const legacy = version !== 4 && version !== 5 && version !== 6;
      if (legacy && (typeof data.reputation !== 'number' || !Number.isFinite(data.reputation))) {
        return this.rejectCorruptSave(raw);
      }
      const accountXpRaw = legacy ? data.reputation : data.accountXp;
      if (typeof accountXpRaw !== 'number' || !Number.isFinite(accountXpRaw)) return this.rejectCorruptSave(raw);
      if (!legacy && (typeof data.dollars !== 'number' || !Number.isFinite(data.dollars))) {
        return this.rejectCorruptSave(raw);
      }

      const accountXp = Math.max(0, Math.floor(accountXpRaw));
      const dollars = legacy ? accountXp : Math.max(0, Math.floor(data.dollars as number));
      const agents = normalizeAgentRoster(data.agents);
      const rawGear = data.gearUpgrades && typeof data.gearUpgrades === 'object'
        ? data.gearUpgrades as Partial<Record<GearUpgradeKind, unknown>>
        : {};
      const normalized: SaveData = {
        schemaVersion: 6,
        accountXp,
        dollars,
        upgrades: {
          damage: clampLevel(data.upgrades.damage, BALANCE.upgradeCosts.damage.length - 1),
          magazine: clampLevel(data.upgrades.magazine, BALANCE.upgradeCosts.magazine.length - 1),
          reload: clampLevel(data.upgrades.reload, BALANCE.upgradeCosts.reload.length - 1),
          health: clampLevel(data.upgrades.health, BALANCE.upgradeCosts.health.length - 1),
          armor: clampLevel(data.upgrades.armor, BALANCE.upgradeCosts.armor.length - 1),
          precision: clampLevel(data.upgrades.precision, BALANCE.upgradeCosts.precision.length - 1),
        },
        loadout: normalizeLoadout(data.loadout ?? DEFAULT_LOADOUT, getAccountLevel(accountXp)),
        agents,
        agentMissions: normalizeAgentMissionRuns(data.agentMissions, agents),
        components: typeof data.components === 'number' ? safeAmount(data.components) : 0,
        gearUpgrades: {
          grenadeCapacity: clampLevel(rawGear.grenadeCapacity, GEAR_UPGRADE_COSTS.grenadeCapacity.length - 1),
          medkitEfficiency: clampLevel(rawGear.medkitEfficiency, GEAR_UPGRADE_COSTS.medkitEfficiency.length - 1),
        },
        cosmetics: normalizeCosmetics(data.cosmetics),
        agencyResearch: normalizeAgencyResearch(data.agencyResearch),
      };
      this.volatileSave = structuredClone(normalized);
      this.volatileSaveExists = true;
      if (version !== 6) this.save(normalized);
      return normalized;
    } catch { return this.rejectCorruptSave(raw); }
  }

  hasSave(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.volatileSaveExists;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') { this.backupCorruptSave(raw); return false; }
      const data = parsed as {
        schemaVersion?: unknown; reputation?: unknown; accountXp?: unknown; dollars?: unknown; upgrades?: unknown;
      };
      const legacy = data.schemaVersion === 1 || data.schemaVersion === 2 || data.schemaVersion === 3;
      const validVersion = legacy || data.schemaVersion === 4 || data.schemaVersion === 5 || data.schemaVersion === 6;
      const validXp = legacy ? typeof data.reputation === 'number' && Number.isFinite(data.reputation)
        : typeof data.accountXp === 'number' && Number.isFinite(data.accountXp);
      const validMoney = legacy || (typeof data.dollars === 'number' && Number.isFinite(data.dollars));
      const valid = validVersion && validXp && validMoney && Boolean(data.upgrades && typeof data.upgrades === 'object');
      if (!valid) this.backupCorruptSave(raw);
      return valid;
    } catch { this.warnStorageUnavailable(); return this.volatileSaveExists; }
  }

  private rejectCorruptSave(raw: string): SaveData {
    this.backupCorruptSave(raw);
    this.volatileSave = structuredClone(DEFAULT_SAVE);
    this.volatileSaveExists = false;
    return structuredClone(DEFAULT_SAVE);
  }

  private backupCorruptSave(raw: string): void {
    try { localStorage.setItem(RECOVERY_KEY, raw); }
    catch { this.warnStorageUnavailable(); }
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); }
    catch { this.warnStorageUnavailable(); }
  }

  setLoadout(loadout: LoadoutSelection): SaveData {
    const data = this.load();
    data.loadout = normalizeLoadout(loadout, getAccountLevel(data.accountXp));
    this.save(data);
    return data;
  }

  reset(): SaveData {
    const freshSave = structuredClone(DEFAULT_SAVE);
    this.save(freshSave);
    return freshSave;
  }

  addProgress(accountXpAmount: number, dollarAmount: number): SaveData {
    const data = this.load();
    data.accountXp += safeAmount(accountXpAmount);
    data.dollars += safeAmount(dollarAmount);
    data.loadout = normalizeLoadout(data.loadout, getAccountLevel(data.accountXp));
    this.save(data);
    return data;
  }

  purchaseUpgrade(kind: UpgradeKind): { success: boolean; reason: 'maxed' | 'level' | 'funds' | null; data: SaveData } {
    const data = this.load();
    const current = data.upgrades[kind];
    const costs = BALANCE.upgradeCosts[kind];
    const next = current + 1;
    if (next >= costs.length) return { success: false, reason: 'maxed', data };
    const requiredLevel = BALANCE.upgradeTierUnlockLevels[kind][next] ?? 1;
    if (getAccountLevel(data.accountXp) < requiredLevel) return { success: false, reason: 'level', data };
    const cost = costs[next] ?? Number.POSITIVE_INFINITY;
    if (data.dollars < cost) return { success: false, reason: 'funds', data };
    data.dollars -= cost;
    data.upgrades[kind] = next;
    this.save(data);
    return { success: true, reason: null, data };
  }

  purchaseGearUpgrade(kind: GearUpgradeKind): {
    success: boolean; reason: 'maxed' | 'components' | null; data: SaveData;
  } {
    const data = this.load();
    const next = data.gearUpgrades[kind] + 1;
    const costs = GEAR_UPGRADE_COSTS[kind];
    if (next >= costs.length) return { success: false, reason: 'maxed', data };
    const cost = costs[next] ?? 0;
    if (data.components < cost) return { success: false, reason: 'components', data };
    data.components -= cost;
    data.gearUpgrades[kind] = next;
    this.save(data);
    return { success: true, reason: null, data };
  }

  purchaseAgencyResearch(id: AgencyResearchId): {
    success: boolean; reason: 'maxed' | 'components' | 'locked' | null; data: SaveData;
  } {
    const data = this.load();
    if (getAccountLevel(data.accountXp) < 3) return { success: false, reason: 'locked', data };
    const definition = AGENCY_RESEARCH.find((entry) => entry.id === id);
    if (!definition) return { success: false, reason: 'maxed', data };
    const next = data.agencyResearch[id] + 1;
    if (next >= definition.costs.length) return { success: false, reason: 'maxed', data };
    const cost = definition.costs[next] ?? Number.POSITIVE_INFINITY;
    if (data.components < cost) return { success: false, reason: 'components', data };
    data.components -= cost;
    data.agencyResearch[id] = next;
    this.save(data);
    return { success: true, reason: null, data };
  }

  purchaseCosmetic(id: CosmeticId): {
    success: boolean; reason: 'unknown' | 'owned' | 'components' | null; data: SaveData;
  } {
    const data = this.load();
    const cosmetic = COSMETICS.find((item) => item.id === id);
    if (!cosmetic) return { success: false, reason: 'unknown', data };
    if (data.cosmetics.unlocked.includes(id)) return { success: false, reason: 'owned', data };
    if (data.components < cosmetic.componentCost) return { success: false, reason: 'components', data };
    data.components -= cosmetic.componentCost;
    data.cosmetics.unlocked.push(id);
    this.save(data);
    return { success: true, reason: null, data };
  }

  equipCosmetic(id: CosmeticId): SaveData {
    const data = this.load();
    if (!data.cosmetics.unlocked.includes(id)) return data;
    const cosmetic = COSMETICS.find((item) => item.id === id);
    if (!cosmetic) return data;
    if (cosmetic.category === 'hero') data.cosmetics.heroSkinId = id;
    else data.cosmetics.weaponSkinId = id;
    this.save(data);
    return data;
  }
}

function safeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function clampLevel(value: unknown, maxLevel: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(maxLevel, Math.floor(value)));
}

export const saveService = new SaveService();
