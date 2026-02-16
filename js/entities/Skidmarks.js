import { SkidmarkConfig } from '../config/SkidmarkConfig.js';

export class Skidmarks {
    constructor(scene) {
        this.graphics = scene.add.graphics();
    }

    update(car, trailConfig = null) {
        // Determine strongest skidmark source
        const driftStrength = car.slipAmount > SkidmarkConfig.minDrift
            ? Math.min(1, car.slipAmount * SkidmarkConfig.intensity) : 0;
        const handbrakeStrength = car.handbraking ? Math.max(0.6, driftStrength) : 0;
        const burnoutStrength = car.burnout;

        const strength = Math.max(driftStrength, handbrakeStrength, burnoutStrength);
        if (strength <= 0) return;

        const wheels = car.getRearWheelPositions();

        // Use trail config from surface, fall back to SkidmarkConfig defaults
        const color = trailConfig ? trailConfig.color : SkidmarkConfig.color;
        const minA = trailConfig ? trailConfig.minAlpha : SkidmarkConfig.minAlpha;
        const maxA = trailConfig ? trailConfig.maxAlpha : SkidmarkConfig.maxAlpha;
        const trailType = trailConfig ? trailConfig.type : 'skidmark';

        const alpha = minA + strength * (maxA - minA);
        const size = SkidmarkConfig.minSize + strength * (SkidmarkConfig.maxSize - SkidmarkConfig.minSize);

        if (trailType === 'displacement') {
            // Grass pushed aside — wider, offset marks
            this.graphics.fillStyle(color, alpha * 0.7);
            this.graphics.fillCircle(wheels.left.x - 2, wheels.left.y, size * 1.5);
            this.graphics.fillCircle(wheels.left.x + 2, wheels.left.y, size * 1.5);
            this.graphics.fillCircle(wheels.right.x - 2, wheels.right.y, size * 1.5);
            this.graphics.fillCircle(wheels.right.x + 2, wheels.right.y, size * 1.5);
        } else if (trailType === 'print') {
            // Tyre prints in sand/snow — slightly larger, more defined
            this.graphics.fillStyle(color, alpha);
            this.graphics.fillCircle(wheels.left.x, wheels.left.y, size * 1.2);
            this.graphics.fillCircle(wheels.right.x, wheels.right.y, size * 1.2);
        } else {
            // Default skidmark — dark rubber marks
            this.graphics.fillStyle(color, alpha);
            this.graphics.fillCircle(wheels.left.x, wheels.left.y, size);
            this.graphics.fillCircle(wheels.right.x, wheels.right.y, size);
        }
    }
}
