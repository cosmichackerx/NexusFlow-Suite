const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { paths, loadSettings, saveSettings } = require('./config');
const { log, setStatus, getStatus, getLogs, clearLogs } = require('./logger');
const { checkAuthStatus, openLoginWindow } = require('./browser');
const { probeVideo, formatUploadMetadata } = require('./metadataManager');
const { uploadVideoToYoutube, stopCurrentUpload, getIsUploading } = require('./uploaderEngine');
const {
  getQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
  getHistory,
  clearHistory,
  scanNexusFlowVideos,
  queueNexusFlowVideos,
  startQueueProcessing,
  stopQueueProcessing,
  isQueueRunning
} = require('./queueManager');

const DEFAULT_PORT = 48292;
let server = null;
let activePort = DEFAULT_PORT;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function startBridge(port = DEFAULT_PORT) {
  if (server) return;

  activePort = port;

  server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      return res.end();
    }

    try {
      // 1. GET /api/status
      if (req.method === 'GET' && pathname === '/api/status') {
        const queue = getQueue();
        const history = getHistory();
        return sendJson(res, 200, {
          success: true,
          status: getStatus(),
          isUploading: isQueueRunning(),
          queueCount: queue.length,
          pendingCount: queue.filter(q => q.status === 'pending').length,
          historyCount: history.length
        });
      }

      // 2. GET /api/logs
      if (req.method === 'GET' && pathname === '/api/logs') {
        const limit = parseInt(query.limit, 10) || 50;
        const level = query.level || null;
        return sendJson(res, 200, {
          success: true,
          logs: getLogs(limit, level)
        });
      }

      // 3. POST /api/logs/clear
      if (req.method === 'POST' && pathname === '/api/logs/clear') {
        clearLogs();
        return sendJson(res, 200, { success: true, message: 'Logs cleared.' });
      }

      // 4. GET /api/auth/status
      if (req.method === 'GET' && pathname === '/api/auth/status') {
        const auth = await checkAuthStatus(true);
        return sendJson(res, 200, { success: true, ...auth });
      }

      // 5. POST /api/auth/login
      if (req.method === 'POST' && pathname === '/api/auth/login') {
        // Run in background and return immediate acceptance or await
        const loginPromise = openLoginWindow();
        return sendJson(res, 200, {
          success: true,
          message: 'Headful login window opened in Chrome. Please complete sign-in in the browser.'
        });
      }

      // 6. GET /api/queue
      if (req.method === 'GET' && pathname === '/api/queue') {
        return sendJson(res, 200, {
          success: true,
          queue: getQueue()
        });
      }

      // 7. POST /api/queue/add
      if (req.method === 'POST' && pathname === '/api/queue/add') {
        const body = await parseJsonBody(req);
        if (!body.videoPath) {
          return sendJson(res, 400, { success: false, error: 'Missing videoPath in request.' });
        }
        const added = await addToQueue(body);
        return sendJson(res, 200, { success: true, added });
      }

      // 8. POST /api/queue/remove
      if (req.method === 'POST' && pathname === '/api/queue/remove') {
        const body = await parseJsonBody(req);
        if (!body.id) {
          return sendJson(res, 400, { success: false, error: 'Missing id in request.' });
        }
        const ok = removeFromQueue(body.id);
        return sendJson(res, 200, { success: ok });
      }

      // 9. POST /api/queue/clear
      if (req.method === 'POST' && pathname === '/api/queue/clear') {
        const body = await parseJsonBody(req);
        clearQueue(body.mode || 'all');
        return sendJson(res, 200, { success: true, message: 'Queue cleared.' });
      }

      // 10. GET /api/history
      if (req.method === 'GET' && pathname === '/api/history') {
        return sendJson(res, 200, {
          success: true,
          history: getHistory()
        });
      }

      // 11. POST /api/history/clear
      if (req.method === 'POST' && pathname === '/api/history/clear') {
        clearHistory();
        return sendJson(res, 200, { success: true, message: 'History cleared.' });
      }

      // 12. POST /api/upload/start
      if (req.method === 'POST' && pathname === '/api/upload/start') {
        const result = await startQueueProcessing();
        return sendJson(res, 200, result);
      }

      // 13. POST /api/upload/stop
      if (req.method === 'POST' && pathname === '/api/upload/stop') {
        const result = stopQueueProcessing();
        return sendJson(res, 200, result);
      }

      // 14. POST /api/upload/single
      if (req.method === 'POST' && pathname === '/api/upload/single') {
        const body = await parseJsonBody(req);
        if (!body.videoPath) {
          return sendJson(res, 400, { success: false, error: 'Missing videoPath.' });
        }
        // Launch in background to prevent HTTP timeout
        uploadVideoToYoutube(body).catch(() => {});
        return sendJson(res, 200, {
          success: true,
          message: `Upload started for ${path.basename(body.videoPath)}.`
        });
      }

      // 15. GET /api/nexusflow/scan
      if (req.method === 'GET' && pathname === '/api/nexusflow/scan') {
        const scan = await scanNexusFlowVideos();
        return sendJson(res, 200, { success: true, ...scan });
      }

      // 16. POST /api/nexusflow/queue
      if (req.method === 'POST' && pathname === '/api/nexusflow/queue') {
        const body = await parseJsonBody(req);
        const resQueue = await queueNexusFlowVideos(body);
        return sendJson(res, 200, { success: true, ...resQueue });
      }

      // 17. POST /api/probe
      if (req.method === 'POST' && pathname === '/api/probe') {
        const body = await parseJsonBody(req);
        if (!body.videoPath) {
          return sendJson(res, 400, { success: false, error: 'Missing videoPath.' });
        }
        const probe = await probeVideo(body.videoPath);
        const meta = formatUploadMetadata({ videoPath: body.videoPath, probeData: probe });
        return sendJson(res, 200, { success: true, probe, meta });
      }

      // 18. GET /api/config
      if (req.method === 'GET' && pathname === '/api/config') {
        return sendJson(res, 200, {
          success: true,
          paths,
          settings: loadSettings()
        });
      }

      // 19. POST /api/config
      if (req.method === 'POST' && pathname === '/api/config') {
        const body = await parseJsonBody(req);
        const updated = saveSettings(body);
        return sendJson(res, 200, { success: true, settings: updated });
      }

      // Not found
      return sendJson(res, 404, { success: false, error: `Endpoint not found: ${pathname}` });
    } catch (err) {
      log('error', `Bridge API Error: ${err.message}`);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  });

  server.listen(port, '127.0.0.1', () => {
    log('info', `YouTube Uploader Local Bridge active on http://127.0.0.1:${port}`);
    try {
      fs.writeFileSync(paths.BRIDGE_FILE, JSON.stringify({
        port,
        url: `http://127.0.0.1:${port}`,
        pid: process.pid,
        startedAt: new Date().toISOString()
      }, null, 2), 'utf8');
    } catch (e) {}
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('warn', `Bridge port ${port} busy. Retrying with port ${port + 1}...`);
      server.close();
      server = null;
      startBridge(port + 1);
    } else {
      log('error', `Bridge error: ${err.message}`);
    }
  });
}

function stopBridge() {
  if (server) {
    try {
      server.close();
      if (fs.existsSync(paths.BRIDGE_FILE)) {
        fs.unlinkSync(paths.BRIDGE_FILE);
      }
    } catch (e) {}
    server = null;
  }
}

module.exports = {
  startBridge,
  stopBridge
};
