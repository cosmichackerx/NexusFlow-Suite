const fs = require('fs');
const path = require('path');

console.log('\n=================================================================');
console.log('   YOUTUBE CHANNEL METADATA & HISTORY — INSTALLER & MCP SETUP    ');
console.log('=================================================================\n');

const currentDir = __dirname;

// 1. Update mcp_config.json
console.log('[1/4] Registering MCP server in Antigravity configuration...');
const mcpConfigFile = 'C:\\Users\\Arsalan\\.gemini\\config\\mcp_config.json';
const serverJsPath = path.join(currentDir, 'mcp', 'server.js');

try {
  let mcpConfig = { mcpServers: {} };
  if (fs.existsSync(mcpConfigFile)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigFile, 'utf8'));
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    } catch (e) {
      mcpConfig = { mcpServers: {} };
    }
  }

  mcpConfig.mcpServers['youtube-channel-history'] = {
    command: 'node',
    args: [serverJsPath]
  };

  fs.writeFileSync(mcpConfigFile, JSON.stringify(mcpConfig, null, 2), 'utf8');
  console.log(`  -> Successfully registered "youtube-channel-history" in ${mcpConfigFile}`);
} catch (err) {
  console.error(`  -> Failed to update mcp_config.json: ${err.message}`);
}

// 2. Install Tool Schemas in Antigravity AppData
console.log('\n[2/4] Installing MCP Tool Schemas in Antigravity AppData...');
const antigravityMcpDir = 'C:\\Users\\Arsalan\\.gemini\\antigravity\\mcp\\youtube-channel-history';
if (!fs.existsSync(antigravityMcpDir)) {
  fs.mkdirSync(antigravityMcpDir, { recursive: true });
}

const instructionsContent = `# YouTube Channel Metadata & History MCP Server Instructions

This server manages the persistent channel memory, complete video ledger, prompt evolution, and time analytics for YouTube channels in NexusFlow & Google Antigravity (featuring "Bones of Empires" and Marrow).

## Available Capabilities & Best Practices

1. channel_history_status:
   - Check holistic channel health, video inventory, queue statistics, and cadence metrics.

2. channel_history_get_channel_memory:
   - Retrieve living channel memory, executive strategy, Marrow character continuity lore, audience profiles, and publishing cadence.

3. channel_history_update_channel_memory:
   - Update channel milestones, rules, audience profiles, or character notes.

4. channel_history_list_videos:
   - Query all videos in the channel history ledger with status, titles, duration, timestamps, and YouTube publishing links.

5. channel_history_get_video:
   - Deep inspect a single video's full lifecycle: prompts, technical specs, full SEO package, timestamps, and YouTube queue/status.

6. channel_history_record_video:
   - Register or update a newly created or uploaded video into the master ledger.

7. channel_history_sync_ecosystem:
   - Deep scan and auto-synchronize NexusFlow Prompt.txt, video files, and YouTube Uploader queue into the history ledger.

8. channel_history_get_prompt_lineage:
   - Query prompt history, scene timings, dialogue evolution, and Marrow continuity locks.

9. channel_history_get_time_analytics:
   - Calculate turnaround velocity, average video duration, cadence health score, and next recommended publishing slot.

10. channel_history_export_report:
    - Generate and export a comprehensive markdown history chronicle report.
`;

fs.writeFileSync(path.join(antigravityMcpDir, 'instructions.md'), instructionsContent, 'utf8');

const tools = [
  {
    name: 'channel_history_status',
    description: 'Get holistic status of YouTube channel metadata, video inventory, queued/published statistics, prompt archive, and publishing cadence health.',
    properties: {},
    required: []
  },
  {
    name: 'channel_history_get_channel_memory',
    description: 'Retrieve living channel memory, executive strategy, protagonist (Marrow) continuity lore, audience profiles, content pillars, and publishing schedule.',
    properties: {
      format: { type: 'string', description: 'Format to return memory in (json or markdown). Default: json.' }
    },
    required: []
  },
  {
    name: 'channel_history_update_channel_memory',
    description: 'Update or patch channel memory fields, rules, character lore, story arcs, milestones, or publishing cadence.',
    properties: {
      patch: { type: 'object', description: 'Partial channel memory object to merge.' },
      reason: { type: 'string', description: 'Reason for memory modification (recorded in changelog).' }
    },
    required: ['patch']
  },
  {
    name: 'channel_history_list_videos',
    description: 'List all tracked videos in the channel history ledger with status, titles, duration, timestamps, and YouTube publishing links.',
    properties: {
      status: { type: 'string', description: 'Filter by status: draft, rendered, merged, seo_generated, queued, published.' },
      search: { type: 'string', description: 'Search string matching title or filename.' }
    },
    required: []
  },
  {
    name: 'channel_history_get_video',
    description: 'Fetch complete lifecycle record for a video by ID, filename, or "latest" (includes 3-scene prompts, technical specs, full SEO package, timestamps, and YouTube status).',
    properties: {
      query: { type: 'string', description: 'Video ID, filename, or "latest" (default: "latest").' }
    },
    required: []
  },
  {
    name: 'channel_history_record_video',
    description: 'Register or update a video entry in the channel history ledger with title, file path, prompts, timestamps, SEO metadata, and YouTube details.',
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
  },
  {
    name: 'channel_history_sync_ecosystem',
    description: 'Deep scan and auto-synchronize NexusFlow Prompt.txt, video render directories, and YouTube Uploader queue into the master history ledger.',
    properties: {},
    required: []
  },
  {
    name: 'channel_history_get_prompt_lineage',
    description: 'Query prompt archive, inspect 3-scene story structure, verify character continuity lock for Marrow, and view dialogue evolution.',
    properties: {
      limit: { type: 'number', description: 'Maximum number of recent prompts to return (default: 5).' }
    },
    required: []
  },
  {
    name: 'channel_history_get_time_analytics',
    description: 'Calculate production turnaround velocity, average video duration, cadence health score, and next recommended publishing slot.',
    properties: {},
    required: []
  },
  {
    name: 'channel_history_export_report',
    description: 'Generate and export a comprehensive markdown history report summarizing all videos, prompts, and milestones.',
    properties: {},
    required: []
  }
];

tools.forEach(tool => {
  const schema = {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.properties,
      required: tool.required
    }
  };
  fs.writeFileSync(path.join(antigravityMcpDir, `${tool.name}.json`), JSON.stringify(schema, null, 2), 'utf8');
});

console.log(`  -> Installed ${tools.length} tool schemas in ${antigravityMcpDir}`);

// 3. Register Plugin in Antigravity Plugins Directory
console.log('\n[3/4] Registering Antigravity Plugin and Global Skills...');
const pluginsDir = 'C:\\Users\\Arsalan\\.gemini\\config\\plugins\\youtube-channel-history';
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

const pluginManifest = {
  name: 'youtube-channel-history',
  version: '1.0.0',
  description: 'Channel Memory, Video Metadata Ledger, Prompt Lineage, Production Chronicle & Analytics Suite for NexusFlow & Antigravity',
  author: 'Antigravity AI & NexusFlow Team',
  skills: ['./skills/youtube-channel-history']
};

fs.writeFileSync(path.join(pluginsDir, 'plugin.json'), JSON.stringify(pluginManifest, null, 2), 'utf8');

// Copy skills into global plugin folder
const globalSkillsDir = path.join(pluginsDir, 'skills', 'youtube-channel-history');
if (!fs.existsSync(globalSkillsDir)) {
  fs.mkdirSync(globalSkillsDir, { recursive: true });
}

// 4. Run initial synchronization
console.log('\n[4/4] Executing initial ecosystem synchronization...');
try {
  const { syncEcosystem } = require('./syncEngine');
  syncEcosystem().then(report => {
    console.log(`  -> Ingested Prompts   : ${report.promptsSynced}`);
    console.log(`  -> Synced Queue Items : ${report.queueItemsSynced}`);
    console.log(`  -> Synced MP4 Files   : ${report.rawVideosFound}`);
    console.log('\n=================================================================');
    console.log('   INSTALLATION COMPLETE! MCP SERVER & TOOLS ARE READY TO USE    ');
    console.log('=================================================================\n');
  }).catch(e => {
    console.error('Initial sync error:', e.message);
  });
} catch (e) {
  console.log('Setup finished (sync can be run via node cli.js sync).');
}
