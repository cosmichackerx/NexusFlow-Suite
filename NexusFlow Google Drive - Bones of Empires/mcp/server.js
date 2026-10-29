#!/usr/bin/env node
const readline = require('readline');
const { exec } = require('child_process');
const driveManager = require('../driveManager');
const syncEngine = require('../syncEngine');
const config = require('../config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const tools = [
  {
    name: 'gdrive_bones_get_status',
    description: 'Get current Google Drive Bones of Empires status, folder ID, URL, tracked markdown files, and staged finished shorts.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gdrive_bones_get_channel_plan',
    description: 'Get the complete Bones of Empires Channel Master Plan, character bible for Marrow, production rules, and story arcs.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gdrive_bones_get_progress',
    description: 'Get the production progress ledger, active sprint status, and milestone goals.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gdrive_bones_get_shorts_metadata',
    description: 'Get publishing metadata (titles, descriptions, tags, pinned comments) for Bones of Empires YouTube Shorts.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gdrive_bones_stage_video',
    description: 'Stage the latest rendered and merged video from NexusFlow Result directory into Finished Shorts ready for Google Drive.',
    inputSchema: {
      type: 'object',
      properties: {
        canonicalName: { type: 'string', description: 'Target filename (e.g. BOE_EP01_Alexandria_The_Archimedes_Vault_9x16.mp4)' }
      }
    }
  },
  {
    name: 'gdrive_bones_generate_sync_manifest',
    description: 'Generate the complete file synchronization manifest between local NexusFlow storage and Google Drive Bones of Empires folder.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gdrive_bones_open_drive_folder',
    description: 'Open the official Bones of Empires Google Drive folder in the default browser.',
    inputSchema: { type: 'object', properties: {} }
  }
];

function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'nexusflow-gdrive-bones-of-empires',
          version: '1.0.0'
        }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;

    try {
      let result = null;

      switch (name) {
        case 'gdrive_bones_get_status':
          result = driveManager.getStatus();
          break;
        case 'gdrive_bones_get_channel_plan':
          result = { content: driveManager.getChannelPlan() };
          break;
        case 'gdrive_bones_get_progress':
          result = { content: driveManager.getProgress() };
          break;
        case 'gdrive_bones_get_shorts_metadata':
          result = { content: driveManager.getShortsMetadata() };
          break;
        case 'gdrive_bones_stage_video': {
          const scan = syncEngine.scanResultDirectory();
          if (scan.items.length === 0) {
            result = { success: false, message: 'No videos found in NexusFlow Result folder to stage.' };
          } else {
            const target = args.canonicalName || 'BOE_EP01_Alexandria_The_Archimedes_Vault_9x16.mp4';
            result = syncEngine.stageVideo(scan.items[0].fullPath, target);
          }
          break;
        }
        case 'gdrive_bones_generate_sync_manifest':
          result = syncEngine.generateDriveManifest();
          break;
        case 'gdrive_bones_open_drive_folder': {
          const startCmd = process.platform === 'win32' ? `start "" "${config.googleDrive.webUrl}"` : `open "${config.googleDrive.webUrl}"`;
          exec(startCmd);
          result = { success: true, url: config.googleDrive.webUrl };
          break;
        }
        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool not found: ${name}` }
          };
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]
        }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

rl.on('line', line => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const res = handleRequest(req);
    console.log(JSON.stringify(res));
  } catch (err) {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    }));
  }
});
