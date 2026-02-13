/**
 * TRACK 1 - Simple Oval
 *
 * Elliptical circuit defined by inner and outer radii.
 * The road is the area between the two ellipses.
 */

export const Track1 = {
    name: 'Simple Oval',
    theme: 'asphalt',
    surface: 'asphalt',

    // World size (larger than viewport - camera follows car)
    worldWidth: 2800,
    worldHeight: 2000,

    // Track center
    centerX: 1400,
    centerY: 1000,

    // Outer wall ellipse
    outerRadiusX: 1100,
    outerRadiusY: 780,

    // Inner wall ellipse
    innerRadiusX: 925,
    innerRadiusY: 620,

    // Wall thickness (visual)
    wallWidth: 20,

    // Start/finish line at top of oval
    // Car spawns on the center line at the top
    spawnAngle: -90,        // facing up (will drive clockwise)
};
