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

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('log-message', { type, message });
    } catch (e) {}
  }
}

function setStatus(state, text) {
  currentStatus = { state, text, updatedAt: new Date().toISOString() };
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('status-change', { state, text });
    } catch (e) {}
  }
}

function getStatus() {
  return currentStatus;
}

function getLogs(limit = 50, level = null) {
  let list = logHistory;
  if (level) {
    list = list.filter(l => l.type.toLowerCase() === level.toLowerCase());
  }
  return list.slice(-limit);
}

module.exports = {
  setMainWindow,
  getMainWindow,
  log,
  setStatus,
  getStatus,
  getLogs
};
