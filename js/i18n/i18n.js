import { menuEN } from './menu/en.js';
import { editorEN } from './editor/en.js';
import { gameEN } from './game/en.js';

const languages = {
    en: {
        menu: menuEN,
        editor: editorEN,
        game: gameEN
    }
};

let currentLang = 'en';

export function setLanguage(lang) {
    if (languages[lang]) {
        currentLang = lang;
    }
}

export function getLanguage() {
    return currentLang;
}

export function t(key, params = {}) {
    const parts = key.split('.');
    const section = parts[0];
    const name = parts.slice(1).join('.');

    const lang = languages[currentLang];
    const value = lang && lang[section] && lang[section][name];

    if (value === undefined) {
        return key;
    }

    if (typeof value === 'string' && Object.keys(params).length > 0) {
        return value.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
    }

    return value;
}

export function registerLanguage(lang, section, strings) {
    if (!languages[lang]) {
        languages[lang] = {};
    }
    languages[lang][section] = strings;
}
