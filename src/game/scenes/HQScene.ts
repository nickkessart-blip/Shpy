import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import { BALANCE } from '../data/balance';
import { saveService, type UpgradeKind } from '../../persistence/SaveService';
import { AssetCatalog } from '../assets/AssetCatalog';
import {
  getAccountLevel, getAccountRank, getNextAccountRank, getAccountProgress,
} from '../data/progression';

const COLORS = { panel: 0x1d2936, edge: 0x46576a, red: 0xb93838, muted: '#aab6c4', green: 0x64c58b };
const UPGRADES: Array<{ kind: UpgradeKind; label: string }> = [
  { kind: 'damage', label: 'УРОН' },
  { kind: 'magazine', label: 'ОБОЙМА' },
  { kind: 'reload', label: 'ПЕРЕЗАРЯДКА' },
  { kind: 'health', label: 'ЗДОРОВЬЕ' },
  { kind: 'armor', label: 'БРОНЕЖИЛЕТ' },
  { kind: 'precision', label: 'МЕТКОСТЬ' },
];

export class HQScene extends Phaser.Scene {
  private message!: Phaser.GameObjects.Text;

  constructor() { super('HQ'); }

  create(): void {
    const save = saveService.load();
    if (hasTouchInput()) this.createMobileLayout(save);
    else this.createDesktopLayout(save);
  }

  private createDesktopLayout(save: ReturnType<typeof saveService.load>): void {
    this.drawBackground();
    if (AssetCatalog.hasTexture(this, 'ui-logo')) this.add.image(1160, 92, 'ui-logo').setDisplaySize(90, 90);
    else this.add.text(72, 54, 'S H P Y', { fontSize: '20px', color: '#d45c5c', fontStyle: 'bold', letterSpacing: 6 });
    this.add.text(72, 93, 'АГЕНТСТВО. ШТАБ ОПЕРАЦИЙ', { fontSize: '34px', color: '#f0f2f5', fontStyle: 'bold' });
    this.add.text(72, 142, getAccountRank(save.accountXp).title + ' • УРОВЕНЬ АККАУНТА ' + getAccountLevel(save.accountXp), {
      fontSize: '16px', color: COLORS.muted,
    });
    this.button(1018, 38, 170, 44, 'ГЛАВНОЕ МЕНЮ', 0x39495a, () => this.scene.start('Start'));

    this.panel(72, 205, 720, 360, 'ОПЕРАТИВНЫЙ СТОЛ');
    this.drawAccountSummary(save, 108, 260, 610);
    this.add.text(108, 380, 'Доступная операция', { fontSize: '14px', color: COLORS.muted });
    this.add.text(108, 407, '01 / КАЗИНО «РОЯЛЬ»', { fontSize: '25px', color: '#f0c16d', fontStyle: 'bold' });
    this.add.text(108, 451, 'Главный зал → Бар и VIP-проход', { fontSize: '16px', color: '#c7d0d9' });
    this.add.text(108, 492, '5 волн в главном зале, 5 в VIP-зоне и финальная схватка с боссом.', {
      fontSize: '14px', color: COLORS.muted, wordWrap: { width: 610 },
    });
    this.button(108, 510, 260, 46, 'НАЧАТЬ ОПЕРАЦИЮ', COLORS.red, () => this.scene.start('Loadout'));

    this.panel(830, 205, 378, 420, 'УЛУЧШЕНИЯ ЗА ДОЛЛАРЫ');
    this.message = this.add.text(840, 635, '', { fontSize: '12px', color: '#f0c16d', wordWrap: { width: 360 } });
    UPGRADES.forEach(({ kind, label }, index) => {
      this.drawUpgrade(850, 254 + index * 59, label, save.upgrades[kind], kind, save.accountXp, save.dollars);
    });
    this.add.text(72, 612, 'УПРАВЛЕНИЕ: мышь — прицел • ЛКМ — огонь • R — перезарядка • Esc — пауза', {
      fontSize: '15px', color: COLORS.muted,
    });
    this.add.text(72, 648, 'SHPY • ДОЛЛАРЫ ТРАТЯТСЯ НА УЛУЧШЕНИЯ • ОПЫТ АККАУНТА НЕ ТРАТИТСЯ', {
      fontSize: '12px', color: '#68798a',
    });
  }

  private createMobileLayout(save: ReturnType<typeof saveService.load>): void {
    this.drawBackground();
    const g = this.add.graphics();
    g.fillStyle(0x192633, 0.98); g.fillRoundedRect(46, 112, 1188, 550, 18);
    g.lineStyle(2, 0x7b6548, 0.9); g.strokeRoundedRect(46, 112, 1188, 550, 18);
    g.lineStyle(2, 0x46596a, 0.8); g.lineBetween(640, 150, 640, 620);
    this.add.text(72, 36, 'S H P Y', { fontSize: '34px', color: '#dc6c64', fontStyle: 'bold', letterSpacing: 8 });
    this.add.text(72, 78, 'АГЕНТСТВО ОПЕРАЦИЙ  /  ПОЛЕВОЙ ШТАБ', { fontSize: '18px', color: '#aebdca', letterSpacing: 2 });
    this.button(1040, 38, 168, 48, 'МЕНЮ', 0x39495a, () => this.scene.start('Start'));
    this.add.text(88, 150, 'ОПЕРАТИВНЫЙ СТОЛ', { fontSize: '22px', color: '#b9c8d5', fontStyle: 'bold', letterSpacing: 2 });
    this.drawAccountSummary(save, 92, 206, 500);
    this.add.text(92, 392, 'ОПЕРАЦИЯ 01', { fontSize: '18px', color: COLORS.muted });
    this.add.text(92, 428, 'КАЗИНО «РОЯЛЬ»', { fontSize: '33px', color: '#f0c16d', fontStyle: 'bold' });
    this.add.text(92, 476, 'Главный зал → Бар и VIP-проход', { fontSize: '19px', color: '#c7d0d9' });
    this.add.text(92, 510, '10 волн охраны и начальник казино в финале.', { fontSize: '16px', color: COLORS.muted });
    this.button(92, 556, 465, 60, 'НАЧАТЬ ОПЕРАЦИЮ', COLORS.red, () => this.scene.start('Loadout'));

    this.add.text(684, 150, 'УЛУЧШЕНИЯ ЗА ДОЛЛАРЫ', { fontSize: '22px', color: '#b9c8d5', fontStyle: 'bold', letterSpacing: 1 });
    this.message = this.add.text(690, 617, '', { fontSize: '14px', color: '#f0c16d', wordWrap: { width: 490 } });
    UPGRADES.forEach(({ kind, label }, index) => {
      this.drawMobileUpgrade(690, 198 + index * 68, label, save.upgrades[kind], kind, save.accountXp, save.dollars);
    });
    this.add.text(72, 684, 'ДОЛЛАРЫ МОЖНО ТРАТИТЬ • ОПЫТ АККАУНТА СОХРАНЯЕТ УРОВЕНЬ', {
      fontSize: '15px', color: '#718091',
    });
  }

  private drawAccountSummary(save: ReturnType<typeof saveService.load>, x: number, y: number, width: number): void {
    const level = getAccountLevel(save.accountXp);
    const rank = getAccountRank(save.accountXp);
    const next = getNextAccountRank(save.accountXp);
    const progress = getAccountProgress(save.accountXp);
    this.add.text(x, y, 'УРОВЕНЬ АККАУНТА', { fontSize: '13px', color: COLORS.muted, fontStyle: 'bold' });
    this.add.text(x, y + 23, level + '  /  ' + rank.title, { fontSize: '25px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(x + 310, y + 7, '$' + save.dollars.toLocaleString('ru-RU'), {
      fontSize: '25px', color: '#83d7a4', fontStyle: 'bold',
    });
    this.add.text(x + 310, y + 36, 'ДОЛЛАРЫ', { fontSize: '11px', color: '#91a2b1', fontStyle: 'bold' });
    const barY = y + 64;
    const bar = this.add.graphics();
    bar.fillStyle(0x0d151e, 1); bar.fillRoundedRect(x, barY, width, 10, 5);
    bar.fillStyle(0x6ac18e, 1); bar.fillRoundedRect(x, barY, width * progress.progress, 10, 5);
    this.add.text(x, barY + 15, next
      ? 'ОПЫТ ' + save.accountXp.toLocaleString('ru-RU') + ' / ' + next.xp.toLocaleString('ru-RU') + ' XP  •  ДО СЛЕДУЮЩЕГО УРОВНЯ ' + (next.xp - save.accountXp)
      : 'МАКСИМАЛЬНЫЙ РАНГ • ' + save.accountXp.toLocaleString('ru-RU') + ' XP',
      { fontSize: '11px', color: '#aab6c4' });
  }

  private upgradeValue(kind: UpgradeKind, level: number): string {
    switch (kind) {
      case 'damage': return BALANCE.weapon.damage[level].toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + ' урона';
      case 'magazine': return BALANCE.weapon.magazine[level] + ' патронов';
      case 'reload': return BALANCE.weapon.reloadSeconds[level].toFixed(1) + ' сек';
      case 'health': return BALANCE.player.maxHp[level] + ' HP';
      case 'armor': return Math.round(BALANCE.player.damageReduction[level] * 100) + '% защиты';
      case 'precision': return '×' + BALANCE.weapon.headMultiplier[level].toFixed(2) + ' в голову';
    }
  }

  private upgradeStatus(level: number, kind: UpgradeKind, accountXp: number, dollars: number): {
    maxed: boolean; available: boolean; cost: number; label: string;
  } {
    const next = level + 1;
    const costs = BALANCE.upgradeCosts[kind];
    const maxed = next >= costs.length;
    const cost = maxed ? 0 : costs[next] ?? 0;
    const accountLevel = getAccountLevel(accountXp);
    const requiredLevel = BALANCE.upgradeTierUnlockLevels[kind][next] ?? 1;
    const available = !maxed && accountLevel >= requiredLevel && dollars >= cost;
    const label = maxed ? 'МАКСИМУМ'
      : accountLevel < requiredLevel ? 'ОТКРЫТИЕ: УР. ' + requiredLevel
        : dollars < cost ? 'НУЖНО $' + cost.toLocaleString('ru-RU')
          : 'ЦЕНА $' + cost.toLocaleString('ru-RU');
    return { maxed, available, cost, label };
  }

  private drawMobileUpgrade(x: number, y: number, label: string, level: number, kind: UpgradeKind, xp: number, dollars: number): void {
    const status = this.upgradeStatus(level, kind, xp, dollars);
    this.add.text(x, y, label, { fontSize: '18px', color: '#f2f4f7', fontStyle: 'bold' });
    this.add.text(x, y + 27, 'УР. ' + level + '/4 • ' + this.upgradeValue(kind, level), {
      fontSize: '14px', color: status.maxed ? '#75c995' : '#aebdca',
    });
    this.add.text(x + 220, y + 4, status.label, {
      fontSize: '12px', color: status.maxed ? '#75c995' : status.available ? '#f0c16d' : '#81909f',
    });
    if (!status.maxed) {
      const button = this.add.rectangle(x + 470, y + 22, 42, 42, status.available ? COLORS.green : 0x394552)
        .setStrokeStyle(2, 0xdde6ee, 0.5).setInteractive({ useHandCursor: status.available });
      this.add.text(x + 470, y + 22, '+', { fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      button.on('pointerdown', () => this.tryUpgrade(kind, label));
    }
  }

  private drawUpgrade(x: number, y: number, label: string, level: number, kind: UpgradeKind, xp: number, dollars: number): void {
    const status = this.upgradeStatus(level, kind, xp, dollars);
    this.add.text(x, y, label, { fontSize: '13px', color: '#f2f4f7', fontStyle: 'bold' });
    this.add.text(x, y + 23, 'УР. ' + level + '/4 • ' + this.upgradeValue(kind, level), {
      fontSize: '12px', color: status.maxed ? '#75c995' : COLORS.muted,
    });
    this.add.text(x + 145, y + 5, status.label, {
      fontSize: '10px', color: status.maxed ? '#75c995' : status.available ? '#f0c16d' : '#81909f',
    });
    if (!status.maxed) {
      const button = this.add.rectangle(x + 330, y + 20, 36, 32, status.available ? COLORS.green : 0x394552)
        .setInteractive({ useHandCursor: status.available });
      this.add.text(x + 330, y + 20, '+', { fontSize: '23px', color: '#ffffff' }).setOrigin(0.5);
      button.on('pointerdown', () => this.tryUpgrade(kind, label));
    }
  }

  private tryUpgrade(kind: UpgradeKind, label: string): void {
    const result = saveService.purchaseUpgrade(kind);
    if (!result.success) {
      const reason = result.reason === 'funds' ? 'Недостаточно долларов для «' + label + '».'
        : result.reason === 'level' ? 'Эта ветка откроется на более высоком уровне аккаунта.'
          : 'Улучшение уже достигло максимума.';
      this.message.setText(reason);
      return;
    }
    this.scene.restart();
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x101720, 0x101720, 0x1c2632, 0x111821, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x394655, 0.25);
    for (let x = 0; x < GAME_WIDTH; x += 64) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 64) g.lineBetween(0, y, GAME_WIDTH, y);
    g.fillStyle(0x7d2329, 0.10); g.fillRect(0, 0, 14, GAME_HEIGHT);
  }

  private panel(x: number, y: number, width: number, height: number, title: string): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.96); g.fillRoundedRect(x, y, width, height, 10);
    g.lineStyle(1, COLORS.edge, 1); g.strokeRoundedRect(x, y, width, height, 10);
    this.add.text(x + 24, y + 18, title, { fontSize: '14px', color: '#aebdca', fontStyle: 'bold', letterSpacing: 2 });
    g.lineStyle(1, COLORS.edge, 0.5); g.lineBetween(x + 22, y + 48, x + width - 22, y + 48);
  }

  private button(x: number, y: number, width: number, height: number, label: string, color: number, action: () => void): void {
    const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, 1)
      .setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, 0xffffff, 0.25);
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: document.documentElement.dataset.device === 'mobile' ? '22px' : '14px',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.82));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', action);
  }
}
