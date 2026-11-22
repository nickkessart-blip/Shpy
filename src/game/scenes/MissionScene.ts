import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import { saveService } from '../../persistence/SaveService';
import { BALANCE } from '../data/balance';
import { ENEMIES, type EnemyType } from '../data/enemies';
import { CASINO_MISSION, type MissionSceneDefinition, type SpawnPoint } from '../data/missions';
import { AssetCatalog } from '../assets/AssetCatalog';
import { findVisiblePeekX, pointInRect, resolveHit, type Point } from '../systems/combat/combatMath';
import { runSession } from '../systems/missions/runSession';

type EnemyState = 'Exposed' | 'Aiming' | 'Attacking' | 'SeekingCover' | 'Hidden' | 'Peeking' | 'Repositioning' | 'Defeated';
interface RuntimeEnemy {
  uid: number; type: EnemyType; x: number; baseX: number; y: number; originY: number; hp: number; maxHp: number;
  coverId?: string; state: EnemyState; timer: number; phase: number; hitFlash: number;
}

const MUZZLE: Point = { x: GAME_WIDTH / 2, y: 662 };
const MOBILE_FIRE = { x: GAME_WIDTH - 116, y: GAME_HEIGHT - 190 };
const MOBILE_RELOAD = { x: GAME_WIDTH - 116, y: GAME_HEIGHT - 58 };
const MOBILE_PAUSE = { x: GAME_WIDTH - 58, y: 58 };
const SPRITES: Record<EnemyType, string> = {
  guard: 'enemy-guard', armored: 'enemy-armored', assault: 'enemy-assault',
};

export class MissionScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Graphics;
  private world!: Phaser.GameObjects.Graphics;
  private coverLayer!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private weaponRig?: Phaser.GameObjects.Container;
  private impactEffects: Array<{ x: number; y: number; life: number; maxLife: number; kind: 'hit' | 'cover' | 'miss'; damage: number }> = [];
  private weaponRecoil = 0;
  private playerHitFlash = 0;
  private hud!: Phaser.GameObjects.Text;
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
  private hp: number = BALANCE.player.maxHp;
  private magazine: number = BALANCE.weapon.magazine[0];
  private reserve = 72;
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
  private reputationEarned = 0;
  private totalReputation = 0;
  private waveAwarded = false;
  private uniqueId = 1;
  private sceneDef!: MissionSceneDefinition;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private resultSent = false;
  private isMobileControls = false;
  private mobileFireHeld = false;

  constructor() { super('Mission'); }

  create(): void {
    // Phaser reuses Scene instances. Reset every run-scoped value before building the scene again.
    const initialSave = saveService.load();
    this.startedAt = Date.now();
    this.aim = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    this.enemies = [];
    this.sceneIndex = 0;
    this.waveIndex = 0;
    this.spawnTimer = 300;
    this.phase = 'active';
    this.hp = BALANCE.player.maxHp;
    this.magazine = BALANCE.weapon.magazine[initialSave.upgrades.magazine];
    this.reserve = 72;
    this.reloading = 0;
    this.shotCooldown = 0;
    this.shotFlash = 0;
    this.toastTimer = 0;
    this.toastText = '';
    this.kills = 0;
    this.shots = 0;
    this.hits = 0;
    this.damageTaken = 0;
    this.reputationEarned = 0;
    this.totalReputation = initialSave.reputation;
    this.waveAwarded = false;
    this.uniqueId = 1;
    this.resultSent = false;
    this.pauseOverlay = undefined;
    this.backgroundArt = undefined;
    this.transitionOverlay = undefined;
    this.transitionWalkTweens = [];
    this.isMobileControls = hasTouchInput();
    this.mobileFireHeld = false;
    this.impactEffects = [];
    this.weaponRecoil = 0;
    this.playerHitFlash = 0;
    this.backdrop = this.add.graphics().setDepth(-20);
    this.world = this.add.graphics().setDepth(0);
    this.coverLayer = this.add.graphics().setDepth(8);
    this.fx = this.add.graphics().setDepth(20);
    this.buildWeaponRig();
    this.hud = this.add.text(26, 20, '', {
      fontSize: this.isMobileControls ? '21px' : '16px', color: '#edf2f7', fontStyle: 'bold',
      backgroundColor: '#0b1119cc', padding: { x: 12, y: 10 },
    }).setDepth(30);
    this.message = this.add.text(GAME_WIDTH / 2, 112, '', {
      fontSize: this.isMobileControls ? '26px' : '18px', color: '#f0c16d', fontStyle: 'bold', align: 'center',
      backgroundColor: '#111821cc', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(30);
    this.reloadHint = this.add.text(1120, 653, 'R  ПЕРЕЗАРЯДКА', {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#7d2930', padding: { x: 12, y: 9 },
    }).setOrigin(0.5).setDepth(30);
    this.reloadHint.setVisible(!this.isMobileControls);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isMobileControlPoint(pointer.x, pointer.y)) this.aim = { x: pointer.x, y: pointer.y };
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'active' || this.isMobileControlPoint(pointer.x, pointer.y)) return;
      this.aim = { x: pointer.x, y: pointer.y };
      this.shoot();
    });
    this.input.on('pointerup', () => { this.mobileFireHeld = false; });
    if (this.isMobileControls) this.buildMobileControls();
    this.input.keyboard?.on('keydown-R', () => this.reload());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

    this.loadMissionScene(0);
    this.showToast('УСТРАНИТЕ ВСЕХ ПРОТИВНИКОВ', 1800);
  }

  private buildWeaponRig(): void {
    const rig = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + 95).setDepth(18);
    if (AssetCatalog.hasTexture(this, 'weapon-pistol')) {
      rig.add(this.add.image(0, -190, 'weapon-pistol').setDisplaySize(180, 380));
      this.weaponRig = rig;
      this.updateWeaponRig();
      return;
    }
    const art = this.add.graphics();
    // Arm, hand and service pistol rotate as one rig and track the reticle.
    art.fillStyle(0x111923, 1); art.fillRoundedRect(-58, -218, 116, 190, 28);
    art.fillStyle(0x293747, 1); art.fillRoundedRect(-51, -211, 102, 176, 24);
    art.fillStyle(0x485564, 1); art.fillRoundedRect(-48, -208, 96, 14, 7);
    art.fillStyle(0xb78365, 1); art.fillRoundedRect(-28, -202, 56, 76, 15);
    art.fillStyle(0x9b6b52, 1); art.fillRoundedRect(-23, -180, 46, 46, 12);
    art.fillStyle(0x11161d, 1); art.fillRoundedRect(-22, -354, 44, 188, 7);
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
    const originX = GAME_WIDTH / 2;
    const originY = GAME_HEIGHT + 95 + this.weaponRecoil;
    this.weaponRig.setPosition(originX, originY);
    this.weaponRig.setRotation(Phaser.Math.Angle.Between(originX, originY, this.aim.x, this.aim.y) + Math.PI / 2);
  }

  private getWeaponMuzzle(): Point {
    const rotation = this.weaponRig?.rotation ?? 0;
    const originX = GAME_WIDTH / 2;
    const originY = GAME_HEIGHT + 95 + this.weaponRecoil;
    return { x: originX + 357 * Math.sin(rotation), y: originY - 357 * Math.cos(rotation) };
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'paused' || this.phase === 'finished') return;
    const dt = Math.min(delta, 50);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    if (this.mobileFireHeld && this.phase === 'active') this.shoot();
    this.shotFlash = Math.max(0, this.shotFlash - dt);
    this.weaponRecoil = Math.max(0, this.weaponRecoil - dt * 0.16);
    this.playerHitFlash = Math.max(0, this.playerHitFlash - dt);
    for (const effect of this.impactEffects) effect.life -= dt;
    this.impactEffects = this.impactEffects.filter((effect) => effect.life > 0);
    this.toastTimer = Math.max(0, this.toastTimer - dt);

    if (this.phase === 'transition') {
      this.drawFrame();
      return;
    }

    if (this.reloading > 0) {
      this.reloading -= dt;
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
      if (child.name.startsWith('enemy-image-') || child.name.startsWith('cover-image-')) child.destroy();
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
  }

  private spawnWave(): void {
    const wave = this.sceneDef.waves[this.waveIndex];
    if (!wave) return;
    this.enemies = wave.enemies.map((type, index) => {
      const spawn: SpawnPoint = wave.spawnPoints[index] ?? { x: 300 + index * 190, y: 350 };
      return {
        uid: this.uniqueId++, type, x: spawn.x, baseX: spawn.x, y: spawn.y, originY: spawn.y,
        hp: ENEMIES[type].hp, maxHp: ENEMIES[type].hp, coverId: spawn.coverId,
        state: 'Exposed', timer: ENEMIES[type].exposeMs * (0.4 + index * 0.22), phase: 0, hitFlash: 0,
      };
    });
    this.waveAwarded = false;
    this.showToast('ВОЛНА ' + (this.waveIndex + 1) + '/' + this.sceneDef.waves.length, 1200);
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
    this.award(BALANCE.rewards.wave);
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
      if (child.name.startsWith('enemy-image-')) child.destroy();
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

    const torso = this.add.rectangle(0, -111, 52, 78, 0x263441).setStrokeStyle(2, 0x526171, 0.55);
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
            this.showToast(this.sceneDef.subtitle + ' • ' + this.sceneDef.title, 1700);
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
        case 'Exposed': enemy.state = 'Aiming'; enemy.timer = def.aimMs; break;
        case 'Aiming':
          enemy.state = 'Attacking'; enemy.timer = 260; this.damagePlayer(def.damage); break;
        case 'Attacking': {
          enemy.state = 'SeekingCover';
          enemy.timer = 320;
          const cover = this.sceneDef.covers.find((item) => item.id === enemy.coverId);
          if (cover) {
            this.tweens.add({
              targets: enemy,
              x: cover.x + cover.width / 2,
              y: cover.y + cover.height / 2 + 20,
              duration: 320,
              ease: 'Sine.easeIn',
            });
          }
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
        case 'Repositioning': enemy.state = 'Exposed'; enemy.baseX = enemy.x; enemy.timer = def.exposeMs; break;
      }
    }
  }

  private shoot(): void {
    if (this.phase !== 'active' || this.reloading > 0 || this.shotCooldown > 0) return;
    const save = saveService.load();
    if (this.magazine <= 0) { this.showToast('ПУСТО • НАЖМИТЕ R ДЛЯ ПЕРЕЗАРЯДКИ', 900); return; }
    this.magazine -= 1;
    this.shots += 1;
    this.shotCooldown = BALANCE.weapon.shotCooldownMs;
    this.shotFlash = 135;
    this.weaponRecoil = 18;

    let chosen: { enemy: RuntimeEnemy; part: 'head' | 'body'; target: Point } | null = null;
    let chosenDistance = Number.POSITIVE_INFINITY;

    // Screen-space target checks come first. The previous muzzle-to-target ray
    // crossed foreground rectangles even when the reticle was visibly on an enemy.
    for (const enemy of this.enemies) {
      if (enemy.state === 'Defeated' || enemy.state === 'Hidden') continue;
      const head = { x: enemy.x, y: enemy.y - 48 };
      const body = { x: enemy.x, y: enemy.y - 5 };
      const part = resolveHit(this.aim, head, body, 32, 48);
      if (!part) continue;
      const target = part === 'head' ? head : body;
      const distance = Math.hypot(this.aim.x - target.x, this.aim.y - target.y);
      if (distance < chosenDistance) {
        chosen = { enemy, part, target };
        chosenDistance = distance;
      }
    }

    if (chosen) {
      this.hits += 1;
      const damage = BALANCE.weapon.damage[save.upgrades.damage]
        * (chosen.part === 'head' ? BALANCE.weapon.headMultiplier : 1);
      chosen.enemy.hp -= damage;
      chosen.enemy.hitFlash = 230;
      this.impactEffects.push({ x: chosen.target.x, y: chosen.target.y, life: 520, maxLife: 520, kind: 'hit', damage });
      const damageLabel = this.add.text(
        chosen.target.x + 20, chosen.target.y - 24,
        chosen.part === 'head' ? 'В ГОЛОВУ  −' + damage : '−' + damage,
        { fontSize: chosen.part === 'head' ? '22px' : '24px', color: '#ffe0a0', fontStyle: 'bold',
          stroke: '#10161d', strokeThickness: 5 },
      ).setOrigin(0.5).setDepth(26);
      this.tweens.add({
        targets: damageLabel, y: damageLabel.y - 42, alpha: 0,
        duration: 560, ease: 'Cubic.easeOut',
        onComplete: () => damageLabel.destroy(),
      });
      this.showToast((chosen.part === 'head' ? 'ПОПАДАНИЕ В ГОЛОВУ' : 'ПОПАДАНИЕ') + ' • −' + damage, 450);
      if (chosen.enemy.hp <= 0) {
        this.tweens.killTweensOf(chosen.enemy);
        chosen.enemy.state = 'Defeated';
        this.kills += 1;
        this.award(BALANCE.rewards.kill);
        this.showToast(ENEMIES[chosen.enemy.type].name.toUpperCase() + ' УСТРАНЁН • +' + BALANCE.rewards.kill + ' XP', 800);
      }
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
    const capacity = BALANCE.weapon.magazine[save.upgrades.magazine];
    if (this.magazine >= capacity || this.reserve <= 0) return;
    this.reloading = BALANCE.weapon.reloadSeconds[save.upgrades.reload] * 1000;
    this.showToast('ПЕРЕЗАРЯДКА…', this.reloading);
  }

  private finishReload(): void {
    const save = saveService.load();
    const capacity = BALANCE.weapon.magazine[save.upgrades.magazine];
    const loaded = Math.min(capacity - this.magazine, this.reserve);
    this.magazine += loaded;
    this.reserve -= loaded;
    this.reloading = 0;
    this.showToast('ГОТОВО', 500);
  }

  private damagePlayer(amount: number): void {
    if (this.phase !== 'active') return;
    this.hp = Math.max(0, this.hp - amount);
    this.playerHitFlash = 190;
    this.damageTaken += amount;
    this.showToast('ВРАГ ПОПАЛ • −' + amount + ' HP', 750);
  }

  private award(amount: number): void {
    this.reputationEarned += amount;
    this.totalReputation += amount;
    saveService.addReputation(amount);
  }

  private finishMission(success: boolean): void {
    if (this.resultSent) return;
    this.resultSent = true;
    this.phase = 'finished';
    if (success) this.award(BALANCE.rewards.mission);
    runSession.result = {
      success,
      elapsedSeconds: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
      kills: this.kills, shots: this.shots, hits: this.hits,
      damageTaken: this.damageTaken, reputationEarned: this.reputationEarned,
    };
    this.scene.start('Results');
  }

  private isMobileControlPoint(x: number, y: number): boolean {
    if (!this.isMobileControls) return false;
    const zones = [
      { x: MOBILE_FIRE.x - 76, y: MOBILE_FIRE.y - 76, width: 152, height: 152 },
      { x: MOBILE_RELOAD.x - 54, y: MOBILE_RELOAD.y - 54, width: 108, height: 108 },
      { x: MOBILE_PAUSE.x - 42, y: MOBILE_PAUSE.y - 42, width: 84, height: 84 },
    ];
    return zones.some((zone) => x >= zone.x && x <= zone.x + zone.width
      && y >= zone.y && y <= zone.y + zone.height);
  }

  private buildMobileControls(): void {
    // Draw the touch controls as one explicit UI layer. Hit zones are separate,
    // so touch input remains reliable even if a browser has trouble with Circle objects.
    const controls = this.add.graphics().setDepth(40).setScrollFactor(0);
    controls.fillStyle(0x9d3036, 0.96);
    controls.fillCircle(MOBILE_FIRE.x, MOBILE_FIRE.y, 66);
    controls.lineStyle(5, 0xffdfb4, 1);
    controls.strokeCircle(MOBILE_FIRE.x, MOBILE_FIRE.y, 66);
    controls.fillStyle(0x263747, 0.98);
    controls.fillCircle(MOBILE_RELOAD.x, MOBILE_RELOAD.y, 44);
    controls.lineStyle(4, 0xe2b96e, 1);
    controls.strokeCircle(MOBILE_RELOAD.x, MOBILE_RELOAD.y, 44);
    controls.fillStyle(0x263747, 0.98);
    controls.fillCircle(MOBILE_PAUSE.x, MOBILE_PAUSE.y, 31);
    controls.lineStyle(3, 0xe2b96e, 1);
    controls.strokeCircle(MOBILE_PAUSE.x, MOBILE_PAUSE.y, 31);

    this.add.text(MOBILE_FIRE.x, MOBILE_FIRE.y, 'ОГОНЬ', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#551c22', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.add.text(MOBILE_RELOAD.x, MOBILE_RELOAD.y, '↻', {
      fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#101820', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.add.text(MOBILE_PAUSE.x, MOBILE_PAUSE.y, 'Ⅱ', {
      fontSize: '23px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#101820', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    const fireZone = this.add.zone(MOBILE_FIRE.x, MOBILE_FIRE.y, 142, 142)
      .setDepth(42).setScrollFactor(0).setInteractive();
    fireZone.on('pointerdown', () => {
      this.mobileFireHeld = true;
      this.shoot();
    });
    fireZone.on('pointerup', () => { this.mobileFireHeld = false; });
    fireZone.on('pointerout', () => { this.mobileFireHeld = false; });

    const reloadZone = this.add.zone(MOBILE_RELOAD.x, MOBILE_RELOAD.y, 100, 100)
      .setDepth(42).setScrollFactor(0).setInteractive();
    reloadZone.on('pointerdown', () => this.reload());

    const pauseZone = this.add.zone(MOBILE_PAUSE.x, MOBILE_PAUSE.y, 76, 76)
      .setDepth(42).setScrollFactor(0).setInteractive();
    pauseZone.on('pointerdown', () => this.togglePause());

    this.add.text(MOBILE_RELOAD.x, MOBILE_RELOAD.y - 58, 'ПЕРЕЗАРЯДКА', {
      fontSize: '12px', color: '#e8edf3', fontStyle: 'bold',
      stroke: '#101820', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
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
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080c, 0.78);
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'ПАУЗА', { fontSize: '42px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25, this.isMobileControls ? 'НАЖМИТЕ КНОПКУ ПАУЗЫ ДЛЯ ПРОДОЛЖЕНИЯ' : 'ESC — ПРОДОЛЖИТЬ', { fontSize: '16px', color: '#e0b763' }).setOrigin(0.5);
    const resume = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 250, 52, 0x8c3036, 0.98)
      .setStrokeStyle(2, 0xe2b96e, 1).setInteractive();
    const resumeLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 'ПРОДОЛЖИТЬ', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    resume.on('pointerdown', () => this.togglePause());
    this.pauseOverlay = this.add.container(0, 0, [shade, label, hint, resume, resumeLabel]).setDepth(100);
  }

  private getDisplayedWaveNumber(): number {
    return Math.min(this.waveIndex + 1, this.sceneDef.waves.length);
  }

  private drawFrame(): void {
    this.world.clear();
    this.drawEnemies();
    this.drawCovers();
    this.drawEffects();
    const ammoText = this.reloading > 0 ? 'ПЕРЕЗАРЯДКА ' + (this.reloading / 1000).toFixed(1) + 'с' : 'ПАТРОНЫ ' + this.magazine + '/' + this.reserve;
    this.hud.setText(this.isMobileControls
      ? 'КАЗИНО ' + (this.sceneIndex + 1) + '/' + CASINO_MISSION.length + ' • ВОЛНА ' + this.getDisplayedWaveNumber() + '/' + this.sceneDef.waves.length
        + '\nHP ' + this.hp + '/' + BALANCE.player.maxHp + ' • ' + ammoText + ' • XP ' + this.totalReputation
      : 'ОПЕРАЦИЯ: КАЗИНО     СЦЕНА ' + (this.sceneIndex + 1) + '/' + CASINO_MISSION.length +
        '     ВОЛНА ' + this.getDisplayedWaveNumber() + '/' + this.sceneDef.waves.length +
        '\nЗДОРОВЬЕ ' + this.hp + '/' + BALANCE.player.maxHp + '     ' + ammoText + '     XP ' + this.totalReputation);
    this.message.setText(this.toastText).setVisible(this.toastTimer > 0);
    this.reloadHint.setText(this.reloading > 0 ? 'ПЕРЕЗАРЯДКА…' : 'R  ПЕРЕЗАРЯДКА');
  }

  private drawEnemies(): void {
    for (const enemy of this.enemies) {
      const spriteKey = 'enemy-image-' + enemy.uid;
      const sprite = this.children.getByName(spriteKey) as Phaser.GameObjects.Image | null;
      if (enemy.state === 'Defeated' || enemy.state === 'Hidden') {
        sprite?.setVisible(false);
        continue;
      }
      const def = ENEMIES[enemy.type];
      const hitOffset = enemy.hitFlash > 0 ? Math.sin(this.time.now / 24) * 5 * (enemy.hitFlash / 230) : 0;
      const idleBob = Math.sin((this.time.now + enemy.uid * 97) / 270) * 2.2;
      const drawX = enemy.x + hitOffset;
      const drawY = enemy.y - 20 + idleBob;
      if (AssetCatalog.hasTexture(this, SPRITES[enemy.type])) {
        let image = sprite;
        if (!image) image = this.add.image(drawX, drawY, SPRITES[enemy.type]).setName(spriteKey).setDepth(2);
        image.setPosition(drawX, drawY).setDisplaySize(enemy.type === 'armored' ? 92 : 84, enemy.type === 'armored' ? 154 : 146).setVisible(true);
        if (enemy.hitFlash > 0) image.setAlpha(0.72 + Math.sin(this.time.now / 20) * 0.28);
        else image.setAlpha(1);
      } else {
        this.world.fillStyle(0x05080c, 0.45); this.world.fillEllipse(drawX, enemy.y + 3, 65, 15);
        this.world.fillStyle(def.color, 1); this.world.fillRoundedRect(drawX - 24, drawY - 18, 48, 76, 8);
        this.world.fillStyle(0x17202a, 1); this.world.fillCircle(drawX, drawY - 32, enemy.type === 'armored' ? 18 : 14);
        this.world.fillStyle(0x0a1018, 1); this.world.fillRect(drawX - 33, drawY + 7, 66, 10);
        this.world.fillStyle(0x263342, 1); this.world.fillRect(drawX + 15, drawY + 12, 40, 7);
        if (enemy.type === 'armored') {
          this.world.lineStyle(4, 0xefd1a2, 0.8); this.world.strokeRoundedRect(enemy.x - 28, enemy.y - 42, 56, 88, 10);
        }
      }
      this.fx.fillStyle(0x131a22, 0.9); this.fx.fillRoundedRect(enemy.x - 29, enemy.y - 88, 58, 7, 3);
      this.fx.fillStyle(def.color, 1); this.fx.fillRoundedRect(enemy.x - 29, enemy.y - 88, 58 * (enemy.hp / enemy.maxHp), 7, 3);
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
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        this.fx.lineBetween(
          muzzle.x + Math.cos(angle) * 10, muzzle.y + Math.sin(angle) * 10,
          muzzle.x + Math.cos(angle) * 25, muzzle.y + Math.sin(angle) * 25,
        );
      }
    }

    for (const effect of this.impactEffects) {
      const alpha = Math.max(0, effect.life / effect.maxLife);
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
      this.fx.fillStyle(0x131a22, 0.9); this.fx.fillRoundedRect(enemy.x - 29, enemy.y - 88, 58, 7, 3);
      this.fx.fillStyle(def.color, 1); this.fx.fillRoundedRect(enemy.x - 29, enemy.y - 88, 58 * (enemy.hp / enemy.maxHp), 7, 3);
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
