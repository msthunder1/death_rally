import { TrackStore } from '../editor/TrackStore.js';
import { t } from '../i18n/i18n.js';

export class TrackSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TrackSelectScene' });
    }

    create() {
        this.createUI();
    }

    createUI() {
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'track-select-ui';
        this.uiContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 360px;
            background: rgba(0,0,0,0.85);
            color: #ccc;
            font-family: monospace;
            font-size: 13px;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #444;
            z-index: 100;
            user-select: none;
        `;

        const tracks = TrackStore.getAllTracks();

        let listHTML = '';
        for (const trk of tracks) {
            const tag = trk.builtIn
                ? `<span style="font-size:9px;color:#888;background:#222;padding:1px 4px;border-radius:2px;margin-left:6px;">${t('menu.builtIn')}</span>`
                : `<span style="font-size:9px;color:#6a6;background:#1a2a1a;padding:1px 4px;border-radius:2px;margin-left:6px;">${t('menu.user')}</span>`;
            listHTML += `
                <div class="ts-track" data-id="${trk.id}" style="
                    padding: 10px 12px; margin: 4px 0; cursor: pointer;
                    border-radius: 4px; border: 1px solid #333;
                    display: flex; align-items: center; justify-content: space-between;
                ">
                    <span>${trk.name}</span>${tag}
                </div>
            `;
        }

        if (tracks.length === 0) {
            listHTML = `<div style="color:#666; padding:10px; text-align:center;">${t('menu.noTracks')}</div>`;
        }

        this.uiContainer.innerHTML = `
            <div style="font-size:20px; color:#fff; margin-bottom:16px; font-weight:bold; text-align:center;">${t('menu.selectTrack')}</div>
            <div id="ts-list" style="max-height:400px; overflow-y:auto;">${listHTML}</div>
            <div style="color:#555; font-size:10px; margin-top:12px; text-align:center;">
                ${t('menu.instructions')}
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .ts-track:hover { background: #2a2a3a; border-color: #8844ff !important; }
        `;
        document.head.appendChild(style);
        this.uiStyle = style;

        document.body.appendChild(this.uiContainer);

        // Wire up click events
        const items = this.uiContainer.querySelectorAll('.ts-track');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const track = tracks.find(trk => trk.id === id);
                if (track) {
                    this.destroyUI();
                    this.scene.start('GameScene', { trackDef: track.trackDef });
                }
            });
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
