#!/usr/bin/env node
const readline = require('readline');
const monitor = require('../studioMonitor');
const manager = require('../studioManager');
const bridge = require('../nexusflowBridge');
const config = require('../config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const tools = [
  {
    name: 'studio_get_channel_overview',
    description: 'Get high-level YouTube Studio channel metrics (Subscribers, 28-day views, watch time, health, and status).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'studio_get_recent_performance',
    description: 'Get performance metrics of the latest upload (ranking out of 10, views, average percentage viewed APV, retention diagnostics).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'studio_get_top_content',
    description: 'Get top performing videos in the last 48 hours sorted by real-time velocity.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of videos to return (default 5)' }
      }
    }
  },
  {
    name: 'studio_get_monetization_status',
    description: 'Track YouTube Partner Program (YPP) milestone progress (1,000 subscribers, 4,000 watch hours, 10M Short views).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'studio_audit_performance',
    description: 'Run deep retention audit on published Shorts to diagnose completion rate and recommend algorithmic hook optimizations.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'studio_update_metadata',
    description: 'Update metadata for a published video or Short in YouTube Studio catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        videoId: { type: 'string', description: 'ID or partial title of video' },
        title: { type: 'string', description: 'New optimized video title' },
        description: { type: 'string', description: 'New description' },
        visibility: { type: 'string', enum: ['Public', 'Unlisted', 'Private'] }
      },
      required: ['videoId']
    }
  },
  {
    name: 'studio_moderate_comments',
    description: 'Check community comments, view sentiment, and receive suggested replies in character Marrow persona.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'studio_sync_nexusflow_ledger',
    description: 'Synchronize YouTube Studio metrics (views, likes, retention) with the YouTube Channel History & Ledger.',
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
          name: 'nexusflow-youtube-studio-monitor',
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
        case 'studio_get_channel_overview':
          result = monitor.getOverview();
          break;
        case 'studio_get_recent_performance':
          result = monitor.getLatestPerformance();
          break;
        case 'studio_get_top_content':
          result = monitor.getTopContent(args.limit || 5);
          break;
        case 'studio_get_monetization_status':
          result = monitor.getMonetizationStatus();
          break;
        case 'studio_audit_performance':
          result = monitor.auditPerformance();
          break;
        case 'studio_update_metadata':
          result = manager.updateVideoMetadata(args.videoId, args);
          break;
        case 'studio_moderate_comments':
          result = manager.moderateComments();
          break;
        case 'studio_sync_nexusflow_ledger':
          result = bridge.syncWithChannelLedger();
          break;
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
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true
        }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const res = handleRequest(req);
    process.stdout.write(JSON.stringify(res) + '\n');
  } catch (err) {
    process.stderr.write(`Error parsing JSON: ${err.message}\n`);
  }
});
