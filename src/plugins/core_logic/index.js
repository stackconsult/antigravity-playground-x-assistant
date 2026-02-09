/**
 * @fileoverview The Core Logic Plugin for the CEO Assistant System.
 * initializes the Rules Engine and Preference Manager.
 */

const RULES = require('./rules');
const PreferenceManager = require('./preferences');

const CoreLogicPlugin = {
    name: 'CEO_Assistant_Core_Logic',

    init: async (kernel) => {
        console.log('[PLUGIN] Initializing Core Logic...');

        // Attach capabilities to the kernel
        kernel.rules = RULES;
        kernel.preferences = new PreferenceManager();

        console.log('[PLUGIN] Core Logic Ready.');
        console.log('[PLUGIN] North Star Principles Loaded:');
        Object.values(RULES).forEach(rule => {
            console.log(`  - ${rule.id}: ${rule.description}`);
        });
    }
};

module.exports = CoreLogicPlugin;
