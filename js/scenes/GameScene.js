import { Car } from '../entities/Car.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Create a simple car sprite (colored rectangle for now)
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Car body - 40x20 rectangle
        graphics.fillStyle(0xe63946, 1);  // Red
        graphics.fillRect(0, 0, 40, 20);
        
        // Windshield hint
        graphics.fillStyle(0x1d3557, 1);  // Dark blue
        graphics.fillRect(25, 4, 10, 12);
        
        graphics.generateTexture('car', 40, 20);
        graphics.destroy();
    }

    create() {
        // Spawn car in center
        this.car = new Car(this, 640, 360);
        
        // Camera follows car
        this.cameras.main.startFollow(this.car.sprite, true, 0.1, 0.1);
        
        // Draw some ground markers so you can see movement
        this.createGroundMarkers();
        
        // Controls info
        this.add.text(10, 10, 'WASD or Arrow Keys to drive', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);
    }

    createGroundMarkers() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x2a2a4a, 1);
        
        // Grid of dots so you can see you're moving
        for (let x = -2000; x < 2000; x += 100) {
            for (let y = -2000; y < 2000; y += 100) {
                graphics.fillCircle(x, y, 3);
            }
        }
    }

    update(time, delta) {
        this.car.update(delta);
    }
}