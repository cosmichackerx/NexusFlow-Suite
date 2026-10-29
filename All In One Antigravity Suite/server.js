const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { paths, server: serverConfig, accounts: accountConfig } = require('./config');
const auditor = require('./logAuditor');
const accountManager = require('./accountManager');
const pipelineManager = require('./pipelineManager');

const PORT = serverConfig.port || 4900;
const HOST = serverConfig.host || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- API ROUTING ---

  // 1. Live Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const pipelineState = pipelineManager.getPipelineStatus();
    const accountsState = accountManager.getAccountsState();
    return sendJson(res, 200, {
      success: true,
      timestamp: new Date().toISOString(),
      pipeline: pipelineState,
      accounts: accountsState
    });
  }

  // 2. Query Logs
  if (pathname === '/api/logs' && req.method === 'GET') {
    const limit = parseInt(parsedUrl.query.limit, 10) || 100;
    const level = parsedUrl.query.level || null;
    return sendJson(res, 200, {
      success: true,
      logs: auditor.getRecentLogs(limit, level)
    });
  }

  // 3. Live SSE Stream of Audit Logs
  if (pathname === '/api/logs/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
    auditor.addSseClient(res);

    req.on('close', () => {
      auditor.removeSseClient(res);
    });
    return;
  }

  // 4. Accounts List
  if (pathname === '/api/accounts' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      data: accountManager.getAccountsState()
    });
  }

  // 5. Switch Account
  if (pathname === '/api/accounts/switch' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.email) {
      return sendJson(res, 400, { success: false, error: 'Email parameter required' });
    }
    const result = accountManager.switchAccount(body.email);
    return sendJson(res, 200, { success: true, accounts: result });
  }

  // 6. Check & Auto-shift Account
  if (pathname === '/api/accounts/auto-shift' && req.method === 'POST') {
    const result = accountManager.checkAndAutoShift();
    return sendJson(res, 200, { success: true, result });
  }

  // 7. Run Full Pipeline
  if (pathname === '/api/pipeline/run' && req.method === 'POST') {
    const body = await parseBody(req);
    const theme = body.theme || 'alexandria';
    // Run asynchronously so response is fast
    pipelineManager.runFullAutonomousPipeline(theme).catch(e => {
      auditor.error('API', `Pipeline error: ${e.message}`);
    });
    return sendJson(res, 200, {
      success: true,
      message: 'Autonomous Pipeline triggered. Follow live logs below.'
    });
  }

  // 8. Generate Prompts Only
  if (pathname === '/api/pipeline/generate-prompts' && req.method === 'POST') {
    const body = await parseBody(req);
    const theme = body.theme || 'alexandria';
    const result = await pipelineManager.generatePrompts(theme);
    return sendJson(res, 200, { success: true, result });
  }

  // 9. Merge Videos Only
  if (pathname === '/api/pipeline/merge' && req.method === 'POST') {
    const result = await pipelineManager.mergeClips();
    return sendJson(res, 200, { success: true, result });
  }

  // 10. Queue Upload Only
  if (pathname === '/api/pipeline/queue-upload' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = await pipelineManager.queueForUpload(body.videoPath);
    return sendJson(res, 200, { success: true, result });
  }

  // 11. Add Custom Agent Log
  if (pathname === '/api/logs/record' && req.method === 'POST') {
    const body = await parseBody(req);
    const entry = auditor.log(body.level || 'STEP', body.subsystem || 'AGENT', body.message || 'Custom Step', body.data);
    return sendJson(res, 200, { success: true, entry });
  }

  // --- STATIC FILES ROUTING ---
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  serveStatic(res, filePath, contentType);
});

function startServer() {
  server.listen(PORT, HOST, () => {
    auditor.success('SERVER', `🌐 Antigravity All In One Suite GUI Auditor active at http://${HOST}:${PORT}`);
    console.log(`\n======================================================`);
    console.log(`🚀 ALL IN ONE ANTIGRAVITY MASTER SUITE IS LIVE!`);
    console.log(`📡 URL: http://${HOST}:${PORT}`);
    console.log(`======================================================\n`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  server,
  PORT,
  HOST
};
