const { app, BrowserWindow, ipcMain, clipboard, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const { setMainWindow, getMainWindow, log, setStatus, getLogs, clearLogs } = require('./logger');
const { paths, defaultSettings, loadSettings, saveSettings, ensureDirectories } = require('./config');
const { getYoutubeContext, closeYoutubeContext, cleanupOrphanedChrome, checkAuthStatus, openLoginWindow } = require('./browser');
const { probeVideo, formatUploadMetadata } = require('./metadataManager');
const { uploadVideoToYoutube, stopCurrentUpload, getIsUploading } = require('./uploaderEngine');
const {
  getQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
  getHistory,
  clearHistory,
  scanNexusFlowVideos,
  queueNexusFlowVideos,
  startQueueProcessing,
  stopQueueProcessing,
  isQueueRunning
} = require('./queueManager');
const { startBridge, stopBridge } = require('./localBridge');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'icon.png'),
    width: 1050,
    height: 750,
    minWidth: 980,
    minHeight: 650,
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
    log('info', `NexusFlow YouTube Uploader ready.\nOutput Dir: ${paths.NEXUSFLOW_OUTPUT_DIR}\nResult Dir: ${paths.NEXUSFLOW_RESULT_DIR}`);
    // Check initial auth status in background
    checkAuthStatus(true).then((auth) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('auth-updated', auth);
      }
    }).catch(() => {});
  });
}

// App Lifecycle
app.whenReady().then(() => {
  ensureDirectories();
  createWindow();
  startBridge(loadSettings().bridgePort || 48292);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBridge();
    closeYoutubeContext();
    cleanupOrphanedChrome();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBridge();
  closeYoutubeContext();
  cleanupOrphanedChrome();
});

// Window Controls
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('restart-app', () => {
  stopBridge();
  closeYoutubeContext();
  cleanupOrphanedChrome();
  app.relaunch();
  app.exit(0);
});

// IPC: Auth & Status
ipcMain.handle('get-status', () => {
  const queue = getQueue();
  const history = getHistory();
  return {
    success: true,
    status: getStatus(),
    isUploading: isQueueRunning(),
    queueCount: queue.length,
    pendingCount: queue.filter(q => q.status === 'pending').length,
    historyCount: history.length
  };
});

ipcMain.handle('check-auth', async (_event, headless = true) => {
  return await checkAuthStatus(headless);
});

ipcMain.handle('open-login', async () => {
  return await openLoginWindow();
});

// IPC: Video Probe & Single Upload
ipcMain.handle('probe-video', async (_event, videoPath) => {
  const probe = await probeVideo(videoPath);
  const meta = formatUploadMetadata({ videoPath, probeData: probe });
  return { success: true, probe, meta };
});

ipcMain.handle('upload-single', async (_event, data) => {
  try {
    const result = await uploadVideoToYoutube(data);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Queue Operations
ipcMain.handle('get-queue', () => {
  return getQueue();
});

ipcMain.handle('add-to-queue', async (_event, items) => {
  return await addToQueue(items);
});

ipcMain.handle('remove-from-queue', (_event, id) => {
  return removeFromQueue(id);
});

ipcMain.handle('clear-queue', (_event, mode) => {
  return clearQueue(mode);
});

ipcMain.handle('start-queue', async () => {
  return await startQueueProcessing();
});

ipcMain.handle('stop-upload', () => {
  return stopQueueProcessing();
});

// IPC: History
ipcMain.handle('get-history', () => {
  return getHistory();
});

ipcMain.handle('clear-history', () => {
  return clearHistory();
});

// IPC: NexusFlow Discovery
ipcMain.handle('scan-nexusflow', async () => {
  return await scanNexusFlowVideos();
});

ipcMain.handle('queue-nexusflow', async (_event, options) => {
  return await queueNexusFlowVideos(options);
});

// IPC: Settings
ipcMain.handle('get-settings', () => {
  return {
    paths,
    settings: loadSettings()
  };
});

ipcMain.handle('save-settings', (_event, partial) => {
  return saveSettings(partial);
});

ipcMain.handle('get-paths', () => {
  return paths;
});

// IPC: Utilities
ipcMain.handle('select-video-file', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Video File to Upload',
    filters: [
      { name: 'MP4 Videos', extensions: ['mp4', 'mov', 'm4v'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  if (!res.canceled && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Folder',
    properties: ['openDirectory']
  });
  if (!res.canceled && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-external', (_event, targetUrl) => {
  if (targetUrl) shell.openExternal(targetUrl);
});

ipcMain.handle('copy-to-clipboard', (_event, text) => {
  if (text) clipboard.writeText(String(text));
  return true;
});

ipcMain.handle('get-logs', (_event, limit, level) => {
  return getLogs(limit, level);
});

ipcMain.handle('clear-logs', () => {
  return clearLogs();
});
