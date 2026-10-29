const path = require('path');
const fs = require('fs');

function getUserDataDir() {
  const base = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '.', 'Library', 'Application Support')
      : path.join(process.env.HOME || '.', '.config')
  );
  const dir = path.join(base, 'nexusflow-channel-history');
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

function getSeoDataDir() {
  const base = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(process.env.HOME || '.', 'Library', 'Application Support')
      : path.join(process.env.HOME || '.', '.config')
  );
  return path.join(base, 'nexusflow-youtube-seo');
}

function getDefaultNexusFlowBaseDir() {
  if (process.platform === 'win32') {
    const drive = fs.existsSync('D:\\Google Flow Customized') ? 'D:\\' : 'C:\\';
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
const seoDataDir = getSeoDataDir();
const nexusflowBaseDir = getDefaultNexusFlowBaseDir();

const paths = {
  ROOT_DIR: __dirname,
  USER_DATA_DIR: userDataDir,
  CONFIG_FILE: path.join(userDataDir, 'history-config.json'),
  CHANNEL_MEMORY_FILE: path.join(userDataDir, 'channel-memory.json'),
  VIDEO_LEDGER_FILE: path.join(userDataDir, 'video-ledger.json'),
  PROMPT_ARCHIVE_FILE: path.join(userDataDir, 'prompt-archive.json'),
  CHANNEL_MEMORY_MD: path.join(userDataDir, 'CHANNEL_MEMORY.md'),
  WORKSPACE_MEMORY_MD: path.join(__dirname, 'CHANNEL_MEMORY.md'),
  WORKSPACE_LEDGER_JSON: path.join(__dirname, 'video-ledger.json'),

  // NexusFlow Core Engine
  NEXUSFLOW_ENGINE_DIR: path.join(__dirname, '..', 'NexusFlow Core App', 'app'),
  NEXUSFLOW_BASE_DIR: nexusflowBaseDir,
  NEXUSFLOW_OUTPUT_DIR: path.join(nexusflowBaseDir, 'Output'),
  NEXUSFLOW_RESULT_DIR: path.join(nexusflowBaseDir, 'Result'),
  NEXUSFLOW_PROMPT_FILE: path.join(nexusflowBaseDir, 'Prompt.txt'),
  NEXUSFLOW_FRAMES_DIR: path.join(nexusflowBaseDir, 'Frames'),
  NEXUSFLOW_REVIEW_FRAMES: path.join(nexusflowBaseDir, 'Review_Frames'),

  // YouTube Uploader & Queue
  UPLOADER_DIR: path.join(__dirname, '..', 'Youtube Uploader'),
  UPLOADER_USER_DATA: uploaderDataDir,
  UPLOADER_QUEUE_FILE: path.join(uploaderDataDir, 'upload-queue.json'),
  UPLOADER_HISTORY_FILE: path.join(uploaderDataDir, 'upload-history.json'),
  UPLOADER_LOG_FILE: path.join(uploaderDataDir, 'uploader.log'),
  UPLOADER_PROFILE_DIR: path.join(uploaderDataDir, 'playwright-youtube-profile'),

  // YouTube SEO Suite
  SEO_DIR: path.join(__dirname, '..', 'Youtube Seo With Antigravity'),
  SEO_USER_DATA: seoDataDir,
  SEO_PACKAGES_DIR: path.join(seoDataDir, 'seo-packages'),
  SEO_CONFIG_FILE: path.join(seoDataDir, 'seo-config.json'),
  SEO_TRENDS_CACHE: path.join(seoDataDir, 'trends-cache.json'),

  // Utilities
  FFMPEG: resolveFfmpegPath()
};

const defaultChannelMemory = {
  channel: {
    name: 'Bones of Empires',
    handle: '@BonesOfEmpires',
    channelId: 'UC_BonesOfEmpires_Official',
    url: 'https://youtube.com/@BonesOfEmpires',
    subscribeUrl: 'https://youtube.com/@BonesOfEmpires?sub_confirmation=1',
    createdDate: '2026-10-01',
    lastSyncDate: new Date().toISOString(),
    status: 'active',
    primaryNiche: 'Ancient History & Archaeological Mysteries',
    subNiche: 'Cinematic 3D CGI Storytelling & Lost Technologies',
    corePromise: 'Unearthing forgotten imperial civilizations through the eyes of an ancient skeletal wanderer.',
    brandColor: '#00F0FF',
    accentColor: '#FF9900'
  },
  character: {
    name: 'Marrow',
    title: 'The Wandering Scribe of Antiquity',
    anatomy: 'Stylised anatomical human skeleton made of polished ivory-white bones, surrounded by a faintly translucent pale-cyan glass-like body silhouette around torso and limbs.',
    eyes: 'Two warm glowing amber lights inside the eye sockets that flare brighter or dim with emotion.',
    attire: 'Plain undyed wool Roman tunic with brown leather belt and small leather coin pouch on left hip. Strictly no modern items.',
    voice: 'Deep, resonant, slightly raspy male voice, calm but ominous, with clear British-English pronunciation, cinematic documentary delivery, subtle vocal grit, natural pauses.',
    continuityLockPrompt: 'CHARACTER "MARROW": a stylised anatomical human skeleton made of polished ivory-white bones, surrounded by a faintly translucent pale-cyan glass-like body silhouette around the torso and limbs, with two warm amber glowing lights inside the eye sockets that flare brighter or dim with emotion, expressive stylised proportions with a large skull and slim ribcage, wearing a plain undyed wool Roman tunic with a brown leather belt and a small leather coin pouch on the left hip, no modern items.'
  },
  productionConventions: {
    format: 'YouTube Shorts (Vertical 9:16)',
    frameRate: '24 fps',
    targetDurationSec: 24,
    minDurationSec: 15,
    maxDurationSec: 58,
    visualGrade: 'High-contrast volumetric lighting, rich teal-and-amber cinematic grade, shallow depth of field, micro-texture detail.',
    sceneStructure: '3 scenes of 8 seconds each (Total: 24s). 0-2s Hook, 2-5s Escalation, 5-8s Climax/Cliffhanger.',
    audioBed: 'Low resonant cavern acoustics, water drips, subtle subterranean wind, mechanical gear groans, celestial chimes.',
    cameraStyle: 'Aggressive but smooth cinematic camerawork: 28mm wide establish, 35mm orbit dolly, 50mm/85mm portrait snap zooms and rack focus.'
  },
  audience: {
    targetDemographic: 'Ages 18-45, curiosity-driven history enthusiasts, mythology buffs, ancient tech detectives, 3D CGI cinephiles.',
    primaryMarkets: ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Global English'],
    viewerIntent: 'Fascination with mysterious past civilizations, high visual immersion, fast-paced micro-storytelling.'
  },
  storyArcs: [
    {
      id: 'arc_01_alexandria',
      title: 'The Subterranean Vaults of Alexandria',
      theme: 'Ancient Greek & Roman hydraulic technology, Archimedean lost mechanisms, subterranean cisterns.',
      episodesCount: 1,
      status: 'active'
    },
    {
      id: 'arc_02_silk_road',
      title: 'The Terracotta Emperor’s Mercury Rivers',
      theme: 'First Emperor of China, underground mechanical mercury rivers, crossbow traps, astrological ceiling.',
      episodesCount: 0,
      status: 'planned'
    },
    {
      id: 'arc_03_gobekli_tepe',
      title: 'The T-Pillars of the Star Shamans',
      theme: 'Pre-pottery Neolithic stone carvings, 11,000-year-old celestial alignments, comet impacts.',
      episodesCount: 0,
      status: 'planned'
    }
  ],
  rulesAndGuardrails: [
    'Always preserve Marrow\'s ivory skeleton, translucent cyan silhouette, amber eye lights, and Roman tunic.',
    'Never place modern technology (smartphones, electricity, plastics) in historical scenes.',
    'Title must always stay under 100 characters; mobile variants strictly under 50 characters.',
    'Tags must never exceed 485 characters (safe buffer below YouTube\'s 500-char limit).',
    'Shorts hook must deliver visual or auditory curiosity shock in the first 2.0 seconds.',
    'Always include #Shorts in title or first line of description for algorithmic categorization.'
  ],
  publishingCadence: {
    targetPerWeek: 3,
    bestPublishDays: ['Tuesday', 'Thursday', 'Saturday'],
    bestTimeUTC: '18:00',
    bestTimeEST: '14:00',
    bestTimePKT: '23:00'
  },
  metricsAndGoals: {
    milestones: [
      { goal: '1,000 Subscribers', targetDate: '2026-11-15', reached: false },
      { goal: '10,000 Subscribers', targetDate: '2026-12-31', reached: false },
      { goal: '100,000 Views across Shorts', targetDate: '2026-11-30', reached: false }
    ],
    targetAverageRetention: '85%',
    targetCTR: '9.5%'
  }
};

function ensureDirs() {
  if (!fs.existsSync(paths.USER_DATA_DIR)) {
    try { fs.mkdirSync(paths.USER_DATA_DIR, { recursive: true }); } catch (e) {}
  }
}

function loadConfig() {
  ensureDirs();
  if (fs.existsSync(paths.CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(paths.CONFIG_FILE, 'utf8'));
    } catch (e) {
      return { ...defaultChannelMemory.channel };
    }
  }
  return { ...defaultChannelMemory.channel };
}

function saveConfig(cfg) {
  ensureDirs();
  fs.writeFileSync(paths.CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

module.exports = {
  paths,
  defaultChannelMemory,
  ensureDirs,
  loadConfig,
  saveConfig
};
