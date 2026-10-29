const { spawn, exec } = require('child_process');
const path = require('path');
const { startServer, PORT, HOST } = require('./server');
const auditor = require('./logAuditor');

auditor.step('LAUNCHER', 'Starting All In One Antigravity Suite & GUI Log Auditor...');

// Start the server
const server = startServer();

const targetUrl = `http://${HOST}:${PORT}`;

// Open browser after server starts
setTimeout(() => {
  auditor.info('LAUNCHER', `Launching GUI Log Auditor in default browser at ${targetUrl}`);
  const startCmd = process.platform === 'win32' ? `start "" "${targetUrl}"` : `open "${targetUrl}"`;
  exec(startCmd, (err) => {
    if (err) {
      auditor.warn('LAUNCHER', `Could not auto-open browser: ${err.message}. Open manually: ${targetUrl}`);
    } else {
      auditor.success('LAUNCHER', `GUI Log Auditor launched successfully!`);
    }
  });
}, 800);
