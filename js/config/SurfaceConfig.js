/**
 * SURFACE / TERRAIN CONFIGURATION
 *
 * Defines physics properties and trail visuals for each surface type.
 *
 * Physics multipliers are applied when the car is OFF-ROAD on that terrain.
 * On the road, all multipliers are 1.0 (no effect).
 *
 * Trail config controls how skidmarks/tracks look on each surface.
 */

export const SurfaceConfig = {

    surfaces: {
        asphalt: {
            groundColor: 0x555555,
            terrain: {
                speedMultiplier: 0.7,
                accelerationMultiplier: 0.5,
                gripMultiplier: 0.8,
                slipMultiplier: 1.0,
                brakeMultiplier: 0.9,
                dragMultiplier: 1.2,
            },
            trail: {
                color: 0x222222,
                type: 'skidmark',
                minAlpha: 0.1,
                maxAlpha: 0.8,
            },
        },

        grass: {
            groundColor: 0x2d5a1e,
            terrain: {
                speedMultiplier: 0.35,
                accelerationMultiplier: 0.25,
                gripMultiplier: 0.4,
                slipMultiplier: 1.8,
                brakeMultiplier: 0.5,
                dragMultiplier: 2.5,
            },
            trail: {
                color: 0x1a4a10,
                type: 'displacement',
                minAlpha: 0.15,
                maxAlpha: 0.5,
            },
        },

        sand: {
            groundColor: 0xc4a45a,
            terrain: {
                speedMultiplier: 0.25,
                accelerationMultiplier: 0.2,
                gripMultiplier: 0.3,
                slipMultiplier: 2.5,
                brakeMultiplier: 0.4,
                dragMultiplier: 3.0,
            },
            trail: {
                color: 0x9a8040,
                type: 'print',
                minAlpha: 0.2,
                maxAlpha: 0.6,
            },
        },

        snow: {
            groundColor: 0xddeeff,
            terrain: {
                speedMultiplier: 0.3,
                accelerationMultiplier: 0.2,
                gripMultiplier: 0.25,
                slipMultiplier: 3.0,
                brakeMultiplier: 0.3,
                dragMultiplier: 2.0,
            },
            trail: {
                color: 0xbbccdd,
                type: 'print',
                minAlpha: 0.2,
                maxAlpha: 0.7,
            },
        },
    },

    // When on the road, ALL multipliers are 1.0 — no physics effect
    road: {
        speedMultiplier: 1.0,
        accelerationMultiplier: 1.0,
        gripMultiplier: 1.0,
        slipMultiplier: 1.0,
        brakeMultiplier: 1.0,
        dragMultiplier: 1.0,
    },

    // How quickly handling multipliers kick in (units per second, linear)
    // 1.0 = grip/slip/drag/accel/brake reach full effect in ~0.5-1s
    transitionRate: 1.0,

    // How many seconds for speed to decrease from road max to terrain max
    // 3.0 = gradual linear speed loss over 3 seconds when off-road
    speedTransitionTime: 3.0,
};
