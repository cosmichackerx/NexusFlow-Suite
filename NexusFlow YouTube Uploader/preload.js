const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Event listeners
  onLog: (callback) => ipcRenderer.on('log-message', (_event, value) => callback(value)),
  onStatusChange: (callback) => ipcRenderer.on('status-change', (_event, value) => callback(value)),
  onQueueUpdated: (callback) => ipcRenderer.on('queue-updated', (_event, value) => callback(value)),
  onHistoryUpdated: (callback) => ipcRenderer.on('history-updated', (_event, value) => callback(value)),
  onAuthUpdated: (callback) => ipcRenderer.on('auth-updated', (_event, value) => callback(value)),

  // Auth & Status
  getStatus: () => ipcRenderer.invoke('get-status'),
  checkAuth: (headless) => ipcRenderer.invoke('check-auth', headless),
  openLogin: () => ipcRenderer.invoke('open-login'),

  // Video Inspection & Single Upload
  probeVideo: (videoPath) => ipcRenderer.invoke('probe-video', videoPath),
  uploadSingle: (data) => ipcRenderer.invoke('upload-single', data),

  // Queue Operations
  getQueue: () => ipcRenderer.invoke('get-queue'),
  addToQueue: (items) => ipcRenderer.invoke('add-to-queue', items),
  removeFromQueue: (id) => ipcRenderer.invoke('remove-from-queue', id),
  clearQueue: (mode) => ipcRenderer.invoke('clear-queue', mode),
  startQueue: () => ipcRenderer.invoke('start-queue'),
  stopUpload: () => ipcRenderer.invoke('stop-upload'),

  // History Operations
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // NexusFlow Discovery
  scanNexusFlow: () => ipcRenderer.invoke('scan-nexusflow'),
  queueNexusFlow: (options) => ipcRenderer.invoke('queue-nexusflow', options),

  // Settings & Configuration
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getPaths: () => ipcRenderer.invoke('get-paths'),

  // System Utilities & Dialogs
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  getLogs: (limit, level) => ipcRenderer.invoke('get-logs', limit, level),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  restartApp: () => ipcRenderer.invoke('restart-app')
});
