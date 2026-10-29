const fs = require('fs');
const path = require('path');
const { paths } = require('./config');
const { getMainWindow, log } = require('./logger');
const { getPromptHash } = require('./projectTracker');

let promptWatcher = null;

function generateVideoFilename(index, promptText) {
  let slug = '';
  const hash = getPromptHash(promptText);
  if (promptText) {
    const firstLine = promptText.trim().split(/[\r\n]+/)[0];
    slug = firstLine
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30)
      .replace(/_+$/, '');
  }
  return slug ? `${index}_${slug}_${hash}.mp4` : `${index}_${hash}.mp4`;
}

function recordVideoManifest(outputDir, index, filename, promptText) {
  try {
    const manifestPath = path.join(outputDir, 'manifest.json');
    let manifest = {};
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    manifest[String(index)] = {
      filename,
      hash: getPromptHash(promptText),
      updatedAt: Date.now()
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (e) {}
}

function findExistingVideoForIndex(dir, index, promptText = null) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);

  if (promptText) {
    const hash = getPromptHash(promptText);
    const hashRegex = new RegExp(`^${index}_.*_${hash}\\.mp4$`, 'i');
    const matchedHash = files.find(f => hashRegex.test(f));
    if (matchedHash) return path.join(dir, matchedHash);

    const manifestPath = path.join(dir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const entry = manifest[String(index)];
        if (entry && entry.hash === hash && entry.filename) {
          const mPath = path.join(dir, entry.filename);
          if (fs.existsSync(mPath)) return mPath;
        }
      } catch (e) {}
    }

    // Prompt changed: any old file at this index belongs to a different prompt!
    return null;
  }

  const regex = new RegExp(`^${index}(_.*)?\\.mp4$`, 'i');
  const matched = files.filter(f => regex.test(f));
  if (matched.length === 0) return null;
  return path.join(dir, matched[0]);
}

function generateFrameFilename(index, promptText, videoPath) {
  if (videoPath) {
    const base = path.parse(videoPath).name;
    return `${base}_last_frame.jpg`;
  }
  let slug = '';
  const hash = getPromptHash(promptText);
  if (promptText) {
    const firstLine = promptText.trim().split(/[\r\n]+/)[0];
    slug = firstLine
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30)
      .replace(/_+$/, '');
  }
  return slug ? `${index}_${slug}_${hash}_last_frame.jpg` : `${index}_${hash}_last_frame.jpg`;
}

function findExistingFrameForIndex(dir, index) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const regex = new RegExp(`^${index}(_.*)?_last_frame\\.(jpg|jpeg|png)$`, 'i');
  const matched = files.filter(f => regex.test(f));
  if (matched.length === 0) return null;
  return path.join(dir, matched[0]);
}

function getPromptStats(currentRunningIndex = null) {
  let total = 0;
  let completed = 0;
  let remaining = 0;
  let current = currentRunningIndex !== null ? currentRunningIndex + 1 : 0;
  
  try {
    if (fs.existsSync(paths.PROMPT_FILE)) {
      const promptText = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
      const prompts = promptText.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(p => p);
      total = prompts.length;
      
      if (fs.existsSync(paths.OUTPUT_DIR)) {
        for (let idx = 0; idx < total; idx++) {
          if (findExistingVideoForIndex(paths.OUTPUT_DIR, idx, prompts[idx])) {
            completed++;
          }
        }
      }
      
      remaining = Math.max(0, total - completed);
    }
  } catch(e) {}

  return {
    total,
    current,
    remaining,
    completed,
    status: currentRunningIndex !== null ? 'running' : (total > 0 && completed === total ? 'completed' : 'idle')
  };
}

function broadcastPromptStats(currentRunningIndex = null) {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    const stats = getPromptStats(currentRunningIndex);
    mainWindow.webContents.send('prompt-stats-updated', stats);
  }
}

function loadPrompt() {
  const mainWindow = getMainWindow();
  try {
    if (fs.existsSync(paths.PROMPT_FILE)) {
      const prompt = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('prompt-loaded', prompt);
      }
    } else {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('prompt-loaded', '');
      }
    }
    broadcastPromptStats();
  } catch (error) {
    log('error', `Failed to read prompt: ${error.message}`);
  }
}

function setupPromptWatcher() {
  if (promptWatcher) {
    promptWatcher.close();
    promptWatcher = null;
  }
  if (fs.existsSync(paths.PROMPT_FILE)) {
    promptWatcher = fs.watch(paths.PROMPT_FILE, (eventType) => {
      if (eventType === 'change') {
        setTimeout(() => {
          loadPrompt();
        }, 100);
      }
    });
  }
}

function stopPromptWatcher() {
  if (promptWatcher) {
    promptWatcher.close();
    promptWatcher = null;
    log('info', 'Stopped file watcher to save resources.');
  }
}

module.exports = {
  generateVideoFilename,
  recordVideoManifest,
  findExistingVideoForIndex,
  generateFrameFilename,
  findExistingFrameForIndex,
  getPromptStats,
  broadcastPromptStats,
  loadPrompt,
  setupPromptWatcher,
  stopPromptWatcher
};
