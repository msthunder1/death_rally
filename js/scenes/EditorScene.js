import { SplineTrack } from '../tracks/SplineTrack.js';
import { Spline } from '../utils/Spline.js';
import { IntersectionDetector } from '../editor/IntersectionDetector.js';
import { TrackStore } from '../editor/TrackStore.js';
import { t } from '../i18n/i18n.js';

export class EditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EditorScene' });
    }

    init(data) {
        this.sceneData = data || {};
    }

    create() {
        this.mode = 'DRAW'; // DRAW, EDIT
        this.controlPoints = [];
        this.trackName = t('editor.untitled');
        this.trackTerrain = 'grass';
        this.currentTrackId = null; // null = new track, string = existing user track
        this.selectedPoint = -1;
        this.hoveredPoint = -1;
        this.dragStartPos = null;
        this.isDragging = false;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.camStart = { x: 0, y: 0 };

        // Graphics layers
        this.bgGraphics = this.add.graphics();    // background grid
        this.trackGraphics = null;                  // SplineTrack instance (EDIT mode)
        this.previewGraphics = this.add.graphics(); // line preview (DRAW mode)
        this.glowGraphics = this.add.graphics();    // drag glow overlay
        this.anchorGraphics = this.add.graphics();  // control point circles
        this.uiGraphics = this.add.graphics();      // close-loop indicator

        // Draw background grid
        this.drawGrid();

        // Camera setup - center viewport at a reasonable starting position
        this.cameras.main.setScroll(0, 0);

        // Input
        this.setupInput();

        // Create DOM UI
        this.createUI();

        // Restore state if returning from test mode or loading a track
        const data = this.sceneData;
        if (data && data.controlPoints) {
            this.controlPoints = data.controlPoints.map(p => ({ ...p }));
            this.trackName = data.trackName || t('editor.untitled');
            this.trackTerrain = data.trackTerrain || 'grass';
            this.currentTrackId = data.trackId || null;
            if (this.nameInput) {
                this.nameInput.value = this.trackName;
            }
            if (this.terrainSelect) {
                this.terrainSelect.value = this.trackTerrain;
            }
            if (this.controlPoints.length >= 4) {
                this.enterEditMode();
            } else {
                this.redrawPreview();
                this.redrawAnchors();
            }
        }

        this.updateStatus();
    }

    // ==================== GRID ====================

    drawGrid() {
        const gfx = this.bgGraphics;
        gfx.clear();

        // Large grid covering the workable area
        const size = 6000;
        const half = size / 2;
        const step = 100;

        gfx.lineStyle(1, 0x444444, 0.3);
        for (let x = -half; x <= half; x += step) {
            gfx.beginPath();
            gfx.moveTo(x, -half);
            gfx.lineTo(x, half);
            gfx.strokePath();
        }
        for (let y = -half; y <= half; y += step) {
            gfx.beginPath();
            gfx.moveTo(-half, y);
            gfx.lineTo(half, y);
            gfx.strokePath();
        }

        // Origin crosshair
        gfx.lineStyle(2, 0x666666, 0.5);
        gfx.beginPath();
        gfx.moveTo(-half, 0);
        gfx.lineTo(half, 0);
        gfx.strokePath();
        gfx.beginPath();
        gfx.moveTo(0, -half);
        gfx.lineTo(0, half);
        gfx.strokePath();
    }

    // ==================== INPUT ====================

    setupInput() {
        // Pointer down
        this.input.on('pointerdown', (pointer) => {
            // Middle mouse = pan
            if (pointer.middleButtonDown()) {
                this.isPanning = true;
                this.panStart.x = pointer.x;
                this.panStart.y = pointer.y;
                this.camStart.x = this.cameras.main.scrollX;
                this.camStart.y = this.cameras.main.scrollY;
                return;
            }

            const worldPos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            // Right click
            if (pointer.rightButtonDown()) {
                if (this.mode === 'DRAW') {
                    this.undoLastPoint();
                } else if (this.mode === 'EDIT') {
                    this.deletePointAt(worldPos.x, worldPos.y);
                }
                return;
            }

            // Left click
            if (pointer.leftButtonDown()) {
                if (this.mode === 'DRAW') {
                    this.handleDrawClick(worldPos.x, worldPos.y);
                } else if (this.mode === 'EDIT') {
                    // Double-click detection for inserting points
                    const now = this.time.now;
                    if (this._lastClickTime && now - this._lastClickTime < 300) {
                        this._lastClickTime = 0;
                        this.insertPointNear(worldPos.x, worldPos.y);
                        return;
                    }
                    this._lastClickTime = now;
                    this.handleEditPointerDown(worldPos.x, worldPos.y);
                }
            }
        });

        // Pointer move
        this.input.on('pointermove', (pointer) => {
            if (this.isPanning) {
                const dx = this.panStart.x - pointer.x;
                const dy = this.panStart.y - pointer.y;
                const zoom = this.cameras.main.zoom;
                this.cameras.main.setScroll(
                    this.camStart.x + dx / zoom,
                    this.camStart.y + dy / zoom
                );
                return;
            }

            const worldPos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            if (this.mode === 'EDIT') {
                if (this.isDragging && this.selectedPoint >= 0) {
                    this.handleEditDrag(worldPos.x, worldPos.y);
                } else {
                    this.updateHover(worldPos.x, worldPos.y);
                }
            } else if (this.mode === 'DRAW') {
                // Show closing indicator when near first point
                this.uiGraphics.clear();
                if (this.controlPoints.length >= 3) {
                    const first = this.controlPoints[0];
                    const dist = Math.hypot(worldPos.x - first.x, worldPos.y - first.y);
                    if (dist < 30) {
                        this.uiGraphics.lineStyle(2, 0x00ff00, 0.8);
                        this.uiGraphics.strokeCircle(first.x, first.y, 15);
                    }
                }
            }
        });

        // Pointer up
        this.input.on('pointerup', (pointer) => {
            if (this.isPanning) {
                this.isPanning = false;
                return;
            }

            if (this.mode === 'EDIT' && this.isDragging) {
                this.handleEditRelease();
            }
        });

        // Scroll wheel - zoom or width
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (this.mode === 'EDIT' && this.hoveredPoint >= 0 && !this.isDragging) {
                // Adjust width of hovered point
                const delta = deltaY > 0 ? -5 : 5;
                const p = this.controlPoints[this.hoveredPoint];
                p.widthL = Math.max(20, Math.min(200, p.widthL + delta));
                p.widthR = Math.max(20, Math.min(200, p.widthR + delta));
                this.rebuildTrack();
                return;
            }

            // Zoom camera
            const oldZoom = this.cameras.main.zoom;
            const newZoom = Phaser.Math.Clamp(
                oldZoom + (deltaY > 0 ? -0.1 : 0.1),
                0.25, 2.0
            );
            this.cameras.main.setZoom(newZoom);
        });

        // Keyboard
        this.input.keyboard.on('keydown-T', () => {
            if (this.mode === 'EDIT') {
                this.enterTestMode();
            }
        });

        this.input.keyboard.on('keydown-DELETE', () => {
            if (this.mode === 'EDIT' && this.hoveredPoint >= 0) {
                this.deletePoint(this.hoveredPoint);
            }
        });

        // Prevent right-click context menu
        this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // ==================== DRAW MODE ====================

    handleDrawClick(wx, wy) {
        // Check if closing the loop
        if (this.controlPoints.length >= 3) {
            const first = this.controlPoints[0];
            if (Math.hypot(wx - first.x, wy - first.y) < 30) {
                this.enterEditMode();
                return;
            }
        }

        // Add new control point
        this.controlPoints.push({ x: wx, y: wy, widthL: 90, widthR: 90 });
        this.redrawPreview();
        this.redrawAnchors();
        this.updateStatus();
    }

    undoLastPoint() {
        if (this.controlPoints.length > 0) {
            this.controlPoints.pop();
            this.redrawPreview();
            this.redrawAnchors();
            this.updateStatus();
        }
    }

    redrawPreview() {
        const gfx = this.previewGraphics;
        gfx.clear();

        if (this.controlPoints.length < 2) return;

        // Draw line segments between points
        gfx.lineStyle(3, 0x8844ff, 0.6);
        gfx.beginPath();
        gfx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
        for (let i = 1; i < this.controlPoints.length; i++) {
            gfx.lineTo(this.controlPoints[i].x, this.controlPoints[i].y);
        }
        gfx.strokePath();

        // Dotted closing line (from last to first)
        if (this.controlPoints.length >= 3) {
            const last = this.controlPoints[this.controlPoints.length - 1];
            const first = this.controlPoints[0];
            gfx.lineStyle(2, 0x8844ff, 0.3);
            gfx.beginPath();
            gfx.moveTo(last.x, last.y);
            gfx.lineTo(first.x, first.y);
            gfx.strokePath();
        }
    }

    // ==================== EDIT MODE ====================

    enterEditMode() {
        this.mode = 'EDIT';
        this.previewGraphics.clear();
        this.uiGraphics.clear();
        this.rebuildTrack();
        this.updateStatus();
    }

    rebuildTrack() {
        // Destroy old SplineTrack
        if (this.trackGraphics) {
            this.trackGraphics.graphics.destroy();
            // Destroy any object graphics
            if (this.trackGraphics.objects) {
                this.trackGraphics.objects.forEach(obj => {
                    if (obj.graphics) obj.graphics.destroy();
                });
            }
            this.trackGraphics = null;
        }

        if (this.controlPoints.length < 4) return;

        const def = this.buildTrackDef();
        this.trackGraphics = new SplineTrack(this, def);

        // Make sure anchors and glow draw on top
        this.anchorGraphics.setDepth(10);
        this.glowGraphics.setDepth(9);

        this.redrawAnchors();
    }

    buildTrackDef() {
        const size = TrackStore.calcWorldSize(this.controlPoints);
        return {
            name: this.trackName,
            theme: 'asphalt',
            terrain: this.trackTerrain,
            worldWidth: size.worldWidth,
            worldHeight: size.worldHeight,
            resolution: 10,
            closed: true,
            path: this.controlPoints.map(p => ({
                x: p.x, y: p.y, widthL: p.widthL, widthR: p.widthR
            })),
            markings: [
                { type: 'centerLine', dashLength: 2, gapLength: 3, width: 2, color: 'yellow' }
            ],
            objects: [],
            checkpoints: []
        };
    }

    handleEditPointerDown(wx, wy) {
        // Check if clicking on an anchor
        const idx = this.findPointAt(wx, wy);
        if (idx >= 0) {
            this.selectedPoint = idx;
            this.isDragging = true;
            this.dragStartPos = {
                x: this.controlPoints[idx].x,
                y: this.controlPoints[idx].y
            };
            return;
        }
    }

    handleEditDrag(wx, wy) {
        // Move the selected point
        this.controlPoints[this.selectedPoint].x = wx;
        this.controlPoints[this.selectedPoint].y = wy;

        // Draw low-res glow preview
        this.drawGlowPreview();
    }

    handleEditRelease() {
        if (this.selectedPoint < 0) return;

        // Check intersection
        const intersects = IntersectionDetector.check(this.controlPoints);
        if (intersects && this.dragStartPos) {
            // Snap back
            this.controlPoints[this.selectedPoint].x = this.dragStartPos.x;
            this.controlPoints[this.selectedPoint].y = this.dragStartPos.y;
        }

        this.isDragging = false;
        this.selectedPoint = -1;
        this.dragStartPos = null;
        this.glowGraphics.clear();

        this.rebuildTrack();
    }

    drawGlowPreview() {
        const gfx = this.glowGraphics;
        gfx.clear();

        if (this.controlPoints.length < 4) return;

        // Generate low-res spline for preview
        const spline = Spline.generate(this.controlPoints, 4, true);

        // Check intersection for color
        const intersects = IntersectionDetector.check(this.controlPoints);
        const color = intersects ? 0xff2222 : 0x8844ff;

        // Draw centerline glow
        gfx.lineStyle(8, color, 0.4);
        gfx.beginPath();
        gfx.moveTo(spline[0].x, spline[0].y);
        for (let i = 1; i < spline.length; i++) {
            gfx.lineTo(spline[i].x, spline[i].y);
        }
        gfx.lineTo(spline[0].x, spline[0].y);
        gfx.strokePath();

        // Draw edges glow
        gfx.lineStyle(3, color, 0.3);
        const edges = spline.map(p => Spline.getEdges(p));

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

        // Redraw anchors on top
        this.redrawAnchors();
    }

    updateHover(wx, wy) {
        const oldHovered = this.hoveredPoint;
        this.hoveredPoint = this.findPointAt(wx, wy);
        if (this.hoveredPoint !== oldHovered) {
            this.redrawAnchors();
        }
    }

    findPointAt(wx, wy, radius = 20) {
        const zoom = this.cameras.main.zoom;
        const hitRadius = radius / zoom; // Scale hit area with zoom
        for (let i = 0; i < this.controlPoints.length; i++) {
            const p = this.controlPoints[i];
            if (Math.hypot(wx - p.x, wy - p.y) < hitRadius) {
                return i;
            }
        }
        return -1;
    }

    deletePointAt(wx, wy) {
        const idx = this.findPointAt(wx, wy);
        if (idx >= 0) {
            this.deletePoint(idx);
        }
    }

    deletePoint(idx) {
        if (this.controlPoints.length <= 4) return; // Minimum 4 points
        this.controlPoints.splice(idx, 1);
        this.hoveredPoint = -1;
        this.rebuildTrack();
        this.updateStatus();
    }

    insertPointNear(wx, wy) {
        if (this.controlPoints.length < 3) return;

        // Find nearest segment
        let bestDist = Infinity;
        let bestIdx = 0;

        for (let i = 0; i < this.controlPoints.length; i++) {
            const next = (i + 1) % this.controlPoints.length;
            const p1 = this.controlPoints[i];
            const p2 = this.controlPoints[next];
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const dist = Math.hypot(wx - mx, wy - my);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = next;
            }
        }

        // Insert at midpoint
        const prev = (bestIdx - 1 + this.controlPoints.length) % this.controlPoints.length;
        const p1 = this.controlPoints[prev];
        const p2 = this.controlPoints[bestIdx];

        const newPoint = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
            widthL: (p1.widthL + p2.widthL) / 2,
            widthR: (p1.widthR + p2.widthR) / 2
        };

        this.controlPoints.splice(bestIdx, 0, newPoint);
        this.rebuildTrack();
        this.updateStatus();
    }

    // ==================== ANCHORS ====================

    redrawAnchors() {
        const gfx = this.anchorGraphics;
        gfx.clear();

        const zoom = this.cameras.main.zoom;
        const radius = 8 / zoom;
        const lineWidth = 2 / zoom;

        for (let i = 0; i < this.controlPoints.length; i++) {
            const p = this.controlPoints[i];

            if (i === this.selectedPoint) {
                // Dragging - blue
                gfx.fillStyle(0x4488ff, 1);
                gfx.lineStyle(lineWidth, 0x2266cc, 1);
            } else if (i === this.hoveredPoint) {
                // Hovered - yellow
                gfx.fillStyle(0xffff44, 1);
                gfx.lineStyle(lineWidth, 0xcccc00, 1);
            } else if (i === 0) {
                // First point - green
                gfx.fillStyle(0x44ff44, 1);
                gfx.lineStyle(lineWidth, 0x22cc22, 1);
            } else {
                // Normal - white
                gfx.fillStyle(0xffffff, 1);
                gfx.lineStyle(lineWidth, 0x888888, 1);
            }

            gfx.fillCircle(p.x, p.y, radius);
            gfx.strokeCircle(p.x, p.y, radius);

            // Point index label
            if (this.mode === 'EDIT') {
                // Show width handles as small dots at edge positions (if hovered)
                if (i === this.hoveredPoint && this.trackGraphics) {
                    const sp = this.trackGraphics.splinePoints;
                    // Find the spline point closest to this control point
                    const cpIdx = i * (this.trackGraphics.def.resolution || 10);
                    if (cpIdx < sp.length) {
                        const edge = Spline.getEdges(sp[cpIdx]);
                        const smallR = 5 / zoom;
                        gfx.fillStyle(0xff8844, 0.8);
                        gfx.fillCircle(edge.left.x, edge.left.y, smallR);
                        gfx.fillCircle(edge.right.x, edge.right.y, smallR);
                    }
                }
            }
        }
    }

    // ==================== TEST MODE ====================

    enterTestMode() {
        if (this.controlPoints.length < 4) return;

        const trackDef = this.buildTrackDef();
        this.destroyUI();
        this.scene.start('GameScene', {
            trackDef: trackDef,
            fromEditor: true,
            trackName: this.trackName,
            trackTerrain: this.trackTerrain,
            trackId: this.currentTrackId,
            controlPoints: this.controlPoints.map(p => ({ ...p }))
        });
    }

    // ==================== SAVE / LOAD ====================

    saveTrack() {
        if (this.controlPoints.length < 4) return;
        const def = this.buildTrackDef();
        this.currentTrackId = TrackStore.saveUserTrack(
            this.currentTrackId,
            this.trackName,
            def
        );
        this.refreshTrackList();
        this.flashStatus(t('editor.statusSaved'));
    }

    loadTrack(id) {
        const all = TrackStore.getAllTracks();
        const track = all.find(trk => trk.id === id);
        if (!track) return;

        this.controlPoints = track.trackDef.path.map(p => ({ ...p }));
        this.trackName = track.trackDef.name || track.name;
        this.trackTerrain = track.trackDef.terrain || 'grass';
        this.currentTrackId = track.builtIn ? null : track.id;

        if (this.nameInput) {
            this.nameInput.value = this.trackName;
        }
        if (this.terrainSelect) {
            this.terrainSelect.value = this.trackTerrain;
        }

        if (this.controlPoints.length >= 4) {
            this.mode = 'EDIT';
            this.previewGraphics.clear();
            this.uiGraphics.clear();
            this.rebuildTrack();
        }
        this.updateStatus();
    }

    newTrack() {
        this.controlPoints = [];
        this.trackName = t('editor.untitled');
        this.trackTerrain = 'grass';
        this.currentTrackId = null;
        this.mode = 'DRAW';
        this.hoveredPoint = -1;
        this.selectedPoint = -1;

        if (this.nameInput) {
            this.nameInput.value = t('editor.untitled');
        }
        if (this.terrainSelect) {
            this.terrainSelect.value = 'grass';
        }

        // Clear everything
        if (this.trackGraphics) {
            this.trackGraphics.graphics.destroy();
            if (this.trackGraphics.objects) {
                this.trackGraphics.objects.forEach(obj => {
                    if (obj.graphics) obj.graphics.destroy();
                });
            }
            this.trackGraphics = null;
        }
        this.previewGraphics.clear();
        this.glowGraphics.clear();
        this.anchorGraphics.clear();
        this.uiGraphics.clear();

        this.updateStatus();
    }

    exportToClipboard() {
        if (this.controlPoints.length < 4) return;
        const json = TrackStore.exportJSON(this.buildTrackDef());
        navigator.clipboard.writeText(json).then(() => {
            this.flashStatus(t('editor.statusCopied'));
        }).catch(() => {
            // Fallback: log to console
            console.log(json);
            this.flashStatus(t('editor.statusExportedConsole'));
        });
    }

    importFromClipboard() {
        const json = prompt(t('editor.promptPasteJson'));
        if (!json) return;
        try {
            const def = TrackStore.importJSON(json);
            this.controlPoints = def.path.map(p => ({ ...p }));
            this.trackName = def.name || t('editor.imported');
            this.currentTrackId = null;
            if (this.nameInput) {
                this.nameInput.value = this.trackName;
            }
            this.mode = 'EDIT';
            this.previewGraphics.clear();
            this.rebuildTrack();
            this.updateStatus();
        } catch (e) {
            alert(t('editor.alertInvalidJson', { error: e.message }));
        }
    }

    // ==================== DOM UI ====================

    createUI() {
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'editor-ui';
        this.uiContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 220px;
            background: rgba(0,0,0,0.75);
            color: #ccc;
            font-family: monospace;
            font-size: 13px;
            padding: 12px;
            border-radius: 6px;
            z-index: 100;
            user-select: none;
        `;

        this.uiContainer.innerHTML = `
            <div style="font-size:15px; color:#fff; margin-bottom:10px; font-weight:bold;">${t('editor.title')}</div>
            <div style="margin-bottom:8px;">
                <input id="ed-name" type="text" value="${t('editor.untitled')}"
                    style="width:100%; box-sizing:border-box; background:#222; color:#fff; border:1px solid #555; padding:4px 6px; font-family:monospace; font-size:12px;">
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                <label style="font-size:11px; color:#888;">${t('editor.terrainLabel')}</label>
                <select id="ed-terrain" style="flex:1; background:#222; color:#fff; border:1px solid #555; padding:3px 4px; font-family:monospace; font-size:11px; border-radius:3px;">
                    <option value="grass">${t('editor.terrainGrass')}</option>
                    <option value="sand">${t('editor.terrainSand')}</option>
                    <option value="snow">${t('editor.terrainSnow')}</option>
                    <option value="asphalt">${t('editor.terrainAsphalt')}</option>
                </select>
            </div>
            <div style="display:flex; gap:4px; margin-bottom:6px; flex-wrap:wrap;">
                <button class="ed-btn" id="ed-new">${t('editor.btnNew')}</button>
                <button class="ed-btn" id="ed-save">${t('editor.btnSave')}</button>
                <button class="ed-btn" id="ed-export">${t('editor.btnExport')}</button>
                <button class="ed-btn" id="ed-import">${t('editor.btnImport')}</button>
            </div>
            <div style="border-top:1px solid #444; margin:8px 0; padding-top:8px;">
                <div style="color:#888; font-size:11px; margin-bottom:4px;">${t('editor.tracksHeader')}</div>
                <div id="ed-tracklist" style="max-height:180px; overflow-y:auto;"></div>
            </div>
            <div style="border-top:1px solid #444; margin:8px 0; padding-top:8px;">
                <button class="ed-btn" id="ed-test" style="width:100%;">${t('editor.btnTestDrive')}</button>
            </div>
            <div id="ed-status" style="color:#888; font-size:11px; margin-top:6px;"></div>
            <div id="ed-help" style="color:#555; font-size:10px; margin-top:8px; line-height:1.4;">
                ${t('editor.helpClick')}<br>
                ${t('editor.helpRightClick')}<br>
                ${t('editor.helpMiddle')}<br>
                ${t('editor.helpScroll')}<br>
                ${t('editor.helpDblClick')}<br>
                ${t('editor.helpDelete')}
            </div>
        `;

        // Button styles
        const style = document.createElement('style');
        style.textContent = `
            .ed-btn {
                background: #333; color: #ccc; border: 1px solid #555;
                padding: 4px 10px; cursor: pointer; font-family: monospace;
                font-size: 11px; border-radius: 3px;
            }
            .ed-btn:hover { background: #444; color: #fff; }
            #ed-tracklist .track-item {
                display: flex; justify-content: space-between; align-items: center;
                padding: 3px 6px; margin: 2px 0; cursor: pointer; border-radius: 3px;
            }
            #ed-tracklist .track-item:hover { background: #333; }
            #ed-tracklist .track-item .track-tag {
                font-size: 9px; color: #888; background: #222;
                padding: 1px 4px; border-radius: 2px;
            }
            #ed-tracklist .track-item .del-btn {
                color: #844; cursor: pointer; font-size: 14px; padding: 0 4px;
            }
            #ed-tracklist .track-item .del-btn:hover { color: #f66; }
        `;
        document.head.appendChild(style);
        this.uiStyle = style;

        document.body.appendChild(this.uiContainer);

        // Wire up events
        this.nameInput = document.getElementById('ed-name');
        this.helpText = document.getElementById('ed-help');
        this.defaultHelp = this.helpText.innerHTML;

        this.nameInput.addEventListener('input', () => {
            this.trackName = this.nameInput.value;
        });
        this.nameInput.addEventListener('focus', () => {
            this.input.keyboard.enabled = false;
            this.nameInput.style.border = '1px solid #8844ff';
            this.nameInput.style.background = '#2a2040';
            this.helpText.innerHTML = t('editor.helpNameInput');
            this.helpText.style.color = '#8844ff';
        });
        this.nameInput.addEventListener('blur', () => {
            this.input.keyboard.enabled = true;
            this.nameInput.style.border = '1px solid #555';
            this.nameInput.style.background = '#222';
            this.helpText.innerHTML = this.defaultHelp;
            this.helpText.style.color = '#555';
        });
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.nameInput.blur();
            }
        });

        this.terrainSelect = document.getElementById('ed-terrain');
        this.terrainSelect.addEventListener('change', () => {
            this.trackTerrain = this.terrainSelect.value;
            if (this.mode === 'EDIT') {
                this.rebuildTrack();
            }
        });

        document.getElementById('ed-new').addEventListener('click', () => this.newTrack());
        document.getElementById('ed-save').addEventListener('click', () => this.saveTrack());
        document.getElementById('ed-export').addEventListener('click', () => this.exportToClipboard());
        document.getElementById('ed-import').addEventListener('click', () => this.importFromClipboard());
        document.getElementById('ed-test').addEventListener('click', () => this.enterTestMode());

        this.refreshTrackList();
    }

    refreshTrackList() {
        const list = document.getElementById('ed-tracklist');
        if (!list) return;

        const tracks = TrackStore.getAllTracks();
        list.innerHTML = '';

        for (const trk of tracks) {
            const item = document.createElement('div');
            item.className = 'track-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = trk.name;
            nameSpan.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
            item.appendChild(nameSpan);

            if (trk.builtIn) {
                const tag = document.createElement('span');
                tag.className = 'track-tag';
                tag.textContent = t('editor.builtIn');
                item.appendChild(tag);
            } else {
                const del = document.createElement('span');
                del.className = 'del-btn';
                del.textContent = '\u00d7';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    TrackStore.deleteUserTrack(trk.id);
                    this.refreshTrackList();
                });
                item.appendChild(del);
            }

            item.addEventListener('click', () => this.loadTrack(trk.id));
            list.appendChild(item);
        }
    }

    updateStatus() {
        const el = document.getElementById('ed-status');
        if (!el) return;
        el.textContent = t('editor.statusMode', { mode: this.mode, points: this.controlPoints.length });
    }

    flashStatus(msg) {
        const el = document.getElementById('ed-status');
        if (!el) return;
        const original = el.textContent;
        el.textContent = msg;
        el.style.color = '#4f4';
        this.time.delayedCall(2000, () => {
            el.textContent = original;
            el.style.color = '#888';
        });
    }

    destroyUI() {
        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }
        if (this.uiStyle && this.uiStyle.parentNode) {
            this.uiStyle.parentNode.removeChild(this.uiStyle);
        }
        this.uiContainer = null;
        this.uiStyle = null;
    }

    shutdown() {
        this.destroyUI();
    }
}
