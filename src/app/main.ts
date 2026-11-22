import Phaser from 'phaser';
import { gameConfig } from './GameConfig';
import './style.css';

const game = new Phaser.Game(gameConfig);

window.addEventListener('beforeunload', () => game.destroy(true));
