const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const monitor = require('./studioMonitor');
const manager = require('./studioManager');
const bridge = require('./nexusflowBridge');

const PORT = config.server.port || 3800;
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data, null, 2));
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

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // API Endpoints
  if (url === '/api/state') {
    return sendJson(res, 200, monitor.state);
  }

  if (url === '/api/overview') {
    return sendJson(res, 200, monitor.getOverview());
  }

  if (url === '/api/latest') {
    return sendJson(res, 200, monitor.getLatestPerformance());
  }

  if (url === '/api/top') {
    return sendJson(res, 200, monitor.getTopContent());
  }

  if (url === '/api/monetization') {
    return sendJson(res, 200, monitor.getMonetizationStatus());
  }

  if (url === '/api/audit') {
    return sendJson(res, 200, monitor.auditPerformance());
  }

  if (url === '/api/sync' && req.method === 'POST') {
    const result = bridge.syncWithChannelLedger();
    return sendJson(res, 200, result);
  }

  if (url === '/api/comments/moderate') {
    return sendJson(res, 200, manager.moderateComments());
  }

  // Static Assets
  if (url === '/' || url === '/index.html') {
    return serveStatic(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html');
  }

  if (url === '/styles.css') {
    return serveStatic(res, path.join(PUBLIC_DIR, 'styles.css'), 'text/css');
  }

  if (url === '/dashboard.js') {
    return serveStatic(res, path.join(PUBLIC_DIR, 'dashboard.js'), 'application/javascript');
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  NexusFlow YouTube Studio Monitor & Manager`);
  console.log(`  Live Dashboard: http://localhost:${PORT}`);
  console.log(`  Channel: ${config.channel.name} (${config.channel.handle})`);
  console.log(`======================================================\n`);
});
