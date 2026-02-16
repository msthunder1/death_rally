import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';
import { EditorScene } from './scenes/EditorScene.js';
import { TrackSelectScene } from './scenes/TrackSelectScene.js';

const isEditor = new URLSearchParams(window.location.search).has('editor');

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: isEditor ? '#1a1a2e' : '#2d5a1e',
    parent: document.body,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: isEditor ? [EditorScene, GameScene] : [TrackSelectScene, GameScene]
};

const game = new Phaser.Game(config);