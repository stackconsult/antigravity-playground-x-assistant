/**
 * ANTIGRAVITY GROUND ZERO
 * Version: 2.3
 * Status: PRODUCTION MASTER
 */

require('dotenv').config(); // Load env vars immediately

const AuthManager = require('./plugins/auth_manager');
const OutboundSequencer = require('./plugins/outbound_sequencer');
const PreferencesManager = require('./plugins/preferences'); // System Config
const CoreLogicPlugin = require('./plugins/core_logic'); // User Manual & Rules
const IntelligenceManager = require('./plugins/intelligence');

const fs = require('fs');
const path = require('path');

class AntigravityKernel {
  constructor(config = {}) {
    this.config = config;
    this.plugins = [];
    this.isBooted = false;

    // Order matters: System Config first
    this.use(PreferencesManager);
    this.use(CoreLogicPlugin);
    this.use(AuthManager);
    this.use(OutboundSequencer);
    this.use(IntelligenceManager);
  }

  /**
   * Register a capability or skill.
   * @param {Object} plugin
   */
  use(plugin) {
    console.log(`[KERNEL] Registering plugin: ${plugin.name || 'Anonymous'}`);
    this.plugins.push(plugin);
  }

  /**
   * Initialize the core engine.
   */
  async boot() {
    console.log('[KERNEL] Initiating boot sequence...');

    // Simulate deterministic hardware check
    const manualPath = path.join(
      __dirname,
      '../.antigravity/TRAINING_MANUAL.md',
    );
    if (!fs.existsSync(manualPath)) {
      throw new Error('[KERNEL] CRITICAL_FAILURE: OS manual missing.');
    }

    for (const plugin of this.plugins) {
      if (plugin.init) await plugin.init(this);
    }

    this.isBooted = true;
    console.log('[KERNEL] System Online.');
  }
}

// Export for integration
module.exports = AntigravityKernel;

// Self-execute if run directly
if (require.main === module) {
  const kernel = new AntigravityKernel();
  kernel.boot().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
