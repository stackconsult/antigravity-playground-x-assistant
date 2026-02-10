const { google } = require('googleapis');
const Sorter = require('../core_logic/sorter'); // Import purely for type/logic if needed, but we'll access via kernel usually or direct import

class InboxManager {
    constructor() {
        this.name = 'InboxManager';
        this.kernel = null;
    }

    async init(kernel) {
        console.log('[INBOX] Initializing Inbox Manager...');
        this.kernel = kernel;
        this.kernel.inbox = this;
    }

    /**
     * Main Cycle: Fetch -> Sort -> Act
     */
    async processInbox() {
        console.log('[INBOX] Starting routine processing...');

        // 1. Get Auth Client
        if (!this.kernel.auth) throw new Error('AuthManager not loaded');
        const authClient = this.kernel.auth.getClient();

        if (!authClient) {
            console.warn('[INBOX] Processor skipped: Not authenticated.');
            return { status: 'skipped', reason: 'no_auth' };
        }

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        try {
            // 2. Fetch Unread Messages (Limit 10 for safety in dev)
            const res = await gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread label:INBOX',
                maxResults: 10
            });

            const messages = res.data.messages || [];
            console.log(`[INBOX] Found ${messages.length} unread messages.`);

            const processed = [];

            // 3. Process Each
            for (const msg of messages) {
                const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id });

                const headers = fullMsg.data.payload.headers;
                const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
                const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
                const snippet = fullMsg.data.snippet;

                // 4. Sort & Prioritize
                const priority = Sorter.calculatePriorityScore({ from, subject, snippet });

                // 5. Determine Action
                let action = 'Inbox'; // Default
                if (priority.category === 'CRITICAL') {
                    action = 'Flag as Critical';
                    // Real implementation: Apply Label 'CRITICAL'
                    // await this.applyLabel(gmail, msg.id, 'CRITICAL');
                } else if (priority.category === 'LOW') {
                    action = 'Auto-Archive';
                    // Real implementation: Remove Label 'INBOX'
                }

                processed.push({
                    id: msg.id,
                    from,
                    subject,
                    priority,
                    action
                });
            }

            return { status: 'success', processedCount: processed.length, data: processed };

        } catch (error) {
            console.error('[INBOX] Processing failed:', error);
            return { status: 'error', error: error.message };
        }
    }

    // Helper: Labels would go here
    // async applyLabel(gmail, msgId, labelName) { ... }
}

module.exports = new InboxManager();
