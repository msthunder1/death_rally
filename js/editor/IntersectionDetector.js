import { Spline } from '../utils/Spline.js';

export class IntersectionDetector {

    static check(controlPoints) {
        if (controlPoints.length < 4) return false;

        const spline = Spline.generate(controlPoints, 4, true);
        const n = spline.length;

        // Build centerline segments
        const segments = [];
        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            segments.push({
                x1: spline[i].x, y1: spline[i].y,
                x2: spline[next].x, y2: spline[next].y
            });
        }

        // Check all non-adjacent pairs
        for (let i = 0; i < segments.length; i++) {
            for (let j = i + 2; j < segments.length; j++) {
                // Skip segments that share a vertex (adjacent via wrap)
                if (i === 0 && j === segments.length - 1) continue;
                if (this.segmentsIntersect(segments[i], segments[j])) {
                    return true;
                }
            }
        }
        return false;
    }

    static segmentsIntersect(a, b) {
        const d1 = this.cross(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
        const d2 = this.cross(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
        const d3 = this.cross(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
        const d4 = this.cross(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);

        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
            return true;
        }
        return false;
    }

    static cross(ax, ay, bx, by, cx, cy) {
        return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    }
}
