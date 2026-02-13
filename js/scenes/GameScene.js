import { Car } from '../entities/Car.js';
import { Skidmarks } from '../entities/Skidmarks.js';
import { PhysicsConfig } from '../config/PhysicsConfig.js';
import { TrackConfig } from '../config/TrackConfig.js';
import { SplineTrack } from '../tracks/SplineTrack.js';
import { Track2 } from '../tracks/definitions/track2.js';

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
        // Build the track (spline-based)
        this.track = new SplineTrack(this, Track2);

        // Skidmarks layer (draws behind car)
        this.skidmarks = new Skidmarks(this);

        // Spawn car at start line
        const spawn = this.track.getSpawnPosition();
        this.car = new Car(this, spawn.x, spawn.y);
        this.car.angle = spawn.angle;
        this.car.sprite.setAngle(spawn.angle);

        // Camera follows car
        this.cameras.main.startFollow(this.car.sprite, true, 0.08, 0.08);
        const bounds = this.track.getBounds();
        this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

        // HUD - fixed to screen
        this.createHUD();
    }
    
    createHUD() {
        const hudStyle = {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
        };

        // Controls info
        this.add.text(10, 10, 'WASD or Arrow Keys to drive | SPACE = Handbrake', {
            fontSize: '14px',
            fill: '#888888',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setScrollFactor(0);

        // HUD background bar
        const hudBg = this.add.rectangle(0, 660, 1280, 60, 0x000000, 0.5).setScrollFactor(0);
        hudBg.setOrigin(0, 0);

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
        this.add.text(400, 665, 'RPM', { fontSize: '12px', fill: '#aaaaaa',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setScrollFactor(0);

        // Drift bar background
        const driftBarBg = this.add.rectangle(650, 690, 100, 20, 0x333333).setScrollFactor(0);
        driftBarBg.setOrigin(0, 0.5);

        // Drift bar fill
        this.driftBar = this.add.rectangle(650, 690, 0, 16, 0xffff00).setScrollFactor(0);
        this.driftBar.setOrigin(0, 0.5);

        // Drift label
        this.add.text(650, 665, 'DRIFT', { fontSize: '12px', fill: '#aaaaaa',
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setScrollFactor(0);
    }

    update(time, delta) {
        this.car.update(delta);

        const cx = this.car.sprite.x;
        const cy = this.car.sprite.y;

        // Check object collision first (barriers)
        const objCollision = this.track.checkObjectCollision(cx, cy, 15);
        if (objCollision) {
            this.car.sprite.setPosition(objCollision.x, objCollision.y);
            this.car.speed *= objCollision.bounce;
            this.car.slip *= objCollision.bounce;
        }

        // Off-road check (optional slowdown, no hard collision)
        // For now, just let car drive anywhere - barriers define limits

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

        // Drift bar
        const driftWidth = this.car.slipAmount * 96;
        this.driftBar.width = driftWidth;

        if (this.car.slipAmount > PhysicsConfig.driftDangerThreshold) {
            this.driftBar.fillColor = 0xff0000;  // Red
        } else if (this.car.slipAmount > PhysicsConfig.driftWarningThreshold) {
            this.driftBar.fillColor = 0xff8800;  // Orange
        } else {
            this.driftBar.fillColor = 0xffff00;  // Yellow
        }
    }
}