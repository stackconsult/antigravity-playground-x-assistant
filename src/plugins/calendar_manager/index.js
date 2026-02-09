/**
 * @fileoverview Calendar Manager Plugin (Real Integration)
 * Fetches events via Google Calendar API and applies color coding.
 */

const { google } = require('googleapis');

const CalendarManager = {
    name: 'Calendar_Manager',

    init: async (kernel) => {
        console.log('[PLUGIN] Initializing Calendar Manager (GCal API)...');
        kernel.calendar = CalendarManager;
    },

    /**
     * Fetch events from the primary calendar.
     */
    fetchEvents: async (kernel) => {
        const auth = kernel.auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const now = new Date();
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59);

            const res = await calendar.events.list({
                calendarId: 'primary',
                timeMin: now.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            return res.data.items || [];
        } catch (e) {
            console.error('[CALENDAR] API Error:', e);
            return [];
        }
    },

    /**
     * Scan calendar for issues.
     */
    auditEvents: async (kernel) => {
        const events = await CalendarManager.fetchEvents(kernel);
        const issues = [];

        events.forEach(event => {
            // 1. Zoom Link Check
            const hasZoom = (event.location && event.location.includes('zoom.us')) ||
                (event.description && event.description.includes('zoom.us')) ||
                (event.hangoutLink); // Google Meet support

            if (!hasZoom && event.status !== 'cancelled') {
                issues.push({
                    eventId: event.id,
                    title: event.summary || '(No Title)',
                    issue: 'Missing Zoom/Meet Link',
                    severity: 'HIGH'
                });
            }

            // 2. Guest Confirmation
            if (event.attendees) {
                const pending = event.attendees.filter(a => a.responseStatus === 'needsAction');
                if (pending.length > 0) {
                    issues.push({
                        eventId: event.id,
                        title: event.summary,
                        issue: `${pending.length} guest(s) pending`,
                        severity: 'MEDIUM'
                    });
                }
            }
        });
        return issues;
    },

    /**
     * Apply color coding to an event.
     */
    applyColor: async (kernel, eventId, colorId) => {
        const auth = kernel.auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            await calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: {
                    colorId: colorId
                }
            });
            console.log(`[CALENDAR] Applied color ${colorId} to event ${eventId}`);
            return true;
        } catch (e) {
            console.error('[CALENDAR] Failed to apply color:', e);
            return false;
        }
    }
};

module.exports = CalendarManager;
