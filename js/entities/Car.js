import { CarStats } from './CarStats.js';
import { StatsConverter } from '../utils/StatsConverter.js';
import { PhysicsConfig } from '../config/PhysicsConfig.js';
import { HandbrakeConfig } from '../config/HandbrakeConfig.js';
import { SkidmarkConfig } from '../config/SkidmarkConfig.js';
import { Curves } from '../utils/Curves.js';
import { SurfaceConfig } from '../config/SurfaceConfig.js';

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

        // Extra weight from guns/upgrades (kg) - reduces acceleration
        this.extraWeight = 0;

        // Surface/terrain state (set by GameScene each frame)
        this.currentTerrain = 'road';
        this.terrainMultipliers = {
            speedMultiplier: 1.0,
            accelerationMultiplier: 1.0,
            gripMultiplier: 1.0,
            slipMultiplier: 1.0,
            brakeMultiplier: 1.0,
            dragMultiplier: 1.0,
        };

        // Gear shift state
        this.lastGear = 1;
        this.gearShiftTimer = 0;

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

    /**
     * Set current terrain multipliers.
     * Speed multiplier applies instantly (speed reduction handled gradually in update).
     * Other multipliers transition linearly at rate units/second.
     */
    setTerrain(terrainKey, target, dt, rate) {
        this.currentTerrain = terrainKey;
        const m = this.terrainMultipliers;
        const step = rate * dt;

        function moveToward(current, goal, maxStep) {
            const diff = goal - current;
            if (Math.abs(diff) <= maxStep) return goal;
            return current + Math.sign(diff) * maxStep;
        }

        // Speed multiplier instant — gradual speed reduction in update()
        m.speedMultiplier = target.speedMultiplier;

        // Handling multipliers transition linearly
        m.accelerationMultiplier = moveToward(m.accelerationMultiplier, target.accelerationMultiplier, step);
        m.gripMultiplier = moveToward(m.gripMultiplier, target.gripMultiplier, step);
        m.slipMultiplier = moveToward(m.slipMultiplier, target.slipMultiplier, step);
        m.brakeMultiplier = moveToward(m.brakeMultiplier, target.brakeMultiplier, step);
        m.dragMultiplier = moveToward(m.dragMultiplier, target.dragMultiplier, step);
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
        
        // Detect gear shift
        if (this.currentGear !== this.lastGear) {
            this.gearShiftTimer = PhysicsConfig.gearShiftLag;
            this.lastGear = this.currentGear;
        }
        if (this.gearShiftTimer > 0) {
            this.gearShiftTimer -= dt;
        }

        // Get acceleration for current gear (already calibrated by powerCurve)
        // Extra weight from guns/upgrades reduces acceleration: F=ma
        const weightMult = this.physics.weight / (this.physics.weight + this.extraWeight);

        // RPM falloff: stronger at start of gear (130%), weaker at end (70%)
        const rpmMult = (1 + PhysicsConfig.gearRpmFalloff / 2) - PhysicsConfig.gearRpmFalloff * this.rpm;

        // Gear shift lag: brief power cut when changing gears
        const shiftMult = this.gearShiftTimer > 0 ? PhysicsConfig.gearShiftPower : 1;

        const baseAccel = this.getCurrentAcceleration() * weightMult * rpmMult * shiftMult;
        const accel = baseAccel * this.terrainMultipliers.accelerationMultiplier;
        
        // Burnout detection (wheel spin on hard launch)
        const burnoutThreshold = this.physics.maxSpeedPx * SkidmarkConfig.burnoutMaxSpeedFraction;
        const tyreBurnoutMult = this.physics.tyreBurnoutMultiplier;
        const effectiveThreshold = burnoutThreshold * tyreBurnoutMult;
        if (gasPressed && this.speed >= 0 && this.speed < effectiveThreshold) {
            const speedFactor = 1 - (this.speed / effectiveThreshold);
            this.burnout = speedFactor * tyreBurnoutMult * SkidmarkConfig.burnoutIntensity;
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
                const brakeForce = StatsConverter.kmhToPixels(PhysicsConfig.brakingForce) * brakeMultiplier * this.physics.brakeForce * this.terrainMultipliers.brakeMultiplier;
                this.speed -= brakeForce * dt;
                if (this.speed < 0) this.speed = 0;
            } else {
                // Reversing (slower acceleration)
                this.speed -= accel * PhysicsConfig.reverseAccelerationRatio * dt;
            }
        } else {
            // Surface drag — decoupled from acceleration, stronger off-road
            const dragAccel = baseAccel * this.terrainMultipliers.dragMultiplier;
            const engineBrakeMultiplier = Curves.calculateRange(speedRatio, PhysicsConfig.engineBrakingCurve);

            if (this.speed > 0) {
                this.speed -= dragAccel * engineBrakeMultiplier * dt;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += dragAccel * engineBrakeMultiplier * dt;
                if (this.speed > 0) this.speed = 0;
            }
        }
        
        // Terrain speed reduction — gradual linear pull-down to terrain cap
        const terrainMaxSpeed = this.physics.maxSpeedPx * this.terrainMultipliers.speedMultiplier;
        if (this.speed > terrainMaxSpeed) {
            const fullGap = this.physics.maxSpeedPx - terrainMaxSpeed;
            const reductionRate = fullGap / SurfaceConfig.speedTransitionTime;
            this.speed = Math.max(terrainMaxSpeed, this.speed - reductionRate * dt);
        }
        const maxReverse = terrainMaxSpeed * PhysicsConfig.reverseSpeedRatio;
        if (this.speed < -maxReverse) this.speed = -maxReverse;
        
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
        
        // Slip base force scales with max speed (so drift scales with pixelsPerMeter)
        const slipBase = this.physics.maxSpeedPx * PhysicsConfig.slipBaseRatio;

        if (turnInput !== 0) {
            // LATERAL SLIP - car slides outward from turn
            const slipForceRatio = Curves.calculate(steerSpeedRatio, PhysicsConfig.slipCurve);
            const effectiveGrip = this.physics.grip * this.terrainMultipliers.gripMultiplier;
            const gripReduction = 1 - (effectiveGrip * PhysicsConfig.gripSlipReduction);
            const tyreDriftMult = this.physics.tyreDriftMultiplier;
            let targetSlip = -turnInput * slipForceRatio * gripReduction * tyreDriftMult * slipBase * this.terrainMultipliers.slipMultiplier;

            // Handbrake massively boosts slip
            if (this.handbraking) {
                targetSlip *= HandbrakeConfig.slipMultiplier;
            }

            this.slip += (targetSlip - this.slip) * Math.min(1, PhysicsConfig.slipBuildupRate * dt);

            // Steering reduction derived from current slip amount
            const slipRatio = Math.min(1, Math.abs(this.slip) / slipBase);
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

            // Speed loss from cornering (scales with slip buildup, same as skidmarks)
            // speedLossCurve.max is a ratio of car's top speed
            const speedLossRatio = Curves.calculate(steerSpeedRatio, PhysicsConfig.speedLossCurve);
            const currentSlipAmount = Math.min(1, Math.abs(this.slip) / slipBase);
            const gripEnergyLoss = StatsConverter.kmhToPixels(speedLossRatio * this.physics.maxSpeedKmh) * this.physics.grip * Math.abs(turnInput) * currentSlipAmount * dt;
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
        this.slipAmount = Math.min(1, Math.abs(this.slip) / slipBase);
        
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
        
        // Combined velocity - capped so lateral slip doesn't add speed
        let vx = forwardX + lateralX;
        let vy = forwardY + lateralY;

        const totalMag = Math.sqrt(vx * vx + vy * vy);
        const targetMag = Math.abs(this.speed);
        if (totalMag > targetMag && totalMag > 0) {
            const scale = targetMag / totalMag;
            vx *= scale;
            vy *= scale;
        }

        // Apply velocity
        this.sprite.setVelocity(vx, vy);
    }
}