/**
 * @fileoverview Inbox Processor Plugin (Real Integration)
 * Fetches emails via Gmail API and applies labels.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const InboxProcessor = {
    name: 'Inbox_Processor',

    init: async (kernel) => {
        console.log('[PLUGIN] Initializing Inbox Processor (Gmail API)...');
        kernel.inbox = InboxProcessor;

        // Load Templates
        const templatePath = path.join(__dirname, '../../../docs/templates/RESPONSE_TEMPLATES.md');
        try {
            if (fs.existsSync(templatePath)) {
                InboxProcessor.templates = fs.readFileSync(templatePath, 'utf8');
            }
        } catch (e) {
            console.warn('[INBOX] Could not load response templates.');
        }
    },

    /**
     * Fetch unread emails from Gmail.
     */
    fetchLikelyInbox: async (kernel) => {
        const auth = kernel.auth.getClient();
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            const res = await gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread label:INBOX',
                maxResults: 10
            });

            if (!res.data.messages) return [];

            const emails = [];
            for (const msg of res.data.messages) {
                const fullMsg = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full' // or 'metadata' for speed
                });

                const headers = fullMsg.data.payload.headers;
                const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
                const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
                const date = headers.find(h => h.name === 'Date')?.value || '';

                // Simple body extraction (can be complex with multipart)
                const snippet = fullMsg.data.snippet;

                emails.push({
                    id: msg.id,
                    subject,
                    from,
                    date,
                    body: snippet, // Using snippet for simplicity in UI
                    threadId: msg.threadId
                });
            }
            return emails;

        } catch (error) {
            console.error('[INBOX] API Error:', error);
            return []; // Return empty if auth fails or API error
        }
    },

    /**
     * Apply a label to a thread in Gmail.
     */
    applyLabel: async (kernel, threadId, labelName) => {
        const auth = kernel.auth.getClient();
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            // 1. Get Label ID (simplified: assuming standard or existing labels)
            // In production, we'd list labels and find the ID or create if missing.
            const labelId = labelName.replace('@', 'Label_'); // Mock mapping for now or fetch real ID

            await gmail.users.threads.modify({
                userId: 'me',
                id: threadId,
                requestBody: {
                    addLabelIds: [labelId],
                    removeLabelIds: ['INBOX', 'UNREAD']
                }
            });
            console.log(`[INBOX] Applied ${labelName} to thread ${threadId}`);
            return true;
        } catch (e) {
            console.error('[INBOX] Failed to apply label:', e);
            return false;
        }
    },

    suggestLabel: (email) => {
        // Logic remains same as mock
        const content = (email.subject + " " + email.body).toLowerCase();
        if (content.includes('invoice') || content.includes('billing')) return '@Financials';
        if (content.includes('?')) return '@To Review';
        if (email.from.includes('me')) return '@Waiting On';
        return '@To Respond';
    },

    getDraftResponse: (type) => {
        // Logic remains same as mock
        switch (type) {
            case 'invest': return "Thanks, but heads down working with clients... not looking at new deals.";
            default: return "Appreciate the response, but unable to commit right now.";
        }
    }
};

module.exports = InboxProcessor;
