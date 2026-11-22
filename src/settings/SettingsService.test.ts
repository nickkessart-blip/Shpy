import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from './SettingsService';

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
    expect(result.aimSensitivity).toBe(2.5);
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
