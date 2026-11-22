import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import {
  getNextWeaponSlotUnlock, getWeaponSlotLimit, isWeaponUnlocked, LOADOUT_UNLOCKS, WEAPONS,
  type ActiveItemId, type TacticalItemId, type WeaponId,
} from '../data/arsenal';
import { COSMETICS, type CosmeticDefinition, type CosmeticId } from '../data/cosmetics';
import { BALANCE } from '../data/balance';
import { saveService, GEAR_UPGRADE_COSTS, type GearUpgradeKind, type UpgradeKind } from '../../persistence/SaveService';
import { AssetCatalog } from '../assets/AssetCatalog';
import { getAccountLevel } from '../data/progression';

type ArmoryTab = 'arsenal' | 'perks' | 'modifications' | 'appearance';

const PERKS: Array<{ kind: UpgradeKind; label: string; description: string }> = [
  { kind: 'damage', label: 'УРОН', description: 'Увеличивает урон каждого попадания.' },
  { kind: 'magazine', label: 'ОБОЙМА', description: 'Больше патронов до перезарядки.' },
  { kind: 'reload', label: 'ПЕРЕЗАРЯДКА', description: 'Сокращает время смены магазина.' },
  { kind: 'health', label: 'ЗДОРОВЬЕ', description: 'Увеличивает максимальный запас HP.' },
  { kind: 'armor', label: 'БРОНЕЖИЛЕТ', description: 'Снижает входящий урон.' },
  { kind: 'precision', label: 'МЕТКОСТЬ', description: 'Увеличивает множитель попадания в голову.' },
];

const TAB_LABELS: Array<{ id: ArmoryTab; label: string; x: number; width: number }> = [
  { id: 'arsenal', label: 'АРСЕНАЛ', x: 64, width: 178 },
  { id: 'perks', label: 'ПЕРКИ', x: 252, width: 150 },
  { id: 'modifications', label: 'МОДИФИКАЦИИ', x: 412, width: 218 },
  { id: 'appearance', label: 'ВНЕШНИЙ ВИД', x: 640, width: 210 },
];

export class LoadoutScene extends Phaser.Scene {
  private selectedWeapons: WeaponId[] = ['pistol'];
  private tacticalItem: TacticalItemId = 'none';
  private activeItem: ActiveItemId = 'none';
  private isMobile = false;
  private tab: ArmoryTab = 'arsenal';
  private content?: Phaser.GameObjects.Container;
  private notice = '';

  constructor() { super('Loadout'); }

  create(): void {
    const save = saveService.load();
    this.selectedWeapons = [...save.loadout.weapons];
    this.tacticalItem = save.loadout.tacticalItem;
    this.activeItem = save.loadout.activeItem;
    this.isMobile = hasTouchInput();
    this.drawBackground();

    this.add.text(64, 30, 'ОРУЖЕЙНЫЙ ШКАФ', {
      fontSize: this.isMobile ? '30px' : '28px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 3,
    });
    this.add.text(66, 76, 'АРСЕНАЛ • ПЕРКИ • ПОЛЕВЫЕ МОДИФИКАЦИИ • ВНЕШНИЙ ВИД', {
      fontSize: '12px', color: '#aebdca', letterSpacing: 1,
    });
    this.add.text(845, 40,
      '$' + save.dollars.toLocaleString('ru-RU') + '  •  ДЕТАЛИ ' + save.components.toLocaleString('ru-RU'),
      { fontSize: '17px', color: '#86d2a2', fontStyle: 'bold' });
    this.button(1050, 92, 166, 42, 'В ШТАБ', 0x39495a, () => this.scene.start('HQ'));

    TAB_LABELS.forEach((tab) => this.button(tab.x, 112, tab.width, 42, tab.label,
      this.tab === tab.id ? 0x8a6742 : 0x30404e, () => {
        this.tab = tab.id;
        this.renderTab();
      }));
    this.renderTab();
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

  private renderTab(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0).setDepth(10);
    const save = saveService.load();
    if (this.notice) this.addText(this.content, 64, 682, this.notice, 12, '#f0c16d', true);

    switch (this.tab) {
      case 'arsenal': this.drawArsenal(save); break;
      case 'perks': this.drawPerks(save); break;
      case 'modifications': this.drawModifications(save); break;
      case 'appearance': this.drawAppearance(save); break;
    }
  }

  private drawArsenal(save: ReturnType<typeof saveService.load>): void {
    this.addText(this.content!, 64, 170, 'ОРУЖИЕ • ОТКРЫТОЕ И ЗАКРЫТОЕ', 14, '#aebdca', true);
    this.addText(this.content!, 815, 170, 'АКТИВНЫЙ КОМПЛЕКТ', 14, '#aebdca', true);
    WEAPONS.forEach((weapon, index) => this.drawWeaponCard(64, 202 + index * 112, weapon, save));

    const panel = this.add.graphics();
    panel.fillStyle(0x1b2733, 0.97); panel.fillRoundedRect(800, 202, 410, 438, 12);
    panel.lineStyle(2, 0x7b6548, 0.75); panel.strokeRoundedRect(800, 202, 410, 438, 12);
    this.content!.add(panel);

    const accountLevel = getAccountLevel(save.accountXp);
    const slotLimit = getWeaponSlotLimit(accountLevel);
    this.addText(this.content!, 824, 222,
      'ОРУЖЕЙНЫЕ СЛОТЫ  ' + this.selectedWeapons.length + '/' + slotLimit, 14, '#dce4eb', true);
    for (let i = 0; i < 3; i += 1) {
      const weapon = this.selectedWeapons[i];
      const unlocked = i < slotLimit;
      const label = weapon ? WEAPONS.find((item) => item.id === weapon)?.name ?? weapon
        : unlocked ? 'СВОБОДЕН' : 'ЗАКРЫТ';
      this.addText(this.content!, 826, 260 + i * 42, 'СЛОТ ' + (i + 1), 10, '#8998a6');
      this.addText(this.content!, 930, 255 + i * 42, label, 12,
        weapon ? '#f0c16d' : unlocked ? '#8ac49f' : '#677583', true);
    }
    const nextSlot = getNextWeaponSlotUnlock(accountLevel);
    this.addText(this.content!, 826, 396, nextSlot
      ? 'Следующий слот: ' + nextSlot.slots + ' • ещё ' + (nextSlot.accountLevel - accountLevel) + ' ур.'
      : 'Все оружейные слоты открыты', 11, nextSlot ? '#aebdca' : '#80c99b');

    this.addText(this.content!, 826, 430, 'ТАКТИЧЕСКОЕ СНАРЯЖЕНИЕ', 12, '#aebdca', true);
    const grenadeAmount = LOADOUT_UNLOCKS.grenadesPerMission + save.gearUpgrades.grenadeCapacity;
    this.utilityButton(820, 455, 370, 48,
      this.tacticalItem === 'grenade' ? '✓  ГРАНАТЫ ×' + grenadeAmount : 'ОСКОЛОЧНЫЕ ГРАНАТЫ',
      accountLevel >= LOADOUT_UNLOCKS.grenadeLevel, accountLevel, LOADOUT_UNLOCKS.grenadeLevel,
      this.tacticalItem === 'grenade', () => this.toggleTactical());
    this.addText(this.content!, 826, 516, 'АКТИВНЫЙ ПРЕДМЕТ', 12, '#aebdca', true);
    const heal = Math.round((LOADOUT_UNLOCKS.medkitHealRatio + save.gearUpgrades.medkitEfficiency * 0.1) * 100);
    this.utilityButton(820, 540, 370, 48,
      this.activeItem === 'medkit' ? '✓  АПТЕЧКА • ЛЕЧИТ ' + heal + '%' : 'АПТЕЧКА',
      accountLevel >= LOADOUT_UNLOCKS.medkitLevel, accountLevel, LOADOUT_UNLOCKS.medkitLevel,
      this.activeItem === 'medkit', () => this.toggleActive());
    this.addText(this.content!, 824, 606,
      'Комплект сохраняется автоматически и используется на основной операции.', 10, '#81909d');
  }

  private drawWeaponCard(x: number, y: number, weapon: typeof WEAPONS[number], save: ReturnType<typeof saveService.load>): void {
    const accountLevel = getAccountLevel(save.accountXp);
    const unlocked = isWeaponUnlocked(weapon.id, accountLevel);
    const selectedIndex = this.selectedWeapons.indexOf(weapon.id);
    const selected = selectedIndex >= 0;
    const slotLimit = getWeaponSlotLimit(accountLevel);
    const canAdd = selected || this.selectedWeapons.length < slotLimit;
    const g = this.add.graphics();
    g.fillStyle(selected ? 0x294044 : unlocked ? 0x1b2733 : 0x151d26, 0.98);
    g.fillRoundedRect(x, y, 704, 100, 10);
    g.lineStyle(selected ? 2 : 1, selected ? 0x77c99a : 0x536273, selected ? 0.95 : 0.65);
    g.strokeRoundedRect(x, y, 704, 100, 10);
    this.content!.add(g);

    const textureKey = 'weapon-' + weapon.id;
    if (AssetCatalog.hasTexture(this, textureKey)) {
      const image = this.add.image(x + 54, y + 51, textureKey).setDisplaySize(58, 94).setAlpha(unlocked ? 1 : 0.3);
      this.content!.add(image);
    } else {
      const icon = this.add.graphics();
      icon.fillStyle(0x7f909e, unlocked ? 1 : 0.35);
      icon.fillRoundedRect(x + 28, y + 40, 64, 15, 5);
      icon.fillRoundedRect(x + 54, y + 30, 28, 34, 5);
      this.content!.add(icon);
    }

    this.addText(this.content!, x + 112, y + 14, weapon.name, this.isMobile ? 17 : 15,
      unlocked ? '#f1f4f7' : '#83909d', true);
    this.addText(this.content!, x + 112, y + 42, weapon.role, 12, '#d1dae2');
    this.addText(this.content!, x + 112, y + 66, unlocked
      ? weapon.description
      : 'ЗАКРЫТО • НЕОБХОДИМО ' + weapon.unlockLevel + ' УР.',
      10, unlocked ? '#8f9eac' : '#b47c78');
    const state = selected ? 'В КОМПЛЕКТЕ · СЛОТ ' + (selectedIndex + 1)
      : !unlocked ? 'ЗАКРЫТО' : canAdd ? 'ДОБАВИТЬ' : 'НЕТ СВОБОДНОГО СЛОТА';
    this.addText(this.content!, x + 565, y + 38, state, 10,
      selected ? '#88d4a6' : unlocked && canAdd ? '#f0c16d' : '#7a8794', true);
    const hit = this.add.rectangle(x + 352, y + 50, 704, 100, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: unlocked });
    this.content!.add(hit);
    hit.on('pointerdown', () => this.toggleWeapon(weapon.id));
  }

  private drawPerks(save: ReturnType<typeof saveService.load>): void {
    this.addText(this.content!, 64, 170,
      'ПОСТОЯННЫЕ ПЕРКИ • ПОКУПКА И УЛУЧШЕНИЕ ДОСТУПНЫ В КОМПЬЮТЕРЕ АГЕНТСТВА',
      13, '#aebdca', true);
    PERKS.forEach(({ kind, label, description }, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 64 + col * 590;
      const y = 208 + row * 148;
      const level = save.upgrades[kind];
      const current = this.perkValue(kind, level);
      const max = this.perkValue(kind, BALANCE.upgradeCosts[kind].length - 1);
      const next = level + 1;
      const requiredLevel = BALANCE.upgradeTierUnlockLevels[kind][next] ?? 1;
      const locked = next < BALANCE.upgradeCosts[kind].length && getAccountLevel(save.accountXp) < requiredLevel;
      const panel = this.add.graphics();
      panel.fillStyle(0x1b2733, 0.97); panel.fillRoundedRect(x, y, 550, 128, 10);
      panel.lineStyle(1, 0x536273, 0.8); panel.strokeRoundedRect(x, y, 550, 128, 10);
      this.content!.add(panel);
      this.addText(this.content!, x + 18, y + 12, label, 16, '#f1f4f7', true);
      this.addText(this.content!, x + 18, y + 42, description, 11, '#aebdca');
      this.addText(this.content!, x + 18, y + 69, 'ТЕКУЩИЙ: ' + current + '  •  МАКСИМУМ: ' + max, 11, '#f0c16d', true);
      const state = level >= BALANCE.upgradeCosts[kind].length - 1 ? 'МАКСИМУМ'
        : locked ? 'СЛЕДУЮЩИЙ ТИР ОТКРОЕТСЯ НА УР. ' + requiredLevel : 'СЛЕДУЮЩИЙ ТИР ДОСТУПЕН В КОМПЬЮТЕРЕ';
      this.addText(this.content!, x + 18, y + 96, state, 10, '#8ac49f');
    });
  }

  private drawModifications(save: ReturnType<typeof saveService.load>): void {
    this.addText(this.content!, 64, 170,
      'ПОЛЕВЫЕ МОДИФИКАЦИИ • ОПЛАТА ДЕТАЛЯМИ ИЗ ОПЕРАЦИЙ БРАТСТВА',
      13, '#aebdca', true);
    this.addText(this.content!, 960, 168, 'ДЕТАЛИ: ' + save.components.toLocaleString('ru-RU'), 17, '#86d2a2', true);
    this.drawGearUpgrade(save, 'grenadeCapacity', 80, 222, 'УВЕЛИЧЕННЫЙ ЗАПАС ГРАНАТ',
      'Дополнительная осколочная граната в начале каждой основной операции.',
      LOADOUT_UNLOCKS.grenadesPerMission + save.gearUpgrades.grenadeCapacity + ' ГРАНАТЫ');
    const heal = Math.round((LOADOUT_UNLOCKS.medkitHealRatio + save.gearUpgrades.medkitEfficiency * 0.1) * 100);
    this.drawGearUpgrade(save, 'medkitEfficiency', 650, 222, 'УЛУЧШЕННАЯ АПТЕЧКА',
      'Повышает долю здоровья, восстанавливаемую одним использованием.',
      'ВОССТАНАВЛИВАЕТ ' + heal + '% HP');
    this.addText(this.content!, 82, 570,
      'Комплектующие выдаются только за успешные побочные операции агентов. Основная кампания не получает за них XP или доллары.',
      13, '#91a2b1');
  }

  private drawGearUpgrade(
    save: ReturnType<typeof saveService.load>, kind: GearUpgradeKind, x: number, y: number,
    title: string, description: string, currentValue: string,
  ): void {
    const costs = GEAR_UPGRADE_COSTS[kind];
    const level = save.gearUpgrades[kind];
    const next = level + 1;
    const maxed = next >= costs.length;
    const cost = maxed ? 0 : costs[next] ?? 0;
    const available = !maxed && save.components >= cost;
    const panel = this.add.graphics();
    panel.fillStyle(0x1b2733, 0.98); panel.fillRoundedRect(x, y, 540, 300, 12);
    panel.lineStyle(2, 0x7b6548, 0.7); panel.strokeRoundedRect(x, y, 540, 300, 12);
    this.content!.add(panel);
    this.addText(this.content!, x + 24, y + 22, title, 17, '#f0c16d', true);
    this.addText(this.content!, x + 24, y + 76, description, 14, '#b9c6d2');
    this.addText(this.content!, x + 24, y + 160, 'ТЕКУЩИЙ УРОВЕНЬ: ' + level + '/2', 13, '#aebdca', true);
    this.addText(this.content!, x + 24, y + 192, currentValue, 17, '#86d2a2', true);
    this.addText(this.content!, x + 24, y + 236, maxed ? 'МАКСИМАЛЬНЫЙ УРОВЕНЬ' : 'СЛЕДУЮЩИЙ УРОВЕНЬ: ' + cost + ' ДЕТАЛЕЙ',
      12, maxed ? '#80c99b' : '#d9c09a', true);
    if (!maxed) {
      this.drawButton(this.content!, x + 340, y + 234, 172, 42,
        available ? 'УЛУЧШИТЬ' : 'НЕ ХВАТАЕТ ДЕТАЛЕЙ', available ? 0x397d60 : 0x394552,
        () => this.buyGearUpgrade(kind));
    }
  }

  private drawAppearance(save: ReturnType<typeof saveService.load>): void {
    this.addText(this.content!, 64, 170,
      'КОСМЕТИКА • НЕ ВЛИЯЕТ НА УРОН, ЗАЩИТУ И ДРУГИЕ ИГРОВЫЕ ХАРАКТЕРИСТИКИ',
      13, '#aebdca', true);
    this.addText(this.content!, 82, 205, 'ФОРМА АГЕНТА', 15, '#f0c16d', true);
    this.addText(this.content!, 660, 205, 'ОТДЕЛКА ОРУЖИЯ', 15, '#f0c16d', true);
    COSMETICS.filter((item) => item.category === 'hero').forEach((item, index) => {
      this.drawCosmeticCard(item, save, 80, 238 + index * 132, 'hero');
    });
    COSMETICS.filter((item) => item.category === 'weapon').forEach((item, index) => {
      this.drawCosmeticCard(item, save, 658, 238 + index * 132, 'weapon');
    });
  }

  private drawCosmeticCard(
    item: CosmeticDefinition, save: ReturnType<typeof saveService.load>, x: number, y: number, category: 'hero' | 'weapon',
  ): void {
    const unlocked = save.cosmetics.unlocked.includes(item.id);
    const equipped = category === 'hero'
      ? save.cosmetics.heroSkinId === item.id
      : save.cosmetics.weaponSkinId === item.id;
    const panel = this.add.graphics();
    panel.fillStyle(equipped ? 0x294044 : 0x1b2733, 0.98); panel.fillRoundedRect(x, y, 530, 112, 10);
    panel.lineStyle(equipped ? 2 : 1, equipped ? 0x77c99a : 0x536273, 0.8);
    panel.strokeRoundedRect(x, y, 530, 112, 10);
    panel.fillStyle(item.tint, 1); panel.fillRoundedRect(x + 18, y + 18, 54, 76, 8);
    this.content!.add(panel);
    this.addText(this.content!, x + 88, y + 14, item.name, 13, '#f1f4f7', true);
    this.addText(this.content!, x + 88, y + 42, item.description, 10, '#aebdca');
    this.addText(this.content!, x + 88, y + 76,
      unlocked ? equipped ? 'ЭКИПИРОВАНО' : 'ОТКРЫТО' : 'ЗАКРЫТО • ' + item.componentCost + ' ДЕТАЛЕЙ',
      10, equipped ? '#83d7a4' : '#d9c09a', true);
    this.drawButton(this.content!, x + 382, y + 68, 128, 32,
      equipped ? 'ВЫБРАНО' : unlocked ? 'НАДЕТЬ' : 'ОТКРЫТЬ',
      equipped ? 0x397d60 : unlocked ? 0x315e4d : 0x394552,
      () => this.selectCosmetic(item.id));
  }

  private toggleWeapon(id: WeaponId): void {
    const save = saveService.load();
    if (!isWeaponUnlocked(id, getAccountLevel(save.accountXp))) return;
    const index = this.selectedWeapons.indexOf(id);
    if (index >= 0) {
      if (this.selectedWeapons.length === 1) {
        this.notice = 'Нужно оставить хотя бы одно оружие.';
        this.renderTab();
        return;
      }
      this.selectedWeapons.splice(index, 1);
    } else {
      if (this.selectedWeapons.length >= getWeaponSlotLimit(getAccountLevel(save.accountXp))) {
        this.notice = 'Недостаточно слотов. Следующий откроется с ростом уровня аккаунта.';
        this.renderTab();
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
    this.renderTab();
  }

  private buyGearUpgrade(kind: GearUpgradeKind): void {
    const result = saveService.purchaseGearUpgrade(kind);
    this.notice = result.success ? 'ПОЛЕВАЯ МОДИФИКАЦИЯ УЛУЧШЕНА'
      : result.reason === 'components' ? 'НЕДОСТАТОЧНО ДЕТАЛЕЙ' : 'МОДИФИКАЦИЯ УЖЕ МАКСИМАЛЬНАЯ';
    this.renderTab();
  }

  private selectCosmetic(id: CosmeticId): void {
    const save = saveService.load();
    if (!save.cosmetics.unlocked.includes(id)) {
      const result = saveService.purchaseCosmetic(id);
      if (!result.success) {
        this.notice = result.reason === 'components' ? 'НЕДОСТАТОЧНО ДЕТАЛЕЙ' : 'НЕ УДАЛОСЬ ОТКРЫТЬ КОСМЕТИКУ';
        this.renderTab();
        return;
      }
    }
    saveService.equipCosmetic(id);
    this.notice = 'ВНЕШНИЙ ВИД ОБНОВЛЁН';
    this.renderTab();
  }

  private utilityButton(
    x: number, y: number, width: number, height: number, label: string, unlocked: boolean,
    accountLevel: number, threshold: number, selected: boolean, action: () => void,
  ): void {
    const color = !unlocked ? 0x202a34 : selected ? 0x315b49 : 0x354554;
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, selected ? 0x7ac99a : 0x718291, 0.85);
    const text = !unlocked ? label + ' · ' + Math.max(0, threshold - accountLevel) + ' УР.' : label;
    const caption = this.add.text(x + width / 2, y + height / 2, text, {
      fontSize: this.isMobile ? '15px' : '13px', color: unlocked ? '#edf2f7' : '#778592',
      fontStyle: 'bold', align: 'center', wordWrap: { width: width - 18 },
    }).setOrigin(0.5);
    this.content!.add([button, caption]);
    if (unlocked) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', action);
    }
  }

  private perkValue(kind: UpgradeKind, level: number): string {
    switch (kind) {
      case 'damage': return BALANCE.weapon.damage[level] + ' урона';
      case 'magazine': return BALANCE.weapon.magazine[level] + ' патронов';
      case 'reload': return BALANCE.weapon.reloadSeconds[level].toFixed(2) + ' сек';
      case 'health': return BALANCE.player.maxHp[level] + ' HP';
      case 'armor': return Math.round(BALANCE.player.damageReduction[level] * 100) + '% защиты';
      case 'precision': return '×' + BALANCE.weapon.headMultiplier[level].toFixed(2) + ' в голову';
    }
  }

  private addText(
    container: Phaser.GameObjects.Container, x: number, y: number, value: string,
    size: number, color: string, bold = false,
  ): void {
    const text = this.add.text(x, y, value, {
      fontSize: size + 'px', color, fontStyle: bold ? 'bold' : 'normal',
      wordWrap: { width: 520 },
    });
    container.add(text);
  }

  private drawButton(
    container: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number,
    label: string, color: number, action: () => void,
  ): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, 0xffffff, 0.22).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '10px', color: '#fff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);
    container.add([button, text]);
    button.on('pointerdown', action);
  }

  private button(x: number, y: number, width: number, height: number, label: string, color: number, action: () => void): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, 0xffffff, 0.24).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerdown', action);
  }
}
