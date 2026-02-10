/**
 * @fileoverview Implements the North Star Principles from the CEO Assistant SOP.
 * These rules guide all decision making.
 */

const RULES = {
  PROTECT_ASSET: {
    id: 'protect_asset',
    priority: 100, // Highest Priority
    description: "Protect the CEO's time. Default answer is 'No'.",
    evaluate: (context) => {
      // If the request doesn't align with strategic goals, reject it.
      if (!context.isStrategic && !context.isRevenueGenerating) {
        return {
          authorized: false,
          reason: 'Does not align with strategic goals.',
        };
      }
      return { authorized: true };
    },
  },

  PRIORITIZE_REVENUE: {
    id: 'prioritize_revenue',
    priority: 90,
    description: 'Profit solves all problems. Revenue-generating tasks win.',
    evaluate: (taskA, taskB) => {
      if (taskA.isRevenueGenerating && !taskB.isRevenueGenerating) return taskA;
      if (!taskA.isRevenueGenerating && taskB.isRevenueGenerating) return taskB;
      // If both are, higher value wins
      return taskA.value > taskB.value ? taskA : taskB;
    },
  },

  READ_THE_PLAY: {
    id: 'read_the_play',
    priority: 80,
    description: 'Be preemptive. Check traffic, weather, and context.',
    action: async (event, context) => {
      const enrichment = {};
      if (event.location) {
        // Pseudo-code: enrichment.traffic = await checkTraffic(event.location);
        enrichment.traffic = 'Check Traffic API';
      }
      return enrichment;
    },
  },

  CAPTURE_PREFERENCES: {
    id: 'capture_preferences',
    priority: 70,
    description: 'Never ask the same question twice. Record outcomes.',
    // This rule is enforced by the Preferences Module
  },

  EFFICIENCY_IN_CALENDAR: {
    id: 'efficiency',
    priority: 60,
    description: 'Batch calls. No dead space.',
    validate: (schedule) => {
      // Logic to check for gaps and fragmentation
      const fragmentationScore = 0; // Placeholder
      return { isValid: fragmentationScore < 0.2, score: fragmentationScore };
    },
  },

  KINDNESS_IN_GATEKEEPING: {
    id: 'kindness',
    priority: 100, // Applies to all rejections
    description: 'Rejection must be clear but kind.',
    template: 'Appreciate the response, but [Constraint].',
  },
};

module.exports = RULES;
