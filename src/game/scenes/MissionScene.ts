import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { saveService } from '../../persistence/SaveService';
import { BALANCE } from '../data/balance';
import { ENEMIES, type EnemyType } from '../data/enemies';
import { CASINO_MISSION, type MissionSceneDefinition, type SpawnPoint } from '../data/missions';
import { AssetCatalog } from '../assets/AssetCatalog';
import { isShotBlocked, resolveHit, type Point, type Rect } from '../systems/combat/combatMath';
import { runSession } from '../systems/missions/runSession';

type EnemyState = 'Exposed' | 'Aiming' | 'Attacking' | 'SeekingCover' | 'Hidden' | 'Peeking' | 'Repositioning' | 'Defeated';
interface RuntimeEnemy {
  uid: number; type: EnemyType; x: number; baseX: number; y: number; hp: number; maxHp: number;
  coverId?: string; state: EnemyState; timer: number; phase: number;
}

const MUZZLE: Point = { x: GAME_WIDTH / 2, y: 662 };
const SPRITES: Record<EnemyType, string> = {
  guard: 'enemy-guard', armored: 'enemy-armored', assault: 'enemy-assault',
};

export class MissionScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private reloadHint!: Phaser.GameObjects.Text;
  private backgroundArt?: Phaser.GameObjects.Image;
  private aim: Point = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  private enemies: RuntimeEnemy[] = [];
  private sceneIndex = 0;
  private waveIndex = 0;
  private spawnTimer = 300;
  private phase: 'active' | 'transition' | 'finished' | 'paused' = 'active';
  private transitionTimer = 0;
  private hp = BALANCE.player.maxHp;
  private magazine = BALANCE.weapon.magazine[0];
  private reserve = 48;
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

  constructor() { super('Mission'); }

  create(): void {
    this.startedAt = Date.now();
    const initialSave = saveService.load();
    this.totalReputation = initialSave.reputation;
    this.magazine = BALANCE.weapon.magazine[initialSave.upgrades.magazine];
    this.world = this.add.graphics().setDepth(0);
    this.fx = this.add.graphics().setDepth(20);
    this.hud = this.add.text(26, 20, '', {
      fontSize: '16px', color: '#edf2f7', fontStyle: 'bold',
      backgroundColor: '#0b1119cc', padding: { x: 12, y: 10 },
    }).setDepth(30);
    this.message = this.add.text(GAME_WIDTH / 2, 112, '', {
      fontSize: '18px', color: '#f0c16d', fontStyle: 'bold', align: 'center',
      backgroundColor: '#111821cc', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(30);
    this.reloadHint = this.add.text(1120, 653, 'R  ПЕРЕЗАРЯДКА', {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#7d2930', padding: { x: 12, y: 9 },
    }).setOrigin(0.5).setDepth(30);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.aim = { x: pointer.x, y: pointer.y };
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'active') return;
      this.aim = { x: pointer.x, y: pointer.y };
      if (pointer.x > 1040 && pointer.y > 600) this.reload();
      else this.shoot();
    });
    this.input.keyboard?.on('keydown-R', () => this.reload());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

    this.loadMissionScene(0);
    this.showToast('УСТРАНИТЕ ВСЕХ ПРОТИВНИКОВ', 1800);
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'paused' || this.phase === 'finished') return;
    const dt = Math.min(delta, 50);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    this.shotFlash = Math.max(0, this.shotFlash - dt);
    this.toastTimer = Math.max(0, this.toastTimer - dt);

    if (this.phase === 'transition') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) this.loadMissionScene(this.sceneIndex + 1);
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
    this.world.clear();
    if (this.backgroundArt) return;
    this.world.fillGradientStyle(0x18212c, 0x18212c, 0x292a31, 0x121820, 1);
    this.world.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.world.fillStyle(0x8c3333, 0.13); this.world.fillRect(0, 100, GAME_WIDTH, 340);
    this.world.fillStyle(0xe9b868, 0.09); this.world.fillRect(0, 100, GAME_WIDTH, 10);
    for (let i = 0; i < 9; i += 1) {
      const x = 80 + i * 140;
      this.world.fillStyle(0xf3bd66, 0.09); this.world.fillCircle(x, 180, 54);
      this.world.fillStyle(0x111820, 0.42); this.world.fillRect(x - 43, 230, 86, 190);
    }
    this.world.fillStyle(0x8c242b, 0.5); this.world.fillRect(0, 515, GAME_WIDTH, 90);
    this.world.lineStyle(2, 0xc58c4b, 0.36); this.world.lineBetween(0, 515, GAME_WIDTH, 515);
    this.world.fillStyle(0x242c37, 1); this.world.fillRect(0, 590, GAME_WIDTH, 130);
  }

  private spawnWave(): void {
    const wave = this.sceneDef.waves[this.waveIndex];
    if (!wave) return;
    this.enemies = wave.enemies.map((type, index) => {
      const spawn: SpawnPoint = wave.spawnPoints[index] ?? { x: 300 + index * 190, y: 350 };
      return {
        uid: this.uniqueId++, type, x: spawn.x, baseX: spawn.x, y: spawn.y,
        hp: ENEMIES[type].hp, maxHp: ENEMIES[type].hp, coverId: spawn.coverId,
        state: 'Exposed', timer: ENEMIES[type].exposeMs * (0.4 + index * 0.22), phase: 0,
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
    this.waveIndex += 1;
    if (this.waveIndex < this.sceneDef.waves.length) {
      this.enemies = [];
      this.spawnTimer = 900;
    } else if (this.sceneIndex + 1 < CASINO_MISSION.length) {
      this.phase = 'transition';
      this.transitionTimer = 1250;
      this.showToast('СЕКТОР ЗАЧИЩЕН • ПЕРЕХОД', 1150);
    } else {
      this.finishMission(true);
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (enemy.state === 'Defeated') continue;
      enemy.timer -= dt;
      if (enemy.timer > 0) continue;
      const def = ENEMIES[enemy.type];
      switch (enemy.state) {
        case 'Exposed': enemy.state = 'Aiming'; enemy.timer = def.aimMs; break;
        case 'Aiming':
          enemy.state = 'Attacking'; enemy.timer = 260; this.damagePlayer(def.damage); break;
        case 'Attacking': enemy.state = 'SeekingCover'; enemy.timer = 320; break;
        case 'SeekingCover': enemy.state = 'Hidden'; enemy.timer = def.hiddenMs; break;
        case 'Hidden': enemy.state = 'Peeking'; enemy.timer = def.peekMs; enemy.phase += 1; break;
        case 'Peeking': {
          enemy.state = 'Repositioning';
          enemy.timer = enemy.type === 'assault' ? 260 : 390;
          const cover = this.sceneDef.covers.find((item) => item.id === enemy.coverId);
          if (cover) {
            // Move to the side of the cover facing the player so the enemy can be hit while peeking.
            enemy.x = MUZZLE.x < cover.x
              ? cover.x - 70
              : cover.x + cover.width + 70;
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
    this.shotFlash = 90;

    let chosen: { enemy: RuntimeEnemy; part: 'head' | 'body' } | null = null;
    let chosenDistance = Number.POSITIVE_INFINITY;
    const blockers: Rect[] = this.sceneDef.covers.map((c) => ({ x: c.x, y: c.y, width: c.width, height: c.height }));
    for (const enemy of this.enemies) {
      if (enemy.state === 'Defeated' || enemy.state === 'Hidden') continue;
      const head = { x: enemy.x, y: enemy.y - 48 };
      const body = { x: enemy.x, y: enemy.y - 5 };
      const part = resolveHit(this.aim, head, body, 18, 31);
      if (!part) continue;
      const target = part === 'head' ? head : body;
      if (isShotBlocked(MUZZLE, target, blockers)) continue;
      const d = Math.hypot(this.aim.x - target.x, this.aim.y - target.y);
      if (d < chosenDistance) { chosen = { enemy, part }; chosenDistance = d; }
    }

    if (chosen) {
      this.hits += 1;
      const damage = BALANCE.weapon.damage[save.upgrades.damage]
        * (chosen.part === 'head' ? BALANCE.weapon.headMultiplier : 1);
      chosen.enemy.hp -= damage;
      this.showToast((chosen.part === 'head' ? 'ПОПАДАНИЕ В ГОЛОВУ' : 'ПОПАДАНИЕ') + ' • −' + damage, 450);
      if (chosen.enemy.hp <= 0) {
        chosen.enemy.state = 'Defeated';
        this.kills += 1;
        this.award(BALANCE.rewards.kill);
        this.showToast(ENEMIES[chosen.enemy.type].name.toUpperCase() + ' УСТРАНЁН • +' + BALANCE.rewards.kill + ' XP', 800);
      }
    } else if (blockers.some((r) => isShotBlocked(MUZZLE, this.aim, [r]))) {
      this.showToast('ПОПАДАНИЕ В УКРЫТИЕ', 450);
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
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25, 'ESC — ПРОДОЛЖИТЬ', { fontSize: '16px', color: '#e0b763' }).setOrigin(0.5);
    this.pauseOverlay = this.add.container(0, 0, [shade, label, hint]).setDepth(100);
  }

  private drawFrame(): void {
    this.world.clear();
    if (!this.backgroundArt) this.drawBackground();
    this.drawEnemies();
    this.drawCovers();
    this.drawEffects();
    const ammoText = this.reloading > 0 ? 'ПЕРЕЗАРЯДКА ' + (this.reloading / 1000).toFixed(1) + 'с' : 'ПАТРОНЫ ' + this.magazine + '/' + this.reserve;
    this.hud.setText(
      'ОПЕРАЦИЯ: КАЗИНО     СЦЕНА ' + (this.sceneIndex + 1) + '/' + CASINO_MISSION.length +
      '     ВОЛНА ' + (this.waveIndex + 1) + '/' + this.sceneDef.waves.length +
      '\nЗДОРОВЬЕ ' + this.hp + '/' + BALANCE.player.maxHp + '     ' + ammoText + '     XP ' + this.totalReputation,
    );
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
      if (AssetCatalog.hasTexture(this, SPRITES[enemy.type])) {
        let image = sprite;
        if (!image) image = this.add.image(enemy.x, enemy.y - 35, SPRITES[enemy.type]).setName(spriteKey).setDepth(2);
        image.setPosition(enemy.x, enemy.y - 35).setDisplaySize(enemy.type === 'armored' ? 80 : 66, 118).setVisible(true);
      } else {
        this.world.fillStyle(0x05080c, 0.45); this.world.fillEllipse(enemy.x, enemy.y + 3, 65, 15);
        this.world.fillStyle(def.color, 1); this.world.fillRoundedRect(enemy.x - 24, enemy.y - 38, 48, 76, 8);
        this.world.fillStyle(0x17202a, 1); this.world.fillCircle(enemy.x, enemy.y - 52, enemy.type === 'armored' ? 18 : 14);
        this.world.fillStyle(0x0a1018, 1); this.world.fillRect(enemy.x - 33, enemy.y - 13, 66, 10);
        this.world.fillStyle(0x263342, 1); this.world.fillRect(enemy.x + 15, enemy.y - 8, 40, 7);
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
    for (const cover of this.sceneDef.covers) {
      if (AssetCatalog.hasTexture(this, 'cover-crate')) {
        const key = 'cover-image-' + cover.id;
        let image = this.children.getByName(key) as Phaser.GameObjects.Image | null;
        if (!image) image = this.add.image(cover.x + cover.width / 2, cover.y + cover.height / 2, 'cover-crate').setName(key).setDepth(8);
        image.setPosition(cover.x + cover.width / 2, cover.y + cover.height / 2).setDisplaySize(cover.width, cover.height);
      } else {
        this.world.fillStyle(0x101820, 0.98); this.world.fillRoundedRect(cover.x, cover.y, cover.width, cover.height, 7);
        this.world.lineStyle(3, 0x778391, 0.9); this.world.strokeRoundedRect(cover.x, cover.y, cover.width, cover.height, 7);
        this.world.lineStyle(2, 0x3c4a58, 0.9);
        this.world.lineBetween(cover.x + 12, cover.y + 14, cover.x + cover.width - 12, cover.y + cover.height - 14);
        this.world.lineBetween(cover.x + cover.width - 12, cover.y + 14, cover.x + 12, cover.y + cover.height - 14);
      }
    }
  }

  private drawEffects(): void {
    this.fx.clear();
    // Enemy HUD and telegraphs are redrawn after clear.
    this.drawEnemyOverlays();
    if (AssetCatalog.hasTexture(this, 'weapon-pistol')) {
      let weapon = this.children.getByName('weapon-pistol-image') as Phaser.GameObjects.Image | null;
      if (!weapon) weapon = this.add.image(GAME_WIDTH / 2, 654, 'weapon-pistol').setName('weapon-pistol-image').setDepth(12);
      weapon.setPosition(GAME_WIDTH / 2, 654).setDisplaySize(105, 138).setVisible(true);
    } else {
      this.fx.fillStyle(0x080c11, 1); this.fx.fillRoundedRect(GAME_WIDTH / 2 - 54, 622, 108, 98, 20);
      this.fx.fillStyle(0x343d48, 1); this.fx.fillRoundedRect(GAME_WIDTH / 2 - 24, 586, 48, 120, 10);
      this.fx.fillStyle(0x151c25, 1); this.fx.fillRoundedRect(GAME_WIDTH / 2 - 14, 586, 28, 80, 5);
    }
    if (this.shotFlash > 0) {
      this.fx.fillStyle(0xffd58a, this.shotFlash / 90); this.fx.fillCircle(MUZZLE.x, 570, 17 + (90 - this.shotFlash) / 3);
      this.fx.lineStyle(3, 0xffd58a, this.shotFlash / 90); this.fx.lineBetween(MUZZLE.x, 590, this.aim.x, this.aim.y);
    }
    this.fx.lineStyle(2, 0xf5f7fa, 0.92);
    this.fx.strokeCircle(this.aim.x, this.aim.y, 12);
    this.fx.lineBetween(this.aim.x - 22, this.aim.y, this.aim.x - 6, this.aim.y);
    this.fx.lineBetween(this.aim.x + 6, this.aim.y, this.aim.x + 22, this.aim.y);
    this.fx.lineBetween(this.aim.x, this.aim.y - 22, this.aim.x, this.aim.y - 6);
    this.fx.lineBetween(this.aim.x, this.aim.y + 6, this.aim.x, this.aim.y + 22);
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
    }
  }

  private showToast(text: string, duration: number): void {
    this.toastText = text;
    this.toastTimer = duration;
    if (this.message) this.message.setText(text).setVisible(true);
  }
}
