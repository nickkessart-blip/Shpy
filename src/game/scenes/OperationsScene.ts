import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { getAccountLevel, getAccountRank } from '../data/progression';
import { saveService } from '../../persistence/SaveService';
import { runSession } from '../systems/missions/runSession';

export class OperationsScene extends Phaser.Scene {
  constructor() { super('Operations'); }

  create(): void {
    const save = saveService.load();
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d151e, 0x131e2a, 0x202d39, 0x0c121a, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x506174, 0.18);
    for (let x = 0; x < GAME_WIDTH; x += 64) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 64) g.lineBetween(0, y, GAME_WIDTH, y);

    this.add.text(64, 38, 'КАРТА ОПЕРАЦИЙ', {
      fontSize: '30px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 3,
    });
    this.add.text(66, 84, getAccountRank(save.accountXp).title + ' • УРОВЕНЬ ' + getAccountLevel(save.accountXp), {
      fontSize: '15px', color: '#aebdca',
    });
    this.button(1050, 34, 166, 46, 'В ШТАБ', 0x39495a, () => this.scene.start('HQ'));

    g.fillStyle(0x182431, 0.98);
    g.fillRoundedRect(72, 150, 720, 500, 14);
    g.lineStyle(2, 0x8a704f, 0.8);
    g.strokeRoundedRect(72, 150, 720, 500, 14);
    g.fillStyle(0x25394a, 1);
    g.fillRoundedRect(98, 178, 668, 240, 8);
    g.fillStyle(0x172633, 1);
    g.fillRect(110, 190, 644, 216);
    g.lineStyle(3, 0xd4ad72, 0.75);
    g.lineBetween(150, 355, 315, 238);
    g.lineBetween(315, 238, 520, 330);
    g.lineBetween(520, 330, 694, 225);
    g.fillStyle(0xc94c48, 1);
    g.fillCircle(315, 238, 10);
    g.fillCircle(520, 330, 10);
    g.fillCircle(694, 225, 10);
    this.add.text(120, 196, 'ЕВРОПА • ОПЕРАТИВНАЯ СЕТЬ', {
      fontSize: '13px', color: '#f1d5a8', fontStyle: 'bold', letterSpacing: 2,
    });

    this.add.text(112, 446, '01 / КАЗИНО «РОЯЛЬ»', {
      fontSize: '26px', color: '#f0c16d', fontStyle: 'bold',
    });
    this.add.text(112, 492, 'Главный зал → переход → VIP-зона → начальник охраны', {
      fontSize: '15px', color: '#d3dce5',
    });
    this.add.text(112, 526, 'Основная сюжетная операция. Результаты влияют на карьеру агента,\nдоллары и опыт аккаунта.', {
      fontSize: '14px', color: '#9eacb9', lineSpacing: 7,
    });
    this.button(112, 582, 320, 48, 'НАЧАТЬ ОПЕРАЦИЮ', 0x9d3038, () => {
      runSession.reset();
      this.scene.start('Mission');
    });

    g.fillStyle(0x17222d, 0.92);
    g.fillRoundedRect(830, 150, 378, 500, 14);
    g.lineStyle(1, 0x536273, 0.7);
    g.strokeRoundedRect(830, 150, 378, 500, 14);
    this.add.text(862, 180, 'СЛЕДУЮЩИЕ ОПЕРАЦИИ', {
      fontSize: '15px', color: '#c3ced8', fontStyle: 'bold', letterSpacing: 1,
    });
    const locked = [
      ['02', 'ВОСТОЧНЫЙ ЭКСПРЕСС', 'Уровень 4'],
      ['03', 'СКЛАД КОНТРАБАНДИСТОВ', 'Уровень 6'],
      ['04', 'ПОСОЛЬСТВО', 'Уровень 9'],
      ['05', 'ЛОГОВО ВУЛКАНА', 'Уровень 12'],
    ];
    locked.forEach(([number, title, requirement], index) => {
      const y = 230 + index * 92;
      g.fillStyle(0x202c37, 0.95);
      g.fillRoundedRect(852, y, 334, 72, 8);
      this.add.text(870, y + 12, number + '  /  ' + title, {
        fontSize: '13px', color: '#8795a2', fontStyle: 'bold', wordWrap: { width: 292 },
      });
      this.add.text(870, y + 42, 'ЗАКРЫТО • ' + requirement, {
        fontSize: '11px', color: '#b47c78',
      });
    });
    this.add.text(64, GAME_HEIGHT - 28, 'КАРТА ОТВЕЧАЕТ ТОЛЬКО ЗА ОСНОВНЫЕ СЮЖЕТНЫЕ ОПЕРАЦИИ', {
      fontSize: '11px', color: '#718091', letterSpacing: 1,
    });
  }

  private button(x: number, y: number, width: number, height: number, label: string, color: number, action: () => void): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, 0xffffff, 0.24).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.82));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', action);
  }
}
