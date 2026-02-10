/**
 * REVENUE SORTER ENGINE
 * "Revenue > Everything"
 */

const VIP_DOMAINS = [
  'sequoia.com',
  'a16z.com',
  'stripe.com',
  'kirtissiemens.com', // Self
];

const REVENUE_KEYWORDS = [
  'invoice',
  'contract',
  'proposal',
  'agreement',
  'sign',
  'wire transfer',
  'payment',
  'statement of work',
  'sow',
];

const URGENCY_KEYWORDS = ['urgent', 'asap', 'critical', 'deadline', 'eod'];

class Sorter {
  constructor() {
    this.weights = {
      VIP: 50,
      REVENUE: 40,
      URGENCY: 20,
    };
  }

  /**
   * Calculate the priority score for an email.
   * @param {Object} email { from, subject, snippet }
   * @returns {Object} { score: number, reasons: string[] }
   */
  calculatePriorityScore(email) {
    let score = 0;
    let reasons = [];

    const from = (email.from || '').toLowerCase();
    const subject = (email.subject || '').toLowerCase();
    const snippet = (email.snippet || '').toLowerCase();

    // 1. Check VIP Status
    const isVip = VIP_DOMAINS.some((domain) => from.includes(domain));
    if (isVip) {
      score += this.weights.VIP;
      reasons.push('VIP Sender');
    }

    // 2. Check Revenue Intent
    const isRevenue = REVENUE_KEYWORDS.some(
      (keyword) => subject.includes(keyword) || snippet.includes(keyword),
    );
    if (isRevenue) {
      score += this.weights.REVENUE;
      reasons.push('Revenue Signal');
    }

    // 3. Check Urgency
    const isUrgent = URGENCY_KEYWORDS.some((keyword) =>
      subject.includes(keyword),
    );
    if (isUrgent) {
      score += this.weights.URGENCY;
      reasons.push('Urgency Keyword');
    }

    // Cap at 100
    score = Math.min(score, 100);

    return {
      score,
      category: this.getCategory(score),
      reasons,
    };
  }

  getCategory(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 40) return 'NORMAL';
    return 'LOW';
  }
}

module.exports = new Sorter();
