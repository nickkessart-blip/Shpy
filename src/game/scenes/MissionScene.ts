import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, hasTouchInput } from '../../app/GameConfig';
import { saveService } from '../../persistence/SaveService';
import { BALANCE } from '../data/balance';
import { getWeapon, getWeaponStats, LOADOUT_UNLOCKS, type WeaponId } from '../data/arsenal';
import { ENEMIES, type EnemyType } from '../data/enemies';
import { CASINO_MISSION, getMissionDefinition, type CoverDefinition, type MissionSceneDefinition } from '../data/missions';
import { applyCoverDamage, createCoverDurability, type CoverDurabilityState } from '../systems/combat/coverDurability';
import { AssetCatalog } from '../assets/AssetCatalog';
import { getCosmetic } from '../data/cosmetics';
import { findVisiblePeekX, getAimFeedbackState, isShotBlocked, resolveHit, type AimFeedbackState, type Point } from '../systems/combat/combatMath';
import { runSession } from '../systems/missions/runSession';
import { settingsService, type GameSettings } from '../../settings/SettingsService';
import { followAimWithCamera, moveAimByPointerDelta, moveAimInWorld } from '../systems/input/aimMath';
import { getMobileControlScale } from '../systems/input/mobileControlLayout';
import { FeedbackService, triggerHaptic } from '../systems/feedback/FeedbackService';
import { RailTimeline } from '../systems/missions/RailTimeline';
import { planEnemyWave, sampleSpawnEntryX } from '../systems/waves/SpawnDirector';
import { sampleEnemyAimCharge, sampleEnemyHitReaction } from '../systems/combat/enemyPresentation';
import {
  ARMORED_RECOVERY_MS,
  ASSAULT_REPOSITION_MS,
  getAssaultFlankTargetX,
  getEnemyHitAreaMultiplier,
} from '../systems/combat/enemyCombatRules';
import { getEnemyProjectileTravelMs, sampleEnemyProjectile } from '../systems/combat/enemyProjectile';
import { findEnemyProjectileCoverImpact, getEnemyProjectileCoverDamage } from '../systems/combat/enemyProjectileCover';
import {
  PLAYER_DODGE_COOLDOWN_MS,
  PLAYER_DODGE_DURATION_MS,
  isPlayerDodgeEvading,
  samplePlayerDodgePose,
} from '../systems/combat/playerDodge';
import {
  getFirstPersonWeaponMuzzlePoint,
  getFirstPersonWeaponRotationOffset,
} from '../systems/combat/weaponViewmodel';
import { advanceFirstOperationTutorial, type TutorialEvent } from '../systems/missions/firstOperationTutorial';
import {
  sampleCasinoLightEvent,
  type CasinoLightEventState,
  type CasinoLightPhase,
} from '../systems/missions/casinoLightEvent';
import {
  CASINO_JACKPOT_FLASH_MS,
  canCasinoJackpotDistract,
  getCasinoJackpotDistractionMs,
  sampleCasinoJackpotEvent,
  type CasinoJackpotEventState,
  type CasinoJackpotPhase,
} from '../systems/missions/casinoJackpotEvent';
import {
  getCasinoRouletteTargetScreenRect,
  isCasinoRouletteTargetAtScreenPoint,
  type CasinoRouletteTargetScreenRect,
} from '../systems/missions/casinoRouletteTarget';

type EnemyState = 'Entering' | 'Exposed' | 'Aiming' | 'Attacking' | 'SeekingCover' | 'Hidden' | 'Peeking' | 'Repositioning' | 'Defeated';
type TutorialStep = 'fire' | 'reload' | 'telegraph' | 'dodge' | 'cover' | 'finish';
interface RuntimeEnemy {
  uid: number; type: EnemyType; x: number; baseX: number; y: number; originY: number; hp: number; maxHp: number;
  coverId?: string; state: EnemyState; timer: number;
  entryStartX: number; entryTargetX: number; entryElapsedMs: number; entryDurationMs: number;
  phase: number; bossPhase: 0 | 1 | 2; hitFlash: number; deathElapsedMs: number;
  distractionRemainingMs: number;
}
interface RuntimeEnemyProjectile {
  uid: number; type: EnemyType; start: Point; target: Point;
  elapsedMs: number; durationMs: number; damage: number; blockedByCover: boolean;
  blockedCoverId?: string; coverDamage: number;
}
interface RuntimeCover extends CoverDefinition, CoverDurabilityState {}

const MUZZLE: Point = { x: GAME_WIDTH / 2, y: 662 };
const MOBILE_AIM_BOUNDS = { minX: -420, maxX: GAME_WIDTH + 420, minY: -180, maxY: GAME_HEIGHT + 180 };
const MOBILE_CAMERA_BOUNDS = { minX: -420, maxX: 420, minY: -180, maxY: 180 };
const SPRITES: Record<EnemyType, string> = {
  guard: 'kenney-guard', armored: 'kenney-armored', assault: 'kenney-assault', boss: 'kenney-boss',
};

export class MissionScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Graphics;
  private world!: Phaser.GameObjects.Graphics;
  private coverLayer!: Phaser.GameObjects.Graphics;
  private coverDamageLayer!: Phaser.GameObjects.Graphics;
  private coverStates: RuntimeCover[] = [];
  private fx!: Phaser.GameObjects.Graphics;
  private casinoLightLayer!: Phaser.GameObjects.Graphics;
  private casinoLightElapsedMs = 0;
  private casinoLightState: CasinoLightEventState | null = null;
  private casinoLightPhase: CasinoLightPhase = 'idle';
  private casinoJackpotElapsedMs = 0;
  private casinoJackpotState: CasinoJackpotEventState | null = null;
  private casinoJackpotPhase: CasinoJackpotPhase = 'idle';
  private casinoJackpotManualFlashMs = 0;
  private casinoJackpotManualState: CasinoJackpotEventState | null = null;
  private casinoRouletteActivated = false;
  private casinoRouletteHint?: Phaser.GameObjects.Text;
  private weaponRig?: Phaser.GameObjects.Container;
  private impactEffects: Array<{ x: number; y: number; life: number; maxLife: number; kind: 'hit' | 'cover' | 'miss' | 'explosion' | 'enemy-muzzle' | 'player-hit' | 'player-dodge'; damage: number }> = [];
  private selectedWeapons: WeaponId[] = ['pistol'];
  private currentWeaponId: WeaponId = 'pistol';
  private weaponAmmo = new Map<WeaponId, { magazine: number; reserve: number }>();
  private grenadeCount = 0;
  private medkitCount = 0;
  private reloadPose = 0;
  private weaponRecoil = 0;
  private weaponRecoilAngle = 0;
  private parallaxWindowMask?: Phaser.Display.Masks.GeometryMask;
  private parallaxMaskGraphics?: Phaser.GameObjects.Graphics;
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
  private casinoFarArt?: Phaser.GameObjects.Image;
  private casinoMidArt?: Phaser.GameObjects.Image;
  private casinoNearArt?: Phaser.GameObjects.Image;
  private readonly railTimeline = new RailTimeline({ routeLength: 1280, speedPxPerSecond: 60 });
  private currentSettings: GameSettings = settingsService.load();
  private message!: Phaser.GameObjects.Text;
  private reloadHint!: Phaser.GameObjects.Text;
  private backgroundArt?: Phaser.GameObjects.Image;
  private transitionOverlay?: Phaser.GameObjects.Container;
  private transitionWalkTweens: Phaser.Tweens.Tween[] = [];
  private aim: Point = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  private enemies: RuntimeEnemy[] = [];
  private enemyProjectiles: RuntimeEnemyProjectile[] = [];
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
  private dodgeRemainingMs = 0;
  private dodgeCooldownMs = 0;
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
  private missionScenes: MissionSceneDefinition[] = CASINO_MISSION;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private tutorialStep: TutorialStep | null = null;
  private tutorialOverlay?: Phaser.GameObjects.Container;
  private tutorialTitle?: Phaser.GameObjects.Text;
  private tutorialBody?: Phaser.GameObjects.Text;
  private tutorialProgress?: Phaser.GameObjects.Text;
  private tutorialSignalSeen = false;
  private resultSent = false;
  private isMobileControls = false;
  private mobileFireHeld = false;
  private desktopFireHeld = false;
  private mobileControlsElement?: HTMLDivElement;
  private mobileSwitchButton?: HTMLButtonElement;
  private mobileSwitchCaption?: HTMLSpanElement;
  private mobileFireButton?: HTMLButtonElement;
  private mobileDodgeButton?: HTMLButtonElement;
  private mobileDodgeCaption?: HTMLSpanElement;
  private mobileGrenadeCaption?: HTMLSpanElement;
  private mobileMedkitCaption?: HTMLSpanElement;
  private mobileAimStick?: HTMLDivElement;
  private mobileGrenadeButton?: HTMLButtonElement;
  private mobileMedkitButton?: HTMLButtonElement;
  private mobileReleaseHandler?: (event: PointerEvent) => void;
  private mobileAimMoveHandler?: (event: PointerEvent) => void;
  private mobileAimEndHandler?: (event: PointerEvent) => void;
  private mobileControlsLayoutHandler?: () => void;
  private mobileFirePointerId: number | null = null;
  private mobileFireFeedback?: AimFeedbackState;
  private mobileFireBlurHandler?: () => void;
  private aimStickVector: Point = { x: 0, y: 0 };
  private aimStickActive = false;
  private aimStickPointerId: number | null = null;
  private mobileLookPointerId: number | null = null;
  private mobileLookLastPointer: Point | null = null;
  private appliedMobileControlMode: 'tap' | 'stick' = 'stick';

  constructor() { super('Mission'); }

  create(): void {
    // Phaser reuses Scene instances. Reset every run-scoped value before building the scene again.
    const initialSave = saveService.load();
    this.currentSettings = settingsService.load();
    // BootScene has completed the shared asset preload before Mission starts.
    AssetCatalog.ensureEnemyAnimationAtlas(this);
    this.appliedMobileControlMode = this.currentSettings.mobileControlMode;
    FeedbackService.ensureMusic(this);
    this.startedAt = Date.now();
    this.missionScenes = getMissionDefinition(runSession.missionId).scenes;
    this.tutorialStep = runSession.missionId === 'casino' && !initialSave.tutorialCompleted ? 'fire' : null;
    this.tutorialOverlay = undefined;
    this.tutorialTitle = undefined;
    this.tutorialBody = undefined;
    this.tutorialProgress = undefined;
    this.tutorialSignalSeen = false;
    this.aim = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBounds(-420, -180, GAME_WIDTH + 840, GAME_HEIGHT + 360);
    this.enemies = [];
    this.enemyProjectiles = [];
    this.coverStates = [];
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
    this.casinoRouletteHint?.destroy();
    this.casinoRouletteHint = undefined;
    this.casinoRouletteActivated = false;
    this.casinoJackpotManualFlashMs = 0;
    this.casinoJackpotManualState = null;
    this.backgroundArt = undefined;
    this.transitionOverlay = undefined;
    this.transitionWalkTweens = [];
    this.isMobileControls = hasTouchInput()
      || (typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) <= 800);
    this.mobileFireHeld = false;
    this.desktopFireHeld = false;
    this.mobileFirePointerId = null;
    this.dodgeRemainingMs = 0;
    this.dodgeCooldownMs = 0;
    this.mobileDodgeButton = undefined;
    this.mobileDodgeCaption = undefined;
    this.aimStickVector = { x: 0, y: 0 };
    this.aimStickActive = false;
    this.aimStickPointerId = null;
    this.mobileLookPointerId = null;
    this.mobileLookLastPointer = null;
    this.mobileFireButton = undefined;
    this.mobileFireFeedback = undefined;
    this.mobileAimStick = undefined;
    this.mobileControlsElement?.remove();
    this.mobileControlsElement = undefined;
    this.impactEffects = [];
    this.weaponRecoil = 0;
    this.weaponRecoilAngle = 0;
    this.playerHitFlash = 0;
    this.backdrop = this.add.graphics().setDepth(-20);
    this.parallaxFar = this.add.graphics().setDepth(-9).setScrollFactor(0.16);
    this.parallaxMid = this.add.graphics().setDepth(-7).setScrollFactor(0.42);
    this.parallaxNear = this.add.graphics().setDepth(-4).setScrollFactor(0.74);
    this.world = this.add.graphics().setDepth(0);
    this.casinoLightLayer = this.add.graphics().setDepth(1);
    this.coverLayer = this.add.graphics().setDepth(8);
    this.coverDamageLayer = this.add.graphics().setDepth(10);
    this.fx = this.add.graphics().setDepth(20);
    this.buildWeaponRig();
    this.hudWeaponImage = undefined;
    this.hudPanel = this.add.graphics().setDepth(29).setScrollFactor(0);
    this.hudBars = this.add.graphics().setDepth(30).setScrollFactor(0);
    this.hudIcons = this.add.graphics().setDepth(31).setScrollFactor(0);
    this.hud = this.add.text(78, 20, '', {
      fontSize: '14px', color: '#f0c16d', fontStyle: 'bold', fontFamily: 'Arial, sans-serif',
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true },
    }).setDepth(32).setScrollFactor(0);
    this.hudMissionText = this.add.text(78, 61, '', {
      fontSize: '13px', color: '#cbd5df', fontStyle: 'bold', fontFamily: 'Arial, sans-serif',
    }).setDepth(32).setScrollFactor(0);
    this.hudAmmoText = this.add.text(1030, 28, '', {
      fontSize: '25px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial, sans-serif',
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true },
    }).setDepth(32).setScrollFactor(0);
    if (AssetCatalog.hasTexture(this, 'hud-health-frame')) {
      this.add.image(246, 60, 'hud-health-frame')
        .setDisplaySize(460, 92).setDepth(33).setScrollFactor(0);
    }
    if (AssetCatalog.hasTexture(this, 'hud-ammo-frame')) {
      this.add.image(1078, 60, 'hud-ammo-frame')
        .setDisplaySize(372, 92).setDepth(33).setScrollFactor(0);
    }
    if (AssetCatalog.hasTexture(this, 'weapon-' + this.currentWeaponId)) {
      this.hudWeaponImage = this.add.image(940, 57, 'weapon-' + this.currentWeaponId)
        .setDisplaySize(42, 70).setDepth(32).setScrollFactor(0);
    }
    this.message = this.add.text(GAME_WIDTH / 2, 112, '', {
      fontSize: this.isMobileControls ? '26px' : '18px', color: '#f0c16d', fontStyle: 'bold', align: 'center',
      backgroundColor: '#111821cc', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(30).setScrollFactor(0);
    this.reloadHint = this.add.text(1120, 653, 'R  ПЕРЕЗАРЯДКА', {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#7d2930', padding: { x: 12, y: 9 },
    }).setOrigin(0.5).setDepth(30).setScrollFactor(0);
    this.reloadHint.setVisible(!this.isMobileControls);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isMobileControls && pointer.id === this.mobileLookPointerId) {
        const previous = this.mobileLookLastPointer;
        if (previous) {
          this.aim = moveAimByPointerDelta(
            this.aim,
            { x: pointer.x - previous.x, y: pointer.y - previous.y },
            this.currentSettings.aimSensitivity,
            MOBILE_AIM_BOUNDS,
          );
          const scroll = followAimWithCamera(
            this.aim,
            { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
            { width: GAME_WIDTH, height: GAME_HEIGHT },
            MOBILE_CAMERA_BOUNDS,
          );
          this.cameras.main.setScroll(scroll.x, scroll.y);
        }
        this.mobileLookLastPointer = { x: pointer.x, y: pointer.y };
        return;
      }
      if (!this.isMobileControls) this.aim = { x: pointer.x, y: pointer.y };
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isMobileControls) {
        if (this.phase !== 'active' || this.isMobileControlPoint(pointer.x, pointer.y)
          || this.currentSettings.mobileControlMode === 'stick') return;
        if (this.mobileLookPointerId === null) {
          this.mobileLookPointerId = pointer.id;
          this.mobileLookLastPointer = { x: pointer.x, y: pointer.y };
          this.aim = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.shoot();
        }
        return;
      }
      if (this.phase !== 'active' || this.isMobileControlPoint(pointer.x, pointer.y)) return;
      this.aim = { x: pointer.x, y: pointer.y };
      this.desktopFireHeld = true;
      this.shoot();
    });
    const releaseAimPointer = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.id === this.mobileLookPointerId) {
        this.mobileLookPointerId = null;
        this.mobileLookLastPointer = null;
      }
      if (!this.isMobileControls) this.desktopFireHeld = false;
    };
    this.input.on('pointerup', releaseAimPointer);
    this.input.on('pointerupoutside', releaseAimPointer);
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
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.activateDodge();
    });

    this.loadMissionScene(0);
    if (this.tutorialStep) this.createTutorialOverlay();
    this.showToast('УСТРАНИТЕ ВСЕХ ПРОТИВНИКОВ', 1800);
  }

  private buildWeaponRig(): void {
    const rig = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + 50).setDepth(18).setScrollFactor(0);
    const appearance = saveService.load().cosmetics;
    const weaponTint = getCosmetic(appearance.weaponSkinId).tint;
    const heroTint = getCosmetic(appearance.heroSkinId).tint;
    const textureKey = 'weapon-' + this.currentWeaponId;
    const atlasKey = 'weapon-fp-atlas';
    AssetCatalog.ensureFirstPersonWeaponFrames(this);
    const frameByWeapon: Record<WeaponId, string> = {
      pistol: 'fp-pistol', smg: 'fp-smg', shotgun: 'fp-shotgun', rifle: 'fp-rifle',
    };
    if (AssetCatalog.hasTexture(this, atlasKey)) {
      // Primary viewmodel: full weapon, gloves and forearms in its authored 4:3 cell ratio.
      const weaponImage = this.add.image(0, -95, atlasKey, frameByWeapon[this.currentWeaponId])
        .setDisplaySize(360, 270);
      rig.add(weaponImage);
      this.weaponRig = rig;
      this.updateWeaponRig();
      return;
    }
    if (AssetCatalog.hasTexture(this, textureKey)) {
      // Per-weapon SVGs remain a fallback if the authored full-arm sheet is missing.
      const weaponImage = this.add.image(0, -140, textureKey).setDisplaySize(240, 413);
      rig.add(weaponImage);
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
    art.setPosition(0, 95);
    rig.add(art);
    this.weaponRig = rig;
    this.updateWeaponRig();
  }

  private updateWeaponRig(): void {
    if (!this.weaponRig) return;
    if (this.isMobileControls) {
      const originX = GAME_WIDTH / 2;
      const dodgeOffsetY = samplePlayerDodgePose(this.dodgeRemainingMs).offsetY;
      const originY = GAME_HEIGHT + 50 + this.weaponRecoil + this.reloadPose * 38 + dodgeOffsetY;
      this.weaponRig.setPosition(originX, originY);
      this.weaponRig.setScale(1 + Math.min(0.035, this.weaponRecoil * 0.00022), 1 - Math.min(0.025, this.weaponRecoil * 0.00016));
      const screenAim = { x: this.aim.x - this.cameras.main.scrollX, y: this.aim.y - this.cameras.main.scrollY };
      const viewmodelOffset = AssetCatalog.hasTexture(this, 'weapon-fp-atlas')
        ? getFirstPersonWeaponRotationOffset(this.currentWeaponId) : 0;
      this.weaponRig.setRotation(Phaser.Math.Angle.Between(originX, originY, screenAim.x, screenAim.y)
        + Math.PI / 2 + viewmodelOffset - this.weaponRecoilAngle);
      return;
    }
    // Desktop weapon follows the mouse reticle.
    const followX = Phaser.Math.Clamp((this.aim.x - GAME_WIDTH / 2) * 0.11, -72, 72);
    const followY = Phaser.Math.Clamp((this.aim.y - GAME_HEIGHT / 2) * 0.055, -20, 22);
    const originX = GAME_WIDTH / 2 + followX;
    const dodgeOffsetY = samplePlayerDodgePose(this.dodgeRemainingMs).offsetY;
    const originY = GAME_HEIGHT + 50 + this.weaponRecoil + this.reloadPose * 38 + followY + dodgeOffsetY;
    this.weaponRig.setPosition(originX, originY);
    const viewmodelOffset = AssetCatalog.hasTexture(this, 'weapon-fp-atlas')
      ? getFirstPersonWeaponRotationOffset(this.currentWeaponId) : 0;
    this.weaponRig.setRotation(Phaser.Math.Angle.Between(originX, originY, this.aim.x, this.aim.y)
      + Math.PI / 2 + viewmodelOffset + this.reloadPose * 0.12 - this.weaponRecoilAngle);
  }

  private getWeaponMuzzle(): Point {
    const rig = this.weaponRig;
    const rotation = rig?.rotation ?? 0;
    const originX = rig?.x ?? GAME_WIDTH / 2;
    const originY = rig?.y ?? GAME_HEIGHT + 50 + this.weaponRecoil
      + samplePlayerDodgePose(this.dodgeRemainingMs).offsetY;
    if (AssetCatalog.hasTexture(this, 'weapon-fp-atlas')) {
      const muzzle = getFirstPersonWeaponMuzzlePoint(
        this.currentWeaponId, { x: originX, y: originY }, rotation,
      );
      return this.isMobileControls
        ? this.cameras.main.getWorldPoint(muzzle.x, muzzle.y)
        : muzzle;
    }
    if (this.isMobileControls) {
      const distance = AssetCatalog.hasTexture(this, 'weapon-' + this.currentWeaponId) ? 326 : 300;
      const screenPoint = {
        x: originX + distance * Math.sin(rotation),
        y: originY - distance * Math.cos(rotation),
      };
      return this.cameras.main.getWorldPoint(screenPoint.x, screenPoint.y);
    }
    return { x: originX + 300 * Math.sin(rotation), y: originY - 300 * Math.cos(rotation) };
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'paused' || this.phase === 'finished') return;
    const dt = Math.min(delta, 50);
    const inputDelta = Math.min(Math.max(0, delta), 120);
    if (this.phase === 'active') {
      this.railTimeline.advance(dt);
      this.updateCasinoLighting(dt);
    }
    this.shotCooldown = Math.max(0, this.shotCooldown - inputDelta);
    this.weaponRecoil = Math.max(0, this.weaponRecoil - inputDelta * 0.16);
    this.weaponRecoilAngle = Math.max(0, this.weaponRecoilAngle - inputDelta * 0.00038);
    if (this.aimStickActive && this.phase === 'active') {
      this.aim = moveAimInWorld(
        this.aim, this.aimStickVector, this.currentSettings.aimSensitivity, inputDelta, MOBILE_AIM_BOUNDS,
      );
      const scroll = followAimWithCamera(
        this.aim,
        { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
        { width: GAME_WIDTH, height: GAME_HEIGHT },
        MOBILE_CAMERA_BOUNDS,
      );
      this.cameras.main.setScroll(scroll.x, scroll.y);
    }
    const lookX = this.isMobileControls
      ? Phaser.Math.Clamp(this.cameras.main.scrollX / 420, -1, 1)
      : this.aim.x / GAME_WIDTH - 0.5;
    const lookY = this.isMobileControls
      ? Phaser.Math.Clamp(this.cameras.main.scrollY / 180, -1, 1)
      : this.aim.y / GAME_HEIGHT - 0.5;
    const isTrainScene = this.sceneDef?.id.startsWith('east-express') ?? false;
    const farPeriod = isTrainScene ? 92 : 108;
    const midPeriod = isTrainScene ? 86 : 188;
    const nearPeriod = isTrainScene ? 170 : 320;
    this.parallaxFar?.setPosition(
      this.railTimeline.layerOffset(farPeriod, 0.12) - lookX * 4,
      -lookY * 2,
    );
    this.parallaxMid?.setPosition(
      this.railTimeline.layerOffset(midPeriod, 0.32) - lookX * 9,
      -lookY * 4,
    );
    this.parallaxNear?.setPosition(
      this.railTimeline.layerOffset(nearPeriod, 0.7) + lookX * 13,
      lookY * 6,
    );
    if (this.parallaxFar) this.parallaxFar.setAlpha(0.84 + Math.sin(this.time.now / 900) * 0.025);
    this.casinoFarArt?.setPosition(GAME_WIDTH / 2 + this.railTimeline.layerTravel(44, 0.6), GAME_HEIGHT / 2);
    this.casinoMidArt?.setPosition(GAME_WIDTH / 2 + this.railTimeline.layerTravel(86, 0.9), GAME_HEIGHT / 2);
    this.casinoNearArt?.setPosition(GAME_WIDTH / 2 + this.railTimeline.layerTravel(142, 1.2), GAME_HEIGHT / 2);
    if ((this.mobileFireHeld || this.desktopFireHeld) && this.phase === 'active'
      && getWeapon(this.currentWeaponId).fireMode !== 'semi') this.shoot();
    this.shotFlash = Math.max(0, this.shotFlash - inputDelta);
    this.weaponRecoil = Math.max(0, this.weaponRecoil - inputDelta * 0.16);
    this.weaponRecoilAngle = Math.max(0, this.weaponRecoilAngle - inputDelta * 0.00038);
    this.reloadPose = Math.max(0, this.reloadPose - inputDelta * 0.0045);
    this.playerHitFlash = Math.max(0, this.playerHitFlash - inputDelta);
    const previousDodgeCooldownLabel = Math.ceil(this.dodgeCooldownMs / 1000);
    this.dodgeRemainingMs = Math.max(0, this.dodgeRemainingMs - inputDelta);
    this.dodgeCooldownMs = Math.max(0, this.dodgeCooldownMs - inputDelta);
    if (Math.ceil(this.dodgeCooldownMs / 1000) !== previousDodgeCooldownLabel) this.refreshMobileControls();
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
    this.updateEnemyProjectiles(dt);
    this.updateEnemies(dt);
    this.updateWaveFlow(dt);
    this.drawFrame();
    if (this.hp <= 0) this.finishMission(false);
  }

  private loadMissionScene(index: number): void {
    if (index >= this.missionScenes.length) { this.finishMission(true); return; }
    this.sceneIndex = index;
    this.sceneDef = this.missionScenes[index];
    this.coverStates = this.sceneDef.covers.map((cover) => ({ ...cover, ...createCoverDurability(cover.id) }));
    this.casinoLightElapsedMs = 0;
    this.casinoLightPhase = 'idle';
    this.casinoLightState = this.isCasinoRoom() ? sampleCasinoLightEvent(0, this.sceneDef.id as 'casino-main' | 'casino-bar') : null;
    this.casinoJackpotElapsedMs = 0;
    this.casinoJackpotPhase = 'idle';
    this.casinoJackpotManualFlashMs = 0;
    this.casinoJackpotManualState = null;
    this.casinoRouletteActivated = false;
    this.casinoRouletteHint?.setVisible(false);
    this.casinoJackpotState = this.isCasinoRoom()
      ? sampleCasinoJackpotEvent(0, this.sceneDef.id as 'casino-main' | 'casino-bar') : null;
    // Every authored room starts from its own camera origin and a predictable reticle position.
    this.cameras.main.setScroll(0, 0);
    this.aim = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    this.railTimeline.reset(Math.max(GAME_WIDTH, this.sceneDef.waves.length * 1000));
    this.backgroundArt?.destroy();
    this.backgroundArt = undefined;
    this.casinoFarArt?.destroy(); this.casinoFarArt = undefined;
    this.casinoMidArt?.destroy(); this.casinoMidArt = undefined;
    this.casinoNearArt?.destroy(); this.casinoNearArt = undefined;
    this.children.getAll().forEach((child) => {
      if (child.name.startsWith('enemy-image-') || child.name.startsWith('boss-name-') || child.name.startsWith('cover-image-')) child.destroy();
    });
    const bgKey = AssetCatalog.imageKeyFor(this.sceneDef.backgroundSlot);
    const layerPrefix = this.sceneDef.backgroundSlot === 'backgrounds/casino-main' ? 'casino-main'
      : this.sceneDef.backgroundSlot === 'backgrounds/casino-bar' ? 'casino-bar'
        : this.sceneDef.backgroundSlot === 'backgrounds/train-carriage' ? 'train-carriage' : null;
    const layerKeys = layerPrefix ? {
      base: layerPrefix + '-base', far: layerPrefix + '-far',
      mid: layerPrefix + '-mid', near: layerPrefix + '-near',
    } : null;
    const hasLayerSet = layerKeys !== null
      && Object.values(layerKeys).every((key) => AssetCatalog.hasTexture(this, key));
    if (hasLayerSet && layerKeys) {
      this.backgroundArt = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, layerKeys.base)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-10);
      this.casinoFarArt = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, layerKeys.far)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-9).setScrollFactor(0.16);
      this.casinoMidArt = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, layerKeys.mid)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-7).setScrollFactor(0.42);
      this.casinoNearArt = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, layerKeys.near)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-4).setScrollFactor(0.74);
    } else if (AssetCatalog.hasTexture(this, bgKey)) {
      this.backgroundArt = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-10);
    }
    this.enemies = [];
    this.enemyProjectiles = [];
    this.waveIndex = 0;
    this.spawnTimer = 350;
    this.waveAwarded = false;
    this.phase = 'active';
    this.drawBackground();
    this.showToast(this.sceneDef.subtitle + ' • СЦЕНА ' + (index + 1) + '/' + this.missionScenes.length, 1500);
  }

  private drawBackground(): void {
    this.backdrop.clear();
    this.backdrop.fillGradientStyle(0x18212c, 0x18212c, 0x292a31, 0x121820, 1);
    const overscan = this.isMobileControls ? 520 : 0;
    this.backdrop.fillRect(-overscan, this.isMobileControls ? -140 : 0, GAME_WIDTH + overscan * 2, GAME_HEIGHT + (this.isMobileControls ? 280 : 0));
    this.backdrop.fillStyle(0x8c3333, 0.13); this.backdrop.fillRect(-overscan, 100, GAME_WIDTH + overscan * 2, 340);
    this.backdrop.fillStyle(0xe9b868, 0.09); this.backdrop.fillRect(-overscan, 100, GAME_WIDTH + overscan * 2, 10);
    for (let i = -4; i < 14; i += 1) {
      const x = 80 + i * 140;
      this.backdrop.fillStyle(0xf3bd66, 0.09); this.backdrop.fillCircle(x, 180, 54);
      this.backdrop.fillStyle(0x111820, 0.42); this.backdrop.fillRect(x - 43, 230, 86, 190);
    }
    this.backdrop.fillStyle(0x8c242b, 0.5); this.backdrop.fillRect(-overscan, 515, GAME_WIDTH + overscan * 2, 90);
    this.backdrop.lineStyle(2, 0xc58c4b, 0.36); this.backdrop.lineBetween(-overscan, 515, GAME_WIDTH + overscan, 515);
    this.backdrop.fillStyle(0x242c37, 1); this.backdrop.fillRect(-overscan, 590, GAME_WIDTH + overscan * 2, 130);
    this.drawParallaxLayers();
  }

  private drawParallaxLayers(): void {
    const far = this.parallaxFar;
    const mid = this.parallaxMid;
    const near = this.parallaxNear;
    if (!far || !mid || !near) return;
    far.clear(); mid.clear(); near.clear();
    if (this.casinoFarArt) return;
    if (this.sceneDef?.id.startsWith('east-express')) {
      const mask = this.add.graphics();
      mask.fillStyle(0xffffff, 1);
      // Keep the exterior scenery inside the carriage's panoramic windows.
      mask.fillRect(38, 142, 300, 320);
      mask.fillRect(942, 142, 300, 320);
      mask.setVisible(false);
      this.parallaxMaskGraphics?.destroy();
      this.parallaxMaskGraphics = mask;
      this.parallaxWindowMask = mask.createGeometryMask();
      far.setMask(this.parallaxWindowMask);
      mid.setMask(this.parallaxWindowMask);
      near.setMask(this.parallaxWindowMask);

      far.fillStyle(0x1a3150, 0.42);
      for (let i = 0; i < 16; i += 1) {
        const x = i * 92 - 40;
        const h = 95 + (i % 5) * 22;
        far.fillTriangle(x, 430, x + 46, 430 - h, x + 92, 430);
      }
      far.fillStyle(0x7895ad, 0.14);
      for (let i = 0; i < 12; i += 1) far.fillCircle(i * 128 - 20, 230 + (i % 3) * 18, 34);

      mid.fillStyle(0x172a37, 0.52);
      for (let i = 0; i < 18; i += 1) {
        const x = i * 86 - 30;
        mid.fillTriangle(x, 445, x + 38, 350 + (i % 4) * 14, x + 76, 445);
      }
      near.lineStyle(5, 0x18232b, 0.5);
      for (let i = 0; i < 9; i += 1) {
        const x = i * 170 - 50;
        near.lineBetween(x, 145, x + 10, 460);
        near.lineBetween(x - 40, 190, x + 60, 190);
      }
      far.setAlpha(0.9);
      mid.setAlpha(0.8);
      near.setAlpha(0.65);
      return;
    }

    far.clearMask(false);
    mid.clearMask(false);
    near.clearMask(false);
    this.parallaxMaskGraphics?.destroy();
    this.parallaxMaskGraphics = undefined;
    this.parallaxWindowMask = undefined;


    far.fillStyle(0x09131e, 0.52);
    for (let i = -5; i < 18; i += 1) {
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
    for (let i = -3; i < 11; i += 1) {
      const x = i * 188 - 42;
      mid.fillRoundedRect(x, 138 + (i % 2) * 12, 42, 388, 7);
      mid.fillStyle(0xd2a26d, 0.12);
      mid.fillRect(x + 9, 154, 4, 300);
      mid.fillStyle(0x14202b, 0.34);
    }

    near.fillStyle(0x080e15, 0.18);
    for (let i = -1; i < 6; i += 1) {
      const x = i * 320;
      near.fillRoundedRect(x + 20, 476, 250, 118, 22);
      near.lineStyle(2, 0xd4ad72, 0.17);
      near.lineBetween(x + 30, 520, x + 240, 520);
    }
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
    const seed = (this.startedAt ^ Math.imul(this.sceneIndex + 1, 0x9e3779b1)
      ^ Math.imul(this.waveIndex + 1, 0x85ebca6b)) >>> 0;
    const spawnPlan = planEnemyWave(wave.enemies, wave.spawnPoints, this.getActiveCovers(), seed);
    this.enemies = spawnPlan.map((entry) => {
      const def = ENEMIES[entry.type];
      const entryDurationMs = entry.type === 'boss' ? 0
        : entry.type === 'assault' ? 320 : entry.type === 'armored' ? 520 : 420;
      const entering = entryDurationMs > 0;
      const entryStartX = entry.spawn.x < GAME_WIDTH / 2 ? -110 : GAME_WIDTH + 110;
      const state: EnemyState = entering ? 'Entering' : 'Exposed';
      return {
        uid: this.uniqueId++, type: entry.type,
        x: entering ? entryStartX : entry.spawn.x,
        baseX: entry.spawn.x, y: entry.spawn.y, originY: entry.spawn.y,
        hp: def.hp, maxHp: def.hp, coverId: entry.spawn.coverId,
        state, timer: entering ? entry.entryDelayMs : Math.round(def.exposeMs * 0.4),
        entryStartX, entryTargetX: entry.spawn.x, entryElapsedMs: 0, entryDurationMs,
        phase: 0, bossPhase: 0, hitFlash: 0, deathElapsedMs: 0, distractionRemainingMs: 0,
      };
    });
    this.waveAwarded = false;
    const hasBoss = wave.enemies.includes('boss');
    const hasArmored = wave.enemies.includes('armored');
    this.showToast(hasBoss ? 'ТРЕВОГА • НАЧАЛЬНИК ОХРАНЫ ВЫШЕЛ НА СЦЕНУ'
      : hasArmored ? 'БРОНЯ: ЦЕЛЬСЯ В ГОЛОВУ'
        : 'ВОЛНА ' + (this.waveIndex + 1) + '/' + this.sceneDef.waves.length,
    hasBoss || hasArmored ? 1700 : 1200);
  }

  private updateWaveFlow(dt: number): void {
    // A fired round remains dangerous even if its shooter is defeated.
    if (this.enemyProjectiles.length > 0) return;
    if (this.enemies.length === 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) this.spawnWave();
      return;
    }
    const living = this.enemies.filter((enemy) => enemy.state !== 'Defeated');
    if (living.length !== 0 || this.waveAwarded || this.enemies.some((enemy) => enemy.deathElapsedMs < 520)) return;
    this.waveAwarded = true;
    this.award(BALANCE.rewards.xp.wave, BALANCE.rewards.dollars.wave);
    this.clearEnemySprites();
    this.waveIndex += 1;
    if (this.waveIndex < this.sceneDef.waves.length) {
      this.enemies = [];
      this.spawnTimer = 900;
    } else if (this.sceneIndex + 1 < this.missionScenes.length) {
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
    const nextScene = this.missionScenes[this.sceneIndex + 1];
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

  private getPlayerHitPoint(): Point {
    const pose = samplePlayerDodgePose(this.dodgeRemainingMs);
    return this.cameras.main.getWorldPoint(GAME_WIDTH / 2, GAME_HEIGHT - 96 + pose.offsetY);
  }

  private activateDodge(): void {
    if (this.phase !== 'active' || this.dodgeCooldownMs > 0) return;
    this.dodgeRemainingMs = PLAYER_DODGE_DURATION_MS;
    this.dodgeCooldownMs = PLAYER_DODGE_COOLDOWN_MS;
    const hitPoint = this.getPlayerHitPoint();
    this.impactEffects.push({
      x: hitPoint.x, y: hitPoint.y - 18, life: 260, maxLife: 260, kind: 'player-dodge', damage: 0,
    });
    FeedbackService.play(this, 'confirm', 0.48);
    triggerHaptic('dodge');
    this.showToast('УКЛОНЕНИЕ', 380);
    this.refreshMobileControls();
  }

  private launchEnemyProjectile(enemy: RuntimeEnemy, damage: number): void {
    const target = this.getPlayerHitPoint();
    const start = {
      x: enemy.x + (target.x >= enemy.x ? 22 : -22),
      y: enemy.y - 62,
    };
    const activeCovers = this.getActiveCovers();
    const coverImpact = findEnemyProjectileCoverImpact(start, target, activeCovers);
    const blockedCover = coverImpact ? activeCovers[coverImpact.coverIndex] : undefined;
    const durationMs = getEnemyProjectileTravelMs(enemy.type)
      * (coverImpact ? Math.max(0.12, coverImpact.progress) : 1);
    this.enemyProjectiles.push({
      uid: this.uniqueId++, type: enemy.type, start,
      target: coverImpact?.point ?? { x: target.x, y: target.y },
      elapsedMs: 0, durationMs, damage, blockedByCover: coverImpact !== null,
      blockedCoverId: blockedCover?.id,
      coverDamage: blockedCover ? getEnemyProjectileCoverDamage(enemy.type) : 0,
    });
    this.advanceTutorial('projectile');
    this.impactEffects.push({
      x: start.x, y: start.y, life: 130, maxLife: 130, kind: 'enemy-muzzle', damage: 0,
    });
    FeedbackService.play(this, 'shot', enemy.type === 'boss' ? 0.6 : 0.24);
  }

  private updateEnemyProjectiles(dt: number): void {
    for (let index = this.enemyProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.enemyProjectiles[index];
      if (!projectile) continue;
      projectile.elapsedMs = Math.min(projectile.durationMs, projectile.elapsedMs + dt);
      const sample = sampleEnemyProjectile(
        projectile.start, projectile.target, projectile.elapsedMs, projectile.durationMs,
      );
      if (sample.progress < 1) continue;

      this.enemyProjectiles.splice(index, 1);
      if (projectile.blockedByCover) {
        const cover = projectile.blockedCoverId ? this.getLiveCover(projectile.blockedCoverId) : undefined;
        if (cover && projectile.coverDamage > 0) {
          const previousStage = cover.stage;
          const destroyed = this.applyCoverHit(cover, projectile.coverDamage, projectile.target);
          if (destroyed) this.showToast('ВРАЖЕСКИЙ ОГОНЬ • УКРЫТИЕ РАЗРУШЕНО', 850);
          else if (previousStage === 'intact' && cover.stage === 'damaged') {
            this.showToast('ВРАЖЕСКИЙ ОГОНЬ • УКРЫТИЕ ТРЕЩИТ', 650);
          }
        } else {
          this.impactEffects.push({
            x: projectile.target.x, y: projectile.target.y,
            life: 420, maxLife: 420, kind: 'cover', damage: 0,
          });
          FeedbackService.play(this, 'hit', 0.24);
        }
        continue;
      }
      const currentPlayerPoint = this.getPlayerHitPoint();
      const dodged = isPlayerDodgeEvading(
        this.dodgeRemainingMs, projectile.target, currentPlayerPoint,
      );
      if (dodged) {
        this.impactEffects.push({
          x: projectile.target.x, y: projectile.target.y,
          life: 300, maxLife: 300, kind: 'player-dodge', damage: 0,
        });
        this.advanceTutorial('evade');
        FeedbackService.play(this, 'confirm', 0.38);
        this.showToast('УКЛОНЕНИЕ • ПРОМАХ', 420);
        continue;
      }
      this.impactEffects.push({
        x: projectile.target.x, y: projectile.target.y,
        life: 360, maxLife: 360, kind: 'player-hit', damage: projectile.damage,
      });
      this.damagePlayer(projectile.damage);
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      if (enemy.state === 'Defeated') { enemy.deathElapsedMs = Math.min(520, enemy.deathElapsedMs + dt); continue; }
      if (enemy.state !== 'Entering' && enemy.distractionRemainingMs > 0) {
        enemy.distractionRemainingMs = Math.max(0, enemy.distractionRemainingMs - dt);
        continue;
      }
      const def = ENEMIES[enemy.type];
      if (enemy.coverId && !this.getLiveCover(enemy.coverId)) {
        const wasUsingCover = enemy.state === 'SeekingCover' || enemy.state === 'Hidden' || enemy.state === 'Peeking';
        enemy.coverId = undefined;
        if (wasUsingCover) {
          this.tweens.killTweensOf(enemy);
          enemy.state = 'Exposed';
          enemy.y = enemy.originY;
          enemy.timer = Math.max(480, Math.round(def.exposeMs * 0.7));
          continue;
        }
      }
      if (enemy.state === 'Entering') {
        const travelDelta = Math.max(0, dt - Math.max(0, enemy.timer));
        enemy.timer = Math.max(0, enemy.timer - dt);
        if (enemy.timer > 0) continue;
        enemy.entryElapsedMs = Math.min(enemy.entryDurationMs, enemy.entryElapsedMs + travelDelta);
        enemy.x = sampleSpawnEntryX(
          enemy.entryStartX, enemy.entryTargetX, enemy.entryElapsedMs, enemy.entryDurationMs,
        );
        if (enemy.entryElapsedMs >= enemy.entryDurationMs) {
          enemy.x = enemy.entryTargetX;
          enemy.state = 'Exposed';
          enemy.timer = Math.round(def.exposeMs * 0.4);
        }
        continue;
      }
      enemy.timer -= dt;
      if (enemy.timer > 0) continue;
      switch (enemy.state) {
        case 'Exposed': {
          const bossAimScale = enemy.type === 'boss' ? [1, 0.8, 0.62][enemy.bossPhase] : 1;
          enemy.state = 'Aiming'; enemy.timer = Math.round(def.aimMs * bossAimScale);
          if (this.tutorialStep === 'telegraph') this.tutorialSignalSeen = true;
          break;
        }
        case 'Aiming': {
          const bossDamageScale = enemy.type === 'boss' ? [1, 1.25, 1.5][enemy.bossPhase] : 1;
          enemy.state = 'Attacking'; enemy.timer = 260;
          this.launchEnemyProjectile(enemy, Math.round(def.damage * bossDamageScale));
          break;
        }
        case 'Attacking': {
          if (enemy.type === 'boss') {
            enemy.state = 'Repositioning'; enemy.timer = Math.max(220, 440 - enemy.bossPhase * 90);
            enemy.x = Math.max(110, Math.min(GAME_WIDTH - 110, enemy.baseX + (enemy.phase % 2 === 0 ? -104 : 104)));
            enemy.phase += 1; break;
          }
          if (enemy.type === 'assault') {
            enemy.state = 'Repositioning';
            enemy.timer = ASSAULT_REPOSITION_MS;
            const targetX = getAssaultFlankTargetX(enemy.baseX, enemy.phase, 110, GAME_WIDTH - 110);
            enemy.phase += 1;
            this.tweens.add({ targets: enemy, x: targetX,
              duration: ASSAULT_REPOSITION_MS, ease: 'Sine.easeInOut' });
            break;
          }
          if (enemy.type === 'armored') {
            // Heavy armor holds its ground and exposes only a short recovery window after firing.
            enemy.state = 'Exposed';
            enemy.timer = ARMORED_RECOVERY_MS;
            break;
          }
          enemy.state = 'SeekingCover'; enemy.timer = 320;
          const cover = this.getLiveCover(enemy.coverId);
          if (cover) {
            enemy.state = 'SeekingCover'; enemy.timer = 320;
            this.tweens.add({ targets: enemy, x: cover.x + cover.width / 2,
              y: cover.y + cover.height / 2 + 20, duration: 320, ease: 'Sine.easeIn' });
          } else {
            enemy.coverId = undefined;
            enemy.state = 'Exposed'; enemy.timer = Math.max(420, def.exposeMs * 0.65);
          }
          break;
        }
        case 'SeekingCover':
          enemy.state = 'Hidden';
          enemy.timer = def.hiddenMs;
          break;
        case 'Hidden': {
          enemy.state = 'Peeking';
          this.advanceTutorial('enemy-peek');
          enemy.timer = def.peekMs;
          enemy.phase += 1;
          const cover = this.getLiveCover(enemy.coverId);
          if (!cover) {
            enemy.coverId = undefined; enemy.state = 'Exposed'; enemy.timer = Math.max(420, def.exposeMs * 0.65);
            break;
          }
          enemy.x = findVisiblePeekX(MUZZLE, cover, 58 + (enemy.uid % 4) * 96);
          enemy.y = enemy.originY;
          break;
        }
        case 'Peeking': {
          enemy.state = 'Repositioning';
          enemy.timer = enemy.type === 'assault' ? 260 : 390;
          const cover = this.getLiveCover(enemy.coverId);
          if (cover) {
            // Move to the side of the cover facing the player so the enemy can be hit while peeking.
            enemy.x = findVisiblePeekX(MUZZLE, cover, 58 + (enemy.uid % 4) * 96);
          } else {
            enemy.x = enemy.baseX + (enemy.phase % 2 === 0 ? -52 : 52);
          }
          break;
        }
        case 'Repositioning':
          enemy.state = 'Exposed'; enemy.baseX = enemy.type === 'boss' ? 640 : enemy.x;
          enemy.originY = enemy.y;
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
    this.advanceTutorial('shot');
    this.shotCooldown = weaponStats.shotCooldownMs;
    this.shotFlash = this.currentWeaponId === 'shotgun' ? 220 : 165;
    this.weaponRecoil = weapon.recoil * 2.8;
    this.weaponRecoilAngle = Math.min(0.075, 0.038 + weapon.recoil * 0.00045);
    const muzzleFxPoint = this.getWeaponMuzzle();
    if (AssetCatalog.hasTexture(this, 'effect-muzzle-flare')) {
      const flash = this.add.image(muzzleFxPoint.x, muzzleFxPoint.y, 'effect-muzzle-flare')
        .setDepth(24).setBlendMode(Phaser.BlendModes.ADD).setScale(this.currentWeaponId === 'shotgun' ? 0.48 : 0.34);
      this.tweens.add({ targets: flash, alpha: 0, scale: flash.scale * 1.55, duration: 105,
        onComplete: () => flash.destroy() });
    }
    FeedbackService.play(this, 'shot', this.currentWeaponId === 'shotgun' ? 1.2 : 1);
    triggerHaptic('shot');
    if (this.currentSettings.screenShakeEnabled) {
      if (!this.isMobileControls) this.cameras.main.shake(this.currentWeaponId === 'shotgun' ? 115 : 55,
        this.currentWeaponId === 'shotgun' ? 0.0032 : weapon.recoil * 0.00006);
    }

    const rouletteTarget = this.getCasinoRouletteTargetAtAim();
    if (rouletteTarget) {
      const targetWorld = this.cameras.main.getWorldPoint(
        rouletteTarget.x + rouletteTarget.width / 2,
        rouletteTarget.y + rouletteTarget.height / 2,
      );
      if (isShotBlocked(muzzleFxPoint, targetWorld, this.getActiveCovers())) {
        this.showToast('РУЛЕТКА ЗА СТОЛОМ • СМЕНИТЕ УГОЛ', 850);
        return;
      }
      this.activateCasinoRoulette();
      return;
    }

    const targetHits = new Map<number, {
      enemy: RuntimeEnemy; headHits: number; bodyHits: number; target: Point;
    }>();
    const coverHits = new Map<string, { cover: RuntimeCover; pellets: number; point: Point }>();
    const activeCovers = this.getActiveCovers();
    const spreadPhase = Math.random() * Math.PI * 2;
    const pelletCount = Math.max(1, weapon.pellets);

    for (let pellet = 0; pellet < pelletCount; pellet += 1) {
      let pelletAim: Point = { ...this.aim };
      if (pelletCount === 1 && weapon.spreadRadius > 0) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * weapon.spreadRadius;
        pelletAim = { x: this.aim.x + Math.cos(angle) * radius, y: this.aim.y + Math.sin(angle) * radius };
      } else if (pellet > 0) {
        const angle = spreadPhase + ((pellet - 1) / (pelletCount - 1)) * Math.PI * 2;
        const radius = weapon.spreadRadius * (0.72 + Math.random() * 0.28);
        pelletAim = { x: this.aim.x + Math.cos(angle) * radius, y: this.aim.y + Math.sin(angle) * radius };
      }

      let best: { enemy: RuntimeEnemy; part: 'head' | 'body'; target: Point; distance: number } | null = null;
      let nearestBlockedCover: { cover: RuntimeCover; coverIndex: number; point: Point; distance: number } | null = null;
      for (const enemy of this.enemies) {
        if (enemy.state === 'Defeated') continue;
        const isBoss = enemy.type === 'boss';
        const head = { x: enemy.x, y: enemy.y - (isBoss ? 72 : 48) };
        const body = { x: enemy.x, y: enemy.y - 5 };
        const part = resolveHit(pelletAim, head, body, isBoss ? 42 : 32, isBoss ? 66 : 48);
        if (!part) continue;
        const target = part === 'head' ? head : body;
        const coverImpact = findEnemyProjectileCoverImpact(muzzleFxPoint, target, activeCovers);
        if (coverImpact) {
          const cover = activeCovers[coverImpact.coverIndex];
          if (cover) {
            const distance = Math.hypot(pelletAim.x - target.x, pelletAim.y - target.y);
            if (!nearestBlockedCover || distance < nearestBlockedCover.distance) {
              nearestBlockedCover = { cover, coverIndex: coverImpact.coverIndex, point: coverImpact.point, distance };
            }
          }
          continue;
        }
        const distance = Math.hypot(pelletAim.x - target.x, pelletAim.y - target.y);
        if (!best || distance < best.distance) best = { enemy, part, target, distance };
      }

      if (best) {
        const record = targetHits.get(best.enemy.uid) ?? { enemy: best.enemy, headHits: 0, bodyHits: 0, target: best.target };
        if (best.part === 'head') record.headHits += 1;
        else record.bodyHits += 1;
        targetHits.set(best.enemy.uid, record);
        continue;
      }

      const coverImpact = nearestBlockedCover
        ? { point: nearestBlockedCover.point, coverIndex: nearestBlockedCover.coverIndex }
        : findEnemyProjectileCoverImpact(muzzleFxPoint, pelletAim, activeCovers);
      if (coverImpact) {
        const cover = activeCovers[coverImpact.coverIndex];
        if (cover) {
          const previous = coverHits.get(cover.id);
          if (previous) previous.pellets += 1;
          else coverHits.set(cover.id, { cover, pellets: 1, point: coverImpact.point });
        }
      }
    }
    let totalDamage = 0;
    let totalPelletsHit = 0;
    let totalCoverDamage = 0;
    let destroyedCoverCount = 0;
    let bossPhaseChanged: 0 | 1 | 2 | null = null;
    const headMultiplier = BALANCE.weapon.headMultiplier[save.upgrades.precision];

    for (const result of targetHits.values()) {
      const pelletHits = result.headHits + result.bodyHits;
      const damage = weaponStats.damage * weapon.pelletDamageMultiplier
        * (result.bodyHits * getEnemyHitAreaMultiplier(result.enemy.type, 'body')
          + result.headHits * headMultiplier * getEnemyHitAreaMultiplier(result.enemy.type, 'head'));
      if (pelletHits <= 0 || damage <= 0) continue;

      totalPelletsHit += pelletHits;
      totalDamage += damage;
      result.enemy.hp = Math.max(0, result.enemy.hp - damage);
      result.enemy.hitFlash = 230;
      this.impactEffects.push({
        x: result.target.x, y: result.target.y, life: 520, maxLife: 520, kind: 'hit', damage,
      });
      if (AssetCatalog.hasTexture(this, 'effect-impact-smoke')) {
        const impact = this.add.image(result.target.x, result.target.y, 'effect-impact-smoke')
          .setDepth(22).setBlendMode(Phaser.BlendModes.ADD).setScale(0.12).setAlpha(0.75);
        this.tweens.add({ targets: impact, alpha: 0, scale: 0.28, duration: 260,
          onComplete: () => impact.destroy() });
      }

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
        result.enemy.deathElapsedMs = 0;
        this.kills += 1;
        this.advanceTutorial('kill');
        if (this.tutorialStep === 'cover' && this.enemies.every((enemy) => enemy.state === 'Defeated')) {
          this.advanceTutorial('enemy-peek');
          this.advanceTutorial('kill');
        }
        const xp = result.enemy.type === 'boss' ? BALANCE.rewards.xp.boss : BALANCE.rewards.xp.kill;
        const dollars = result.enemy.type === 'boss' ? BALANCE.rewards.dollars.boss : BALANCE.rewards.dollars.kill;
        this.award(xp, dollars);
        this.showToast(ENEMIES[result.enemy.type].name.toUpperCase()
          + ' УСТРАНЁН • +' + xp + ' XP • +$' + dollars, 1100);
      }
    }

    for (const hit of coverHits.values()) {
      const damage = weaponStats.damage * weapon.pelletDamageMultiplier * hit.pellets;
      totalCoverDamage += damage;
      if (this.applyCoverHit(hit.cover, damage, hit.point)) destroyedCoverCount += 1;
    }

    if (targetHits.size > 0) {
      this.hits += 1;
      FeedbackService.play(this, 'hit', 0.55);
      triggerHaptic('hit');
      if (bossPhaseChanged === 1) this.showToast('НАЧАЛЬНИК ОХРАНЫ УСКОРЯЕТСЯ • ФАЗА II', 1500);
      else if (bossPhaseChanged === 2) this.showToast('НАЧАЛЬНИК ОХРАНЫ В ЯРОСТИ • ФАЗА III', 1500);
      else this.showToast('ПОПАДАНИЕ • ' + Math.round(totalDamage * 10) / 10
        + (pelletCount > 1 ? ' УРОНА • ' + totalPelletsHit + '/' + pelletCount + ' ДРОБИН' : '')
        + (totalCoverDamage > 0 ? ' • УКРЫТИЕ −' + Math.round(totalCoverDamage) + ' HP' : ''), 700);
    } else if (coverHits.size > 0) {
      const label = destroyedCoverCount > 0
        ? 'УКРЫТИЕ РАЗРУШЕНО ×' + destroyedCoverCount
        : 'УКРЫТИЕ ПОВРЕЖДЕНО • −' + Math.round(totalCoverDamage) + ' HP';
      this.showToast(label, 850);
    } else {
      this.impactEffects.push({ x: this.aim.x, y: this.aim.y, life: 280, maxLife: 280, kind: 'miss', damage: 0 });
      this.showToast('ПРОМАХ', 300);
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
    this.advanceTutorial('reload');
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
        enemy.deathElapsedMs = 0;
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
    if (this.mobileFireButton) this.mobileFireButton.style.display = 'grid';
    if (this.mobileDodgeButton) {
      const cooldown = Math.ceil(this.dodgeCooldownMs / 1000);
      const label = this.dodgeRemainingMs > 0 || cooldown === 0 ? 'УКЛОН' : cooldown + 'с';
      if (this.mobileDodgeCaption) this.mobileDodgeCaption.textContent = label;
      this.mobileDodgeButton.disabled = this.dodgeCooldownMs > 0 || this.phase !== 'active';
      this.mobileDodgeButton.style.opacity = this.mobileDodgeButton.disabled ? '0.48' : '1';
      this.mobileDodgeButton.style.borderColor = this.dodgeRemainingMs > 0 ? '#83f0ad' : '#f0d4a4b8';
    }
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
    if (!this.isMobileControls && this.currentSettings.screenShakeEnabled) this.cameras.main.shake(110, 0.0025);
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
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
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
    this.mobileFireFeedback = undefined;
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
      try { fire.setPointerCapture(event.pointerId); } catch { /* Window listeners remain the fallback. */ }
      this.shoot();
    });
    fire.addEventListener('pointerup', stopFire);
    fire.addEventListener('pointercancel', stopFire);
    fire.addEventListener('lostpointercapture', stopFire);
    window.addEventListener('pointerup', stopFire);
    window.addEventListener('pointercancel', stopFire);
    this.mobileFireBlurHandler = (): void => {
      this.mobileFireHeld = false;
      this.mobileFirePointerId = null;
    };
    window.addEventListener('blur', this.mobileFireBlurHandler);
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
      updateStick(event);
    });
    // Track the active thumb globally instead of relying on pointer capture.
    // Several Android browsers cancel/loss pointer capture when a second finger
    // presses the fire button, which silently freezes the aim stick.
    this.mobileAimMoveHandler = (event: PointerEvent): void => {
      if (event.pointerId === this.aimStickPointerId) updateStick(event);
    };
    this.mobileAimEndHandler = (event: PointerEvent): void => resetStick(event);
    window.addEventListener('pointermove', this.mobileAimMoveHandler);
    window.addEventListener('pointerup', this.mobileAimEndHandler);
    window.addEventListener('pointercancel', this.mobileAimEndHandler);

    const utilityRow = document.createElement('div');
    Object.assign(utilityRow.style, {
      position: 'absolute', left: 'max(10px, env(safe-area-inset-left))',
      bottom: 'max(16px, env(safe-area-inset-bottom))', display: 'flex', gap: '8px',
      pointerEvents: 'none',
    });
    const dodge = makeButton('⇣', 'УКЛОН', 66, '#385e53f0');
    dodge.style.borderRadius = '18px';
    this.mobileDodgeButton = dodge;
    this.mobileDodgeCaption = dodge.lastElementChild as HTMLSpanElement;
    dodge.addEventListener('pointerdown', (event) => { consume(event); this.activateDodge(); });
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
    utilityRow.append(dodge, grenade, medkit);
    overlay.append(stack, pause, utilityRow, stick);
    host.append(overlay);
    this.mobileControlsElement = overlay;
    this.mobileControlsLayoutHandler = (): void => this.layoutMobileControls();
    window.addEventListener('resize', this.mobileControlsLayoutHandler);
    window.addEventListener('orientationchange', this.mobileControlsLayoutHandler);
    this.layoutMobileControls();
    this.refreshMobileControls();
  }

  private layoutMobileControls(): void {
    const overlay = this.mobileControlsElement;
    const canvas = this.game.canvas;
    const host = canvas.parentElement;
    if (!overlay || !host) return;
    const hostRect = host.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    // Keep touch targets physically usable on compact landscape phones.
    // The old GAME_WIDTH/GAME_HEIGHT ratio shrank a 96px fire button to ~48px
    // on a 640px-wide phone, despite the control overlay being correctly aligned.
    const controlScale = getMobileControlScale(canvasRect.width, canvasRect.height);
    overlay.style.left = Math.round(canvasRect.left - hostRect.left) + 'px';
    overlay.style.top = Math.round(canvasRect.top - hostRect.top) + 'px';
    overlay.style.width = Math.round(canvasRect.width / controlScale) + 'px';
    overlay.style.height = Math.round(canvasRect.height / controlScale) + 'px';
    overlay.style.transform = 'scale(' + controlScale + ')';
    overlay.style.transformOrigin = 'top left';
    overlay.style.right = 'auto';
    overlay.style.bottom = 'auto';
  }

  private disposeMobileControls(): void {
    this.mobileFireHeld = false;
    this.mobileFirePointerId = null;
    this.mobileLookPointerId = null;
    this.mobileLookLastPointer = null;
    this.aimStickActive = false;
    this.aimStickPointerId = null;
    this.aimStickVector = { x: 0, y: 0 };
    if (typeof window !== 'undefined') {
      if (this.mobileReleaseHandler) {
        window.removeEventListener('pointerup', this.mobileReleaseHandler);
        window.removeEventListener('pointercancel', this.mobileReleaseHandler);
      }
      if (this.mobileFireBlurHandler) window.removeEventListener('blur', this.mobileFireBlurHandler);
      if (this.mobileAimMoveHandler) window.removeEventListener('pointermove', this.mobileAimMoveHandler);
      if (this.mobileAimEndHandler) {
        window.removeEventListener('pointerup', this.mobileAimEndHandler);
        window.removeEventListener('pointercancel', this.mobileAimEndHandler);
      }
      if (this.mobileControlsLayoutHandler) {
        window.removeEventListener('resize', this.mobileControlsLayoutHandler);
        window.removeEventListener('orientationchange', this.mobileControlsLayoutHandler);
      }
    }
    this.mobileReleaseHandler = undefined;
    this.mobileFireBlurHandler = undefined;
    this.mobileAimMoveHandler = undefined;
    this.mobileAimEndHandler = undefined;
    this.mobileControlsLayoutHandler = undefined;
    this.mobileControlsElement?.remove();
    this.mobileControlsElement = undefined;
    this.mobileSwitchButton = undefined;
    this.mobileSwitchCaption = undefined;
    this.mobileFireButton = undefined;
    this.mobileDodgeButton = undefined;
    this.mobileDodgeCaption = undefined;
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
    this.mobileLookPointerId = null;
    this.mobileLookLastPointer = null;
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

  private createTutorialOverlay(): void {
    if (!this.tutorialStep) return;
    const panel = this.add.container(GAME_WIDTH / 2, 150).setDepth(80).setScrollFactor(0);
    const background = this.add.rectangle(0, 0, 720, 116, 0x111b26, 0.96).setStrokeStyle(2, 0xd0a86f, 0.78);
    background.setInteractive();
    background.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => event.stopPropagation());
    const kicker = this.add.text(-330, -43, 'ИНСТРУКТАЖ • ПЕРВАЯ ОПЕРАЦИЯ', {
      fontSize: '11px', color: '#d7b77e', fontStyle: 'bold', letterSpacing: 1.6,
    }).setOrigin(0, 0.5);
    this.tutorialProgress = this.add.text(330, -43, '', {
      fontSize: '11px', color: '#9fadb9', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.tutorialTitle = this.add.text(-330, -15, '', {
      fontSize: '17px', color: '#f5d9a4', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.tutorialBody = this.add.text(-330, 18, '', {
      fontSize: '14px', color: '#e0e6eb', wordWrap: { width: 650 },
    }).setOrigin(0, 0.5);
    const skip = this.add.text(330, 48, 'ПРОПУСТИТЬ ×', {
      fontSize: '11px', color: '#c8d2dc', fontStyle: 'bold', backgroundColor: '#354656', padding: { x: 9, y: 5 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.skipTutorial();
    });
    panel.add([background, kicker, this.tutorialProgress, this.tutorialTitle, this.tutorialBody, skip]);
    this.tutorialOverlay = panel;
    this.refreshTutorialOverlay();
  }

  private refreshTutorialOverlay(): void {
    const step = this.tutorialStep;
    if (!step || !this.tutorialTitle || !this.tutorialBody || !this.tutorialProgress) return;
    const index = ['fire', 'reload', 'telegraph', 'dodge', 'cover', 'finish'].indexOf(step) + 1;
    const content: Record<TutorialStep, { title: string; body: string }> = {
      fire: { title: 'ПРИЦЕЛ И ОГОНЬ', body: this.isMobileControls
        ? 'Наведи прицел левым стиком на охранника и нажми ОГОНЬ. Зелёная рамка означает, что линия выстрела свободна.'
        : 'Наведи мышь на охранника и нажми левую кнопку. Зелёный прицел означает, что цель доступна.' },
      reload: { title: 'ПЕРЕЗАРЯДКА', body: this.isMobileControls
        ? 'Нажми кнопку ЗАРЯД. Не жди пустого магазина: перезаряжаться можно заранее.'
        : 'Нажми R, когда магазин не полный. Перезаряжаться можно заранее, не обязательно ждать нуля.' },
      telegraph: { title: 'СЛЕДИ ЗА СИГНАЛОМ', body: this.tutorialSignalSeen
        ? 'Красное кольцо заполняется вокруг врага. Дождись вспышки и появления летящего трассера.'
        : 'После красного сигнала враг откроет огонь. Следи за кольцом вокруг охранника и не трать уклонение заранее.' },
      dodge: { title: 'УКЛОНЕНИЕ', body: this.isMobileControls
        ? 'Когда увидишь летящий снаряд, нажми УКЛОН. Приседание короткое: попади в момент приближения пули.'
        : 'Когда увидишь летящий снаряд, нажми Shift. Приседание короткое: попади в момент приближения пули.' },
      cover: { title: 'УКРЫТИЯ', body: 'Охранник прячется за мебелью. Янтарный прицел означает, что укрытие блокирует выстрел. Жди, пока враг выглянет.' },
      finish: { title: 'ЗАВЕРШИ ОПЕРАЦИЮ', body: 'Враг снова открыт. Устрани хотя бы одну цель, чтобы завершить инструктаж и продолжить без подсказок.' },
    };
    this.tutorialTitle.setText(index + '/6  •  ' + content[step].title);
    this.tutorialBody.setText(content[step].body);
    this.tutorialProgress.setText('ОБУЧЕНИЕ ' + index + '/6');
  }

  private advanceTutorial(event: TutorialEvent): void {
    if (!this.tutorialStep) return;
    const next = advanceFirstOperationTutorial(this.tutorialStep, event);
    if (next === this.tutorialStep) return;
    if (next === 'complete') { this.finishTutorial(); return; }
    this.tutorialStep = next;
    this.refreshTutorialOverlay();
  }

  private finishTutorial(): void {
    if (!this.tutorialStep) return;
    saveService.completeTutorial();
    this.tutorialStep = null;
    this.tutorialOverlay?.destroy(true);
    this.tutorialOverlay = undefined;
    this.tutorialTitle = undefined;
    this.tutorialBody = undefined;
    this.tutorialProgress = undefined;
    this.showToast('ИНСТРУКТАЖ ЗАВЕРШЁН • УДАЧНОЙ ОХОТЫ', 1500);
  }

  private skipTutorial(): void { this.finishTutorial(); }
  private isCasinoRoom(): boolean {
    return this.sceneDef?.id === 'casino-main' || this.sceneDef?.id === 'casino-bar';
  }

  private updateCasinoLighting(dt: number): void {
    if (!this.isCasinoRoom()) {
      this.casinoLightState = null;
      this.casinoLightPhase = 'idle';
      this.casinoJackpotState = null;
      this.casinoJackpotPhase = 'idle';
      return;
    }
    this.casinoLightElapsedMs += dt;
    const roomId = this.sceneDef.id as 'casino-main' | 'casino-bar';
    const state = sampleCasinoLightEvent(this.casinoLightElapsedMs, roomId);
    if (state.phase === 'warning' && this.casinoLightPhase !== 'warning') {
      const sector = state.laneIndex === 0 ? 'ЛЕВЫЙ' : state.laneIndex === 1 ? 'ЦЕНТРАЛЬНЫЙ' : 'ПРАВЫЙ';
      this.showToast('ПРОЖЕКТОР • ' + sector + ' СЕКТОР • СВЕТОВАЯ ВСПЫШКА', 1050);
    }
    this.casinoLightState = state;
    this.casinoLightPhase = state.phase;

    this.casinoJackpotElapsedMs += dt;
    const jackpot = sampleCasinoJackpotEvent(this.casinoJackpotElapsedMs, roomId);
    if (jackpot.phase === 'warning' && this.casinoJackpotPhase !== 'warning') {
      const sector = jackpot.laneIndex === 0 ? 'ЛЕВЫЙ' : jackpot.laneIndex === 1 ? 'ЦЕНТРАЛЬНЫЙ' : 'ПРАВЫЙ';
      this.showToast('ИГРОВОЙ АВТОМАТ • ' + sector + ' СЕКТОР • ДЖЕКПОТ', 900);
    }
    const manualFlashActive = this.casinoJackpotManualFlashMs > 0;
    if (jackpot.phase === 'flash' && this.casinoJackpotPhase !== 'flash' && !manualFlashActive) {
      this.applyCasinoJackpotDistraction(jackpot);
    }
    this.casinoJackpotPhase = jackpot.phase;
    if (manualFlashActive) {
      this.casinoJackpotManualFlashMs = Math.max(0, this.casinoJackpotManualFlashMs - dt);
      this.casinoJackpotState = this.casinoJackpotManualFlashMs > 0 ? this.casinoJackpotManualState : jackpot;
      if (this.casinoJackpotManualFlashMs <= 0) this.casinoJackpotManualState = null;
    } else {
      this.casinoJackpotState = jackpot;
    }
  }

  private getCasinoRouletteTargetAtAim(): CasinoRouletteTargetScreenRect | null {
    if (this.sceneDef?.id !== 'casino-main' || this.casinoRouletteActivated || this.tutorialStep) return null;
    const camera = this.cameras.main;
    const aimScreen = this.isMobileControls
      ? { x: this.aim.x - camera.scrollX, y: this.aim.y - camera.scrollY }
      : this.aim;
    if (!isCasinoRouletteTargetAtScreenPoint(aimScreen, camera.scrollX, camera.scrollY)) return null;
    return getCasinoRouletteTargetScreenRect(camera.scrollX, camera.scrollY);
  }

  private activateCasinoRoulette(): void {
    this.casinoRouletteActivated = true;
    const state: CasinoJackpotEventState = {
      phase: 'flash', cycleIndex: Math.floor(this.casinoJackpotElapsedMs / 15_000),
      laneIndex: 1, centerX: 640, sweepOffset: 0, phaseProgress: 0, intensity: 1,
    };
    this.casinoJackpotManualState = state;
    this.casinoJackpotManualFlashMs = CASINO_JACKPOT_FLASH_MS;
    this.casinoJackpotState = state;
    FeedbackService.play(this, 'confirm', 1);
    this.applyCasinoJackpotDistraction(state, 300);
  }

  private drawCasinoRouletteTargetHint(): void {
    const rect = this.getCasinoRouletteTargetAtAim();
    if (!rect) {
      this.casinoRouletteHint?.setVisible(false);
      return;
    }
    const camera = this.cameras.main;
    const topLeft = camera.getWorldPoint(rect.x, rect.y);
    const target = camera.getWorldPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    const blocked = isShotBlocked(this.getWeaponMuzzle(), target, this.getActiveCovers());
    const color = blocked ? 0xffc46a : 0xffd66f;
    this.fx.lineStyle(3, color, 0.96);
    this.fx.strokeRoundedRect(topLeft.x, topLeft.y, rect.width, rect.height, 9);
    this.fx.lineStyle(1.5, 0xfff3c1, 0.86);
    this.fx.strokeCircle(target.x, target.y, 9 + Math.sin(this.time.now / 70) * 2);
    if (!this.casinoRouletteHint) {
      this.casinoRouletteHint = this.add.text(0, 0, '', {
        fontSize: '12px', color: '#ffe3a3', fontStyle: 'bold', stroke: '#141a20', strokeThickness: 5,
        backgroundColor: '#111820d9', padding: { x: 8, y: 5 },
      }).setOrigin(0.5).setDepth(28).setScrollFactor(0);
    }
    this.casinoRouletteHint
      .setPosition(rect.x + rect.width / 2, Math.max(120, rect.y - 20))
      .setText(blocked ? 'РУЛЕТКА • УГОЛ ЗАКРЫТ' : 'РУЛЕТКА • ВЫСТРЕЛ ДЛЯ ДЖЕКПОТА')
      .setColor(blocked ? '#ffc46a' : '#ffe3a3')
      .setVisible(true);
  }

  private applyCasinoJackpotDistraction(state: CasinoJackpotEventState, laneRadius = 170): void {
    const laneCenter = this.cameras.main.getWorldPoint(state.centerX + state.sweepOffset, 0).x;
    let distractedCount = 0;
    for (const enemy of this.enemies) {
      if (!canCasinoJackpotDistract(enemy.type, enemy.state)) continue;
      const duration = getCasinoJackpotDistractionMs(enemy.type);
      if (duration <= 0 || Math.abs(enemy.x - laneCenter) > laneRadius) continue;
      enemy.distractionRemainingMs = Math.max(enemy.distractionRemainingMs, duration);
      distractedCount += 1;
    }
    const callout = this.add.text(state.centerX, 164, '777  •  ДЖЕКПОТ', {
      fontSize: '24px', color: '#ffe29a', fontStyle: 'bold',
      stroke: '#21170b', strokeThickness: 6, shadow: { offsetX: 0, offsetY: 0, color: '#ffc84d', blur: 12, fill: true },
    }).setOrigin(0.5).setDepth(27).setScrollFactor(0);
    this.tweens.add({
      targets: callout, y: 132, alpha: 0, duration: 620, ease: 'Quad.easeOut',
      onComplete: () => callout.destroy(),
    });
    this.showToast(distractedCount > 0
      ? 'ДЖЕКПОТ • ОХРАНА ОТВЛЕЧЕНА ×' + distractedCount
      : 'ДЖЕКПОТ • ВСПЫШКА В ПУСТОМ СЕКТОРЕ', 700);
  }

  private drawCasinoLightCone(): void {
    const state = this.casinoLightState;
    const layer = this.casinoLightLayer;
    if (!state || !layer || state.phase === 'idle') return;
    const top = this.cameras.main.getWorldPoint(state.centerX, 92);
    const floor = this.cameras.main.getWorldPoint(state.centerX + state.sweepOffset, 522);
    const halfWidth = state.phase === 'warning' ? 92 : state.phase === 'flash' ? 172 : 142;
    const left = { x: floor.x - halfWidth, y: floor.y };
    const right = { x: floor.x + halfWidth, y: floor.y };
    const coneAlpha = state.phase === 'flash' ? 0.15 : 0.055 * state.intensity;
    layer.fillStyle(0xffd991, coneAlpha);
    layer.fillTriangle(top.x, top.y, left.x, left.y, right.x, right.y);
    layer.lineStyle(state.phase === 'warning' ? 2 : 1.5, 0xffd58a, 0.34 * state.intensity);
    layer.lineBetween(top.x, top.y, left.x, left.y);
    layer.lineBetween(top.x, top.y, right.x, right.y);
    layer.fillStyle(0xffd58a, 0.05 * state.intensity);
    layer.fillEllipse(floor.x, floor.y, halfWidth * 1.9, 48);
    if (state.phase === 'warning') {
      const radius = 22 + Math.sin(this.time.now / 70) * 4;
      layer.lineStyle(3, 0xffd58a, 0.82);
      layer.strokeCircle(top.x, top.y + 20, radius);
      layer.fillStyle(0xfff0c8, 0.75);
      layer.fillCircle(top.x, top.y + 20, 4);
    }
  }

  private drawCasinoJackpotFlash(): void {
    const state = this.casinoJackpotState;
    if (!state || state.phase === 'idle') return;
    const center = this.cameras.main.getWorldPoint(state.centerX + state.sweepOffset, 258);
    const pulse = 0.7 + Math.sin(this.time.now / 42) * 0.18;
    if (state.phase === 'warning') {
      const alpha = 0.46 + pulse * 0.24;
      this.fx.fillStyle(0xffd85c, 0.07 * alpha);
      this.fx.fillEllipse(center.x, center.y, 210, 74);
      this.fx.lineStyle(3, 0xffd45e, alpha);
      this.fx.strokeEllipse(center.x, center.y, 150, 56);
      for (let index = 0; index < 3; index += 1) {
        const x = center.x + (index - 1) * 27;
        this.fx.fillStyle(0xffedaa, alpha);
        this.fx.fillCircle(x, center.y, 5 + pulse * 2);
      }
      return;
    }
    if (state.phase === 'recovery') {
      this.fx.lineStyle(2, 0xffd45e, 0.35 * state.intensity);
      this.fx.strokeEllipse(center.x, center.y, 156, 60);
      return;
    }
    this.fx.fillStyle(0xffd85c, 0.1 * pulse);
    this.fx.fillCircle(center.x, center.y, 92);
    this.fx.lineStyle(5, 0xffd45e, 0.78 * pulse);
    this.fx.strokeCircle(center.x, center.y, 58);
    this.fx.lineStyle(2, 0xfff0ad, 0.82 * pulse);
    this.fx.strokeCircle(center.x, center.y, 73);
    for (let index = 0; index < 3; index += 1) {
      const x = center.x + (index - 1) * 25;
      this.fx.fillStyle(0xffedaa, 0.9 * pulse);
      this.fx.fillRoundedRect(x - 8, center.y - 10, 16, 20, 3);
      this.fx.lineStyle(2, 0x8d4d16, 0.88);
      this.fx.strokeRoundedRect(x - 8, center.y - 10, 16, 20, 3);
    }
  }

  private drawCasinoLightFlash(): void {
    const state = this.casinoLightState;
    if (!state || state.phase !== 'flash') return;
    const center = this.cameras.main.getWorldPoint(state.centerX + state.sweepOffset, 354);
    const alpha = 0.115 * state.intensity;
    this.fx.fillStyle(0xfff0c9, alpha * 0.38);
    this.fx.fillEllipse(center.x, center.y, 330, 310);
    this.fx.lineStyle(3, 0xffe2a4, alpha * 1.8);
    this.fx.strokeEllipse(center.x, center.y, 300, 252);
    this.fx.lineStyle(1.5, 0xffffff, alpha * 1.2);
    this.fx.lineBetween(center.x - 112, center.y, center.x + 112, center.y);
    this.fx.lineBetween(center.x, center.y - 96, center.x, center.y + 96);
  }
  private getDisplayedWaveNumber(): number {
    return Math.min(this.waveIndex + 1, this.sceneDef.waves.length);
  }

  private drawFrame(): void {
    this.casinoLightLayer.clear();
    this.drawCasinoLightCone();
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
    this.hudMissionText.setText('КАЗИНО  •  СЕКТОР ' + (this.sceneIndex + 1) + '/' + this.missionScenes.length
      + '  •  ВОЛНА ' + this.getDisplayedWaveNumber() + '/' + this.sceneDef.waves.length);

    const healthRatio = Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1);
    const healthSegments = 12;
    const healthGap = 3;
    const healthSegmentWidth = (270 - healthGap * (healthSegments - 1)) / healthSegments;
    for (let segment = 0; segment < healthSegments; segment += 1) {
      const segmentFill = Phaser.Math.Clamp(healthRatio * healthSegments - segment, 0, 1);
      const x = 76 + segment * (healthSegmentWidth + healthGap);
      this.hudBars.fillStyle(0x293744, 0.98);
      this.hudBars.fillRoundedRect(x, 43, healthSegmentWidth, 13, 3);
      if (segmentFill > 0) {
        this.hudBars.fillStyle(healthRatio > 0.4 ? 0x69b58b : 0xc84d4d, 0.98);
        this.hudBars.fillRoundedRect(x, 43, healthSegmentWidth * segmentFill, 13, 3);
      }
    }
    this.hudBars.fillStyle(0x293744, 0.98);
    this.hudBars.fillRoundedRect(76, 84, 270, 4, 2);
    this.hudBars.fillStyle(0xd5a65e, 0.95);
    this.hudBars.fillRoundedRect(76, 84, 270 * this.railTimeline.progress, 4, 2);
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
    const ammoCapacity = Math.max(1, ammoStats.magazine);
    const ammoSegments = Math.min(30, ammoCapacity);
    const ammoGap = 2;
    const ammoSegmentWidth = (236 - ammoGap * (ammoSegments - 1)) / ammoSegments;
    for (let segment = 0; segment < ammoSegments; segment += 1) {
      const bulletStart = segment * ammoCapacity / ammoSegments;
      const bulletFill = Phaser.Math.Clamp(this.magazine - bulletStart, 0, ammoCapacity / ammoSegments)
        / (ammoCapacity / ammoSegments);
      const x = 1000 + segment * (ammoSegmentWidth + ammoGap);
      this.hudBars.fillStyle(0x293744, 0.98);
      this.hudBars.fillRoundedRect(x, 75, ammoSegmentWidth, 8, 2);
      if (bulletFill > 0) {
        this.hudBars.fillStyle(this.reloading > 0 ? 0xd6a35c : 0x8db5a4, 0.98);
        this.hudBars.fillRoundedRect(x, 75, ammoSegmentWidth * bulletFill, 8, 2);
      }
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
      if (enemy.state === 'Defeated') {
        bossLabel?.setVisible(false);
        if (sprite) {
          const progress = Phaser.Math.Clamp(enemy.deathElapsedMs / 520, 0, 1);
          const fall = progress * progress;
          sprite.setVisible(true)
            .setPosition(enemy.x + Math.sin(progress * Math.PI) * 8, enemy.y - 20 + fall * 30)
            .setAngle((enemy.type === 'assault' ? 1 : -1) * 78 * fall)
            .setAlpha(1 - progress)
            .setTint(0xffd8c4);
        }
        continue;
      }
      if (enemy.state === 'Hidden') bossLabel?.setVisible(false);
      const def = ENEMIES[enemy.type];
      const hitReaction = sampleEnemyHitReaction(enemy.hitFlash, enemy.uid);
      const hitOffset = enemy.hitFlash > 0 ? Math.sin(this.time.now / 24) * 2 * (enemy.hitFlash / 230) : 0;
      const idleBob = Math.sin((this.time.now + enemy.uid * 97) / 270) * 2.2;
      const drawX = enemy.x + hitReaction.offsetX + hitOffset;
      const drawY = enemy.y - 20 + idleBob + hitReaction.offsetY;
      AssetCatalog.ensureKenneyEnemyFrames(this);
      const animationPose = enemy.hitFlash > 0 ? 'hit'
        : enemy.state === 'Attacking' ? 'fire'
          : enemy.state === 'Aiming' ? 'aim' : 'idle';
      const animationFrame = AssetCatalog.enemyAnimationFrame(enemy.type, animationPose);
      const hasAnimationFrame = AssetCatalog.hasEnemyAnimationFrame(this, enemy.type, animationPose);
      const animationAtlasKey = AssetCatalog.imageKeyFor('enemies/animation-atlas');
      const kenneyAtlasKey = 'enemy-kenney-atlas';
      const hasKenneyFrame = AssetCatalog.hasTexture(this, kenneyAtlasKey)
        && this.textures.get(kenneyAtlasKey).has(SPRITES[enemy.type]);
      const fallbackSpriteKey = 'enemy-' + enemy.type;
      const textureKey = hasAnimationFrame ? animationAtlasKey
        : hasKenneyFrame ? kenneyAtlasKey : fallbackSpriteKey;
      const frame: string | number | undefined = hasAnimationFrame ? animationFrame
        : hasKenneyFrame ? SPRITES[enemy.type] : undefined;
      if (hasAnimationFrame || hasKenneyFrame || AssetCatalog.hasTexture(this, fallbackSpriteKey)) {
        let image = sprite;
        if (!image) {
          image = this.add.image(drawX, drawY, textureKey, frame).setName(spriteKey).setDepth(2);
        } else {
          const expectedFrameName = frame === undefined ? undefined : String(frame);
          if (image.texture.key !== textureKey
            || (expectedFrameName !== undefined && image.frame.name !== expectedFrameName)) {
            image.setTexture(textureKey, frame);
          }
        }
        const isBoss = enemy.type === 'boss';
        const baseWidth = isBoss ? 150 : enemy.type === 'armored' ? 92 : 84;
        const baseHeight = isBoss ? 224 : enemy.type === 'armored' ? 154 : 146;
        const phaseTime = (this.time.now + enemy.uid * 137) / 1000;
        const breathing = Math.sin(phaseTime * 2.4);
        const aiming = enemy.state === 'Aiming';
        const attacking = enemy.state === 'Attacking';
        const hitPulse = enemy.hitFlash > 0 ? Math.sin(this.time.now / 18) : 0;
        const attackProgress = attacking ? 1 - Phaser.Math.Clamp(enemy.timer / 260, 0, 1) : 0;
        const recoilKick = attacking ? Math.sin(attackProgress * Math.PI) : 0;
        const poseScaleX = 1 + (aiming ? -0.018 : 0) + breathing * 0.008;
        const poseScaleY = 1 + (aiming ? 0.025 : 0) - breathing * 0.006;
        const poseLean = (aiming ? -1.8 : 0) + (attacking ? recoilKick * 2.2 : 0)
          + hitReaction.angle;
        // Authored and generated atlases share 192×288 (2:3) cells.
        const displayHeight = baseHeight;
        const displayWidth = hasAnimationFrame ? displayHeight * (2 / 3) : baseWidth;
        image.setPosition(drawX, drawY + (aiming ? -2 : 0) + (attacking ? recoilKick * 3 : 0))
          .setDisplaySize(displayWidth * poseScaleX * hitReaction.scaleX,
            displayHeight * poseScaleY * hitReaction.scaleY).setVisible(true);
        const entryProgress = enemy.entryDurationMs > 0
          ? enemy.entryElapsedMs / enemy.entryDurationMs : 1;
        const entryAlpha = enemy.state === 'Entering' ? 0.2 + 0.8 * entryProgress : 1;
        image.setAlpha(enemy.state === 'Entering' ? entryAlpha
          : enemy.hitFlash > 0 ? 0.72 + Math.abs(hitPulse) * 0.28 : 1);
        image.setAngle(poseLean + Math.sin(phaseTime * 1.7) * (aiming ? 0.25 : 0.7));
        const lightState = this.casinoLightState;
        const lightCenterX = lightState
          ? this.cameras.main.getWorldPoint(lightState.centerX + lightState.sweepOffset, 0).x : -10000;
        const underSpotlight = lightState?.phase === 'flash' && Math.abs(enemy.x - lightCenterX) <= 172;
        image.setTint(enemy.hitFlash > 0 ? 0xffd5d5
          : attacking ? 0xffe3c2 : enemy.distractionRemainingMs > 0 ? 0xffdf8e
            : underSpotlight ? 0xfff0c4 : 0xffffff);
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
        label.setPosition(enemy.x, enemy.y - 164).setText('НАЧАЛЬНИК ОХРАНЫ • ФАЗА ' + (enemy.bossPhase + 1))
          .setVisible(enemy.state !== 'Hidden');
      }
      if (enemy.state === 'Aiming') {
        const warningX = enemy.x;
        const warningY = enemy.y - 70;
        const warningRadius = 25 + Math.sin(this.time.now / 90) * 3;
        const aimDuration = Math.max(1, ENEMIES[enemy.type].aimMs);
        const charge = sampleEnemyAimCharge(enemy.timer, aimDuration);
        const pulse = 0.72 + Math.sin(this.time.now / 65) * 0.18;
        this.fx.lineStyle(2, 0xe25c54, 0.34);
        this.fx.strokeCircle(warningX, warningY, warningRadius);
        this.fx.lineStyle(3, 0xff695e, pulse);
        const segments = Math.max(1, Math.ceil(charge * 28));
        for (let i = 0; i < segments; i += 1) {
          const start = -Math.PI / 2 + (i / 28) * Math.PI * 2;
          const end = -Math.PI / 2 + ((i + 0.82) / 28) * Math.PI * 2;
          this.fx.lineBetween(
            warningX + Math.cos(start) * warningRadius, warningY + Math.sin(start) * warningRadius,
            warningX + Math.cos(end) * warningRadius, warningY + Math.sin(end) * warningRadius,
          );
        }
        this.fx.lineStyle(2, 0xe25c54, 0.42 + charge * 0.28);
        this.fx.lineBetween(warningX, warningY, MUZZLE.x, MUZZLE.y - 10);
        this.fx.fillStyle(0xf04f48, pulse * charge);
        this.fx.fillCircle(MUZZLE.x, MUZZLE.y - 10, 5 + charge * 7);
      }
      if (enemy.state === 'Peeking') {
        this.fx.fillStyle(0xf1c16d, 1); this.fx.fillCircle(enemy.x, enemy.y - 105, 4);
      }
    }
  }

  private drawCovers(): void {
    this.coverLayer.clear();
    this.coverDamageLayer.clear();
    for (const cover of this.coverStates) {
      const textureKey = cover.id === 'bar-counter' ? 'cover-bar' : 'cover-crate';
      const key = 'cover-image-' + cover.id;
      const existingImage = this.children.getByName(key) as Phaser.GameObjects.Image | null;
      if (cover.stage === 'destroyed') {
        existingImage?.setVisible(false);
        const baseY = cover.y + cover.height - 22;
        this.coverDamageLayer.fillStyle(0x3b3935, 0.92);
        this.coverDamageLayer.fillRoundedRect(cover.x + 7, baseY, Math.max(12, cover.width - 14), 17, 4);
        this.coverDamageLayer.lineStyle(2, 0x81796e, 0.85);
        this.coverDamageLayer.lineBetween(cover.x + 15, baseY + 5, cover.x + cover.width - 18, baseY + 4);
        for (let shard = 0; shard < 5; shard += 1) {
          const x = cover.x + 14 + shard * Math.max(12, (cover.width - 32) / 4);
          this.coverDamageLayer.fillStyle(shard % 2 === 0 ? 0x777066 : 0x514a42, 0.92);
          this.coverDamageLayer.fillTriangle(x, baseY + 1, x + 9, baseY - 7, x + 15, baseY + 2);
        }
        continue;
      }
      if (AssetCatalog.hasTexture(this, textureKey)) {
        let image = existingImage;
        if (!image) image = this.add.image(cover.x + cover.width / 2, cover.y + cover.height / 2, textureKey).setName(key).setDepth(9);
        image.setVisible(true).setTexture(textureKey).setPosition(cover.x + cover.width / 2, cover.y + cover.height / 2)
          .setDisplaySize(cover.width, cover.height);
        if (cover.stage === 'damaged') image.setTint(0xd8c0a3);
        else image.clearTint();
      } else {
        this.coverLayer.fillStyle(cover.stage === 'damaged' ? 0x302a24 : 0x101820, 0.98); this.coverLayer.fillRoundedRect(cover.x, cover.y, cover.width, cover.height, 7);
        this.coverLayer.lineStyle(3, 0x778391, 0.9); this.coverLayer.strokeRoundedRect(cover.x, cover.y, cover.width, cover.height, 7);
        this.coverLayer.lineStyle(2, 0x3c4a58, 0.9);
        this.coverLayer.lineBetween(cover.x + 12, cover.y + 14, cover.x + cover.width - 12, cover.y + cover.height - 14);
        this.coverLayer.lineBetween(cover.x + cover.width - 12, cover.y + 14, cover.x + 12, cover.y + cover.height - 14);
      }
      if (cover.stage === 'damaged') {
        const durability = Math.max(0, Math.min(1, cover.hp / cover.maxHp));
        const barWidth = Math.min(112, Math.max(46, cover.width - 28));
        const barX = cover.x + (cover.width - barWidth) / 2;
        const barY = cover.y - 13;
        this.coverDamageLayer.fillStyle(0x0b1118, 0.92);
        this.coverDamageLayer.fillRoundedRect(barX, barY, barWidth, 6, 2);
        this.coverDamageLayer.fillStyle(durability > 0.3 ? 0xd4a15a : 0xc75a52, 0.98);
        this.coverDamageLayer.fillRoundedRect(barX, barY, barWidth * durability, 6, 2);
        const crackX = cover.x + cover.width * 0.56;
        this.coverDamageLayer.lineStyle(3, 0x20170f, 0.9);
        this.coverDamageLayer.lineBetween(crackX - 12, cover.y + 8, crackX + 2, cover.y + cover.height * 0.42);
        this.coverDamageLayer.lineBetween(crackX + 2, cover.y + cover.height * 0.42,
          crackX - 18, cover.y + cover.height * 0.7);
        this.coverDamageLayer.lineBetween(crackX + 2, cover.y + cover.height * 0.42,
          crackX + 17, cover.y + cover.height - 7);
        this.coverDamageLayer.lineStyle(1.5, 0xe1c6a2, 0.62);
        this.coverDamageLayer.lineBetween(crackX - 8, cover.y + 10, crackX + 5, cover.y + cover.height * 0.4);
      }
    }
  }

  private getLiveCover(coverId?: string): RuntimeCover | undefined {
    if (!coverId) return undefined;
    return this.coverStates.find((cover) => cover.id === coverId && cover.stage !== 'destroyed');
  }

  private getActiveCovers(): RuntimeCover[] {
    return this.coverStates.filter((cover) => cover.stage !== 'destroyed');
  }

  private restoreEnemiesFromCover(coverId: string): void {
    for (const enemy of this.enemies) {
      if (enemy.coverId !== coverId) continue;
      enemy.coverId = undefined;
      if (enemy.state === 'SeekingCover' || enemy.state === 'Hidden' || enemy.state === 'Peeking') {
        this.tweens.killTweensOf(enemy);
        enemy.state = 'Exposed';
        enemy.y = enemy.originY;
        enemy.timer = Math.max(480, Math.round(ENEMIES[enemy.type].exposeMs * 0.7));
      }
    }
  }

  private applyCoverHit(cover: RuntimeCover, damage: number, point: Point): boolean {
    const previousStage = cover.stage;
    const next = applyCoverDamage(cover, damage);
    cover.hp = next.hp;
    cover.stage = next.stage;
    this.impactEffects.push({ x: point.x, y: point.y, life: 470, maxLife: 470, kind: 'cover', damage });
    FeedbackService.play(this, 'hit', 0.3);
    if (cover.stage === 'destroyed' && previousStage !== 'destroyed') {
      this.restoreEnemiesFromCover(cover.id);
      return true;
    }
    return false;
  }

  private getAimFeedback(): AimFeedbackState {
    const covers = this.getActiveCovers();
    const targets = this.enemies
      .filter((enemy) => enemy.state !== 'Defeated' && enemy.state !== 'Hidden')
      .map((enemy) => {
        const isBoss = enemy.type === 'boss';
        return {
          head: { x: enemy.x, y: enemy.y - (isBoss ? 72 : 48) },
          body: { x: enemy.x, y: enemy.y - 5 },
          headRadius: isBoss ? 42 : 32,
          bodyRadius: isBoss ? 66 : 48,
        };
      });
    const state = getAimFeedbackState(this.aim, this.getWeaponMuzzle(), targets, covers);
    if (state !== 'none') return state;
    return findEnemyProjectileCoverImpact(this.getWeaponMuzzle(), this.aim, covers) ? 'blocked' : 'none';
  }

  private updateMobileFireFeedback(state: AimFeedbackState): void {
    const button = this.mobileFireButton;
    if (!button || this.mobileFireFeedback === state) return;
    this.mobileFireFeedback = state;
    const border = state === 'clear' ? '#83f0ad' : state === 'blocked' ? '#ffc46a' : '#f0d4a4b8';
    const glow = state === 'clear' ? '0 0 0 3px #83f0ad35, 0 5px 18px #000a'
      : state === 'blocked' ? '0 0 0 3px #ffc46a35, 0 5px 18px #000a' : '0 5px 18px #000a';
    button.style.borderColor = border;
    button.style.boxShadow = glow;
  }

  private drawEffects(): void {
    this.fx.clear();
    if (this.playerHitFlash > 0) {
      this.fx.fillStyle(0xc62b37, (this.playerHitFlash / 190) * 0.2);
      this.fx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    this.drawEnemyOverlays();
    this.drawCasinoRouletteTargetHint();
    this.drawCasinoJackpotFlash();
    this.drawCasinoLightFlash();
    this.drawEnemyProjectiles();
    this.updateWeaponRig();

    if (this.shotFlash > 0) {
      const muzzle = this.getWeaponMuzzle();
      const alpha = Phaser.Math.Clamp(this.shotFlash / 135, 0, 1);
      if (AssetCatalog.hasTexture(this, 'effect-muzzle-flare')) {
        const flareKey = 'muzzle-flare-image';
        let flare = this.children.getByName(flareKey) as Phaser.GameObjects.Image | null;
        if (!flare) {
          flare = this.add.image(muzzle.x, muzzle.y, 'effect-muzzle-flare')
            .setName(flareKey).setDepth(22).setBlendMode(Phaser.BlendModes.ADD);
        }
        const flareSize = 76 + (1 - alpha) * 18;
        const sourceSize = Math.max(flare.frame.realWidth, flare.frame.realHeight, 1);
        flare.setPosition(muzzle.x, muzzle.y)
          .setScale(flareSize / sourceSize)
          .setRotation(Phaser.Math.Angle.Between(muzzle.x, muzzle.y, this.aim.x, this.aim.y))
          .setAlpha(alpha).setVisible(true);
      }
      this.fx.lineStyle(8, 0xff9b45, alpha * 0.52);
      this.fx.lineBetween(muzzle.x, muzzle.y, this.aim.x, this.aim.y);
      this.fx.lineStyle(4, 0xffd58a, alpha * 0.95);
      this.fx.lineBetween(muzzle.x, muzzle.y, this.aim.x, this.aim.y);
      this.fx.lineStyle(1.5, 0xffffff, alpha);
      this.fx.lineBetween(muzzle.x, muzzle.y, this.aim.x, this.aim.y);
      this.fx.fillStyle(0xff7b2d, alpha * 0.7);
      this.fx.fillCircle(muzzle.x, muzzle.y, 15 + (220 - this.shotFlash) * 0.22);
      this.fx.fillStyle(0xffe2a3, alpha);
      this.fx.fillCircle(muzzle.x, muzzle.y, 7 + (220 - this.shotFlash) * 0.12);
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
    } else {
      const flare = this.children.getByName('muzzle-flare-image') as Phaser.GameObjects.Image | null;
      flare?.setVisible(false);
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
      if (effect.kind === 'enemy-muzzle') {
        const radius = 8 + (1 - alpha) * 12;
        this.fx.fillStyle(0xffa45d, alpha * 0.68); this.fx.fillCircle(effect.x, effect.y, radius);
        this.fx.lineStyle(3, 0xffe4bc, alpha); this.fx.strokeCircle(effect.x, effect.y, radius * 0.85);
        continue;
      }
      if (effect.kind === 'player-dodge') {
        const radius = 16 + (1 - alpha) * 28;
        this.fx.fillStyle(0x69e0b0, alpha * 0.12); this.fx.fillCircle(effect.x, effect.y, radius * 1.45);
        this.fx.lineStyle(5, 0x83f0ad, alpha * 0.95); this.fx.strokeCircle(effect.x, effect.y, radius);
        this.fx.lineStyle(3, 0xe0fff0, alpha);
        this.fx.lineBetween(effect.x - radius, effect.y + radius * 0.45, effect.x + radius, effect.y - radius * 0.45);
        this.fx.lineBetween(effect.x - radius * 0.55, effect.y + radius * 0.9, effect.x + radius * 0.55, effect.y);
        continue;
      }
      if (effect.kind === 'player-hit') {
        const radius = 12 + (1 - alpha) * 22;
        this.fx.fillStyle(0xff5750, alpha * 0.16); this.fx.fillCircle(effect.x, effect.y, radius * 1.4);
        this.fx.lineStyle(6, 0xff6158, alpha * 0.95); this.fx.strokeCircle(effect.x, effect.y, radius);
        this.fx.lineStyle(3, 0xfff0cf, alpha);
        this.fx.lineBetween(effect.x - radius * 0.62, effect.y - radius * 0.62, effect.x + radius * 0.62, effect.y + radius * 0.62);
        this.fx.lineBetween(effect.x + radius * 0.62, effect.y - radius * 0.62, effect.x - radius * 0.62, effect.y + radius * 0.62);
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

    const aimFeedback = this.getAimFeedback();
    const reticleColor = aimFeedback === 'clear' ? 0x83f0ad
      : aimFeedback === 'blocked' ? 0xffc46a : 0xf5f7fa;
    this.updateMobileFireFeedback(aimFeedback);
    if (AssetCatalog.hasTexture(this, 'ui-cursor')) {
      let cursor = this.children.getByName('cursor-image') as Phaser.GameObjects.Image | null;
      if (!cursor) cursor = this.add.image(this.aim.x, this.aim.y, 'ui-cursor').setName('cursor-image').setDepth(25);
      cursor.setPosition(this.aim.x, this.aim.y)
        .setDisplaySize(this.isMobileControls ? 56 : 48, this.isMobileControls ? 56 : 48)
        .setTint(reticleColor).setVisible(true);
    } else {
      this.fx.lineStyle(3, reticleColor, 0.96);
      this.fx.strokeCircle(this.aim.x, this.aim.y, this.isMobileControls ? 16 : 13);
      this.fx.lineBetween(this.aim.x - 29, this.aim.y, this.aim.x - 8, this.aim.y);
      this.fx.lineBetween(this.aim.x + 8, this.aim.y, this.aim.x + 29, this.aim.y);
      this.fx.lineBetween(this.aim.x, this.aim.y - 29, this.aim.x, this.aim.y - 8);
      this.fx.lineBetween(this.aim.x, this.aim.y + 8, this.aim.x, this.aim.y + 29);
      this.fx.fillStyle(reticleColor, 1);
      this.fx.fillCircle(this.aim.x, this.aim.y, 2.5);
    }
  }

  private drawEnemyProjectiles(): void {
    const colors: Record<EnemyType, number> = {
      guard: 0xff7868,
      armored: 0xffc06b,
      assault: 0xff8e61,
      boss: 0xd78aff,
    };
    for (const projectile of this.enemyProjectiles) {
      const sample = sampleEnemyProjectile(
        projectile.start, projectile.target, projectile.elapsedMs, projectile.durationMs,
      );
      const tail = sampleEnemyProjectile(
        projectile.start, projectile.target,
        Math.max(0, projectile.elapsedMs - projectile.durationMs * 0.14),
        projectile.durationMs,
      );
      const color = colors[projectile.type];
      const alpha = 0.84 + Math.sin(this.time.now / 36 + projectile.uid) * 0.12;
      this.fx.lineStyle(projectile.type === 'boss' ? 12 : 8, color, 0.2 * alpha);
      this.fx.lineBetween(tail.x, tail.y, sample.x, sample.y);
      this.fx.lineStyle(projectile.type === 'boss' ? 4 : 2.8, color, alpha);
      this.fx.lineBetween(tail.x, tail.y, sample.x, sample.y);
      this.fx.fillStyle(0xfff1d4, alpha);
      this.fx.fillCircle(sample.x, sample.y, projectile.type === 'boss' ? 5 : 3.5);
    }
  }

  private drawEnemyOverlays(): void {
    for (const enemy of this.enemies) {
      if (enemy.state === 'Defeated' || enemy.state === 'Hidden') continue;
      if (enemy.state === 'Entering') {
        const pulse = 1 + Math.sin(this.time.now / 85 + enemy.uid) * 0.12;
        this.fx.lineStyle(2, 0xe0b66f, 0.72);
        this.fx.strokeCircle(enemy.entryTargetX, enemy.y + 4, 28 * pulse);
        continue;
      }
      const def = ENEMIES[enemy.type];
      const barWidth = enemy.type === 'boss' ? 150 : 58;
      const barY = enemy.y - (enemy.type === 'boss' ? 140 : 88);
      this.fx.fillStyle(0x131a22, 0.95); this.fx.fillRoundedRect(enemy.x - barWidth / 2, barY, barWidth, 8, 3);
      this.fx.fillStyle(def.color, 1); this.fx.fillRoundedRect(enemy.x - barWidth / 2, barY, barWidth * (enemy.hp / enemy.maxHp), 8, 3);
      if (enemy.distractionRemainingMs > 0) {
        const sparkleY = enemy.y - 114;
        const sparklePulse = 0.76 + Math.sin(this.time.now / 55 + enemy.uid) * 0.2;
        this.fx.fillStyle(0xffd36e, sparklePulse);
        this.fx.fillCircle(enemy.x, sparkleY, 5);
        this.fx.lineStyle(2, 0xfff0b1, sparklePulse);
        this.fx.lineBetween(enemy.x - 13, sparkleY, enemy.x + 13, sparkleY);
        this.fx.lineBetween(enemy.x, sparkleY - 13, enemy.x, sparkleY + 13);
        this.fx.strokeCircle(enemy.x, sparkleY, 11 + (1 - sparklePulse) * 5);
      }
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
