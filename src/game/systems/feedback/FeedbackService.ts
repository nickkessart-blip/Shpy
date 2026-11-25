import Phaser from 'phaser';
import { settingsService } from '../../../settings/SettingsService';

export type SoundEffect = 'shot' | 'hit' | 'reload' | 'grenade' | 'ui' | 'confirm';

const EFFECT_KEYS: Record<SoundEffect, string[]> = {
  shot: [
    'audio-audio/sfx/pistol-report-1',
    'audio-audio/sfx/pistol-report-2',
    'audio-audio/sfx/pistol-report-3',
  ],
  hit: ['audio-audio/sfx/impact'],
  reload: ['audio-audio/sfx/reload-mechanism'],
  grenade: ['audio-audio/sfx/explosion'],
  ui: ['audio-audio/sfx/ui-click'],
  confirm: ['audio-audio/sfx/ui-confirm'],
};

const MUSIC_KEY = 'audio-audio/music/agency-theme';

// Phaser's concrete WebAudioSound and HTML5AudioSound implementations expose setVolume();
// BaseSound's shared typings omit that backend-specific method in this Phaser release.
type AdjustableMusicSound = Phaser.Sound.BaseSound & { setVolume(volume: number): void };

export class FeedbackService {
  private static music?: AdjustableMusicSound;
  private static musicKey = '';

  static ensureMusic(scene: Phaser.Scene): void {
    const volume = settingsService.load().musicVolume;
    if (this.music && this.musicKey === MUSIC_KEY) {
      this.music.setVolume(volume);
      if (!this.music.isPlaying && volume > 0) this.music.play();
      return;
    }

    this.music?.stop();
    this.music?.destroy();
    if (!scene.cache.audio.exists(MUSIC_KEY)) return;

    const track = scene.sound.add(MUSIC_KEY, { loop: true, volume }) as AdjustableMusicSound;
    this.music = track;
    this.musicKey = MUSIC_KEY;
    const start = (): void => {
      const latestVolume = settingsService.load().musicVolume;
      track.setVolume(latestVolume);
      if (this.music === track && latestVolume > 0 && !track.isPlaying) track.play();
    };
    if (scene.sound.locked) scene.input.once('pointerdown', start);
    else start();
  }

  static applyMusicVolume(): void {
    this.music?.setVolume(settingsService.load().musicVolume);
  }

  static play(scene: Phaser.Scene, effect: SoundEffect, multiplier = 1): void {
    const settings = settingsService.load();
    if (settings.sfxVolume <= 0) return;
    const variants = EFFECT_KEYS[effect];
    const key = variants[Math.floor(Math.random() * variants.length)];
    if (!key || !scene.cache.audio.exists(key)) return;
    scene.sound.play(key, { volume: Math.max(0, Math.min(1, settings.sfxVolume * multiplier)) });

    if (effect === 'shot') {
      const tail = 'audio-audio/sfx/pistol-tail';
      if (scene.cache.audio.exists(tail)) {
        scene.sound.play(tail, { volume: Math.max(0, Math.min(0.3, settings.sfxVolume * 0.22 * multiplier)) });
      }
    }
  }
}

export type HapticAction = 'shot' | 'hit' | 'damage' | 'reload' | 'grenade' | 'medkit' | 'dodge' | 'success' | 'failure';

const HAPTIC_PATTERNS: Record<HapticAction, number | number[]> = {
  shot: 9,
  hit: 16,
  damage: [42, 24, 52],
  reload: [12, 28, 12],
  grenade: [24, 28, 68],
  medkit: [18, 20, 18],
  dodge: [14, 24, 24],
  success: [38, 36, 58],
  failure: [75, 35, 75],
};

export function triggerHaptic(action: HapticAction): boolean {
  if (!settingsService.load().vibrationEnabled || typeof navigator === 'undefined'
    || typeof navigator.vibrate !== 'function') return false;
  try {
    return navigator.vibrate(HAPTIC_PATTERNS[action]);
  } catch {
    return false;
  }
}
