#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

const APP_ROOT = path.resolve(__dirname, '..');

// Import core modules for fallback direct execution
const { paths, loadSettings, saveSettings } = require(path.join(APP_ROOT, 'config'));
const { log, setStatus, getStatus, getLogs, clearLogs } = require(path.join(APP_ROOT, 'logger'));
const { checkAuthStatus, openLoginWindow, cleanupOrphanedChrome } = require(path.join(APP_ROOT, 'browser'));
const { probeVideo, formatUploadMetadata } = require(path.join(APP_ROOT, 'metadataManager'));
const { uploadVideoToYoutube, stopCurrentUpload, getIsUploading } = require(path.join(APP_ROOT, 'uploaderEngine'));
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
} = require(path.join(APP_ROOT, 'queueManager'));

const DEFAULT_BRIDGE_PORT = 48292;

function getBridgeInfo() {
  try {
    if (fs.existsSync(paths.BRIDGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(paths.BRIDGE_FILE, 'utf8'));
      if (data && data.port) return data;
    }
  } catch (e) {}
  return { port: DEFAULT_BRIDGE_PORT, url: `http://127.0.0.1:${DEFAULT_BRIDGE_PORT}` };
}

function callBridge(method, endpoint, body = null, timeout = 3000) {
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

// MCP Tools Definition
const TOOLS = [
  {
    name: 'youtube_get_status',
    description: 'Get live status of YouTube Uploader (running state, current status, queue count, pending count, history count).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_check_auth',
    description: 'Check if YouTube Studio session is authenticated, returning login state, channel name, and handle.',
    inputSchema: {
      type: 'object',
      properties: {
        headless: {
          type: 'boolean',
          description: 'Run browser check headlessly (default: true).'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_open_login',
    description: 'Launch headful Chrome browser window navigating to YouTube Studio so the user can log into their Google/YouTube account.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_probe_video',
    description: 'Probe a video file with FFmpeg to extract duration, resolution, aspect ratio, and detect if it is a YouTube Shorts.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Full path to the MP4 video file to probe.'
        }
      },
      required: ['videoPath']
    }
  },
  {
    name: 'youtube_upload_video',
    description: 'Upload a single video to YouTube Studio with automatic or custom metadata, shorts detection, and visibility.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to the video file to upload.'
        },
        title: {
          type: 'string',
          description: 'Custom video title (optional; automatically generated from prompt or filename if omitted).'
        },
        description: {
          type: 'string',
          description: 'Custom video description (optional).'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags (e.g. ["Shorts", "AI", "NexusFlow"]).'
        },
        visibility: {
          type: 'string',
          enum: ['public', 'unlisted', 'private'],
          description: 'Video visibility (default: public).'
        },
        headless: {
          type: 'boolean',
          description: 'Whether to run upload browser headlessly (default: from settings).'
        }
      },
      required: ['videoPath']
    }
  },
  {
    name: 'youtube_get_queue',
    description: 'List all video items currently in the upload queue.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_add_to_queue',
    description: 'Add a video or multiple videos to the upload queue.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to the video file.'
        },
        title: {
          type: 'string',
          description: 'Optional custom title.'
        },
        description: {
          type: 'string',
          description: 'Optional custom description.'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of tags.'
        },
        visibility: {
          type: 'string',
          enum: ['public', 'unlisted', 'private'],
          description: 'Optional visibility (public/unlisted/private).'
        }
      },
      required: ['videoPath']
    }
  },
  {
    name: 'youtube_remove_from_queue',
    description: 'Remove a video item from the upload queue by its queue ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique queue item ID to remove.'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'youtube_clear_queue',
    description: 'Clear the upload queue (either all items or only completed items).',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['all', 'completed'],
          description: 'Mode: "all" clears everything; "completed" only removes uploaded items.'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_start_queue',
    description: 'Start processing and uploading all pending videos in the upload queue.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_stop_upload',
    description: 'Stop active video upload or queue processing immediately.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_get_history',
    description: 'Retrieve upload history, including video titles, YouTube URLs, timestamps, and status.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_clear_history',
    description: 'Clear the upload history log.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_scan_nexusflow_videos',
    description: 'Scan NexusFlow Result and Output directories to identify generated videos that have not yet been uploaded to YouTube.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_queue_nexusflow_videos',
    description: 'Automatically scan and queue all unuploaded NexusFlow videos with auto-generated titles, tags, and Shorts tags.',
    inputSchema: {
      type: 'object',
      properties: {
        includeOutputs: {
          type: 'boolean',
          description: 'Include individual prompt output clips (default: true).'
        },
        includeResults: {
          type: 'boolean',
          description: 'Include merged full result videos (default: true).'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_get_config',
    description: 'Retrieve current YouTube Uploader configuration settings and directories.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_update_config',
    description: 'Update YouTube Uploader settings (defaultVisibility, uploadDelaySec, autoShortsDetection, addShortsTag, defaultTags).',
    inputSchema: {
      type: 'object',
      properties: {
        defaultVisibility: {
          type: 'string',
          enum: ['public', 'unlisted', 'private']
        },
        uploadDelaySec: {
          type: 'number',
          description: 'Cooldown in seconds between queue uploads.'
        },
        autoShortsDetection: {
          type: 'boolean'
        },
        addShortsTag: {
          type: 'boolean'
        },
        defaultTags: {
          type: 'array',
          items: { type: 'string' }
        },
        headless: {
          type: 'boolean'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_get_logs',
    description: 'Retrieve recent execution and error logs.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max number of log entries to retrieve (default: 50).'
        },
        level: {
          type: 'string',
          enum: ['info', 'warn', 'error', 'success'],
          description: 'Filter logs by level.'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_launch_app',
    description: 'Launch the YouTube Uploader Electron GUI application if closed.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Handle tool execution with Bridge first, then direct fallback
async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'youtube_get_status': {
      try {
        return await callBridge('GET', '/api/status');
      } catch (e) {
        const queue = getQueue();
        const history = getHistory();
        return {
          success: true,
          status: getStatus(),
          isUploading: isQueueRunning(),
          queueCount: queue.length,
          pendingCount: queue.filter(q => q.status === 'pending').length,
          historyCount: history.length,
          bridgeRunning: false
        };
      }
    }

    case 'youtube_check_auth': {
      try {
        return await callBridge('GET', '/api/auth/status');
      } catch (e) {
        const headless = args.headless !== undefined ? args.headless : true;
        return await checkAuthStatus(headless);
      }
    }

    case 'youtube_open_login': {
      try {
        return await callBridge('POST', '/api/auth/login');
      } catch (e) {
        openLoginWindow().catch(() => {});
        return {
          success: true,
          message: 'Headful login window opened in Chrome. Please complete sign-in in browser.'
        };
      }
    }

    case 'youtube_probe_video': {
      try {
        return await callBridge('POST', '/api/probe', { videoPath: args.videoPath });
      } catch (e) {
        const probe = await probeVideo(args.videoPath);
        const meta = formatUploadMetadata({ videoPath: args.videoPath, probeData: probe });
        return { success: true, probe, meta };
      }
    }

    case 'youtube_upload_video': {
      try {
        return await callBridge('POST', '/api/upload/single', args);
      } catch (e) {
        // Direct execution
        return await uploadVideoToYoutube(args);
      }
    }

    case 'youtube_get_queue': {
      try {
        return await callBridge('GET', '/api/queue');
      } catch (e) {
        return { success: true, queue: getQueue() };
      }
    }

    case 'youtube_add_to_queue': {
      try {
        return await callBridge('POST', '/api/queue/add', args);
      } catch (e) {
        const added = await addToQueue(args);
        return { success: true, added };
      }
    }

    case 'youtube_remove_from_queue': {
      try {
        return await callBridge('POST', '/api/queue/remove', { id: args.id });
      } catch (e) {
        const ok = removeFromQueue(args.id);
        return { success: ok };
      }
    }

    case 'youtube_clear_queue': {
      try {
        return await callBridge('POST', '/api/queue/clear', { mode: args.mode || 'all' });
      } catch (e) {
        clearQueue(args.mode || 'all');
        return { success: true, message: 'Queue cleared.' };
      }
    }

    case 'youtube_start_queue': {
      try {
        return await callBridge('POST', '/api/upload/start');
      } catch (e) {
        return await startQueueProcessing();
      }
    }

    case 'youtube_stop_upload': {
      try {
        return await callBridge('POST', '/api/upload/stop');
      } catch (e) {
        return stopQueueProcessing();
      }
    }

    case 'youtube_get_history': {
      try {
        return await callBridge('GET', '/api/history');
      } catch (e) {
        return { success: true, history: getHistory() };
      }
    }

    case 'youtube_clear_history': {
      try {
        return await callBridge('POST', '/api/history/clear');
      } catch (e) {
        clearHistory();
        return { success: true, message: 'History cleared.' };
      }
    }

    case 'youtube_scan_nexusflow_videos': {
      try {
        return await callBridge('GET', '/api/nexusflow/scan');
      } catch (e) {
        return await scanNexusFlowVideos();
      }
    }

    case 'youtube_queue_nexusflow_videos': {
      try {
        return await callBridge('POST', '/api/nexusflow/queue', args);
      } catch (e) {
        return await queueNexusFlowVideos(args);
      }
    }

    case 'youtube_get_config': {
      try {
        return await callBridge('GET', '/api/config');
      } catch (e) {
        return { success: true, paths, settings: loadSettings() };
      }
    }

    case 'youtube_update_config': {
      try {
        return await callBridge('POST', '/api/config', args);
      } catch (e) {
        const updated = saveSettings(args);
        return { success: true, settings: updated };
      }
    }

    case 'youtube_get_logs': {
      const limit = args.limit || 50;
      const level = args.level || null;
      try {
        return await callBridge('GET', `/api/logs?limit=${limit}${level ? `&level=${level}` : ''}`);
      } catch (e) {
        return { success: true, logs: getLogs(limit, level) };
      }
    }

    case 'youtube_launch_app': {
      const npxCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const child = spawn(npxCmd, ['start'], {
        cwd: APP_ROOT,
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.unref();
      return { success: true, message: 'Launched YouTube Uploader GUI application.' };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio protocol
function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
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

  switch (method) {
    case 'initialize': {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'youtube-uploader',
          version: '1.0.0'
        }
      });
      break;
    }

    case 'notifications/initialized': {
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

process.on('unhandledRejection', (err) => {
  process.stderr.write(`[YouTube Uploader MCP Error] ${err ? err.stack || err : ''}\n`);
});
