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

function getDriveDataDir() {
  const dir = path.join(getAppDataDir(), 'nexusflow-gdrive-bones');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
  return dir;
}

function getDefaultGoogleFlowDir() {
  if (process.platform === 'win32') {
    if (fs.existsSync('C:\\Google Flow Customized')) return 'C:\\Google Flow Customized';
    if (fs.existsSync('D:\\Google Flow Customized')) return 'D:\\Google Flow Customized';
  }
  return path.join(getHomeDir(), 'Documents', 'Google Flow Customized');
}

const config = {
  // Google Drive Cloud Identity & Parameters
  googleDrive: {
    folderName: 'Bones of Empires',
    folderId: '10y_1F0F0Hlm5yaMQSJ1mGrlJ_ttnMOTG',
    webUrl: 'https://drive.google.com/drive/u/0/folders/10y_1F0F0Hlm5yaMQSJ1mGrlJ_ttnMOTG',
    homeUrl: 'https://drive.google.com/drive/u/0/home',
    owner: 'me',
    targetSubfolders: [
      'Finished Shorts'
    ],
    trackedFiles: [
      'channel-plan.md',
      'PROGRESS.md',
      'shorts-metadata.md'
    ]
  },

  // Channel Identity
  channel: {
    name: 'Bones of Empires',
    handle: '@BonesOfEmpires',
    channelId: 'UCZXJSiKIw60aaUVBJv1ucCQ',
    publicUrl: 'https://youtube.com/@BonesOfEmpires',
    niche: 'Ancient History & Archaeological Mysteries',
    persona: 'Marrow (Ancient Wandering Scribe)'
  },

  // Local & Sibling Paths
  paths: {
    moduleRoot: __dirname,
    dataDir: path.join(__dirname, 'data'),
    finishedShortsDir: path.join(__dirname, 'Finished Shorts'),
    stateFile: path.join(__dirname, 'data', 'driveState.json'),
    channelPlanFile: path.join(__dirname, 'data', 'channel-plan.md'),
    progressFile: path.join(__dirname, 'data', 'PROGRESS.md'),
    shortsMetadataFile: path.join(__dirname, 'data', 'shorts-metadata.md'),
    appDataDir: getDriveDataDir(),

    // Google Flow Customized
    googleFlowDir: getDefaultGoogleFlowDir(),
    googleFlowResultDir: path.join(getDefaultGoogleFlowDir(), 'Result'),
    googleFlowOutputDir: path.join(getDefaultGoogleFlowDir(), 'Output'),
    googleFlowPromptFile: path.join(getDefaultGoogleFlowDir(), 'Prompt.txt'),

    // Sibling NexusFlow Modules
    coreAppDir: path.resolve(__dirname, '..', 'NexusFlow Core App'),
    uploaderDir: path.resolve(__dirname, '..', 'NexusFlow YouTube Uploader'),
    publisherDir: path.resolve(__dirname, '..', 'NexusFlow YouTube Publisher'),
    studioMonitorDir: path.resolve(__dirname, '..', 'NexusFlow YouTube Studio Monitor & Manager'),
    historyLedgerDir: path.resolve(__dirname, '..', 'YouTube Channel History & Ledger'),
    seoTrendsDir: path.resolve(__dirname, '..', 'YouTube SEO & Trends')
  }
};

module.exports = config;
