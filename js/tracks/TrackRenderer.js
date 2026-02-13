import { TrackConfig } from '../config/TrackConfig.js';

/**
 * Draws an elliptical track: ground, road surface, walls, center line,
 * start/finish line.
 */
export class TrackRenderer {
    constructor(scene, trackDef) {
        this.scene = scene;
        this.def = trackDef;
    }

    draw() {
        const T = this.def;
        const gfx = this.scene.add.graphics();

        // Ground fill
        gfx.fillStyle(TrackConfig.grassColor, 1);
        gfx.fillRect(0, 0, T.worldWidth, T.worldHeight);

        const wallW = T.wallWidth;

        // Outer wall outline
        gfx.lineStyle(wallW + 6, 0x000000);
        gfx.strokeEllipse(T.centerX, T.centerY,
            (T.outerRadiusX + wallW / 2) * 2, (T.outerRadiusY + wallW / 2) * 2);
        // Outer wall fill
        gfx.lineStyle(wallW, TrackConfig.wallColor);
        gfx.strokeEllipse(T.centerX, T.centerY,
            (T.outerRadiusX + wallW / 2) * 2, (T.outerRadiusY + wallW / 2) * 2);
        // Outer wall highlight
        gfx.lineStyle(2, TrackConfig.wallHighlight, 0.6);
        gfx.strokeEllipse(T.centerX, T.centerY,
            (T.outerRadiusX + wallW - 3) * 2, (T.outerRadiusY + wallW - 3) * 2);

        // Road surface - fill outer ellipse, then cut out inner
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(T.centerX, T.centerY,
            (T.outerRadiusX + 3) * 2, (T.outerRadiusY + 3) * 2);
        gfx.fillStyle(TrackConfig.roadColor);
        gfx.fillEllipse(T.centerX, T.centerY,
            T.outerRadiusX * 2, T.outerRadiusY * 2);

        // Road texture - scattered darker patches
        for (let i = 0; i < 150; i++) {
            const a = Math.random() * Math.PI * 2;
            const midRX = (T.outerRadiusX + T.innerRadiusX) / 2;
            const midRY = (T.outerRadiusY + T.innerRadiusY) / 2;
            const spread = (T.outerRadiusX - T.innerRadiusX) / 2 * 0.8;
            gfx.fillStyle(TrackConfig.roadTextureColor, 0.25);
            gfx.fillRect(
                T.centerX + Math.cos(a) * (midRX + (Math.random() - 0.5) * spread * 2) - 4,
                T.centerY + Math.sin(a) * (midRY + (Math.random() - 0.5) * spread * 2) - 3,
                8 + Math.random() * 6,
                6 + Math.random() * 4
            );
        }

        // Inner wall outline
        gfx.lineStyle(wallW + 6, 0x000000);
        gfx.strokeEllipse(T.centerX, T.centerY,
            (T.innerRadiusX - wallW / 2) * 2, (T.innerRadiusY - wallW / 2) * 2);
        // Inner wall fill
        gfx.lineStyle(wallW, TrackConfig.wallColor);
        gfx.strokeEllipse(T.centerX, T.centerY,
            (T.innerRadiusX - wallW / 2) * 2, (T.innerRadiusY - wallW / 2) * 2);

        // Infield (grass inside the inner wall)
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(T.centerX, T.centerY,
            (T.innerRadiusX - wallW + 3) * 2, (T.innerRadiusY - wallW + 3) * 2);
        gfx.fillStyle(TrackConfig.grassColor);
        gfx.fillEllipse(T.centerX, T.centerY,
            (T.innerRadiusX - wallW) * 2, (T.innerRadiusY - wallW) * 2);

        // Center dashed line (yellow)
        const midRX = (T.outerRadiusX + T.innerRadiusX) / 2;
        const midRY = (T.outerRadiusY + T.innerRadiusY) / 2;
        const dashes = 40;
        for (let i = 0; i < dashes; i++) {
            if (i % 2 === 0) {
                const a1 = (i / dashes) * Math.PI * 2;
                const a2 = ((i + 0.25) / dashes) * Math.PI * 2;
                // Outline
                gfx.lineStyle(5, 0x000000);
                gfx.lineBetween(
                    T.centerX + Math.cos(a1) * midRX, T.centerY + Math.sin(a1) * midRY,
                    T.centerX + Math.cos(a2) * midRX, T.centerY + Math.sin(a2) * midRY);
                // Yellow line
                gfx.lineStyle(3, TrackConfig.centerLineColor, 0.7);
                gfx.lineBetween(
                    T.centerX + Math.cos(a1) * midRX, T.centerY + Math.sin(a1) * midRY,
                    T.centerX + Math.cos(a2) * midRX, T.centerY + Math.sin(a2) * midRY);
            }
        }

        // Start/finish checkerboard at top of oval
        const sfX = T.centerX;
        const sfY1 = T.centerY - T.outerRadiusY;
        const sfY2 = T.centerY - T.innerRadiusY;
        const rows = 3;
        const cols = 8;
        const cellW = 16;
        const cellH = (sfY2 - sfY1) / cols;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                gfx.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x000000);
                gfx.fillRect(
                    sfX - (rows * cellW) / 2 + r * cellW,
                    sfY1 + c * cellH,
                    cellW, cellH
                );
            }
        }
    }
}
