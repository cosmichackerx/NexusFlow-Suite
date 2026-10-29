const fs = require('fs');
const path = require('path');
const { paths, ensureDirs, loadConfig } = require('./config');
const { getSystemStatus } = require('./systemStatus');
const { probeVideo, formatDuration } = require('./videoAnalyzer');
const { generateSeoPackage, findLatestVideo } = require('./seoEngine');
const { auditMetadata } = require('./seoAuditor');
const { queueVideo, startQueue } = require('./publisherBridge');

/**
 * Execute the autonomous YouTube SEO & Publishing Pipeline.
 */
async function runSeoPipeline(options = {}) {
  ensureDirs();
  const startTime = Date.now();

  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║       YOUTUBE SEO WITH ANTIGRAVITY — AUTONOMOUS PIPELINE RUNNER        ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  // Step 1: Discover Video Asset
  console.log('[Step 1/5] Discovering video assets in NexusFlow...');
  const targetVideoPath = options.videoPath || findLatestVideo();
  if (!targetVideoPath || !fs.existsSync(targetVideoPath)) {
    throw new Error('No video file found in NexusFlow Output or Result directories.');
  }

  // Step 2: Deep Video Probe
  console.log('[Step 2/5] Probing video dimensions, bitrate, and Shorts status with FFmpeg...');
  const probe = await probeVideo(targetVideoPath);
  console.log(`  - File       : ${probe.filename} (${probe.sizeMb} MB)`);
  console.log(`  - Format     : ${probe.formatCategory} (${probe.aspectRatioLabel})`);
  console.log(`  - Duration   : ${probe.formattedDuration} (${probe.durationSec}s @ ${probe.fps} fps)`);
  console.log(`  - Resolution : ${probe.resolution}`);

  // Step 3: Synthesize Algorithmic SEO Package
  console.log('\n[Step 3/5] Synthesizing High-Conversion SEO Package...');
  const seoPackage = await generateSeoPackage({
    videoPath: targetVideoPath,
    channelName: options.channelName
  });

  console.log(`  - Recommended Title : "${seoPackage.titles.recommended}"`);
  console.log(`  - Title Variants    : 4 generated (Browse, Search, Hybrid, Shorts)`);
  console.log(`  - Description       : ${seoPackage.description.characterCount} characters`);
  console.log(`  - Tag Package       : ${seoPackage.tags.count} tags (${seoPackage.tags.characterCount}/500 chars)`);
  console.log(`  - Primary Hashtags  : ${seoPackage.hashtags.primaryFormatted}`);

  // Step 4: Run Algorithmic SEO Audit Scorecard
  console.log('\n[Step 4/5] Executing Algorithmic SEO Quality Audit...');
  const audit = auditMetadata(seoPackage);
  console.log(`  - Algorithmic Score : ${audit.totalScore} / 100 [Grade: ${audit.grade}]`);
  console.log(`  - Verdict           : ${audit.verdict}`);
  console.log(`  - Pillars           : Title: ${audit.pillarScores.title} | Desc: ${audit.pillarScores.description} | Tags: ${audit.pillarScores.tags}`);

  // Step 5: Queue Video into YouTube Studio Uploader
  console.log('\n[Step 5/5] Queueing video for automated publishing...');
  const queuePayload = {
    videoPath: targetVideoPath,
    title: options.title || seoPackage.titles.recommended,
    description: seoPackage.description.fullText,
    tags: seoPackage.tags.list,
    visibility: options.visibility || 'public',
    isShorts: probe.isShorts,
    durationSec: probe.durationSec,
    formattedDuration: probe.formattedDuration
  };

  const queueResult = await queueVideo(queuePayload);
  console.log(`  - Queue Status      : ${queueResult.success ? 'SUCCESS' : 'FAILED'} (${queueResult.mode})`);
  console.log(`  - Queue Message     : ${queueResult.message}`);

  if (options.autoPublish) {
    console.log('\nInitiating automated upload trigger via bridge...');
    const pubResult = await startQueue();
    console.log(`  - Trigger Result    : ${pubResult.message}`);
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n Pipeline execution completed in ${elapsedSec}s.\n`);

  return {
    success: true,
    elapsedSec,
    video: probe,
    seoPackage,
    audit,
    queueResult
  };
}

module.exports = {
  runSeoPipeline
};
