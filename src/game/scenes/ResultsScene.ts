import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { runSession } from '../systems/missions/runSession';
import { saveService } from '../../persistence/SaveService';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(): void {
    const result = runSession.result;
    const g = this.add.graphics();
    g.fillGradientStyle(0x0e151e, 0x0e151e, 0x202c39, 0x101720, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x1c2835, 0.96); g.fillRoundedRect(300, 90, 680, 540, 14);
    g.lineStyle(1, 0x56697d, 0.8); g.strokeRoundedRect(300, 90, 680, 540, 14);

    const success = result?.success ?? false;
    this.add.text(GAME_WIDTH / 2, 142, success ? 'ОПЕРАЦИЯ ЗАВЕРШЕНА' : 'ОПЕРАЦИЯ ПРОВАЛЕНА', {
      fontSize: '32px', color: success ? '#83d7a4' : '#e87575', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 195, 'КАЗИНО «РОЯЛЬ» • ОТЧЁТ АГЕНТСТВА', {
      fontSize: '14px', color: '#aebdca', letterSpacing: 2,
    }).setOrigin(0.5);

    const accuracy = result && result.shots > 0 ? Math.round((result.hits / result.shots) * 100) : 0;
    const stats: [string, string][] = [
      ['Время операции', (result?.elapsedSeconds ?? 0) + ' сек'],
      ['Устранено целей', String(result?.kills ?? 0)],
      ['Точность', accuracy + '%'],
      ['Получено урона', (result?.damageTaken ?? 0) + ' HP'],
      ['Репутация за операцию', '+' + (result?.reputationEarned ?? 0) + ' XP'],
      ['Всего репутации', saveService.load().reputation + ' XP'],
    ];
    stats.forEach(([label, value], index) => {
      const y = 250 + index * 48;
      this.add.text(390, y, label, { fontSize: '17px', color: '#bcc7d2' });
      this.add.text(870, y, value, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0);
      g.lineStyle(1, 0x465666, 0.55); g.lineBetween(390, y + 31, 870, y + 31);
    });

    const button = this.add.rectangle(GAME_WIDTH / 2, 565, 300, 52, 0x9d3038).setInteractive({ useHandCursor: true });
    button.setStrokeStyle(1, 0xffffff, 0.22);
    this.add.text(GAME_WIDTH / 2, 565, 'ВЕРНУТЬСЯ В ШТАБ', { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.8));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => this.scene.start('HQ'));
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 34, 'SHPY • ПРОТОТИП 0.1', { fontSize: '12px', color: '#718091' }).setOrigin(0.5);
  }
}
