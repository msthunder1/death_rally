/**
 * PHYSICS CONFIGURATION
 * 
 * Tweak these values to adjust how the car feels.
 * Save file and refresh browser to test changes.
 * 
 * CURVE EXPLANATION:
 * - onset: speed % where effect STARTS (below this = zero effect)
 * - peak: speed % where effect is MAXIMUM
 * - power: curve shape (1=linear, 2=quadratic, 3=cubic, higher=more sudden)
 * - max: the maximum value of the effect at peak
 */

export const PhysicsConfig = {
    
    // ===========================================
    // ACCELERATION & SPEED
    // ===========================================

    // Acceleration per gear is set by CarStats.powerCurve:
    //   1 = mild (3:1 low-to-high gear ratio)
    //   2 = realistic (9:1 ratio - punchy low gears, crawling top gear)
    //   3 = aggressive (27:1 ratio)
    // Calibrated so 0-100 km/h time matches CarStats.acceleration0to100.

    // Reverse speed as percentage of max speed
    reverseSpeedRatio: 0.2,                 // 20% of max
    
    // Reverse acceleration multiplier (compared to forward)
    reverseAccelerationRatio: 0.4,          // 40% of forward accel
    
    // ===========================================
    // BRAKING
    // ===========================================

    // Base braking force (km/h lost per second at low speed)
    brakingForce: 120,

    // Braking effectiveness - stronger at low speed, weaker at high speed
    // Like real brakes: easy to stop from 30, hard to stop from 200
    brakingCurve: {
        onset: 0.0,         // Always active
        peak: 1.0,          // Full curve at top speed
        power: 1.5,         // How sharply braking weakens at speed
        min: 0.3            // At top speed, braking is 30% as effective
    },


    // Engine braking when not pressing gas
    engineBrakingCurve: {
        onset: 0.0,         // Always active
        peak: 1.0,          // Strongest at top speed
        power: 1.5,         // Slightly exponential
        min: 0.1,           // 10% at low speed
        max: 0.4            // 40% at high speed
    },
    
    
    // ===========================================
    // STEERING
    // ===========================================
    
    // Base turn speed in degrees per second
    baseTurnSpeed: 180,
    
    // Steering effectiveness curve (peaks at medium speed)
    steeringCurve: {
        peakSpeed: 0.5,     // Best steering at 50% of max speed
        lowSpeedMin: 0.2,   // 20% effectiveness at standstill
        highSpeedMin: 0.4,  // 40% effectiveness at top speed
        falloffPower: 2     // How sharply it drops from peak
    },
    
    // Minimum speed (px/s) required to turn
    minSpeedToTurn: 1,
    
    
    // ===========================================
    // CORNERING SPEED LOSS
    // ===========================================
    
    // Speed lost when turning at speed
    speedLossCurve: {
        onset: 0.2,         // No speed loss below 20% speed
        peak: 1.0,          // Maximum loss at top speed
        power: 2,           // Quadratic - felt earlier in speed range
        max: 72             // Maximum km/h lost per second at peak
    },
    
    
    // ===========================================
    // LATERAL SLIP / DRIFT
    // ===========================================
    
    // When the car slides outward from turns
    slipCurve: {
        onset: 0.2,         // No slip below 20% speed (~40 km/h)
        peak: 1.0,          // Maximum slip at top speed
        power: 1.5,         // Gentler ramp - felt in mid-range
        max: 1.0            // Multiplier for max slip force
    },

    // Base slip force (pixels/second of lateral movement at max)
    slipBaseForce: 250,

    // How much grip reduces slip (0 = grip ignored, 1 = full effect)
    gripSlipReduction: 0.6,
    
    // Slip decay rate - how quickly slip reduces when not turning
    // Higher = snappier recovery, Lower = more floaty/drifty
    slipDecayRate: 5.0,

    // How much slip reduces steering (0 = no effect, 1 = full lock at max slip)
    slipSteeringReduction: 0.7,

    // Minimum steering when sliding at maximum
    minSteeringWhenSlipping: 0.25,


    // ===========================================
    // DRIFT THRESHOLDS (for HUD colors)
    // ===========================================
    
    // Drift bar turns orange above this value
    driftWarningThreshold: 0.3,

    // Drift bar turns red above this value
    driftDangerThreshold: 0.6,
    
    
    // ===========================================
    // RPM THRESHOLDS (for HUD colors)
    // ===========================================
    
    // RPM bar turns yellow above this value
    rpmWarningThreshold: 0.6,
    
    // RPM bar turns red above this value  
    rpmDangerThreshold: 0.8,
    
    
    // ===========================================
    // WORLD SCALE
    // ===========================================
    
    // Pixels per meter (affects speed conversion)
    // 10 = car sprite of 40px represents 4 meter car
    pixelsPerMeter: 10,
};