const fs = require('fs');
const path = require('path');
const { paths, loadConfig } = require('./config');
const { getChannelAuthStatus } = require('./channelManager');
const { getQueue, getHistory } = require('./publisherBridge');
const { probeVideo, parseNexusFlowPrompts } = require('./videoAnalyzer');

/**
 * Get comprehensive, end-to-end system status for the entire ecosystem.
 */
async function getSystemStatus() {
  const config = loadConfig();

  // 1. Channel & Auth Status
  const channelAuth = await getChannelAuthStatus();

  // 2. Video Inventory in NexusFlow
  const videos = scanAvailableVideos();
  let probedTargetVideo = null;
  if (videos.length > 0) {
    try {
      probedTargetVideo = await probeVideo(videos[0].path);
    } catch (e) {}
  }

  // 3. Upload Queue & History
  const queueData = await getQueue();
  const historyData = await getHistory();

  // Cross-reference unuploaded videos
  const queuedPaths = new Set(queueData.queue.map(q => q.videoPath));
  const uploadedPaths = new Set(historyData.history.map(h => h.videoPath || h.filename));

  const unqueuedVideos = videos.filter(v => !queuedPaths.has(v.path) && !uploadedPaths.has(v.path));

  // 4. NexusFlow Prompts
  const promptData = parseNexusFlowPrompts();

  // 5. Cached SEO packages
  const cachedSeoCount = fs.existsSync(paths.SEO_CACHE_DIR)
    ? fs.readdirSync(paths.SEO_CACHE_DIR).filter(f => f.endsWith('.json')).length
    : 0;

  return {
    timestamp: new Date().toISOString(),
    channel: {
      name: channelAuth.channelName,
      handle: channelAuth.channelHandle,
      url: channelAuth.channelUrl,
      authenticated: channelAuth.authenticated,
      statusMessage: channelAuth.statusMessage,
      niche: config.niche,
      mainCharacter: config.mainCharacter
    },
    nexusflow: {
      baseDir: paths.NEXUSFLOW_BASE_DIR,
      promptFileExists: fs.existsSync(paths.NEXUSFLOW_PROMPT_FILE),
      activePromptScenes: promptData.scenes.length,
      characters: promptData.characters,
      summary: promptData.summary
    },
    videos: {
      totalFound: videos.length,
      unqueuedCount: unqueuedVideos.length,
      latestVideo: probedTargetVideo,
      allVideos: videos.map(v => ({
        filename: v.filename,
        type: v.type,
        sizeMb: v.sizeMb,
        isQueued: queuedPaths.has(v.path),
        isUploaded: uploadedPaths.has(v.path)
      }))
    },
    publishing: {
      queueCount: queueData.count,
      queueSource: queueData.source,
      historyCount: historyData.count,
      pendingQueue: queueData.queue.slice(0, 5).map(q => ({
        id: q.id,
        title: q.title,
        status: q.status,
        duration: q.formattedDuration,
        addedAt: q.addedAt
      }))
    },
    seo: {
      cachedPackages: cachedSeoCount,
      hasOptimizedPackageForLatest: cachedSeoCount > 0,
      readyToUpload: unqueuedVideos.length > 0 || queueData.count > 0
    }
  };
}

/**
 * Scan Result and Output directories for generated videos.
 */
function scanAvailableVideos() {
  const resultVideos = [];

  const checkDirs = [
    { dir: paths.NEXUSFLOW_RESULT_DIR, type: 'result' },
    { dir: paths.NEXUSFLOW_OUTPUT_DIR, type: 'output_clip' }
  ];

  checkDirs.forEach(({ dir, type }) => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir)
          .filter(f => f.toLowerCase().endsWith('.mp4'))
          .map(f => {
            const fullPath = path.join(dir, f);
            const stat = fs.statSync(fullPath);
            return {
              filename: f,
              path: fullPath,
              type,
              sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
              mtime: stat.mtime
            };
          });

        resultVideos.push(...files);
      } catch (e) {}
    }
  });

  // Sort: Combined_Video_Full.mp4 first, then recent
  resultVideos.sort((a, b) => {
    if (a.filename === 'Combined_Video_Full.mp4') return -1;
    if (b.filename === 'Combined_Video_Full.mp4') return 1;
    return b.mtime - a.mtime;
  });

  return resultVideos;
}

module.exports = {
  getSystemStatus,
  scanAvailableVideos
};
