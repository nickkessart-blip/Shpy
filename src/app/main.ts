import Phaser from 'phaser';
import { gameConfig } from './GameConfig';
import './style.css';

const game = new Phaser.Game(gameConfig);

function syncMobileOrientation(): void {
  // Let Android Chrome finish changing its visual viewport before Phaser
  // recalculates the FIT canvas bounds. Do not pause/resume Scene instances:
  // doing so during orientationchange can leave the active scene black.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      game.scale.refresh();
    });
  });
}

window.addEventListener('resize', syncMobileOrientation, { passive: true });
window.addEventListener('orientationchange', syncMobileOrientation, { passive: true });
window.addEventListener('pageshow', syncMobileOrientation, { passive: true });

game.events.once(Phaser.Core.Events.READY, syncMobileOrientation);

window.addEventListener('beforeunload', () => game.destroy(true));
