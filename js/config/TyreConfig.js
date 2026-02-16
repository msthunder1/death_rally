/**
 * TYRE CONFIGURATION
 *
 * 12 tyre levels with explicit per-level stats.
 * Level 1 = stock tyres, Level 12 = premium racing tyres.
 *
 * gripBonus         - Added to car's base grip (0-1 scale)
 * driftMultiplier   - Multiplier on drift force (1.0 = full drift, lower = less)
 * burnoutMultiplier - Multiplier on burnout intensity (1.0 = full, lower = less)
 * accelPenalty      - Seconds added to 0-100 time (stock tyres = heavier/rougher)
 */

export const TyreConfig = [
    //                 grip    drift   burnout  accel
    //                 bonus   mult    mult     penalty
    { gripBonus: 0.00, driftMultiplier: 1.00, burnoutMultiplier: 1.00, accelPenalty: 1.1 },  // 1  Stock
    { gripBonus: 0.01, driftMultiplier: 0.95, burnoutMultiplier: 0.94, accelPenalty: 1.0 },  // 2
    { gripBonus: 0.02, driftMultiplier: 0.91, burnoutMultiplier: 0.87, accelPenalty: 0.9 },  // 3
    { gripBonus: 0.04, driftMultiplier: 0.86, burnoutMultiplier: 0.81, accelPenalty: 0.8 },  // 4
    { gripBonus: 0.05, driftMultiplier: 0.82, burnoutMultiplier: 0.74, accelPenalty: 0.7 },  // 5
    { gripBonus: 0.06, driftMultiplier: 0.77, burnoutMultiplier: 0.68, accelPenalty: 0.6 },  // 6
    { gripBonus: 0.08, driftMultiplier: 0.73, burnoutMultiplier: 0.62, accelPenalty: 0.5 },  // 7
    { gripBonus: 0.09, driftMultiplier: 0.68, burnoutMultiplier: 0.55, accelPenalty: 0.4 },  // 8
    { gripBonus: 0.10, driftMultiplier: 0.64, burnoutMultiplier: 0.49, accelPenalty: 0.3 },  // 9
    { gripBonus: 0.11, driftMultiplier: 0.59, burnoutMultiplier: 0.42, accelPenalty: 0.2 },  // 10
    { gripBonus: 0.13, driftMultiplier: 0.55, burnoutMultiplier: 0.36, accelPenalty: 0.1 },  // 11
    { gripBonus: 0.15, driftMultiplier: 0.50, burnoutMultiplier: 0.30, accelPenalty: 0.0 },  // 12 Premium
];
