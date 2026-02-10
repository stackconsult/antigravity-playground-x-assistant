/**
 * @fileoverview Daily Pulse Workflow
 * Executes the AM and PM routines defined in the SOP.
 */

const AntigravityKernel = require('../index');
const CoreLogic = require('../plugins/core_logic');
const CalendarManager = require('../plugins/calendar_manager');
const InboxProcessor = require('../plugins/inbox_processor');

async function main() {
  // 1. Boot System
  const kernel = new AntigravityKernel();
  kernel.use(CoreLogic);
  kernel.use(CalendarManager);
  kernel.use(InboxProcessor);

  await kernel.boot();

  console.log('\n=== EXEC ADMIN SOP: DAILY PULSE ===');

  // 2. Calendar Audit (AM Routine)
  console.log('\n[AM] Auditing Calendar...');
  const todayEvents = [
    { id: 1, title: 'Client Call', location: 'zoom.us/j/123' },
    { id: 2, title: 'Deep Work', description: 'Focus time' },
    { id: 3, title: 'Team Sync', location: '' }, // Issue: Missing Zoom
  ];

  const calendarIssues = kernel.calendar.auditEvents(todayEvents);
  if (calendarIssues.length > 0) {
    console.log('⚠️  Calendar Issues Found:');
    calendarIssues.forEach((i) =>
      console.log(`   - [${i.severity}] ${i.title}: ${i.issue}`),
    );
  } else {
    console.log('✅ Calendar is clean.');
  }

  // 3. Inbox Zero (Round 1)
  console.log('\n[AM] Processing Inbox...');
  const emails = [
    {
      subject: 'Invoice #1023',
      body: 'Please pay attached.',
      from: 'vendor@acme.com',
    },
    {
      subject: 'Quick Question',
      body: 'Can we meet?',
      from: 'employee@company.com',
    },
    {
      subject: 'Investment Opportunity',
      body: 'New startup...',
      from: 'founder@startup.com',
    },
  ];

  emails.forEach((email) => {
    const label = kernel.inbox.suggestLabel(email);
    console.log(`   - "${email.subject}" -> Label: ${label}`);

    if (label === '@To Respond' && email.subject.includes('Investment')) {
      const draft = kernel.inbox.getDraftResponse('invest');
      console.log(`     Draft: "${draft}"`);
    }
  });

  // 4. Daily Sync Brief
  console.log('\n[SYNC] Generating Daily Brief...');
  const brief = `
  1. Action Items: ${calendarIssues.length} calendar issues to resolve.
  2. Inbox: ${emails.length} new items processed.
  3. Projects: [Update from Project Tracker]
  `;
  console.log(brief);
}

main().catch(console.error);
