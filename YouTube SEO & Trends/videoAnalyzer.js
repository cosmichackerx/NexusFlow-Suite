const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { paths } = require('./config');

/**
 * Probe video metadata using FFmpeg binary.
 */
function probeVideo(videoPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found at: ${videoPath}`));
    }

    const ffmpeg = paths.FFMPEG;
    const proc = spawn(ffmpeg, ['-i', videoPath], { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    proc.on('close', () => {
      // Extract duration
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      let durationSec = 0;
      if (durationMatch) {
        durationSec = parseInt(durationMatch[1], 10) * 3600 +
                      parseInt(durationMatch[2], 10) * 60 +
                      parseFloat(durationMatch[3]);
      }

      // Extract resolution
      const resMatch = stderr.match(/Stream #\d+:\d+.*Video:.*,\s*(\d{2,5})x(\d{2,5})/);
      let width = 0;
      let height = 0;
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      // Extract FPS
      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
      const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 24;

      // Extract Bitrate
      const bitrateMatch = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/);
      const bitrateKbps = bitrateMatch ? parseInt(bitrateMatch[1], 10) : 0;

      // Has audio?
      const hasAudio = /Stream #\d+:\d+.*Audio:/i.test(stderr);

      const isVertical = height > width;
      const isSquare = width === height && width > 0;
      const isShorts = durationSec > 0 && durationSec <= 60 && (isVertical || isSquare);

      let stats = null;
      try {
        stats = fs.statSync(videoPath);
      } catch (e) {}

      resolve({
        path: videoPath,
        filename: path.basename(videoPath),
        sizeBytes: stats ? stats.size : 0,
        sizeMb: stats ? (stats.size / (1024 * 1024)).toFixed(2) : '0',
        durationSec: Math.round(durationSec * 100) / 100,
        formattedDuration: formatDuration(durationSec),
        width,
        height,
        resolution: width && height ? `${width}x${height}` : 'unknown',
        aspectRatio: width && height ? (width / height).toFixed(2) : 'unknown',
        aspectRatioLabel: isVertical ? '9:16 (Vertical)' : (isSquare ? '1:1 (Square)' : '16:9 (Horizontal)'),
        fps,
        bitrateKbps,
        hasAudio,
        isVertical,
        isShorts,
        formatCategory: isShorts ? 'YouTube Short' : 'Standard Long-Form Video'
      });
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to invoke FFmpeg: ${err.message}`));
    });
  });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Extract candidate review thumbnail frames at specific second timestamps.
 */
function extractReviewFrames(videoPath, timestamps = [2, 6, 12, 18], outputDir = null) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found: ${videoPath}`));
    }

    const targetDir = outputDir || path.join(paths.USER_DATA_DIR, 'extracted-frames');
    if (!fs.existsSync(targetDir)) {
      try { fs.mkdirSync(targetDir, { recursive: true }); } catch (e) {}
    }

    const ffmpeg = paths.FFMPEG;
    const extracted = [];
    let completed = 0;

    if (timestamps.length === 0) return resolve([]);

    timestamps.forEach((timeSec) => {
      const outPath = path.join(targetDir, `frame_${timeSec}s_${path.basename(videoPath, path.extname(videoPath))}.jpg`);
      const proc = spawn(ffmpeg, [
        '-y',
        '-ss', timeSec.toString(),
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        outPath
      ], { windowsHide: true });

      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outPath)) {
          extracted.push({
            timestampSec: timeSec,
            path: outPath,
            filename: path.basename(outPath)
          });
        }
        completed++;
        if (completed === timestamps.length) {
          resolve(extracted);
        }
      });

      proc.on('error', () => {
        completed++;
        if (completed === timestamps.length) {
          resolve(extracted);
        }
      });
    });
  });
}

/**
 * Parse NexusFlow Prompt.txt to extract characters, dialogue, setting, and continuity anchors.
 */
function parseNexusFlowPrompts(promptFilePath = null) {
  const targetFile = promptFilePath || paths.NEXUSFLOW_PROMPT_FILE;
  if (!fs.existsSync(targetFile)) {
    return {
      scenes: [],
      rawText: '',
      characters: ['Marrow'],
      dialogues: [],
      locations: ['Ancient Cistern, Alexandria'],
      summary: 'Cinematic 3D animation'
    };
  }

  const raw = fs.readFileSync(targetFile, 'utf8');
  const blocks = raw.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean);

  const allDialogues = [];
  const allCharacters = new Set();
  const allLocations = new Set();

  const scenes = blocks.map((block, idx) => {
    // Character
    const charMatch = block.match(/CHARACTER\s*["']?([^"':\n]+)["']?/i);
    const charName = charMatch ? charMatch[1].trim() : 'Marrow';
    allCharacters.add(charName);

    // Dialogue quotes (filter out character name and metadata strings)
    const dialogueMatches = [...block.matchAll(/"([^"]{4,160})"/g)]
      .map(m => m[1].trim())
      .filter(t => t.toLowerCase() !== charName.toLowerCase() && t.toLowerCase() !== 'marrow');
    dialogueMatches.forEach(d => allDialogues.push({ scene: idx + 1, character: charName, text: d }));

    // Continuity / Location
    const contMatch = block.match(/CONTINUITY LOCK:\s*([^.\n]+)/i);
    if (contMatch) {
      allLocations.add(contMatch[1].trim());
    }

    // Audio / SFX
    const sfxMatch = block.match(/SFX:\s*([^.\n]+)/i);
    const timingMatch = block.match(/TIMING:\s*([^.\n]+(?:\.[^.\n]+)?)/i);

    return {
      sceneIndex: idx + 1,
      character: charName,
      firstLine: block.split('\n')[0].substring(0, 160),
      dialogues: dialogueMatches,
      continuity: contMatch ? contMatch[1].trim() : 'Ancient subterranean chamber',
      timing: timingMatch ? timingMatch[1].trim() : '',
      sfx: sfxMatch ? sfxMatch[1].trim() : '',
      fullText: block
    };
  });

  return {
    scenes,
    rawText: raw,
    characters: Array.from(allCharacters),
    dialogues: allDialogues,
    locations: Array.from(allLocations),
    summary: scenes.length > 0
      ? `A ${scenes.length}-scene cinematic sequence following ${Array.from(allCharacters).join(', ')} navigating ${Array.from(allLocations).join(' and ')}.`
      : 'Cinematic 3D animation'
  };
}

module.exports = {
  probeVideo,
  formatDuration,
  extractReviewFrames,
  parseNexusFlowPrompts
};
