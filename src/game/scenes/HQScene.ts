import Phaser from 'phaser';
import { GAME_WIDTH } from '../../app/GameConfig';
import { BALANCE } from '../data/balance';
import { saveService } from '../../persistence/SaveService';
import { runSession } from '../systems/missions/runSession';
import { AssetCatalog } from '../assets/AssetCatalog';

const COLORS = { panel: 0x1d2936, edge: 0x46576a, red: 0xb93838, muted: '#aab6c4', green: 0x64c58b };

export class HQScene extends Phaser.Scene {
  private message!: Phaser.GameObjects.Text;
  constructor() { super('HQ'); }

  create(): void {
    this.drawBackground();
    if (AssetCatalog.hasTexture(this, 'ui-logo')) {
      this.add.image(1160, 92, 'ui-logo').setDisplaySize(90, 90);
    } else {
      this.add.text(72, 54, 'S H P Y', { fontSize: '20px', color: '#d45c5c', fontStyle: 'bold', letterSpacing: 6 });
    }
    this.add.text(72, 93, 'АГЕНТСТВО. ШТАБ ОПЕРАЦИЙ', { fontSize: '34px', color: '#f0f2f5', fontStyle: 'bold' });
    this.add.text(72, 142, 'Стажёр • Личный состав: 1 • Уровень угрозы: терпимый', { fontSize: '16px', color: COLORS.muted });

    const save = saveService.load();
    this.panel(72, 205, 720, 360, 'ОПЕРАТИВНЫЙ СТОЛ');
    this.add.text(108, 260, 'РЕПУТАЦИЯ', { fontSize: '14px', color: COLORS.muted, fontStyle: 'bold' });
    this.add.text(108, 287, save.reputation.toLocaleString('ru-RU') + ' XP', { fontSize: '38px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(108, 350, 'Доступная операция', { fontSize: '14px', color: COLORS.muted });
    this.add.text(108, 377, '01 / КАЗИНО «РОЯЛЬ»', { fontSize: '25px', color: '#f0c16d', fontStyle: 'bold' });
    this.add.text(108, 421, 'Главный зал → Бар и VIP-проход', { fontSize: '16px', color: '#c7d0d9' });
    this.add.text(108, 475, 'Задача: зачистить 4 волны. Не попасть в отчёт о потерях.', { fontSize: '14px', color: COLORS.muted });
    this.button(108, 510, 260, 46, 'НАЧАТЬ ОПЕРАЦИЮ', COLORS.red, () => {
      runSession.reset();
      this.scene.start('Mission');
    });

    this.panel(830, 205, 378, 360, 'УЛУЧШЕНИЯ СНАРЯЖЕНИЯ');
    this.drawUpgrade(862, 260, 'УРОН', save.upgrades.damage, BALANCE.upgradeUnlocks.damage, save.reputation, 'damage');
    this.drawUpgrade(862, 350, 'ОБОЙМА', save.upgrades.magazine, BALANCE.upgradeUnlocks.magazine, save.reputation, 'magazine');
    this.drawUpgrade(862, 440, 'ПЕРЕЗАРЯДКА', save.upgrades.reload, BALANCE.upgradeUnlocks.reload, save.reputation, 'reload');

    this.add.text(72, 612, 'УПРАВЛЕНИЕ: мышь — прицел • ЛКМ — огонь • R — перезарядка • Esc — пауза', { fontSize: '15px', color: COLORS.muted });
    this.add.text(72, 648, 'ПРОТОТИП 0.1 • ВИЗУАЛЬНЫЕ ЗАГЛУШКИ • ПРОГРЕСС СОХРАНЯЕТСЯ ЛОКАЛЬНО', { fontSize: '12px', color: '#68798a' });
    this.message = this.add.text(840, 590, '', { fontSize: '13px', color: '#f0c16d', wordWrap: { width: 360 } });
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
    const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, 1).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, 0xffffff, 0.25);
    this.add.text(x + width / 2, y + height / 2, label, { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.82));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
  }

  private drawUpgrade(
    x: number, y: number, label: string, level: number, thresholds: readonly number[],
    reputation: number, kind: 'damage' | 'magazine' | 'reload',
  ): void {
    const next = level + 1;
    const unlocked = next < thresholds.length && reputation >= thresholds[next];
    const maxed = level >= 2;
    const current = maxed ? 'МАКСИМУМ' : unlocked ? 'ДОСТУПНО • ' + thresholds[next] + ' XP' : 'ОТКРОЕТСЯ • ' + thresholds[next] + ' XP';
    this.add.text(x, y, label, { fontSize: '14px', color: '#f2f4f7', fontStyle: 'bold' });
    this.add.text(x, y + 25, 'Уровень ' + level + '/2', { fontSize: '13px', color: COLORS.muted });
    this.add.text(x + 155, y + 5, current, { fontSize: '11px', color: maxed ? '#75c995' : unlocked ? '#f0c16d' : '#81909f' });
    if (!maxed) {
      const btn = this.add.rectangle(x + 315, y + 20, 42, 34, unlocked ? COLORS.green : 0x394552).setInteractive({ useHandCursor: unlocked });
      this.add.text(x + 315, y + 20, '+', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        if (!unlocked) {
          this.message.setText('Нужно ещё ' + Math.max(0, thresholds[next] - reputation) + ' XP для улучшения «' + label + '».');
          return;
        }
        saveService.unlockUpgrade(kind);
        this.scene.restart();
      });
    }
  }
}
