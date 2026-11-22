import Phaser from 'phaser';
import { AssetCatalog } from '../assets/AssetCatalog';

export class BootScene extends Phaser.Scene {
  private failedAssets: string[] = [];

  constructor() { super('Boot'); }

  preload(): void {
    this.failedAssets = [];
    const status = document.getElementById('boot-status');
    const bar = this.add.graphics().setDepth(100);
    const label = this.add.text(640, 325, 'ЗАГРУЗКА РЕСУРСОВ SHPY', {
      fontSize: '24px',
      color: '#f4e1bf',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(101);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x263747, 1);
      bar.fillRoundedRect(390, 365, 500, 18, 8);
      bar.fillStyle(0xc38e52, 1);
      bar.fillRoundedRect(390, 365, 500 * value, 18, 8);
      const percent = Math.round(value * 100);
      label.setText('ЗАГРУЗКА РЕСУРСОВ SHPY • ' + percent + '%');
      if (status) {
        status.hidden = false;
        status.textContent = 'ЗАГРУЗКА РЕСУРСОВ: ' + percent + '%';
      }
    });

    this.load.on('fileerror', (file: { key?: string; src?: string }) => {
      const name = file.key || file.src || 'неизвестный ресурс';
      this.failedAssets.push(name);
      if (status) {
        status.hidden = false;
        status.textContent = 'ОШИБКА ЗАГРУЗКИ РЕСУРСА: ' + name;
      }
    });

    this.load.once('complete', () => {
      if (status) {
        status.hidden = false;
        status.textContent = this.failedAssets.length > 0
          ? 'ЗАГРУЗКА ЗАВЕРШЕНА • ОШИБОК: ' + this.failedAssets.length
          : 'РЕСУРСЫ ЗАГРУЖЕНЫ • ЗАПУСК ИГРЫ…';
      }
    });

    AssetCatalog.preload(this);
  }

  create(): void {
    const status = document.getElementById('boot-status');
    if (status && this.failedAssets.length === 0) status.hidden = true;
    if (status && this.failedAssets.length > 0) {
      status.textContent = 'ИГРА ЗАПУЩЕНА, НО НЕ ЗАГРУЗИЛОСЬ РЕСУРСОВ: '
        + this.failedAssets.join(', ');
      this.time.delayedCall(7000, () => { status.hidden = true; });
    }
    this.scene.start('Start');
  }
}
