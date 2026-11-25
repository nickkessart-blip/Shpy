import type Phaser from 'phaser';
import { ASSET_SLOTS } from './assetSlots';

const importedAssets = import.meta.glob(
  '/src/assets/**/*.{png,jpg,jpeg,webp,svg,ogg,mp3,wav}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

interface ImportedAsset {
  path: string;
  url: string;
}

function normalizeAssetPath(path: string): string {
  return path
    .replace(/^\/src\/assets\//, '')
    .replace(/\.(png|jpe?g|webp|svg|ogg|mp3|wav)$/i, '');
}

const assetsBySlot = new Map<string, ImportedAsset>();
for (const [path, url] of Object.entries(importedAssets)) {
  if (/\.(ogg|mp3|wav)$/i.test(path)) continue;
  assetsBySlot.set(normalizeAssetPath(path), { path, url });
}

const SVG_SIZES: Record<string, { width: number; height: number }> = {
  'backgrounds/casino-main': { width: 1280, height: 720 },
  'backgrounds/casino-bar': { width: 1280, height: 720 },
  'backgrounds/casino-main-base': { width: 1280, height: 720 },
  'backgrounds/casino-main-far': { width: 1280, height: 720 },
  'backgrounds/casino-main-mid': { width: 1280, height: 720 },
  'backgrounds/casino-main-near': { width: 1280, height: 720 },
  'backgrounds/casino-bar-base': { width: 1280, height: 720 },
  'backgrounds/casino-bar-far': { width: 1280, height: 720 },
  'backgrounds/casino-bar-mid': { width: 1280, height: 720 },
  'backgrounds/casino-bar-near': { width: 1280, height: 720 },
  'backgrounds/train-carriage': { width: 1280, height: 720 },
  'backgrounds/train-carriage-far': { width: 1280, height: 720 },
  'backgrounds/train-carriage-mid': { width: 1280, height: 720 },
  'backgrounds/train-carriage-near': { width: 1280, height: 720 },
  'enemies/guard': { width: 480, height: 800 },
  'enemies/armored': { width: 480, height: 800 },
  'enemies/assault': { width: 480, height: 800 },
  'enemies/boss': { width: 640, height: 1000 },
  'weapons/pistol': { width: 720, height: 1240 },
  'weapons/smg': { width: 720, height: 1240 },
  'weapons/shotgun': { width: 720, height: 1240 },
  'weapons/rifle': { width: 720, height: 1240 },
  'props/cover-crate': { width: 520, height: 188 },
  'props/bar-counter': { width: 520, height: 188 },
  'ui/cursor': { width: 100, height: 100 },
  'ui/hud-health-frame': { width: 920, height: 184 },
  'ui/hud-ammo-frame': { width: 744, height: 184 },
  'ui/logo': { width: 512, height: 512 },
};

export class AssetCatalog {
  private static readonly generatedEnemyAtlasScenes = new WeakSet<Phaser.Scene>();
  static preload(scene: Phaser.Scene): void {
    for (const [slot, key] of Object.entries(ASSET_SLOTS)) {
      const asset = assetsBySlot.get(slot);
      if (!asset) continue;

      if (slot === 'enemies/animation-atlas') {
        // The prepared atlas is a 3×4 sheet of fixed 128×256 frames.
        scene.load.spritesheet(key, asset.url, { frameWidth: 128, frameHeight: 256 });
      } else if (/\.svg$/i.test(asset.path)) {
        // Phaser's SVG loader rasterizes vector art at an explicit texture size.
        // Using load.image() leaves SVG sizing to browser defaults and can create
        // empty textures on some mobile browsers.
        scene.load.svg(key, asset.url, SVG_SIZES[slot] ?? { width: 512, height: 512 });
      } else {
        scene.load.image(key, asset.url);
      }
    }

    for (const [path, url] of Object.entries(importedAssets)) {
      if (/\.(ogg|mp3|wav)$/i.test(path)) {
        scene.load.audio('audio-' + normalizeAssetPath(path), url);
      }
    }
  }



  /**
   * Compose a deterministic Phaser CanvasTexture from the four committed enemy
   * SVGs. This is a state atlas, not a hand-drawn animation sheet.
   */
  static ensureEnemyAnimationAtlas(scene: Phaser.Scene): boolean {
    const key = ASSET_SLOTS['enemies/animation-atlas'];
    if (scene.textures.exists(key)) {
      const authored = scene.textures.get(key);
      return authored.has('0') && authored.has('11');
    }
    const types = ['guard', 'armored', 'assault', 'boss'] as const;
    const poses = ['aim', 'fire', 'hit'] as const;
    const frameWidth = 192;
    const frameHeight = 384;
    const baseline = 372;
    const sources = types.map((type) => {
      const sourceSlot = ('enemies/' + type) as keyof typeof ASSET_SLOTS;
      const sourceKey = ASSET_SLOTS[sourceSlot];
      if (!scene.textures.exists(sourceKey)) return null;
      const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
      const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
      return width > 0 && height > 0 ? { source, width, height } : null;
    });
    if (sources.some((source) => source === null)) return false;
    const atlas = scene.textures.createCanvas(key, frameWidth * 3, frameHeight * 4);
    if (!atlas) return false;
    const context = atlas.getContext();
    context.clearRect(0, 0, frameWidth * 3, frameHeight * 4);
    sources.forEach((entry, row) => {
      if (!entry) return;
      poses.forEach((pose, column) => {
        const x = column * frameWidth;
        const y = row * frameHeight;
        const scale = Math.min(frameWidth / entry.width, 324 / entry.height);
        const width = entry.width * scale;
        const height = entry.height * scale;
        const drawX = x + (frameWidth - width) / 2;
        const drawY = y + baseline - height;
        context.save();
        if (pose === 'fire') context.translate(-1.5, 1.5);
        if (pose === 'hit') context.translate(-2, 0);
        context.drawImage(entry.source, drawX, drawY, width, height);
        context.restore();
        if (pose === 'fire') {
          const flashX = x + frameWidth - 8;
          const flashY = y + baseline - height * 0.55;
          context.save();
          context.globalCompositeOperation = 'screen';
          context.fillStyle = 'rgba(255, 218, 145, 0.9)';
          context.beginPath();
          context.ellipse(flashX, flashY, 7, 3.5, -0.35, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = 'rgba(255, 112, 58, 0.75)';
          context.beginPath();
          context.ellipse(flashX - 2, flashY, 3.5, 1.7, -0.35, 0, Math.PI * 2);
          context.fill();
          context.restore();
        } else if (pose === 'hit') {
          context.save();
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = 'rgba(220, 58, 58, 0.30)';
          context.fillRect(x, y, frameWidth, frameHeight);
          context.restore();
        }
      });
    });
    atlas.refresh();
    types.forEach((_type, row) => {
      poses.forEach((_pose, column) => {
        atlas.add(String(row * 3 + column), 0, column * frameWidth, row * frameHeight, frameWidth, frameHeight);
      });
    });
    const complete = types.every((_type, row) =>
      poses.every((_pose, column) => atlas.has(String(row * 3 + column))),
    );
    if (complete) this.generatedEnemyAtlasScenes.add(scene);
    return complete;
  }

  static usesGeneratedEnemyAnimationAtlas(scene: Phaser.Scene): boolean {
    return this.generatedEnemyAtlasScenes.has(scene);
  }

  static ensureFirstPersonWeaponFrames(scene: Phaser.Scene): void {
    const key = ASSET_SLOTS['weapons/first-person-atlas'];
    if (!scene.textures.exists(key)) return;
    const atlas = scene.textures.get(key);
    const frames = [
      ['fp-pistol', 0, 0], ['fp-smg', 192, 0],
      ['fp-shotgun', 0, 144], ['fp-rifle', 192, 144],
    ] as const;
    for (const [name, x, y] of frames) if (!atlas.has(name)) atlas.add(name, 0, x, y, 192, 144);
  }

  static ensureKenneyEnemyFrames(scene: Phaser.Scene): void {
    const key = ASSET_SLOTS['enemies/kenney-atlas'];
    if (!scene.textures.exists(key)) return;
    const atlas = scene.textures.get(key);
    const frames = [
      ['kenney-guard', 263, 132, 49, 43],
      ['kenney-armored', 166, 0, 49, 43],
      ['kenney-assault', 113, 0, 52, 43],
      ['kenney-boss', 214, 44, 49, 43],
    ] as const;
    for (const [name, x, y, width, height] of frames) {
      if (!atlas.has(name)) atlas.add(name, 0, x, y, width, height);
    }
  }

  static enemyAnimationFrame(
    type: 'guard' | 'armored' | 'assault' | 'boss',
    pose: 'aim' | 'fire' | 'hit',
  ): number {
    const row = type === 'guard' ? 0 : type === 'armored' ? 1 : type === 'assault' ? 2 : 3;
    const column = pose === 'aim' ? 0 : pose === 'fire' ? 1 : 2;
    return row * 3 + column;
  }

  static hasEnemyAnimationFrame(
    scene: Phaser.Scene,
    type: 'guard' | 'armored' | 'assault' | 'boss',
    pose: 'aim' | 'fire' | 'hit',
  ): boolean {
    const key = ASSET_SLOTS['enemies/animation-atlas'];
    return scene.textures.exists(key)
      && scene.textures.get(key).has(String(this.enemyAnimationFrame(type, pose)));
  }

  static hasTexture(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key);
  }

  static imageKeyFor(slot: keyof typeof ASSET_SLOTS): string {
    return ASSET_SLOTS[slot];
  }
}
