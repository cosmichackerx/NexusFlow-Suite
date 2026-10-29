const path = require('path');
const fs = require('fs');

function getUserDataDir() {
  const base = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '.', 'Library', 'Application Support')
      : path.join(process.env.HOME || '.', '.config')
  );
  const dir = path.join(base, 'nexusflow-youtube-seo');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
  return dir;
}

function getUploaderDataDir() {
  const base = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '.', 'Library', 'Application Support')
      : path.join(process.env.HOME || '.', '.config')
  );
  return path.join(base, 'nexusflow-youtube-uploader');
}

function getDefaultNexusFlowBaseDir() {
  if (process.platform === 'win32') {
    const drive = fs.existsSync('D:\\') ? 'D:\\' : 'C:\\';
    const candidate = path.join(drive, 'Google Flow Customized');
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(process.env.HOME || '.', 'Documents', 'Google Flow Customized');
}

function resolveFfmpegPath() {
  const localCandidates = [
    path.join(__dirname, '..', 'Youtube Uploader', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(__dirname, '..', 'Youtube With Antigravity', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
    'ffmpeg.exe',
    'ffmpeg'
  ];

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'ffmpeg';
}

const userDataDir = getUserDataDir();
const uploaderDataDir = getUploaderDataDir();
const nexusflowBaseDir = getDefaultNexusFlowBaseDir();

const paths = {
  // SEO Suite Directories
  ROOT_DIR: __dirname,
  USER_DATA_DIR: userDataDir,
  CONFIG_FILE: path.join(userDataDir, 'seo-config.json'),
  SEO_CACHE_DIR: path.join(userDataDir, 'seo-packages'),
  TRENDS_CACHE_FILE: path.join(userDataDir, 'trends-cache.json'),
  CHANNEL_PROFILE_FILE: path.join(userDataDir, 'channel-profile.json'),

  // YouTube Uploader & Profile Paths
  UPLOADER_DIR: path.join(__dirname, '..', 'Youtube Uploader'),
  UPLOADER_USER_DATA: uploaderDataDir,
  UPLOADER_PROFILE_DIR: path.join(uploaderDataDir, 'playwright-youtube-profile'),
  UPLOADER_QUEUE_FILE: path.join(uploaderDataDir, 'upload-queue.json'),
  UPLOADER_HISTORY_FILE: path.join(uploaderDataDir, 'upload-history.json'),
  UPLOADER_LOG_FILE: path.join(uploaderDataDir, 'uploader.log'),

  // NexusFlow Core Engine Paths
  NEXUSFLOW_ENGINE_DIR: path.join(__dirname, '..', 'NexusFlow Core App', 'app'),
  NEXUSFLOW_BASE_DIR: nexusflowBaseDir,
  NEXUSFLOW_OUTPUT_DIR: path.join(nexusflowBaseDir, 'Output'),
  NEXUSFLOW_RESULT_DIR: path.join(nexusflowBaseDir, 'Result'),
  NEXUSFLOW_PROMPT_FILE: path.join(nexusflowBaseDir, 'Prompt.txt'),
  NEXUSFLOW_FRAMES_DIR: path.join(nexusflowBaseDir, 'Frames'),
  NEXUSFLOW_REVIEW_FRAMES: path.join(nexusflowBaseDir, 'Review_Frames'),

  // Binaries
  FFMPEG: resolveFfmpegPath()
};

const bridgePorts = {
  NEXUSFLOW_PORT: 48291,
  YOUTUBE_UPLOADER_PORT: 48292
};

const defaultChannelConfig = {
  channelName: 'Bones of Empires',
  channelHandle: '@BonesOfEmpires',
  niche: 'Ancient History & Archaeological Mysteries',
  subNiche: 'Cinematic 3D CGI Storytelling & Lost Civilizations',
  mainCharacter: 'Marrow',
  characterBio: 'An articulate anatomical human skeleton with translucent glass-like silhouette, warm glowing amber eyes, and deep cinematic documentary voice traversing subterranean ancient worlds.',
  targetAudience: 'Curiosity-driven history enthusiasts, mythology buffs, ancient tech detectives, and cinematic CGI story lovers (ages 18-45).',
  videoStyle: 'Vertical 9:16 Shorts (20-60s) with intense hook in first 2 seconds, high-contrast teal-and-amber grade, cinematic pacing, sound design, and cliffhanger endings.',
  brandColor: '#00F0FF',
  primaryTags: [
    'Bones of Empires',
    'Marrow',
    'Ancient History',
    'Archaeology',
    'Lost Civilizations',
    'Roman Empire',
    'Ancient Mysteries',
    '3D CGI',
    'Shorts',
    'YouTube Shorts'
  ],
  defaultHashtags: ['#Shorts', '#History', '#BonesOfEmpires']
};

function ensureDirs() {
  const dirs = [userDataDir, paths.SEO_CACHE_DIR];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
    }
  });
}

function loadConfig() {
  ensureDirs();
  if (fs.existsSync(paths.CONFIG_FILE)) {
    try {
      return { ...defaultChannelConfig, ...JSON.parse(fs.readFileSync(paths.CONFIG_FILE, 'utf8')) };
    } catch (e) {
      return defaultChannelConfig;
    }
  }
  return defaultChannelConfig;
}

function saveConfig(cfg) {
  ensureDirs();
  const merged = { ...loadConfig(), ...cfg };
  fs.writeFileSync(paths.CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

module.exports = {
  paths,
  bridgePorts,
  defaultChannelConfig,
  ensureDirs,
  loadConfig,
  saveConfig
};
