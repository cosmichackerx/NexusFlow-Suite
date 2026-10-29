#!/usr/bin/env node
const cp = require('child_process');
const path = require('path');

const SERVER_PATH = path.join(__dirname, 'server.js');

function runMcpCommand(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const server = cp.spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    let resolved = false;

    const checkResolve = () => {
      if (resolved) return;
      const lines = output.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === 1) {
            resolved = true;
            if (parsed.error) return reject(new Error(parsed.error.message));
            if (parsed.result && parsed.result.content && parsed.result.content[0]) {
              const text = parsed.result.content[0].text;
              try {
                return resolve(JSON.parse(text));
              } catch (e) {
                return resolve(text);
              }
            }
            return resolve(parsed.result);
          }
        } catch (e) {}
      }
    };

    server.stdout.on('data', (d) => {
      output += d.toString();
      checkResolve();
    });

    server.stderr.on('data', (d) => {
      errorOutput += d.toString();
    });

    server.on('close', () => {
      if (!resolved) {
        checkResolve();
        if (!resolved) resolve(output || errorOutput);
      }
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
NexusFlow YouTube Uploader MCP Control CLI
Usage: node mcp/client.js <command> [options]

Commands:
  status                   - Live status of uploader, queue, and history
  auth                     - Check YouTube Studio login & channel status
  login                    - Open headful browser window to log in
  probe <videoPath>        - Probe video metadata and shorts criteria
  upload <videoPath> [vis] - Upload a single video directly
  queue                    - Show all items in the upload queue
  add-queue <videoPath>    - Add a video to upload queue
  remove-queue <id>        - Remove item from queue by ID
  clear-queue [mode]       - Clear queue ('all' or 'completed')
  start-queue              - Start uploading pending queue items
  stop                     - Stop active upload or queue processing
  history                  - View previously uploaded videos and links
  clear-history            - Clear upload history
  scan                     - Scan NexusFlow Result/Output folders for new videos
  queue-nexusflow          - Automatically queue all unuploaded NexusFlow videos
  config                   - Show active configuration and paths
  logs [limit] [level]     - Fetch recent logs (e.g. logs 20 error)
  launch                   - Open the Electron GUI application
`);
    return;
  }

  try {
    let result;
    switch (command) {
      case 'status':
        result = await runMcpCommand('youtube_get_status');
        break;
      case 'auth':
        result = await runMcpCommand('youtube_check_auth');
        break;
      case 'login':
        result = await runMcpCommand('youtube_open_login');
        break;
      case 'probe':
        if (!argv[1]) throw new Error('Usage: probe <videoPath>');
        result = await runMcpCommand('youtube_probe_video', { videoPath: argv[1] });
        break;
      case 'upload':
        if (!argv[1]) throw new Error('Usage: upload <videoPath> [visibility]');
        result = await runMcpCommand('youtube_upload_video', {
          videoPath: argv[1],
          visibility: argv[2] || 'public'
        });
        break;
      case 'queue':
        result = await runMcpCommand('youtube_get_queue');
        break;
      case 'add-queue':
        if (!argv[1]) throw new Error('Usage: add-queue <videoPath>');
        result = await runMcpCommand('youtube_add_to_queue', { videoPath: argv[1] });
        break;
      case 'remove-queue':
        if (!argv[1]) throw new Error('Usage: remove-queue <id>');
        result = await runMcpCommand('youtube_remove_from_queue', { id: argv[1] });
        break;
      case 'clear-queue':
        result = await runMcpCommand('youtube_clear_queue', { mode: argv[1] || 'all' });
        break;
      case 'start-queue':
        result = await runMcpCommand('youtube_start_queue');
        break;
      case 'stop':
        result = await runMcpCommand('youtube_stop_upload');
        break;
      case 'history':
        result = await runMcpCommand('youtube_get_history');
        break;
      case 'clear-history':
        result = await runMcpCommand('youtube_clear_history');
        break;
      case 'scan':
        result = await runMcpCommand('youtube_scan_nexusflow_videos');
        break;
      case 'queue-nexusflow':
        result = await runMcpCommand('youtube_queue_nexusflow_videos');
        break;
      case 'config':
        result = await runMcpCommand('youtube_get_config');
        break;
      case 'logs':
        result = await runMcpCommand('youtube_get_logs', {
          limit: parseInt(argv[1], 10) || 50,
          level: argv[2] || null
        });
        break;
      case 'launch':
        result = await runMcpCommand('youtube_launch_app');
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMcpCommand };
