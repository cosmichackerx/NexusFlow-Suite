const fs = require('fs');
const path = require('path');
const http = require('http');
const { paths, bridgePorts } = require('./config');

/**
 * Send an HTTP request to local bridge.
 */
function requestBridge(port, method, endpointPath, payload = null, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const payloadStr = payload ? JSON.stringify(payload) : null;
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: endpointPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payloadStr ? { 'Content-Length': Buffer.byteLength(payloadStr) } : {})
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message, offline: true }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Request timed out', offline: true });
    });

    if (payloadStr) req.write(payloadStr);
    req.end();
  });
}

/**
 * Fetch current upload queue (Bridge or Disk).
 */
async function getQueue() {
  const bridgeRes = await requestBridge(bridgePorts.YOUTUBE_UPLOADER_PORT, 'GET', '/api/queue');
  if (bridgeRes.ok && bridgeRes.body && Array.isArray(bridgeRes.body.queue)) {
    return {
      source: 'live-bridge',
      queue: bridgeRes.body.queue,
      count: bridgeRes.body.queue.length
    };
  }

  // Fallback to disk file
  const queueFile = paths.UPLOADER_QUEUE_FILE;
  if (fs.existsSync(queueFile)) {
    try {
      const list = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
      if (Array.isArray(list)) {
        return { source: 'disk-file', queue: list, count: list.length };
      }
    } catch (e) {}
  }

  return { source: 'disk-file', queue: [], count: 0 };
}

/**
 * Fetch upload history (Bridge or Disk).
 */
async function getHistory() {
  const bridgeRes = await requestBridge(bridgePorts.YOUTUBE_UPLOADER_PORT, 'GET', '/api/history');
  if (bridgeRes.ok && bridgeRes.body && Array.isArray(bridgeRes.body.history)) {
    return {
      source: 'live-bridge',
      history: bridgeRes.body.history,
      count: bridgeRes.body.history.length
    };
  }

  // Fallback to disk file
  const historyFile = paths.UPLOADER_HISTORY_FILE;
  if (fs.existsSync(historyFile)) {
    try {
      const list = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      if (Array.isArray(list)) {
        return { source: 'disk-file', history: list, count: list.length };
      }
    } catch (e) {}
  }

  return { source: 'disk-file', history: [], count: 0 };
}

/**
 * Add a video package to the YouTube upload queue.
 */
async function queueVideo(item) {
  // Validate item
  if (!item.videoPath || !fs.existsSync(item.videoPath)) {
    throw new Error(`Video file does not exist: ${item.videoPath}`);
  }

  // Try live bridge first
  const bridgeRes = await requestBridge(bridgePorts.YOUTUBE_UPLOADER_PORT, 'POST', '/api/queue/add', item);
  if (bridgeRes.ok && bridgeRes.body && bridgeRes.body.success) {
    return {
      success: true,
      mode: 'live-bridge',
      item: bridgeRes.body.added || item,
      message: 'Video added to active YouTube Uploader queue via live bridge'
    };
  }

  // Atomic fallback to disk queue file
  const queueFile = paths.UPLOADER_QUEUE_FILE;
  const dir = path.dirname(queueFile);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }

  let queue = [];
  if (fs.existsSync(queueFile)) {
    try {
      queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
      if (!Array.isArray(queue)) queue = [];
    } catch (e) {
      queue = [];
    }
  }

  // Check if identical video path is already in queue
  const existingIdx = queue.findIndex(q => q.videoPath === item.videoPath);
  const queueEntry = {
    id: item.id || `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    videoPath: item.videoPath,
    filename: path.basename(item.videoPath),
    title: item.title,
    description: item.description,
    tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()),
    visibility: item.visibility || 'public',
    isShort: typeof item.isShorts !== 'undefined' ? item.isShorts : true,
    duration: item.durationSec || 0,
    formattedDuration: item.formattedDuration || '00:00',
    status: 'pending',
    url: null,
    error: null,
    addedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = queueEntry;
  } else {
    queue.push(queueEntry);
  }

  fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf8');

  return {
    success: true,
    mode: 'disk-file',
    item: queueEntry,
    message: 'Video added to upload queue on disk (will be uploaded when YouTube Uploader processes queue)'
  };
}

/**
 * Trigger upload queue start if bridge is active.
 */
async function startQueue() {
  const bridgeRes = await requestBridge(bridgePorts.YOUTUBE_UPLOADER_PORT, 'POST', '/api/queue/start');
  if (bridgeRes.ok) {
    return { success: true, message: 'Upload queue started successfully via bridge' };
  }
  return {
    success: false,
    message: 'YouTube Uploader bridge is currently offline. Launch the YouTube Uploader app to process queued videos.'
  };
}

module.exports = {
  getQueue,
  getHistory,
  queueVideo,
  startQueue
};
