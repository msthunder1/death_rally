/**
 * TRACK OBJECTS
 * 
 * Reusable objects that can be placed on/around tracks.
 * These provide collision, not the road itself.
 */

export class Barrier {
    /**
     * A line segment barrier (red/white stripes)
     * 
     * @param {object} scene - Phaser scene
     * @param {number} x1 - Start x
     * @param {number} y1 - Start y
     * @param {number} x2 - End x
     * @param {number} y2 - End y
     * @param {object} options - { thickness, color, bounce }
     */
    constructor(scene, x1, y1, x2, y2, options = {}) {
        this.scene = scene;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        
        this.thickness = options.thickness || 10;
        this.color = options.color || 0xff0000;
        this.stripeColor = options.stripeColor || 0xffffff;
        this.bounce = options.bounce || 0.5;  // Speed retained on collision
        
        // Pre-calculate for collision
        this.dx = x2 - x1;
        this.dy = y2 - y1;
        this.length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        
        // Normal (perpendicular to barrier)
        this.nx = -this.dy / this.length;
        this.ny = this.dx / this.length;
        
        // Draw
        this.graphics = scene.add.graphics();
        this.draw();
    }
    
    draw() {
        const gfx = this.graphics;
        const stripes = Math.floor(this.length / 20);
        
        // Background
        gfx.lineStyle(this.thickness, this.color);
        gfx.lineBetween(this.x1, this.y1, this.x2, this.y2);
        
        // White stripes
        gfx.lineStyle(this.thickness * 0.6, this.stripeColor);
        for (let i = 0; i < stripes; i += 2) {
            const t1 = i / stripes;
            const t2 = (i + 1) / stripes;
            
            gfx.lineBetween(
                this.x1 + this.dx * t1,
                this.y1 + this.dy * t1,
                this.x1 + this.dx * t2,
                this.y1 + this.dy * t2
            );
        }
        
        // Edge outline
        gfx.lineStyle(1, 0x000000, 0.5);
        gfx.lineBetween(this.x1, this.y1, this.x2, this.y2);
    }
    
    /**
     * Check if a point collides with this barrier
     * Returns null if no collision, or { x, y, nx, ny, bounce } if collision
     */
    checkCollision(x, y, radius = 15) {
        // Project point onto line segment
        const px = x - this.x1;
        const py = y - this.y1;
        
        // Parameter t along the segment (0 = start, 1 = end)
        let t = (px * this.dx + py * this.dy) / (this.length * this.length);
        t = Math.max(0, Math.min(1, t));  // Clamp to segment
        
        // Nearest point on segment
        const nearestX = this.x1 + t * this.dx;
        const nearestY = this.y1 + t * this.dy;
        
        // Distance from point to nearest
        const dist = Math.hypot(x - nearestX, y - nearestY);
        
        // Check collision (barrier thickness + car radius)
        const collisionDist = this.thickness / 2 + radius;
        
        if (dist < collisionDist) {
            // Push direction (from nearest point toward the car)
            const pushX = (x - nearestX) / dist;
            const pushY = (y - nearestY) / dist;
            
            // Push position (outside the barrier)
            return {
                x: nearestX + pushX * collisionDist,
                y: nearestY + pushY * collisionDist,
                nx: pushX,
                ny: pushY,
                bounce: this.bounce
            };
        }
        
        return null;
    }
}


export class TireWall {
    /**
     * Soft barrier made of tires (less bounce, absorbs impact)
     */
    constructor(scene, x1, y1, x2, y2, options = {}) {
        this.barrier = new Barrier(scene, x1, y1, x2, y2, {
            thickness: options.thickness || 15,
            color: 0x333333,
            stripeColor: 0x666666,
            bounce: options.bounce || 0.3  // Softer
        });
    }
    
    checkCollision(x, y, radius) {
        return this.barrier.checkCollision(x, y, radius);
    }
}


export class TrackObjectFactory {
    /**
     * Create track objects from definition array
     */
    static create(scene, objectDefs) {
        const objects = [];
        
        for (const def of objectDefs) {
            switch (def.type) {
                case 'barrier':
                    objects.push(new Barrier(
                        scene, 
                        def.x1, def.y1, def.x2, def.y2,
                        def.options || {}
                    ));
                    break;
                    
                case 'tire_wall':
                    objects.push(new TireWall(
                        scene,
                        def.x1, def.y1, def.x2, def.y2,
                        def.options || {}
                    ));
                    break;
                    
                // Add more types here: building, tree, grandstand, etc.
            }
        }
        
        return objects;
    }
}