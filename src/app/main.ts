import Phaser from 'phaser';
import { gameConfig } from './GameConfig';
import './style.css';

const game = new Phaser.Game(gameConfig);
const scenesPausedForPortrait = new Set<Phaser.Scene>();

function syncMobileOrientation(): void {
  const isPortraitMobile = document.documentElement.dataset.device === 'mobile'
    && window.matchMedia('(max-aspect-ratio: 1 / 1)').matches;

  if (isPortraitMobile) {
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.isActive()) {
        scenesPausedForPortrait.add(scene);
        scene.scene.pause();
      }
    }
    return;
  }

  game.scale.refresh();
  for (const scene of scenesPausedForPortrait) {
    scene.scene.resume();
  }
  scenesPausedForPortrait.clear();
}

game.events.once(Phaser.Core.Events.READY, syncMobileOrientation);
window.addEventListener('resize', syncMobileOrientation, { passive: true });
window.addEventListener('orientationchange', syncMobileOrientation, { passive: true });

window.addEventListener('beforeunload', () => game.destroy(true));
