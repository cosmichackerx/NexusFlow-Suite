#!/usr/bin/env node
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { paths, ensureDirs, loadConfig } = require('../config');
const { getSystemStatus } = require('../systemStatus');
const { getFullChannelProfile, getChannelAuthStatus } = require('../channelManager');
const { generateSeoPackage, findLatestVideo } = require('../seoEngine');
const { auditMetadata } = require('../seoAuditor');
const { getTrendIdeas, getTrendIdea } = require('../trendHunter');
const { generateContinuityPrompt, applyPromptToNexusFlow } = require('../promptGenerator');
const { queueVideo, getQueue, getHistory, startQueue } = require('../publisherBridge');
const { runSeoPipeline } = require('../pipeline');
const { probeVideo } = require('../videoAnalyzer');

ensureDirs();

const TOOLS = [
  {
    name: 'youtube_seo_status',
    description: 'Get comprehensive real-time status across YouTube channel identity, Studio authentication, NexusFlow video inventory, upload queue, and SEO readiness.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_seo_channel_profile',
    description: 'Retrieve detailed channel strategy, positioning, content pillars, protagonist mascot (Marrow) lore, competitor benchmarks, and algorithmic growth checklist.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'youtube_seo_generate_package',
    description: 'Synthesize a high-conversion, algorithmic YouTube SEO package for any video (4 title variants, structured 5000-char description, tags under 500 chars, hashtags, engagement trigger, and Schema.org VideoObject JSON-LD).',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to the video file. If omitted, automatically selects the latest NexusFlow video.'
        },
        channelName: {
          type: 'string',
          description: 'Channel brand name (default: "Bones of Empires").'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_seo_audit_package',
    description: 'Execute an algorithmic 0-100 quality audit scorecard on video metadata, checking Title CTR power, description structure, tag saturation, hashtag indexing, and SERP crawlability.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to video file to audit. If omitted, selects latest video.'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_seo_get_trends',
    description: 'Discover top viral trend ideas ranked by algorithm demand, virality score, search volume tier, and RPM in the ancient history / archaeological mystery / 3D CGI niche.',
    inputSchema: {
      type: 'object',
      properties: {
        categoryFilter: {
          type: 'string',
          description: 'Optional filter by topic category.'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_seo_get_next_prompt',
    description: 'Generate the narrative continuity story and a production-grade 3-scene NexusFlow prompt (Vertical 9:16, 24fps 3D CGI, character continuity lock, audio bed, timing, and camera directives) for the next trending video.',
    inputSchema: {
      type: 'object',
      properties: {
        trendRank: {
          type: 'number',
          description: 'Trend rank (1 to 5). Default: 1 (The Library of Alexandria Vault).'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_seo_deploy_next_prompt',
    description: 'Write the generated 3-scene prompt directly to C:\\Google Flow Customized\\Prompt.txt with automatic timestamped backup of the previous prompt.',
    inputSchema: {
      type: 'object',
      properties: {
        trendRank: {
          type: 'number',
          description: 'Trend rank to deploy (1 to 5). Default: 1.'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_seo_queue_video',
    description: 'Add a video to the YouTube Uploader queue with complete synthesized SEO metadata, titles, description, tags, and Shorts flag.',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          description: 'Absolute path to video file. If omitted, uses latest video.'
        },
        visibility: {
          type: 'string',
          enum: ['public', 'unlisted', 'private'],
          description: 'Upload visibility (default: public).'
        }
      },
      required: []
    }
  },
  {
    name: 'youtube_seo_full_cycle',
    description: 'Execute the complete autonomous end-to-end pipeline: Discover NexusFlow video -> Probe -> Synthesize SEO -> Algorithmic Audit -> Add to YouTube Queue.',
    inputSchema: {
      type: 'object',
      properties: {
        autoPublish: {
          type: 'boolean',
          description: 'Whether to trigger background upload immediately if uploader bridge is online.'
        }
      },
      required: []
    }
  }
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'youtube_seo_status':
      return await getSystemStatus();

    case 'youtube_seo_channel_profile':
      return await getFullChannelProfile();

    case 'youtube_seo_generate_package':
      return await generateSeoPackage({
        videoPath: args.videoPath,
        channelName: args.channelName
      });

    case 'youtube_seo_audit_package': {
      const seo = await generateSeoPackage({ videoPath: args.videoPath });
      return auditMetadata(seo);
    }

    case 'youtube_seo_get_trends':
      return getTrendIdeas(args.categoryFilter);

    case 'youtube_seo_get_next_prompt':
      return generateContinuityPrompt(args.trendRank || 1);

    case 'youtube_seo_deploy_next_prompt':
      return applyPromptToNexusFlow(args.trendRank || 1);

    case 'youtube_seo_queue_video': {
      const target = args.videoPath || findLatestVideo();
      const seo = await generateSeoPackage({ videoPath: target });
      return await queueVideo({
        videoPath: target,
        title: seo.titles.recommended,
        description: seo.description.fullText,
        tags: seo.tags.list,
        visibility: args.visibility || 'public',
        isShorts: seo.video.isShorts,
        durationSec: seo.video.durationSec,
        formattedDuration: seo.video.formattedDuration
      });
    }

    case 'youtube_seo_full_cycle':
      return await runSeoPipeline({
        autoPublish: !!args.autoPublish
      });

    default:
      throw new Error(`Unknown YouTube SEO tool: ${name}`);
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
          name: 'youtube-seo-with-antigravity',
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
