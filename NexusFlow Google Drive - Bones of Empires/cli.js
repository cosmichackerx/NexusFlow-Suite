#!/usr/bin/env node
const { exec } = require('child_process');
const driveManager = require('./driveManager');
const syncEngine = require('./syncEngine');
const config = require('./config');

const args = process.argv.slice(2);
const command = args[0] || 'status';

function formatHeader(title) {
  console.log('\n' + '='.repeat(68));
  console.log(`  NEXUSFLOW GOOGLE DRIVE — BONES OF EMPIRES: ${title.toUpperCase()}`);
  console.log('='.repeat(68));
}

switch (command.toLowerCase()) {
  case 'status': {
    formatHeader('Cloud & Local Status');
    const status = driveManager.getStatus();
    console.log(`\n📁 Google Drive Folder: ${status.folderName}`);
    console.log(`🆔 Drive Folder ID:    ${status.folderId}`);
    console.log(`🔗 Web URL:             ${status.driveUrl}`);
    console.log(`📺 Target Channel:      ${status.channel.name} (${status.channel.handle})`);
    console.log(`👤 Character Persona:   ${status.channel.persona}`);

    console.log('\n📄 Tracked Markdown Documents:');
    Object.entries(status.trackedFiles).forEach(([name, info]) => {
      const icon = info.exists ? '✅' : '❌';
      console.log(`  ${icon} ${name.padEnd(20)} | ${info.sizeBytes} bytes | Drive: ${info.driveLocation}`);
    });

    console.log(`\n🎬 Finished Shorts in Local Staging (${status.finishedShortsCount}):`);
    if (status.finishedShorts.length === 0) {
      console.log('  (No shorts staged yet. Run "node cli.js stage" to import from NexusFlow Result)');
    } else {
      status.finishedShorts.forEach(short => {
        console.log(`  🎞️  ${short.filename} (${short.sizeMB} MB)`);
      });
    }
    console.log('\n');
    break;
  }

  case 'plan': {
    formatHeader('Channel Master Plan');
    const plan = driveManager.getChannelPlan();
    if (plan) {
      console.log(plan);
    } else {
      console.log('channel-plan.md not found in data directory.');
    }
    break;
  }

  case 'progress': {
    formatHeader('Production Progress Ledger');
    const prog = driveManager.getProgress();
    if (prog) {
      console.log(prog);
    } else {
      console.log('PROGRESS.md not found in data directory.');
    }
    break;
  }

  case 'metadata': {
    formatHeader('Shorts Metadata & Publishing Registry');
    const meta = driveManager.getShortsMetadata();
    if (meta) {
      console.log(meta);
    } else {
      console.log('shorts-metadata.md not found in data directory.');
    }
    break;
  }

  case 'stage': {
    formatHeader('Stage Rendered Video');
    const scan = syncEngine.scanResultDirectory();
    console.log(`Scanning NexusFlow Result Directory: ${config.paths.googleFlowResultDir}`);
    console.log(`Found ${scan.found} completed video(s).`);

    if (scan.items.length > 0) {
      const latest = scan.items[0];
      const targetName = args[1] || 'BOE_EP01_Alexandria_The_Archimedes_Vault_9x16.mp4';
      console.log(`Staging: ${latest.filename} -> ${targetName}`);
      const res = syncEngine.stageVideo(latest.fullPath, targetName);
      console.log(`✅ Success! Staged to: ${res.stagedPath} (${(res.fileSizeBytes / (1024*1024)).toFixed(2)} MB)`);
    } else {
      console.log('⚠️ No MP4 files found in NexusFlow Result folder.');
    }
    break;
  }

  case 'manifest': {
    formatHeader('Google Drive Sync Manifest');
    const manifest = syncEngine.generateDriveManifest();
    console.log(JSON.stringify(manifest, null, 2));
    break;
  }

  case 'open': {
    console.log(`Opening Bones of Empires Google Drive: ${config.googleDrive.webUrl}`);
    const startCmd = process.platform === 'win32' ? `start "" "${config.googleDrive.webUrl}"` : `open "${config.googleDrive.webUrl}"`;
    exec(startCmd);
    break;
  }

  default: {
    console.log(`Usage: node cli.js [status|plan|progress|metadata|stage|manifest|open]`);
    break;
  }
}
