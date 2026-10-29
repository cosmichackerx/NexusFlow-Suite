const { loadSettings, saveSettings } = require('./config');
const { getMainWindow } = require('./logger');

let activeAccount = null;
let savedAccounts = [];
let autoSwitchOnLowCredits = true;

try {
  const config = loadSettings();
  if (Array.isArray(config.accounts)) savedAccounts = config.accounts;
  if (config.activeAccount) activeAccount = config.activeAccount;
  if (typeof config.autoSwitchOnLowCredits === 'boolean') {
    autoSwitchOnLowCredits = config.autoSwitchOnLowCredits;
  }
} catch (e) {}

function getAccountsData() {
  try {
    const config = loadSettings();
    if (Array.isArray(config.accounts)) savedAccounts = config.accounts;
    if (config.activeAccount) activeAccount = config.activeAccount;
    if (typeof config.autoSwitchOnLowCredits === 'boolean') {
      autoSwitchOnLowCredits = config.autoSwitchOnLowCredits;
    }
  } catch (e) {}
  return {
    accounts: savedAccounts,
    activeAccount: activeAccount,
    autoSwitchOnLowCredits: autoSwitchOnLowCredits
  };
}

function getActiveAccount() {
  return activeAccount;
}

function setActiveAccount(email) {
  activeAccount = email;
  saveSettings({ activeAccount });
  broadcastAccounts();
}

function setAutoSwitch(enabled) {
  autoSwitchOnLowCredits = !!enabled;
  saveSettings({ autoSwitchOnLowCredits });
  broadcastAccounts();
  return autoSwitchOnLowCredits;
}

function getAutoSwitch() {
  return autoSwitchOnLowCredits;
}

function broadcastAccounts() {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('accounts-updated', {
      accounts: savedAccounts,
      activeAccount: activeAccount,
      autoSwitchOnLowCredits: autoSwitchOnLowCredits
    });
    const activeObj = savedAccounts.find(a => a.email.toLowerCase() === (activeAccount || '').toLowerCase());
    if (activeObj) {
      const displayStr = activeObj.plan && activeObj.plan !== 'Normal'
        ? `${activeObj.email} - ${activeObj.plan}`
        : `${activeObj.email} - Normal`;
      mainWindow.webContents.send('user-email', displayStr);
      if (activeObj.credits !== null && activeObj.credits !== undefined) {
        mainWindow.webContents.send('credits-updated', activeObj.credits);
      }
    } else if (activeAccount) {
      mainWindow.webContents.send('user-email', activeAccount);
    }
  }
}

function updateAccountRecord(email, parsedCredits, planStr, discoveredEmails) {
  const normEmail = email.toLowerCase().trim();
  const existingIdx = savedAccounts.findIndex(a => a.email.toLowerCase() === normEmail);

  if (existingIdx >= 0) {
    savedAccounts[existingIdx].credits = parsedCredits !== null ? parsedCredits : savedAccounts[existingIdx].credits;
    savedAccounts[existingIdx].plan = planStr;
    savedAccounts[existingIdx].lastSynced = Date.now();
  } else {
    savedAccounts.push({
      email: normEmail,
      plan: planStr,
      credits: parsedCredits,
      lastSynced: Date.now()
    });
  }

  if (Array.isArray(discoveredEmails)) {
    for (const other of discoveredEmails) {
      const oLower = other.toLowerCase().trim();
      if (!savedAccounts.some(a => a.email.toLowerCase() === oLower)) {
        savedAccounts.push({
          email: oLower,
          plan: 'Detected (Unsynced)',
          credits: null,
          lastSynced: null
        });
      }
    }
  }

  if (!activeAccount) {
    activeAccount = normEmail;
  }

  saveSettings({
    accounts: savedAccounts,
    activeAccount: activeAccount
  });

  broadcastAccounts();
}

module.exports = {
  getAccountsData,
  getActiveAccount,
  setActiveAccount,
  setAutoSwitch,
  getAutoSwitch,
  broadcastAccounts,
  updateAccountRecord
};
