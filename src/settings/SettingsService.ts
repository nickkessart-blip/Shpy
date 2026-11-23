export type GraphicsQuality = 'low' | 'balanced' | 'high';
export type MobileControlMode = 'swipe' | 'stick';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  musicVolume: number;
  sfxVolume: number;
  mobileControlMode: MobileControlMode;
  aimSensitivity: number;
  vibrationEnabled: boolean;
  parallaxEnabled: boolean;
  screenShakeEnabled: boolean;
}

export const SETTINGS_STORAGE_KEY = 'shpy_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'balanced',
  musicVolume: 0.24,
  sfxVolume: 0.7,
  mobileControlMode: 'swipe',
  aimSensitivity: 1.8,
  vibrationEnabled: true,
  parallaxEnabled: true,
  screenShakeEnabled: true,
};

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function normalizeSettings(value: unknown): GameSettings {
  const raw = value && typeof value === 'object' ? value as Partial<GameSettings> : {};
  const graphicsQuality: GraphicsQuality = raw.graphicsQuality === 'low' || raw.graphicsQuality === 'high'
    ? raw.graphicsQuality : 'balanced';
  const mobileControlMode: MobileControlMode = raw.mobileControlMode === 'stick' ? 'stick' : 'swipe';
  return {
    graphicsQuality,
    musicVolume: clamp(raw.musicVolume, 0, 1, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: clamp(raw.sfxVolume, 0, 1, DEFAULT_SETTINGS.sfxVolume),
    mobileControlMode,
    aimSensitivity: clamp(raw.aimSensitivity, 0.5, 4, DEFAULT_SETTINGS.aimSensitivity),
    vibrationEnabled: typeof raw.vibrationEnabled === 'boolean'
      ? raw.vibrationEnabled : DEFAULT_SETTINGS.vibrationEnabled,
    parallaxEnabled: typeof raw.parallaxEnabled === 'boolean'
      ? raw.parallaxEnabled : DEFAULT_SETTINGS.parallaxEnabled,
    screenShakeEnabled: typeof raw.screenShakeEnabled === 'boolean'
      ? raw.screenShakeEnabled : DEFAULT_SETTINGS.screenShakeEnabled,
  };
}

export class SettingsService {
  private volatileSettings: GameSettings = { ...DEFAULT_SETTINGS };

  load(): GameSettings {
    try {
      if (typeof localStorage === 'undefined') return { ...this.volatileSettings };
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...this.volatileSettings };
      const normalized = normalizeSettings(JSON.parse(raw) as unknown);
      this.volatileSettings = normalized;
      return { ...normalized };
    } catch {
      return { ...this.volatileSettings };
    }
  }

  update(patch: Partial<GameSettings>): GameSettings {
    const next = normalizeSettings({ ...this.load(), ...patch });
    this.volatileSettings = next;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep the session settings in memory when browser storage is unavailable.
    }
    return { ...next };
  }

  reset(): GameSettings {
    this.volatileSettings = { ...DEFAULT_SETTINGS };
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // Defaults remain available in memory.
    }
    return { ...this.volatileSettings };
  }
}

export const settingsService = new SettingsService();
