import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { HQScene } from '../game/scenes/HQScene';
import { MissionScene } from '../game/scenes/MissionScene';
import { ResultsScene } from '../game/scenes/ResultsScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export function hasTouchInput(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    || window.matchMedia('(any-pointer: coarse)').matches;
  return 'ontouchstart' in window
    || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    || coarsePointer;
}

const isTouchDevice = hasTouchInput();

if (typeof document !== 'undefined') {
  document.documentElement.dataset.device = isTouchDevice ? 'mobile' : 'desktop';
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#111821',
  antialias: false,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: { activePointers: 3, mouse: { preventDefaultWheel: true }, touch: { capture: true } },
  scene: [BootScene, HQScene, MissionScene, ResultsScene],
  render: { powerPreference: 'low-power', roundPixels: true },
};
