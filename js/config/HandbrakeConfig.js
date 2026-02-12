/**
 * HANDBRAKE CONFIGURATION
 *
 * The handbrake locks rear wheels to initiate drifts.
 * Use it with steering to whip around tight corners.
 * Without steering, it just slows you down.
 */

export const HandbrakeConfig = {

    // How much slip is multiplied when handbraking (1 = normal, 3 = 3x drift)
    slipMultiplier: 3.0,

    // Turn rate boost while handbraking (1 = normal, 1.5 = 50% faster rotation)
    turnMultiplier: 1.5,

    // How much handbrake bypasses slip steering reduction (0 = none, 1 = full)
    // At 0.7, you keep most of your steering while drifting with handbrake
    steeringBypass: 0.7,

    // Speed loss while handbraking (km/h per second)
    speedLoss: 40,

    // Minimum speed to handbrake (km/h) - no effect below this
    minSpeed: 20,
};
