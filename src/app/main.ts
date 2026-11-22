import Phaser from 'phaser';
import { gameConfig } from './GameConfig';
import './style.css';

// Phaser's Scale Manager already listens for browser resize and orientation
// changes in FIT mode. Do not force canvas CSS dimensions or run a second
// resize loop here: Android's visual viewport can report transient sizes.
const game = new Phaser.Game(gameConfig);

window.addEventListener('beforeunload', () => game.destroy(true));
