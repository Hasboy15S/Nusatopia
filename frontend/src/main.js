import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import './style.css';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#4EB4AC', // Warna air teal (Tiny Swords style)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);

