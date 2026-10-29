#!/usr/bin/env node
const monitor = require('./studioMonitor');
const manager = require('./studioManager');
const bridge = require('./nexusflowBridge');
const config = require('./config');

const args = process.argv.slice(2);
const command = args[0] || 'status';

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title.toUpperCase()}`);
  console.log('='.repeat(60));
}

switch (command.toLowerCase()) {
  case 'status': {
    printHeader('YouTube Studio Overview — ' + config.channel.name);
    const ov = monitor.getOverview();
    console.log(`Channel Name      : ${ov.channelName} (${ov.channelHandle})`);
    console.log(`Channel ID        : ${ov.channelId}`);
    console.log(`Current Subs      : ${ov.subscribers} (+${ov.subscribersGained28d} in last 28 days)`);
    console.log(`Views (28 Days)   : ${Number(ov.views28d).toLocaleString()}`);
    console.log(`Watch Time (28d)  : ${ov.watchTimeHours28d} hours`);
    console.log(`Published Content : ${ov.publishedVideosCount} videos/Shorts`);
    console.log(`Account Status    : ${ov.status}`);

    const latest = monitor.getLatestPerformance();
    if (latest) {
      console.log('\n--- LATEST SHORT PERFORMANCE ---');
      console.log(`Title             : ${latest.title}`);
      console.log(`Published Age     : ${latest.timeSincePublish}`);
      console.log(`Ranking by Views  : ${latest.rankingByViews}`);
      console.log(`Views             : ${latest.views}`);
      console.log(`APV (Retention)   : ${latest.averagePercentageViewed}% (Target: ${latest.benchmarkAPV})`);
      console.log(`Diagnostics       : ${latest.retentionVerdict}`);
    }

    console.log('\n--- TOP CONTENT (LAST 48 HOURS) ---');
    monitor.getTopContent().forEach((item, i) => {
      console.log(` ${i + 1}. ${item.title}`);
      console.log(`    48h Views: +${item.views48h} | Total: ${item.totalViews} | Likes: ${item.likes}`);
    });
    console.log('');
    break;
  }

  case 'audit': {
    printHeader('Studio Retention & Algorithmic Audit');
    const audit = monitor.auditPerformance();
    console.log(`Analyzed Videos   : ${audit.totalVideosAnalyzed}`);
    if (audit.topPerformer) {
      console.log(`Top Performer     : ${audit.topPerformer.title}`);
      console.log(`  Views           : ${audit.topPerformer.views} (${audit.topPerformer.likes} likes, ${audit.topPerformer.apv} APV)`);
    }
    console.log('\nKey Insights:');
    audit.insights.forEach(ins => console.log(`  • ${ins}`));
    console.log('\nActionable Next Steps:');
    audit.actionItems.forEach(item => console.log(`  → ${item}`));
    console.log('');
    break;
  }

  case 'earn':
  case 'monetization': {
    printHeader('YouTube Partner Program (YPP) Progress');
    const ypp = monitor.getMonetizationStatus();
    console.log(`Subscribers   : [${ypp.subscribers.current}/${ypp.subscribers.required}] - ${ypp.subscribers.percent}`);
    console.log(`Watch Hours   : [${ypp.watchHours.current}/${ypp.watchHours.required} hrs] - ${ypp.watchHours.percent}`);
    console.log(`Shorts Views  : [${ypp.shortsViews.current.toLocaleString()}/${ypp.shortsViews.required.toLocaleString()}] - ${ypp.shortsViews.percent}`);
    console.log(`Eligibility   : ${ypp.eligible ? 'ELIGIBLE TO APPLY!' : 'In Progress (Active Growth Phase)'}`);
    console.log(`Summary       : ${ypp.summary}`);
    console.log('');
    break;
  }

  case 'sync': {
    printHeader('NexusFlow Ledger Synchronization');
    const res = bridge.syncWithChannelLedger();
    console.log(res.message);
    const seoSignals = bridge.pushTopTrendsToSeoEngine();
    console.log(`SEO Trends Transferred: ${seoSignals.winningThemes.length} winning topics pushed.`);
    console.log('');
    break;
  }

  case 'moderate': {
    printHeader('Community & Comment Moderation');
    const mod = manager.moderateComments();
    console.log(`Total Comments : ${mod.totalComments}`);
    console.log(`Pending Review : ${mod.pendingReview}`);
    console.log(`Status         : ${mod.status}`);
    if (mod.latestComment) {
      console.log(`\nLatest Comment from ${mod.latestComment.author}:`);
      console.log(`  "${mod.latestComment.text}"`);
      console.log(`  Suggested Reply (${config.channel.persona}):`);
      console.log(`  "${mod.suggestedActions[0].recommendedReply}"`);
    }
    console.log('');
    break;
  }

  case 'content': {
    printHeader('Published Videos Catalog');
    const videos = monitor.getAllPublishedVideos();
    videos.forEach((v, idx) => {
      console.log(`${idx + 1}. [${v.type}] ${v.title}`);
      console.log(`   Views: ${v.views} | Likes: ${v.likes} | APV: ${v.apv}% | Visibility: ${v.visibility}`);
    });
    console.log('');
    break;
  }

  case 'pin': {
    const videoTitle = args.slice(1).join(' ') || 'Latest Upload';
    const pin = manager.generatePinnedComment(videoTitle);
    console.log('\n--- RECOMMENDED PINNED COMMENT ---');
    console.log(`Video: ${pin.videoTitle}`);
    console.log(`Comment: "${pin.pinnedComment}"`);
    console.log(`Tags: ${pin.recommendedTags.join(' ')}\n`);
    break;
  }

  default:
    console.log(`\nUsage: node cli.js [command]`);
    console.log(`Commands:`);
    console.log(`  status      Show live YouTube Studio dashboard stats`);
    console.log(`  audit       Analyze retention curves and APV patterns`);
    console.log(`  earn        Check YPP monetization milestones`);
    console.log(`  sync        Sync metrics with YouTube Channel History & Ledger`);
    console.log(`  moderate    Moderate comments and generate Marrow replies`);
    console.log(`  content     List all published videos and metrics`);
    console.log(`  pin [title] Generate high-engagement pinned question\n`);
    break;
}
