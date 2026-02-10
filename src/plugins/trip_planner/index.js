/**
 * @fileoverview Trip Planner Plugin
 * Generates the "Master Trip File" for travel events.
 */

const fs = require('fs');
const path = require('path');

const TripPlanner = {
  name: 'Trip_Planner',

  init: async (kernel) => {
    console.log('[PLUGIN] Initializing Trip Planner...');
    kernel.trip = TripPlanner;
  },

  /**
   * Generate a Trip File markdown from details.
   * @param {Object} details - { city, dates, reason, flightOut, hotel, gym }
   * @returns {string} The formatted markdown content
   */
  generateTripFile: (details) => {
    const templatePath = path.join(
      __dirname,
      '../../../docs/templates/TRIP_FILE_TEMPLATE.md',
    );
    let content = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf8')
      : '# TRIP TEMPLATE MISSING';

    // Simple textual replacement
    content = content.replace('[CITY]', details.city || 'CITY');
    content = content.replace('[DATES]', details.dates || 'DATES');
    content = content.replace('[REASON]', details.reason || 'REASON');

    // Populate sections if data provided (simplified logic)
    if (details.flightOut) {
      content = content.replace('[Airline]', details.flightOut.airline);
      content = content.replace('[Flight #]', details.flightOut.number);
    }

    if (details.hotel) {
      content = content.replace('[Name]', details.hotel.name);
      content = content.replace('[Address]', details.hotel.address);
    }

    return content;
  },

  /**
   * Save the trip file to the user's specific directory (simulation).
   */
  saveTripFile: (filename, content) => {
    // In a real app, this would upload to GDrive or save to a synced folder.
    console.log(`[TRIP PLANNER] Saving trip file: ${filename}`);
    return true; // Success
  },
};

module.exports = TripPlanner;
