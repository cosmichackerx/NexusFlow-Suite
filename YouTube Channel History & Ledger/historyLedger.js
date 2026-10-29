const fs = require('fs');
const path = require('path');
const { paths, ensureDirs } = require('./config');

/**
 * Load the entire video ledger.
 */
function getVideoLedger() {
  ensureDirs();
  if (fs.existsSync(paths.VIDEO_LEDGER_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(paths.VIDEO_LEDGER_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
      if (data.videos && Array.isArray(data.videos)) return data.videos;
    } catch (e) {
      console.error('[HistoryLedger] Error reading video ledger JSON:', e.message);
    }
  }

  // Check workspace copy as fallback
  if (fs.existsSync(paths.WORKSPACE_LEDGER_JSON)) {
    try {
      const data = JSON.parse(fs.readFileSync(paths.WORKSPACE_LEDGER_JSON, 'utf8'));
      if (Array.isArray(data)) {
        saveVideoLedger(data);
        return data;
      }
    } catch (e) {}
  }

  return [];
}

/**
 * Save video ledger to disk and mirror into workspace.
 */
function saveVideoLedger(videos) {
  ensureDirs();
  const serialized = JSON.stringify(videos, null, 2);
  fs.writeFileSync(paths.VIDEO_LEDGER_FILE, serialized, 'utf8');

  try {
    fs.writeFileSync(paths.WORKSPACE_LEDGER_JSON, serialized, 'utf8');
  } catch (e) {}

  return videos;
}

/**
 * Find video by ID, filename, or partial title.
 */
function getVideoById(query) {
  const videos = getVideoLedger();
  if (!query || query === 'latest') {
    return getLatestVideo();
  }

  const qLower = query.toLowerCase();
  return videos.find(v => 
    (v.id && v.id.toLowerCase() === qLower) ||
    (v.filename && v.filename.toLowerCase() === qLower) ||
    (v.title && v.title.toLowerCase().includes(qLower)) ||
    (v.youtube && v.youtube.queueId && v.youtube.queueId.toLowerCase() === qLower)
  ) || null;
}

/**
 * Get latest recorded video.
 */
function getLatestVideo() {
  const videos = getVideoLedger();
  if (videos.length === 0) return null;
  return videos[0]; // Kept sorted latest first
}

/**
 * Create or update a video record in the ledger.
 */
function recordVideo(entry) {
  const videos = getVideoLedger();
  const now = new Date().toISOString();

  const id = entry.id || `vid_${Date.now()}_${(entry.filename || 'clip').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30)}`;

  const existingIdx = videos.findIndex(v => 
    v.id === id || 
    (entry.filename && v.filename === entry.filename) ||
    (entry.videoPath && v.videoPath === entry.videoPath)
  );

  const merged = {
    id,
    episodeNumber: entry.episodeNumber || (existingIdx >= 0 ? videos[existingIdx].episodeNumber : videos.length + 1),
    arcId: entry.arcId || (existingIdx >= 0 ? videos[existingIdx].arcId : 'arc_01_alexandria'),
    title: entry.title || (existingIdx >= 0 ? videos[existingIdx].title : 'Untitled NexusFlow Short'),
    titleVariants: entry.titleVariants || (existingIdx >= 0 ? videos[existingIdx].titleVariants : {
      recommended: entry.title || 'Untitled NexusFlow Short',
      browseCtr: entry.title || 'Untitled NexusFlow Short',
      searchIntent: entry.title || 'Untitled NexusFlow Short',
      mobileShort: entry.title || 'Untitled NexusFlow Short'
    }),
    videoPath: entry.videoPath || (existingIdx >= 0 ? videos[existingIdx].videoPath : ''),
    filename: entry.filename || (entry.videoPath ? path.basename(entry.videoPath) : (existingIdx >= 0 ? videos[existingIdx].filename : 'video.mp4')),
    isShort: entry.isShort !== undefined ? entry.isShort : true,
    durationSec: entry.durationSec || (existingIdx >= 0 ? videos[existingIdx].durationSec : 24.0),
    formattedDuration: entry.formattedDuration || (existingIdx >= 0 ? videos[existingIdx].formattedDuration : '00:24'),
    status: entry.status || (existingIdx >= 0 ? videos[existingIdx].status : 'draft'),
    timestamps: {
      createdAt: (existingIdx >= 0 && videos[existingIdx].timestamps?.createdAt) || entry.timestamps?.createdAt || now,
      renderedAt: entry.timestamps?.renderedAt || (existingIdx >= 0 ? videos[existingIdx].timestamps?.renderedAt : null),
      mergedAt: entry.timestamps?.mergedAt || (existingIdx >= 0 ? videos[existingIdx].timestamps?.mergedAt : null),
      seoGeneratedAt: entry.timestamps?.seoGeneratedAt || (existingIdx >= 0 ? videos[existingIdx].timestamps?.seoGeneratedAt : null),
      queuedAt: entry.timestamps?.queuedAt || (existingIdx >= 0 ? videos[existingIdx].timestamps?.queuedAt : null),
      publishedAt: entry.timestamps?.publishedAt || (existingIdx >= 0 ? videos[existingIdx].timestamps?.publishedAt : null),
      updatedAt: now
    },
    prompts: entry.prompts || (existingIdx >= 0 ? videos[existingIdx].prompts : null),
    seo: entry.seo || (existingIdx >= 0 ? videos[existingIdx].seo : null),
    youtube: {
      channelName: entry.youtube?.channelName || (existingIdx >= 0 ? videos[existingIdx].youtube?.channelName : 'Bones of Empires'),
      channelHandle: entry.youtube?.channelHandle || (existingIdx >= 0 ? videos[existingIdx].youtube?.channelHandle : '@BonesOfEmpires'),
      queueId: entry.youtube?.queueId || (existingIdx >= 0 ? videos[existingIdx].youtube?.queueId : null),
      videoId: entry.youtube?.videoId || (existingIdx >= 0 ? videos[existingIdx].youtube?.videoId : null),
      videoUrl: entry.youtube?.videoUrl || (existingIdx >= 0 ? videos[existingIdx].youtube?.videoUrl : null),
      visibility: entry.youtube?.visibility || (existingIdx >= 0 ? videos[existingIdx].youtube?.visibility : 'public'),
      status: entry.youtube?.status || (existingIdx >= 0 ? videos[existingIdx].youtube?.status : 'pending')
    },
    analytics: entry.analytics || (existingIdx >= 0 ? videos[existingIdx].analytics : { views: 0, likes: 0, comments: 0 }),
    notes: entry.notes || (existingIdx >= 0 ? videos[existingIdx].notes : '')
  };

  if (existingIdx >= 0) {
    videos[existingIdx] = merged;
  } else {
    videos.unshift(merged); // Add to beginning
  }

  saveVideoLedger(videos);
  return merged;
}

/**
 * Update video status and specific timestamps.
 */
function updateVideoStatus(query, status, extra = {}) {
  const video = getVideoById(query);
  if (!video) return null;

  video.status = status;
  const now = new Date().toISOString();
  video.timestamps.updatedAt = now;

  if (status === 'rendered') video.timestamps.renderedAt = now;
  if (status === 'merged') video.timestamps.mergedAt = now;
  if (status === 'seo_generated') video.timestamps.seoGeneratedAt = now;
  if (status === 'queued') video.timestamps.queuedAt = now;
  if (status === 'published') {
    video.timestamps.publishedAt = now;
    video.youtube.status = 'published';
    if (extra.videoUrl) video.youtube.videoUrl = extra.videoUrl;
    if (extra.videoId) video.youtube.videoId = extra.videoId;
  }

  if (extra.youtube) video.youtube = { ...video.youtube, ...extra.youtube };
  if (extra.seo) video.seo = { ...video.seo, ...extra.seo };
  if (extra.notes) video.notes = extra.notes;

  const videos = getVideoLedger();
  const idx = videos.findIndex(v => v.id === video.id);
  if (idx >= 0) {
    videos[idx] = video;
    saveVideoLedger(videos);
  }

  return video;
}

/**
 * List videos with optional filtering.
 */
function listVideos(filter = {}) {
  let videos = getVideoLedger();

  if (filter.status) {
    videos = videos.filter(v => v.status === filter.status);
  }
  if (filter.arcId) {
    videos = videos.filter(v => v.arcId === filter.arcId);
  }
  if (filter.search) {
    const s = filter.search.toLowerCase();
    videos = videos.filter(v => 
      (v.title && v.title.toLowerCase().includes(s)) ||
      (v.filename && v.filename.toLowerCase().includes(s))
    );
  }

  return videos;
}

/**
 * Delete a video entry.
 */
function deleteVideo(id) {
  const videos = getVideoLedger();
  const filtered = videos.filter(v => v.id !== id);
  if (filtered.length !== videos.length) {
    saveVideoLedger(filtered);
    return true;
  }
  return false;
}

module.exports = {
  getVideoLedger,
  saveVideoLedger,
  getVideoById,
  getLatestVideo,
  recordVideo,
  updateVideoStatus,
  listVideos,
  deleteVideo
};
