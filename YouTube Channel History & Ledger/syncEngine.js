const fs = require('fs');
const path = require('path');
const { paths, ensureDirs } = require('./config');
const { getChannelMemory, updateChannelMemory } = require('./channelMemory');
const { getVideoLedger, saveVideoLedger, recordVideo } = require('./historyLedger');
const { getCurrentNexusFlowPrompt, archivePrompt, parsePrompt } = require('./promptHistory');

/**
 * Scan and auto-synchronize all NexusFlow and YouTube Uploader files into the history ledger.
 */
async function syncEcosystem() {
  ensureDirs();
  const report = {
    timestamp: new Date().toISOString(),
    promptsSynced: 0,
    queueItemsSynced: 0,
    historyItemsSynced: 0,
    rawVideosFound: 0,
    channelAuthStatus: null,
    errors: []
  };

  // 1. Ingest Prompt.txt
  let currentPromptEntry = null;
  try {
    const rawPrompt = getCurrentNexusFlowPrompt();
    if (rawPrompt && rawPrompt.trim().length > 20) {
      currentPromptEntry = archivePrompt(rawPrompt, {
        title: 'The Subterranean Vaults of Alexandria - Archimedes Mechanism',
        arcId: 'arc_01_alexandria'
      });
      report.promptsSynced++;
    }
  } catch (e) {
    report.errors.push(`Prompt sync failed: ${e.message}`);
  }

  // 2. Ingest YouTube Uploader Queue
  let queueItems = [];
  if (fs.existsSync(paths.UPLOADER_QUEUE_FILE)) {
    try {
      queueItems = JSON.parse(fs.readFileSync(paths.UPLOADER_QUEUE_FILE, 'utf8'));
      if (Array.isArray(queueItems)) {
        queueItems.forEach(item => {
          const videoRecord = recordVideo({
            id: item.id || `vid_${path.basename(item.videoPath || 'video').replace(/[^a-zA-Z0-9]/g, '_')}`,
            title: item.title,
            videoPath: item.videoPath,
            filename: item.filename || path.basename(item.videoPath || 'video.mp4'),
            isShort: item.isShort !== undefined ? item.isShort : true,
            durationSec: item.duration || 24.0,
            formattedDuration: item.formattedDuration || '00:24',
            status: item.status === 'completed' ? 'published' : 'queued',
            timestamps: {
              createdAt: item.addedAt || new Date().toISOString(),
              queuedAt: item.addedAt || new Date().toISOString(),
              publishedAt: item.status === 'completed' ? item.completedAt : null
            },
            prompts: currentPromptEntry ? {
              promptId: currentPromptEntry.id,
              sceneCount: currentPromptEntry.sceneCount,
              dialogueQuotes: currentPromptEntry.dialogueQuotes,
              rawText: currentPromptEntry.rawText
            } : null,
            seo: {
              title: item.title,
              description: item.description,
              tags: item.tags || [],
              hashtags: extractHashtags(item.description)
            },
            youtube: {
              channelName: 'Bones of Empires',
              channelHandle: '@BonesOfEmpires',
              queueId: item.id,
              videoId: item.url ? extractYouTubeId(item.url) : null,
              videoUrl: item.url || null,
              visibility: item.visibility || 'public',
              status: item.status || 'pending'
            }
          });
          report.queueItemsSynced++;
        });
      }
    } catch (e) {
      report.errors.push(`Queue sync failed: ${e.message}`);
    }
  }

  // 3. Ingest Upload History if exists
  if (fs.existsSync(paths.UPLOADER_HISTORY_FILE)) {
    try {
      const historyItems = JSON.parse(fs.readFileSync(paths.UPLOADER_HISTORY_FILE, 'utf8'));
      if (Array.isArray(historyItems)) {
        historyItems.forEach(h => {
          recordVideo({
            id: h.id || `hist_${Date.now()}`,
            title: h.title,
            videoPath: h.videoPath,
            status: 'published',
            timestamps: {
              publishedAt: h.publishedAt || h.completedAt || new Date().toISOString()
            },
            youtube: {
              channelName: h.channelName || 'Bones of Empires',
              channelHandle: '@BonesOfEmpires',
              videoId: h.videoId || (h.url ? extractYouTubeId(h.url) : null),
              videoUrl: h.url,
              visibility: h.visibility || 'public',
              status: 'published'
            }
          });
          report.historyItemsSynced++;
        });
      }
    } catch (e) {
      report.errors.push(`History sync failed: ${e.message}`);
    }
  }

  // 4. Scan NexusFlow Result & Output Directory for videos
  const candidateDirs = [
    { dir: paths.NEXUSFLOW_RESULT_DIR, type: 'result' },
    { dir: paths.NEXUSFLOW_OUTPUT_DIR, type: 'output' }
  ];

  candidateDirs.forEach(({ dir, type }) => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.toLowerCase().endsWith('.mp4')) {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);
            const sizeMb = +(stats.size / (1024 * 1024)).toFixed(2);

            // Record into ledger if not already recorded
            recordVideo({
              filename: file,
              videoPath: fullPath,
              status: type === 'result' ? 'merged' : 'rendered',
              timestamps: {
                createdAt: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString(),
                renderedAt: stats.mtime.toISOString(),
                mergedAt: type === 'result' ? stats.mtime.toISOString() : null
              },
              notes: `Discovered from NexusFlow ${type} directory (${sizeMb} MB)`
            });
            report.rawVideosFound++;
          }
        });
      } catch (e) {
        report.errors.push(`Directory scan failed for ${dir}: ${e.message}`);
      }
    }
  });

  // 5. Check uploader session log
  if (fs.existsSync(paths.UPLOADER_LOG_FILE)) {
    try {
      const logs = fs.readFileSync(paths.UPLOADER_LOG_FILE, 'utf8');
      const authMatch = logs.match(/YouTube session active:\s*([^\r\n]+)/);
      if (authMatch) {
        const channelName = authMatch[1].trim();
        report.channelAuthStatus = {
          authenticated: true,
          channelName
        };
        updateChannelMemory({
          channel: { name: channelName }
        }, 'Sync from YouTube session logs');
      }
    } catch (e) {}
  }

  return report;
}

function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#\w+/g);
  return matches ? [...new Set(matches)] : [];
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

module.exports = {
  syncEcosystem
};
