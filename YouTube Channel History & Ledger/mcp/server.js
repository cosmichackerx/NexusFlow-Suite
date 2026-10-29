#!/usr/bin/env node
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { paths, ensureDirs } = require('../config');
const { getChannelMemory, updateChannelMemory, generateMarkdownProfile } = require('../channelMemory');
const { getVideoLedger, getVideoById, listVideos, recordVideo, updateVideoStatus } = require('../historyLedger');
const { getPromptArchive, getCurrentNexusFlowPrompt, validatePromptContinuity, archivePrompt } = require('../promptHistory');
const { calculateTimeAnalytics } = require('../timeAnalytics');
const { syncEcosystem } = require('../syncEngine');

ensureDirs();

const TOOLS = [
  {
    name: 'channel_history_status',
    description: 'Get holistic status of YouTube channel metadata, video inventory, queued/published statistics, prompt archive, and publishing cadence health.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'channel_history_get_channel_memory',
    description: 'Retrieve living channel memory, executive strategy, protagonist (Marrow) continuity lore, audience profiles, content pillars, and publishing schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'markdown'],
          description: 'Format to return memory in (json or markdown). Default: json.'
        }
      },
      required: []
    }
  },
  {
    name: 'channel_history_update_channel_memory',
    description: 'Update or patch channel memory fields, rules, character lore, story arcs, milestones, or publishing cadence.',
    inputSchema: {
      type: 'object',
      properties: {
        patch: {
          type: 'object',
          description: 'Partial channel memory object to merge.'
        },
        reason: {
          type: 'string',
          description: 'Reason for memory modification (recorded in changelog).'
        }
      },
      required: ['patch']
    }
  },
  {
    name: 'channel_history_list_videos',
    description: 'List all tracked videos in the channel history ledger with status, titles, duration, timestamps, and YouTube publishing links.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status: draft, rendered, merged, seo_generated, queued, published.'
        },
        search: {
          type: 'string',
          description: 'Search string matching title or filename.'
        }
      },
      required: []
    }
  },
  {
    name: 'channel_history_get_video',
    description: 'Fetch complete lifecycle record for a video by ID, filename, or "latest" (includes 3-scene prompts, technical specs, full SEO package, timestamps, and YouTube status).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Video ID, filename, or "latest" (default: "latest").'
        }
      },
      required: []
    }
  },
  {
    name: 'channel_history_record_video',
    description: 'Register or update a video entry in the channel history ledger with title, file path, prompts, timestamps, SEO metadata, and YouTube details.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Video title' },
        videoPath: { type: 'string', description: 'Path to video file' },
        filename: { type: 'string', description: 'Filename of video' },
        status: { type: 'string', description: 'Status (draft, rendered, merged, queued, published)' },
        durationSec: { type: 'number', description: 'Duration in seconds' },
        prompts: { type: 'object', description: 'Prompt metadata and scene details' },
        seo: { type: 'object', description: 'SEO package (title variants, description, tags)' },
        youtube: { type: 'object', description: 'YouTube queue and URL details' }
      },
      required: ['title']
    }
  },
  {
    name: 'channel_history_sync_ecosystem',
    description: 'Deep scan and auto-synchronize NexusFlow Prompt.txt, video render directories, and YouTube Uploader queue into the master history ledger.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'channel_history_get_prompt_lineage',
    description: 'Query prompt archive, inspect 3-scene story structure, verify character continuity lock for Marrow, and view dialogue evolution.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of recent prompts to return (default: 5).'
        }
      },
      required: []
    }
  },
  {
    name: 'channel_history_get_time_analytics',
    description: 'Calculate production turnaround velocity, average video duration, cadence health score, and next recommended publishing slot.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'channel_history_export_report',
    description: 'Generate and export a comprehensive markdown history report summarizing all videos, prompts, and milestones.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'channel_history_status': {
      const memory = getChannelMemory();
      const analytics = calculateTimeAnalytics();
      const prompts = getPromptArchive();
      return {
        channel: {
          name: memory.channel.name,
          handle: memory.channel.handle,
          url: memory.channel.url,
          status: memory.channel.status
        },
        character: {
          name: memory.character.name,
          title: memory.character.title
        },
        videoInventory: analytics.overview,
        cadence: analytics.cadence,
        promptsArchived: prompts.length,
        latestPrompt: prompts[0] || null
      };
    }

    case 'channel_history_get_channel_memory': {
      const memory = getChannelMemory();
      if (args.format === 'markdown') {
        return { markdown: generateMarkdownProfile(memory) };
      }
      return memory;
    }

    case 'channel_history_update_channel_memory': {
      const updated = updateChannelMemory(args.patch, args.reason || 'MCP Tool Update');
      return {
        success: true,
        message: 'Channel memory updated successfully',
        memory: updated
      };
    }

    case 'channel_history_list_videos': {
      return listVideos({
        status: args.status,
        search: args.search
      });
    }

    case 'channel_history_get_video': {
      const video = getVideoById(args.query || 'latest');
      if (!video) {
        throw new Error(`Video not found for query: ${args.query || 'latest'}`);
      }
      return video;
    }

    case 'channel_history_record_video': {
      const recorded = recordVideo(args);
      return {
        success: true,
        message: 'Video recorded in channel ledger',
        video: recorded
      };
    }

    case 'channel_history_sync_ecosystem': {
      const report = await syncEcosystem();
      return {
        success: true,
        report
      };
    }

    case 'channel_history_get_prompt_lineage': {
      const archive = getPromptArchive();
      const limit = args.limit || 5;
      return archive.slice(0, limit);
    }

    case 'channel_history_get_time_analytics': {
      return calculateTimeAnalytics();
    }

    case 'channel_history_export_report': {
      const videos = listVideos();
      const memory = getChannelMemory();
      const exportFile = path.join(paths.USER_DATA_DIR, `channel-history-report-${Date.now()}.md`);

      let content = `# ${memory.channel.name} — Full Production & History Chronicle\n\n`;
      content += `*Generated: ${new Date().toISOString()}*\n\n`;
      content += `## Summary\n`;
      content += `- Total Tracked: ${videos.length}\n`;
      content += `- Queued: ${videos.filter(v=>v.status==='queued').length}\n`;
      content += `- Published: ${videos.filter(v=>v.status==='published').length}\n\n`;
      content += `## Video Chronological Ledger\n\n`;

      videos.forEach((v, idx) => {
        content += `### ${idx + 1}. ${v.title}\n`;
        content += `- **ID**: \`${v.id}\`\n`;
        content += `- **Status**: \`${v.status}\`\n`;
        content += `- **Duration**: ${v.formattedDuration} (${v.durationSec}s)\n`;
        content += `- **Filename**: \`${v.filename}\`\n`;
        if (v.youtube?.videoUrl) content += `- **YouTube URL**: [Watch Video](${v.youtube.videoUrl})\n`;
        content += `- **Created**: \`${v.timestamps?.createdAt || 'N/A'}\`\n`;
        content += `- **Queued**: \`${v.timestamps?.queuedAt || 'N/A'}\`\n`;
        content += `- **Published**: \`${v.timestamps?.publishedAt || 'N/A'}\`\n\n`;
        if (v.prompts?.dialogueQuotes) {
          content += `> **Dialogue**: ${v.prompts.dialogueQuotes.map(q => `"${q}"`).join(' / ')}\n\n`;
        }
      });

      fs.writeFileSync(exportFile, content, 'utf8');
      return {
        success: true,
        exportPath: exportFile,
        videoCount: videos.length
      };
    }

    default:
      throw new Error(`Unknown YouTube Channel History tool: ${name}`);
  }
}

// JSON-RPC Stdio Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', async (line) => {
  if (!line.trim()) return;
  let request;
  try {
    request = JSON.parse(line);
  } catch (e) {
    return;
  }

  const { id, method, params } = request;

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'youtube-channel-history',
          version: '1.0.0'
        }
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    send({
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: toolArgs } = params || {};
    try {
      const result = await handleToolCall(name, toolArgs || {});
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      });
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: err.message
        }
      });
    }
  }
});
