import Phaser from 'phaser';
import { gameConfig } from './GameConfig';
import './style.css';

const game = new Phaser.Game(gameConfig);

function syncMobileOrientation(): void {
  const isPortraitMobile = document.documentElement.dataset.device === 'mobile'
    && window.matchMedia('(max-aspect-ratio: 1 / 1)').matches;

  game.scale.refresh();

  // Do not let the mission timer or enemies continue while the portrait
  // overlay is covering the game. Resume the same scene after rotation.
  for (const scene of game.scene.getScenes()) {
    if (isPortraitMobile && scene.scene.isActive()) {
      scene.scene.pause();
    } else if (!isPortraitMobile && scene.scene.isPaused()) {
      scene.scene.resume();
    }
  }
}

game.events.once(Phaser.Core.Events.READY, syncMobileOrientation);
window.addEventListener('resize', syncMobileOrientation, { passive: true });
window.addEventListener('orientationchange', syncMobileOrientation, { passive: true });

window.addEventListener('beforeunload', () => game.destroy(true));
