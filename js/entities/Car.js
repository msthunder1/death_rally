import { CarStats } from './CarStats.js';
import { StatsConverter } from '../utils/StatsConverter.js';
import { PhysicsConfig } from '../config/PhysicsConfig.js';
import { HandbrakeConfig } from '../config/HandbrakeConfig.js';
import { SkidmarkConfig } from '../config/SkidmarkConfig.js';
import { Curves } from '../utils/Curves.js';

export class Car {
    constructor(scene, x, y, customStats = null) {
        this.scene = scene;
        
        // Use custom stats or default
        const stats = customStats || CarStats;
        
        // Convert human stats to physics values
        this.physics = StatsConverter.convert(stats);
        
        // Store original stats for UI
        this.designStats = stats;
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'car');
        this.sprite.setMaxVelocity(this.physics.maxSpeedPx);
        
        // Current state
        this.speed = 0;              // pixels/second
        this.angle = 0;              // degrees
        this.currentGear = 1;        // current gear (1-indexed)
        this.rpm = 0;                // 0-1 (percentage within current gear)
        this.slip = 0;               // lateral slip velocity (px/s, positive = sliding right)
        this.slipAmount = 0;         // 0-1 for HUD display
        
        // Turning
        this.turnSpeed = PhysicsConfig.baseTurnSpeed;
        
        // Handbrake state
        this.handbraking = false;

        // Burnout state (wheel spin on launch)
        this.burnout = 0;           // 0-1 burnout intensity

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Debug: log gear config
        console.log('Gear configuration:', this.physics.gears);
        console.log('Max speed:', this.physics.maxSpeedKmh, 'km/h =', this.physics.maxSpeedPx, 'px/s');
    }
    
    /**
     * Find which gear we should be in based on current speed
     */
    findGear() {
        const gears = this.physics.gears;
        const absSpeed = Math.abs(this.speed);
        
        for (let i = gears.length - 1; i >= 0; i--) {
            if (absSpeed >= gears[i].minSpeedPx) {
                return i + 1;  // 1-indexed
            }
        }
        return 1;
    }
    
    /**
     * Get acceleration for current gear
     */
    getCurrentAcceleration() {
        const gearIndex = this.currentGear - 1;
        return this.physics.gears[gearIndex].acceleration;
    }
    
    /**
     * Calculate RPM as percentage within current gear range
     */
    calcRPM() {
        const gear = this.physics.gears[this.currentGear - 1];
        const speedInGear = Math.abs(this.speed) - gear.minSpeedPx;
        const gearRange = gear.maxSpeedPx - gear.minSpeedPx;
        return Math.max(0, Math.min(1, speedInGear / gearRange));
    }
    
    /**
     * Get current speed in km/h for UI
     */
    getSpeedKmh() {
        return StatsConverter.pixelsToKmh(Math.abs(this.speed));
    }

    /**
     * Get world positions of rear wheels (for skidmarks)
     */
    getRearWheelPositions() {
        const radians = Phaser.Math.DegToRad(this.angle);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        // Offsets from car center (car is 40x20)
        const rearX = -12;
        const halfTrack = 8;

        const cx = this.sprite.x;
        const cy = this.sprite.y;

        return {
            left: {
                x: cx + rearX * cos - (-halfTrack) * sin,
                y: cy + rearX * sin + (-halfTrack) * cos
            },
            right: {
                x: cx + rearX * cos - halfTrack * sin,
                y: cy + rearX * sin + halfTrack * cos
            }
        };
    }

    update(delta) {
        const dt = delta / 1000;
        const speedRatio = Math.abs(this.speed) / this.physics.maxSpeedPx;
        
        // Read input
        const gasPressed = this.cursors.up.isDown || this.wasd.up.isDown;
        const brakePressed = this.cursors.down.isDown || this.wasd.down.isDown;
        const leftPressed = this.cursors.left.isDown || this.wasd.left.isDown;
        const rightPressed = this.cursors.right.isDown || this.wasd.right.isDown;
        const handbrakePressed = this.spaceKey.isDown;

        // Handbrake only works above minimum speed
        this.handbraking = handbrakePressed && Math.abs(this.speed) > StatsConverter.kmhToPixels(HandbrakeConfig.minSpeed);
        
        // Update gear based on speed
        this.currentGear = this.findGear();
        
        // Get acceleration for current gear (already calibrated by powerCurve)
        const accel = this.getCurrentAcceleration();
        
        // Burnout detection (wheel spin on hard launch)
        const burnoutThreshold = this.physics.maxSpeedPx * SkidmarkConfig.burnoutMaxSpeedFraction;
        const tyreMult = 1 - ((this.physics.tyreLevel - 1) / 11) * SkidmarkConfig.burnoutTyreReduction;
        const effectiveThreshold = burnoutThreshold * tyreMult;
        if (gasPressed && this.speed >= 0 && this.speed < effectiveThreshold) {
            const speedFactor = 1 - (this.speed / effectiveThreshold);
            this.burnout = speedFactor * tyreMult * SkidmarkConfig.burnoutIntensity;
        } else {
            this.burnout = 0;
        }

        // Acceleration / braking
        if (gasPressed) {
            this.speed += accel * dt;
        } else if (brakePressed) {
            if (this.speed > 0) {
                // Braking curve - stronger at low speed, weaker at high speed
                const brakeMultiplier = Curves.calculateInverse(speedRatio, PhysicsConfig.brakingCurve);
                const brakeForce = StatsConverter.kmhToPixels(PhysicsConfig.brakingForce) * brakeMultiplier * this.physics.brakeForce;
                this.speed -= brakeForce * dt;
                if (this.speed < 0) this.speed = 0;
            } else {
                // Reversing (slower acceleration)
                this.speed -= accel * PhysicsConfig.reverseAccelerationRatio * dt;
            }
        } else {
            // Engine braking - exponential curve
            const engineBrakeMultiplier = Curves.calculateRange(speedRatio, PhysicsConfig.engineBrakingCurve);
            
            if (this.speed > 0) {
                this.speed -= accel * engineBrakeMultiplier * dt;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += accel * engineBrakeMultiplier * dt;
                if (this.speed > 0) this.speed = 0;
            }
        }
        
        // Clamp speed
        const maxReverse = this.physics.maxSpeedPx * PhysicsConfig.reverseSpeedRatio;
        this.speed = Phaser.Math.Clamp(this.speed, -maxReverse, this.physics.maxSpeedPx);
        
        // Update RPM
        this.rpm = this.calcRPM();
        
        // Recalculate speed ratio after acceleration changes
        const steerSpeedRatio = Math.abs(this.speed) / this.physics.maxSpeedPx;
        
        // Steering - bell curve (best at medium speed)
        const baseTurnEffect = Curves.calculateBell(steerSpeedRatio, PhysicsConfig.steeringCurve);
        
        // Calculate turn input
        let turnInput = 0;
        if (leftPressed && Math.abs(this.speed) > PhysicsConfig.minSpeedToTurn) turnInput = -1;
        if (rightPressed && Math.abs(this.speed) > PhysicsConfig.minSpeedToTurn) turnInput = 1;
        
        if (turnInput !== 0) {
            // LATERAL SLIP - car slides outward from turn
            const slipForceRatio = Curves.calculate(steerSpeedRatio, PhysicsConfig.slipCurve);
            const gripReduction = 1 - (this.physics.grip * PhysicsConfig.gripSlipReduction);
            let targetSlip = -turnInput * slipForceRatio * gripReduction * PhysicsConfig.slipBaseForce;

            // Handbrake massively boosts slip
            if (this.handbraking) {
                targetSlip *= HandbrakeConfig.slipMultiplier;
            }

            this.slip += (targetSlip - this.slip) * Math.min(1, PhysicsConfig.slipDecayRate * dt * 2);

            // Steering reduction derived from current slip amount
            const slipRatio = Math.min(1, Math.abs(this.slip) / PhysicsConfig.slipBaseForce);
            const slipSteeringLoss = slipRatio * PhysicsConfig.slipSteeringReduction;
            let effectiveTurn = Math.max(PhysicsConfig.minSteeringWhenSlipping, 1 - slipSteeringLoss);

            // Handbrake bypasses slip steering reduction and boosts turn rate
            if (this.handbraking) {
                effectiveTurn = effectiveTurn + (1 - effectiveTurn) * HandbrakeConfig.steeringBypass;
                effectiveTurn *= HandbrakeConfig.turnMultiplier;
            }

            // Apply turn with slip-derived reduction
            const turnAmount = this.turnSpeed * dt * baseTurnEffect * effectiveTurn;
            this.angle += turnAmount * turnInput * Math.sign(this.speed);

            // Speed loss from cornering (config is in km/h, convert to px/s)
            const speedLossKmh = Curves.calculate(steerSpeedRatio, PhysicsConfig.speedLossCurve);
            const gripEnergyLoss = StatsConverter.kmhToPixels(speedLossKmh) * this.physics.grip * Math.abs(turnInput) * dt;
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - gripEnergyLoss);
            }
        } else {
            // Decay slip when not turning (car straightens out)
            this.slip *= Math.max(0, 1 - PhysicsConfig.slipDecayRate * dt);
            if (Math.abs(this.slip) < 1) this.slip = 0;
        }

        // Handbrake speed loss (applies whether turning or not)
        if (this.handbraking && this.speed > 0) {
            const hbSpeedLoss = StatsConverter.kmhToPixels(HandbrakeConfig.speedLoss) * dt;
            this.speed = Math.max(0, this.speed - hbSpeedLoss);
        }

        // Track slip amount for HUD (normalized 0-1)
        this.slipAmount = Math.min(1, Math.abs(this.slip) / PhysicsConfig.slipBaseForce);
        
        // Apply rotation to sprite
        this.sprite.setAngle(this.angle);
        
        // Calculate velocity from angle and speed
        const radians = Phaser.Math.DegToRad(this.angle);
        
        // Forward velocity (where car is pointing)
        const forwardX = Math.cos(radians) * this.speed;
        const forwardY = Math.sin(radians) * this.speed;
        
        // Lateral velocity (perpendicular to car heading - the slip)
        // Perpendicular is 90 degrees rotated: (cos(a+90), sin(a+90)) = (-sin(a), cos(a))
        const lateralX = -Math.sin(radians) * this.slip;
        const lateralY = Math.cos(radians) * this.slip;
        
        // Combined velocity
        const vx = forwardX + lateralX;
        const vy = forwardY + lateralY;
        
        // Apply velocity
        this.sprite.setVelocity(vx, vy);
    }
}