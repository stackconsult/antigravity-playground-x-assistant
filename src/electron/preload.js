/**
 * @fileoverview Preload Script
 * Exposes a restricted API to the renderer process via ContextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    runDailyPulse: () => ipcRenderer.invoke('RUN_DAILY_PULSE'),
    getWeeklyReview: () => ipcRenderer.invoke('GET_WEEKLY_REVIEW'),
    getPreferences: () => ipcRenderer.invoke('GET_PREFERENCES'),
    connectGoogle: () => ipcRenderer.invoke('CONNECT_GOOGLE')
});
