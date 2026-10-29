const path = require('path');
const fs = require('fs');

function getHomeDir() {
  return process.env.USERPROFILE || process.env.HOME || '.';
}

function getAppDataDir() {
  const base = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '.', 'Library', 'Application Support')
      : path.join(process.env.HOME || '.', '.config')
  );
  return base;
}

function getStudioDataDir() {
  const dir = path.join(getAppDataDir(), 'nexusflow-youtube-studio');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
  return dir;
}

function getUploaderDataDir() {
  return path.join(getAppDataDir(), 'nexusflow-youtube-uploader');
}

function getChannelHistoryDataDir() {
  return path.join(getAppDataDir(), 'nexusflow-channel-history');
}

function getSeoDataDir() {
  return path.join(getAppDataDir(), 'nexusflow-youtube-seo');
}

function getDefaultNexusFlowBaseDir() {
  if (process.platform === 'win32') {
    if (fs.existsSync('D:\\Google Flow Customized')) return 'D:\\Google Flow Customized';
    if (fs.existsSync('C:\\Google Flow Customized')) return 'C:\\Google Flow Customized';
  }
  return path.join(getHomeDir(), 'Documents', 'Google Flow Customized');
}

const config = {
  // Channel Identity from verified YouTube Studio
  channel: {
    name: 'Bones of Empires',
    handle: '@BonesOfEmpires',
    channelId: 'UCZXJSiKIw60aaUVBJv1ucCQ',
    studioUrl: 'https://studio.youtube.com/channel/UCZXJSiKIw60aaUVBJv1ucCQ',
    publicUrl: 'https://youtube.com/@BonesOfEmpires',
    niche: 'Ancient History & Archaeological Mysteries',
    persona: 'Marrow (Ancient Wandering Scribe)'
  },

  // Operational Thresholds & Targets
  targets: {
    subscribersGoal: 1000,
    watchHoursGoal: 4000,
    shortsViewsGoal: 10000000,
    targetShortsAPV: 75.0, // Benchmark APV % for viral shorts
    highVelocityThresholdPerHour: 50 // views/hour indicating viral pickup
  },

  // File Paths & Module Links
  paths: {
    studioDataDir: getStudioDataDir(),
    uploaderDataDir: getUploaderDataDir(),
    channelHistoryDataDir: getChannelHistoryDataDir(),
    seoDataDir: getSeoDataDir(),
    nexusflowBaseDir: getDefaultNexusFlowBaseDir(),
    
    // Sibling NexusFlow Modules
    uploaderDir: path.resolve(__dirname, '..', 'NexusFlow YouTube Uploader'),
    publisherDir: path.resolve(__dirname, '..', 'NexusFlow YouTube Publisher'),
    historyLedgerDir: path.resolve(__dirname, '..', 'YouTube Channel History & Ledger'),
    seoTrendsDir: path.resolve(__dirname, '..', 'YouTube SEO & Trends'),
    coreAppDir: path.resolve(__dirname, '..', 'NexusFlow Core App'),

    // Local State Files
    localStateFile: path.join(__dirname, 'data', 'studioState.json'),
    historyCacheFile: path.join(getStudioDataDir(), 'studioHistory.json')
  },

  // Server & Dashboard Port
  server: {
    port: process.env.PORT || 3800,
    host: 'localhost'
  }
};

module.exports = config;
