const electron = require('electron');
const app = typeof electron === 'object' && electron.app ? electron.app : null;
const path = require('path');
const fs = require('fs');

function getUserDataDir() {
  if (app && typeof app.getPath === 'function') {
    return app.getPath('userData');
  }
  return path.join(process.env.APPDATA || process.env.HOME || '.', 'nexusflow');
}

function getDefaultBaseDir() {
  if (process.platform === 'win32') {
    const drive = fs.existsSync('D:\\') ? 'D:\\' : 'C:\\';
    return path.join(drive, 'Google Flow Customized');
  }
  if (app && typeof app.getPath === 'function') {
    return path.join(app.getPath('documents'), 'Google Flow Customized');
  }
  return path.join(process.env.HOME || '.', 'Documents', 'Google Flow Customized');
}

function isPathValid(filePath) {
  if (!filePath) return false;
  try {
    const root = path.parse(filePath).root;
    return !root || fs.existsSync(root);
  } catch (e) {
    return false;
  }
}

const defaultBaseDir = getDefaultBaseDir();
const userDataDir = getUserDataDir();
const paths = {
  PROMPT_FILE: path.join(defaultBaseDir, 'Prompt.txt'),
  OUTPUT_DIR: path.join(defaultBaseDir, 'Output'),
  RESULT_DIR: path.join(defaultBaseDir, 'Result'),
  FRAMES_DIR: path.join(defaultBaseDir, 'Frames'),
  USER_DATA_DIR: path.join(userDataDir, 'playwright-profile'),
  SETTINGS_FILE: path.join(userDataDir, 'user-settings.json'),
  HANDLERS_FILE: path.join(__dirname, 'handlers.json'),
  PROJECTS_FILE: path.join(userDataDir, 'flow-projects.json')
};

let activeCooldown = 10;

function loadSettings() {
  try {
    if (fs.existsSync(paths.SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(paths.SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
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

// Initialize paths from saved settings if available
try {
  const config = loadSettings();
  if (config.promptFile && isPathValid(config.promptFile)) paths.PROMPT_FILE = config.promptFile;
  if (config.outputDir && isPathValid(config.outputDir)) paths.OUTPUT_DIR = config.outputDir;
  if (config.resultDir && isPathValid(config.resultDir)) paths.RESULT_DIR = config.resultDir;
  if (config.framesDir && isPathValid(config.framesDir)) paths.FRAMES_DIR = config.framesDir;
  if (config.activeCooldown && !isNaN(parseInt(config.activeCooldown, 10))) {
    activeCooldown = parseInt(config.activeCooldown, 10);
  }
} catch (e) {}

function getActiveCooldown() {
  return activeCooldown;
}

function setActiveCooldown(cd) {
  const parsed = parseInt(cd, 10);
  if (!isNaN(parsed)) {
    activeCooldown = parsed;
    saveSettings({ activeCooldown });
  }
  return activeCooldown;
}

function updatePaths(promptFile, outputDir, resultDir, framesDir) {
  paths.PROMPT_FILE = promptFile;
  paths.OUTPUT_DIR = outputDir;
  paths.RESULT_DIR = resultDir;
  paths.FRAMES_DIR = framesDir;
  saveSettings({
    promptFile: paths.PROMPT_FILE,
    outputDir: paths.OUTPUT_DIR,
    resultDir: paths.RESULT_DIR,
    framesDir: paths.FRAMES_DIR
  });
}

function ensureDirectories() {
  let missingFiles = false;

  const ensureDir = (dirPath) => {
    try {
      if (dirPath && !fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (e) {
      console.error(`Failed to create directory ${dirPath}:`, e.message);
    }
  };

  ensureDir(paths.OUTPUT_DIR);
  ensureDir(paths.RESULT_DIR);
  ensureDir(paths.FRAMES_DIR);

  try {
    const promptDir = path.dirname(paths.PROMPT_FILE);
    ensureDir(promptDir);

    if (!fs.existsSync(paths.PROMPT_FILE)) {
      fs.writeFileSync(paths.PROMPT_FILE, '');
      missingFiles = true;
    } else {
      const promptContent = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
      if (promptContent.trim() === '') {
        missingFiles = true;
      }
    }
  } catch (e) {
    console.error(`Failed to initialize prompt file (${paths.PROMPT_FILE}):`, e.message);
    missingFiles = true;
  }

  return missingFiles;
}

module.exports = {
  paths,
  isPathValid,
  loadSettings,
  saveSettings,
  getActiveCooldown,
  setActiveCooldown,
  updatePaths,
  ensureDirectories
};
