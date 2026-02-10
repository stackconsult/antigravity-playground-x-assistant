const GoogleStrategy = require('./google');

const AuthManager = {
    name: 'AuthManager',
    strategy: new GoogleStrategy(),

    /**
     * Initialize the plugin.
     * @param {AntigravityKernel} kernel 
     */
    init: async (kernel) => {
        console.log('[AUTH] Initializing Auth Manager...');

        // Attach to Kernel
        kernel.auth = AuthManager;

        // Load saved state
        await AuthManager.strategy.init();
    },

    /**
     * Authenticate using provided credentials.
     * @param {Object} creds { clientId, clientSecret }
     */
    authenticate: async (creds = {}) => {
        // Use provided creds OR fallback to stored/env (not implemented yet)
        // For now, assume creds are passed or handled inside strategy
        const { clientId, clientSecret } = creds;

        // If we need to load from settings file (if not passed)
        // We can access kernel.preferences if integrated

        // Trigger generic Google Auth
        try {
            await AuthManager.strategy.authenticate(clientId, clientSecret);
            return { success: true, status: 'Connected' };
        } catch (error) {
            console.error('[AUTH] Authentication failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Check current status
     */
    checkStatus: async () => {
        const client = AuthManager.strategy.getClient();
        // Simple check: do we have an OAuth client and credentials?
        // Real check would be validating the token
        if (client && client.credentials && client.credentials.access_token) {
            return { status: 'Connected' };
        }
        return { status: 'Disconnected' };
    },

    /**
     * Save credentials (used by the "Save & Connect" button)
     */
    saveCredentials: async (creds) => {
        // This receives ClientID/Secret from UI.
        // We pass them to authenticate() immediately in the current flow.
        // Ideally we save them to a config file first so they persist.
        return await AuthManager.authenticate(creds);
    },

    getClient: () => {
        return AuthManager.strategy.getClient();
    }
};

module.exports = AuthManager;
