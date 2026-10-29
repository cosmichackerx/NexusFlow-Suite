#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { paths, ensureDirs } = require('./config');
const { probeVideo, generateMetadataPackage } = require('./metadataGenerator');
const {
  getUploaderStatus,
  checkYoutubeAuth,
  getUploadQueue,
  addToUploadQueue,
  startUploadQueue,
  getUploadHistory,
  scanNexusFlowVideos
} = require('./bridgeClient');
const { runPipeline } = require('./pipeline');

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'status';

async function main() {
  ensureDirs();

  switch (command) {
    case 'status': {
      console.log('\n=== YouTube With Antigravity System Status ===\n');
      console.log(`NexusFlow Directory: ${paths.NEXUSFLOW_BASE_DIR}`);
      console.log(`YouTube Uploader   : ${paths.UPLOADER_ROOT}`);
      console.log(`Antigravity Skills : ${paths.ANTIGRAVITY_SKILLS}\n`);

      // 1. Videos
      const videos = scanNexusFlowVideos();
      console.log(`NexusFlow Videos   : ${videos.length} videos available (Result: ${videos.filter(v=>v.type==='result').length}, Clips: ${videos.filter(v=>v.type==='clip').length})`);

      // 2. Queue & History
      const queueRes = await getUploadQueue();
      const historyRes = await getUploadHistory();
      const queueList = queueRes.queue || [];
      const historyList = historyRes.history || [];
      console.log(`Upload Queue       : ${queueList.length} items (${queueList.filter(q=>q.status==='pending').length} pending)`);
      console.log(`Upload History     : ${historyList.length} published videos`);

      // 3. YouTube Auth
      console.log('\nChecking YouTube Studio session...');
      const auth = await checkYoutubeAuth(true);
      if (auth.loggedIn) {
        console.log(`Status             : Logged In`);
        console.log(`Channel Name       : ${auth.channelName}`);
        if (auth.channelUrl) console.log(`Channel URL        : ${auth.channelUrl}`);
      } else {
        console.log(`Status             : Not Logged In`);
      }
      console.log('\n==============================================\n');
      break;
    }

    case 'scan': {
      console.log('\n=== NexusFlow Video Inventory ===\n');
      const videos = scanNexusFlowVideos();
      if (videos.length === 0) {
        console.log('No videos found.');
      } else {
        videos.forEach((v, idx) => {
          console.log(`[${idx + 1}] [${v.type.toUpperCase()}] ${v.filename} (${v.sizeMb} MB)`);
          console.log(`    Path: ${v.path}`);
        });
      }
      console.log('\n');
      break;
    }

    case 'probe': {
      const targetPath = args[1] || path.join(paths.RESULT_DIR, 'Combined_Video_Full.mp4');
      console.log(`\nProbing video: ${targetPath}`);
      try {
        const probe = await probeVideo(targetPath);
        console.log(JSON.stringify(probe, null, 2));
      } catch (e) {
        console.error('Probe failed:', e.message);
      }
      break;
    }

    case 'metadata': {
      const targetPath = args[1] || path.join(paths.RESULT_DIR, 'Combined_Video_Full.mp4');
      console.log(`\nGenerating Antigravity Metadata for: ${targetPath}`);
      try {
        const meta = await generateMetadataPackage({ videoPath: targetPath });
        console.log(JSON.stringify(meta, null, 2));
      } catch (e) {
        console.error('Metadata generation failed:', e.message);
      }
      break;
    }

    case 'queue': {
      const targetPath = args[1] || path.join(paths.RESULT_DIR, 'Combined_Video_Full.mp4');
      console.log(`\nQueueing video: ${targetPath}`);
      const meta = await generateMetadataPackage({ videoPath: targetPath });
      const item = {
        videoPath: targetPath,
        title: meta.recommendedTitle,
        description: meta.description,
        tags: meta.tags,
        visibility: 'public',
        madeForKids: false,
        isShorts: meta.isShorts
      };
      const res = await addToUploadQueue(item);
      console.log('Queue result:', res);
      break;
    }

    case 'pipeline':
    case 'run': {
      await runPipeline({ autoStart: false });
      break;
    }

    case 'help':
    default: {
      console.log(`
Usage: node cli.js <command> [options]

Commands:
  status               Check overall system status, NexusFlow files, and YouTube session.
  scan                 Scan all generated videos in NexusFlow Output/ and Result/.
  probe [path]         Inspect video duration, resolution, and Shorts qualification with FFmpeg.
  metadata [path]      Generate complete retention-engineered titles, description, and tags.
  queue [path]         Synthesize metadata and add video to YouTube upload queue.
  pipeline             Run full automated end-to-end pipeline (Scan -> Probe -> Metadata -> Queue).
  help                 Display this help guide.
`);
      break;
    }
  }
}

main().catch(console.error);
