/**
 * CURVE UTILITIES
 * 
 * Functions for calculating exponential/non-linear values
 * used throughout the physics system.
 */

export class Curves {
    
    /**
     * Calculate a value along an exponential curve with onset and peak.
     * 
     * @param {number} input - Current value (0-1 typically, e.g., speedRatio)
     * @param {object} curve - Curve config { onset, peak, power, min?, max? }
     * @returns {number} - Output value along the curve
     * 
     * Example:
     *   input = 0.6 (60% speed)
     *   curve = { onset: 0.3, peak: 1.0, power: 2, max: 0.7 }
     *   
     *   Below 0.3: returns 0
     *   At 0.3: starts ramping up
     *   At 1.0: returns 0.7 (max)
     *   Shape determined by power (2 = quadratic)
     */
    static calculate(input, curve) {
        const { onset = 0, peak = 1, power = 1, min = 0, max = 1 } = curve;
        
        // Below onset = no effect
        if (input <= onset) {
            return min;
        }
        
        // Above peak = max effect
        if (input >= peak) {
            return max;
        }
        
        // Normalize input to 0-1 range between onset and peak
        const range = peak - onset;
        const normalized = (input - onset) / range;
        
        // Apply power curve
        const curved = Math.pow(normalized, power);
        
        // Scale to min-max range
        return min + (curved * (max - min));
    }
    
    /**
     * Inverse curve - high at low input, low at high input.
     * Useful for things like "acceleration falls off at high speed"
     * 
     * @param {number} input - Current value (0-1)
     * @param {object} curve - Curve config { onset, peak, power, min }
     * @returns {number} - Output value (starts at 1, falls to min)
     */
    static calculateInverse(input, curve) {
        const { onset = 0, peak = 1, power = 1, min = 0 } = curve;
        
        // Below onset = full value
        if (input <= onset) {
            return 1;
        }
        
        // Above peak = minimum value
        if (input >= peak) {
            return min;
        }
        
        // Normalize input to 0-1 range between onset and peak
        const range = peak - onset;
        const normalized = (input - onset) / range;
        
        // Apply power curve (inverted)
        const curved = Math.pow(normalized, power);
        
        // Scale from 1 down to min
        return 1 - (curved * (1 - min));
    }
    
    /**
     * Bell curve - peaks at a middle value, falls off on both sides.
     * Useful for steering (best at medium speed).
     * 
     * @param {number} input - Current value (0-1)
     * @param {object} curve - { peakSpeed, lowSpeedMin, highSpeedMin, falloffPower }
     * @returns {number} - Output value (peaks at peakSpeed)
     */
    static calculateBell(input, curve) {
        const { 
            peakSpeed = 0.5, 
            lowSpeedMin = 0.2, 
            highSpeedMin = 0.3, 
            falloffPower = 2 
        } = curve;
        
        if (input <= peakSpeed) {
            // Rising from lowSpeedMin to 1.0 at peak
            const normalized = input / peakSpeed;
            const curved = Math.pow(normalized, falloffPower);
            return lowSpeedMin + (curved * (1 - lowSpeedMin));
        } else {
            // Falling from 1.0 at peak to highSpeedMin
            const normalized = (input - peakSpeed) / (1 - peakSpeed);
            const curved = Math.pow(normalized, falloffPower);
            return 1 - (curved * (1 - highSpeedMin));
        }
    }
    
    /**
     * Range-based curve - returns value between min and max based on input.
     * With onset: no interpolation below onset.
     * 
     * @param {number} input - Current value (0-1)
     * @param {object} curve - { onset, peak, power, min, max }
     * @returns {number} - Interpolated value
     */
    static calculateRange(input, curve) {
        const { onset = 0, peak = 1, power = 1, min = 0, max = 1 } = curve;
        
        if (input <= onset) {
            return min;
        }
        
        if (input >= peak) {
            return max;
        }
        
        const range = peak - onset;
        const normalized = (input - onset) / range;
        const curved = Math.pow(normalized, power);
        
        return min + (curved * (max - min));
    }
}