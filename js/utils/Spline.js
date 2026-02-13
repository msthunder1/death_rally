/**
 * SPLINE UTILITIES
 * 
 * Catmull-Rom spline interpolation for smooth track curves.
 * Given control points, generates smooth path between them.
 */

export class Spline {
    
    /**
     * Catmull-Rom interpolation between 4 points
     * t = 0 returns p1, t = 1 returns p2
     */
    static catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        return {
            x: 0.5 * (
                (2 * p1.x) +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
            ),
            y: 0.5 * (
                (2 * p1.y) +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
            )
        };
    }
    
    /**
     * Interpolate a value (like width) along the spline
     */
    static lerpValue(v0, v1, v2, v3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        return 0.5 * (
            (2 * v1) +
            (-v0 + v2) * t +
            (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
            (-v0 + 3 * v1 - 3 * v2 + v3) * t3
        );
    }
    
    /**
     * Generate smooth points along a closed loop spline.
     * 
     * @param {Array} controlPoints - Array of {x, y, widthL, widthR, ...}
     * @param {number} resolution - Points to generate between each control point
     * @param {boolean} closed - Whether the spline loops back to start
     * @returns {Array} - Interpolated points with position, width, normals
     */
    static generate(controlPoints, resolution = 10, closed = true) {
        const points = controlPoints;
        const n = points.length;
        const result = [];
        
        for (let i = 0; i < n; i++) {
            // Get 4 control points (wrap around for closed loop)
            const p0 = points[(i - 1 + n) % n];
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            const p3 = points[(i + 2) % n];
            
            // Skip last segment if not closed
            if (!closed && i === n - 1) break;
            
            // Generate points along this segment
            for (let j = 0; j < resolution; j++) {
                const t = j / resolution;
                
                // Position
                const pos = this.catmullRom(p0, p1, p2, p3, t);
                
                // Width (interpolated)
                const widthL = this.lerpValue(
                    p0.widthL || 40, p1.widthL || 40, 
                    p2.widthL || 40, p3.widthL || 40, t
                );
                const widthR = this.lerpValue(
                    p0.widthR || 40, p1.widthR || 40,
                    p2.widthR || 40, p3.widthR || 40, t
                );
                
                result.push({
                    x: pos.x,
                    y: pos.y,
                    widthL,
                    widthR,
                    // Store segment info for flags/checkpoints
                    segment: i,
                    t: t
                });
            }
        }
        
        // Calculate normals (perpendicular to direction)
        for (let i = 0; i < result.length; i++) {
            const prev = result[(i - 1 + result.length) % result.length];
            const next = result[(i + 1) % result.length];
            
            // Direction vector
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            // Normal (perpendicular, pointing right of direction)
            result[i].nx = -dy / len;
            result[i].ny = dx / len;
        }
        
        return result;
    }
    
    /**
     * Get left and right edge points for a spline point
     */
    static getEdges(point) {
        return {
            left: {
                x: point.x + point.nx * point.widthL,
                y: point.y + point.ny * point.widthL
            },
            right: {
                x: point.x - point.nx * point.widthR,
                y: point.y - point.ny * point.widthR
            }
        };
    }
}