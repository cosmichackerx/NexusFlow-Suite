#!/usr/bin/env node
const accountManager = require('./accountManager');
const pipelineManager = require('./pipelineManager');
const auditor = require('./logAuditor');

const args = process.argv.slice(2);
const command = args[0] || 'status';

async function main() {
  switch (command.toLowerCase()) {
    case 'status': {
      console.log('\n=== ALL IN ONE ANTIGRAVITY MASTER STATUS ===');
      console.log(JSON.stringify(pipelineManager.getPipelineStatus(), null, 2));
      break;
    }

    case 'accounts': {
      console.log('\n=== REGISTERED GOOGLE ACCOUNT POOL ===');
      console.log(JSON.stringify(accountManager.getAccountsState(), null, 2));
      break;
    }

    case 'switch': {
      const email = args[1];
      if (!email) {
        console.error('Usage: node cli.js switch <email>');
        process.exit(1);
      }
      accountManager.switchAccount(email);
      break;
    }

    case 'auto-shift': {
      console.log('\n=== AUDITING ACCOUNTS FOR AUTO-SHIFT (< 10 CREDITS) ===');
      const res = accountManager.checkAndAutoShift();
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case 'prompt': case 'gen-prompt': {
      const theme = args[1] || 'alexandria';
      console.log(`\n=== GENERATING 3-SCENE CONTINUITY PROMPTS FOR: ${theme} ===`);
      const res = await pipelineManager.generatePrompts(theme);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case 'merge': {
      console.log('\n=== MERGING CLIPS WITH FFMPEG ===');
      const res = await pipelineManager.mergeClips();
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case 'queue': {
      console.log('\n=== QUEUEING MASTER VIDEO FOR YOUTUBE SHORTS ===');
      const res = await pipelineManager.queueForUpload();
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case 'run': case 'pipeline': {
      const theme = args[1] || 'alexandria';
      console.log(`\n=== EXECUTING COMPLETE AUTONOMOUS PIPELINE FOR: ${theme} ===`);
      const res = await pipelineManager.runFullAutonomousPipeline(theme);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    default: {
      console.log(`
Commands:
  node cli.js status        - Show ecosystem status
  node cli.js accounts      - List 6 Google accounts & credits
  node cli.js switch <mail> - Switch active NexusFlow account
  node cli.js auto-shift    - Shift account if credits < 10
  node cli.js prompt [thm]  - Generate 3-scene character-locked prompt
  node cli.js merge         - Losslessly merge clips to Combined_Video_Full.mp4
  node cli.js queue         - Enqueue YouTube Short targeting astravoidxecho
  node cli.js run [thm]     - Execute complete autonomous pipeline
      `);
      break;
    }
  }
}

main().catch(err => {
  console.error('CLI Error:', err);
  process.exit(1);
});
