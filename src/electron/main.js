/**
 * @fileoverview Electron Main Process
 * Bootstraps the application window and initializes the Antigravity Kernel.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const ipcHandlers = require('./ipc_handlers');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset', // Mac-style application
    backgroundColor: '#1a1a1a', // Dark mode default
  });

  // Load the UI
  mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));

  // Initialize IPC Bridges
  ipcHandlers.init(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
