import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true  // Show hitboxes during development
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);