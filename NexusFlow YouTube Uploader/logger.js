const fs = require('fs');
const { paths } = require('./config');

let mainWindow = null;
let currentStatus = { state: 'idle', text: 'Idle', updatedAt: new Date().toISOString() };
const logHistory = [];
const MAX_LOGS = 500;

function setMainWindow(win) {
  mainWindow = win;
}

function getMainWindow() {
  return mainWindow;
}

function log(type, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    type: type || 'info',
    message: String(message)
  };
  logHistory.push(entry);
  if (logHistory.length > MAX_LOGS) {
    logHistory.shift();
  }

  // File logging
  try {
    const formatted = `[${entry.timestamp}] [${entry.type.toUpperCase()}] ${entry.message}\n`;
    fs.appendFileSync(paths.LOG_FILE, formatted, 'utf8');
  } catch (e) {}

  // Stderr logging (do not use stdout in MCP stdio mode)
  const color = entry.type === 'error' ? '\x1b[31m' : entry.type === 'warn' ? '\x1b[33m' : entry.type === 'success' ? '\x1b[32m' : '\x1b[36m';
  process.stderr.write(`${color}[${entry.type.toUpperCase()}]\x1b[0m ${entry.message}\n`);

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('log-message', entry);
    } catch (e) {}
  }
}

function setStatus(state, text) {
  currentStatus = { state, text, updatedAt: new Date().toISOString() };
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('status-change', currentStatus);
    } catch (e) {}
  }
}

function getStatus() {
  return currentStatus;
}

function getLogs(limit = 50, level = null) {
  let list = [...logHistory];
  if (list.length === 0 && fs.existsSync(paths.LOG_FILE)) {
    try {
      const content = fs.readFileSync(paths.LOG_FILE, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        const m = line.match(/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/);
        if (m) {
          list.push({ timestamp: m[1], type: m[2].toLowerCase(), message: m[3] });
        }
      }
    } catch (e) {}
  }
  if (level) {
    list = list.filter(l => l.type.toLowerCase() === level.toLowerCase());
  }
  return list.slice(-limit);
}

function clearLogs() {
  logHistory.length = 0;
  return true;
}

module.exports = {
  setMainWindow,
  getMainWindow,
  log,
  setStatus,
  getStatus,
  getLogs,
  clearLogs
};
