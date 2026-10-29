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

    server.on('close', (code) => {
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

// CLI parsing
async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
NexusFlow MCP Control CLI
Usage: node mcp/client.js <command> [options]

Commands:
  status                   - Live status of automation, accounts, and prompts
  logs [limit] [level]     - Fetch recent logs (e.g. logs 30 info)
  accounts                 - List registered Google accounts & credit status
  switch <email>           - Switch active Google account and sync
  sync [email]             - Scrape live credits from Google One
  auto-switch <true|false> - Toggle account auto-switching on low credits
  prompts                  - List all prompts and rendering status
  update-prompt <idx> <text> - Update specific prompt by index
  set-prompts <fileOrText> - Overwrite all prompts
  append-prompt <text>     - Add new prompt to end of batch
  start [cooldown]         - Start automation (default cooldown 10s)
  stop                     - Safely stop active automation
  outputs                  - List generated video clips in Output/
  results                  - List combined videos in Result/
  merge [outputPath]       - Losslessly combine output clips into full video
  config                   - Show active paths and settings
  projects                 - List saved Google Flow project URLs
  clear-projects           - Clear saved project URLs
  launch                   - Open the Electron desktop GUI
`);
    process.exit(0);
  }

  try {
    let result;
    switch (command) {
      case 'status':
      case 'get_status':
        result = await runMcpCommand('get_status');
        break;

      case 'logs':
      case 'get_logs':
        result = await runMcpCommand('get_logs', {
          limit: argv[1] ? parseInt(argv[1], 10) : 50,
          level: argv[2] || null
        });
        break;

      case 'accounts':
      case 'list_accounts':
        result = await runMcpCommand('list_accounts');
        break;

      case 'switch':
      case 'switch_account':
        if (!argv[1]) throw new Error('Email required: node mcp/client.js switch user@gmail.com');
        result = await runMcpCommand('switch_account', { email: argv[1] });
        break;

      case 'sync':
      case 'sync_credits':
        result = await runMcpCommand('sync_credits', { email: argv[1] || null });
        break;

      case 'auto-switch':
      case 'set_auto_switch':
        result = await runMcpCommand('set_auto_switch', { enabled: argv[1] !== 'false' });
        break;

      case 'prompts':
      case 'get_prompts':
        result = await runMcpCommand('get_prompts');
        break;

      case 'update-prompt':
      case 'update_prompt':
        if (!argv[1] || !argv[2]) throw new Error('Usage: node mcp/client.js update-prompt <index> "<new text>"');
        result = await runMcpCommand('update_prompt', {
          index: parseInt(argv[1], 10),
          promptText: argv.slice(2).join(' ')
        });
        break;

      case 'set-prompts':
      case 'set_all_prompts':
        if (!argv[1]) throw new Error('Usage: node mcp/client.js set-prompts "<prompts separated by double newlines>"');
        result = await runMcpCommand('set_all_prompts', { prompts: argv.slice(1).join(' ') });
        break;

      case 'append-prompt':
      case 'append_prompt':
        if (!argv[1]) throw new Error('Usage: node mcp/client.js append-prompt "<new prompt text>"');
        result = await runMcpCommand('append_prompt', { promptText: argv.slice(1).join(' ') });
        break;

      case 'start':
      case 'start_automation':
        result = await runMcpCommand('start_automation', {
          cooldown: argv[1] ? parseInt(argv[1], 10) : 10
        });
        break;

      case 'stop':
      case 'stop_automation':
        result = await runMcpCommand('stop_automation');
        break;

      case 'outputs':
      case 'list_output_videos':
        result = await runMcpCommand('list_output_videos');
        break;

      case 'results':
      case 'list_result_videos':
        result = await runMcpCommand('list_result_videos');
        break;

      case 'merge':
      case 'merge_videos':
        result = await runMcpCommand('merge_videos', { outputPath: argv[1] || null });
        break;

      case 'config':
      case 'get_config':
        result = await runMcpCommand('get_config');
        break;

      case 'projects':
      case 'list_tracked_projects':
        result = await runMcpCommand('list_tracked_projects');
        break;

      case 'clear-projects':
      case 'clear_tracked_projects':
        result = await runMcpCommand('clear_tracked_projects');
        break;

      case 'launch':
      case 'launch_app':
        result = await runMcpCommand('launch_app');
        break;

      default:
        // Direct tool name
        result = await runMcpCommand(command, argv[1] ? JSON.parse(argv[1]) : {});
        break;
    }

    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runMcpCommand
};
