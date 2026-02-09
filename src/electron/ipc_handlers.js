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

        await kernel.boot();
        IPCHandlers.kernel = kernel;

        // Register Event Listeners
        ipcMain.handle('RUN_DAILY_PULSE', IPCHandlers.handleDailyPulse);
        ipcMain.handle('GET_WEEKLY_REVIEW', IPCHandlers.handleWeeklyReview);
        ipcMain.handle('GET_PREFERENCES', IPCHandlers.handleGetPreferences);
    },

    handleDailyPulse: async () => {
        const kernel = IPCHandlers.kernel;

        // 1. Audit Calendar (Real GCal)
        const issues = await kernel.calendar.auditEvents(kernel);

        // 2. Process Inbox (Real Gmail)
        const emails = await kernel.inbox.fetchLikelyInbox(kernel);

        const processedEmails = emails.map(email => ({
            ...email,
            label: kernel.inbox.suggestLabel(email),
            draft: kernel.inbox.suggestLabel(email) === '@To Respond' && email.subject.includes('Investment')
                ? kernel.inbox.getDraftResponse('invest')
                : null
        }));

        return {
            issues,
            emails: processedEmails,
            summary: `Processed ${emails.length} emails and found ${issues.length} calendar issues.`
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
        return IPCHandlers.kernel.preferences.preferences;
    }
};

module.exports = IPCHandlers;
