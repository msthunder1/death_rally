import { Track2 } from '../tracks/definitions/track2.js';

export class TrackStore {
    static STORAGE_KEY = 'deathRally_userTracks';

    static getBuiltInTracks() {
        return [
            { id: 'builtin_oval', name: 'Simple Oval', builtIn: true, trackDef: Track2 }
        ];
    }

    static getUserTracks() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static getAllTracks() {
        const builtIn = this.getBuiltInTracks();
        const user = this.getUserTracks().map(t => ({
            id: t.id,
            name: t.name,
            builtIn: false,
            trackDef: t.trackDef
        }));
        return [...builtIn, ...user];
    }

    static saveUserTrack(id, name, trackDef) {
        const tracks = this.getUserTracks();
        const now = Date.now();

        if (id) {
            // Update existing
            const idx = tracks.findIndex(t => t.id === id);
            if (idx >= 0) {
                tracks[idx].name = name;
                tracks[idx].modified = now;
                tracks[idx].trackDef = trackDef;
            } else {
                tracks.push({ id, name, created: now, modified: now, trackDef });
            }
        } else {
            // Create new
            id = 'user_' + now;
            tracks.push({ id, name, created: now, modified: now, trackDef });
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tracks));
        return id;
    }

    static deleteUserTrack(id) {
        const tracks = this.getUserTracks().filter(t => t.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tracks));
    }

    static exportJSON(trackDef) {
        return JSON.stringify(trackDef, null, 2);
    }

    static importJSON(jsonString) {
        const def = JSON.parse(jsonString);
        if (!def.path || !Array.isArray(def.path) || def.path.length < 4) {
            throw new Error('Invalid track: needs path array with at least 4 points');
        }
        return def;
    }

    static calcWorldSize(path, padding = 400) {
        let maxX = -Infinity, maxY = -Infinity;
        for (const p of path) {
            const w = Math.max(p.widthL || 60, p.widthR || 60);
            maxX = Math.max(maxX, p.x + w);
            maxY = Math.max(maxY, p.y + w);
        }
        return {
            worldWidth: Math.max(maxX + padding, 1280),
            worldHeight: Math.max(maxY + padding, 720)
        };
    }
}
