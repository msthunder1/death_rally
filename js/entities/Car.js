export class Car {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'car');
        this.sprite.setDrag(300);
        this.sprite.setMaxVelocity(400);
        
        // Car stats (tune these!)
        this.stats = {
            acceleration: 300,
            reverseAccel: 150,
            turnSpeed: 150,      // Degrees per second at max speed
            drag: 300,
            maxSpeed: 400,
            driftFactor: 0.95    // 1 = no drift, 0 = ice
        };
        
        // Current state
        this.speed = 0;
        this.angle = 0;  // Degrees
        
        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update(delta) {
        const dt = delta / 1000;  // Convert to seconds
        
        // Read input
        const gasPressed = this.cursors.up.isDown || this.wasd.up.isDown;
        const brakePressed = this.cursors.down.isDown || this.wasd.down.isDown;
        const leftPressed = this.cursors.left.isDown || this.wasd.left.isDown;
        const rightPressed = this.cursors.right.isDown || this.wasd.right.isDown;
        
        // Acceleration / braking
        if (gasPressed) {
            this.speed += this.stats.acceleration * dt;
        } else if (brakePressed) {
            this.speed -= this.stats.reverseAccel * dt;
        } else {
            // Natural deceleration
            this.speed *= 0.98;
        }
        
        // Clamp speed
        this.speed = Phaser.Math.Clamp(
            this.speed, 
            -this.stats.maxSpeed * 0.3,  // Reverse is slower
            this.stats.maxSpeed
        );
        
        // Steering (only when moving)
        const speedRatio = Math.abs(this.speed) / this.stats.maxSpeed;
        const turnAmount = this.stats.turnSpeed * dt * speedRatio;
        
        if (leftPressed) {
            this.angle -= turnAmount;
        }
        if (rightPressed) {
            this.angle += turnAmount;
        }
        
        // Apply rotation to sprite
        this.sprite.setAngle(this.angle);
        
        // Calculate velocity from angle and speed
        const radians = Phaser.Math.DegToRad(this.angle);
        const vx = Math.cos(radians) * this.speed;
        const vy = Math.sin(radians) * this.speed;
        
        // Apply velocity
        this.sprite.setVelocity(vx, vy);
    }
}