/**
 * Human-readable car stats.
 * These are the numbers you tweak for game design.
 * StatsConverter translates them to physics values.
 */

export const CarStats = {
    name: 'Default',
    
    // Performance
    acceleration0to100: 4,    // seconds to reach 100 km/h
    maxSpeed: 200,             // km/h top speed
    gears: 5,                  // number of gears
    powerCurve: 2,             // 1 = linear, 2 = realistic drag, 3 = aggressive
    
    // Handling
    weight: 1200,              // kg - affects drift, collisions
    grip: 0.6,                 // 0-1 - car's base grip
    tyreLevel: 1,              // 1-12 - stock=1, premium=12, improves grip + acceleration
    brakeForce: 0.7,           // 0-1 - how fast you stop
    
    // Dimensions (for later - collisions, visuals)
    length: 4.0,               // meters
    width: 1.8,                // meters
};

/**
 * Example car presets for later:
 * 
 * Muscle Car:
 *   acceleration0to100: 6
 *   maxSpeed: 240
 *   gears: 6
 *   weight: 1600
 *   grip: 0.5
 *   tyreLevel: 2
 *
 * Rally Car:
 *   acceleration0to100: 8
 *   maxSpeed: 180
 *   gears: 5
 *   weight: 1100
 *   grip: 0.7
 *   tyreLevel: 4
 *
 * Truck:
 *   acceleration0to100: 18
 *   maxSpeed: 140
 *   gears: 4
 *   weight: 2500
 *   grip: 0.4
 *   tyreLevel: 1
 */