const fs = require('fs');
const path = require('path');
const http = require('http');
const { paths, bridgePorts, loadConfig, saveConfig } = require('./config');

/**
 * Perform a quick HTTP GET request to check local bridge endpoints.
 */
function checkBridgeEndpoint(port, endpointPath, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get({
      host: '127.0.0.1',
      port,
      path: endpointPath,
      timeout: timeoutMs
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ online: true, statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ online: true, statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', () => resolve({ online: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ online: false, timedOut: true });
    });
  });
}

/**
 * Check YouTube Studio authentication status via bridge or filesystem profile.
 */
async function getChannelAuthStatus() {
  const config = loadConfig();

  // Try live bridge first
  const bridgeCheck = await checkBridgeEndpoint(bridgePorts.YOUTUBE_UPLOADER_PORT, '/api/auth');
  if (bridgeCheck.online && bridgeCheck.data) {
    const data = bridgeCheck.data;
    return {
      source: 'live-bridge',
      authenticated: !!data.loggedIn,
      channelName: data.channelName || config.channelName,
      channelHandle: data.channelUrl ? ('@' + data.channelUrl.split('@')[1] || config.channelHandle) : config.channelHandle,
      channelUrl: data.channelUrl || `https://youtube.com/${config.channelHandle}`,
      statusMessage: data.loggedIn ? `Authenticated as "${data.channelName}"` : 'Studio session expired or logged out'
    };
  }

  // Fallback: Check uploader profile on disk
  const profileDir = paths.UPLOADER_PROFILE_DIR;
  const hasProfile = fs.existsSync(profileDir);
  const logFile = paths.UPLOADER_LOG_FILE;

  let lastKnownChannel = config.channelName;
  let authenticated = false;

  if (fs.existsSync(logFile)) {
    try {
      const logs = fs.readFileSync(logFile, 'utf8');
      const authMatch = logs.match(/YouTube session active:\s*([^\r\n]+)/);
      if (authMatch) {
        lastKnownChannel = authMatch[1].trim();
        authenticated = true;
      }
    } catch (e) {}
  }

  return {
    source: 'disk-profile',
    authenticated: authenticated || hasProfile,
    channelName: lastKnownChannel,
    channelHandle: config.channelHandle,
    channelUrl: `https://youtube.com/${config.channelHandle}`,
    profileDirExists: hasProfile,
    statusMessage: authenticated
      ? `Active authenticated session verified on disk: "${lastKnownChannel}"`
      : 'Playwright profile found; start YouTube Uploader to verify live token'
  };
}

/**
 * Get full Channel profile, niche strategy, and competitive benchmarks.
 */
async function getFullChannelProfile() {
  const auth = await getChannelAuthStatus();
  const config = loadConfig();

  const channelProfile = {
    identity: {
      channelName: auth.channelName,
      handle: auth.channelHandle,
      url: auth.channelUrl,
      authenticated: auth.authenticated,
      statusSource: auth.source,
      statusMessage: auth.statusMessage
    },
    niche: {
      primary: config.niche,
      subNiche: config.subNiche,
      targetAudience: config.targetAudience,
      primaryKeywords: [
        'Ancient Rome',
        'Alexandria Underground',
        'Archimedes Inventions',
        'Lost Civilizations',
        'Archaeology Discoveries',
        'Subterranean Mysteries',
        '3D CGI History'
      ],
      contentPillars: [
        {
          name: 'Forbidden & Lost Technology',
          description: 'Ancient mechanisms, clockworks, Greek fire, and engineering feats that seemed centuries ahead of their time.',
          projectedEngagement: 'High (Curiosity Driven)'
        },
        {
          name: 'Underground Secrets & Sunken Cities',
          description: 'Cisterns, catacombs, flooded tombs, and forgotten labyrinths hidden beneath modern cities.',
          projectedEngagement: 'Very High (Visual Enigma)'
        },
        {
          name: 'Last Words & Imperial Enigmas',
          description: 'The final hours of emperors, commanders, philosophers, and vanished legions.',
          projectedEngagement: 'High (Emotional Resonance)'
        }
      ]
    },
    character: {
      name: config.mainCharacter,
      lore: config.characterBio,
      voiceStyle: 'Deep, resonant, slightly raspy male voice, calm but ominous, cinematic documentary delivery with vocal grit.'
    },
    competitors: [
      {
        channel: 'Voices of the Past',
        subscribersTier: '1M+',
        strength: 'Primary source narration, somber atmosphere',
        ourAdvantage: 'Hyper-detailed 3D CGI visuals & character-driven continuity (Marrow)'
      },
      {
        channel: 'History Bypass',
        subscribersTier: '500K+',
        strength: 'High-velocity viral shorts with rapid hooks',
        ourAdvantage: 'Cinematic Pixar-meets-documentary visual fidelity, custom sound design'
      },
      {
        channel: 'Fall of Civilizations',
        subscribersTier: '1.5M+',
        strength: 'Unrivaled depth, poetic atmosphere',
        ourAdvantage: 'Bite-sized episodic mystery format with interactive viewer riddles'
      }
    ],
    growthChecklist: [
      { item: 'First 2 seconds hook', status: 'Implemented', impact: 'Prevents 60%+ dropoff in Shorts feed' },
      { item: 'Consistent character mascot (Marrow)', status: 'Active', impact: 'Drives repeat viewer recognition' },
      { item: 'Teal & Amber high-contrast grading', status: 'Implemented', impact: 'Instantly recognizable thumbnail/feed aesthetic' },
      { item: 'Direct pinned comment question', status: 'Recommended', impact: 'Spikes comment velocity by 3-5x' },
      { item: 'Multi-part cliffhanger continuity', status: 'Active', impact: 'Drives subscribers and channel page visits' }
    ]
  };

  return channelProfile;
}

/**
 * Update channel preferences in config.
 */
function updateChannelProfile(updates) {
  return saveConfig(updates);
}

module.exports = {
  getChannelAuthStatus,
  getFullChannelProfile,
  updateChannelProfile
};
