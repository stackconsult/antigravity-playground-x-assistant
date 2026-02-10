/**
 * @fileoverview Preload Script
 * Exposes a restricted API to the renderer process via ContextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    runDailyPulse: () => ipcRenderer.invoke('RUN_DAILY_PULSE'),
    getWeeklyReview: () => ipcRenderer.invoke('GET_WEEKLY_REVIEW'),
    getPreferences: () => ipcRenderer.invoke('GET_PREFERENCES'),
    connectGoogle: () => ipcRenderer.invoke('CONNECT_GOOGLE'),
    saveCredentials: (creds) => ipcRenderer.invoke('SAVE_CREDENTIALS', creds),
    savePreferences: (prefs) => ipcRenderer.invoke('SAVE_PREFERENCES', prefs),
    checkAuthStatus: () => ipcRenderer.invoke('CHECK_AUTH_STATUS'),

    // CRM
    getCampaigns: () => ipcRenderer.invoke('GET_CAMPAIGNS'),
    addToCampaign: (target) => ipcRenderer.invoke('ADD_TO_CAMPAIGN', target)
});
