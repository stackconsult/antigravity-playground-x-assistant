const fs = require('fs');
const path = require('path');

const PREF_PATH = path.join(
  __dirname,
  '../../../.antigravity/preferences.json',
);

class PreferencesManager {
  constructor() {
    this.name = 'PreferencesManager';
    this.data = {
      userName: 'User',
      userManual: 'I prefer short, concise emails. Be direct.',
      llmProvider: 'openai', // or 'gemini'
      apiKey: '',
      googleClientId: '',
      googleClientSecret: '',
    };
  }

  async init(kernel) {
    console.log('[SYSTEM_CONFIG] Initializing...');
    this.kernel = kernel;
    kernel.config = this;
    this.load();
  }

  load() {
    try {
      // Load from file if exists
      if (fs.existsSync(PREF_PATH)) {
        this.data = {
          ...this.data,
          ...JSON.parse(fs.readFileSync(PREF_PATH, 'utf8')),
        };
      }

      // Override with Environment Variables (Priority for Secrets)
      if (process.env.OPENAI_API_KEY)
        this.data.apiKey = process.env.OPENAI_API_KEY; // Legacy key
      if (process.env.ANTHROPIC_API_KEY)
        this.data.anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (process.env.GEMINI_API_KEY)
        this.data.geminiKey = process.env.GEMINI_API_KEY;

      // Map legacy provider setting or default
      if (!this.data.llmProvider) this.data.llmProvider = 'openai';

      console.log(
        `[SYSTEM_CONFIG] Loaded settings. Provider: ${this.data.llmProvider}`,
      );
    } catch (e) {
      console.error('[SYSTEM_CONFIG] Load failed:', e);
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
