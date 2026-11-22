import type Phaser from 'phaser';
import { ASSET_SLOTS } from './assetSlots';

const importedAssets = import.meta.glob(
  '/src/assets/**/*.{png,jpg,jpeg,webp,svg,ogg,mp3,wav}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

function normalizeAssetPath(path: string): string {
  return path
    .replace(/^\/src\/assets\//, '')
    .replace(/\.(png|jpe?g|webp|svg|ogg|mp3|wav)$/i, '');
}

const urlsBySlot = new Map<string, string>();
for (const [path, url] of Object.entries(importedAssets)) {
  urlsBySlot.set(normalizeAssetPath(path), url);
}

export class AssetCatalog {
  static preload(scene: Phaser.Scene): void {
    for (const [slot, key] of Object.entries(ASSET_SLOTS)) {
      const url = urlsBySlot.get(slot);
      if (url) scene.load.image(key, url);
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
