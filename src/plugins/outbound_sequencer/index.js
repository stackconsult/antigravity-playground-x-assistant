const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const DB_PATH = path.join(__dirname, '../../../.antigravity/sequencer_db.json');

class OutboundSequencer {
  constructor() {
    this.name = 'Outbound_Sequencer';
    this.activeCampaigns = [];
    this.kernel = null;
  }

  async init(kernel) {
    console.log('[SEQUENCER] Initializing Outbound Sequencer...');
    this.kernel = kernel;
    kernel.sequencer = this;

    // Load Persisted State
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        this.activeCampaigns = JSON.parse(data);
        console.log(
          `[SEQUENCER] Loaded ${this.activeCampaigns.length} active targets.`,
        );
      }
    } catch (e) {
      console.warn(
        '[SEQUENCER] No state found or load failed. Starting fresh.',
      );
      this.activeCampaigns = [];
    }
  }

  saveState() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(this.activeCampaigns, null, 2));
    } catch (e) {
      console.error('[SEQUENCER] Failed to save state:', e);
    }
  }

  /**
   * Add a target to a drip campaign.
   * @param {string} email
   * @param {string} name
   * @param {string} campaignType 'investor_outreach' | 'sales_cold'
   */
  addToCampaign(email, name, campaignType) {
    // Prevent duplicates
    if (
      this.activeCampaigns.find(
        (c) => c.email === email && c.status === 'ACTIVE',
      )
    ) {
      console.warn(`[SEQUENCER] ${email} is already active.`);
      return;
    }

    const newTarget = {
      id: Date.now().toString(),
      email,
      name,
      campaignType,
      status: 'ACTIVE',
      step: 0,
      lastActionDate: null,
      nextActionDate: new Date().toISOString(), // Due immediately (Intro)
    };

    this.activeCampaigns.push(newTarget);
    this.saveState();
    console.log(`[SEQUENCER] Added ${email} to ${campaignType}`);
  }

  /**
   * Check for due actions (Run daily).
   */
  async processQueue() {
    console.log('[SEQUENCER] Processing queue...');
    const now = new Date();
    const auth = this.kernel.auth.getClient();

    if (!auth) {
      console.warn('[SEQUENCER] Skipped: Not authenticated.');
      return;
    }

    for (const target of this.activeCampaigns) {
      if (target.status !== 'ACTIVE') continue;

      const dueDate = new Date(target.nextActionDate);
      if (now >= dueDate) {
        await this.executeStep(target, auth);
      }
    }

    this.saveState();
  }

  async executeStep(target, auth) {
    console.log(
      `[SEQUENCER] Executing Step ${target.step} for ${target.email}`,
    );

    // 1. Check for Reply (Stop Condition)
    const hasReplied = await this.checkForReply(target.email, auth);
    if (hasReplied) {
      target.status = 'REPLIED';
      console.log(
        `[SEQUENCER] Target ${target.email} replied! Stopping sequence.`,
      );
      return;
    }

    // 2. Draft/Send Email
    // For MVP, we DRAFT only (HITL)
    let subject = '';
    let body = '';

    if (this.kernel.intelligence) {
      console.log(
        `[SEQUENCER] Generating AI Draft for ${target.email} (${target.campaignType})...`,
      );

      const userManual = this.kernel.preferences.get('userManual') || '';
      const contextPrompt = `
You are drafting an outbound email for a campaign.
Campaign Type: ${target.campaignType}
Target Name: ${target.name}
Step: ${target.step + 1}
User Manual: ${userManual}

Goal for 'investor_outreach': Schedule a 15 min intro call to discuss Antigravity (AI Assistant).
Goal for 'sales_cold': Sell the Antigravity software license.

Write the Subject and Body.
Format:
SUBJECT: [Subject logic]
BODY: [Body logic]
`;

      // Re-use generateDraft but we need a slightly different method locally or just parse the output?
      // Existing generateDraft takes (sender, subject, body) and replies.
      // We need a NEW method: generateOutreach(context).
      // For now, I'll hack it by calling the generic generateDraft if I update IntelligenceManager,
      // OR I can just call the LLM directly via Intelligence.
      // Let's assume I add a 'generateOutreach' method to IntelligenceManager or use the public 'callOpenAI'.
      // Accessing internal method callOpenAI is risky if not exposed.
      // I'll UPDATE IntelligenceManager first to expose a generic 'ask' method?
      // Or just use the existing generateDraft and pass nulls? No that's for replies.
      try {
        const response = await this.kernel.intelligence.ask(prompt);

        // Parse
        const subjMatch = response.match(/SUBJECT:(.*)/i);
        const bodyMatch = response.match(/BODY:([\s\S]*)/i);

        if (subjMatch && bodyMatch) {
          subject = subjMatch[1].trim();
          body = bodyMatch[1].trim();
        } else {
          body = response; // Fallback if format failed
        }
      } catch (e) {
        console.error('[SEQUENCER] AI Gen Failed', e);
      }
    }

    await this.createDraft(auth, target.email, subject, body);

    // 3. Advance Step
    target.step++;
    target.lastActionDate = new Date().toISOString();

    // Schedule next (e.g., +2 days)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    target.nextActionDate = nextDate.toISOString();

    if (target.step > 3) {
      target.status = 'COMPLETED'; // End of sequence
    }
  }

  async checkForReply(email, auth) {
    // Simple check: Search for "from:email" in Inbox
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `from:${email}`,
    });
    return res.data.resultSizeEstimate > 0;
  }

  async createDraft(auth, to, subject, body) {
    const gmail = google.gmail({ version: 'v1', auth });
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ];
    const raw = Buffer.from(messageParts.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: { raw },
      },
    });
    console.log(`[SEQUENCER] Draft created for ${to}`);
  }
}

module.exports = new OutboundSequencer();
