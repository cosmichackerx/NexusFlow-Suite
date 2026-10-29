#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { paths, ensureDirs } = require('./config');
const { getChannelMemory, updateChannelMemory, generateMarkdownProfile } = require('./channelMemory');
const { getVideoLedger, getVideoById, listVideos, recordVideo } = require('./historyLedger');
const { getPromptArchive, getCurrentNexusFlowPrompt, validatePromptContinuity } = require('./promptHistory');
const { calculateTimeAnalytics } = require('./timeAnalytics');
const { syncEcosystem } = require('./syncEngine');

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'status';

async function main() {
  ensureDirs();

  switch (command) {
    case 'status': {
      console.log('\n===============================================================');
      console.log('  YOUTUBE CHANNEL METADATA & HISTORY — ANTIGRAVITY SUITE       ');
      console.log('===============================================================\n');

      const memory = getChannelMemory();
      const analytics = calculateTimeAnalytics();
      const prompts = getPromptArchive();

      console.log(`Channel Name   : ${memory.channel.name} (${memory.channel.handle})`);
      console.log(`Core Niche     : ${memory.channel.primaryNiche}`);
      console.log(`Hero Character : ${memory.character.name} ("${memory.character.title}")`);
      console.log(`Channel Status : ${memory.channel.status.toUpperCase()}`);
      console.log(`Channel URL    : ${memory.channel.url}\n`);

      console.log('--- Video & Inventory Ledger ---');
      console.log(`Total Videos Tracked : ${analytics.overview.totalVideosTracked}`);
      console.log(`Queued for Upload    : ${analytics.overview.queuedCount}`);
      console.log(`Published on YouTube : ${analytics.overview.publishedCount}`);
      console.log(`Rendered/Merged      : ${analytics.overview.renderedCount}`);
      console.log(`Average Duration     : ${analytics.overview.averageDurationSec}s\n`);

      console.log('--- Prompt Lineage & Continuity ---');
      console.log(`Archived Prompts     : ${prompts.length}`);
      const latestPrompt = prompts[0];
      if (latestPrompt) {
        console.log(`Latest Prompt Arc    : ${latestPrompt.arcId} (${latestPrompt.title})`);
        console.log(`Continuity Score     : ${latestPrompt.validationScore}/100 [${latestPrompt.isProductionReady ? 'PASSED' : 'FLAGGED'}]`);
      } else {
        console.log('Live Prompt File     : Run "node cli.js sync" to ingest current Prompt.txt');
      }

      console.log('\n--- Publishing Cadence & Schedule ---');
      console.log(`Target Cadence       : ${analytics.cadence.targetPerWeek} Shorts / week`);
      console.log(`Cadence Health       : ${analytics.cadence.healthStatus} (${analytics.cadence.cadenceHealthScore}/100)`);
      if (analytics.cadence.daysSinceLastPublish !== null) {
        console.log(`Days Since Upload    : ${analytics.cadence.daysSinceLastPublish} days`);
      }
      console.log(`Next Prime Slot      : ${analytics.cadence.nextRecommendedPublish.targetDay} (${analytics.cadence.nextRecommendedPublish.date}) @ ${analytics.cadence.nextRecommendedPublish.targetTimeEST} / ${analytics.cadence.nextRecommendedPublish.targetTimePKT}`);

      console.log('\n===============================================================\n');
      break;
    }

    case 'sync': {
      console.log('\n[SyncEngine] Running deep synchronization across NexusFlow & YouTube Uploader...');
      const report = await syncEcosystem();
      console.log('---------------------------------------------------------------');
      console.log(`  Prompts Ingested      : ${report.promptsSynced}`);
      console.log(`  Queue Items Synced    : ${report.queueItemsSynced}`);
      console.log(`  Upload History Synced : ${report.historyItemsSynced}`);
      console.log(`  Raw MP4 Files Checked : ${report.rawVideosFound}`);
      if (report.channelAuthStatus) {
        console.log(`  YouTube Session       : Active (${report.channelAuthStatus.channelName})`);
      }
      if (report.errors.length > 0) {
        console.log(`  Notices/Errors        : ${report.errors.join('; ')}`);
      }
      console.log('---------------------------------------------------------------');
      console.log('Sync complete! Video ledger and channel memory updated.\n');
      break;
    }

    case 'list':
    case 'videos': {
      const videos = listVideos();
      console.log(`\n=== Tracked Videos in Channel History Ledger (${videos.length}) ===\n`);
      if (videos.length === 0) {
        console.log('No videos recorded yet. Run "node cli.js sync" to auto-import existing files.');
      } else {
        videos.forEach((v, i) => {
          console.log(`[${i + 1}] ID: ${v.id}`);
          console.log(`    Title    : ${v.title}`);
          console.log(`    File     : ${v.filename} (${v.formattedDuration || v.durationSec + 's'})`);
          console.log(`    Status   : ${v.status.toUpperCase()} | YouTube: ${v.youtube?.status || 'unlinked'}`);
          if (v.youtube?.videoUrl) console.log(`    URL      : ${v.youtube.videoUrl}`);
          console.log(`    Timeline : Created: ${v.timestamps?.createdAt || 'N/A'} | Queued: ${v.timestamps?.queuedAt || 'N/A'}`);
          console.log('---------------------------------------------------------------');
        });
      }
      console.log('\n');
      break;
    }

    case 'get':
    case 'video': {
      const query = args[1] || 'latest';
      const video = getVideoById(query);
      if (!video) {
        console.error(`\nVideo not found for query: "${query}"\n`);
        process.exit(1);
      }
      console.log(`\n=== Video Record: ${video.title} ===\n`);
      console.log(JSON.stringify(video, null, 2));
      console.log('\n');
      break;
    }

    case 'prompts': {
      const archive = getPromptArchive();
      console.log(`\n=== Prompt History & Continuity Lineage (${archive.length}) ===\n`);
      if (archive.length === 0) {
        console.log('No prompts archived yet. Run "node cli.js sync".');
      } else {
        archive.forEach((p, i) => {
          console.log(`[${i + 1}] Prompt ID: ${p.id}`);
          console.log(`    Arc       : ${p.arcId} | Title: ${p.title}`);
          console.log(`    Scenes    : ${p.sceneCount} | Continuity Score: ${p.validationScore}/100`);
          console.log(`    Dialogue  : ${p.dialogueQuotes.map(d => `"${d}"`).join(' | ')}`);
          console.log(`    Archived  : ${p.archivedAt}`);
          console.log('---------------------------------------------------------------');
        });
      }
      console.log('\n');
      break;
    }

    case 'memory': {
      const mem = getChannelMemory();
      console.log('\n' + generateMarkdownProfile(mem) + '\n');
      break;
    }

    case 'analytics': {
      const analytics = calculateTimeAnalytics();
      console.log('\n=== Production, Cadence & Time Analytics ===\n');
      console.log(JSON.stringify(analytics, null, 2));
      console.log('\n');
      break;
    }

    case 'export': {
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
      console.log(`\nHistory chronicle exported successfully to:\n${exportFile}\n`);
      break;
    }

    default:
      console.log(`Unknown command: "${command}". Available: status, sync, list, get <id>, memory, prompts, analytics, export.`);
      break;
  }
}

main().catch(err => {
  console.error('[CLI Error]', err);
  process.exit(1);
});
