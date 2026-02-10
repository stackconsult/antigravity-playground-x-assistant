/**
 * @fileoverview IPC Handlers
 * Bridges UI events to Antigravity Kernel functions.
 */

const { ipcMain } = require('electron');
const AntigravityKernel = require('../index');
const CoreLogic = require('../plugins/core_logic');
const CalendarManager = require('../plugins/calendar_manager');
const InboxProcessor = require('../plugins/inbox_processor');
const TripPlanner = require('../plugins/trip_planner');
const AuthManager = require('../plugins/auth_manager');
const OutboundSequencer = require('../plugins/outbound_sequencer');

const IPCHandlers = {
    kernel: null,

    init: async (window) => {
        console.log('[ELECTRON] Initializing Kernel for IPC...');

        // Boot the Kernel inside the Main Process
        const kernel = new AntigravityKernel();
        kernel.use(CoreLogic);
        kernel.use(CalendarManager);
        kernel.use(InboxProcessor);
        kernel.use(TripPlanner);
        kernel.use(AuthManager);
        kernel.use(OutboundSequencer);

        await kernel.boot();
        IPCHandlers.kernel = kernel;

        // Register Event Listeners
        ipcMain.handle('RUN_DAILY_PULSE', IPCHandlers.handleDailyPulse);
        ipcMain.handle('GET_WEEKLY_REVIEW', IPCHandlers.handleWeeklyReview);
        ipcMain.handle('GET_PREFERENCES', IPCHandlers.handleGetPreferences);
        // Auth
        ipcMain.handle('CONNECT_GOOGLE', IPCHandlers.handleConnectGoogle);

        ipcMain.handle('SAVE_CREDENTIALS', async (event, creds) => {
            return await IPCHandlers.kernel.auth.saveCredentials(creds);
        });

        ipcMain.handle('SAVE_PREFERENCES', async (event, prefs) => {
            if (IPCHandlers.kernel.preferences) {
                return IPCHandlers.kernel.preferences.save(prefs);
            }
            return false;
        });

        ipcMain.handle('CHECK_AUTH_STATUS', async () => {
            return await IPCHandlers.kernel.auth.checkStatus();
        });

        // Check initial auth status
        if (kernel.auth) {
            await kernel.auth.init(kernel);
        }
    },

    handleConnectGoogle: async () => {
        try {
            return await IPCHandlers.kernel.auth.authenticate();
        } catch (e) {
            console.error('[IPC] Auth Error:', e);
            return false;
        }
    },

    handleDailyPulse: async () => {
        const kernel = IPCHandlers.kernel;

        // 1. Audit Calendar (Real GCal)
        let issues = [];
        if (kernel.calendar && kernel.calendar.auditEvents) {
            issues = await kernel.calendar.auditEvents(kernel);
        }

        // 2. Process Inbox (Real Gmail + AI Sorter)
        const emails = await kernel.inbox.fetchLikelyInbox();

        // 3. Process Outbound Queue (Sequencer)
        if (kernel.sequencer && kernel.sequencer.processQueue) {
            await kernel.sequencer.processQueue();
        }

        // Map to UI format
        const processedEmails = await Promise.all(emails.map(async email => {
            // Generate Draft if Critical
            let draft = null;
            if (email.priority.category === 'CRITICAL') {
                try {
                    // Call Intelligence Manager (Real LLM)
                    if (kernel.intelligence) {
                        draft = await kernel.intelligence.generateDraft(
                            email.from || 'Unknown',
                            email.subject,
                            email.snippet || '' // Body would be better but snippet is what we have in this view
                        );
                    } else {
                        draft = "Error: Intelligence Module not loaded.";
                    }
                } catch (e) {
                    console.error('Draft Gen Error', e);
                    draft = "Error generating draft.";
                }
            }

            return {
                id: email.id,
                subject: email.subject,
                label: email.priority.category === 'CRITICAL' ? '@Urgent' :
                    (email.priority.category === 'LOW' ? '@Low Priority' : '@Inbox'),
                score: email.priority.score,
                draft: draft
            };
        }));

        return {
            issues,
            emails: processedEmails,
            summary: `Processed ${emails.length} emails. ${processedEmails.filter(e => e.label === '@Urgent').length} Critical items found.`
        };
    },

    handleWeeklyReview: async () => {
        // Simplified Mock for UI Demo
        return {
            upcomingTrips: [
                { title: 'Flight to NYC', date: '2026-03-15', status: 'Drafting Trip File' }
            ]
        };
    },

    handleGetPreferences: async () => {
        if (IPCHandlers.kernel.preferences) {
            return IPCHandlers.kernel.preferences.data;
        }
        return {};
    }
};

module.exports = IPCHandlers;
