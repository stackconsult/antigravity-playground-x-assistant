/**
 * @fileoverview Manages the "Preferences Database" (CEO User Manual).
 * Allows storing a preference once and retrieving it forever.
 */

const fs = require('fs');
const path = require('path');

class PreferenceManager {
  constructor(storagePath) {
    this.storagePath =
      storagePath || path.join(__dirname, '../../../docs/CEO_USER_MANUAL.json');
    this.preferences = {};
    this.load();
  }

  load() {
    if (fs.existsSync(this.storagePath)) {
      try {
        this.preferences = JSON.parse(
          fs.readFileSync(this.storagePath, 'utf8'),
        );
      } catch (err) {
        console.error('[PREFERENCES] Failed to load preferences:', err);
        this.preferences = {};
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(this.preferences, null, 2),
      );
    } catch (err) {
      console.error('[PREFERENCES] Failed to save preferences:', err);
    }
  }

  /**
   * Get a preference by key.
   * @param {string} key - e.g., "airline.seat"
   * @returns {any}
   */
  get(key) {
    return this.preferences[key];
  }

  /**
   * Set a preference.
   * @param {string} key - e.g., "airline.seat"
   * @param {any} value - e.g., "Aisle"
   */
  set(key, value) {
    this.preferences[key] = value;
    this.save();
    console.log(`[PREFERENCES] Recorded: ${key} = ${value}`);
  }

  /**
   * Search for preferences matching a query (simple keyword match).
   */
  search(query) {
    const results = {};
    for (const [key, value] of Object.entries(this.preferences)) {
      if (key.includes(query) || JSON.stringify(value).includes(query)) {
        results[key] = value;
      }
    }
    return results;
  }
}

module.exports = PreferenceManager;
