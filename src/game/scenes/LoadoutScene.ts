import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import {
  getNextWeaponSlotUnlock, getWeaponSlotLimit, isWeaponUnlocked, LOADOUT_UNLOCKS, WEAPONS,
  type ActiveItemId, type TacticalItemId, type WeaponId,
} from '../data/arsenal';
import { saveService } from '../../persistence/SaveService';
import { AssetCatalog } from '../assets/AssetCatalog';
import { runSession } from '../systems/missions/runSession';

const COLORS = { panel: 0x1b2733, edge: 0x536273, red: 0xa9363b, green: 0x3d8a69 };

export class LoadoutScene extends Phaser.Scene {
  private selectedWeapons: WeaponId[] = ['pistol'];
  private tacticalItem: TacticalItemId = 'none';
  private activeItem: ActiveItemId = 'none';
  private message!: Phaser.GameObjects.Text;
  private isMobile = false;

  constructor() { super('Loadout'); }

  create(): void {
    const save = saveService.load();
    this.selectedWeapons = [...save.loadout.weapons];
    this.tacticalItem = save.loadout.tacticalItem;
    this.activeItem = save.loadout.activeItem;
    this.isMobile = hasTouchInput();
    this.drawBackground();

    this.add.text(64, 34, 'ПОДГОТОВКА К ОПЕРАЦИИ', {
      fontSize: this.isMobile ? '30px' : '28px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 3,
    });
    this.add.text(66, 82, 'ОПЕРАЦИЯ 01  /  КАЗИНО «РОЯЛЬ»', {
      fontSize: this.isMobile ? '18px' : '15px', color: '#aebdca', letterSpacing: 2,
    });
    this.button(1050, 34, 166, 46, 'В ШТАБ', 0x39495a, () => this.scene.start('HQ'));

    this.add.text(72, 128, 'АРСЕНАЛ', { fontSize: '16px', color: '#aebdca', fontStyle: 'bold', letterSpacing: 2 });
    this.add.text(815, 128, 'ВАШ КОМПЛЕКТ', { fontSize: '16px', color: '#aebdca', fontStyle: 'bold', letterSpacing: 2 });

    WEAPONS.forEach((weapon, index) => this.drawWeaponCard(72, 154 + index * 112, weapon));
    this.drawLoadoutPanel(save.reputation);
    this.message = this.add.text(72, 626, '', {
      fontSize: this.isMobile ? '16px' : '13px', color: '#f0c16d', wordWrap: { width: 690 },
    });
    this.add.text(72, 674, this.isMobile
      ? 'КОМПЛЕКТ СОХРАНЯЕТСЯ АВТОМАТИЧЕСКИ'
      : 'Выбор сохраняется автоматически • В миссии: 1–3 — смена оружия, G — граната, Q — аптечка',
      { fontSize: '12px', color: '#718091', letterSpacing: 1 });
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x101720, 0x101720, 0x1c2632, 0x111821, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x394655, 0.22);
    for (let x = 0; x < GAME_WIDTH; x += 64) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 64) g.lineBetween(0, y, GAME_WIDTH, y);
    g.fillStyle(0x7d2329, 0.1); g.fillRect(0, 0, 14, GAME_HEIGHT);
  }

  private drawWeaponCard(x: number, y: number, weapon: typeof WEAPONS[number]): void {
    const save = saveService.load();
    const unlocked = isWeaponUnlocked(weapon.id, save.reputation);
    const selectedIndex = this.selectedWeapons.indexOf(weapon.id);
    const selected = selectedIndex >= 0;
    const slotLimit = getWeaponSlotLimit(save.reputation);
    const canAdd = selected || this.selectedWeapons.length < slotLimit;
    const g = this.add.graphics();
    g.fillStyle(selected ? 0x294044 : unlocked ? 0x1b2733 : 0x151d26, 0.98);
    g.fillRoundedRect(x, y, 704, 100, 10);
    g.lineStyle(selected ? 2 : 1, selected ? 0x77c99a : COLORS.edge, selected ? 0.95 : 0.65);
    g.strokeRoundedRect(x, y, 704, 100, 10);

    const textureKey = 'weapon-' + weapon.id;
    if (AssetCatalog.hasTexture(this, textureKey)) {
      this.add.image(x + 54, y + 51, textureKey).setDisplaySize(58, 94).setAlpha(unlocked ? 1 : 0.3);
    } else {
      const icon = this.add.graphics();
      icon.fillStyle(0x7f909e, unlocked ? 1 : 0.35);
      icon.fillRoundedRect(x + 28, y + 40, 64, 15, 5);
      icon.fillRoundedRect(x + 54, y + 30, 28, 34, 5);
    }

    this.add.text(x + 112, y + 16, weapon.name, {
      fontSize: this.isMobile ? '18px' : '16px', color: unlocked ? '#f1f4f7' : '#83909d', fontStyle: 'bold',
    });
    this.add.text(x + 112, y + 43, weapon.role, {
      fontSize: this.isMobile ? '15px' : '13px', color: '#d1dae2',
    });
    this.add.text(x + 112, y + 66, unlocked
      ? weapon.description
      : 'ЗАКРЫТО • НЕОБХОДИМО ' + weapon.unlockAt.toLocaleString('ru-RU') + ' XP',
      { fontSize: '11px', color: unlocked ? '#8f9eac' : '#b47c78', wordWrap: { width: 420 } });

    const state = selected ? 'В КОМПЛЕКТЕ · СЛОТ ' + (selectedIndex + 1)
      : !unlocked ? 'ЗАКРЫТО' : canAdd ? 'ДОБАВИТЬ' : 'НЕТ СВОБОДНОГО СЛОТА';
    this.add.text(x + 560, y + 39, state, {
      fontSize: '11px', color: selected ? '#88d4a6' : unlocked && canAdd ? '#f0c16d' : '#7a8794',
      fontStyle: 'bold', align: 'center', wordWrap: { width: 132 },
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x + 352, y + 50, 704, 100, 0xffffff, 0.001).setInteractive({ useHandCursor: unlocked });
    hit.on('pointerdown', () => this.toggleWeapon(weapon.id));
  }

  private drawLoadoutPanel(reputation: number): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 0.97); g.fillRoundedRect(800, 154, 410, 500, 12);
    g.lineStyle(2, 0x7b6548, 0.75); g.strokeRoundedRect(800, 154, 410, 500, 12);
    g.lineStyle(1, COLORS.edge, 0.65); g.lineBetween(822, 198, 1188, 198);

    const slotLimit = getWeaponSlotLimit(reputation);
    this.add.text(824, 174, 'ОРУЖЕЙНЫЕ СЛОТЫ  ' + this.selectedWeapons.length + '/' + slotLimit, {
      fontSize: '14px', color: '#dce4eb', fontStyle: 'bold',
    });
    for (let i = 0; i < 3; i += 1) {
      const weapon = this.selectedWeapons[i];
      const unlocked = i < slotLimit;
      const label = weapon ? WEAPONS.find((item) => item.id === weapon)?.name ?? weapon
        : unlocked ? 'СВОБОДЕН' : 'ЗАКРЫТ';
      this.add.text(826, 215 + i * 44, 'СЛОТ ' + (i + 1), { fontSize: '11px', color: '#8998a6' });
      this.add.text(934, 211 + i * 44, label, {
        fontSize: '13px', color: weapon ? '#f0c16d' : unlocked ? '#8ac49f' : '#677583', fontStyle: 'bold',
        wordWrap: { width: 245 },
      });
    }

    const nextSlot = getNextWeaponSlotUnlock(reputation);
    this.add.text(826, 350, nextSlot
      ? 'Следующий слот: ' + nextSlot.slots + ' • ещё ' + (nextSlot.reputation - reputation) + ' XP'
      : 'Все оружейные слоты открыты',
      { fontSize: '12px', color: nextSlot ? '#aebdca' : '#80c99b' });

    this.add.text(826, 383, 'ТАКТИЧЕСКОЕ СНАРЯЖЕНИЕ', {
      fontSize: '12px', color: '#aebdca', fontStyle: 'bold', letterSpacing: 1,
    });
    this.utilityButton(820, 408, 370, 52,
      this.tacticalItem === 'grenade' ? '✓  ОСКОЛОЧНАЯ ГРАНАТА ×2' : 'ОСКОЛОЧНАЯ ГРАНАТА',
      reputation >= LOADOUT_UNLOCKS.grenade, reputation, LOADOUT_UNLOCKS.grenade,
      this.tacticalItem === 'grenade', () => this.toggleTactical());

    this.add.text(826, 475, 'АКТИВНЫЙ ПРЕДМЕТ', {
      fontSize: '12px', color: '#aebdca', fontStyle: 'bold', letterSpacing: 1,
    });
    this.utilityButton(820, 500, 370, 52,
      this.activeItem === 'medkit' ? '✓  АПТЕЧКА · 1 ИСПОЛЬЗОВАНИЕ' : 'АПТЕЧКА',
      reputation >= LOADOUT_UNLOCKS.medkit, reputation, LOADOUT_UNLOCKS.medkit,
      this.activeItem === 'medkit', () => this.toggleActive());

    this.add.text(826, 562, 'Состав комплекта фиксируется перед выездом.', {
      fontSize: '11px', color: '#81909d', wordWrap: { width: 350 },
    });
    this.button(820, 590, 370, 48, 'НАЧАТЬ МИССИЮ', COLORS.red, () => this.startMission());
  }

  private utilityButton(
    x: number, y: number, width: number, height: number, label: string, unlocked: boolean,
    reputation: number, threshold: number, selected: boolean, action: () => void,
  ): void {
    const color = !unlocked ? 0x202a34 : selected ? 0x315b49 : 0x354554;
    const btn = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, selected ? 0x7ac99a : 0x718291, 0.85);
    const text = !unlocked ? label + ' · ' + Math.max(0, threshold - reputation) + ' XP'
      : label;
    this.add.text(x + width / 2, y + height / 2, text, {
      fontSize: this.isMobile ? '15px' : '13px', color: unlocked ? '#edf2f7' : '#778592',
      fontStyle: 'bold', align: 'center', wordWrap: { width: width - 18 },
    }).setOrigin(0.5);
    if (unlocked) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', action);
    }
  }

  private toggleWeapon(id: WeaponId): void {
    const save = saveService.load();
    if (!isWeaponUnlocked(id, save.reputation)) return;
    const index = this.selectedWeapons.indexOf(id);
    if (index >= 0) {
      if (this.selectedWeapons.length === 1) {
        this.message.setText('Нужно оставить хотя бы одно оружие.');
        return;
      }
      this.selectedWeapons.splice(index, 1);
    } else {
      if (this.selectedWeapons.length >= getWeaponSlotLimit(save.reputation)) {
        this.message.setText('Недостаточно слотов. Следующий откроется с ростом репутации.');
        return;
      }
      this.selectedWeapons.push(id);
    }
    this.persistSelection();
  }

  private toggleTactical(): void {
    this.tacticalItem = this.tacticalItem === 'grenade' ? 'none' : 'grenade';
    this.persistSelection();
  }

  private toggleActive(): void {
    this.activeItem = this.activeItem === 'medkit' ? 'none' : 'medkit';
    this.persistSelection();
  }

  private persistSelection(): void {
    saveService.setLoadout({
      weapons: this.selectedWeapons,
      tacticalItem: this.tacticalItem,
      activeItem: this.activeItem,
    });
    this.scene.restart();
  }

  private startMission(): void {
    if (this.selectedWeapons.length === 0) {
      this.message.setText('Сначала выберите хотя бы одно оружие.');
      return;
    }
    runSession.reset();
    this.scene.start('Mission');
  }

  private button(x: number, y: number, width: number, height: number, label: string, color: number, action: () => void): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, 0xffffff, 0.24).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: this.isMobile ? '17px' : '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.82));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', action);
  }
}
