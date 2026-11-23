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
  'backgrounds/train-carriage': { width: 1280, height: 720 },
  'enemies/guard': { width: 240, height: 400 },
  'enemies/armored': { width: 240, height: 400 },
  'enemies/assault': { width: 240, height: 400 },
  'enemies/boss': { width: 320, height: 500 },
  'weapons/pistol': { width: 360, height: 620 },
  'weapons/smg': { width: 360, height: 620 },
  'weapons/shotgun': { width: 360, height: 620 },
  'weapons/rifle': { width: 360, height: 620 },
  'props/cover-crate': { width: 520, height: 188 },
  'props/bar-counter': { width: 520, height: 188 },
  'ui/cursor': { width: 100, height: 100 },
  'ui/logo': { width: 512, height: 512 },
};

export class AssetCatalog {
  static preload(scene: Phaser.Scene): void {
    for (const [slot, key] of Object.entries(ASSET_SLOTS)) {
      const asset = assetsBySlot.get(slot);
      if (!asset) continue;

      if (/\.svg$/i.test(asset.path)) {
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

  static hasTexture(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key);
  }

  static imageKeyFor(slot: keyof typeof ASSET_SLOTS): string {
    return ASSET_SLOTS[slot];
  }
}
