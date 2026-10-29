const electron = process.versions.electron ? require('electron') : null;
const app = electron && electron.app ? electron.app : null;
const path = require('path');
const fs = require('fs');

function getUserDataDir() {
  if (app && typeof app.getPath === 'function') {
    return app.getPath('userData');
  }
  const base = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : path.join(process.env.HOME, '.config'));
  const dir = path.join(base, 'nexusflow-youtube-uploader');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
  return dir;
}

function getDefaultBaseDir() {
  if (process.platform === 'win32') {
    const drive = fs.existsSync('D:\\') ? 'D:\\' : 'C:\\';
    return path.join(drive, 'Google Flow Customized');
  }
  return path.join(process.env.HOME || '.', 'Documents', 'Google Flow Customized');
}

const defaultBaseDir = getDefaultBaseDir();
const userDataDir = getUserDataDir();

const paths = {
  USER_DATA_DIR: userDataDir,
  PROFILE_DIR: path.join(userDataDir, 'playwright-youtube-profile'),
  SETTINGS_FILE: path.join(userDataDir, 'user-settings.json'),
  HISTORY_FILE: path.join(userDataDir, 'upload-history.json'),
  QUEUE_FILE: path.join(userDataDir, 'upload-queue.json'),
  BRIDGE_FILE: path.join(userDataDir, 'bridge.json'),
  LOG_FILE: path.join(userDataDir, 'uploader.log'),
  NEXUSFLOW_BASE_DIR: defaultBaseDir,
  NEXUSFLOW_OUTPUT_DIR: path.join(defaultBaseDir, 'Output'),
  NEXUSFLOW_RESULT_DIR: path.join(defaultBaseDir, 'Result'),
  NEXUSFLOW_PROMPT_FILE: path.join(defaultBaseDir, 'Prompt.txt')
};

const defaultSettings = {
  defaultVisibility: 'public', // 'public' | 'unlisted' | 'private'
  madeForKids: false,
  autoShortsDetection: true,
  addShortsTag: true,
  defaultTags: ['NexusFlow', 'AI', 'Shorts', 'Viral'],
  titleTemplate: '{title}',
  descriptionTemplate: '{description}\n\nCreated with NexusFlow AI',
  uploadDelaySec: 15,
  headless: false,
  bridgePort: 48292
};

function ensureDirectories() {
  for (const [key, p] of Object.entries(paths)) {
    if (key.endsWith('_DIR') && !fs.existsSync(p)) {
      try { fs.mkdirSync(p, { recursive: true }); } catch (e) {}
    }
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(paths.SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(paths.SETTINGS_FILE, 'utf8'));
      return { ...defaultSettings, ...data };
    }
  } catch (e) {}
  return { ...defaultSettings };
}

function saveSettings(partial) {
  try {
    const current = loadSettings();
    const updated = { ...current, ...partial };
    fs.writeFileSync(paths.SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (e) {
    return null;
  }
}

// Initialize and apply overrides from settings if existing
try {
  ensureDirectories();
  const loaded = loadSettings();
  if (loaded.nexusflowOutputDir && fs.existsSync(loaded.nexusflowOutputDir)) {
    paths.NEXUSFLOW_OUTPUT_DIR = loaded.nexusflowOutputDir;
  }
  if (loaded.nexusflowResultDir && fs.existsSync(loaded.nexusflowResultDir)) {
    paths.NEXUSFLOW_RESULT_DIR = loaded.nexusflowResultDir;
  }
  if (loaded.nexusflowPromptFile && fs.existsSync(loaded.nexusflowPromptFile)) {
    paths.NEXUSFLOW_PROMPT_FILE = loaded.nexusflowPromptFile;
  }
} catch (e) {}

module.exports = {
  paths,
  defaultSettings,
  loadSettings,
  saveSettings,
  ensureDirectories
};
