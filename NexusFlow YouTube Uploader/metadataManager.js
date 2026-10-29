const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { paths, loadSettings } = require('./config');
const { log } = require('./logger');

function probeVideo(videoPath) {
  return new Promise((resolve) => {
    if (!videoPath || !fs.existsSync(videoPath)) {
      return resolve({
        exists: false,
        duration: 0,
        formattedDuration: '00:00',
        width: 0,
        height: 0,
        isShort: false,
        aspectRatio: 'Unknown',
        error: 'File does not exist'
      });
    }

    try {
      const res = cp.spawnSync(ffmpegPath, ['-i', videoPath]);
      const stderr = res.stderr ? res.stderr.toString() : '';

      // Parse Duration: 00:00:24.02
      let durationSec = 0;
      let formattedDuration = '00:00';
      const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
      if (durMatch) {
        const hours = parseInt(durMatch[1], 10);
        const mins = parseInt(durMatch[2], 10);
        const secs = parseFloat(durMatch[3]);
        durationSec = hours * 3600 + mins * 60 + secs;
        const totalSecInt = Math.round(durationSec);
        const m = Math.floor(totalSecInt / 60);
        const s = totalSecInt % 60;
        formattedDuration = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      // Parse Resolution: 720x1280
      let width = 0;
      let height = 0;
      const resMatch = stderr.match(/Video:.*,\s*(\d{3,4})x(\d{3,4})/);
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      // Parse FPS
      let fps = 30;
      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
      if (fpsMatch) {
        fps = parseFloat(fpsMatch[1]);
      }

      // YouTube Shorts criteria: duration <= 60 seconds and vertical or square (height >= width)
      const isShort = durationSec > 0 && durationSec <= 60.5 && height >= width;
      let aspectRatio = '16:9';
      if (width && height) {
        const ratio = width / height;
        if (Math.abs(ratio - 9 / 16) < 0.1 || height > width * 1.2) {
          aspectRatio = '9:16 (Vertical)';
        } else if (Math.abs(ratio - 1) < 0.1) {
          aspectRatio = '1:1 (Square)';
        } else {
          aspectRatio = '16:9 (Horizontal)';
        }
      }

      const stats = fs.statSync(videoPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      resolve({
        exists: true,
        filename: path.basename(videoPath),
        videoPath,
        sizeMB,
        duration: Math.round(durationSec * 100) / 100,
        formattedDuration,
        width,
        height,
        fps,
        isShort,
        aspectRatio
      });
    } catch (e) {
      resolve({
        exists: true,
        filename: path.basename(videoPath),
        videoPath,
        duration: 0,
        formattedDuration: '00:00',
        width: 0,
        height: 0,
        isShort: false,
        aspectRatio: 'Unknown',
        error: e.message
      });
    }
  });
}

function extractNexusFlowPrompt(videoPath) {
  try {
    const filename = path.basename(videoPath);
    // NexusFlow files are named: <index>_<rest> or Combined_Video...
    const match = filename.match(/^(\d+)_/);
    if (!match) return null;
    const index = parseInt(match[1], 10);

    if (fs.existsSync(paths.NEXUSFLOW_PROMPT_FILE)) {
      const text = fs.readFileSync(paths.NEXUSFLOW_PROMPT_FILE, 'utf8');
      const prompts = text.split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean);
      if (prompts[index]) {
        return {
          index,
          promptText: prompts[index]
        };
      }
    }
  } catch (e) {}
  return null;
}

function formatUploadMetadata({ videoPath, title, description, tags, visibility, probeData }) {
  const settings = loadSettings();
  const filename = path.basename(videoPath);
  const probe = probeData || { isShort: false };

  // 1. Determine Title
  let finalTitle = (title || '').trim();
  if (!finalTitle) {
    const promptInfo = extractNexusFlowPrompt(videoPath);
    if (promptInfo && promptInfo.promptText) {
      // Create a punchy title from prompt (take first sentence or first 70 chars)
      const firstLine = promptInfo.promptText.split(/[\.\n]/)[0].trim();
      finalTitle = firstLine.length > 70 ? firstLine.substring(0, 67) + '...' : firstLine;
    } else {
      // Fallback from filename
      const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      finalTitle = cleanName;
    }
  }

  // Handle Shorts hashtag
  if (probe.isShort && settings.addShortsTag) {
    if (!/#shorts/i.test(finalTitle)) {
      if (finalTitle.length + 9 <= 100) {
        finalTitle = `${finalTitle} #Shorts`;
      } else {
        finalTitle = `${finalTitle.substring(0, 91)}... #Shorts`;
      }
    }
  }

  // Ensure title length <= 100 chars (YouTube max limit)
  if (finalTitle.length > 100) {
    finalTitle = finalTitle.substring(0, 97) + '...';
  }

  // 2. Determine Description
  let finalDescription = (description || '').trim();
  if (!finalDescription) {
    const promptInfo = extractNexusFlowPrompt(videoPath);
    if (promptInfo && promptInfo.promptText) {
      finalDescription = promptInfo.promptText;
    } else {
      finalDescription = finalTitle;
    }
  }

  if (probe.isShort && settings.addShortsTag && !/#shorts/i.test(finalDescription)) {
    finalDescription = `${finalDescription}\n\n#Shorts #YouTubeShorts`;
  }

  if (settings.descriptionTemplate && !finalDescription.includes('Created with NexusFlow')) {
    finalDescription = `${finalDescription}\n\nCreated with NexusFlow AI`;
  }

  // Ensure description <= 5000 chars
  if (finalDescription.length > 5000) {
    finalDescription = finalDescription.substring(0, 4995) + '...';
  }

  // 3. Determine Tags
  let finalTags = [];
  if (Array.isArray(tags) && tags.length > 0) {
    finalTags = [...tags];
  } else if (typeof tags === 'string' && tags.trim()) {
    finalTags = tags.split(',').map(t => t.trim()).filter(Boolean);
  } else {
    finalTags = [...(settings.defaultTags || ['NexusFlow', 'AI'])];
  }

  if (probe.isShort) {
    if (!finalTags.some(t => t.toLowerCase() === 'shorts')) finalTags.push('Shorts');
    if (!finalTags.some(t => t.toLowerCase() === 'youtubeshorts')) finalTags.push('YouTubeShorts');
  }

  // 4. Visibility
  const finalVisibility = visibility || settings.defaultVisibility || 'public';

  return {
    title: finalTitle,
    description: finalDescription,
    tags: finalTags,
    visibility: finalVisibility,
    isShort: !!probe.isShort
  };
}

module.exports = {
  probeVideo,
  extractNexusFlowPrompt,
  formatUploadMetadata
};
