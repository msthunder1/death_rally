export class CenterLine {
    static COLORS = {
        yellow: 0xffcc22,
        beige: 0xd4c89a
    };

    constructor(config = {}) {
        this.dashLength = config.dashLength || 2;
        this.gapLength = config.gapLength || 3;
        this.width = config.width || 2;
        this.color = CenterLine.COLORS[config.color] || CenterLine.COLORS.yellow;
        this.alpha = config.alpha || 0.7;
    }

    draw(gfx, splinePoints) {
        const cycle = this.dashLength + this.gapLength;

        gfx.lineStyle(this.width, this.color, this.alpha);

        for (let i = 0; i < splinePoints.length; i += cycle) {
            gfx.beginPath();
            gfx.moveTo(splinePoints[i].x, splinePoints[i].y);

            for (let j = 1; j < this.dashLength && i + j < splinePoints.length; j++) {
                gfx.lineTo(splinePoints[i + j].x, splinePoints[i + j].y);
            }
            gfx.strokePath();
        }
    }

    static fromDef(def = {}) {
        return new CenterLine(def);
    }
}
