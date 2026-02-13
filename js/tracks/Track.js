import { TrackRenderer } from './TrackRenderer.js';

/**
 * Track entity - renders the track and provides math-based boundary checking.
 *
 * Wall collision uses ellipse equations instead of physics bodies:
 *   isOnTrack(x, y) - returns true if point is between inner and outer walls
 *   pushToTrack(x, y) - returns nearest valid position if off track
 */
export class Track {
    constructor(scene, trackDef) {
        this.scene = scene;
        this.def = trackDef;

        // Render the track visuals
        this.renderer = new TrackRenderer(scene, trackDef);
        this.renderer.draw();
    }

    /**
     * Check if a point is on the road (between inner and outer ellipses)
     */
    isOnTrack(x, y) {
        const T = this.def;
        const dx = (x - T.centerX) / T.outerRadiusX;
        const dy = (y - T.centerY) / T.outerRadiusY;
        const outerDist = dx * dx + dy * dy;

        const idx = (x - T.centerX) / T.innerRadiusX;
        const idy = (y - T.centerY) / T.innerRadiusY;
        const innerDist = idx * idx + idy * idy;

        return outerDist <= 1.0 && innerDist >= 1.0;
    }

    /**
     * Push a point back onto the track (nearest point on road)
     * Returns { x, y } of the corrected position
     */
    pushToTrack(x, y) {
        const T = this.def;
        const angle = Math.atan2(
            (y - T.centerY) / T.outerRadiusY,
            (x - T.centerX) / T.outerRadiusX
        );

        // Nearest point on outer wall
        const outerX = T.centerX + Math.cos(angle) * T.outerRadiusX;
        const outerY = T.centerY + Math.sin(angle) * T.outerRadiusY;

        // Nearest point on inner wall
        const innerX = T.centerX + Math.cos(angle) * T.innerRadiusX;
        const innerY = T.centerY + Math.sin(angle) * T.innerRadiusY;

        // Which wall is closer?
        const dOuter = Math.hypot(x - outerX, y - outerY);
        const dInner = Math.hypot(x - innerX, y - innerY);

        // Push 10% inward from the wall
        if (dOuter < dInner) {
            return {
                x: outerX + (innerX - outerX) * 0.1,
                y: outerY + (innerY - outerY) * 0.1
            };
        } else {
            return {
                x: innerX + (outerX - innerX) * 0.1,
                y: innerY + (outerY - innerY) * 0.1
            };
        }
    }

    /**
     * Get spawn position at top of oval (start/finish line)
     */
    getSpawnPosition() {
        const T = this.def;
        const midRY = (T.outerRadiusY + T.innerRadiusY) / 2;
        return {
            x: T.centerX,
            y: T.centerY - midRY,
            angle: T.spawnAngle
        };
    }

    /**
     * Get world bounds for camera
     */
    getBounds() {
        const T = this.def;
        return {
            x: 0,
            y: 0,
            width: T.worldWidth,
            height: T.worldHeight
        };
    }
}
