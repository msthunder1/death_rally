import { Car } from '../entities/Car.js';
import { Skidmarks } from '../entities/Skidmarks.js';
import { PhysicsConfig } from '../config/PhysicsConfig.js';

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
        // Draw some ground markers so you can see movement
        this.createGroundMarkers();

        // Skidmarks layer (draws behind car)
        this.skidmarks = new Skidmarks(this);

        // Spawn car in center
        this.car = new Car(this, 640, 360);

        // Camera follows car
        this.cameras.main.startFollow(this.car.sprite, true, 0.1, 0.1);

        // HUD - fixed to screen
        this.createHUD();
    }
    
    createHUD() {
        const hudStyle = {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        };
        
        // Controls info
        this.add.text(10, 10, 'WASD or Arrow Keys to drive | SPACE = Handbrake', {
            fontSize: '14px',
            fill: '#888888'
        }).setScrollFactor(0);
        
        // Speed display
        this.speedText = this.add.text(10, 680, 'Speed: 0 km/h', hudStyle).setScrollFactor(0);
        
        // Gear display
        this.gearText = this.add.text(200, 680, 'Gear: 1', hudStyle).setScrollFactor(0);
        
        // RPM bar background
        const rpmBarBg = this.add.rectangle(400, 690, 200, 20, 0x333333).setScrollFactor(0);
        rpmBarBg.setOrigin(0, 0.5);
        
        // RPM bar fill
        this.rpmBar = this.add.rectangle(400, 690, 0, 16, 0x00ff00).setScrollFactor(0);
        this.rpmBar.setOrigin(0, 0.5);
        
        // RPM label
        this.add.text(400, 665, 'RPM', { fontSize: '12px', fill: '#888888' }).setScrollFactor(0);
        
        // Drift bar background
        const driftBarBg = this.add.rectangle(650, 690, 150, 20, 0x333333).setScrollFactor(0);
        driftBarBg.setOrigin(0, 0.5);

        // Drift bar fill
        this.driftBar = this.add.rectangle(650, 690, 0, 16, 0xff8800).setScrollFactor(0);
        this.driftBar.setOrigin(0, 0.5);

        // Drift label
        this.add.text(650, 665, 'DRIFT', { fontSize: '12px', fill: '#888888' }).setScrollFactor(0);
    }

    createGroundMarkers() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x1a1a3e, 1);
        
        // Grid of dots so you can see you're moving
        for (let x = -2000; x < 2000; x += 100) {
            for (let y = -2000; y < 2000; y += 100) {
                graphics.fillCircle(x, y, 3);
            }
        }
    }

    update(time, delta) {
        this.car.update(delta);

        // Draw skidmarks when drifting
        this.skidmarks.update(this.car);

        // Update HUD
        const speedKmh = Math.round(this.car.getSpeedKmh());
        this.speedText.setText(`Speed: ${speedKmh} km/h`);
        this.gearText.setText(`Gear: ${this.car.currentGear}`);
        
        // RPM bar (0-200 pixels width)
        const rpmWidth = this.car.rpm * 196;
        this.rpmBar.width = rpmWidth;
        
        // Color RPM bar based on value
        if (this.car.rpm > PhysicsConfig.rpmDangerThreshold) {
            this.rpmBar.fillColor = 0xff0000;  // Red - high RPM
        } else if (this.car.rpm > PhysicsConfig.rpmWarningThreshold) {
            this.rpmBar.fillColor = 0xffff00;  // Yellow
        } else {
            this.rpmBar.fillColor = 0x00ff00;  // Green
        }
        
        // Drift bar - shows lateral slide amount
        const driftWidth = this.car.slipAmount * 146;
        this.driftBar.width = driftWidth;

        // Color drift bar based on intensity
        if (this.car.slipAmount > PhysicsConfig.driftDangerThreshold) {
            this.driftBar.fillColor = 0xff0000;  // Red - major drift
        } else if (this.car.slipAmount > PhysicsConfig.driftWarningThreshold) {
            this.driftBar.fillColor = 0xff8800;  // Orange - sliding
        } else {
            this.driftBar.fillColor = 0xffff00;  // Yellow - light slip
        }
    }
}