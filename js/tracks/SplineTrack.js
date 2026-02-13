/**
 * SPLINE TRACK
 * 
 * Renders a track from control points using spline interpolation.
 * Road surface only - collision comes from objects.
 */

import { Spline } from '../utils/Spline.js';
import { TrackConfig } from '../config/TrackConfig.js';
import { TrackObjectFactory } from './TrackObjects.js';

export class SplineTrack {
    constructor(scene, trackDef) {
        this.scene = scene;
        this.def = trackDef;
        
        // Generate smooth spline from control points
        this.splinePoints = Spline.generate(
            trackDef.path, 
            trackDef.resolution || 12,
            trackDef.closed !== false  // Default to closed loop
        );
        
        // Pre-calculate edges for collision/rendering
        this.edges = this.splinePoints.map(p => Spline.getEdges(p));
        
        // Render the track
        this.graphics = scene.add.graphics();
        this.draw();
        
        // Track objects (barriers, etc.)
        this.objects = [];
        this.createObjects(trackDef.objects || []);
    }
    
    draw() {
        const gfx = this.graphics;
        const points = this.splinePoints;
        const edges = this.edges;
        
        // Ground fill
        gfx.fillStyle(TrackConfig.grassColor, 1);
        gfx.fillRect(0, 0, this.def.worldWidth, this.def.worldHeight);
        
        // Road surface - draw as filled polygon
        // Left edge going forward, right edge going backward
        gfx.fillStyle(TrackConfig.roadColor, 1);
        gfx.beginPath();
        
        // Left edge (forward)
        gfx.moveTo(edges[0].left.x, edges[0].left.y);
        for (let i = 1; i < edges.length; i++) {
            gfx.lineTo(edges[i].left.x, edges[i].left.y);
        }
        // Close left edge loop
        gfx.lineTo(edges[0].left.x, edges[0].left.y);
        
        gfx.fillPath();
        
        // Fill center (need to cut out the hole for closed tracks)
        // Actually, draw right edge separately going backwards
        gfx.beginPath();
        gfx.moveTo(edges[0].right.x, edges[0].right.y);
        for (let i = 1; i < edges.length; i++) {
            gfx.lineTo(edges[i].right.x, edges[i].right.y);
        }
        gfx.lineTo(edges[0].right.x, edges[0].right.y);
        gfx.fillPath();
        
        // Hmm, that won't work for filling between edges
        // Let's do it properly with quads
        gfx.clear();
        gfx.fillStyle(TrackConfig.grassColor, 1);
        gfx.fillRect(0, 0, this.def.worldWidth, this.def.worldHeight);
        
        // Draw road as connected quads
        gfx.fillStyle(TrackConfig.roadColor, 1);
        for (let i = 0; i < edges.length; i++) {
            const next = (i + 1) % edges.length;
            
            const e1 = edges[i];
            const e2 = edges[next];
            
            gfx.beginPath();
            gfx.moveTo(e1.left.x, e1.left.y);
            gfx.lineTo(e2.left.x, e2.left.y);
            gfx.lineTo(e2.right.x, e2.right.y);
            gfx.lineTo(e1.right.x, e1.right.y);
            gfx.closePath();
            gfx.fillPath();
        }
        
        // Road edge lines (curbs)
        gfx.lineStyle(3, TrackConfig.edgeColor, 0.8);
        
        // Left edge
        gfx.beginPath();
        gfx.moveTo(edges[0].left.x, edges[0].left.y);
        for (let i = 1; i < edges.length; i++) {
            gfx.lineTo(edges[i].left.x, edges[i].left.y);
        }
        gfx.lineTo(edges[0].left.x, edges[0].left.y);
        gfx.strokePath();
        
        // Right edge
        gfx.beginPath();
        gfx.moveTo(edges[0].right.x, edges[0].right.y);
        for (let i = 1; i < edges.length; i++) {
            gfx.lineTo(edges[i].right.x, edges[i].right.y);
        }
        gfx.lineTo(edges[0].right.x, edges[0].right.y);
        gfx.strokePath();
        
        // Center line (dashed)
        this.drawCenterLine(gfx);
        
        // Start/finish line
        this.drawStartFinish(gfx);
    }
    
    drawCenterLine(gfx) {
        const points = this.splinePoints;
        const dashLength = 8;  // points per dash
        
        gfx.lineStyle(2, TrackConfig.centerLineColor, 0.7);
        
        for (let i = 0; i < points.length; i += dashLength * 2) {
            gfx.beginPath();
            gfx.moveTo(points[i].x, points[i].y);
            
            for (let j = 1; j < dashLength && i + j < points.length; j++) {
                gfx.lineTo(points[i + j].x, points[i + j].y);
            }
            gfx.strokePath();
        }
    }
    
    drawStartFinish(gfx) {
        // Draw at first control point
        const p = this.splinePoints[0];
        const e = this.edges[0];
        
        const width = p.widthL + p.widthR;
        const cells = 8;
        const cellSize = width / cells;
        
        // Checkerboard perpendicular to track
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < cells; col++) {
                gfx.fillStyle((row + col) % 2 === 0 ? 0xffffff : 0x000000, 1);
                
                // Position along the perpendicular
                const t = col / cells;
                const x = e.right.x + (e.left.x - e.right.x) * t;
                const y = e.right.y + (e.left.y - e.right.y) * t;
                
                // Offset in track direction
                const offsetX = -p.ny * (row - 0.5) * cellSize;
                const offsetY = p.nx * (row - 0.5) * cellSize;
                
                gfx.fillRect(
                    x + offsetX - cellSize/2,
                    y + offsetY - cellSize/2,
                    cellSize,
                    cellSize
                );
            }
        }
    }
    
    createObjects(objectDefs) {
        this.objects = TrackObjectFactory.create(this.scene, objectDefs);
    }
    
    /**
     * Check collision with all track objects
     * Returns collision info or null
     */
    checkObjectCollision(x, y, radius = 15) {
        for (const obj of this.objects) {
            const collision = obj.checkCollision(x, y, radius);
            if (collision) {
                return collision;
            }
        }
        return null;
    }
    
    /**
     * Check if a point is on the road surface
     * Uses ray casting / point-in-polygon for each quad
     */
    isOnTrack(x, y) {
        // Quick bounds check
        const margin = 200;
        if (x < -margin || y < -margin || 
            x > this.def.worldWidth + margin || 
            y > this.def.worldHeight + margin) {
            return false;
        }
        
        // Check each road quad
        for (let i = 0; i < this.edges.length; i++) {
            const next = (i + 1) % this.edges.length;
            
            const e1 = this.edges[i];
            const e2 = this.edges[next];
            
            if (this.pointInQuad(x, y, e1.left, e2.left, e2.right, e1.right)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Point in quad test using cross products
     */
    pointInQuad(px, py, p1, p2, p3, p4) {
        const cross = (ax, ay, bx, by) => ax * by - ay * bx;
        
        const d1 = cross(p2.x - p1.x, p2.y - p1.y, px - p1.x, py - p1.y);
        const d2 = cross(p3.x - p2.x, p3.y - p2.y, px - p2.x, py - p2.y);
        const d3 = cross(p4.x - p3.x, p4.y - p3.y, px - p3.x, py - p3.y);
        const d4 = cross(p1.x - p4.x, p1.y - p4.y, px - p4.x, py - p4.y);
        
        const allPos = d1 >= 0 && d2 >= 0 && d3 >= 0 && d4 >= 0;
        const allNeg = d1 <= 0 && d2 <= 0 && d3 <= 0 && d4 <= 0;
        
        return allPos || allNeg;
    }
    
    /**
     * Find nearest point on track edge and push car back
     */
    pushToTrack(x, y) {
        let nearest = null;
        let minDist = Infinity;
        let nearestEdgeType = null;  // 'left' or 'right'
        
        // Find closest edge point
        for (let i = 0; i < this.edges.length; i++) {
            const e = this.edges[i];
            
            const dL = Math.hypot(x - e.left.x, y - e.left.y);
            const dR = Math.hypot(x - e.right.x, y - e.right.y);
            
            if (dL < minDist) {
                minDist = dL;
                nearest = e.left;
                nearestEdgeType = 'left';
            }
            if (dR < minDist) {
                minDist = dR;
                nearest = e.right;
                nearestEdgeType = 'right';
            }
        }
        
        // Push inward from edge
        const p = this.splinePoints[this.edges.indexOf(nearest) || 0];
        const pushDist = 10;  // pixels inward from edge
        
        if (nearestEdgeType === 'left') {
            return {
                x: nearest.x - p.nx * pushDist,
                y: nearest.y - p.ny * pushDist
            };
        } else {
            return {
                x: nearest.x + p.nx * pushDist,
                y: nearest.y + p.ny * pushDist
            };
        }
    }
    
    /**
     * Get spawn position (first control point, on center line)
     */
    getSpawnPosition() {
        const p = this.splinePoints[0];
        
        // Angle is direction of travel (toward next point)
        const next = this.splinePoints[1];
        const angle = Math.atan2(next.y - p.y, next.x - p.x) * 180 / Math.PI;
        
        return {
            x: p.x,
            y: p.y,
            angle: angle
        };
    }
    
    /**
     * Get world bounds for camera
     */
    getBounds() {
        return {
            x: 0,
            y: 0,
            width: this.def.worldWidth,
            height: this.def.worldHeight
        };
    }
}