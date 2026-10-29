#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { paths, ensureDirs, loadConfig } = require('./config');
const { getSystemStatus } = require('./systemStatus');
const { getFullChannelProfile } = require('./channelManager');
const { generateSeoPackage, findLatestVideo } = require('./seoEngine');
const { auditMetadata } = require('./seoAuditor');
const { getTrendIdeas, getTrendIdea } = require('./trendHunter');
const { generateContinuityPrompt, applyPromptToNexusFlow } = require('./promptGenerator');
const { queueVideo, getQueue, startQueue } = require('./publisherBridge');
const { runSeoPipeline } = require('./pipeline');

ensureDirs();

const command = process.argv[2] || 'help';
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
  try {
    switch (command.toLowerCase()) {
      case 'status':
        await handleStatus();
        break;

      case 'channel':
        await handleChannel();
        break;

      case 'seo':
        await handleSeo(arg1);
        break;

      case 'audit':
        await handleAudit(arg1);
        break;

      case 'trends':
        await handleTrends();
        break;

      case 'next-video':
        await handleNextVideo(arg1);
        break;

      case 'apply-prompt':
        await handleApplyPrompt(arg1);
        break;

      case 'queue':
        await handleQueue(arg1);
        break;

      case 'full-cycle':
      case 'pipeline':
      case 'run':
        await handleFullCycle();
        break;

      case 'help':
      default:
        printHelp();
        break;
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

async function handleStatus() {
  console.log('\nFetching comprehensive ecosystem status...\n');
  const status = await getSystemStatus();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║               YOUTUBE SEO & CHANNEL ECOSYSTEM STATUS                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');

  console.log('\n📺 [Channel Identity]');
  console.log(`- Channel Name    : ${status.channel.name}`);
  console.log(`- Handle          : ${status.channel.handle}`);
  console.log(`- Authentication  : ${status.channel.authenticated ? '✅ Authenticated' : '⚠️ Profile found, start uploader'}`);
  console.log(`- Status Message  : ${status.channel.statusMessage}`);
  console.log(`- Niche           : ${status.channel.niche}`);
  console.log(`- Main Mascot     : ${status.channel.mainCharacter}`);

  console.log('\n🎬 [NexusFlow Video Generator]');
  console.log(`- Base Directory  : ${status.nexusflow.baseDir}`);
  console.log(`- Prompt File     : ${status.nexusflow.promptFileExists ? 'Present (Active)' : 'Missing'}`);
  console.log(`- Active Scenes   : ${status.nexusflow.activePromptScenes} scenes configured`);
  console.log(`- Characters      : ${status.nexusflow.characters.join(', ')}`);

  console.log('\n🎥 [Video Inventory]');
  console.log(`- Total Files     : ${status.videos.totalFound} video(s) found in Result/Output`);
  console.log(`- Unqueued Videos : ${status.videos.unqueuedCount} ready for SEO optimization`);
  if (status.videos.latestVideo) {
    const v = status.videos.latestVideo;
    console.log(`- Target Video    : ${v.filename} (${v.sizeMb} MB)`);
    console.log(`- Format          : ${v.formatCategory} [${v.aspectRatioLabel}]`);
    console.log(`- Duration        : ${v.formattedDuration} (${v.durationSec}s @ ${v.fps} fps)`);
  }

  console.log('\n🚀 [YouTube Studio Uploader]');
  console.log(`- Queue Items     : ${status.publishing.queueCount} in queue (${status.publishing.queueSource})`);
  console.log(`- Upload History  : ${status.publishing.historyCount} published video(s)`);
  if (status.publishing.pendingQueue.length > 0) {
    console.log('  Pending Queue items:');
    status.publishing.pendingQueue.forEach((q, i) => {
      console.log(`    ${i + 1}. [${q.duration}] "${q.title}" (Status: ${q.status})`);
    });
  }

  console.log('\n🎯 [SEO Suite Readiness]');
  console.log(`- Cached Packages : ${status.seo.cachedPackages}`);
  console.log(`- Ready to Upload : ${status.seo.readyToUpload ? 'YES' : 'NO'}`);
  console.log('\n════════════════════════════════════════════════════════════════════════\n');
}

async function handleChannel() {
  console.log('\nLoading channel profile and competitive positioning...\n');
  const profile = await getFullChannelProfile();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log(`║      CHANNEL POSITIONING & STRATEGY: ${profile.identity.channelName.toUpperCase().padEnd(30)}    ║`);
  console.log('╚════════════════════════════════════════════════════════════════════════╝');

  console.log('\n👑 [Channel Identity & Access]');
  console.log(`- Name           : ${profile.identity.channelName}`);
  console.log(`- Handle         : ${profile.identity.handle}`);
  console.log(`- URL            : ${profile.identity.url}`);
  console.log(`- Status         : ${profile.identity.statusMessage}`);

  console.log('\n🎯 [Niche & Positioning]');
  console.log(`- Primary Niche  : ${profile.niche.primary}`);
  console.log(`- Sub-Niche      : ${profile.niche.subNiche}`);
  console.log(`- Target Audience: ${profile.niche.targetAudience}`);

  console.log('\n🏛️ [Content Pillars]');
  profile.niche.contentPillars.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name} [${p.projectedEngagement}]`);
    console.log(`     ${p.description}`);
  });

  console.log('\n💀 [Protagonist Mascot Lore]');
  console.log(`- Name           : ${profile.character.name}`);
  console.log(`- Bio            : ${profile.character.lore}`);
  console.log(`- Voice Style    : ${profile.character.voiceStyle}`);

  console.log('\n⚔️ [Top Competitor Benchmark & Advantage]');
  profile.competitors.forEach((c) => {
    console.log(`- ${c.channel} (${c.subscribersTier})`);
    console.log(`  Competitor Strength : ${c.strength}`);
    console.log(`  Our Advantage       : ${c.ourAdvantage}`);
  });

  console.log('\n📈 [Growth Checklist for Algorithm Dominance]');
  profile.growthChecklist.forEach(item => {
    console.log(`  [${item.status}] ${item.item} -> ${item.impact}`);
  });
  console.log('\n');
}

async function handleSeo(videoPath) {
  const target = videoPath || findLatestVideo();
  console.log(`\nSynthesizing High-Conversion SEO Package for: ${target}...\n`);

  const seo = await generateSeoPackage({ videoPath: target });

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   ALGORITHMIC YOUTUBE SEO PACKAGE                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📌 [TITLE VARIANTS]');
  console.log(`1. Browse / Suggested (Curiosity Hook) : "${seo.titles.browse}"`);
  console.log(`2. Search / SERP (Exact Keywords)     : "${seo.titles.search}"`);
  console.log(`3. Hybrid (Curiosity + Brackets)       : "${seo.titles.hybrid}"`);
  console.log(`4. Ultra-Shorts Mobile (<45 chars)     : "${seo.titles.shortsVariant}"`);
  console.log(`\n⭐ RECOMMENDED TITLE: "${seo.titles.recommended}"\n`);

  console.log('🏷️ [TAGS MATRIX - Under 500 Chars]');
  console.log(`Count: ${seo.tags.count} tags | Character Allocation: ${seo.tags.characterCount} / 500 chars`);
  console.log(`Tags: ${seo.tags.commaSeparated}\n`);

  console.log('#️⃣ [HASHTAGS]');
  console.log(`Primary 3 Above Title: ${seo.hashtags.primaryFormatted}`);
  console.log(`Extended Set: ${seo.hashtags.extendedFormatted}\n`);

  console.log('💬 [ENGAGEMENT VELOCITY TRIGGER]');
  console.log(`Pinned Comment Question: ${seo.engagementTrigger.pinnedCommentQuestion}\n`);

  console.log('📝 [STRUCTURED DESCRIPTION]');
  console.log('------------------------------------------------------------------------');
  console.log(seo.description.fullText);
  console.log('------------------------------------------------------------------------\n');
}

async function handleAudit(videoPath) {
  const target = videoPath || findLatestVideo();
  console.log(`\nRunning Algorithmic SEO Audit on: ${target}...\n`);

  const seo = await generateSeoPackage({ videoPath: target });
  const audit = auditMetadata(seo);

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  YOUTUBE SEO SCORECARD & AUDIT                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`🏆 OVERALL SEO SCORE: ${audit.totalScore} / 100 [GRADE: ${audit.grade}]`);
  console.log(`Verdict: ${audit.verdict}\n`);

  console.log('📊 [PILLAR SCORES]');
  console.log(`- Title Optimization   : ${audit.pillarScores.title}`);
  console.log(`- Description Structure: ${audit.pillarScores.description}`);
  console.log(`- Tag Optimization     : ${audit.pillarScores.tags}`);
  console.log(`- Hashtag Strategy     : ${audit.pillarScores.hashtags}`);
  console.log(`- Engagement Velocity  : ${audit.pillarScores.engagement}`);
  console.log(`- SERP / AI Overviews  : ${audit.pillarScores.serpReadiness}\n`);

  console.log('🔍 [DETAILED CHECKS]');
  audit.checks.forEach(c => {
    const icon = c.passed ? '✅' : '⚠️';
    console.log(`  ${icon} [${c.category}] (${c.score}/${c.max}): ${c.rule}`);
  });

  if (audit.recommendations.length > 0) {
    console.log('\n💡 [OPTIMIZATION RECOMMENDATIONS]');
    audit.recommendations.forEach(r => console.log(`  - ${r}`));
  }
  console.log('\n');
}

async function handleTrends() {
  console.log('\nDiscovering Top Viral Trend Ideas for Bones of Empires...\n');
  const trends = getTrendIdeas();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║          TOP VIRAL TREND IDEAS TO PUT OUR CHANNEL ON TOP               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  trends.forEach((t) => {
    console.log(`🏆 Rank #${t.rank}: ${t.topic.toUpperCase()}`);
    console.log(`   Category      : ${t.category}`);
    console.log(`   Virality Score: ${t.viralityScore} / 10 | Search Volume: ${t.searchVolumeTier}`);
    console.log(`   RPM Tier      : ${t.rpmTier} | Urgency: ${t.urgency}`);
    console.log(`   Hook Angle    : "${t.hookAngle}"`);
    console.log(`   Titles        : 1) "${t.titles.browse}"`);
    console.log(`                   2) "${t.titles.search}"`);
    console.log(`   Story Summary : ${t.plotSummary}`);
    console.log(`   Continuity    : ${t.continuityBridge}`);
    console.log('------------------------------------------------------------------------');
  });

  console.log('\n💡 To generate the exact NexusFlow prompt for any idea, run:');
  console.log('   node cli.js next-video 1');
  console.log('   node cli.js apply-prompt 1\n');
}

async function handleNextVideo(rankArg) {
  const rank = parseInt(rankArg || '1', 10);
  console.log(`\nSynthesizing Continuity Story & NexusFlow Prompt for Trend Rank #${rank}...\n`);

  const continuity = generateContinuityPrompt(rank);

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  NEXT VIRAL VIDEO CONCEPT: ${continuity.trend.topic.toUpperCase().padEnd(41)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`Topic         : ${continuity.trend.topic}`);
  console.log(`Virality Score: ${continuity.trend.viralityScore} / 10`);
  console.log(`Hook Angle    : "${continuity.trend.hookAngle}"`);
  console.log(`Plot Summary  : ${continuity.trend.plotSummary}\n`);

  console.log('📜 [READY-TO-RUN NEXUSFLOW 3-SCENE PROMPT]');
  console.log('========================================================================');
  console.log(continuity.promptText);
  console.log('========================================================================\n');
  console.log('💡 To write this prompt directly to C:\\Google Flow Customized\\Prompt.txt, run:');
  console.log(`   node cli.js apply-prompt ${rank}\n`);
}

async function handleApplyPrompt(rankArg) {
  const rank = parseInt(rankArg || '1', 10);
  console.log(`\nDeploying Trend #${rank} prompt into NexusFlow Prompt.txt...\n`);

  const res = await applyPromptToNexusFlow(rank);
  console.log(`✅ ${res.message}`);
  console.log(`- Target File   : ${res.appliedTo}`);
  if (res.backupPath) console.log(`- Backup Saved  : ${res.backupPath}`);
  console.log(`- Scene Count   : ${res.sceneCount} cinematic scenes`);
  console.log('\n🚀 NexusFlow can now immediately generate the next video!\n');
}

async function handleQueue(videoPath) {
  const target = videoPath || findLatestVideo();
  console.log(`\nQueueing video with full SEO package: ${target}...\n`);

  const seo = await generateSeoPackage({ videoPath: target });
  const res = await queueVideo({
    videoPath: target,
    title: seo.titles.recommended,
    description: seo.description.fullText,
    tags: seo.tags.list,
    isShorts: seo.video.isShorts,
    durationSec: seo.video.durationSec,
    formattedDuration: seo.video.formattedDuration
  });

  console.log(`✅ Success! Video queued for YouTube Studio.`);
  console.log(`- Title : "${seo.titles.recommended}"`);
  console.log(`- Mode  : ${res.mode}`);
  console.log(`- ID    : ${res.item ? res.item.id : 'queued'}\n`);
}

async function handleFullCycle() {
  await runSeoPipeline({
    autoPublish: false
  });
}

function printHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║               YOUTUBE SEO WITH ANTIGRAVITY — CLI MANUAL                ║
╚════════════════════════════════════════════════════════════════════════╝

USAGE:
  node cli.js <command> [arguments]

COMMANDS:
  status                     Display complete ecosystem, channel, queue, and video status
  channel                    Inspect channel identity, niche pillars, and competitor benchmarks
  seo [videoPath]            Generate full algorithmic SEO package (titles, description, tags, hashtags)
  audit [videoPath]          Run deep 0-100 algorithmic SEO scorecard and optimization audit
  trends                     Discover top viral trend ideas ranked by algorithm demand & RPM
  next-video [rank]          Generate continuity story & production-grade 3-scene NexusFlow prompt
  apply-prompt [rank]        Deploy the next video prompt directly to C:\\Google Flow Customized\\Prompt.txt
  queue [videoPath]          Synthesize SEO package and add video to YouTube upload queue
  full-cycle                 Run end-to-end autonomous pipeline (Discover -> Probe -> SEO -> Audit -> Queue)
  help                       Show this help menu

EXAMPLES:
  node cli.js status
  node cli.js channel
  node cli.js seo
  node cli.js audit
  node cli.js trends
  node cli.js next-video 1
  node cli.js apply-prompt 1
  node cli.js full-cycle
`);
}

main();
