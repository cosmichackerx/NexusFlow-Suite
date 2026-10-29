const { app, BrowserWindow, ipcMain, clipboard, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Modular components
const { setMainWindow, getMainWindow, log, setStatus } = require('./logger');
const {
  paths,
  getActiveCooldown,
  setActiveCooldown,
  updatePaths,
  ensureDirectories
} = require('./config');
const { getBrowserContext, closeBrowserContext, cleanupOrphanedChrome } = require('./browser');
const {
  getAccountsData,
  getActiveAccount,
  setActiveAccount,
  setAutoSwitch,
  broadcastAccounts
} = require('./accounts');
const { syncCredits, getActiveSyncPromise } = require('./credits');
const {
  loadPrompt,
  setupPromptWatcher,
  getPromptStats
} = require('./promptManager');
const { startAutomation, stopAutomation } = require('./automationEngine');
const { startBridge, stopBridge } = require('./localBridge');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'icon.png'),
    width: 950,
    height: 700,
    minWidth: 950,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a'
  });

  setMainWindow(mainWindow);

  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('did-finish-load', () => {
    log('info', `Active Paths:\nPrompt: ${paths.PROMPT_FILE}\nOutput: ${paths.OUTPUT_DIR}\nResult: ${paths.RESULT_DIR}\nFrames: ${paths.FRAMES_DIR}`);
    loadPrompt();
    broadcastAccounts();
    setupPromptWatcher();
  });
}

// App lifecycle
app.whenReady().then(() => {
  const missingFiles = ensureDirectories();
  createWindow();
  startBridge();

  if (missingFiles) {
    setTimeout(() => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        dialog.showMessageBox(win, {
          type: 'warning',
          title: 'Setup Required',
          message: 'Configuration File Missing or Empty',
          detail: `Your required setup file (prompt.txt) was either missing or empty. It has been automatically created at ${paths.PROMPT_FILE}.\n\nPlease fill it out with your video prompts before running automation.`
        });
      }
    }, 1000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBridge();
    closeBrowserContext();
    cleanupOrphanedChrome();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBridge();
  closeBrowserContext();
  cleanupOrphanedChrome();
});

// IPC: Window Controls & Utility
ipcMain.handle('minimize-window', () => {
  const win = getMainWindow();
  if (win) win.minimize();
});

ipcMain.handle('maximize-window', () => {
  const win = getMainWindow();
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

ipcMain.handle('close-window', () => {
  const win = getMainWindow();
  if (win) win.close();
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(text);
});

ipcMain.handle('restart-app', () => {
  log('info', 'Restarting application...');
  app.relaunch();
  app.exit(0);
});

// IPC: Prompt & Stats
ipcMain.handle('get-prompt-stats', () => {
  return getPromptStats();
});

ipcMain.handle('save-prompt', (event, content) => {
  try {
    fs.writeFileSync(paths.PROMPT_FILE, content, 'utf8');
    log('success', 'Prompt file saved successfully.');
    loadPrompt();
    return true;
  } catch (error) {
    log('error', `Failed to save prompt: ${error.message}`);
    return false;
  }
});

// IPC: Paths & Settings
ipcMain.handle('get-paths', () => {
  return {
    promptFile: paths.PROMPT_FILE,
    outputDir: paths.OUTPUT_DIR,
    resultDir: paths.RESULT_DIR,
    framesDir: paths.FRAMES_DIR,
    cooldown: getActiveCooldown()
  };
});

ipcMain.handle('update-cooldown', (event, newCooldown) => {
  const cd = setActiveCooldown(newCooldown);
  log('info', `Backend acknowledged active cooldown updated to ${cd}s.`);
});

ipcMain.handle('update-paths', (event, promptFile, outputDir, resultDir, framesDir) => {
  updatePaths(promptFile, outputDir, resultDir, framesDir);
  setupPromptWatcher();
  loadPrompt();
});

ipcMain.handle('select-file', async () => {
  const win = getMainWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }, { name: 'All Files', extensions: ['*'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-file', async (event, filePath) => {
  if (filePath) {
    shell.openPath(filePath);
  }
});

ipcMain.handle('select-folder', async () => {
  const win = getMainWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// IPC: Accounts & Authentication
ipcMain.handle('get-accounts', () => {
  return getAccountsData();
});

ipcMain.handle('switch-account', async (event, email) => {
  if (!email) return { success: false, error: 'No email provided' };
  log('info', `Switching active Google account to: ${email}...`);
  setActiveAccount(email);

  const credits = await syncCredits(true, email);
  const accData = getAccountsData();
  const accObj = accData.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  return {
    success: true,
    activeAccount: email,
    credits: credits,
    plan: accObj ? accObj.plan : 'Normal'
  };
});

ipcMain.handle('toggle-auto-switch', (event, enabled) => {
  const state = setAutoSwitch(enabled);
  log('info', `Auto-switch on low credits: ${state ? 'Enabled' : 'Disabled'}.`);
  return state;
});

ipcMain.handle('sync-account', async (event, email) => {
  const target = email || getActiveAccount();
  log('info', `Manually syncing credits for: ${target || 'default account'}...`);
  return await syncCredits(true, target);
});

ipcMain.handle('add-account', async () => {
  try {
    const activeSyncPromise = getActiveSyncPromise();
    if (activeSyncPromise) {
      await activeSyncPromise;
    }
    setStatus('running', 'Adding Google Account');
    const context = await getBrowserContext(false);
    const page = context.pages()[0] || await context.newPage();

    log('info', 'Navigating to Google Account Sign-In / Add Account...');
    await page.goto('https://accounts.google.com/signin/v2/identifier?continue=https://flow.google.com');

    page.on('close', async () => {
      log('info', 'Account login browser closed. Syncing all accounts...');
      setStatus('idle', 'Idle');
      setTimeout(async () => {
        await syncCredits(true);
      }, 1000);
    });
    return true;
  } catch (error) {
    log('error', `Failed to open add-account window: ${error.message}`);
    setStatus('error', 'Error');
    return false;
  }
});

// IPC: Flow Automation & Credits
ipcMain.handle('fetch-credits-on-load', async () => {
  return await syncCredits(false);
});

ipcMain.handle('open-login', async () => {
  try {
    const activeSyncPromise = getActiveSyncPromise();
    if (activeSyncPromise) {
      log('info', 'Waiting for background sync to complete before opening browser...');
      await activeSyncPromise;
    }
    setStatus('running', 'Awaiting Login');
    const context = await getBrowserContext(false);
    const page = context.pages()[0] || await context.newPage();

    const activeAcc = getActiveAccount();
    log('info', `Navigating to Google Flow (${activeAcc || 'default account'})... Please log in.`);
    const flowUrl = activeAcc
      ? `https://labs.google/fx/tools/flow?authuser=${encodeURIComponent(activeAcc)}`
      : 'https://labs.google/fx/tools/flow';
    await page.goto(flowUrl);

    page.on('close', () => {
      log('info', 'Browser closed. Login state saved. Syncing live credits...');
      setStatus('idle', 'Idle');
      setTimeout(() => {
        syncCredits(true);
      }, 800);
    });
  } catch (error) {
    log('error', error.message);
    setStatus('error', 'Error');
  }
});

ipcMain.handle('refresh-sync', async () => {
  log('info', 'Manual refresh triggered...');
  loadPrompt();
  return await syncCredits(true, getActiveAccount());
});

ipcMain.handle('start-automation', async (event, totalCredits, cooldown = 10, configOptions = null) => {
  return await startAutomation(totalCredits, cooldown, configOptions);
});

ipcMain.handle('stop-automation', () => {
  return stopAutomation();
});
