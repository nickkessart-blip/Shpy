import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, migrateLegacySettings, normalizeSettings, SettingsService, SETTINGS_STORAGE_KEY } from './SettingsService';

describe('game settings', () => {
  it('provides safe defaults for missing or malformed data', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ musicVolume: 'loud', mobileControlMode: 'unknown' })).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps volumes and sensitivity into supported ranges', () => {
    const result = normalizeSettings({
      musicVolume: 3,
      sfxVolume: -1,
      aimSensitivity: 99,
    });
    expect(result.musicVolume).toBe(1);
    expect(result.sfxVolume).toBe(0);
    expect(result.aimSensitivity).toBe(4);
  });

  it('defaults new profiles to the left aim stick', () => {
    expect(DEFAULT_SETTINGS.mobileControlMode).toBe('stick');
    expect(normalizeSettings(null).mobileControlMode).toBe('stick');
    expect(normalizeSettings({ mobileControlMode: 'tap' }).mobileControlMode).toBe('tap');
  });

  it('migrates v1 settings to the stick-first scheme while preserving other preferences', () => {
    const migrated = migrateLegacySettings({
      mobileControlMode: 'tap', aimSensitivity: 2.7, musicVolume: 0.4, graphicsQuality: 'low',
    });
    expect(migrated.mobileControlMode).toBe('stick');
    expect(migrated.aimSensitivity).toBe(2.7);
    expect(migrated.musicVolume).toBe(0.4);
    expect(migrated.graphicsQuality).toBe('low');
  });

  it('preserves supported mobile control and graphics choices', () => {
    const result = normalizeSettings({
      mobileControlMode: 'tap',
      graphicsQuality: 'high',
      vibrationEnabled: false,
      parallaxEnabled: false,
    });
    expect(result.mobileControlMode).toBe('tap');
    expect(result.graphicsQuality).toBe('high');
    expect(result.vibrationEnabled).toBe(false);
    expect(result.parallaxEnabled).toBe(false);
  });
});


  it('reset clears both current and legacy persisted settings', () => {
    const values = new Map<string, string>([
      ['shpy_settings_v1', JSON.stringify({ musicVolume: 0.9 })],
      [SETTINGS_STORAGE_KEY, JSON.stringify({ musicVolume: 0.3 })],
    ]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    try {
      new SettingsService().reset();
      expect(values.has('shpy_settings_v1')).toBe(false);
      expect(values.has(SETTINGS_STORAGE_KEY)).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
