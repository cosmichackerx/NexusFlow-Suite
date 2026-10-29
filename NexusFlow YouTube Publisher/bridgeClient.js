const http = require('http');
const fs = require('fs');
const path = require('path');
const { paths } = require('./config');

const DEFAULT_NEXUSFLOW_PORT = 48291;
const DEFAULT_UPLOADER_PORT = 48292;

function getUploaderBridgeInfo() {
  try {
    if (fs.existsSync(paths.UPLOADER_BRIDGE)) {
      const data = JSON.parse(fs.readFileSync(paths.UPLOADER_BRIDGE, 'utf8'));
      if (data && data.port) return data;
    }
  } catch (e) {}
  return { port: DEFAULT_UPLOADER_PORT, url: `http://127.0.0.1:${DEFAULT_UPLOADER_PORT}` };
}

function getNexusFlowBridgeInfo() {
  try {
    if (fs.existsSync(paths.NEXUSFLOW_BRIDGE)) {
      const data = JSON.parse(fs.readFileSync(paths.NEXUSFLOW_BRIDGE, 'utf8'));
      if (data && data.port) return data;
    }
  } catch (e) {}
  return { port: DEFAULT_NEXUSFLOW_PORT, url: `http://127.0.0.1:${DEFAULT_NEXUSFLOW_PORT}` };
}

function httpRequest(urlStr, method = 'GET', body = null, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = http.request(parsed, {
      method,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : { success: true });
        } catch (e) {
          resolve({ success: false, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${urlStr}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * YouTube Uploader Bridge Calls
 */
async function getUploaderStatus() {
  const bridge = getUploaderBridgeInfo();
  try {
    return await httpRequest(`${bridge.url}/api/status`, 'GET', null, 1500);
  } catch (e) {
    // Fallback: Read directly from local queue & history files
    let queue = [];
    let history = [];
    try {
      if (fs.existsSync(paths.QUEUE_FILE)) queue = JSON.parse(fs.readFileSync(paths.QUEUE_FILE, 'utf8'));
      if (fs.existsSync(paths.HISTORY_FILE)) history = JSON.parse(fs.readFileSync(paths.HISTORY_FILE, 'utf8'));
    } catch (err) {}
    return {
      success: true,
      bridgeRunning: false,
      status: { state: 'idle', text: 'Bridge offline (read from disk)' },
      queueCount: queue.length,
      pendingCount: queue.filter(q => q.status === 'pending').length,
      historyCount: history.length
    };
  }
}

async function checkYoutubeAuth(headless = true) {
  const bridge = getUploaderBridgeInfo();
  try {
    return await httpRequest(`${bridge.url}/api/auth/status`, 'GET', null, 3000);
  } catch (e) {
    // If bridge is offline, delegate to YouTube Uploader browser module if accessible
    try {
      const browserModule = require(path.join(paths.UPLOADER_ROOT, 'browser'));
      return await browserModule.checkAuthStatus(headless);
    } catch (err) {
      return { loggedIn: false, error: err.message };
    }
  }
}

async function getUploadQueue() {
  const bridge = getUploaderBridgeInfo();
  try {
    return await httpRequest(`${bridge.url}/api/queue`, 'GET', null, 1500);
  } catch (e) {
    let queue = [];
    try {
      if (fs.existsSync(paths.QUEUE_FILE)) queue = JSON.parse(fs.readFileSync(paths.QUEUE_FILE, 'utf8'));
    } catch (err) {}
    return { success: true, queue };
  }
}

async function addToUploadQueue(item) {
  const bridge = getUploaderBridgeInfo();
  try {
    return await httpRequest(`${bridge.url}/api/queue/add`, 'POST', item, 2500);
  } catch (e) {
    // Direct file write fallback
    try {
      const queueModule = require(path.join(paths.UPLOADER_ROOT, 'queueManager'));
      const added = await queueModule.addToQueue(item);
      return { success: true, added };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function startUploadQueue() {
  const bridge = getUploaderBridgeInfo();
  try {
    return await httpRequest(`${bridge.url}/api/queue/start`, 'POST', {}, 2500);
  } catch (e) {
    try {
      const queueModule = require(path.join(paths.UPLOADER_ROOT, 'queueManager'));
      queueModule.startQueueProcessing();
      return { success: true, message: 'Queue processing started in background.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function getUploadHistory() {
  const bridge = getUploaderBridgeInfo();
  try {
    return await httpRequest(`${bridge.url}/api/history`, 'GET', null, 1500);
  } catch (e) {
    let history = [];
    try {
      if (fs.existsSync(paths.HISTORY_FILE)) history = JSON.parse(fs.readFileSync(paths.HISTORY_FILE, 'utf8'));
    } catch (err) {}
    return { success: true, history };
  }
}

/**
 * Scan NexusFlow directories for completed videos.
 */
function scanNexusFlowVideos() {
  const videos = [];

  // 1. Scan Result Directory (Merged full videos)
  if (fs.existsSync(paths.RESULT_DIR)) {
    const files = fs.readdirSync(paths.RESULT_DIR).filter(f => f.endsWith('.mp4'));
    for (const f of files) {
      const fullPath = path.join(paths.RESULT_DIR, f);
      const stat = fs.statSync(fullPath);
      videos.push({
        type: 'result',
        filename: f,
        path: fullPath,
        sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
        modified: stat.mtime.toISOString(),
        isCombined: f.toLowerCase().includes('combined')
      });
    }
  }

  // 2. Scan Output Directory (Individual clips)
  if (fs.existsSync(paths.OUTPUT_DIR)) {
    const files = fs.readdirSync(paths.OUTPUT_DIR).filter(f => f.endsWith('.mp4'));
    for (const f of files) {
      const fullPath = path.join(paths.OUTPUT_DIR, f);
      const stat = fs.statSync(fullPath);
      videos.push({
        type: 'clip',
        filename: f,
        path: fullPath,
        sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
        modified: stat.mtime.toISOString(),
        isCombined: false
      });
    }
  }

  return videos;
}

module.exports = {
  getUploaderStatus,
  checkYoutubeAuth,
  getUploadQueue,
  addToUploadQueue,
  startUploadQueue,
  getUploadHistory,
  scanNexusFlowVideos
};
