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

function getFfmpegPath() {
  // Check relative YouTube Uploader node_modules
  const localUploaderFfmpeg = path.resolve(__dirname, '..', 'Youtube Uploader', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  if (fs.existsSync(localUploaderFfmpeg)) {
    return localUploaderFfmpeg;
  }
  const rootFfmpeg = path.resolve(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  if (fs.existsSync(rootFfmpeg)) {
    return rootFfmpeg;
  }
  return 'ffmpeg';
}

const homeDir = getHomeDir();
const appData = getAppDataDir();
const baseDir = getDefaultBaseDir();
const uploaderUserData = path.join(appData, 'nexusflow-youtube-uploader');
const nexusflowUserData = path.join(appData, 'nexusflow');

const paths = {
  // NexusFlow paths
  NEXUSFLOW_BASE_DIR: baseDir,
  PROMPT_FILE: path.join(baseDir, 'Prompt.txt'),
  OUTPUT_DIR: path.join(baseDir, 'Output'),
  RESULT_DIR: path.join(baseDir, 'Result'),
  FRAMES_DIR: path.join(baseDir, 'Frames'),

  // YouTube Uploader paths
  UPLOADER_ROOT: path.resolve(__dirname, '..', 'Youtube Uploader'),
  UPLOADER_USER_DATA: uploaderUserData,
  PROFILE_DIR: path.join(uploaderUserData, 'playwright-youtube-profile'),
  QUEUE_FILE: path.join(uploaderUserData, 'upload-queue.json'),
  HISTORY_FILE: path.join(uploaderUserData, 'upload-history.json'),
  UPLOADER_SETTINGS: path.join(uploaderUserData, 'user-settings.json'),
  UPLOADER_BRIDGE: path.join(uploaderUserData, 'bridge.json'),
  UPLOADER_LOG: path.join(uploaderUserData, 'uploader.log'),

  // NexusFlow App paths
  NEXUSFLOW_APP_ROOT: path.resolve(__dirname, '..', 'NexusFlow Core App', 'app'),
  NEXUSFLOW_SETTINGS: path.join(nexusflowUserData, 'user-settings.json'),
  NEXUSFLOW_BRIDGE: path.join(nexusflowUserData, 'nexusflow-bridge.json'),

  // Antigravity paths
  ANTIGRAVITY_HOME: path.join(homeDir, '.gemini', 'antigravity'),
  ANTIGRAVITY_CONFIG: path.join(homeDir, '.gemini', 'config'),
  ANTIGRAVITY_SKILLS: path.join(homeDir, '.gemini', 'config', 'skills', 'youtube'),
  CREDENTIALS_FILE: path.join(homeDir, '.gemini', 'antigravity', 'youtube-credentials.json'),

  // Tool Binaries
  FFMPEG: getFfmpegPath()
};

function ensureDirs() {
  const dirs = [
    paths.OUTPUT_DIR,
    paths.RESULT_DIR,
    paths.UPLOADER_USER_DATA,
    paths.ANTIGRAVITY_HOME,
    paths.ANTIGRAVITY_SKILLS
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
    }
  }
}

module.exports = {
  paths,
  ensureDirs,
  getFfmpegPath
};
