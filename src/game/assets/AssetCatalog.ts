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
  'enemies/guard': { width: 240, height: 400 },
  'enemies/armored': { width: 240, height: 400 },
  'enemies/assault': { width: 240, height: 400 },
  'weapons/pistol': { width: 360, height: 620 },
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

  static hasTexture(scene: Phaser.Scene, key: string): boolean {
    return scene.textures.exists(key);
  }

  static imageKeyFor(slot: keyof typeof ASSET_SLOTS): string {
    return ASSET_SLOTS[slot];
  }
}
