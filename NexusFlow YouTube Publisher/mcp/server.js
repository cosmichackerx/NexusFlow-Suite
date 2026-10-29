#!/usr/bin/env node
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { paths, ensureDirs } = require('../config');
const { probeVideo, generateMetadataPackage } = require('../metadataGenerator');
const {
  getUploaderStatus,
  checkYoutubeAuth,
  getUploadQueue,
  addToUploadQueue,
  startUploadQueue,
  getUploadHistory,
  scanNexusFlowVideos
} = require('../bridgeClient');
const { runPipeline } = require('../pipeline');

ensureDirs();

const TOOLS = [
  {
    name: 'youtube_ag_status',
    description: 'Get comprehensive system status of YouTube With Antigravity, NexusFlow outputs, and YouTube Studio session.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_ag_scan',
    description: 'Scan NexusFlow Result/ and Output/ directories for generated video files.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_ag_probe',
    description: 'Inspect video file using FFmpeg for duration, resolution, aspect ratio, and Shorts qualification.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to the video file to probe.'
        }
      },
      required: ['videoPath']
    }
  },
  {
    name: 'youtube_ag_generate_metadata',
    description: 'Synthesize high-conversion YouTube metadata (3 title variants, description, chapters, tags, hashtags) grounded in Antigravity creator guidelines.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to video file.'
        },
        channelName: {
          type: 'string',
          description: 'YouTube channel name (default: "Bones of Empires").'
        }
      },
      required: ['videoPath']
    }
  },
  {
    name: 'youtube_ag_queue',
    description: 'Add a video to the YouTube Uploader queue with custom or synthesized metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: { type: 'string', description: 'Path to video file.' },
        title: { type: 'string', description: 'Custom title (optional).' },
        description: { type: 'string', description: 'Custom description (optional).' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags (optional).' },
        visibility: { type: 'string', enum: ['public', 'unlisted', 'private'], description: 'Upload visibility.' }
      },
      required: ['videoPath']
    }
  },
  {
    name: 'youtube_ag_run_pipeline',
    description: 'Run the end-to-end automated pipeline: Discover NexusFlow video -> Probe -> Synthesize Metadata -> Queue into YouTube Studio.',
    inputSchema: {
      type: 'object',
      properties: {
        visibility: { type: 'string', enum: ['public', 'unlisted', 'private'] },
        autoStart: { type: 'boolean', description: 'Start upload immediately after queueing.' }
      },
      required: []
    }
  },
  {
    name: 'youtube_ag_get_queue',
    description: 'Inspect videos currently waiting in the YouTube upload queue.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_ag_get_history',
    description: 'Retrieve published YouTube video links and history.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'youtube_ag_status': {
      const videos = scanNexusFlowVideos();
      const auth = await checkYoutubeAuth(true);
      const queueRes = await getUploadQueue();
      const historyRes = await getUploadHistory();
      return {
        success: true,
        nexusFlowVideos: videos.length,
        uploadQueue: queueRes.queue ? queueRes.queue.length : 0,
        publishedHistory: historyRes.history ? historyRes.history.length : 0,
        authStatus: auth
      };
    }

    case 'youtube_ag_scan': {
      const videos = scanNexusFlowVideos();
      return { success: true, count: videos.length, videos };
    }

    case 'youtube_ag_probe': {
      const probe = await probeVideo(args.videoPath);
      return { success: true, probe };
    }

    case 'youtube_ag_generate_metadata': {
      const meta = await generateMetadataPackage({
        videoPath: args.videoPath,
        channelName: args.channelName || 'Bones of Empires'
      });
      return { success: true, metadata: meta };
    }

    case 'youtube_ag_queue': {
      let title = args.title;
      let description = args.description;
      let tags = args.tags;
      let isShorts = false;

      if (!title || !description) {
        const meta = await generateMetadataPackage({ videoPath: args.videoPath });
        title = title || meta.recommendedTitle;
        description = description || meta.description;
        tags = tags || meta.tags;
        isShorts = meta.isShorts;
      }

      const item = {
        videoPath: args.videoPath,
        title,
        description,
        tags: tags || [],
        visibility: args.visibility || 'public',
        madeForKids: false,
        isShorts
      };

      const res = await addToUploadQueue(item);
      return { success: true, queued: res };
    }

    case 'youtube_ag_run_pipeline': {
      const res = await runPipeline(args);
      return res;
    }

    case 'youtube_ag_get_queue': {
      return await getUploadQueue();
    }

    case 'youtube_ag_get_history': {
      return await getUploadHistory();
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Stdio JSON-RPC MCP Server Protocol
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
          name: 'youtube-with-antigravity',
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
    try {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      const result = await handleToolCall(toolName, toolArgs);
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        }
      });
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${err.message}`
            }
          ],
          isError: true
        }
      });
    }
  }
});
