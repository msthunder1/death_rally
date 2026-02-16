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

    // Gear shift lag - brief acceleration pause when changing gears
    gearShiftLag: 0.5,              // seconds of reduced power per shift
    gearShiftPower: 0.1,            // acceleration multiplier during shift (0.1 = 10%)

    // Within-gear RPM falloff - acceleration drops as RPM climbs
    // 0.6 means: start of gear = 130%, end of gear = 70% (ratio 65:35)
    gearRpmFalloff: 0.6,

    // Reverse speed as percentage of max speed
    reverseSpeedRatio: 0.2,                 // 20% of max
    
    // Reverse acceleration multiplier (compared to forward)
    reverseAccelerationRatio: 0.4,          // 40% of forward accel
    
    // ===========================================
    // BRAKING
    // ===========================================

    // Base braking force (km/h lost per second at low speed)
    brakingForce: 160,

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
        min: 0.2,           // 20% at low speed (2x previous)
        max: 0.8            // 80% at high speed (2x previous)
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
        onset: 0.4,         // No speed loss below 40% speed
        peak: 1.0,          // Maximum loss at top speed
        power: 1.6,         // Sub-quadratic - felt across speed range
        max: 1.4            // Max speed loss per second as ratio of car's top speed
    },
    
    
    // ===========================================
    // LATERAL SLIP / DRIFT
    // ===========================================
    
    // When the car slides outward from turns
    slipCurve: {
        onset: 0.4,         // No slip below 40% speed (~50 km/h)
        peak: 1.0,          // Maximum slip at top speed
        power: 1.0,         // Linear ramp - drift felt from ~80 km/h
        max: 1.0            // Multiplier for max slip force
    },

    // Base slip as ratio of max speed (scales with pixelsPerMeter)
    // 0.96 = at full slip, lateral velocity is 96% of max forward speed
    slipBaseRatio: 0.96,

    // How much grip reduces slip (0 = grip ignored, 1 = full effect)
    gripSlipReduction: 0.6,

    // Slip buildup rate - how quickly slip accumulates when turning
    // Lower = tyres grip longer before breaking loose, quick taps stay clean
    slipBuildupRate: 3.0,

    // Slip decay rate - how quickly slip reduces when not turning
    // Higher = snappier recovery, Lower = more floaty/drifty
    slipDecayRate: 5.0,

    // How much slip reduces steering (0 = no effect, 1 = full lock at max slip)
    slipSteeringReduction: 0.7,

    // Minimum steering when sliding at maximum
    minSteeringWhenSlipping: 0.25,


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
    
    // Pixels per meter (affects speed conversion and overall visual pace)
    // 12 = car sprite of 40px represents ~3.3 meter car
    pixelsPerMeter: 12,
};