const Manager = require('./manager');

const InboxPlugin = {
    name: 'Inbox_Processor',

    init: async (kernel) => {
        console.log('[PLUGIN] Initializing Inbox Processor...');
        await Manager.init(kernel);
        // Expose the plugin on the kernel
        kernel.inbox = InboxPlugin;
    },

    /**
     * Fetch and Prioritize Inbox (Called by IPC)
     */
    fetchLikelyInbox: async () => {
        // Delegate to Manager
        const result = await Manager.processInbox();

        if (result.status === 'success') {
            // Sort by Priority Score (Descending)
            const sorted = result.data.sort((a, b) => b.priority.score - a.priority.score);
            return sorted;
        } else if (result.status === 'skipped') {
            console.warn('[INBOX] Fetch skipped (Auth?). Returning empty.');
            return []; // Return empty for UI to handle gracefully
        } else {
            console.error('[INBOX] Fetch failed.');
            return [];
        }
    },

    // Expose direct access if needed
    manager: Manager
};

module.exports = InboxPlugin;
