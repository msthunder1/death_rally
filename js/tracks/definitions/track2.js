/**
 * TRACK 2 - Simple Oval
 * 
 * Clean stadium-shaped track.
 * Two straights + two semicircular ends.
 */

export const Track2 = {
    name: 'Simple Oval',
    theme: 'asphalt',
    
    worldWidth: 2000,
    worldHeight: 1200,
    
    resolution: 10,
    closed: true,
    
    path: [
        // === BOTTOM STRAIGHT (left to right) ===
        { x: 500,  y: 800, widthL: 60, widthR: 60 },
        { x: 700,  y: 800, widthL: 60, widthR: 60 },
        { x: 900,  y: 800, widthL: 60, widthR: 60 },
        { x: 1100, y: 800, widthL: 60, widthR: 60 },
        { x: 1300, y: 800, widthL: 60, widthR: 60 },
        
        // === RIGHT CURVE (semicircle going up) ===
        // Center: (1300, 600), Radius: 200
        { x: 1400, y: 770, widthL: 60, widthR: 60 },
        { x: 1470, y: 700, widthL: 60, widthR: 60 },
        { x: 1500, y: 600, widthL: 60, widthR: 60 },
        { x: 1470, y: 500, widthL: 60, widthR: 60 },
        { x: 1400, y: 430, widthL: 60, widthR: 60 },
        
        // === TOP STRAIGHT (right to left) ===
        { x: 1300, y: 400, widthL: 60, widthR: 60 },
        { x: 1100, y: 400, widthL: 60, widthR: 60 },
        { x: 900,  y: 400, widthL: 60, widthR: 60 },
        { x: 700,  y: 400, widthL: 60, widthR: 60 },
        { x: 500,  y: 400, widthL: 60, widthR: 60 },
        
        // === LEFT CURVE (semicircle going down) ===
        // Center: (500, 600), Radius: 200
        { x: 400, y: 430, widthL: 60, widthR: 60 },
        { x: 330, y: 500, widthL: 60, widthR: 60 },
        { x: 300, y: 600, widthL: 60, widthR: 60 },
        { x: 330, y: 700, widthL: 60, widthR: 60 },
        { x: 400, y: 770, widthL: 60, widthR: 60 },
        // loops back to start at (500, 800)
    ],
    
    objects: [],
    
    checkpoints: [0, 5, 11, 16]
};