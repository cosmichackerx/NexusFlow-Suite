const fs = require('fs');
const path = require('path');
const { paths, loadSettings } = require('./config');
const { probeVideo, formatUploadMetadata, extractNexusFlowPrompt } = require('./metadataManager');
const { uploadVideoToYoutube, stopCurrentUpload, getIsUploading } = require('./uploaderEngine');
const { log, setStatus, getMainWindow } = require('./logger');

let isProcessingQueue = false;
let stopQueueRequested = false;

function loadQueue() {
  try {
    if (fs.existsSync(paths.QUEUE_FILE)) {
      const data = JSON.parse(fs.readFileSync(paths.QUEUE_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return [];
}

function saveQueue(queue) {
  try {
    fs.writeFileSync(paths.QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
    broadcastQueue(queue);
    return true;
  } catch (e) {
    return false;
  }
}

function broadcastQueue(queue = null) {
  const q = queue || loadQueue();
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    try {
      win.webContents.send('queue-updated', q);
    } catch (e) {}
  }
}

function broadcastHistory() {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    try {
      win.webContents.send('history-updated', getHistory());
    } catch (e) {}
  }
}

function getQueue() {
  return loadQueue();
}

function getHistory() {
  try {
    if (fs.existsSync(paths.HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(paths.HISTORY_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return [];
}

function clearHistory() {
  try {
    fs.writeFileSync(paths.HISTORY_FILE, '[]', 'utf8');
    broadcastHistory();
    return true;
  } catch (e) {
    return false;
  }
}

async function addToQueue(items) {
  const currentQueue = loadQueue();
  const toAdd = Array.isArray(items) ? items : [items];
  const added = [];

  for (const item of toAdd) {
    const videoPath = item.videoPath || item;
    if (!videoPath || !fs.existsSync(videoPath)) continue;

    const probe = item.probeData || await probeVideo(videoPath);
    const meta = formatUploadMetadata({
      videoPath,
      title: item.title,
      description: item.description,
      tags: item.tags,
      visibility: item.visibility,
      probeData: probe
    });

    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      videoPath,
      filename: path.basename(videoPath),
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      visibility: meta.visibility,
      isShort: meta.isShort,
      duration: probe.duration,
      formattedDuration: probe.formattedDuration,
      status: 'pending', // 'pending' | 'uploading' | 'completed' | 'failed'
      url: null,
      error: null,
      addedAt: new Date().toISOString()
    };

    currentQueue.push(queueItem);
    added.push(queueItem);
  }

  saveQueue(currentQueue);
  log('info', `Added ${added.length} item(s) to upload queue. Total in queue: ${currentQueue.length}`);
  return added;
}

function removeFromQueue(id) {
  const queue = loadQueue();
  const idx = queue.findIndex(item => item.id === id);
  if (idx >= 0) {
    const removed = queue.splice(idx, 1)[0];
    saveQueue(queue);
    log('info', `Removed "${removed.title}" from queue.`);
    return true;
  }
  return false;
}

function clearQueue(mode = 'all') {
  let queue = loadQueue();
  if (mode === 'completed') {
    queue = queue.filter(item => item.status !== 'completed');
  } else {
    queue = [];
  }
  saveQueue(queue);
  log('info', `Queue cleared (mode: ${mode}).`);
  return true;
}

function updateQueueItem(id, updates) {
  const queue = loadQueue();
  const idx = queue.findIndex(item => item.id === id);
  if (idx >= 0) {
    queue[idx] = { ...queue[idx], ...updates };
    saveQueue(queue);
    return queue[idx];
  }
  return null;
}

async function scanNexusFlowVideos() {
  log('info', 'Scanning NexusFlow directories for videos...');
  const history = getHistory();
  const queue = loadQueue();

  const uploadedPaths = new Set(
    history
      .filter(h => h.success && h.videoPath)
      .map(h => path.resolve(h.videoPath).toLowerCase())
  );

  const queuedPaths = new Set(
    queue.map(q => path.resolve(q.videoPath).toLowerCase())
  );

  const foundVideos = [];

  function scanDir(dirPath, category) {
    if (!fs.existsSync(dirPath)) return;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (!file.toLowerCase().endsWith('.mp4')) continue;
        const fullPath = path.join(dirPath, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            foundVideos.push({
              fullPath,
              filename: file,
              category, // 'output' | 'result'
              mtime: stats.mtime
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  // Scan Output and Result directories
  scanDir(paths.NEXUSFLOW_OUTPUT_DIR, 'output');
  scanDir(paths.NEXUSFLOW_RESULT_DIR, 'result');

  // Sort newest first
  foundVideos.sort((a, b) => b.mtime - a.mtime);

  const readyToQueue = [];
  const alreadyUploaded = [];
  const currentlyQueued = [];

  for (const v of foundVideos) {
    const norm = path.resolve(v.fullPath).toLowerCase();
    if (uploadedPaths.has(norm)) {
      alreadyUploaded.push(v);
    } else if (queuedPaths.has(norm)) {
      currentlyQueued.push(v);
    } else {
      readyToQueue.push(v);
    }
  }

  log('info', `Scan completed: Found ${foundVideos.length} total videos (${readyToQueue.length} unuploaded & ready, ${currentlyQueued.length} already in queue, ${alreadyUploaded.length} uploaded).`);

  return {
    totalFound: foundVideos.length,
    readyToQueue,
    alreadyUploaded,
    currentlyQueued
  };
}

async function queueNexusFlowVideos({ includeOutputs = true, includeResults = true } = {}) {
  const scan = await scanNexusFlowVideos();
  const toQueue = scan.readyToQueue.filter(v => {
    if (v.category === 'output' && !includeOutputs) return false;
    if (v.category === 'result' && !includeResults) return false;
    return true;
  });

  if (toQueue.length === 0) {
    log('info', 'No new unuploaded NexusFlow videos found to queue.');
    return { queuedCount: 0, items: [] };
  }

  const items = [];
  for (const v of toQueue) {
    const probe = await probeVideo(v.fullPath);
    items.push({
      videoPath: v.fullPath,
      probeData: probe
    });
  }

  const added = await addToQueue(items);
  log('success', `Successfully queued ${added.length} new NexusFlow videos!`);
  return { queuedCount: added.length, items: added };
}

async function startQueueProcessing() {
  if (isProcessingQueue) {
    return { success: false, message: 'Queue is already processing.' };
  }

  const queue = loadQueue();
  const pending = queue.filter(item => item.status === 'pending');

  if (pending.length === 0) {
    log('info', 'Upload queue is empty or has no pending items.');
    return { success: false, message: 'No pending items in queue.' };
  }

  isProcessingQueue = true;
  stopQueueRequested = false;

  log('info', `Starting automated queue upload: ${pending.length} video(s) pending.`);
  setStatus('uploading', `Processing queue (${pending.length} pending)...`);

  // Run in background
  (async () => {
    try {
      while (isProcessingQueue && !stopQueueRequested) {
        const freshQueue = loadQueue();
        const nextItem = freshQueue.find(i => i.status === 'pending');
        if (!nextItem) break;

        updateQueueItem(nextItem.id, { status: 'uploading' });

        try {
          const uploadResult = await uploadVideoToYoutube({
            videoPath: nextItem.videoPath,
            title: nextItem.title,
            description: nextItem.description,
            tags: nextItem.tags,
            visibility: nextItem.visibility
          });

          updateQueueItem(nextItem.id, {
            status: 'completed',
            url: uploadResult.url,
            videoId: uploadResult.videoId,
            completedAt: new Date().toISOString()
          });

          broadcastHistory();
        } catch (uploadErr) {
          updateQueueItem(nextItem.id, {
            status: 'failed',
            error: uploadErr.message
          });
        }

        if (stopQueueRequested) break;

        // Pacing delay between uploads
        const settings = loadSettings();
        const delay = (settings.uploadDelaySec || 15) * 1000;
        log('info', `Pacing cooldown: waiting ${settings.uploadDelaySec || 15}s before next video...`);
        setStatus('idle', `Cooldown ${settings.uploadDelaySec || 15}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    } finally {
      isProcessingQueue = false;
      stopQueueRequested = false;
      setStatus('idle', 'Queue processing finished');
      log('info', 'Queue processing completed.');
    }
  })();

  return { success: true, message: `Started queue upload for ${pending.length} items.` };
}

function stopQueueProcessing() {
  if (!isProcessingQueue) {
    return { success: false, message: 'Queue is not running.' };
  }
  stopQueueRequested = true;
  stopCurrentUpload();
  isProcessingQueue = false;
  setStatus('idle', 'Queue stopped');
  log('warn', 'Queue processing stopped by user.');
  return { success: true, message: 'Queue upload stopped.' };
}

function isQueueRunning() {
  return isProcessingQueue || getIsUploading();
}

module.exports = {
  getQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
  updateQueueItem,
  getHistory,
  clearHistory,
  scanNexusFlowVideos,
  queueNexusFlowVideos,
  startQueueProcessing,
  stopQueueProcessing,
  isQueueRunning,
  broadcastQueue,
  broadcastHistory
};
