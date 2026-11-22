import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import { BALANCE } from '../data/balance';
import { saveService, type UpgradeKind } from '../../persistence/SaveService';
import { AssetCatalog } from '../assets/AssetCatalog';

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
    if (hasTouchInput()) {
      this.createMobileLayout();
      return;
    }
    this.drawBackground();
    if (AssetCatalog.hasTexture(this, 'ui-logo')) {
      this.add.image(1160, 92, 'ui-logo').setDisplaySize(90, 90);
    } else {
      this.add.text(72, 54, 'S H P Y', { fontSize: '20px', color: '#d45c5c', fontStyle: 'bold', letterSpacing: 6 });
    }
    this.add.text(72, 93, 'АГЕНТСТВО. ШТАБ ОПЕРАЦИЙ', { fontSize: '34px', color: '#f0f2f5', fontStyle: 'bold' });
    this.add.text(72, 142, 'Стажёр • Личный состав: 1 • Уровень угрозы: терпимый', { fontSize: '16px', color: COLORS.muted });
    this.button(1018, 38, 170, 44, 'ГЛАВНОЕ МЕНЮ', 0x39495a, () => this.scene.start('Start'));

    const save = saveService.load();
    this.panel(72, 205, 720, 360, 'ОПЕРАТИВНЫЙ СТОЛ');
    this.add.text(108, 260, 'РЕПУТАЦИЯ', { fontSize: '14px', color: COLORS.muted, fontStyle: 'bold' });
    this.add.text(108, 287, save.reputation.toLocaleString('ru-RU') + ' XP', { fontSize: '38px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(108, 350, 'Доступная операция', { fontSize: '14px', color: COLORS.muted });
    this.add.text(108, 377, '01 / КАЗИНО «РОЯЛЬ»', { fontSize: '25px', color: '#f0c16d', fontStyle: 'bold' });
    this.add.text(108, 421, 'Главный зал → Бар и VIP-проход', { fontSize: '16px', color: '#c7d0d9' });
    this.add.text(108, 475, 'Задача: 5 волн в главном зале, 5 в VIP-зоне и финальная схватка с боссом.', {
      fontSize: '14px', color: COLORS.muted, wordWrap: { width: 610 },
    });
    this.button(108, 510, 260, 46, 'НАЧАТЬ ОПЕРАЦИЮ', COLORS.red, () => {
      this.scene.start('Loadout');
    });

    this.panel(830, 205, 378, 420, 'УЛУЧШЕНИЯ И ПЕРКИ');
    this.message = this.add.text(840, 635, '', { fontSize: '12px', color: '#f0c16d', wordWrap: { width: 360 } });
    UPGRADES.forEach(({ kind, label }, index) => {
      this.drawUpgrade(850, 254 + index * 59, label, save.upgrades[kind], BALANCE.upgradeUnlocks[kind], save.reputation, kind);
    });

    this.add.text(72, 612, 'УПРАВЛЕНИЕ: мышь — прицел • ЛКМ — огонь • R — перезарядка • Esc — пауза', {
      fontSize: '15px', color: COLORS.muted,
    });
    this.add.text(72, 648, 'SHPY • ПРОГРЕСС СОХРАНЯЕТСЯ ЛОКАЛЬНО', { fontSize: '12px', color: '#68798a' });
  }

  private createMobileLayout(): void {
    this.drawBackground();
    const save = saveService.load();
    const g = this.add.graphics();
    g.fillStyle(0x192633, 0.98); g.fillRoundedRect(46, 112, 1188, 550, 18);
    g.lineStyle(2, 0x7b6548, 0.9); g.strokeRoundedRect(46, 112, 1188, 550, 18);
    g.lineStyle(2, 0x46596a, 0.8); g.lineBetween(640, 150, 640, 620);
    this.add.text(72, 36, 'S H P Y', { fontSize: '34px', color: '#dc6c64', fontStyle: 'bold', letterSpacing: 8 });
    this.add.text(72, 78, 'АГЕНТСТВО ОПЕРАЦИЙ  /  ПОЛЕВОЙ ШТАБ', { fontSize: '18px', color: '#aebdca', letterSpacing: 2 });
    this.button(1040, 38, 168, 48, 'МЕНЮ', 0x39495a, () => this.scene.start('Start'));

    this.add.text(88, 150, 'ОПЕРАТИВНЫЙ СТОЛ', { fontSize: '22px', color: '#b9c8d5', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(92, 214, 'РЕПУТАЦИЯ', { fontSize: '18px', color: COLORS.muted, fontStyle: 'bold' });
    this.add.text(92, 247, save.reputation.toLocaleString('ru-RU') + ' XP', { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(92, 336, 'ОПЕРАЦИЯ 01', { fontSize: '18px', color: COLORS.muted });
    this.add.text(92, 372, 'КАЗИНО «РОЯЛЬ»', { fontSize: '33px', color: '#f0c16d', fontStyle: 'bold' });
    this.add.text(92, 423, 'Главный зал  →  Бар и VIP-проход', { fontSize: '19px', color: '#c7d0d9' });
    this.add.text(92, 462, '10 волн охраны и начальник казино в финале операции.', { fontSize: '16px', color: COLORS.muted });
    this.button(92, 526, 465, 78, 'НАЧАТЬ ОПЕРАЦИЮ', COLORS.red, () => {
      this.scene.start('Loadout');
    });

    this.add.text(684, 150, 'СНАРЯЖЕНИЕ И ПЕРКИ', { fontSize: '22px', color: '#b9c8d5', fontStyle: 'bold', letterSpacing: 1 });
    this.message = this.add.text(690, 617, '', { fontSize: '14px', color: '#f0c16d', wordWrap: { width: 490 } });
    UPGRADES.forEach(({ kind, label }, index) => {
      this.drawMobileUpgrade(690, 198 + index * 68, label, save.upgrades[kind], BALANCE.upgradeUnlocks[kind], save.reputation, kind);
    });
    this.add.text(72, 684, 'СЕНСОРНОЕ УПРАВЛЕНИЕ  •  ПРИЦЕЛ / ОГОНЬ / ПЕРЕЗАРЯДКА', {
      fontSize: '15px', color: '#718091',
    });
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

  private getUpgradeStatus(level: number, thresholds: readonly number[], reputation: number): {
    maxed: boolean; unlocked: boolean; label: string;
  } {
    const next = level + 1;
    const maxed = next >= thresholds.length;
    const unlocked = !maxed && reputation >= thresholds[next];
    const label = maxed ? 'МАКСИМУМ' : unlocked
      ? 'ДОСТУПНО' : 'ЕЩЁ ' + Math.max(0, thresholds[next] - reputation) + ' XP';
    return { maxed, unlocked, label };
  }

  private drawMobileUpgrade(
    x: number, y: number, label: string, level: number, thresholds: readonly number[],
    reputation: number, kind: UpgradeKind,
  ): void {
    const status = this.getUpgradeStatus(level, thresholds, reputation);
    this.add.text(x, y, label, { fontSize: '18px', color: '#f2f4f7', fontStyle: 'bold' });
    this.add.text(x, y + 27, 'УР. ' + level + '/4 • ' + this.upgradeValue(kind, level), {
      fontSize: '14px', color: status.maxed ? '#75c995' : '#aebdca',
    });
    this.add.text(x + 220, y + 4, status.label, {
      fontSize: '12px', color: status.maxed ? '#75c995' : status.unlocked ? '#f0c16d' : '#81909f',
    });
    if (!status.maxed) {
      const button = this.add.rectangle(x + 470, y + 22, 42, 42, status.unlocked ? COLORS.green : 0x394552)
        .setStrokeStyle(2, 0xdde6ee, 0.5).setInteractive({ useHandCursor: status.unlocked });
      this.add.text(x + 470, y + 22, '+', { fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      button.on('pointerdown', () => this.tryUpgrade(kind, label, thresholds, reputation));
    }
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

  private button(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void): void {
    const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, 1)
      .setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, 0xffffff, 0.25);
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: document.documentElement.dataset.device === 'mobile' ? '22px' : '14px',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.82));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
  }

  private drawUpgrade(
    x: number, y: number, label: string, level: number, thresholds: readonly number[],
    reputation: number, kind: UpgradeKind,
  ): void {
    const status = this.getUpgradeStatus(level, thresholds, reputation);
    this.add.text(x, y, label, { fontSize: '13px', color: '#f2f4f7', fontStyle: 'bold' });
    this.add.text(x, y + 23, 'УР. ' + level + '/4 • ' + this.upgradeValue(kind, level), {
      fontSize: '12px', color: status.maxed ? '#75c995' : COLORS.muted,
    });
    this.add.text(x + 145, y + 5, status.label, {
      fontSize: '10px', color: status.maxed ? '#75c995' : status.unlocked ? '#f0c16d' : '#81909f',
    });
    if (!status.maxed) {
      const btn = this.add.rectangle(x + 330, y + 20, 36, 32, status.unlocked ? COLORS.green : 0x394552)
        .setInteractive({ useHandCursor: status.unlocked });
      this.add.text(x + 330, y + 20, '+', { fontSize: '23px', color: '#ffffff' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.tryUpgrade(kind, label, thresholds, reputation));
    }
  }

  private tryUpgrade(kind: UpgradeKind, label: string, thresholds: readonly number[], reputation: number): void {
    const current = saveService.load().upgrades[kind];
    const next = current + 1;
    if (next >= thresholds.length) return;
    if (reputation < thresholds[next]) {
      this.message.setText('Для перка «' + label + '» нужно ещё ' + (thresholds[next] - reputation) + ' XP.');
      return;
    }
    saveService.unlockUpgrade(kind);
    this.scene.restart();
  }
}
