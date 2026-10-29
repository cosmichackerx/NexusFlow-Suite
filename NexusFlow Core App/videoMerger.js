const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { log } = require('./logger');

function getFfmpegPath() {
  try {
    return require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
  } catch (e) {
    log('error', `Failed to load ffmpeg: ${e.message}`);
    throw new Error('ffmpeg not installed properly.');
  }
}

async function combineVideosLossless(validVideos, finalVideoPath) {
  if (!validVideos || validVideos.length === 0) {
    throw new Error('No videos provided to merge.');
  }

  const ffmpegPath = getFfmpegPath();
  const resultDir = path.dirname(finalVideoPath);
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  // If only 1 video, just copy it to finalVideoPath
  if (validVideos.length === 1) {
    fs.copyFileSync(validVideos[0], finalVideoPath);
    log('success', `Single video copied to destination: ${finalVideoPath}`);
    return finalVideoPath;
  }

  // Archive older combined videos to keep Result clean
  try {
    const archiveDir = path.join(resultDir, 'Archive');
    const existingResultFiles = fs.readdirSync(resultDir);
    for (const rf of existingResultFiles) {
      if (rf.toLowerCase().endsWith('.mp4') && !rf.includes('Combined_Video_Full')) {
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
        try { fs.renameSync(path.join(resultDir, rf), path.join(archiveDir, rf)); } catch (e) {}
      }
    }
  } catch (e) {}

  const outputDir = path.dirname(validVideos[0]);
  const listPath = path.join(outputDir, `concat_list_${Date.now()}.txt`);
  const listContent = validVideos.map(v => `file '${v.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listPath, listContent, 'utf8');

  return new Promise((resolve, reject) => {
    // 100% Bit-Exact Original Quality: Lossless stream copy
    execFile(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', '-movflags', '+faststart', finalVideoPath], (copyErr) => {
      try { if (fs.existsSync(listPath)) fs.unlinkSync(listPath); } catch (e) {}
      if (copyErr) {
        log('warn', `Lossless stream copy encountered obstacle (${copyErr.message}). Using filter complex fallback...`);
        const inputArgs = [];
        let filterInputs = '';
        validVideos.forEach((vPath, idx) => {
          inputArgs.push('-i', vPath);
          filterInputs += `[${idx}:v][${idx}:a]`;
        });
        const filterStr = `${filterInputs}concat=n=${validVideos.length}:v=1:a=1[v][a]`;
        execFile(ffmpegPath, ['-y', ...inputArgs, '-filter_complex', filterStr, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', finalVideoPath], (filterErr) => {
          if (filterErr) {
            log('error', `FFmpeg merge fallback failed: ${filterErr.message}`);
            return reject(filterErr);
          }
          log('success', `Videos merged successfully with fallback transcode into: ${finalVideoPath}`);
          resolve(finalVideoPath);
        });
      } else {
        log('success', `Videos combined with 100% Lossless Original Quality into: ${finalVideoPath}`);
        resolve(finalVideoPath);
      }
    });
  });
}

module.exports = {
  getFfmpegPath,
  combineVideosLossless
};
