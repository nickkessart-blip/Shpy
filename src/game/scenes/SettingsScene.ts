import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { settingsService, type GameSettings, type GraphicsQuality, type MobileControlMode } from '../../settings/SettingsService';
import { FeedbackService, triggerHaptic } from '../systems/feedback/FeedbackService';

interface SettingsSceneData {
  returnTo?: string;
}

export class SettingsScene extends Phaser.Scene {
  private content?: Phaser.GameObjects.Container;
  private returnTo = 'HQ';
  private settings: GameSettings = settingsService.load();

  constructor() { super('Settings'); }

  init(data: SettingsSceneData): void {
    this.returnTo = data.returnTo ?? 'HQ';
  }

  create(): void {
    this.settings = settingsService.load();
    const background = this.add.graphics();
    background.fillGradientStyle(0x081019, 0x172331, 0x1d2934, 0x080d14, 1);
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    background.lineStyle(1, 0x506174, 0.16);
    for (let x = 0; x <= GAME_WIDTH; x += 48) background.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y <= GAME_HEIGHT; y += 48) background.lineBetween(0, y, GAME_WIDTH, y);
    background.fillStyle(0x9d3038, 0.12);
    background.fillRect(0, 0, 8, GAME_HEIGHT);

    this.add.text(56, 34, 'ПАРАМЕТРЫ СИСТЕМЫ', {
      fontSize: '30px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 3,
    });
    this.add.text(58, 82, 'КОНФИГУРАЦИЯ ОПЕРАТИВНОГО ТЕРМИНАЛА • ЛОКАЛЬНОЕ СОХРАНЕНИЕ', {
      fontSize: '12px', color: '#aebdca', letterSpacing: 1.5,
    });
    this.drawTopButton(1050, 32, 166, 46, 'НАЗАД', () => this.goBack());
    this.render();
  }

  private render(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0).setDepth(10);
    this.settings = settingsService.load();

    this.panel(54, 140, 354, 510, 'ГРАФИКА И ОТКЛИК');
    this.panel(427, 140, 354, 510, 'ЗВУК');
    this.panel(800, 140, 426, 510, 'УПРАВЛЕНИЕ');

    this.addText('КАЧЕСТВО', 78, 207, 13, '#b6c3ce', true);
    this.settingButton(78, 235, 306, 48, this.qualityLabel(this.settings.graphicsQuality), 0x394d5d,
      () => this.cycleQuality());
    this.addText('ПАРАЛЛАКС И ГЛУБИНА СЦЕНЫ', 78, 317, 12, '#b6c3ce', true);
    this.settingButton(78, 344, 306, 44, this.onOff(this.settings.parallaxEnabled), 0x30483f,
      () => this.toggleSetting('parallaxEnabled'));
    this.addText('ТРЯСКА КАМЕРЫ ПРИ ПОПАДАНИИ', 78, 415, 12, '#b6c3ce', true);
    this.settingButton(78, 442, 306, 44, this.onOff(this.settings.screenShakeEnabled), 0x30483f,
      () => this.toggleSetting('screenShakeEnabled'));
    this.addText('ТАКТИЛЬНАЯ ОТДАЧА', 78, 513, 12, '#b6c3ce', true);
    this.settingButton(78, 540, 190, 44, this.onOff(this.settings.vibrationEnabled), 0x30483f,
      () => this.toggleSetting('vibrationEnabled'));
    this.settingButton(277, 540, 107, 44, 'ТЕСТ', 0x70573b, () => {
      triggerHaptic('damage');
      FeedbackService.play(this, 'confirm');
    });
    this.addText('ВИБРАЦИЯ ЗАВИСИТ ОТ ПОДДЕРЖКИ БРАУЗЕРА И УСТРОЙСТВА.', 78, 598, 10, '#718091');

    this.addText('ГРОМКОСТЬ МУЗЫКИ', 453, 226, 13, '#b6c3ce', true);
    this.slider(453, 260, 300, this.settings.musicVolume, 0, 1,
      (value) => this.saveSettings({ musicVolume: value }, false), (value) => Math.round(value * 100) + '%');
    this.addText('ГРОМКОСТЬ ЭФФЕКТОВ', 453, 365, 13, '#b6c3ce', true);
    this.slider(453, 399, 300, this.settings.sfxVolume, 0, 1,
      (value) => this.saveSettings({ sfxVolume: value }, false), (value) => Math.round(value * 100) + '%');
    this.settingButton(453, 492, 300, 48, 'ПРОВЕРИТЬ ЗВУК', 0x70573b, () => {
      FeedbackService.play(this, 'ui');
      FeedbackService.play(this, 'confirm');
    });
    this.addText('МУЗЫКА И ЭФФЕКТЫ РЕГУЛИРУЮТСЯ НЕЗАВИСИМО.', 453, 565, 10, '#718091');

    this.addText('СХЕМА НА ANDROID', 828, 207, 13, '#b6c3ce', true);
    this.settingButton(828, 235, 370, 52,
      this.settings.mobileControlMode === 'tap' ? 'КАСАНИЕ ЭКРАНА' : 'ВИРТУАЛЬНЫЙ ДЖОЙСТИК',
      0x394d5d, () => this.cycleControlMode());
    if (this.settings.mobileControlMode === 'stick') {
      this.addText('ЧУВСТВИТЕЛЬНОСТЬ ПРИЦЕЛА', 828, 328, 13, '#b6c3ce', true);
      this.slider(828, 362, 370, this.settings.aimSensitivity, 0.5, 2.5,
        (value) => this.saveSettings({ aimSensitivity: value }, false),
        (value) => value.toFixed(1) + '×');
    } else {
      this.addText('В ЭТОМ РЕЖИМЕ ПРИЦЕЛ НАВОДИТСЯ ТАПОМ', 828, 344, 12, '#e2c28b', true);
      this.addText('ПО ИГРОВОМУ ПОЛЮ. ОТДЕЛЬНАЯ КНОПКА ОГНЯ', 828, 371, 11, '#91a1ae');
      this.addText('И ВИРТУАЛЬНЫЙ СТИК НЕ ПОКАЗЫВАЮТСЯ.', 828, 394, 11, '#91a1ae');
    }
    this.addText('КАСАНИЕ: тап по цели = выстрел.', 828, 460, 13, '#d3dce5');
    this.addText('ДЖОЙСТИК: левый стик = прицел, правая', 828, 490, 13, '#d3dce5');
    this.addText('кнопка = удержание огня. Перезарядка и', 828, 514, 13, '#d3dce5');
    this.addText('активные предметы доступны в обоих режимах.', 828, 538, 13, '#d3dce5');
    this.addText('ИЗМЕНЕНИЯ ПРИМЕНЯЮТСЯ СРАЗУ И СОХРАНЯЮТСЯ.', 828, 595, 10, '#718091');

    this.addText('ESC / КНОПКА ПАУЗЫ — ПАУЗА В МИССИИ', 56, 682, 11, '#718091');
  }

  private panel(x: number, y: number, width: number, height: number, title: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x121e29, 0.97);
    g.fillRoundedRect(x, y, width, height, 12);
    g.lineStyle(1, 0x657587, 0.55);
    g.strokeRoundedRect(x, y, width, height, 12);
    g.fillStyle(0x9d3038, 0.9);
    g.fillRoundedRect(x + 18, y + 18, 4, 24, 2);
    this.content?.add(g);
    this.addText(title, x + 34, y + 19, 16, '#f0c16d', true);
  }

  private addText(text: string, x: number, y: number, size: number, color: string, bold = false): void {
    const item = this.add.text(x, y, text, {
      fontSize: size + 'px', color, fontStyle: bold ? 'bold' : 'normal',
      fontFamily: 'Inter, Arial, sans-serif', wordWrap: { width: 360 },
    });
    this.content?.add(item);
  }

  private settingButton(x: number, y: number, width: number, height: number,
    label: string, color: number, action: () => void): void {
    const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, 1)
      .setStrokeStyle(1, 0xffffff, 0.2).setInteractive({ useHandCursor: true });
    const labelText = this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);
    this.content?.add([bg, labelText]);
    bg.on('pointerdown', () => {
      FeedbackService.play(this, 'ui');
      action();
    });
  }

  private slider(x: number, y: number, width: number, value: number, min: number, max: number,
    onChange: (value: number) => void, format: (value: number) => string): void {
    const trackY = y + 17;
    const track = this.add.rectangle(x + width / 2, trackY, width, 8, 0x09121b)
      .setStrokeStyle(1, 0x566574, 0.8);
    const ratio = (value - min) / (max - min);
    const fill = this.add.rectangle(x, trackY, width * ratio, 6, 0xc38e52).setOrigin(0, 0.5);
    const knob = this.add.circle(x + width * ratio, trackY, 11, 0xf0d4a4).setStrokeStyle(2, 0x182431, 1);
    const valueText = this.add.text(x + width, y - 27, format(value), {
      fontSize: '13px', color: '#f0c16d', fontStyle: 'bold',
    }).setOrigin(1, 0);
    const hitArea = this.add.rectangle(x + width / 2, trackY, width + 28, 42, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    this.content?.add([track, fill, knob, valueText, hitArea]);
    const setFromPointer = (pointer: Phaser.Input.Pointer): void => {
      const nextRatio = Phaser.Math.Clamp((pointer.x - x) / width, 0, 1);
      const next = Math.round((min + nextRatio * (max - min)) * 100) / 100;
      const actualRatio = (next - min) / (max - min);
      fill.setSize(width * actualRatio, 6);
      knob.setX(x + width * actualRatio);
      valueText.setText(format(next));
      onChange(next);
    };
    hitArea.on('pointerdown', setFromPointer);
    hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) setFromPointer(pointer);
    });
  }

  private drawTopButton(x: number, y: number, width: number, height: number,
    label: string, action: () => void): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x39495a)
      .setStrokeStyle(1, 0xffffff, 0.25).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerdown', action);
  }

  private saveSettings(patch: Partial<GameSettings>, redraw: boolean): void {
    this.settings = settingsService.update(patch);
    FeedbackService.applyMusicVolume();
    if (redraw) this.render();
  }

  private cycleQuality(): void {
    const next: GraphicsQuality = this.settings.graphicsQuality === 'low' ? 'balanced'
      : this.settings.graphicsQuality === 'balanced' ? 'high' : 'low';
    this.saveSettings({ graphicsQuality: next }, true);
  }

  private cycleControlMode(): void {
    const next: MobileControlMode = this.settings.mobileControlMode === 'tap' ? 'stick' : 'tap';
    this.saveSettings({ mobileControlMode: next }, true);
  }

  private toggleSetting(key: 'parallaxEnabled' | 'screenShakeEnabled' | 'vibrationEnabled'): void {
    this.saveSettings({ [key]: !this.settings[key] }, true);
  }

  private qualityLabel(value: GraphicsQuality): string {
    return value === 'low' ? 'НИЗКОЕ • ЭКОНОМИЯ РЕСУРСОВ'
      : value === 'high' ? 'ВЫСОКОЕ • ПОЛНЫЕ ЭФФЕКТЫ' : 'СБАЛАНСИРОВАННОЕ';
  }

  private onOff(value: boolean): string {
    return value ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО';
  }

  private goBack(): void {
    FeedbackService.play(this, 'ui');
    if (this.returnTo === 'Mission') {
      this.scene.stop();
      this.scene.resume('Mission');
      return;
    }
    const allowed = ['Start', 'HQ', 'Operations', 'Computer', 'Loadout', 'Results'];
    this.scene.start(allowed.includes(this.returnTo) ? this.returnTo : 'HQ');
  }
}
