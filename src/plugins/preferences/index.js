const fs = require('fs');
const path = require('path');

const PREF_PATH = path.join(__dirname, '../../../.antigravity/preferences.json');

class PreferencesManager {
    constructor() {
        this.name = 'PreferencesManager';
        this.data = {
            userName: 'User',
            userManual: 'I prefer short, concise emails. Be direct.',
            llmProvider: 'openai', // or 'gemini'
            apiKey: '',
            googleClientId: '',
            googleClientSecret: ''
        };
    }

    async init(kernel) {
        console.log('[PREFERENCES] Initializing...');
        this.kernel = kernel;
        kernel.preferences = this;
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(PREF_PATH)) {
                this.data = { ...this.data, ...JSON.parse(fs.readFileSync(PREF_PATH, 'utf8')) };
                console.log('[PREFERENCES] Loaded settings.');
            } else {
                this.save(); // Write default
            }
        } catch (e) {
            console.error('[PREFERENCES] Load failed:', e);
        }
    }

    save(newData = {}) {
        try {
            this.data = { ...this.data, ...newData };
            const dir = path.dirname(PREF_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(PREF_PATH, JSON.stringify(this.data, null, 2));
            console.log('[PREFERENCES] Saved settings.');
            return true;
        } catch (e) {
            console.error('[PREFERENCES] Save failed:', e);
            return false;
        }
    }

    get(key) {
        return this.data[key];
    }
}

module.exports = new PreferencesManager();
