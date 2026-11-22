import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { saveService } from '../../persistence/SaveService';
import { runSession } from '../systems/missions/runSession';

export class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1119, 0x131d28, 0x202c39, 0x0b1017, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x506174, 0.18);
    for (let x = 0; x < GAME_WIDTH; x += 64) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 64) g.lineBetween(0, y, GAME_WIDTH, y);
    g.fillStyle(0x8c242b, 0.12); g.fillRect(0, 0, 18, GAME_HEIGHT);
    g.fillStyle(0x9d3038, 0.07); g.fillCircle(640, 290, 300);

    this.add.text(GAME_WIDTH / 2, 130, 'S H P Y', {
      fontSize: '64px', color: '#e06a64', fontStyle: 'bold', letterSpacing: 18,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 192, 'АГЕНТСТВО ОПЕРАЦИЙ', {
      fontSize: '19px', color: '#aebdca', letterSpacing: 5,
    }).setOrigin(0.5);

    g.fillStyle(0x182431, 0.97); g.fillRoundedRect(360, 245, 560, 365, 16);
    g.lineStyle(2, 0x7b6548, 0.8); g.strokeRoundedRect(360, 245, 560, 365, 16);
    g.lineStyle(1, 0x506174, 0.75); g.lineBetween(410, 315, 870, 315);

    const hasSave = saveService.hasSave();
    const save = hasSave ? saveService.load() : null;
    this.add.text(GAME_WIDTH / 2, 278, hasSave ? 'ОПЕРАТИВНОЕ ДЕЛО НАЙДЕНО' : 'НОВАЯ ОПЕРАЦИЯ', {
      fontSize: '19px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 343, save
      ? 'Репутация: ' + save.reputation.toLocaleString('ru-RU') + ' XP'
      : 'Сохранение не найдено. Начните карьеру агента.', {
      fontSize: '16px', color: '#c2ccd6',
    }).setOrigin(0.5);

    this.menuButton(430, 390, 420, 68, 'ПРОДОЛЖИТЬ', hasSave ? 0x315e4d : 0x34404b,
      hasSave, () => this.continueGame());
    this.menuButton(430, 480, 420, 68, 'НОВАЯ ИГРА', 0x9d3038, true, () => this.requestNewGame());
    this.add.text(GAME_WIDTH / 2, 650, 'ЛОКАЛЬНОЕ СОХРАНЕНИЕ • WEB / ANDROID', {
      fontSize: '12px', color: '#718091', letterSpacing: 2,
    }).setOrigin(0.5);
  }

  private menuButton(x: number, y: number, width: number, height: number, label: string,
    color: number, enabled: boolean, action: () => void): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, enabled ? 1 : 0.55);
    button.setStrokeStyle(2, 0xffffff, enabled ? 0.22 : 0.08);
    if (enabled) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setAlpha(0.82));
      button.on('pointerout', () => button.setAlpha(1));
      button.on('pointerdown', action);
    }
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '22px', color: enabled ? '#ffffff' : '#8995a0', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private continueGame(): void {
    if (!saveService.hasSave()) return;
    saveService.load();
    runSession.reset();
    this.scene.start('HQ');
  }

  private requestNewGame(): void {
    if (!saveService.hasSave()) {
      this.startFreshGame();
      return;
    }
    const modal = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05090e, 0.86)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x1c2936, 1); panel.fillRoundedRect(330, 245, 620, 250, 16);
    panel.lineStyle(2, 0x9b7450, 0.95); panel.strokeRoundedRect(330, 245, 620, 250, 16);
    const title = this.add.text(GAME_WIDTH / 2, 295, 'НАЧАТЬ НОВУЮ ИГРУ?', {
      fontSize: '28px', color: '#f0c16d', fontStyle: 'bold',
    }).setOrigin(0.5);
    const description = this.add.text(GAME_WIDTH / 2, 346, 'Текущий прогресс и все перки будут сброшены.', {
      fontSize: '17px', color: '#c2ccd6',
    }).setOrigin(0.5);
    const cancel = this.add.rectangle(500, 425, 210, 58, 0x39495a).setInteractive({ useHandCursor: true });
    const cancelText = this.add.text(500, 425, 'ОТМЕНА', { fontSize: '17px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const confirm = this.add.rectangle(760, 425, 310, 58, 0x9d3038).setInteractive({ useHandCursor: true });
    const confirmText = this.add.text(760, 425, 'СБРОСИТЬ И НАЧАТЬ', {
      fontSize: '17px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    cancel.on('pointerdown', () => modal.destroy(true));
    confirm.on('pointerdown', () => {
      modal.destroy(true);
      this.startFreshGame();
    });
    modal.add([shade, panel, title, description, cancel, cancelText, confirm, confirmText]);
  }

  private startFreshGame(): void {
    saveService.reset();
    runSession.reset();
    this.scene.start('HQ');
  }
}
