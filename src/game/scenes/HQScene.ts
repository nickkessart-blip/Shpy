import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
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
    this.createRoomLayout(save);
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


  private createRoomLayout(save: ReturnType<typeof saveService.load>): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x111a24, 0x182432, 0x27323c, 0x101720, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x26313a, 1); g.fillRect(0, 0, GAME_WIDTH, 452);
    g.fillStyle(0x111923, 1); g.fillRect(0, 0, GAME_WIDTH, 104);
    g.fillStyle(0x34404a, 1); g.fillRect(0, 104, GAME_WIDTH, 7);
    g.fillStyle(0x4c3b31, 1); g.fillRect(0, 452, GAME_WIDTH, 268);
    g.fillStyle(0x5a4638, 0.55); g.fillRect(0, 452, GAME_WIDTH, 12);
    g.lineStyle(2, 0x94775a, 0.22);
    for (let x = -100; x < GAME_WIDTH + 100; x += 160) g.lineBetween(640, 452, x, 720);
    for (let y = 520; y < 720; y += 48) g.lineBetween(0, y, GAME_WIDTH, y);
    g.fillStyle(0x101b27, 1); g.fillRoundedRect(380, 34, 500, 260, 8);
    g.fillStyle(0x25394a, 1); g.fillRect(390, 44, 480, 240);
    g.fillStyle(0x344a5a, 0.9); g.fillRect(390, 44, 480, 82);
    for (let i = 0; i < 8; i += 1) {
      const bx = 405 + i * 59;
      g.fillStyle(0x101a24, 0.9); g.fillRect(bx, 138 + (i % 3) * 20, 42, 145);
      g.fillStyle(0xd4a66a, 0.22);
      for (let row = 0; row < 5; row += 1) g.fillRect(bx + 8, 150 + row * 22, 5, 7);
    }
    g.lineStyle(8, 0x111923, 1); g.strokeRoundedRect(380, 34, 500, 260, 8);
    g.lineStyle(5, 0x111923, 1); g.lineBetween(630, 40, 630, 288);
    this.add.text(54, 34, 'S H P Y', { fontSize: '26px', color: '#df7169', fontStyle: 'bold', letterSpacing: 7 });
    this.add.text(56, 70, 'ШТАБ ОПЕРАЦИЙ', { fontSize: '13px', color: '#b5c1cb', letterSpacing: 3 });
    this.add.text(54, 126, getAccountRank(save.accountXp).title.toUpperCase() + '  •  УР. ' + getAccountLevel(save.accountXp), { fontSize: '16px', color: '#f0c16d', fontStyle: 'bold' });
    this.add.text(54, 153, 'save: ReturnType<typeof saveService.load>, x: number, y: number, width: number): void {
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
    this.add.text(x, y, label, { fontSize: '13px', color: '#f2f4f7', fontStyle: 'bold' }).setDepth(82);
    this.add.text(x, y + 23, 'УР. ' + level + '/4 • ' + this.upgradeValue(kind, level), {
      fontSize: '12px', color: status.maxed ? '#75c995' : COLORS.muted,
    }).setDepth(82);
    this.add.text(x + 145, y + 5, status.label, {
      fontSize: '10px', color: status.maxed ? '#75c995' : status.available ? '#f0c16d' : '#81909f',
    }).setDepth(82);
    if (!status.maxed) {
      const button = this.add.rectangle(x + 330, y + 20, 36, 32, status.available ? COLORS.green : 0x394552)
        .setDepth(82).setInteractive({ useHandCursor: status.available });
      this.add.text(x + 330, y + 20, '+', { fontSize: '23px', color: '#ffffff' }).setOrigin(0.5).setDepth(83);
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
 + save.dollars.toLocaleString('ru-RU') + '  •  ' + save.accountXp.toLocaleString('ru-RU') + ' XP', { fontSize: '14px', color: '#9ed2b0' });
    this.button(1040, 34, 180, 44, 'ГЛАВНОЕ МЕНЮ', 0x39495a, () => this.scene.start('Start'));

    // Physical operations map.
    g.fillStyle(0x111820, 1); g.fillRoundedRect(66, 230, 260, 198, 8);
    g.fillStyle(0x9a7950, 1); g.fillRoundedRect(78, 242, 236, 174, 4);
    g.fillStyle(0x25313a, 1); g.fillRect(88, 252, 216, 154);
    g.lineStyle(2, 0xd4ad72, 0.8);
    g.lineBetween(105, 365, 162, 300); g.lineBetween(162, 300, 245, 345); g.lineBetween(245, 345, 285, 275);
    g.fillStyle(0xc94c48, 1); g.fillCircle(162, 300, 7); g.fillCircle(245, 345, 7); g.fillCircle(285, 275, 7);
    this.add.text(92, 264, 'КАРТА ОПЕРАЦИЙ', { fontSize: '13px', color: '#f1d5a8', fontStyle: 'bold' });
    this.add.text(102, 382, '01  КАЗИНО «РОЯЛЬ»', { fontSize: '12px', color: '#f4e5cf' });
    this.roomHotspot(66, 230, 260, 198, 'КАРТА ОПЕРАЦИЙ', 'Выбрать операцию и подготовить комплект', () => this.scene.start('Loadout'));

    // Computer workstation.
    g.fillStyle(0x101820, 1); g.fillRoundedRect(918, 250, 276, 18, 5);
    g.fillStyle(0x574333, 1); g.fillRect(946, 268, 220, 22);
    g.fillStyle(0x111820, 1); g.fillRoundedRect(966, 155, 180, 112, 8);
    g.fillStyle(0x1c3441, 1); g.fillRoundedRect(975, 164, 162, 94, 4);
    g.fillStyle(0x72b28b, 0.8); g.fillRect(988, 179, 136, 4);
    g.fillStyle(0x72b28b, 0.35); g.fillRect(988, 192, 92, 4);
    g.fillStyle(0x72b28b, 0.35); g.fillRect(988, 205, 118, 4);
    g.fillStyle(0x72b28b, 0.35); g.fillRect(988, 218, 76, 4);
    g.fillStyle(0x111820, 1); g.fillRoundedRect(1034, 267, 42, 15, 3);
    this.add.text(956, 300, 'КОМПЬЮТЕР / УЛУЧШЕНИЯ', { fontSize: '13px', color: '#d9c09a', fontStyle: 'bold' });
    this.roomHotspot(918, 150, 276, 176, 'КОМПЬЮТЕР', 'Улучшения агентства за доллары', () => this.openComputerPanel(save));

    // Weapon cabinet.
    g.fillStyle(0x111820, 1); g.fillRoundedRect(386, 344, 186, 214, 8);
    g.fillStyle(0x394652, 1); g.fillRoundedRect(396, 354, 166, 194, 5);
    g.lineStyle(3, 0x8b9aa5, 0.7); g.strokeRoundedRect(406, 364, 146, 174, 3);
    for (let i = 0; i < 3; i += 1) {
      const yy = 385 + i * 50;
      g.fillStyle(0x18232d, 1); g.fillRoundedRect(424, yy, 108, 12, 4);
      g.fillStyle(i === 0 ? 0xc4a06d : 0x84929d, 1); g.fillRect(432, yy - 3, 78, 5);
      g.fillStyle(0x1a232c, 1); g.fillRect(458, yy + 8, 22, 18);
    }
    this.add.text(400, 566, 'ОРУЖЕЙНЫЙ ШКАФ', { fontSize: '13px', color: '#d9c09a', fontStyle: 'bold' });
    this.roomHotspot(386, 344, 186, 238, 'ОРУЖЕЙНЫЙ ШКАФ', 'Собрать оружие и снаряжение перед вылазкой', () => this.scene.start('Loadout'));

    // Phone is reserved for late-game events, prestige and agents.
    g.fillStyle(0x111820, 1); g.fillRoundedRect(706, 380, 90, 138, 12);
    g.fillStyle(0x283b47, 1); g.fillRoundedRect(714, 390, 74, 112, 7);
    g.fillStyle(0x79a68c, 0.8); g.fillRect(724, 407, 54, 4);
    g.fillStyle(0x79a68c, 0.45); g.fillRect(724, 420, 42, 4);
    g.fillCircle(751, 509, 4);
    this.add.text(680, 526, 'ТЕЛЕФОН', { fontSize: '12px', color: '#d9c09a', fontStyle: 'bold' });
    this.roomHotspot(690, 370, 124, 176, 'ТЕЛЕФОН', 'Поздняя игра: события, престиж и управление агентами', () => {
      this.showRoomNotice('Телефон пока молчит. События и престиж откроются на следующих этапах карьеры.');
    });

    // The agency cat.
    g.fillStyle(0x080d12, 0.35); g.fillEllipse(914, 590, 98, 25);
    g.fillStyle(0x252a30, 1); g.fillEllipse(914, 566, 76, 46);
    g.fillCircle(888, 548, 21); g.fillCircle(940, 548, 21);
    g.fillTriangle(873, 535, 878, 512, 891, 533); g.fillTriangle(932, 533, 948, 512, 951, 535);
    g.fillStyle(0xd4a56d, 1); g.fillCircle(901, 548, 3); g.fillCircle(927, 548, 3);
    g.lineStyle(3, 0x141a20, 1); g.lineBetween(875, 573, 856, 562);
    this.add.text(872, 608, 'АГЕНТ КОТ', { fontSize: '12px', color: '#d9c09a', fontStyle: 'bold' });
    this.roomHotspot(846, 520, 142, 106, 'КОТ', 'Поговорить с главным специалистом по моральному духу', () => {
      this.showRoomNotice('Кот посмотрел на отчёт. Отчёт признан недостойным внимания.');
    });
    this.add.text(56, 674, 'ВЫБЕРИТЕ ОБЪЕКТ В ШТАБЕ  •  КАРТА — ОПЕРАЦИИ  •  КОМПЬЮТЕР — УЛУЧШЕНИЯ', { fontSize: '13px', color: '#9ba9b6', letterSpacing: 1 });
  }

  private roomHotspot(x: number, y: number, width: number, height: number, title: string, subtitle: string, action: () => void): void {
    const hit = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.showRoomNotice(title + '  •  ' + subtitle));
    hit.on('pointerdown', action);
  }

  private showRoomNotice(message: string): void {
    this.children.getByName('room-notice')?.destroy();
    this.add.text(GAME_WIDTH / 2, 690, message, { fontSize: '13px', color: '#f0c16d', backgroundColor: '#101720dd', padding: { x: 12, y: 7 }, align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5).setName('room-notice').setDepth(30);
  }

  private openComputerPanel(save: ReturnType<typeof saveService.load>): void {
    const overlay = this.add.container(0, 0).setDepth(80);
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05090e, 0.82).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x192633, 0.99); panel.fillRoundedRect(720, 92, 500, 540, 14);
    panel.lineStyle(2, 0x92724f, 0.9); panel.strokeRoundedRect(720, 92, 500, 540, 14);
    const title = this.add.text(754, 116, 'КОМПЬЮТЕР АГЕНТСТВА', { fontSize: '20px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 1 });
    const balance = this.add.text(754, 151, 'БАЛАНС: save: ReturnType<typeof saveService.load>, x: number, y: number, width: number): void {
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
 + save.dollars.toLocaleString('ru-RU'), { fontSize: '16px', color: '#86d2a2', fontStyle: 'bold' });
    const close = this.add.rectangle(1158, 125, 34, 34, 0x704047).setInteractive({ useHandCursor: true });
    const closeLabel = this.add.text(1158, 125, '×', { fontSize: '25px', color: '#fff' }).setOrigin(0.5);
    close.on('pointerdown', () => overlay.destroy(true));
    this.message = this.add.text(754, 592, '', { fontSize: '12px', color: '#f0c16d' });
    UPGRADES.forEach(({ kind, label }, index) => this.drawUpgrade(754, 205 + index * 60, label, save.upgrades[kind], kind, save.accountXp, save.dollars));
    overlay.add([shade, panel, title, balance, close, closeLabel, this.message]);
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
