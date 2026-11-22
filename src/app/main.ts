import Phaser from 'phaser';
import { gameConfig } from './GameConfig';
import './style.css';

const statusElement = document.getElementById('boot-status');

function showStartupError(message: string): void {
  if (!statusElement) return;
  statusElement.hidden = false;
  statusElement.textContent = 'ОШИБКА ЗАПУСКА SHPY\n' + message;
}

window.addEventListener('error', (event) => {
  showStartupError(event.message || 'Неизвестная ошибка JavaScript');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  showStartupError(reason instanceof Error ? reason.message : String(reason));
});

let game: Phaser.Game;
try {
  if (statusElement) {
    statusElement.hidden = false;
    statusElement.textContent = 'JAVASCRIPT ЗАГРУЖЕН • ЗАПУСК PHASER…';
  }
  game = new Phaser.Game(gameConfig);
  game.events.once(Phaser.Core.Events.READY, () => {
    if (statusElement) statusElement.textContent = 'PHASER ЗАПУЩЕН • ЗАГРУЗКА РЕСУРСОВ…';
  });
} catch (error) {
  showStartupError(error instanceof Error ? error.message : String(error));
}

window.addEventListener('beforeunload', () => game?.destroy(true));
