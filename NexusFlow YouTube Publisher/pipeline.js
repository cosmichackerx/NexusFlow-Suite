#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { paths, ensureDirs } = require('./config');
const { probeVideo, generateMetadataPackage } = require('./metadataGenerator');
const {
  getUploaderStatus,
  checkYoutubeAuth,
  addToUploadQueue,
  startUploadQueue,
  getUploadQueue,
  scanNexusFlowVideos
} = require('./bridgeClient');

async function runPipeline(options = {}) {
  ensureDirs();
  console.log('\n======================================================');
  console.log('   YOUTUBE WITH ANTIGRAVITY — AUTONOMOUS PIPELINE   ');
  console.log('======================================================\n');

  // Step 1: Scan NexusFlow videos
  console.log('[Step 1/5] Scanning NexusFlow video outputs...');
  const videos = scanNexusFlowVideos();
  console.log(`Found ${videos.length} videos across Result and Output directories.`);

  if (videos.length === 0) {
    console.log('No video files found in NexusFlow directories.');
    return { success: false, reason: 'No videos found.' };
  }

  // Priority: Merged full video (Combined_Video_Full.mp4) > Recent Result > Recent Clip
  let targetVideo = videos.find(v => v.filename === 'Combined_Video_Full.mp4');
  if (!targetVideo) {
    targetVideo = videos.find(v => v.type === 'result') || videos[0];
  }

  console.log(`Target video selected: ${targetVideo.filename} (${targetVideo.sizeMb} MB)`);
  console.log(`Path: ${targetVideo.path}`);

  // Step 2: Probe Video with FFmpeg
  console.log('\n[Step 2/5] Probing video dimensions & format...');
  const probe = await probeVideo(targetVideo.path);
  console.log(`- Resolution : ${probe.resolution}`);
  console.log(`- Duration   : ${probe.formattedDuration} (${probe.durationSec}s)`);
  console.log(`- Format     : ${probe.isShorts ? '⚡ YouTube Shorts (Vertical)' : 'Standard 16:9 Video'}`);

  // Step 3: Check YouTube Studio Authentication
  console.log('\n[Step 3/5] Verifying YouTube Studio authentication...');
  const auth = await checkYoutubeAuth(true);
  if (auth.loggedIn) {
    console.log(`Authenticated as Channel: "${auth.channelName}"`);
    if (auth.channelUrl) console.log(`Channel URL: ${auth.channelUrl}`);
  } else {
    console.log('Warning: YouTube Studio session is not logged in. Queueing will succeed, but login is required before uploading.');
  }

  // Step 4: Generate High-Conversion Metadata Package
  console.log('\n[Step 4/5] Synthesizing Antigravity Metadata Package...');
  const meta = await generateMetadataPackage({
    videoPath: targetVideo.path,
    channelName: auth.channelName || 'Bones of Empires'
  });

  console.log(`\n--- Generated Metadata ---`);
  console.log(`Title       : ${meta.recommendedTitle}`);
  console.log(`Visibility  : ${meta.visibility}`);
  console.log(`Tags (${meta.tags.length}) : ${meta.tags.slice(0, 5).join(', ')}...`);
  console.log(`Description preview:\n${meta.description.substring(0, 160)}...\n`);

  // Step 5: Queue Video into YouTube Uploader
  console.log('[Step 5/5] Queueing video for automated upload...');
  const queueItem = {
    videoPath: targetVideo.path,
    title: meta.recommendedTitle,
    description: meta.description,
    tags: meta.tags,
    visibility: options.visibility || 'public',
    madeForKids: false,
    isShorts: meta.isShorts,
    scheduledTime: options.scheduledTime || null
  };

  const addResult = await addToUploadQueue(queueItem);
  if (addResult.success) {
    console.log(`Successfully added to YouTube upload queue! Item ID: ${addResult.added ? addResult.added.id : 'Queued'}`);
  } else {
    console.log(`Queueing notice: ${addResult.error || 'Saved to disk queue'}`);
  }

  // Check current queue
  const queueRes = await getUploadQueue();
  console.log(`Total items currently in queue: ${queueRes.queue ? queueRes.queue.length : 1}`);

  if (options.autoStart) {
    console.log('\nInitiating automated background upload...');
    await startUploadQueue();
    console.log('Upload queue initiated.');
  }

  console.log('\n======================================================');
  console.log('   PIPELINE COMPLETE — VIDEO READY FOR PUBLISHING    ');
  console.log('======================================================\n');

  return {
    success: true,
    video: targetVideo,
    probe,
    auth,
    metadata: meta,
    queued: true
  };
}

if (require.main === module) {
  runPipeline({ autoStart: false }).catch(err => {
    console.error('Pipeline execution error:', err);
    process.exit(1);
  });
}

module.exports = {
  runPipeline
};
