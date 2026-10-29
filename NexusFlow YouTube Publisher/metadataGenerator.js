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
      return reject(new Error(`Video file not found: ${videoPath}`));
    }

    const ffmpeg = paths.FFMPEG;
    const proc = spawn(ffmpeg, ['-i', videoPath], { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    proc.on('close', () => {
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      let durationSec = 0;
      if (durationMatch) {
        durationSec = parseInt(durationMatch[1], 10) * 3600 +
                      parseInt(durationMatch[2], 10) * 60 +
                      parseFloat(durationMatch[3]);
      }

      const resMatch = stderr.match(/Stream #\d+:\d+.*Video:.*,\s*(\d{2,5})x(\d{2,5})/);
      let width = 0;
      let height = 0;
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      const isVertical = height > width;
      const isShorts = durationSec <= 60 && (isVertical || width === height);

      let stats = null;
      try {
        stats = fs.statSync(videoPath);
      } catch (e) {}

      resolve({
        path: videoPath,
        filename: path.basename(videoPath),
        sizeBytes: stats ? stats.size : 0,
        sizeMb: stats ? (stats.size / (1024 * 1024)).toFixed(2) : '0',
        durationSec: Math.round(durationSec * 10) / 10,
        formattedDuration: formatDuration(durationSec),
        width,
        height,
        resolution: `${width}x${height}`,
        isVertical,
        isShorts,
        aspectRatio: width && height ? (width / height).toFixed(2) : 'unknown'
      });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Parse NexusFlow Prompt.txt to extract scene prompts, character details, and dialogue.
 */
function parseNexusFlowPrompts() {
  if (!fs.existsSync(paths.PROMPT_FILE)) {
    return [];
  }

  const raw = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
  // Split on double linebreaks or scenes
  const blocks = raw.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean);

  return blocks.map((block, idx) => {
    // Extract character name if present
    const charMatch = block.match(/CHARACTER\s*["']?([^"':\n]+)["']?/i);
    const charName = charMatch ? charMatch[1].trim() : 'Marrow';

    // Extract dialogue snippets
    const dialogueMatches = [...block.matchAll(/"([^"]{5,80})"/g)].map(m => m[1]);

    // Summary from start
    const cleanFirstLine = block.split('\n')[0].substring(0, 150);

    return {
      index: idx,
      charName,
      dialogues: dialogueMatches,
      summary: cleanFirstLine,
      fullText: block
    };
  });
}

/**
 * Generate retention-engineered YouTube metadata package.
 */
async function generateMetadataPackage({ videoPath, promptIndex = null, channelName = 'Bones of Empires' }) {
  const probe = await probeVideo(videoPath);
  const prompts = parseNexusFlowPrompts();
  const promptData = promptIndex !== null && prompts[promptIndex] ? prompts[promptIndex] : prompts[0] || null;

  const isShorts = probe.isShorts;
  const char = promptData ? promptData.charName : 'Marrow';
  const dialogueSample = promptData && promptData.dialogues.length > 0 ? promptData.dialogues[0] : 'The lost mechanism awakens.';

  // Title variants
  const titles = {
    search: isShorts
      ? `${char} in the Ancient Cistern #Shorts`
      : `The Lost Mechanism of Archimedes Explained | ${channelName}`,
    browse: isShorts
      ? `He Found Something Under Alexandria... 💀 #Shorts`
      : `What Was Buried Under Alexandria for 300 Years?`,
    hybrid: isShorts
      ? `"${dialogueSample}" — Alexandria's Deepest Secret #Shorts`
      : `Alexandria's Underground Mystery: What Was Really Buried Here?`
  };

  const selectedTitle = titles.browse;

  // Tags
  const defaultTags = [
    'Bones of Empires',
    'Ancient History',
    'Alexandria',
    'Archimedes',
    'Archaeology',
    'Roman History',
    '3D CGI',
    'Cinematic Animation',
    'Lost Civilization',
    'Unsolved Mysteries',
    'Marrow'
  ];

  if (isShorts) {
    defaultTags.unshift('Shorts', 'YouTube Shorts');
  }

  // Description
  let description = '';
  if (isShorts) {
    description = `"${dialogueSample}"\n\nDeep beneath Alexandria, an ancient mechanism begins to turn... Watch the full mystery unfold.\n\nSubscribe to ${channelName} for cinematic historical journeys.\n\n#Shorts #History #BonesOfEmpires #Alexandria #Archaeology`;
  } else {
    description = `What really lies beneath Alexandria? For 300 years, shadows concealed an ancient secret — until now.\n\nFollow Marrow into the subterranean Roman cistern as the lost mechanism of Archimedes awakens once more.\n\nTIMESTAMPS:\n0:00 The Subterranean Cistern\n0:08 The Mechanism of Archimedes\n0:16 The Celestial Star Map\n\nCREDITS:\nCinematic Visuals created with NexusFlow AI & Google Antigravity.\nChannel: ${channelName}\n\n#History #Alexandria #BonesOfEmpires #AncientMysteries #CGI`;
  }

  return {
    videoPath,
    filename: probe.filename,
    isShorts,
    duration: probe.formattedDuration,
    resolution: probe.resolution,
    titles,
    recommendedTitle: selectedTitle,
    description,
    tags: defaultTags,
    visibility: 'public',
    madeForKids: false
  };
}

module.exports = {
  probeVideo,
  parseNexusFlowPrompts,
  generateMetadataPackage,
  formatDuration
};
