const fs = require('fs');
const path = require('path');

console.log('\n========================================================');
console.log('   YOUTUBE SEO WITH ANTIGRAVITY — INSTALLER & MCP SETUP  ');
console.log('========================================================\n');

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

  mcpConfig.mcpServers['youtube-seo'] = {
    command: 'node',
    args: [serverJsPath]
  };

  fs.writeFileSync(mcpConfigFile, JSON.stringify(mcpConfig, null, 2), 'utf8');
  console.log(`  -> Successfully registered "youtube-seo" in ${mcpConfigFile}`);
} catch (err) {
  console.error(`  -> Failed to update mcp_config.json: ${err.message}`);
}

// 2. Install Tool Schemas in Antigravity AppData
console.log('\n[2/4] Installing MCP Tool Schemas in Antigravity AppData...');
const antigravityMcpDir = 'C:\\Users\\Arsalan\\.gemini\\antigravity\\mcp\\youtube-seo';
if (!fs.existsSync(antigravityMcpDir)) {
  fs.mkdirSync(antigravityMcpDir, { recursive: true });
}

const instructionsContent = `# YouTube SEO MCP Server Instructions

YouTube SEO With Antigravity provides comprehensive channel management, algorithmic metadata generation, 0-100 quality scoring, viral trend hunting, story continuity prompting, and automated YouTube Studio publishing.

## Available Capabilities & Best Practices

1. youtube_seo_status:
   - Check holistic ecosystem status: channel auth, NexusFlow generator, unuploaded videos, and pending queue.

2. youtube_seo_channel_profile:
   - View channel identity, brand positioning, audience demographics, and competitor benchmarks.

3. youtube_seo_generate_package:
   - Synthesize 4 title variants (Browse, Search, Hybrid, Shorts), structured description, tags (<500 chars), hashtags, and Schema.org VideoObject JSON-LD.

4. youtube_seo_audit_package:
   - Quantitative 0-100 algorithmic scorecard auditing Title CTR, Description, Tags, Hashtags, and Engagement Velocity.

5. youtube_seo_get_trends:
   - Ranked list of viral trend ideas with search volume, RPM, and virality scores for history & 3D CGI.

6. youtube_seo_get_next_prompt:
   - Production-ready 3-scene prompt for NexusFlow for the next trending video.

7. youtube_seo_deploy_next_prompt:
   - Writes prompt directly to C:\\Google Flow Customized\\Prompt.txt with automatic backup.

8. youtube_seo_queue_video:
   - Adds video with complete SEO metadata into YouTube Studio queue.

9. youtube_seo_full_cycle:
   - Autonomous end-to-end pipeline execution.
`;

fs.writeFileSync(path.join(antigravityMcpDir, 'instructions.md'), instructionsContent, 'utf8');

const tools = [
  {
    name: 'youtube_seo_status',
    description: 'Get comprehensive ecosystem status across channel, video inventory, queue, and SEO readiness.',
    properties: {},
    required: []
  },
  {
    name: 'youtube_seo_channel_profile',
    description: 'Retrieve detailed channel strategy, positioning, content pillars, mascot lore, and competitor benchmarks.',
    properties: {},
    required: []
  },
  {
    name: 'youtube_seo_generate_package',
    description: 'Synthesize algorithmic YouTube SEO package (4 title variants, structured description, tags under 500 chars, hashtags, schema markup).',
    properties: {
      videoPath: { type: 'string', description: 'Absolute path to video file. If omitted, selects latest video.' },
      channelName: { type: 'string', description: 'Channel name (default: Bones of Empires).' }
    },
    required: []
  },
  {
    name: 'youtube_seo_audit_package',
    description: 'Execute 0-100 algorithmic quality audit scorecard on video metadata.',
    properties: {
      videoPath: { type: 'string', description: 'Absolute path to video file to audit.' }
    },
    required: []
  },
  {
    name: 'youtube_seo_get_trends',
    description: 'Discover top viral trend ideas ranked by algorithm demand and virality score.',
    properties: {
      categoryFilter: { type: 'string', description: 'Optional filter by category.' }
    },
    required: []
  },
  {
    name: 'youtube_seo_get_next_prompt',
    description: 'Generate continuity story and production-grade 3-scene prompt for NexusFlow.',
    properties: {
      trendRank: { type: 'number', description: 'Trend rank (1-5).' }
    },
    required: []
  },
  {
    name: 'youtube_seo_deploy_next_prompt',
    description: 'Deploy 3-scene prompt directly to C:\\Google Flow Customized\\Prompt.txt with automatic backup.',
    properties: {
      trendRank: { type: 'number', description: 'Trend rank to deploy (1-5).' }
    },
    required: []
  },
  {
    name: 'youtube_seo_queue_video',
    description: 'Queue a video with synthesized SEO package into YouTube Studio uploader.',
    properties: {
      videoPath: { type: 'string', description: 'Video path.' },
      visibility: { type: 'string', enum: ['public', 'unlisted', 'private'], description: 'Visibility.' }
    },
    required: []
  },
  {
    name: 'youtube_seo_full_cycle',
    description: 'Run autonomous end-to-end pipeline (Discover -> Probe -> SEO -> Audit -> Queue).',
    properties: {
      autoPublish: { type: 'boolean', description: 'Trigger background upload immediately.' }
    },
    required: []
  }
];

tools.forEach(t => {
  const schemaObj = {
    name: t.name,
    description: t.description,
    inputSchema: {
      type: 'object',
      properties: t.properties,
      required: t.required
    }
  };
  fs.writeFileSync(path.join(antigravityMcpDir, `${t.name}.json`), JSON.stringify(schemaObj, null, 2), 'utf8');
});

console.log(`  -> Installed 9 tool schemas & instructions in ${antigravityMcpDir}`);

// 3. Register Skill in Antigravity user skills
console.log('\n[3/4] Registering Skill in user skills directory...');
const userSkillsDir = 'C:\\Users\\Arsalan\\.gemini\\config\\skills\\youtube-seo';
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyRecursive(path.join(currentDir, 'skills', 'youtube-seo'), userSkillsDir);
  console.log(`  -> Successfully deployed skill to ${userSkillsDir}`);
} catch (e) {
  console.error(`  -> Failed to deploy skill: ${e.message}`);
}

// 4. Verification Self-Test
console.log('\n[4/4] Running verification self-test...');
try {
  const { getSystemStatus } = require('./systemStatus');
  getSystemStatus().then(status => {
    console.log(`  -> Self-test passed! Connected channel: "${status.channel.name}", Videos found: ${status.videos.totalFound}`);
    console.log('\n========================================================');
    console.log('   INSTALLATION COMPLETE: YOUTUBE SEO READY TO DOMINATE   ');
    console.log('========================================================\n');
  }).catch(e => {
    console.error(`  -> Self-test failed: ${e.message}`);
  });
} catch (e) {
  console.error(`  -> Self-test error: ${e.message}`);
}
