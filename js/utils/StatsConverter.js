/**
 * Converts human-readable car stats to physics engine values.
 * 
 * Scale: configurable pixels per meter
 * Car sprite ~40px = ~4 meter car (realistic)
 */

import { PhysicsConfig } from '../config/PhysicsConfig.js';

export class StatsConverter {
    // Scale factor: pixels per meter (from config)
    static get PIXELS_PER_METER() {
        return PhysicsConfig.pixelsPerMeter;
    }
    
    /**
     * Convert km/h to pixels per second
     */
    static kmhToPixels(kmh) {
        // 1 km/h = 1000m / 3600s = 0.2778 m/s
        // 0.2778 m/s * 10 px/m = 2.778 px/s per km/h
        const metersPerSecond = kmh * 1000 / 3600;
        return metersPerSecond * this.PIXELS_PER_METER;
    }
    
    /**
     * Convert pixels per second to km/h (for UI display)
     */
    static pixelsToKmh(pixelsPerSecond) {
        const metersPerSecond = pixelsPerSecond / this.PIXELS_PER_METER;
        return metersPerSecond * 3.6;  // m/s to km/h
    }
    
    /**
     * Calculate base acceleration (pixels/second²) from 0-100 time
     */
    static calcBaseAcceleration(seconds0to100) {
        // Target speed: 100 km/h in pixels/second
        const target = this.kmhToPixels(100);
        // a = v / t
        return target / seconds0to100;
    }
    
    /**
     * Generate gear configuration from car stats.
     *
     * powerCurve controls how much faster low gears are vs high gears:
     *   1 = mild (2:1 ratio), 2 = realistic (4:1), 3 = aggressive (6:1)
     *
     * Base acceleration is calibrated so the actual 0-100 km/h time
     * matches the stat exactly, accounting for gear multipliers.
     */
    static generateGears(stats) {
        const { gears, maxSpeed, acceleration0to100, powerCurve = 2 } = stats;
        const tyrePenalty = this.tyreAccelPenalty(stats.tyreLevel || 1);
        const effective0to100 = acceleration0to100 + tyrePenalty;
        const maxSpeedPx = this.kmhToPixels(maxSpeed);
        const target100Px = this.kmhToPixels(100);

        // powerCurve controls gear 1 to top gear acceleration ratio
        const ratio = Math.pow(3, powerCurve);  // 1→3:1, 2→9:1, 3→27:1

        // Calculate multiplier for each gear using exponential curve
        const multipliers = [];
        for (let i = 0; i < gears; i++) {
            const t = gears === 1 ? 0 : i / (gears - 1);  // 0 (gear 1) to 1 (top gear)
            multipliers.push(Math.pow(ratio, 1 - t));       // gear 1 = ratio, top = 1
        }

        // Calibrate: find base acceleration so 0-100 km/h = acceleration0to100 seconds
        // Time in gear i = deltaSpeed / (baseAccel * mult_i)
        // Total = (1/baseAccel) * sum(deltaSpeed / mult_i)
        // So: baseAccel = sum(deltaSpeed / mult_i) / targetTime
        let sumDeltaOverMult = 0;
        for (let i = 0; i < gears; i++) {
            const minSpeed = (i / gears) * maxSpeedPx;
            const maxGearSpeed = ((i + 1) / gears) * maxSpeedPx;

            // Only count speed range within 0-100 km/h
            if (minSpeed >= target100Px) break;
            const effectiveMax = Math.min(maxGearSpeed, target100Px);
            const deltaSpeed = effectiveMax - minSpeed;

            sumDeltaOverMult += deltaSpeed / multipliers[i];
        }
        const baseAccel = sumDeltaOverMult / effective0to100;

        // Build gear config
        const gearConfig = [];
        for (let i = 0; i < gears; i++) {
            const minSpeed = (i / gears) * maxSpeedPx;
            const maxGearSpeed = ((i + 1) / gears) * maxSpeedPx;

            gearConfig.push({
                gear: i + 1,
                minSpeedPx: minSpeed,
                maxSpeedPx: maxGearSpeed,
                minSpeedKmh: this.pixelsToKmh(minSpeed),
                maxSpeedKmh: this.pixelsToKmh(maxGearSpeed),
                acceleration: baseAccel * multipliers[i]
            });
        }

        return gearConfig;
    }
    
    /**
     * Convert tyre level to grip bonus.
     * Level 1 (stock) = +0.0, Level 12 (premium) = +0.3
     */
    static tyreBonus(tyreLevel) {
        const clamped = Math.max(1, Math.min(12, tyreLevel));
        return (clamped - 1) * (0.3 / 11);
    }

    /**
     * Tyre penalty on 0-100 time (seconds added).
     * Level 12 = +0.0s, Level 1 = +1.1s (0.1s per level below 12)
     */
    static tyreAccelPenalty(tyreLevel) {
        const clamped = Math.max(1, Math.min(12, tyreLevel));
        return (12 - clamped) * 0.1;
    }

    /**
     * Full conversion - takes CarStats, returns physics-ready values
     */
    static convert(stats) {
        const gears = this.generateGears(stats);

        // Effective grip = base grip + tyre bonus, capped at 1.0
        const effectiveGrip = Math.min(1.0, stats.grip + this.tyreBonus(stats.tyreLevel));

        return {
            // Direct conversions
            maxSpeedPx: this.kmhToPixels(stats.maxSpeed),
            maxSpeedKmh: stats.maxSpeed,

            // Gear system
            gears: gears,
            gearCount: stats.gears,

            // Braking (0-1 multiplier, scales PhysicsConfig.brakingForce)
            brakeForce: stats.brakeForce,

            // Handling
            grip: effectiveGrip,
            tyreLevel: stats.tyreLevel,
            weight: stats.weight,
            powerCurve: stats.powerCurve || 2,

            // For reference
            pixelsPerMeter: this.PIXELS_PER_METER
        };
    }
}