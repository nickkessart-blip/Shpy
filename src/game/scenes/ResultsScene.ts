import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import { runSession } from '../systems/missions/runSession';
import { saveService } from '../../persistence/SaveService';
import { getAccountLevel, getAccountRank } from '../data/progression';
import { getMissionDefinition } from '../data/missions';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(): void {
    const result = runSession.result;
    if (hasTouchInput()) {
      this.createMobileLayout(result);
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x0e151e, 0x0e151e, 0x202c39, 0x101720, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x1c2835, 0.96); g.fillRoundedRect(300, 90, 680, 540, 14);
    g.lineStyle(1, 0x56697d, 0.8); g.strokeRoundedRect(300, 90, 680, 540, 14);

    const success = result?.success ?? false;
    const save = saveService.load();
    this.add.text(GAME_WIDTH / 2, 142, success ? 'ОПЕРАЦИЯ ЗАВЕРШЕНА' : 'ОПЕРАЦИЯ ПРОВАЛЕНА', {
      fontSize: '32px', color: success ? '#83d7a4' : '#e87575', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 195, getMissionDefinition(runSession.missionId).title.toUpperCase() + ' • ОТЧЁТ АГЕНТСТВА', {
      fontSize: '14px', color: '#aebdca', letterSpacing: 2,
    }).setOrigin(0.5);

    const accuracy = result && result.shots > 0 ? Math.round((result.hits / result.shots) * 100) : 0;
    const stats: [string, string][] = [
      ['Время операции', (result?.elapsedSeconds ?? 0) + ' сек'],
      ['Устранено целей', String(result?.kills ?? 0)],
      ['Точность', accuracy + '%'],
      ['Получено урона', (result?.damageTaken ?? 0) + ' HP'],
      ['Опыт аккаунта', '+' + (result?.accountXpEarned ?? 0) + ' XP'],
      ['Доллары за операцию', '+$' + (result?.dollarsEarned ?? 0)],
      ['Уровень аккаунта', getAccountLevel(save.accountXp) + ' • ' + getAccountRank(save.accountXp).title],
      ['Баланс', '$' + save.dollars.toLocaleString('ru-RU')],
    ];
    stats.forEach(([label, value], index) => {
      const y = 224 + index * 38;
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

  private createMobileLayout(result: typeof runSession.result): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0e151e, 0x0e151e, 0x202c39, 0x101720, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x1c2835, 0.98); g.fillRoundedRect(72, 50, 1136, 620, 18);
    g.lineStyle(2, 0x718095, 0.8); g.strokeRoundedRect(72, 50, 1136, 620, 18);
    const success = result?.success ?? false;
    const save = saveService.load();
    this.add.text(GAME_WIDTH / 2, 102, success ? 'ОПЕРАЦИЯ ЗАВЕРШЕНА' : 'ОПЕРАЦИЯ ПРОВАЛЕНА', {
      fontSize: '34px', color: success ? '#83d7a4' : '#e87575', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 150, getMissionDefinition(runSession.missionId).title.toUpperCase() + '  •  ОТЧЁТ АГЕНТСТВА', {
      fontSize: '19px', color: '#aebdca', letterSpacing: 2,
    }).setOrigin(0.5);
    const accuracy = result && result.shots > 0 ? Math.round((result.hits / result.shots) * 100) : 0;
    const stats: [string, string][] = [
      ['ВРЕМЯ ОПЕРАЦИИ', (result?.elapsedSeconds ?? 0) + ' СЕК'],
      ['УСТРАНЕНО ЦЕЛЕЙ', String(result?.kills ?? 0)],
      ['ТОЧНОСТЬ', accuracy + '%'],
      ['ПОЛУЧЕНО УРОНА', (result?.damageTaken ?? 0) + ' HP'],
      ['ОПЫТ АККАУНТА', '+' + (result?.accountXpEarned ?? 0) + ' XP'],
      ['ДОЛЛАРЫ ЗА ОПЕРАЦИЮ', '+$' + (result?.dollarsEarned ?? 0)],
      ['УРОВЕНЬ АККАУНТА', getAccountLevel(save.accountXp) + ' • ' + getAccountRank(save.accountXp).title],
      ['БАЛАНС', '$' + save.dollars.toLocaleString('ru-RU')],
    ];
    stats.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = col === 0 ? 130 : 690;
      const y = 205 + row * 88;
      this.add.text(x, y, label, { fontSize: '17px', color: '#aebdca', fontStyle: 'bold' });
      this.add.text(x, y + 36, value, { fontSize: '29px', color: '#ffffff', fontStyle: 'bold' });
      g.lineStyle(1, 0x465666, 0.65); g.lineBetween(x, y + 82, x + 440, y + 82);
    });
    const button = this.add.rectangle(GAME_WIDTH / 2, 625, 430, 62, 0x9d3038).setInteractive({ useHandCursor: true });
    button.setStrokeStyle(2, 0xffffff, 0.25);
    this.add.text(GAME_WIDTH / 2, 625, 'ВЕРНУТЬСЯ В ШТАБ', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    button.on('pointerdown', () => this.scene.start('HQ'));
  }

}
