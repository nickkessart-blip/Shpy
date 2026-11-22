import Phaser from 'phaser';
import { AssetCatalog } from '../assets/AssetCatalog';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload(): void { AssetCatalog.preload(this); }
  create(): void { this.scene.start('HQ'); }
}
