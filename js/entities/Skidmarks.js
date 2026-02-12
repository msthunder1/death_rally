import { SkidmarkConfig } from '../config/SkidmarkConfig.js';

export class Skidmarks {
    constructor(scene) {
        this.graphics = scene.add.graphics();
    }

    update(car) {
        // Determine strongest skidmark source
        const driftStrength = car.slipAmount > SkidmarkConfig.minDrift
            ? Math.min(1, car.slipAmount * SkidmarkConfig.intensity) : 0;
        const handbrakeStrength = car.handbraking ? Math.max(0.6, driftStrength) : 0;
        const burnoutStrength = car.burnout;

        const strength = Math.max(driftStrength, handbrakeStrength, burnoutStrength);
        if (strength <= 0) return;

        const wheels = car.getRearWheelPositions();

        const alpha = SkidmarkConfig.minAlpha + strength * (SkidmarkConfig.maxAlpha - SkidmarkConfig.minAlpha);
        const size = SkidmarkConfig.minSize + strength * (SkidmarkConfig.maxSize - SkidmarkConfig.minSize);

        this.graphics.fillStyle(SkidmarkConfig.color, alpha);
        this.graphics.fillCircle(wheels.left.x, wheels.left.y, size);
        this.graphics.fillCircle(wheels.right.x, wheels.right.y, size);
    }
}
