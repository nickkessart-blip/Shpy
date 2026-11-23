import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import { saveService } from '../../persistence/SaveService';
import { BALANCE } from '../data/balance';
import { getWeapon, getWeaponStats, LOADOUT_UNLOCKS, type WeaponId } from '../data/arsenal';
import { ENEMIES, type EnemyType } from '../data/enemies';
import { CASINO_MISSION, type MissionSceneDefinition, type SpawnPoint } from '../data/missions';
import { AssetCatalog } from '../assets/AssetCatalog';
import { getCosmetic } from '../data/cosmetics';
import { findVisiblePeekX, pointInRect, resolveHit, type Point } from '../systems/combat/combatMath';
import { runSession } from '../systems/missions/runSession';
import { settingsService, type GameSettings } from '../../settings/SettingsService';
import { moveAim } from '../systems/input/aimMath';
import { FeedbackService, triggerHaptic } from '../systems/feedback/FeedbackService';

type EnemyState = 'Exposed' | 'Aiming' | 'Attacking' | 'SeekingCover' | 'Hidden' | 'Peeking' | 'Repositioning' | 'Defeated';
interface RuntimeEnemy {
  uid: number; type: EnemyType; x: number; baseX: number; y: number; originY: number; hp: number; maxHp: number;
  coverId?: string; state: EnemyState; timer: number; phase: number; bossPhase: 0 | 1 | 2; hitFlash: number;
}

const MUZZLE: Point = { x: GAME_WIDTH / 2, y: 662 };
const SPRITES: Record<EnemyType, string> = {
  guard: 'enemy-guard', armored: 'enemy-armored', assault: 'enemy-assault', boss: 'enemy-boss',
};

export class MissionScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Graphics;
  private world!: Phaser.GameObjects.Graphics;
  private coverLayer!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private weaponRig?: Phaser.GameObjects.Container;
  private impactEffects: Array<{ x: number; y: number; life: number; maxLife: number; kind: 'hit' | 'cover' | 'miss' | 'explosion'; damage: number }> = [];
  private selectedWeapons: WeaponId[] = ['pistol'];
  private currentWeaponId: WeaponId = 'pistol';
  private weaponAmmo = new Map<WeaponId, { magazine: number; reserve: number }>();
  private grenadeCount = 0;
  private medkitCount = 0;
  private reloadPose = 0;
  private weaponRecoil = 0;
  private playerHitFlash = 0;
  private hud!: Phaser.GameObjects.Text;
  private hudMissionText!: Phaser.GameObjects.Text;
  private hudAmmoText!: Phaser.GameObjects.Text;
  private hudWeaponImage?: Phaser.GameObjects.Image;
  private hudPanel!: Phaser.GameObjects.Graphics;
  private hudBars!: Phaser.GameObjects.Graphics;
  private hudIcons!: Phaser.GameObjects.Graphics;
  private parallaxFar?: Phaser.GameObjects.Graphics;
  private parallaxMid?: Phaser.GameObjects.Graphics;
  private parallaxNear?: Phaser.GameObjects.Graphics;
  private currentSettings: GameSettings = settingsService.load();
  private message!: Phaser.GameObjects.Text;
  private reloadHint!: Phaser.GameObjects.Text;
  private backgroundArt?: Phaser.GameObjects.Image;
  private transitionOverlay?: Phaser.GameObjects.Container;
  private transitionWalkTweens: Phaser.Tweens.Tween[] = [];
  private aim: Point = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  private enemies: RuntimeEnemy[] = [];
  private sceneIndex = 0;
  private waveIndex = 0;
  private spawnTimer = 300;
  private phase: 'active' | 'transition' | 'finished' | 'paused' = 'active';
  private maxHp: number = BALANCE.player.maxHp[0];
  private hp: number = BALANCE.player.maxHp[0];
  private magazine: number = BALANCE.weapon.magazine[0];
  private reserve: number = BALANCE.weapon.reserveAmmo;
  private reloading = 0;
  private shotCooldown = 0;
  private shotFlash = 0;
  private toastTimer = 0;
  private toastText = '';
  private startedAt = 0;
  private kills = 0;
  private shots = 0;
  private hits = 0;
  private damageTaken = 0;
  private accountXpEarned = 0;
  private dollarsEarned = 0;
  private totalAccountXp = 0;
  private waveAwarded = false;
  private uniqueId = 1;
  private sceneDef!: MissionSceneDefinition;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private resultSent = false;
  private isMobileControls = false;
  private mobileFireHeld = false;
  private desktopFireHeld = false;
  private mobileControlsElement?: HTMLDivElement;
  private mobileSwitchButton?: HTMLButtonElement;
  private mobileSwitchCaption?: HTMLSpanElement;
  private mobileFireButton?: HTMLButtonElement;
  private mobileGrenadeCaption?: HTMLSpanElement;
  private mobileMedkitCaption?: HTMLSpanElement;
  private mobileAimStick?: HTMLDivElement;
  private mobileGrenadeButton?: HTMLButtonElement;
  private mobileMedkitButton?: HTMLButtonElement;
  private mobileReleaseHandler?: (event: PointerEvent) => void;
  private mobileFirePointerId: number | null = null;
  private aimStickVector: Point = { x: 0, y: 0 };
  private aimStickActive = false;
  private aimStickPointerId: number | null = null;
  private appliedMobileControlMode: 'tap' | 'stick' = 'stick';

  constructor() { super('Mission'); }

  create(): void {
    // Phaser reuses Scene instances. Reset every run-scoped value before building the scene again.
    const initialSave = saveService.load();
    this.currentSettings = settingsService.load();
    this.appliedMobileControlMode = this.currentSettings.mobileControlMode;
    FeedbackService.ensureMusic(this);
    this.startedAt = Date.now();
    this.aim = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    this.enemies = [];
    this.sceneIndex = 0;
    this.waveIndex = 0;
    this.spawnTimer = 300;
    this.phase = 'active';
    this.maxHp = BALANCE.player.maxHp[initialSave.upgrades.health];
    this.hp = this.maxHp;
    this.selectedWeapons = initialSave.loadout.weapons.length > 0 ? [...initialSave.loadout.weapons] : ['pistol'];
    this.currentWeaponId = this.selectedWeapons[0] ?? 'pistol';
    this.weaponAmmo = new Map();
    for (const weaponId of this.selectedWeapons) {
      const stats = getWeaponStats(weaponId, initialSave.upgrades);
      this.weaponAmmo.set(weaponId, { magazine: stats.magazine, reserve: stats.reserveAmmo });
    }
    const startingAmmo = this.weaponAmmo.get(this.currentWeaponId);
    this.magazine = startingAmmo?.magazine ?? BALANCE.weapon.magazine[initialSave.upgrades.magazine];
    this.reserve = startingAmmo?.reserve ?? BALANCE.weapon.reserveAmmo;
    this.grenadeCount = initialSave.loadout.tacticalItem === 'grenade'
      ? LOADOUT_UNLOCKS.grenadesPerMission + initialSave.gearUpgrades.grenadeCapacity : 0;
    this.medkitCount = initialSave.loadout.activeItem === 'medkit' ? LOADOUT_UNLOCKS.medkitsPerMission : 0;
    this.reloading = 0;
    this.reloadPose = 0;
    this.shotCooldown = 0;
    this.shotFlash = 0;
    this.toastTimer = 0;
    this.toastText = '';
    this.kills = 0;
    this.shots = 0;
    this.hits = 0;
    this.damageTaken = 0;
    this.accountXpEarned = 0;
    this.dollarsEarned = 0;
    this.totalAccountXp = initialSave.accountXp;
    this.waveAwarded = false;
    this.uniqueId = 1;
    this.resultSent = false;
    this.pauseOverlay = undefined;
    this.backgroundArt = undefined;
    this.transitionOverlay = undefined;
    this.transitionWalkTweens = [];
    this.isMobileControls = hasTouchInput()
      || (typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) <= 800);
    this.mobileFireHeld = false;
    this.desktopFireHeld = false;
    this.mobileFirePointerId = null;
    this.aimStickVector = { x: 0, y: 0 };
    this.aimStickActive = false;
    this.aimStickPointerId = null;
    this.mobileFireButton = undefined;
    this.mobileAimStick = undefined;
    this.mobileControlsElement?.remove();
    this.mobileControlsElement = undefined;
    this.impactEffects = [];
    this.weaponRecoil = 0;
    this.playerHitFlash = 0;
    this.backdrop = this.add.graphics().setDepth(-20);
    this.parallaxFar = this.add.graphics().setDepth(-9);
    this.parallaxMid = this.add.graphics().setDepth(-7);
    this.parallaxNear = this.add.graphics().setDepth(-4);
    this.world = this.add.graphics().setDepth(0);
    this.coverLayer = this.add.graphics().setDepth(8);
    this.fx = this.add.graphics().setDepth(20);
    this.buildWeaponRig();
    this.hudWeaponImage = undefined;
    this.hudPanel = this.add.graphics().setDepth(29);
    this.hudBars = this.add.graphics().setDepth(30);
    this.hudIcons = this.add.graphics().setDepth(31);
    this.hud = this.add.text(78, 20, '', {
      fontSize: '14px', color: '#f0c16d', fontStyle: 'bold', fontFamily: 'Arial, sans-serif',
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true },
    }).setDepth(32);
    this.hudMissionText = this.add.text(78, 61, '', {
      fontSize: '13px', color: '#cbd5df', fontStyle: 'bold', fontFamily: 'Arial, sans-serif',
    }).setDepth(32);
    this.hudAmmoText = this.add.text(1030, 28, '', {
      fontSize: '25px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial, sans-serif',
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true },
    }).setDepth(32);
    if (AssetCatalog.hasTexture(this, 'weapon-' + this.currentWeaponId)) {
      this.hudWeaponImage = this.add.image(940, 57, 'weapon-' + this.currentWeaponId)
        .setDisplaySize(42, 70).setDepth(32);
    }
    this.message = this.add.text(GAME_WIDTH / 2, 112, '', {
      fontSize: this.isMobileControls ? '26px' : '18px', color: '#f0c16d', fontStyle: 'bold', align: 'center',
      backgroundColor: '#111821cc', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(30);
    this.reloadHint = this.add.text(1120, 653, 'R  ПЕРЕЗАРЯДКА', {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#7d2930', padding: { x: 12, y: 9 },
    }).setOrigin(0.5).setDepth(30);
    this.reloadHint.setVisible(!this.isMobileControls);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const tapMode = !this.isMobileControls || this.currentSettings.mobileControlMode === 'tap';
      if (tapMode && !this.isMobileControlPoint(pointer.x, pointer.y)) {
        this.aim = { x: pointer.x, y: pointer.y };
      }
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const tapMode = !this.isMobileControls || this.currentSettings.mobileControlMode === 'tap';
      if (this.phase !== 'active' || !tapMode || this.isMobileControlPoint(pointer.x, pointer.y)) return;
      this.aim = { x: pointer.x, y: pointer.y };
      if (!this.isMobileControls) this.desktopFireHeld = true;
      this.shoot();
    });
    this.input.on('pointerup', () => { this.desktopFireHeld = false; });
    this.events.on(Phaser.Scenes.Events.RESUME, this.onMissionResume, this);
    if (this.isMobileControls) this.buildMobileControls();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onMissionResume, this);
      this.desktopFireHeld = false;
      this.disposeMobileControls();
    });
    this.input.keyboard?.on('keydown-R', () => this.reload());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Digit1' || event.code === 'Numpad1') this.selectWeaponSlot(0);
      if (event.code === 'Digit2' || event.code === 'Numpad2') this.selectWeaponSlot(1);
      if (event.code === 'Digit3' || event.code === 'Numpad3') this.selectWeaponSlot(2);
      if (event.code === 'KeyG') this.useGrenade();
      if (event.code === 'KeyQ') this.useMedkit();
    });

    this.loadMissionScene(0);
    this.showToast('УСТРАНИТЕ ВСЕХ ПРОТИВНИКОВ', 1800);
  }

  private buildWeaponRig(): void {
    const rig = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + 95).setDepth(18);
    const appearance = saveService.load().cosmetics;
    const weaponTint = getCosmetic(appearance.weaponSkinId).tint;
    const heroTint = getCosmetic(appearance.heroSkinId).tint;
    const textureKey = 'weapon-' + this.currentWeaponId;
    if (AssetCatalog.hasTexture(this, textureKey)) {
      rig.add(this.add.image(0, -190, textureKey).setDisplaySize(180, 380).setTint(weaponTint));
      const cuff = this.add.graphics();
      cuff.fillStyle(heroTint, 0.95); cuff.fillRoundedRect(-36, -54, 72, 22, 8);
      rig.add(cuff);
      this.weaponRig = rig;
      this.updateWeaponRig();
      return;
    }
    const art = this.add.graphics();
    // Arm, hand and service pistol rotate as one rig and track the reticle.
    art.fillStyle(0x111923, 1); art.fillRoundedRect(-58, -218, 116, 190, 28);
    art.fillStyle(heroTint, 1); art.fillRoundedRect(-51, -211, 102, 176, 24);
    art.fillStyle(0x485564, 1); art.fillRoundedRect(-48, -208, 96, 14, 7);
    art.fillStyle(0xb78365, 1); art.fillRoundedRect(-28, -202, 56, 76, 15);
    art.fillStyle(0x9b6b52, 1); art.fillRoundedRect(-23, -180, 46, 46, 12);
    art.fillStyle(weaponTint, 1); art.fillRoundedRect(-22, -354, 44, 188, 7);
    art.fillStyle(0x394550, 1); art.fillRoundedRect(-18, -350, 36, 143, 5);
    art.fillStyle(0x1b242d, 1); art.fillRoundedRect(-16, -218, 32, 70, 5);
    art.fillStyle(0x0c1117, 1); art.fillRoundedRect(-13, -166, 26, 67, 5);
    art.fillStyle(0x687783, 1); art.fillRect(-10, -338, 20, 4);
    art.fillStyle(0x0b1016, 1); art.fillRoundedRect(-8, -357, 16, 9, 3);
    art.lineStyle(2, 0x9eabb5, 0.65); art.lineBetween(-15, -310, 15, -310);
    art.lineStyle(2, 0x4f5d69, 0.8); art.lineBetween(-17, -235, 17, -235);
    rig.add(art);
    this.weaponRig = rig;
    this.updateWeaponRig();
  }

  private updateWeaponRig(): void {
    if (!this.weaponRig) return;
    // Direct reticle tracking: the hands translate and rotate without tween lag.
    const followX = Phaser.Math.Clamp((this.aim.x - GAME_WIDTH / 2) * 0.11, -72, 72);
    const followY = Phaser.Math.Clamp((this.aim.y - GAME_HEIGHT / 2) * 0.055, -20, 22);
    const originX = GAME_WIDTH / 2 + followX;
    const originY = GAME_HEIGHT + 95 + this.weaponRecoil + this.reloadPose * 38 + followY;
    this.weaponRig.setPosition(originX, originY);
    this.weaponRig.setRotation(Phaser.Math.Angle.Between(originX, originY, this.aim.x, this.aim.y)
      + Math.PI / 2 + this.reloadPose * 0.12);
  }

  private getWeaponMuzzle(): Point {
    const rig = this.weaponRig;
    const rotation = rig?.rotation ?? 0;
    const originX = rig?.x ?? GAME_WIDTH / 2;
    const originY = rig?.y ?? GAME_HEIGHT + 95 + this.weaponRecoil;
    return { x: originX + 357 * Math.sin(rotation), y: originY - 357 * Math.cos(rotation) };
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'paused' || this.phase === 'finished') return;
    const dt = Math.min(delta, 50);
    const inputDelta = Math.min(Math.max(0, delta), 120);
    this.shotCooldown = Math.max(0, this.shotCooldown - inputDelta);
    if (this.aimStickActive && this.phase === 'active') {
      this.aim = moveAim(this.aim, this.aimStickVector, this.currentSettings.aimSensitivity,
        inputDelta, GAME_WIDTH, GAME_HEIGHT);
    }
    const lookX = this.aim.x / GAME_WIDTH - 0.5;
    const lookY = this.aim.y / GAME_HEIGHT - 0.5;
    const parallaxEnabled = this.currentSettings.parallaxEnabled && this.currentSettings.graphicsQuality !== 'low';
    this.parallaxFar?.setPosition(parallaxEnabled ? -lookX * 4 : 0, parallaxEnabled ? -lookY * 2 : 0);
    this.parallaxMid?.setPosition(parallaxEnabled ? -lookX * 9 : 0, parallaxEnabled ? -lookY * 4 : 0);
    this.parallaxNear?.setPosition(parallaxEnabled ? lookX * 13 : 0, parallaxEnabled ? lookY * 6 : 0);
    if (this.parallaxFar) this.parallaxFar.setAlpha(parallaxEnabled ? 0.84 + Math.sin(this.time.now / 900) * 0.025 : 0);
    if ((this.mobileFireHeld || this.desktopFireHeld) && this.phase === 'active'
      && getWeapon(this.currentWeaponId).fireMode !== 'semi') this.shoot();
    this.shotFlash = Math.max(0, this.shotFlash - inputDelta);
    this.weaponRecoil = Math.max(0, this.weaponRecoil - inputDelta * 0.16);
    this.reloadPose = Math.max(0, this.reloadPose - inputDelta * 0.0045);
    this.playerHitFlash = Math.max(0, this.playerHitFlash - inputDelta);
    for (const effect of this.impactEffects) effect.life -= inputDelta;
    this.impactEffects = this.impactEffects.filter((effect) => effect.life > 0);
    this.toastTimer = Math.max(0, this.toastTimer - inputDelta);

    if (this.phase === 'transition') {
      this.drawFrame();
      return;
    }

    if (this.reloading > 0) {
      this.reloading -= inputDelta;
      if (this.reloading <= 0) this.finishReload();
    }
    this.updateEnemies(dt);
    this.updateWaveFlow(dt);
    this.drawFrame();
    if (this.hp <= 0) this.finishMission(false);
  }

  private loadMissionScene(index: number): void {
    if (index >= CASINO_MISSION.length) { this.finishMission(true); return; }
    this.sceneIndex = index;
    this.sceneDef = CASINO_MISSION[index];
    this.backgroundArt?.destroy();
    this.backgroundArt = undefined;
    this.children.getAll().forEach((child) => {
      if (child.name.startsWith('enemy-image-') || child.name.startsWith('boss-name-') || child.name.startsWith('cover-image-')) child.destroy();
    });
    const bgKey = AssetCatalog.imageKeyFor(this.sceneDef.backgroundSlot);
    if (AssetCatalog.hasTexture(this, bgKey)) {
      this.backgroundArt = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-10);
    }
    this.enemies = [];
    this.waveIndex = 0;
    this.spawnTimer = 350;
    this.waveAwarded = false;
    this.phase = 'active';
    this.drawBackground();
    this.showToast(this.sceneDef.subtitle + ' • СЦЕНА ' + (index + 1) + '/' + CASINO_MISSION.length, 1500);
  }

  private drawBackground(): void {
    this.backdrop.clear();
    this.backdrop.fillGradientStyle(0x18212c, 0x18212c, 0x292a31, 0x121820, 1);
    this.backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.backdrop.fillStyle(0x8c3333, 0.13); this.backdrop.fillRect(0, 100, GAME_WIDTH, 340);
    this.backdrop.fillStyle(0xe9b868, 0.09); this.backdrop.fillRect(0, 100, GAME_WIDTH, 10);
    for (let i = 0; i < 9; i += 1) {
      const x = 80 + i * 140;
      this.backdrop.fillStyle(0xf3bd66, 0.09); this.backdrop.fillCircle(x, 180, 54);
      this.backdrop.fillStyle(0x111820, 0.42); this.backdrop.fillRect(x - 43, 230, 86, 190);
    }
    this.backdrop.fillStyle(0x8c242b, 0.5); this.backdrop.fillRect(0, 515, GAME_WIDTH, 90);
    this.backdrop.lineStyle(2, 0xc58c4b, 0.36); this.backdrop.lineBetween(0, 515, GAME_WIDTH, 515);
    this.backdrop.fillStyle(0x242c37, 1); this.backdrop.fillRect(0, 590, GAME_WIDTH, 130);
    this.drawParallaxLayers();
  }

  private drawParallaxLayers(): void {
    const far = this.parallaxFar;
    const mid = this.parallaxMid;
    const near = this.parallaxNear;
    if (!far || !mid || !near) return;
    far.clear(); mid.clear(); near.clear();
    if (this.currentSettings.graphicsQuality === 'low') return;

    far.fillStyle(0x09131e, 0.52);
    for (let i = 0; i < 13; i += 1) {
      const x = -24 + i * 108;
      const top = 92 + (i % 4) * 22;
      const width = 82 + (i % 3) * 14;
      far.fillRect(x, top, width, 360 - top);
      far.fillStyle(0xd4a56b, 0.16);
      for (let row = 0; row < 7; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          if ((i + row + col) % 3 !== 0) far.fillRect(x + 12 + col * 21, top + 28 + row * 34, 7, 12);
        }
      }
      far.fillStyle(0x09131e, 0.52);
    }

    mid.fillStyle(0x14202b, 0.34);
    for (let i = 0; i < 8; i += 1) {
      const x = i * 188 - 42;
      mid.fillRoundedRect(x, 138 + (i % 2) * 12, 42, 388, 7);
      mid.fillStyle(0xd2a26d, 0.12);
      mid.fillRect(x + 9, 154, 4, 300);
      mid.fillStyle(0x14202b, 0.34);
    }

    near.fillStyle(0x080e15, 0.18);
    near.fillRoundedRect(-40, 476, 250, 118, 22);
    near.fillRoundedRect(GAME_WIDTH - 230, 462, 270, 132, 22);
    near.lineStyle(2, 0xd4ad72, 0.17);
    near.lineBetween(0, 520, 214, 520);
    near.lineBetween(GAME_WIDTH - 210, 510, GAME_WIDTH, 510);
    if (this.currentSettings.graphicsQuality === 'high') {
      near.fillStyle(0xf0c16d, 0.11);
      for (let i = 0; i < 24; i += 1) {
        const x = (i * 173) % GAME_WIDTH;
        const y = 470 + ((i * 47) % 105);
        near.fillCircle(x, y, 1 + (i % 2));
      }
    }
  }

  private spawnWave(): void {
    const wave = this.sceneDef.waves[this.waveIndex];
    if (!wave) return;
    this.enemies = wave.enemies.map((type, index) => {
      const spawn: SpawnPoint = wave.spawnPoints[index] ?? { x: 300 + index * 190, y: 350 };
      return {
        uid: this.uniqueId++, type, x: spawn.x, baseX: spawn.x, y: spawn.y, originY: spawn.y,
        hp: ENEMIES[type].hp, maxHp: ENEMIES[type].hp, coverId: spawn.coverId,
        state: 'Exposed', timer: ENEMIES[type].exposeMs * (0.4 + index * 0.22), phase: 0, bossPhase: 0, hitFlash: 0,
      };
    });
    this.waveAwarded = false;
    this.showToast(wave.enemies.includes('boss') ? 'ТРЕВОГА • НАЧАЛЬНИК ОХРАНЫ ВЫШЕЛ НА СЦЕНУ'
      : 'ВОЛНА ' + (this.waveIndex + 1) + '/' + this.sceneDef.waves.length, wave.enemies.includes('boss') ? 2200 : 1200);
  }

  private updateWaveFlow(dt: number): void {
    if (this.enemies.length === 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) this.spawnWave();
      return;
    }
    const living = this.enemies.filter((enemy) => enemy.state !== 'Defeated');
    if (living.length !== 0 || this.waveAwarded) return;
    this.waveAwarded = true;
    this.award(BALANCE.rewards.xp.wave, BALANCE.rewards.dollars.wave);
    this.clearEnemySprites();
    this.waveIndex += 1;
    if (this.waveIndex < this.sceneDef.waves.length) {
      this.enemies = [];
      this.spawnTimer = 900;
    } else if (this.sceneIndex + 1 < CASINO_MISSION.length) {
      this.beginLocationTransition();
    } else {
      this.finishMission(true);
    }
  }

  private clearEnemySprites(): void {
    for (const child of this.children.getAll()) {
      if (child.name.startsWith('enemy-image-') || child.name.startsWith('boss-name-')) child.destroy();
    }
  }

  private beginLocationTransition(): void {
    const nextScene = CASINO_MISSION[this.sceneIndex + 1];
    if (!nextScene) {
      this.finishMission(true);
      return;
    }

    this.phase = 'transition';
    this.mobileFireHeld = false;
    this.reloading = 0;
    this.hp = Math.min(this.maxHp, this.hp + BALANCE.supplies.intermissionHealing);
    const upgrades = saveService.load().upgrades;
    for (const weaponId of this.selectedWeapons) {
      const ammo = this.weaponAmmo.get(weaponId);
      const supply = getWeaponStats(weaponId, upgrades).intermissionAmmo;
      if (ammo) ammo.reserve += supply;
    }
    const currentAmmo = this.weaponAmmo.get(this.currentWeaponId);
    if (currentAmmo) { this.magazine = currentAmmo.magazine; this.reserve = currentAmmo.reserve; }

    const hallway = this.add.graphics();
    hallway.fillGradientStyle(0x101821, 0x101821, 0x26313b, 0x111820, 1);
    hallway.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    hallway.fillStyle(0x0b1118, 1);
    hallway.fillRect(0, 0, GAME_WIDTH, 82);
    hallway.fillStyle(0x1c2732, 1);
    hallway.fillRect(0, 82, GAME_WIDTH, 350);
    hallway.fillStyle(0x252e37, 1);
    hallway.fillRect(0, 432, GAME_WIDTH, 288);
    hallway.lineStyle(3, 0x526171, 0.45);
    hallway.lineBetween(0, 82, GAME_WIDTH, 82);
    hallway.lineBetween(0, 432, GAME_WIDTH, 432);
    hallway.lineStyle(2, 0x687888, 0.24);
    hallway.lineBetween(0, 432, 510, 720);
    hallway.lineBetween(GAME_WIDTH, 432, 770, 720);
    hallway.lineBetween(210, 432, 555, 720);
    hallway.lineBetween(1070, 432, 725, 720);
    for (let i = 0; i < 5; i += 1) {
      const x = 150 + i * 220;
      hallway.fillStyle(0xc28e50, 0.12);
      hallway.fillRoundedRect(x, 112, 94, 10, 4);
      hallway.lineStyle(2, 0x738393, 0.22);
      hallway.lineBetween(x + 46, 150, x + 46, 410);
    }

    const exit = this.add.graphics();
    exit.fillStyle(0x080d13, 1);
    exit.fillRect(1055, 165, 150, 300);
    exit.lineStyle(8, 0x8f704d, 0.95);
    exit.strokeRect(1055, 165, 150, 300);
    exit.lineStyle(2, 0xe5bd7b, 0.75);
    exit.lineBetween(1080, 190, 1180, 190);
    exit.fillStyle(0xe6b66e, 0.9);
    exit.fillRect(1092, 207, 76, 5);

    const actor = this.createWalkingActor();
    const title = this.add.text(GAME_WIDTH / 2, 88, 'СЕКТОР ЗАЧИЩЕН', {
      fontSize: '34px', color: '#f2d2a1', fontStyle: 'bold',
      stroke: '#10161d', strokeThickness: 6, letterSpacing: 3,
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, 132, 'ПЕРЕХОД: ' + nextScene.title.toUpperCase(), {
      fontSize: '18px', color: '#d5dee7', fontStyle: 'bold',
      stroke: '#10161d', strokeThickness: 4, letterSpacing: 2,
    }).setOrigin(0.5);
    this.transitionOverlay = this.add.container(0, 0, [hallway, exit, actor, title, subtitle]).setDepth(100);

    this.transitionWalkTweens.push(this.tweens.add({
      targets: actor,
      x: GAME_WIDTH + 100,
      duration: 3200,
      ease: 'Linear',
      onComplete: () => this.finishLocationTransition(),
    }));
  }

  private createWalkingActor(): Phaser.GameObjects.Container {
    const actor = this.add.container(-90, 620);
    actor.add(this.add.ellipse(0, 0, 72, 16, 0x05080c, 0.55));

    const leftLeg = this.add.container(-12, -68);
    leftLeg.add(this.add.rectangle(0, 18, 15, 39, 0x17212b).setOrigin(0.5, 0));
    leftLeg.add(this.add.rectangle(0, 54, 13, 33, 0x111922).setOrigin(0.5, 0));
    leftLeg.add(this.add.rectangle(-2, 84, 23, 9, 0x070b10).setOrigin(0.35, 0.5));

    const rightLeg = this.add.container(12, -68);
    rightLeg.add(this.add.rectangle(0, 18, 15, 39, 0x263340).setOrigin(0.5, 0));
    rightLeg.add(this.add.rectangle(0, 54, 13, 33, 0x17212b).setOrigin(0.5, 0));
    rightLeg.add(this.add.rectangle(2, 84, 23, 9, 0x070b10).setOrigin(0.35, 0.5));

    const heroTint = getCosmetic(saveService.load().cosmetics.heroSkinId).tint;
    const torso = this.add.rectangle(0, -111, 52, 78, heroTint).setStrokeStyle(2, 0x526171, 0.55);
    const belt = this.add.rectangle(0, -79, 49, 8, 0x101820);
    const leftArm = this.add.rectangle(-34, -119, 17, 66, 0x1b2631).setRotation(-0.12);
    const rightArm = this.add.rectangle(34, -118, 17, 66, 0x1b2631).setRotation(0.15);
    const pistol = this.add.rectangle(43, -88, 27, 8, 0x0a0f15).setRotation(-0.08);
    const head = this.add.circle(0, -164, 18, 0x94745e);
    const hair = this.add.ellipse(0, -174, 37, 21, 0x111820);

    actor.add([leftLeg, rightLeg, torso, belt, leftArm, rightArm, pistol, head, hair]);
    this.transitionWalkTweens.push(this.tweens.add({
      targets: leftLeg, angle: 24, duration: 190, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    }));
    this.transitionWalkTweens.push(this.tweens.add({
      targets: rightLeg, angle: -24, duration: 190, delay: 95, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    }));
    this.transitionWalkTweens.push(this.tweens.add({
      targets: actor, y: 614, duration: 230, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    }));
    return actor;
  }

  private finishLocationTransition(): void {
    for (const tween of this.transitionWalkTweens) tween.stop();
    this.transitionWalkTweens = [];

    const curtain = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080c, 1)
      .setAlpha(0).setDepth(120);
    this.tweens.add({
      targets: curtain,
      alpha: 1,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.transitionOverlay?.destroy(true);
        this.transitionOverlay = undefined;
        this.loadMissionScene(this.sceneIndex + 1);
        this.phase = 'transition';
        this.tweens.add({
          targets: curtain,
          alpha: 0,
          duration: 620,
          ease: 'Quad.easeOut',
          onComplete: () => {
            curtain.destroy();
            this.phase = 'active';
            this.showToast('СНАБЖЕНИЕ: +' + BALANCE.supplies.intermissionHealing + ' HP • +'
              + BALANCE.supplies.intermissionAmmo + ' ПАТРОНОВ • ' + this.sceneDef.subtitle, 2100);
          },
        });
      },
    });
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      if (enemy.state === 'Defeated') continue;
      enemy.timer -= dt;
      if (enemy.timer > 0) continue;
      const def = ENEMIES[enemy.type];
      switch (enemy.state) {
        case 'Exposed': {
          const bossAimScale = enemy.type === 'boss' ? [1, 0.8, 0.62][enemy.bossPhase] : 1;
          enemy.state = 'Aiming'; enemy.timer = Math.round(def.aimMs * bossAimScale); break;
        }
        case 'Aiming': {
          const bossDamageScale = enemy.type === 'boss' ? [1, 1.25, 1.5][enemy.bossPhase] : 1;
          enemy.state = 'Attacking'; enemy.timer = 260;
          this.damagePlayer(Math.round(def.damage * bossDamageScale)); break;
        }
        case 'Attacking': {
          if (enemy.type === 'boss') {
            enemy.state = 'Repositioning'; enemy.timer = Math.max(220, 440 - enemy.bossPhase * 90);
            enemy.x = Math.max(110, Math.min(GAME_WIDTH - 110, enemy.baseX + (enemy.phase % 2 === 0 ? -104 : 104)));
            enemy.phase += 1; break;
          }
          enemy.state = 'SeekingCover'; enemy.timer = 320;
          const cover = this.sceneDef.covers.find((item) => item.id === enemy.coverId);
          if (cover) this.tweens.add({ targets: enemy, x: cover.x + cover.width / 2,
            y: cover.y + cover.height / 2 + 20, duration: 320, ease: 'Sine.easeIn' });
          break;
        }
        case 'SeekingCover':
          enemy.state = 'Hidden';
          enemy.timer = def.hiddenMs;
          break;
        case 'Hidden': {
          enemy.state = 'Peeking';
          enemy.timer = def.peekMs;
          enemy.phase += 1;
          const cover = this.sceneDef.covers.find((item) => item.id === enemy.coverId);
          if (cover) enemy.x = findVisiblePeekX(MUZZLE, cover);
          enemy.y = enemy.originY;
          break;
        }
        case 'Peeking': {
          enemy.state = 'Repositioning';
          enemy.timer = enemy.type === 'assault' ? 260 : 390;
          const cover = this.sceneDef.covers.find((item) => item.id === enemy.coverId);
          if (cover) {
            // Move to the side of the cover facing the player so the enemy can be hit while peeking.
            enemy.x = findVisiblePeekX(MUZZLE, cover);
          } else {
            enemy.x = enemy.baseX + (enemy.phase % 2 === 0 ? -52 : 52);
          }
          break;
        }
        case 'Repositioning':
          enemy.state = 'Exposed'; enemy.baseX = enemy.type === 'boss' ? 640 : enemy.x;
          enemy.timer = enemy.type === 'boss' ? Math.max(360, def.exposeMs - enemy.bossPhase * 150) : def.exposeMs;
          break;
      }
    }
  }

  private shoot(): void {
    if (this.phase !== 'active' || this.reloading > 0 || this.shotCooldown > 0) return;
    const save = saveService.load();
    const weapon = getWeapon(this.currentWeaponId);
    const weaponStats = getWeaponStats(this.currentWeaponId, save.upgrades);
    if (this.magazine <= 0) { this.showToast('ПУСТО • НАЖМИТЕ R ДЛЯ ПЕРЕЗАРЯДКИ', 900); return; }

    this.magazine -= 1;
    this.storeCurrentAmmo();
    this.shots += 1;
    this.shotCooldown = weaponStats.shotCooldownMs;
    this.shotFlash = this.currentWeaponId === 'shotgun' ? 185 : 125;
    this.weaponRecoil = weapon.recoil;
    FeedbackService.play(this, 'shot', this.currentWeaponId === 'shotgun' ? 1.2 : 1);
    triggerHaptic('shot');
    if (this.currentSettings.screenShakeEnabled) {
      this.cameras.main.shake(this.currentWeaponId === 'shotgun' ? 115 : 55,
        this.currentWeaponId === 'shotgun' ? 0.0032 : weapon.recoil * 0.00006);
    }

    const targetHits = new Map<number, {
      enemy: RuntimeEnemy; headHits: number; bodyHits: number; target: Point;
    }>();
    const spreadPhase = Math.random() * Math.PI * 2;
    const pelletCount = Math.max(1, weapon.pellets);

    for (let pellet = 0; pellet < pelletCount; pellet += 1) {
      let pelletAim: Point = { ...this.aim };
      if (pelletCount === 1 && weapon.spreadRadius > 0) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * weapon.spreadRadius;
        pelletAim = {
          x: this.aim.x + Math.cos(angle) * radius,
          y: this.aim.y + Math.sin(angle) * radius,
        };
      } else if (pellet > 0) {
        const angle = spreadPhase + ((pellet - 1) / (pelletCount - 1)) * Math.PI * 2;
        const radius = weapon.spreadRadius * (0.72 + Math.random() * 0.28);
        pelletAim = {
          x: this.aim.x + Math.cos(angle) * radius,
          y: this.aim.y + Math.sin(angle) * radius,
        };
      }

      let best: { enemy: RuntimeEnemy; part: 'head' | 'body'; target: Point; distance: number } | null = null;
      for (const enemy of this.enemies) {
        if (enemy.state === 'Defeated' || enemy.state === 'Hidden') continue;
        const isBoss = enemy.type === 'boss';
        const head = { x: enemy.x, y: enemy.y - (isBoss ? 72 : 48) };
        const body = { x: enemy.x, y: enemy.y - 5 };
        const part = resolveHit(pelletAim, head, body, isBoss ? 42 : 32, isBoss ? 66 : 48);
        if (!part) continue;
        const target = part === 'head' ? head : body;
        const distance = Math.hypot(pelletAim.x - target.x, pelletAim.y - target.y);
        if (!best || distance < best.distance) best = { enemy, part, target, distance };
      }

      if (best) {
        const record = targetHits.get(best.enemy.uid) ?? {
          enemy: best.enemy, headHits: 0, bodyHits: 0, target: best.target,
        };
        if (best.part === 'head') record.headHits += 1;
        else record.bodyHits += 1;
        targetHits.set(best.enemy.uid, record);
      }
    }

    let totalDamage = 0;
    let totalPelletsHit = 0;
    let bossPhaseChanged: 0 | 1 | 2 | null = null;
    const headMultiplier = BALANCE.weapon.headMultiplier[save.upgrades.precision];

    for (const result of targetHits.values()) {
      const pelletHits = result.headHits + result.bodyHits;
      const damage = weaponStats.damage * weapon.pelletDamageMultiplier
        * (result.bodyHits + result.headHits * headMultiplier);
      if (pelletHits <= 0 || damage <= 0) continue;

      totalPelletsHit += pelletHits;
      totalDamage += damage;
      result.enemy.hp = Math.max(0, result.enemy.hp - damage);
      result.enemy.hitFlash = 230;
      this.impactEffects.push({
        x: result.target.x, y: result.target.y, life: 520, maxLife: 520, kind: 'hit', damage,
      });

      const labelValue = Math.round(damage * 10) / 10;
      const damageLabel = this.add.text(result.target.x + 20, result.target.y - 24,
        (result.headHits > 0 ? 'В ГОЛОВУ  ' : '') + '−' + labelValue
          + (pelletCount > 1 ? '  ×' + pelletHits : ''),
        { fontSize: '21px', color: '#ffe0a0', fontStyle: 'bold',
          stroke: '#10161d', strokeThickness: 5 },
      ).setOrigin(0.5).setDepth(26);
      this.tweens.add({
        targets: damageLabel, y: damageLabel.y - 42, alpha: 0,
        duration: 560, ease: 'Cubic.easeOut',
        onComplete: () => damageLabel.destroy(),
      });

      if (result.enemy.type === 'boss' && result.enemy.hp > 0) {
        const nextBossPhase: 0 | 1 | 2 = result.enemy.hp <= result.enemy.maxHp / 3 ? 2
          : result.enemy.hp <= result.enemy.maxHp * 2 / 3 ? 1 : 0;
        if (nextBossPhase > result.enemy.bossPhase) {
          result.enemy.bossPhase = nextBossPhase;
          bossPhaseChanged = nextBossPhase;
        }
      }

      if (result.enemy.hp <= 0) {
        this.tweens.killTweensOf(result.enemy);
        result.enemy.state = 'Defeated';
        this.kills += 1;
        const xp = result.enemy.type === 'boss' ? BALANCE.rewards.xp.boss : BALANCE.rewards.xp.kill;
        const dollars = result.enemy.type === 'boss' ? BALANCE.rewards.dollars.boss : BALANCE.rewards.dollars.kill;
        this.award(xp, dollars);
        this.showToast(ENEMIES[result.enemy.type].name.toUpperCase()
          + ' УСТРАНЁН • +' + xp + ' XP • +$' + dollars, 1100);
      }
    }

    if (targetHits.size > 0) {
      this.hits += 1;
      FeedbackService.play(this, 'hit', 0.55);
      triggerHaptic('hit');
      if (bossPhaseChanged === 1) this.showToast('НАЧАЛЬНИК ОХРАНЫ УСКОРЯЕТСЯ • ФАЗА II', 1500);
      else if (bossPhaseChanged === 2) this.showToast('НАЧАЛЬНИК ОХРАНЫ В ЯРОСТИ • ФАЗА III', 1500);
      else this.showToast('ПОПАДАНИЕ • ' + Math.round(totalDamage * 10) / 10
        + (pelletCount > 1 ? ' УРОНА • ' + totalPelletsHit + '/' + pelletCount + ' ДРОБИН' : ''), 520);
    } else {
      const cover = this.sceneDef.covers.find((item) => pointInRect(this.aim, item));
      if (cover) {
        this.impactEffects.push({ x: this.aim.x, y: this.aim.y, life: 380, maxLife: 380, kind: 'cover', damage: 0 });
        this.showToast('ПОПАДАНИЕ В УКРЫТИЕ', 450);
      } else {
        this.impactEffects.push({ x: this.aim.x, y: this.aim.y, life: 280, maxLife: 280, kind: 'miss', damage: 0 });
        this.showToast('ПРОМАХ', 300);
      }
    }
    this.drawFrame();
  }

  private reload(): void {
    if (this.phase !== 'active' || this.reloading > 0) return;
    const save = saveService.load();
    const weaponStats = getWeaponStats(this.currentWeaponId, save.upgrades);
    if (this.magazine >= weaponStats.magazine || this.reserve <= 0) return;
    this.reloading = weaponStats.reloadSeconds * 1000;
    this.reloadPose = 1;
    FeedbackService.play(this, 'reload', 0.75);
    triggerHaptic('reload');
    this.showToast('ПЕРЕЗАРЯДКА…', this.reloading);
  }

  private finishReload(): void {
    const save = saveService.load();
    const capacity = getWeaponStats(this.currentWeaponId, save.upgrades).magazine;
    const loaded = Math.min(capacity - this.magazine, this.reserve);
    this.magazine += loaded;
    this.reserve -= loaded;
    this.reloading = 0;
    this.storeCurrentAmmo();
    this.showToast('ГОТОВО', 500);
  }

  private storeCurrentAmmo(): void {
    this.weaponAmmo.set(this.currentWeaponId, { magazine: this.magazine, reserve: this.reserve });
  }

  private selectWeaponSlot(index: number): void {
    const weaponId = this.selectedWeapons[index];
    if (weaponId) this.switchWeapon(weaponId);
  }

  private switchWeapon(weaponId: WeaponId): void {
    if (!this.selectedWeapons.includes(weaponId) || weaponId === this.currentWeaponId || this.phase !== 'active') return;
    this.storeCurrentAmmo();
    this.currentWeaponId = weaponId;
    this.reloading = 0;
    this.reloadPose = 0;
    const stored = this.weaponAmmo.get(weaponId);
    const stats = getWeaponStats(weaponId, saveService.load().upgrades);
    this.magazine = stored?.magazine ?? stats.magazine;
    this.reserve = stored?.reserve ?? stats.reserveAmmo;
    if (this.hudWeaponImage && AssetCatalog.hasTexture(this, 'weapon-' + weaponId)) {
      this.hudWeaponImage.setTexture('weapon-' + weaponId);
    }
    this.weaponRig?.destroy(true);
    this.weaponRig = undefined;
    this.buildWeaponRig();
    this.refreshMobileControls();
    this.showToast('ОРУЖИЕ: ' + getWeapon(weaponId).name, 900);
  }

  private cycleWeapon(): void {
    if (this.selectedWeapons.length < 2) return;
    const current = this.selectedWeapons.indexOf(this.currentWeaponId);
    this.switchWeapon(this.selectedWeapons[(current + 1) % this.selectedWeapons.length] ?? this.currentWeaponId);
  }

  private useGrenade(): void {
    if (this.phase !== 'active' || this.grenadeCount <= 0) return;
    this.grenadeCount -= 1;
    FeedbackService.play(this, 'grenade', 0.95);
    triggerHaptic('grenade');
    let defeated = 0;
    for (const enemy of this.enemies) {
      if (enemy.state === 'Defeated') continue;
      const distance = Math.hypot(enemy.x - this.aim.x, enemy.y - 35 - this.aim.y);
      if (distance > LOADOUT_UNLOCKS.grenadeRadius) continue;
      enemy.hp = Math.max(0, enemy.hp - LOADOUT_UNLOCKS.grenadeDamage);
      enemy.hitFlash = 280;
      if (enemy.type === 'boss' && enemy.hp > 0) {
        enemy.bossPhase = enemy.hp <= enemy.maxHp / 3 ? 2 : enemy.hp <= enemy.maxHp * 2 / 3 ? 1 : 0;
      }
      if (enemy.hp <= 0) {
        enemy.state = 'Defeated';
        this.tweens.killTweensOf(enemy);
        this.kills += 1;
        this.award(
          enemy.type === 'boss' ? BALANCE.rewards.xp.boss : BALANCE.rewards.xp.kill,
          enemy.type === 'boss' ? BALANCE.rewards.dollars.boss : BALANCE.rewards.dollars.kill,
        );
        defeated += 1;
      }
    }
    this.impactEffects.push({ x: this.aim.x, y: this.aim.y, life: 760, maxLife: 760, kind: 'explosion', damage: 0 });
    this.refreshMobileControls();
    this.showToast('ГРАНАТА • УСТРАНЕНО: ' + defeated + ' • ОСТАЛОСЬ: ' + this.grenadeCount, 1200);
    this.drawFrame();
  }

  private useMedkit(): void {
    if (this.phase !== 'active' || this.medkitCount <= 0) return;
    if (this.hp >= this.maxHp) { this.showToast('ЗДОРОВЬЕ УЖЕ ПОЛНОЕ', 700); return; }
    this.medkitCount -= 1;
    FeedbackService.play(this, 'confirm', 0.55);
    triggerHaptic('medkit');
    const medkitRatio = Math.min(0.8, LOADOUT_UNLOCKS.medkitHealRatio + saveService.load().gearUpgrades.medkitEfficiency * 0.1);
    const healed = Math.min(this.maxHp - this.hp, Math.round(this.maxHp * medkitRatio));
    this.hp += healed;
    this.refreshMobileControls();
    this.showToast('АПТЕЧКА • +' + healed + ' HP • ОСТАЛОСЬ: ' + this.medkitCount, 1100);
  }

  private refreshMobileControls(): void {
    const stickMode = this.currentSettings.mobileControlMode === 'stick';
    if (this.mobileFireButton) this.mobileFireButton.style.display = stickMode ? 'grid' : 'none';
    if (this.mobileAimStick) this.mobileAimStick.style.display = stickMode ? 'block' : 'none';
    if (this.mobileSwitchButton) this.mobileSwitchButton.style.display = this.selectedWeapons.length > 1 ? 'grid' : 'none';
    if (this.appliedMobileControlMode !== this.currentSettings.mobileControlMode) {
      this.aimStickActive = false;
      this.aimStickPointerId = null;
      this.aimStickVector = { x: 0, y: 0 };
      this.mobileFireHeld = false;
      this.mobileFirePointerId = null;
      this.appliedMobileControlMode = this.currentSettings.mobileControlMode;
    }
    if (this.mobileSwitchButton) {
      const index = this.selectedWeapons.indexOf(this.currentWeaponId);
      if (this.mobileSwitchCaption) this.mobileSwitchCaption.textContent = this.selectedWeapons.length > 1
        ? 'ОРУЖИЕ ' + (index + 1) + '/' + this.selectedWeapons.length : 'ОРУЖИЕ';
      this.mobileSwitchButton.style.display = this.selectedWeapons.length > 1 ? 'grid' : 'none';
    }
    if (this.mobileGrenadeButton) {
      if (this.mobileGrenadeCaption) this.mobileGrenadeCaption.textContent = 'ГРАНАТА ×' + this.grenadeCount;
      this.mobileGrenadeButton.style.display = this.grenadeCount > 0 ? 'grid' : 'none';
    }
    if (this.mobileMedkitButton) {
      if (this.mobileMedkitCaption) this.mobileMedkitCaption.textContent = 'АПТЕЧКА ×' + this.medkitCount;
      this.mobileMedkitButton.style.display = this.medkitCount > 0 ? 'grid' : 'none';
    }
  }

  private damagePlayer(amount: number): void {
    if (this.phase !== 'active') return;
    const armorLevel = saveService.load().upgrades.armor;
    const reduction = BALANCE.player.damageReduction[armorLevel];
    const appliedDamage = Math.max(1, Math.round(amount * (1 - reduction)));
    this.hp = Math.max(0, this.hp - appliedDamage);
    this.playerHitFlash = 190;
    this.damageTaken += appliedDamage;
    FeedbackService.play(this, 'hit', 0.85);
    triggerHaptic('damage');
    if (this.currentSettings.screenShakeEnabled) this.cameras.main.shake(110, 0.0025);
    this.showToast('ВРАГ ПОПАЛ • −' + appliedDamage + ' HP', 750);
  }

  private award(accountXp: number, dollars: number): void {
    this.accountXpEarned += accountXp;
    this.dollarsEarned += dollars;
    this.totalAccountXp += accountXp;
    saveService.addProgress(accountXp, dollars);
  }

  private finishMission(success: boolean): void {
    if (this.resultSent) return;
    this.resultSent = true;
    this.phase = 'finished';
    triggerHaptic(success ? 'success' : 'failure');
    if (success) {
      FeedbackService.play(this, 'confirm', 0.85);
      this.award(BALANCE.rewards.xp.mission, BALANCE.rewards.dollars.mission);
    }
    runSession.result = {
      success,
      elapsedSeconds: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
      kills: this.kills, shots: this.shots, hits: this.hits,
      damageTaken: this.damageTaken, accountXpEarned: this.accountXpEarned,
      dollarsEarned: this.dollarsEarned,
    };
    this.scene.start('Results');
  }

  private isMobileControlPoint(_x: number, _y: number): boolean {
    // DOM controls capture their own pointer events above the canvas; every other tap is valid gameplay input.
    return false;
  }

  private buildMobileControls(): void {
    // DOM controls sit above the Phaser canvas, so their size and hit areas do not
    // depend on Phaser's FIT scaling or the Android browser's canvas coordinates.
    const host = this.game.canvas.parentElement;
    if (!host) return;

    const overlay = document.createElement('div');
    overlay.dataset.shpyMobileControls = 'true';
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '10000',
      pointerEvents: 'none',
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    const makeButton = (glyph: string, label: string, size: number, background: string): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.title = label;
      Object.assign(button.style, {
        width: size + 'px', height: size + 'px', borderRadius: '50%',
        border: '2px solid #f0d4a4b8', background,
        color: '#fff', font: '800 14px/1 Arial, sans-serif',
        textShadow: '0 2px 3px #000', boxShadow: '0 5px 18px #000a',
        touchAction: 'none', pointerEvents: 'auto', padding: '7px 4px 5px',
        display: 'grid', gridTemplateRows: '1fr auto', alignItems: 'center', justifyItems: 'center',
        WebkitTapHighlightColor: 'transparent', backdropFilter: 'blur(5px)',
      });
      const icon = document.createElement('span');
      icon.textContent = glyph;
      Object.assign(icon.style, { font: '700 ' + Math.round(size * 0.42) + 'px/1 Arial,sans-serif',
        lineHeight: '1', display: 'block', pointerEvents: 'none' });
      const caption = document.createElement('span');
      caption.textContent = label;
      Object.assign(caption.style, { font: '800 ' + (size < 70 ? '8px' : '9px') + '/1 Arial,sans-serif',
        letterSpacing: '0.35px', whiteSpace: 'nowrap', opacity: '0.9', pointerEvents: 'none' });
      button.append(icon, caption);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      return button;
    };

    const stack = document.createElement('div');
    Object.assign(stack.style, {
      position: 'absolute',
      right: 'max(14px, env(safe-area-inset-right))',
      bottom: 'max(14px, env(safe-area-inset-bottom))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      pointerEvents: 'none',
    });

    const reload = makeButton('↻', 'ЗАРЯД', 72, '#263747ef');
    reload.style.borderRadius = '20px';
    const fire = makeButton('➤', 'ОГОНЬ', 96, '#a52f38f5');
    this.mobileFireButton = fire;
    const switchButton = makeButton('⇄', 'ОРУЖИЕ', 62, '#40566bf0');
    switchButton.style.borderRadius = '18px';
    this.mobileSwitchButton = switchButton;
    this.mobileSwitchCaption = switchButton.lastElementChild as HTMLSpanElement;
    const pause = makeButton('Ⅱ', 'ПАУЗА', 48, '#263747ee');
    Object.assign(pause.style, {
      position: 'absolute',
      top: 'max(112px, calc(env(safe-area-inset-top) + 104px))',
      right: 'max(12px, env(safe-area-inset-right))',
      fontSize: '22px',
    });

    const consume = (event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    const stopFire = (event: PointerEvent): void => {
      // Releasing the aim-stick finger must not cancel a second finger holding fire.
      if (event.pointerId !== this.mobileFirePointerId) return;
      this.mobileFireHeld = false;
      this.mobileFirePointerId = null;
    };
    this.mobileReleaseHandler = stopFire;
    fire.addEventListener('pointerdown', (event) => {
      consume(event);
      if (this.phase !== 'active' || this.mobileFirePointerId !== null) return;
      this.mobileFirePointerId = event.pointerId;
      this.mobileFireHeld = true;
      this.shoot();
    });
    window.addEventListener('pointerup', stopFire);
    window.addEventListener('pointercancel', stopFire);
    reload.addEventListener('pointerdown', (event) => {
      consume(event);
      if (this.phase === 'active') this.reload();
    });
    switchButton.addEventListener('pointerdown', (event) => {
      consume(event);
      this.cycleWeapon();
    });
    pause.addEventListener('pointerdown', (event) => {
      consume(event);
      this.togglePause();
    });

    stack.append(switchButton, reload, fire);

    const stick = document.createElement('div');
    Object.assign(stick.style, {
      position: 'absolute', left: 'max(18px, env(safe-area-inset-left))',
      bottom: 'max(126px, calc(env(safe-area-inset-bottom) + 112px))',
      width: '154px', height: '154px', borderRadius: '50%',
      border: '2px solid #e4c48caa', background: 'radial-gradient(circle, #283b4de8 0%, #111a24e8 68%, #0b121bdc 100%)',
      boxShadow: 'inset 0 0 28px #000b, 0 6px 20px #000a',
      pointerEvents: 'auto', touchAction: 'none',
    });
    const stickLabel = document.createElement('div');
    stickLabel.textContent = 'ПРИЦЕЛ';
    Object.assign(stickLabel.style, {
      position: 'absolute', left: '0', right: '0', bottom: '10px',
      textAlign: 'center', color: '#f2d5a4c0', font: '800 10px Arial, sans-serif',
      letterSpacing: '2px', pointerEvents: 'none', textShadow: '0 1px 4px #000',
    });
    const knob = document.createElement('div');
    Object.assign(knob.style, {
      position: 'absolute', width: '64px', height: '64px', left: '45px', top: '45px',
      borderRadius: '50%', border: '2px solid #f0d4a4',
      background: 'radial-gradient(circle at 35% 28%, #8294a5, #405362 68%, #253440)',
      boxShadow: '0 4px 16px #000b, inset 0 1px 5px #ffffff55',
      pointerEvents: 'none', transform: 'translate(0, 0)',
    });
    stick.append(knob, stickLabel);
    this.mobileAimStick = stick;
    const stickCenter = 77;
    const stickRadius = 50;
    const resetStick = (event?: PointerEvent): void => {
      if (event && event.pointerId !== this.aimStickPointerId) return;
      this.aimStickPointerId = null;
      this.aimStickActive = false;
      this.aimStickVector = { x: 0, y: 0 };
      knob.style.transform = 'translate(0px, 0px)';
    };
    const updateStick = (event: PointerEvent): void => {
      const rect = stick.getBoundingClientRect();
      const dx = (event.clientX - rect.left) * (154 / rect.width) - stickCenter;
      const dy = (event.clientY - rect.top) * (154 / rect.height) - stickCenter;
      const length = Math.hypot(dx, dy);
      const factor = length > stickRadius ? stickRadius / length : 1;
      this.aimStickVector = { x: dx * factor / stickRadius, y: dy * factor / stickRadius };
      this.aimStickActive = true;
      knob.style.transform = 'translate(' + (dx * factor) + 'px, ' + (dy * factor) + 'px)';
    };
    stick.addEventListener('pointerdown', (event) => {
      consume(event);
      if (this.aimStickPointerId !== null || this.currentSettings.mobileControlMode !== 'stick') return;
      this.aimStickPointerId = event.pointerId;
      stick.setPointerCapture(event.pointerId);
      updateStick(event);
    });
    stick.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.aimStickPointerId && stick.hasPointerCapture(event.pointerId)) updateStick(event);
    });
    stick.addEventListener('pointerup', (event) => { consume(event); resetStick(event); });
    stick.addEventListener('pointercancel', (event) => resetStick(event));
    stick.addEventListener('lostpointercapture', (event) => resetStick(event));

    const utilityRow = document.createElement('div');
    Object.assign(utilityRow.style, {
      position: 'absolute', left: 'max(10px, env(safe-area-inset-left))',
      bottom: 'max(16px, env(safe-area-inset-bottom))', display: 'flex', gap: '8px',
      pointerEvents: 'none',
    });
    const grenade = makeButton('✹', 'ГРАНАТА ×' + this.grenadeCount, 66, '#78603ef0');
    const medkit = makeButton('+', 'АПТЕЧКА ×' + this.medkitCount, 66, '#356d58f0');
    grenade.style.borderRadius = '18px'; medkit.style.borderRadius = '18px';
    this.mobileGrenadeCaption = grenade.lastElementChild as HTMLSpanElement;
    this.mobileMedkitCaption = medkit.lastElementChild as HTMLSpanElement;
    grenade.style.display = this.grenadeCount > 0 ? 'grid' : 'none';
    medkit.style.display = this.medkitCount > 0 ? 'grid' : 'none';
    this.mobileGrenadeButton = grenade;
    this.mobileMedkitButton = medkit;
    grenade.addEventListener('pointerdown', (event) => { consume(event); this.useGrenade(); });
    medkit.addEventListener('pointerdown', (event) => { consume(event); this.useMedkit(); });
    utilityRow.append(grenade, medkit);
    overlay.append(stack, pause, utilityRow, stick);
    host.append(overlay);
    this.mobileControlsElement = overlay;
    this.refreshMobileControls();
  }

  private disposeMobileControls(): void {
    this.mobileFireHeld = false;
    this.mobileFirePointerId = null;
    this.aimStickActive = false;
    this.aimStickPointerId = null;
    this.aimStickVector = { x: 0, y: 0 };
    if (this.mobileReleaseHandler && typeof window !== 'undefined') {
      window.removeEventListener('pointerup', this.mobileReleaseHandler);
      window.removeEventListener('pointercancel', this.mobileReleaseHandler);
    }
    this.mobileReleaseHandler = undefined;
    this.mobileControlsElement?.remove();
    this.mobileControlsElement = undefined;
    this.mobileSwitchButton = undefined;
    this.mobileSwitchCaption = undefined;
    this.mobileFireButton = undefined;
    this.mobileAimStick = undefined;
    this.mobileGrenadeButton = undefined;
    this.mobileMedkitButton = undefined;
    this.mobileGrenadeCaption = undefined;
    this.mobileMedkitCaption = undefined;
  }

  private onMissionResume(): void {
    this.currentSettings = settingsService.load();
    this.appliedMobileControlMode = this.currentSettings.mobileControlMode;
    if (this.isMobileControls && !this.mobileControlsElement) this.buildMobileControls();
    this.refreshMobileControls();
    FeedbackService.applyMusicVolume();
  }

  private openSettings(): void {
    if (this.phase === 'finished' || this.phase === 'transition') return;
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = undefined;
    this.phase = 'active';
    this.disposeMobileControls();
    this.scene.pause('Mission');
    this.scene.launch('Settings', { returnTo: 'Mission' });
  }

  private togglePause(): void {
    if (this.phase === 'finished' || this.phase === 'transition') return;
    if (this.phase === 'paused') {
      this.phase = 'active';
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
      return;
    }
    this.phase = 'paused';
    this.mobileFireHeld = false;
    this.mobileFirePointerId = null;
    this.desktopFireHeld = false;
    this.aimStickActive = false;
    this.aimStickPointerId = null;
    this.aimStickVector = { x: 0, y: 0 };
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080c, 0.78);
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'ПАУЗА', { fontSize: '42px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25, this.isMobileControls ? 'НАЖМИТЕ КНОПКУ ПАУЗЫ ДЛЯ ПРОДОЛЖЕНИЯ' : 'ESC — ПРОДОЛЖИТЬ', { fontSize: '16px', color: '#e0b763' }).setOrigin(0.5);
    const resume = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 250, 52, 0x8c3036, 0.98)
      .setStrokeStyle(2, 0xe2b96e, 1).setInteractive();
    const resumeLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 76, 'ПРОДОЛЖИТЬ', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    resume.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 76);
    const settingsButton = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 146, 250, 48, 0x39495a, 0.98)
      .setStrokeStyle(1, 0xe2b96e, 0.65).setInteractive();
    const settingsLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 146, 'НАСТРОЙКИ', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    resume.on('pointerdown', () => this.togglePause());
    settingsButton.on('pointerdown', () => this.openSettings());
    this.pauseOverlay = this.add.container(0, 0,
      [shade, label, hint, resume, resumeLabel, settingsButton, settingsLabel]).setDepth(100);
  }

  private getDisplayedWaveNumber(): number {
    return Math.min(this.waveIndex + 1, this.sceneDef.waves.length);
  }

  private drawFrame(): void {
    this.world.clear();
    this.drawEnemies();
    this.drawCovers();
    this.drawEffects();

    const weapon = getWeapon(this.currentWeaponId);
    const weaponIndex = this.selectedWeapons.indexOf(this.currentWeaponId) + 1;
    const weaponLabel = weapon.name + '  •  ' + weaponIndex + '/' + this.selectedWeapons.length;
    const ammoLabel = this.reloading > 0 ? '↻  ' + (this.reloading / 1000).toFixed(1) + 'с'
      : this.magazine + ' / ' + this.reserve;
    const ammoStats = getWeaponStats(this.currentWeaponId, saveService.load().upgrades);

    this.hudPanel.clear();
    this.hudBars.clear();
    this.hudIcons.clear();

    // Left status panel: icon, animated health meter and mission progress.
    this.hudPanel.fillStyle(0x09131d, 0.92);
    this.hudPanel.fillRoundedRect(16, 14, 460, 92, 12);
    this.hudPanel.lineStyle(1, 0xb6c2cc, 0.28);
    this.hudPanel.strokeRoundedRect(16, 14, 460, 92, 12);
    this.hudPanel.fillStyle(0xa43a3e, 0.95);
    this.hudPanel.fillRoundedRect(16, 14, 5, 92, 3);

    // Heart pictogram.
    this.hudIcons.fillStyle(0xe56869, 1);
    this.hudIcons.fillCircle(39, 49, 9);
    this.hudIcons.fillCircle(52, 49, 9);
    this.hudIcons.fillTriangle(30, 51, 61, 51, 45, 68);

    this.hud.setText(weaponLabel);
    this.hudMissionText.setText('КАЗИНО  •  СЕКТОР ' + (this.sceneIndex + 1) + '/' + CASINO_MISSION.length
      + '  •  ВОЛНА ' + this.getDisplayedWaveNumber() + '/' + this.sceneDef.waves.length);

    this.hudBars.fillStyle(0x293744, 0.95);
    this.hudBars.fillRoundedRect(76, 43, 270, 13, 6);
    this.hudBars.fillStyle(this.hp / Math.max(1, this.maxHp) > 0.4 ? 0x69b58b : 0xc84d4d, 0.98);
    this.hudBars.fillRoundedRect(76, 43, 270 * (this.hp / Math.max(1, this.maxHp)), 13, 6);
    for (let segment = 1; segment < 10; segment += 1) {
      this.hudBars.fillStyle(0x08111a, 0.72);
      this.hudBars.fillRect(76 + segment * 27, 43, 2, 13);
    }
    this.hudAmmoText.setText(ammoLabel);

    // Right weapon panel: recognizable weapon silhouette and magazine meter.
    this.hudPanel.fillStyle(0x09131d, 0.92);
    this.hudPanel.fillRoundedRect(892, 14, 372, 92, 12);
    this.hudPanel.lineStyle(1, 0xb6c2cc, 0.28);
    this.hudPanel.strokeRoundedRect(892, 14, 372, 92, 12);
    this.hudIcons.fillStyle(0x9aa9b6, 0.95);
    this.hudIcons.fillRoundedRect(918, 35, 8, 26, 3);
    this.hudIcons.fillRoundedRect(933, 28, 8, 33, 3);
    this.hudIcons.fillRoundedRect(948, 39, 8, 22, 3);
    this.hudIcons.fillStyle(0xd9bd8c, 1);
    this.hudIcons.fillTriangle(918, 31, 926, 31, 922, 25);
    this.hudIcons.fillTriangle(933, 24, 941, 24, 937, 18);
    this.hudIcons.fillTriangle(948, 35, 956, 35, 952, 29);
    this.hudBars.fillStyle(0x293744, 0.95);
    this.hudBars.fillRoundedRect(1000, 75, 236, 8, 4);
    this.hudBars.fillStyle(this.reloading > 0 ? 0xd6a35c : 0x8db5a4, 0.98);
    this.hudBars.fillRoundedRect(1000, 75,
      236 * (this.magazine / Math.max(1, ammoStats.magazine)), 8, 4);
    for (let segment = 1; segment < 12; segment += 1) {
      this.hudBars.fillStyle(0x08111a, 0.62);
      this.hudBars.fillRect(1000 + segment * 19.6, 75, 1.5, 8);
    }

    if (this.hudWeaponImage && AssetCatalog.hasTexture(this, 'weapon-' + this.currentWeaponId)) {
      this.hudWeaponImage.setTexture('weapon-' + this.currentWeaponId).setVisible(true);
    } else {
      this.hudWeaponImage?.setVisible(false);
    }
    this.message.setText(this.toastText).setVisible(this.toastTimer > 0);
    this.reloadHint.setText(this.reloading > 0 ? 'ПЕРЕЗАРЯДКА…' : 'R  ПЕРЕЗАРЯДКА');
  }

  private drawEnemies(): void {
    for (const enemy of this.enemies) {
      const spriteKey = 'enemy-image-' + enemy.uid;
      const sprite = this.children.getByName(spriteKey) as Phaser.GameObjects.Image | null;
      const bossLabelKey = 'boss-name-' + enemy.uid;
      const bossLabel = this.children.getByName(bossLabelKey) as Phaser.GameObjects.Text | null;
      if (enemy.state === 'Defeated' || enemy.state === 'Hidden') {
        sprite?.setVisible(false); bossLabel?.setVisible(false); continue;
      }
      const def = ENEMIES[enemy.type];
      const hitOffset = enemy.hitFlash > 0 ? Math.sin(this.time.now / 24) * 5 * (enemy.hitFlash / 230) : 0;
      const idleBob = Math.sin((this.time.now + enemy.uid * 97) / 270) * 2.2;
      const drawX = enemy.x + hitOffset;
      const drawY = enemy.y - 20 + idleBob;
      if (AssetCatalog.hasTexture(this, SPRITES[enemy.type])) {
        let image = sprite;
        if (!image) image = this.add.image(drawX, drawY, SPRITES[enemy.type]).setName(spriteKey).setDepth(2);
        const isBoss = enemy.type === 'boss';
        image.setPosition(drawX, drawY).setDisplaySize(isBoss ? 150 : enemy.type === 'armored' ? 92 : 84,
          isBoss ? 224 : enemy.type === 'armored' ? 154 : 146).setVisible(true);
        if (enemy.hitFlash > 0) image.setAlpha(0.72 + Math.sin(this.time.now / 20) * 0.28);
        else image.setAlpha(1);
        image.setAngle(Math.sin((this.time.now + enemy.uid * 113) / 420) * 1.1);
      } else {
        this.world.fillStyle(0x05080c, 0.45); this.world.fillEllipse(drawX, enemy.y + 3, 65, 15);
        this.world.fillStyle(def.color, 1); this.world.fillRoundedRect(drawX - 24, drawY - 18, 48, 76, 8);
        this.world.fillStyle(0x17202a, 1); this.world.fillCircle(drawX, drawY - 32, enemy.type === 'armored' ? 18 : 14);
        this.world.fillStyle(0x0a1018, 1); this.world.fillRect(drawX - 33, drawY + 7, 66, 10);
        this.world.fillStyle(0x263342, 1); this.world.fillRect(drawX + 15, drawY + 12, 40, 7);
        if (enemy.type === 'armored') {
          this.world.lineStyle(4, 0xefd1a2, 0.8); this.world.strokeRoundedRect(enemy.x - 28, enemy.y - 42, 56, 88, 10);
        }
        if (enemy.type === 'boss') {
          this.world.fillStyle(0x271b18, 1); this.world.fillRoundedRect(enemy.x - 34, drawY - 64, 68, 22, 6);
          this.world.fillStyle(0xe0b66f, 1); this.world.fillRect(enemy.x - 24, drawY - 57, 48, 5);
        }
      }
      if (enemy.type === 'boss') {
        let label = bossLabel;
        if (!label) label = this.add.text(enemy.x, enemy.y - 164, 'НАЧАЛЬНИК ОХРАНЫ • ФАЗА I', {
          fontSize: '15px', color: '#f2d49a', fontStyle: 'bold', stroke: '#10161d', strokeThickness: 5,
        }).setOrigin(0.5).setName(bossLabelKey).setDepth(23);
        label.setPosition(enemy.x, enemy.y - 164).setText('НАЧАЛЬНИК ОХРАНЫ • ФАЗА ' + (enemy.bossPhase + 1)).setVisible(true);
      }
      if (enemy.state === 'Aiming') {
        this.fx.lineStyle(2, 0xe25c54, 0.9); this.fx.strokeCircle(enemy.x, enemy.y - 70, 25 + Math.sin(this.time.now / 90) * 3);
        this.fx.lineStyle(2, 0xe25c54, 0.65); this.fx.lineBetween(enemy.x, enemy.y - 70, MUZZLE.x, MUZZLE.y - 10);
      }
      if (enemy.state === 'Peeking') {
        this.fx.fillStyle(0xf1c16d, 1); this.fx.fillCircle(enemy.x, enemy.y - 105, 4);
      }
    }
  }

  private drawCovers(): void {
    this.coverLayer.clear();
    for (const cover of this.sceneDef.covers) {
      const textureKey = cover.id === 'bar-counter' ? 'cover-bar' : 'cover-crate';
      if (AssetCatalog.hasTexture(this, textureKey)) {
        const key = 'cover-image-' + cover.id;
        let image = this.children.getByName(key) as Phaser.GameObjects.Image | null;
        if (!image) image = this.add.image(cover.x + cover.width / 2, cover.y + cover.height / 2, textureKey).setName(key).setDepth(9);
        image.setTexture(textureKey).setPosition(cover.x + cover.width / 2, cover.y + cover.height / 2).setDisplaySize(cover.width, cover.height);
      } else {
        this.coverLayer.fillStyle(0x101820, 0.98); this.coverLayer.fillRoundedRect(cover.x, cover.y, cover.width, cover.height, 7);
        this.coverLayer.lineStyle(3, 0x778391, 0.9); this.coverLayer.strokeRoundedRect(cover.x, cover.y, cover.width, cover.height, 7);
        this.coverLayer.lineStyle(2, 0x3c4a58, 0.9);
        this.coverLayer.lineBetween(cover.x + 12, cover.y + 14, cover.x + cover.width - 12, cover.y + cover.height - 14);
        this.coverLayer.lineBetween(cover.x + cover.width - 12, cover.y + 14, cover.x + 12, cover.y + cover.height - 14);
      }
    }
  }

  private drawEffects(): void {
    this.fx.clear();
    if (this.playerHitFlash > 0) {
      this.fx.fillStyle(0xc62b37, (this.playerHitFlash / 190) * 0.2);
      this.fx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    this.drawEnemyOverlays();
    this.updateWeaponRig();

    if (this.shotFlash > 0) {
      const muzzle = this.getWeaponMuzzle();
      const alpha = this.shotFlash / 135;
      this.fx.lineStyle(5, 0xffd58a, alpha * 0.9);
      this.fx.lineBetween(muzzle.x, muzzle.y, this.aim.x, this.aim.y);
      this.fx.lineStyle(2, 0xffffff, alpha);
      this.fx.lineBetween(muzzle.x, muzzle.y, this.aim.x, this.aim.y);
      this.fx.fillStyle(0xffd58a, alpha);
      this.fx.fillCircle(muzzle.x, muzzle.y, 9 + (135 - this.shotFlash) * 0.18);
      this.fx.lineStyle(3, 0xfff0c5, alpha);
      const rayCount = this.currentSettings.graphicsQuality === 'high' ? 12
        : this.currentSettings.graphicsQuality === 'low' ? 4 : 8;
      for (let i = 0; i < rayCount; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        this.fx.lineBetween(
          muzzle.x + Math.cos(angle) * 10, muzzle.y + Math.sin(angle) * 10,
          muzzle.x + Math.cos(angle) * 25, muzzle.y + Math.sin(angle) * 25,
        );
      }
    }

    for (const effect of this.impactEffects) {
      const alpha = Math.max(0, effect.life / effect.maxLife);
      if (effect.kind === 'explosion') {
        const radius = 34 + (1 - alpha) * LOADOUT_UNLOCKS.grenadeRadius;
        this.fx.fillStyle(0xff9a45, alpha * 0.14); this.fx.fillCircle(effect.x, effect.y, radius);
        this.fx.lineStyle(7, 0xffb15b, alpha * 0.85); this.fx.strokeCircle(effect.x, effect.y, radius);
        this.fx.lineStyle(3, 0xffe4a8, alpha); this.fx.strokeCircle(effect.x, effect.y, radius * 0.62);
        continue;
      }
      const size = effect.kind === 'hit' ? 16 + (1 - alpha) * 18 : 13 + (1 - alpha) * 12;
      const color = effect.kind === 'hit' ? 0x70f0ad : effect.kind === 'cover' ? 0xffc46a : 0xb9c7d4;
      this.fx.lineStyle(4, color, alpha);
      this.fx.strokeCircle(effect.x, effect.y, size);
      this.fx.lineBetween(effect.x - size * 0.72, effect.y - size * 0.72, effect.x + size * 0.72, effect.y + size * 0.72);
      this.fx.lineBetween(effect.x + size * 0.72, effect.y - size * 0.72, effect.x - size * 0.72, effect.y + size * 0.72);
      if (effect.kind === 'hit') {
        this.fx.fillStyle(0xffd88b, alpha);
        this.fx.fillCircle(effect.x, effect.y - 28 - (1 - alpha) * 18, 3 + alpha * 2);
      }
    }

    if (AssetCatalog.hasTexture(this, 'ui-cursor')) {
      let cursor = this.children.getByName('cursor-image') as Phaser.GameObjects.Image | null;
      if (!cursor) cursor = this.add.image(this.aim.x, this.aim.y, 'ui-cursor').setName('cursor-image').setDepth(25);
      cursor.setPosition(this.aim.x, this.aim.y).setDisplaySize(48, 48).setVisible(true);
    } else {
      this.fx.lineStyle(3, 0xf5f7fa, 0.96);
      this.fx.strokeCircle(this.aim.x, this.aim.y, 13);
      this.fx.lineBetween(this.aim.x - 25, this.aim.y, this.aim.x - 7, this.aim.y);
      this.fx.lineBetween(this.aim.x + 7, this.aim.y, this.aim.x + 25, this.aim.y);
      this.fx.lineBetween(this.aim.x, this.aim.y - 25, this.aim.x, this.aim.y - 7);
      this.fx.lineBetween(this.aim.x, this.aim.y + 7, this.aim.x, this.aim.y + 25);
      this.fx.fillStyle(0xffffff, 1);
      this.fx.fillCircle(this.aim.x, this.aim.y, 2);
    }
  }

  private drawEnemyOverlays(): void {
    for (const enemy of this.enemies) {
      if (enemy.state === 'Defeated' || enemy.state === 'Hidden') continue;
      const def = ENEMIES[enemy.type];
      const barWidth = enemy.type === 'boss' ? 150 : 58;
      const barY = enemy.y - (enemy.type === 'boss' ? 140 : 88);
      this.fx.fillStyle(0x131a22, 0.95); this.fx.fillRoundedRect(enemy.x - barWidth / 2, barY, barWidth, 8, 3);
      this.fx.fillStyle(def.color, 1); this.fx.fillRoundedRect(enemy.x - barWidth / 2, barY, barWidth * (enemy.hp / enemy.maxHp), 8, 3);
      if (enemy.state === 'Aiming') {
        this.fx.lineStyle(2, 0xe25c54, 0.9); this.fx.strokeCircle(enemy.x, enemy.y - 70, 25 + Math.sin(this.time.now / 90) * 3);
        this.fx.lineStyle(2, 0xe25c54, 0.65); this.fx.lineBetween(enemy.x, enemy.y - 70, MUZZLE.x, MUZZLE.y - 10);
      }
      if (enemy.state === 'Peeking') {
        this.fx.fillStyle(0xf1c16d, 1); this.fx.fillCircle(enemy.x, enemy.y - 105, 4);
      }
      if (enemy.state === 'Attacking') {
        const muzzleX = enemy.x + (enemy.x < GAME_WIDTH / 2 ? 22 : -22);
        const muzzleY = enemy.y - 62;
        this.fx.fillStyle(0xffd58a, 0.95); this.fx.fillCircle(muzzleX, muzzleY, 10);
        this.fx.lineStyle(3, 0xffe5af, 0.9); this.fx.strokeCircle(muzzleX, muzzleY, 17);
        this.fx.lineStyle(2, 0xe65a50, 0.55); this.fx.lineBetween(muzzleX, muzzleY, MUZZLE.x, MUZZLE.y - 20);
      }
      if (enemy.hitFlash > 0) {
        this.fx.lineStyle(4, 0xffffff, enemy.hitFlash / 230);
        this.fx.strokeCircle(enemy.x, enemy.y - 42, 42);
      }
    }
  }

  private showToast(text: string, duration: number): void {
    this.toastText = text;
    this.toastTimer = duration;
    if (this.message) this.message.setText(text).setVisible(true);
  }
}
