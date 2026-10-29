#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

// Root of NexusFlow app
const APP_ROOT = path.resolve(__dirname, '..');

// Import core modules for fallback direct execution
const {
  paths,
  getActiveCooldown,
  setActiveCooldown,
  updatePaths,
  loadSettings
} = require(path.join(APP_ROOT, 'config'));
const {
  getAccountsData,
  getActiveAccount,
  setActiveAccount,
  getAutoSwitch,
  setAutoSwitch,
  broadcastAccounts
} = require(path.join(APP_ROOT, 'accounts'));
const {
  loadPrompt,
  getPromptStats,
  broadcastPromptStats,
  findExistingVideoForIndex
} = require(path.join(APP_ROOT, 'promptManager'));
const { combineVideosLossless } = require(path.join(APP_ROOT, 'videoMerger'));
const { getStatus, getLogs } = require(path.join(APP_ROOT, 'logger'));
const { loadProjects, clearProjects, getPromptHash } = require(path.join(APP_ROOT, 'projectTracker'));

const DEFAULT_BRIDGE_PORT = 48291;

function getBridgeInfo() {
  try {
    const bridgeFile = path.join(paths.USER_DATA_DIR, 'nexusflow-bridge.json');
    if (fs.existsSync(bridgeFile)) {
      const data = JSON.parse(fs.readFileSync(bridgeFile, 'utf8'));
      if (data && data.port) return data;
    }
  } catch (e) {}
  return { port: DEFAULT_BRIDGE_PORT, url: `http://127.0.0.1:${DEFAULT_BRIDGE_PORT}` };
}

function callBridge(method, endpoint, body = null, timeout = 2500) {
  return new Promise((resolve, reject) => {
    const bridge = getBridgeInfo();
    const parsed = new URL(endpoint, bridge.url);
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

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Bridge timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Tool Definitions
const TOOLS = [
  {
    name: 'nexusflow_get_status',
    description: 'Get live status of NexusFlow (running state, current prompt index, progress percentage, active account, credits, cooldown, timer, and prompt stats).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_get_logs',
    description: 'Retrieve recent system, automation, and error logs from NexusFlow.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of recent log lines to retrieve (default: 50).' },
        level: { type: 'string', enum: ['info', 'warn', 'error', 'success'], description: 'Optional log level filter.' }
      },
      required: []
    }
  },
  {
    name: 'nexusflow_list_accounts',
    description: 'List all configured Google accounts with their plan, credits, last synced timestamp, and active status.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_switch_account',
    description: 'Switch the active Google account in NexusFlow and trigger an automated credit sync.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'The Google account email to switch to.' }
      },
      required: ['email']
    }
  },
  {
    name: 'nexusflow_sync_credits',
    description: 'Force a live credit check from Google One for an account or the active account.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Google account email (optional, defaults to active account).' }
      },
      required: []
    }
  },
  {
    name: 'nexusflow_set_auto_switch',
    description: 'Enable or disable automatic switching to an account with available credits when remaining credits drop below 10.',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Whether to enable auto-switch on low credits.' }
      },
      required: ['enabled']
    }
  },
  {
    name: 'nexusflow_get_prompts',
    description: 'Read all prompts from Prompt.txt with index numbers, hashes, character counts, and video existence status in Output.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_update_prompt',
    description: 'Update a specific prompt in Prompt.txt by its 0-based index.',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'integer', description: '0-based index of the prompt to update.' },
        promptText: { type: 'string', description: 'The new prompt text.' }
      },
      required: ['index', 'promptText']
    }
  },
  {
    name: 'nexusflow_set_all_prompts',
    description: 'Replace all prompts in Prompt.txt with a new list or string of prompts (separated by double newlines).',
    inputSchema: {
      type: 'object',
      properties: {
        prompts: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string' }
          ],
          description: 'Array of prompt strings or a single multi-line prompt text.'
        }
      },
      required: ['prompts']
    }
  },
  {
    name: 'nexusflow_append_prompt',
    description: 'Append a new video prompt to the end of Prompt.txt.',
    inputSchema: {
      type: 'object',
      properties: {
        promptText: { type: 'string', description: 'The prompt text to append.' }
      },
      required: ['promptText']
    }
  },
  {
    name: 'nexusflow_start_automation',
    description: 'Start Google Flow video generation automation batch in NexusFlow.',
    inputSchema: {
      type: 'object',
      properties: {
        credits: { type: 'integer', description: 'Total credits override (optional, defaults to live account credits).' },
        cooldown: { type: 'integer', description: 'Cooldown period between video requests in seconds (defaults to 10).' },
        confirmBeforeGenerating: { type: 'string', enum: ['true', 'false'], description: 'Confirm before generating option.' },
        aspectRatio: { type: 'string', enum: ['9:16', '16:9'], description: 'Aspect ratio.' },
        count: { type: 'string', enum: ['1', '2', '3', '4'], description: 'Video count.' },
        model: { type: 'string', enum: ['Veo 2', 'Veo 3'], description: 'Model choice.' }
      },
      required: []
    }
  },
  {
    name: 'nexusflow_stop_automation',
    description: 'Safely halt active automation immediately and release browser resources.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_list_output_videos',
    description: 'List individual generated video files in the Output folder with file sizes and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_list_result_videos',
    description: 'List combined long video files in the Result folder and in Result/Archive.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_merge_videos',
    description: 'Losslessly concatenate all valid Output video files into Combined_Video_Full.mp4 in Result folder using bit-exact stream copy (-c copy).',
    inputSchema: {
      type: 'object',
      properties: {
        outputPath: { type: 'string', description: 'Optional target path for merged video (defaults to Result/Combined_Video_Full.mp4).' }
      },
      required: []
    }
  },
  {
    name: 'nexusflow_get_config',
    description: 'Get current directory paths, default cooldown, auto-switch status, and user settings.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_update_config',
    description: 'Update application configuration (promptFile, outputDir, resultDir, framesDir, cooldown, autoSwitch).',
    inputSchema: {
      type: 'object',
      properties: {
        promptFile: { type: 'string', description: 'Path to Prompt.txt file.' },
        outputDir: { type: 'string', description: 'Path to Output directory.' },
        resultDir: { type: 'string', description: 'Path to Result directory.' },
        framesDir: { type: 'string', description: 'Path to Frames directory.' },
        cooldown: { type: 'integer', description: 'Cooldown period between video generations in seconds.' },
        autoSwitch: { type: 'boolean', description: 'Enable or disable account auto-switching on low credits.' }
      },
      required: []
    }
  },
  {
    name: 'nexusflow_list_tracked_projects',
    description: 'List saved Google Flow project URLs recorded by the Credit Rescue system.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_clear_tracked_projects',
    description: 'Clear recorded Google Flow project URLs to force fresh project creation.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'nexusflow_launch_app',
    description: 'Launch the NexusFlow Electron GUI application window if it is not currently open.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Tool Execution Dispatcher
async function handleToolCall(rawName, args) {
  const name = rawName.startsWith('nexusflow_') ? rawName.slice('nexusflow_'.length) : rawName;
  switch (name) {
    case 'get_status': case 'nexusflow_get_status': {
      try {
        const res = await callBridge('GET', '/api/status');
        return res;
      } catch (e) {
        // Fallback: direct disk read
        const stats = getPromptStats();
        const accountsData = getAccountsData();
        return {
          appRunning: false,
          bridgeStatus: 'offline (read from disk)',
          status: getStatus(),
          activeAccount: accountsData.activeAccount,
          autoSwitchOnLowCredits: accountsData.autoSwitchOnLowCredits,
          cooldown: getActiveCooldown(),
          promptStats: stats
        };
      }
    }

    case 'get_logs': case 'nexusflow_get_logs': {
      try {
        const limit = args.limit || 50;
        const level = args.level ? `&level=${args.level}` : '';
        const res = await callBridge('GET', `/api/logs?limit=${limit}${level}`);
        return res;
      } catch (e) {
        return {
          appRunning: false,
          logs: getLogs(args.limit || 50, args.level || null)
        };
      }
    }

    case 'list_accounts': case 'nexusflow_list_accounts': {
      try {
        const res = await callBridge('GET', '/api/accounts');
        return res.data;
      } catch (e) {
        return getAccountsData();
      }
    }

    case 'switch_account': case 'nexusflow_switch_account': {
      try {
        const res = await callBridge('POST', '/api/accounts/switch', { email: args.email });
        return res;
      } catch (e) {
        setActiveAccount(args.email);
        return {
          success: true,
          mode: 'offline updated',
          activeAccount: args.email,
          accounts: getAccountsData()
        };
      }
    }

    case 'sync_credits': case 'nexusflow_sync_credits': {
      try {
        const res = await callBridge('POST', '/api/accounts/sync', { email: args.email });
        return res;
      } catch (e) {
        const { syncCredits } = require(path.join(APP_ROOT, 'credits'));
        const credits = await syncCredits(true, args.email || getActiveAccount());
        return {
          success: true,
          mode: 'standalone browser sync',
          email: args.email || getActiveAccount(),
          credits
        };
      }
    }

    case 'set_auto_switch': case 'nexusflow_set_auto_switch': {
      try {
        const res = await callBridge('POST', '/api/accounts/auto-switch', { enabled: args.enabled });
        return res;
      } catch (e) {
        setAutoSwitch(Boolean(args.enabled));
        return {
          success: true,
          autoSwitchOnLowCredits: Boolean(args.enabled)
        };
      }
    }

    case 'get_prompts': case 'nexusflow_get_prompts': {
      try {
        const res = await callBridge('GET', '/api/prompts');
        return res;
      } catch (e) {
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
        return {
          success: true,
          total: prompts.length,
          prompts: detailed,
          rawText: text
        };
      }
    }

    case 'update_prompt': case 'nexusflow_update_prompt': {
      try {
        const res = await callBridge('POST', '/api/prompts/update', { index: args.index, text: args.promptText });
        return res;
      } catch (e) {
        let text = fs.existsSync(paths.PROMPT_FILE) ? fs.readFileSync(paths.PROMPT_FILE, 'utf8') : '';
        const prompts = text.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(Boolean);
        if (args.index < 0 || args.index >= prompts.length) {
          throw new Error(`Index ${args.index} out of range (0..${prompts.length - 1})`);
        }
        prompts[args.index] = args.promptText.trim();
        fs.writeFileSync(paths.PROMPT_FILE, prompts.join('\n\n'), 'utf8');
        loadPrompt();
        return {
          success: true,
          message: `Prompt ${args.index + 1} updated`,
          stats: getPromptStats()
        };
      }
    }

    case 'set_all_prompts': case 'nexusflow_set_all_prompts': {
      try {
        const payload = Array.isArray(args.prompts) ? { prompts: args.prompts } : { text: args.prompts };
        const res = await callBridge('POST', '/api/prompts', payload);
        return res;
      } catch (e) {
        let newContent = Array.isArray(args.prompts)
          ? args.prompts.map(p => p.trim()).filter(Boolean).join('\n\n')
          : String(args.prompts);
        fs.writeFileSync(paths.PROMPT_FILE, newContent, 'utf8');
        loadPrompt();
        return {
          success: true,
          message: 'Prompts set successfully',
          stats: getPromptStats()
        };
      }
    }

    case 'append_prompt': case 'nexusflow_append_prompt': {
      try {
        const res = await callBridge('POST', '/api/prompts/append', { text: args.promptText });
        return res;
      } catch (e) {
        let text = fs.existsSync(paths.PROMPT_FILE) ? fs.readFileSync(paths.PROMPT_FILE, 'utf8').trim() : '';
        const updated = text ? `${text}\n\n${args.promptText.trim()}` : args.promptText.trim();
        fs.writeFileSync(paths.PROMPT_FILE, updated, 'utf8');
        loadPrompt();
        return {
          success: true,
          message: 'Prompt appended successfully',
          stats: getPromptStats()
        };
      }
    }

    case 'start_automation': case 'nexusflow_start_automation': {
      try {
        const res = await callBridge('POST', '/api/automation/start', {
          credits: args.credits,
          cooldown: args.cooldown,
          configOptions: {
            confirmBeforeGenerating: args.confirmBeforeGenerating || 'true',
            aspectRatio: args.aspectRatio || '9:16',
            count: args.count || '1',
            model: args.model || 'Veo 2'
          }
        });
        return res;
      } catch (e) {
        // Fallback: run standalone automation
        const { startAutomation } = require(path.join(APP_ROOT, 'automationEngine'));
        const accountsData = getAccountsData();
        const activeObj = accountsData.accounts.find(a => a.email.toLowerCase() === (accountsData.activeAccount || '').toLowerCase());
        const credits = args.credits !== undefined ? args.credits : (activeObj ? activeObj.credits : 0);
        const cooldown = args.cooldown !== undefined ? args.cooldown : getActiveCooldown();

        setImmediate(async () => {
          await startAutomation(credits, cooldown, {
            confirmBeforeGenerating: args.confirmBeforeGenerating || 'true',
            aspectRatio: args.aspectRatio || '9:16',
            count: args.count || '1',
            model: args.model || 'Veo 2'
          });
        });

        return {
          success: true,
          mode: 'standalone background automation started',
          credits,
          cooldown
        };
      }
    }

    case 'stop_automation': case 'nexusflow_stop_automation': {
      try {
        const res = await callBridge('POST', '/api/automation/stop');
        return res;
      } catch (e) {
        const { stopAutomation } = require(path.join(APP_ROOT, 'automationEngine'));
        return stopAutomation();
      }
    }

    case 'list_output_videos': case 'nexusflow_list_output_videos': {
      try {
        const res = await callBridge('GET', '/api/videos/output');
        return res;
      } catch (e) {
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
        return {
          success: true,
          count: items.length,
          outputDir: paths.OUTPUT_DIR,
          videos: items
        };
      }
    }

    case 'list_result_videos': case 'nexusflow_list_result_videos': {
      try {
        const res = await callBridge('GET', '/api/videos/result');
        return res;
      } catch (e) {
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
        return {
          success: true,
          resultDir: paths.RESULT_DIR,
          results: items,
          archives: archiveItems
        };
      }
    }

    case 'merge_videos': case 'nexusflow_merge_videos': {
      try {
        const res = await callBridge('POST', '/api/videos/merge', { outputPath: args.outputPath });
        return res;
      } catch (e) {
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
          throw new Error('No valid videos found in Output directory to merge.');
        }
        const targetOutput = args.outputPath || path.join(paths.RESULT_DIR, 'Combined_Video_Full.mp4');
        const mergedPath = await combineVideosLossless(validVideos, targetOutput);
        return {
          success: true,
          mergedVideo: mergedPath,
          sourceVideos: validVideos
        };
      }
    }

    case 'get_config': case 'nexusflow_get_config': {
      try {
        const res = await callBridge('GET', '/api/config');
        return res;
      } catch (e) {
        return {
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
        };
      }
    }

    case 'update_config': case 'nexusflow_update_config': {
      try {
        const res = await callBridge('POST', '/api/config', args);
        return res;
      } catch (e) {
        if (args.promptFile || args.outputDir || args.resultDir || args.framesDir) {
          updatePaths(
            args.promptFile || paths.PROMPT_FILE,
            args.outputDir || paths.OUTPUT_DIR,
            args.resultDir || paths.RESULT_DIR,
            args.framesDir || paths.FRAMES_DIR
          );
        }
        if (args.cooldown !== undefined) {
          setActiveCooldown(args.cooldown);
        }
        if (args.autoSwitch !== undefined) {
          setAutoSwitch(Boolean(args.autoSwitch));
        }
        return {
          success: true,
          paths,
          cooldown: getActiveCooldown(),
          autoSwitch: getAutoSwitch()
        };
      }
    }

    case 'list_tracked_projects': case 'nexusflow_list_tracked_projects': {
      try {
        const res = await callBridge('GET', '/api/projects');
        return res;
      } catch (e) {
        return {
          success: true,
          projects: loadProjects()
        };
      }
    }

    case 'clear_tracked_projects': case 'nexusflow_clear_tracked_projects': {
      try {
        const res = await callBridge('POST', '/api/projects/clear');
        return res;
      } catch (e) {
        clearProjects();
        return {
          success: true,
          message: 'Tracked projects cleared'
        };
      }
    }

    case 'launch_app': case 'nexusflow_launch_app': {
      const child = spawn('npx', ['electron', '.'], {
        cwd: APP_ROOT,
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      child.unref();
      return {
        success: true,
        message: 'NexusFlow application launched in background.'
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// MCP JSON-RPC 2.0 Protocol Handler
function sendResponse(id, result) {
  const msg = JSON.stringify({
    jsonrpc: '2.0',
    id,
    result
  });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  });
  process.stdout.write(msg + '\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    sendError(null, -32700, 'Parse error: invalid JSON');
    return;
  }

  const { id, method, params } = request;

  // Handle standard MCP methods
  switch (method) {
    case 'initialize': {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'nexusflow',
          version: '1.0.0'
        }
      });
      break;
    }

    case 'notifications/initialized': {
      // Notification from client, no response required
      break;
    }

    case 'ping': {
      sendResponse(id, {});
      break;
    }

    case 'tools/list': {
      sendResponse(id, {
        tools: TOOLS
      });
      break;
    }

    case 'tools/call': {
      if (!params || !params.name) {
        sendError(id, -32602, 'Invalid params: missing tool name');
        break;
      }

      try {
        const result = await handleToolCall(params.name, params.arguments || {});
        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        });
      } catch (err) {
        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: `Error executing ${params.name}: ${err.message}`
            }
          ],
          isError: true
        });
      }
      break;
    }

    default:
      if (id !== undefined && id !== null) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
      break;
  }
});

// Suppress unhandled rejections to prevent crashing the MCP process
process.on('unhandledRejection', (err) => {
  // log to stderr so it does not corrupt stdio JSON-RPC on stdout
  process.stderr.write(`[NexusFlow MCP Error] ${err ? err.stack || err : ''}\n`);
});
