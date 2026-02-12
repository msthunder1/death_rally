/**
 * SKIDMARK CONFIGURATION
 *
 * Controls how skidmarks look and when they appear.
 * Skidmark visibility is driven by drift amount first,
 * then scaled by the intensity factor.
 */

export const SkidmarkConfig = {

    // Color of the skidmark (hex)
    color: 0x222222,

    // Overall intensity factor - scales how visible skidmarks are
    // 0.5 = subtle, 1.0 = normal, 2.0 = very pronounced
    intensity: 1.0,

    // Minimum drift (0-1) before skidmarks start appearing
    minDrift: 0.15,

    // Opacity range (scaled by drift * intensity)
    minAlpha: 0.1,
    maxAlpha: 0.8,

    // Size range in pixels (scaled by drift * intensity)
    minSize: 1.5,
    maxSize: 3.0,

    // ===========================================
    // BURNOUT (wheel spin on launch)
    // ===========================================

    // Burnout marks appear below this fraction of max speed (2/5 = 40%)
    burnoutMaxSpeedFraction: 0.2,

    // Base burnout intensity (before tyre reduction)
    burnoutIntensity: 0.7,

    // How much better tyres reduce burnout (0 = no effect, 1 = eliminates it)
    // Level 1 tyres = full burnout, level 6 = barely visible + ends sooner
    burnoutTyreReduction: 0.8,
};
