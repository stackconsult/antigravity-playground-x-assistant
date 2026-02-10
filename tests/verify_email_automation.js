const Sorter = require('../src/plugins/core_logic/sorter');

/**
 * Verification Script for Email Automation Logic
 */
async function runTests() {
  console.log('=== Verifying Revenue Sorter Logic ===\n');

  const testCases = [
    {
      name: 'VIP Investor (Sequoia)',
      email: {
        from: 'partner@sequoia.com',
        subject: 'Quick chat about Series A',
        snippet: "Hey, let's catch up.",
      },
      expectedCategory: 'NORMAL', // 50 points
      minScore: 50,
    },
    {
      name: 'Revenue Signal (Invoice)',
      email: {
        from: 'billing@vendor.com',
        subject: 'Invoice #1234 Overdue',
        snippet: 'Please pay ASAP.',
      },
      expectedCategory: 'NORMAL', // 40 (invoice) + 20 (ASAP) = 60
      minScore: 40,
    },
    {
      name: 'Critical Signal (VIP + Revenue)',
      email: {
        from: 'kirtissiemens.com', // VIP
        subject: 'Signed Contract Attached', // Revenue
        snippet: 'Here is the signed SOW.',
      },
      expectedCategory: 'CRITICAL', // 50 + 40 = 90
      minScore: 80,
    },
    {
      name: 'Noise / Low Priority',
      email: {
        from: 'newsletter@spam.com',
        subject: 'Weekly Digest',
        snippet: "Check out this week's news.",
      },
      expectedCategory: 'LOW',
      maxScore: 10,
    },
  ];

  let passed = 0;

  for (const test of testCases) {
    console.log(`Testing: ${test.name}`);
    const result = Sorter.calculatePriorityScore(test.email);
    console.log(`  > Score: ${result.score}`);
    console.log(`  > Category: ${result.category}`);
    console.log(`  > Reasons: ${result.reasons.join(', ')}`);

    let success = true;
    if (test.minScore && result.score < test.minScore) success = false;
    if (test.maxScore && result.score > test.maxScore) success = false;
    if (test.expectedCategory && result.category !== test.expectedCategory)
      success = false;

    if (success) {
      console.log('  ✅ PASS\n');
      passed++;
    } else {
      console.error('  ❌ FAIL\n');
    }
  }

  console.log(`Summary: ${passed}/${testCases.length} Tests Passed.`);
}

runTests().catch(console.error);
