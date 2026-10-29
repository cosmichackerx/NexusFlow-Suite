const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const {
  paths,
  getActiveCooldown,
  setActiveCooldown,
  updatePaths,
  loadSettings
} = require('./config');
const {
  getAccountsData,
  getActiveAccount,
  setActiveAccount,
  getAutoSwitch,
  setAutoSwitch,
  broadcastAccounts
} = require('./accounts');
const { syncCredits } = require('./credits');
const {
  loadPrompt,
  getPromptStats,
  broadcastPromptStats,
  findExistingVideoForIndex
} = require('./promptManager');
const {
  startAutomation,
  stopAutomation,
  isAutomationRunning
} = require('./automationEngine');
const { combineVideosLossless } = require('./videoMerger');
const { log, setStatus, getStatus, getLogs } = require('./logger');
const { loadProjects, clearProjects, getPromptHash } = require('./projectTracker');

const DEFAULT_PORT = 48291;
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
        const stats = getPromptStats();
        return sendJson(res, 200, {
          success: true,
          isRunning: isAutomationRunning(),
          status: getStatus(),
          activeAccount: getActiveAccount(),
          autoSwitchOnLowCredits: getAutoSwitch(),
          cooldown: getActiveCooldown(),
          promptStats: stats
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

      // 3. GET /api/accounts
      if (req.method === 'GET' && pathname === '/api/accounts') {
        return sendJson(res, 200, {
          success: true,
          data: getAccountsData()
        });
      }

      // 4. POST /api/accounts/switch
      if (req.method === 'POST' && pathname === '/api/accounts/switch') {
        const body = await parseJsonBody(req);
        if (!body.email) return sendJson(res, 400, { success: false, error: 'Email is required' });
        setActiveAccount(body.email);
        broadcastAccounts();
        const credits = await syncCredits(true, body.email);
        return sendJson(res, 200, {
          success: true,
          activeAccount: body.email,
          credits,
          accounts: getAccountsData()
        });
      }

      // 5. POST /api/accounts/sync
      if (req.method === 'POST' && pathname === '/api/accounts/sync') {
        const body = await parseJsonBody(req);
        const targetEmail = body.email || getActiveAccount();
        const credits = await syncCredits(true, targetEmail);
        return sendJson(res, 200, {
          success: true,
          email: targetEmail,
          credits,
          accounts: getAccountsData()
        });
      }

      // 6. POST /api/accounts/auto-switch
      if (req.method === 'POST' && pathname === '/api/accounts/auto-switch') {
        const body = await parseJsonBody(req);
        const enabled = Boolean(body.enabled);
        setAutoSwitch(enabled);
        broadcastAccounts();
        return sendJson(res, 200, {
          success: true,
          autoSwitchOnLowCredits: enabled
        });
      }

      // 7. GET /api/prompts
      if (req.method === 'GET' && pathname === '/api/prompts') {
        let text = '';
        if (fs.existsSync(paths.PROMPT_FILE)) {
          text = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
        }
        const prompts = text.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(Boolean);
        const detailed = prompts.map((p, idx) => {
          const videoFile = findExistingVideoForIndex(paths.OUTPUT_DIR, idx, p);
          return {
            index: idx,
            promptNumber: idx + 1,
            text: p,
            hash: getPromptHash(p),
            charCount: p.length,
            hasVideo: Boolean(videoFile),
            videoFile: videoFile ? path.basename(videoFile) : null
          };
        });
        return sendJson(res, 200, {
          success: true,
          total: prompts.length,
          prompts: detailed,
          rawText: text
        });
      }

      // 8. POST /api/prompts (replace all)
      if (req.method === 'POST' && pathname === '/api/prompts') {
        const body = await parseJsonBody(req);
        let newContent = '';
        if (Array.isArray(body.prompts)) {
          newContent = body.prompts.map(p => p.trim()).filter(Boolean).join('\n\n');
        } else if (typeof body.text === 'string') {
          newContent = body.text;
        } else {
          return sendJson(res, 400, { success: false, error: 'Provide "text" (string) or "prompts" (array)' });
        }
        fs.writeFileSync(paths.PROMPT_FILE, newContent, 'utf8');
        loadPrompt();
        broadcastPromptStats();
        return sendJson(res, 200, {
          success: true,
          message: 'Prompts updated successfully',
          stats: getPromptStats()
        });
      }

      // 9. POST /api/prompts/update (single prompt)
      if (req.method === 'POST' && pathname === '/api/prompts/update') {
        const body = await parseJsonBody(req);
        const idx = parseInt(body.index, 10);
        if (isNaN(idx) || !body.text) {
          return sendJson(res, 400, { success: false, error: 'Index (integer) and text (string) are required' });
        }
        let text = fs.existsSync(paths.PROMPT_FILE) ? fs.readFileSync(paths.PROMPT_FILE, 'utf8') : '';
        const prompts = text.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(Boolean);
        if (idx < 0 || idx >= prompts.length) {
          return sendJson(res, 400, { success: false, error: `Index ${idx} out of range (0..${prompts.length - 1})` });
        }
        prompts[idx] = body.text.trim();
        fs.writeFileSync(paths.PROMPT_FILE, prompts.join('\n\n'), 'utf8');
        loadPrompt();
        broadcastPromptStats();
        return sendJson(res, 200, {
          success: true,
          message: `Prompt ${idx + 1} updated`,
          stats: getPromptStats()
        });
      }

      // 10. POST /api/prompts/append
      if (req.method === 'POST' && pathname === '/api/prompts/append') {
        const body = await parseJsonBody(req);
        if (!body.text || !body.text.trim()) {
          return sendJson(res, 400, { success: false, error: 'Text is required' });
        }
        let text = fs.existsSync(paths.PROMPT_FILE) ? fs.readFileSync(paths.PROMPT_FILE, 'utf8').trim() : '';
        const updated = text ? `${text}\n\n${body.text.trim()}` : body.text.trim();
        fs.writeFileSync(paths.PROMPT_FILE, updated, 'utf8');
        loadPrompt();
        broadcastPromptStats();
        return sendJson(res, 200, {
          success: true,
          message: 'Prompt appended successfully',
          stats: getPromptStats()
        });
      }

      // 11. POST /api/automation/start
      if (req.method === 'POST' && pathname === '/api/automation/start') {
        if (isAutomationRunning()) {
          return sendJson(res, 409, { success: false, error: 'Automation is already running' });
        }
        const body = await parseJsonBody(req);
        const accountsData = getAccountsData();
        const activeObj = accountsData.accounts.find(a => a.email.toLowerCase() === (accountsData.activeAccount || '').toLowerCase());
        const credits = body.credits !== undefined ? parseInt(body.credits, 10) : (activeObj ? activeObj.credits : 0);
        const cooldown = body.cooldown !== undefined ? parseInt(body.cooldown, 10) : getActiveCooldown();
        const configOptions = body.configOptions || null;

        // Launch automation in background
        setImmediate(async () => {
          try {
            await startAutomation(credits, cooldown, configOptions);
          } catch (e) {
            log('error', `Bridge automation error: ${e.message}`);
          }
        });

        return sendJson(res, 200, {
          success: true,
          message: 'Automation started successfully',
          credits,
          cooldown
        });
      }

      // 12. POST /api/automation/stop
      if (req.method === 'POST' && pathname === '/api/automation/stop') {
        const result = stopAutomation();
        return sendJson(res, 200, result);
      }

      // 13. POST /api/videos/merge
      if (req.method === 'POST' && pathname === '/api/videos/merge') {
        const body = await parseJsonBody(req);
        let promptText = fs.existsSync(paths.PROMPT_FILE) ? fs.readFileSync(paths.PROMPT_FILE, 'utf8') : '';
        const prompts = promptText.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(Boolean);
        const validVideos = [];
        for (let j = 0; j < prompts.length; j++) {
          const vidPath = findExistingVideoForIndex(paths.OUTPUT_DIR, j, prompts[j]);
          if (vidPath && fs.existsSync(vidPath)) {
            validVideos.push(vidPath);
          }
        }
        if (validVideos.length === 0) {
          return sendJson(res, 400, { success: false, error: 'No valid videos found in Output directory to merge.' });
        }
        const targetOutput = body.outputPath || path.join(paths.RESULT_DIR, 'Combined_Video_Full.mp4');
        const mergedPath = await combineVideosLossless(validVideos, targetOutput);
        return sendJson(res, 200, {
          success: true,
          mergedVideo: mergedPath,
          sourceVideos: validVideos
        });
      }

      // 14. GET /api/videos/output
      if (req.method === 'GET' && pathname === '/api/videos/output') {
        const items = [];
        if (fs.existsSync(paths.OUTPUT_DIR)) {
          const files = fs.readdirSync(paths.OUTPUT_DIR).filter(f => f.toLowerCase().endsWith('.mp4'));
          for (const f of files) {
            const fullPath = path.join(paths.OUTPUT_DIR, f);
            const stats = fs.statSync(fullPath);
            items.push({
              name: f,
              path: fullPath,
              sizeBytes: stats.size,
              sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
              modified: stats.mtime.toISOString()
            });
          }
        }
        return sendJson(res, 200, {
          success: true,
          count: items.length,
          outputDir: paths.OUTPUT_DIR,
          videos: items
        });
      }

      // 15. GET /api/videos/result
      if (req.method === 'GET' && pathname === '/api/videos/result') {
        const items = [];
        const archiveItems = [];
        if (fs.existsSync(paths.RESULT_DIR)) {
          const files = fs.readdirSync(paths.RESULT_DIR).filter(f => f.toLowerCase().endsWith('.mp4'));
          for (const f of files) {
            const fullPath = path.join(paths.RESULT_DIR, f);
            const stats = fs.statSync(fullPath);
            items.push({
              name: f,
              path: fullPath,
              sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
              modified: stats.mtime.toISOString()
            });
          }
          const archiveDir = path.join(paths.RESULT_DIR, 'Archive');
          if (fs.existsSync(archiveDir)) {
            const arcFiles = fs.readdirSync(archiveDir).filter(f => f.toLowerCase().endsWith('.mp4'));
            for (const f of arcFiles) {
              const fullPath = path.join(archiveDir, f);
              const stats = fs.statSync(fullPath);
              archiveItems.push({
                name: f,
                path: fullPath,
                sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
                modified: stats.mtime.toISOString()
              });
            }
          }
        }
        return sendJson(res, 200, {
          success: true,
          resultDir: paths.RESULT_DIR,
          results: items,
          archives: archiveItems
        });
      }

      // 16. GET /api/config
      if (req.method === 'GET' && pathname === '/api/config') {
        return sendJson(res, 200, {
          success: true,
          paths: {
            promptFile: paths.PROMPT_FILE,
            outputDir: paths.OUTPUT_DIR,
            resultDir: paths.RESULT_DIR,
            framesDir: paths.FRAMES_DIR
          },
          cooldown: getActiveCooldown(),
          autoSwitchOnLowCredits: getAutoSwitch(),
          settings: loadSettings()
        });
      }

      // 17. POST /api/config
      if (req.method === 'POST' && pathname === '/api/config') {
        const body = await parseJsonBody(req);
        if (body.promptFile || body.outputDir || body.resultDir || body.framesDir) {
          updatePaths(
            body.promptFile || paths.PROMPT_FILE,
            body.outputDir || paths.OUTPUT_DIR,
            body.resultDir || paths.RESULT_DIR,
            body.framesDir || paths.FRAMES_DIR
          );
        }
        if (body.cooldown !== undefined) {
          setActiveCooldown(body.cooldown);
        }
        if (body.autoSwitch !== undefined) {
          setAutoSwitch(Boolean(body.autoSwitch));
        }
        return sendJson(res, 200, {
          success: true,
          message: 'Config updated',
          paths,
          cooldown: getActiveCooldown(),
          autoSwitch: getAutoSwitch()
        });
      }

      // 18. GET /api/projects
      if (req.method === 'GET' && pathname === '/api/projects') {
        return sendJson(res, 200, {
          success: true,
          projects: loadProjects()
        });
      }

      // 19. POST /api/projects/clear
      if (req.method === 'POST' && pathname === '/api/projects/clear') {
        clearProjects();
        return sendJson(res, 200, {
          success: true,
          message: 'Tracked projects cleared'
        });
      }

      // Default 404
      return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      // If port in use, increment and retry
      activePort = activePort + 1;
      server.listen(activePort, '127.0.0.1');
    }
  });

  server.listen(activePort, '127.0.0.1', () => {
    // Write bridge info file so MCP server or CLI can locate active port
    try {
      const bridgeInfoPath = path.join(paths.USER_DATA_DIR, 'nexusflow-bridge.json');
      fs.writeFileSync(bridgeInfoPath, JSON.stringify({
        port: activePort,
        pid: process.pid,
        url: `http://127.0.0.1:${activePort}`,
        startedAt: new Date().toISOString()
      }, null, 2), 'utf8');
    } catch (e) {}
    log('info', `NexusFlow Local Bridge listening at http://127.0.0.1:${activePort}`);
  });
}

function stopBridge() {
  if (server) {
    try {
      server.close();
      const bridgeInfoPath = path.join(paths.USER_DATA_DIR, 'nexusflow-bridge.json');
      if (fs.existsSync(bridgeInfoPath)) fs.unlinkSync(bridgeInfoPath);
    } catch (e) {}
    server = null;
  }
}

module.exports = {
  startBridge,
  stopBridge,
  DEFAULT_PORT
};
