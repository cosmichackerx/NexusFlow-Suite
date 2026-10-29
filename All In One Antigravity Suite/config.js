const path = require('path');
const fs = require('fs');

function getHomeDir() {
  return process.env.USERPROFILE || process.env.HOME || '.';
}

function getAppDataDir() {
  return process.env.APPDATA || path.join(getHomeDir(), 'AppData', 'Roaming');
}

function getDefaultBaseDir() {
  if (process.platform === 'win32') {
    if (fs.existsSync('D:\\Google Flow Customized')) return 'D:\\Google Flow Customized';
    if (fs.existsSync('C:\\Google Flow Customized')) return 'C:\\Google Flow Customized';
    return fs.existsSync('D:\\') ? 'D:\\Google Flow Customized' : 'C:\\Google Flow Customized';
  }
  return path.join(getHomeDir(), 'Documents', 'Google Flow Customized');
}

function findFfmpeg() {
  const possiblePaths = [
    path.resolve(__dirname, '..', 'NexusFlow Core App', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.resolve(__dirname, '..', 'NexusFlow YouTube Uploader', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.resolve(__dirname, '..', 'Youtube Uploader', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.resolve(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    'ffmpeg'
  ];

  for (const p of possiblePaths) {
    if (p === 'ffmpeg' || fs.existsSync(p)) return p;
  }
  return 'ffmpeg';
}

const baseDir = getDefaultBaseDir();
const appData = getAppDataDir();
const nexusflowUserData = path.join(appData, 'nexusflow');
const uploaderUserData = path.join(appData, 'nexusflow-youtube-uploader');

const paths = {
  // Master Suite paths
  SUITE_ROOT: __dirname,
  LOGS_DIR: path.join(__dirname, 'logs'),
  AUDIT_LOG_FILE: path.join(__dirname, 'logs', 'audit.log'),

  // Google Flow directories
  GOOGLE_FLOW_BASE: baseDir,
  PROMPT_FILE: path.join(baseDir, 'Prompt.txt'),
  OUTPUT_DIR: path.join(baseDir, 'Output'),
  RESULT_DIR: path.join(baseDir, 'Result'),
  FRAMES_DIR: path.join(baseDir, 'Frames'),
  PROMPT_BACKUPS_DIR: path.join(baseDir, 'Prompt_Backups'),

  // NexusFlow Core App
  CORE_APP_ROOT: path.resolve(__dirname, '..', 'NexusFlow Core App'),
  CORE_SETTINGS_FILE: path.join(nexusflowUserData, 'user-settings.json'),
  CORE_BRIDGE_FILE: path.join(nexusflowUserData, 'playwright-profile', 'nexusflow-bridge.json'),

  // NexusFlow YouTube Uploader
  UPLOADER_ROOT: path.resolve(__dirname, '..', 'NexusFlow YouTube Uploader'),
  UPLOADER_USER_DATA: uploaderUserData,
  UPLOADER_QUEUE_FILE: path.join(uploaderUserData, 'upload-queue.json'),
  UPLOADER_HISTORY_FILE: path.join(uploaderUserData, 'upload-history.json'),
  UPLOADER_SETTINGS_FILE: path.join(uploaderUserData, 'user-settings.json'),
  UPLOADER_BRIDGE_FILE: path.join(uploaderUserData, 'bridge.json'),

  // YouTube SEO & Trends
  SEO_ROOT: path.resolve(__dirname, '..', 'YouTube SEO & Trends'),

  // YouTube Channel History & Ledger
  LEDGER_ROOT: path.resolve(__dirname, '..', 'YouTube Channel History & Ledger'),
  LEDGER_FILE: path.resolve(__dirname, '..', 'YouTube Channel History & Ledger', 'video-ledger.json'),

  // YouTube Studio Monitor & Manager
  STUDIO_ROOT: path.resolve(__dirname, '..', 'NexusFlow YouTube Studio Monitor & Manager'),

  // NexusFlow YouTube Publisher
  PUBLISHER_ROOT: path.resolve(__dirname, '..', 'NexusFlow YouTube Publisher'),

  // Binaries
  FFMPEG: findFfmpeg()
};

function ensureDirs() {
  [
    paths.LOGS_DIR,
    paths.GOOGLE_FLOW_BASE,
    paths.OUTPUT_DIR,
    paths.RESULT_DIR,
    paths.FRAMES_DIR,
    paths.PROMPT_BACKUPS_DIR
  ].forEach(d => {
    try {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    } catch (e) {}
  });
}

module.exports = {
  paths,
  ensureDirs,
  server: {
    port: 4900,
    host: '127.0.0.1'
  },
  accounts: {
    primaryUploader: 'astravoidxecho@gmail.com',
    backupStatus: 'amazingarsl@gmail.com',
    minCreditThreshold: 10
  }
};
