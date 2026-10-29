const fs = require('fs');
const path = require('path');
const config = require('./config');
const driveManager = require('./driveManager');

class SyncEngine {
  constructor() {
    this.config = config;
    this.paths = config.paths;
  }

  scanResultDirectory() {
    const resultDir = this.paths.googleFlowResultDir;
    if (!fs.existsSync(resultDir)) {
      return { found: 0, items: [] };
    }

    try {
      const files = fs.readdirSync(resultDir);
      const videoFiles = files
        .filter(f => f.toLowerCase().endsWith('.mp4'))
        .map(file => {
          const fullPath = path.join(resultDir, file);
          const stat = fs.statSync(fullPath);
          return {
            filename: file,
            sizeBytes: stat.size,
            sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
            modified: stat.mtime,
            fullPath
          };
        });

      return {
        found: videoFiles.length,
        items: videoFiles
      };
    } catch (e) {
      return { found: 0, items: [], error: e.message };
    }
  }

  stageVideo(sourceFilePath, canonicalName) {
    if (!fs.existsSync(sourceFilePath)) {
      throw new Error(`Source video not found: ${sourceFilePath}`);
    }

    if (!fs.existsSync(this.paths.finishedShortsDir)) {
      fs.mkdirSync(this.paths.finishedShortsDir, { recursive: true });
    }

    const destination = path.join(this.paths.finishedShortsDir, canonicalName);
    fs.copyFileSync(sourceFilePath, destination);

    // Update state
    const state = driveManager.loadState() || {
      googleDrive: config.googleDrive,
      channel: config.channel,
      finishedShorts: []
    };

    if (!Array.isArray(state.finishedShorts)) {
      state.finishedShorts = [];
    }

    const stat = fs.statSync(destination);
    const existingIndex = state.finishedShorts.findIndex(s => s.canonicalFilename === canonicalName);
    const entry = {
      title: canonicalName.replace(/\.mp4$/i, '').replace(/_/g, ' '),
      canonicalFilename: canonicalName,
      sourcePath: sourceFilePath,
      stagedPath: path.relative(config.paths.moduleRoot, destination),
      fileSizeBytes: stat.size,
      aspectRatio: '9:16',
      durationSeconds: 24,
      staged: true,
      stagedAt: new Date().toISOString(),
      driveUploadStatus: 'PENDING'
    };

    if (existingIndex >= 0) {
      state.finishedShorts[existingIndex] = entry;
    } else {
      state.finishedShorts.push(entry);
    }

    state.googleDrive.lastSyncCheck = new Date().toISOString();
    driveManager.saveState(state);

    return {
      success: true,
      stagedPath: destination,
      fileSizeBytes: stat.size,
      entry
    };
  }

  generateDriveManifest() {
    const status = driveManager.getStatus();
    const manifest = {
      generatedAt: new Date().toISOString(),
      driveTarget: {
        folderName: config.googleDrive.folderName,
        folderId: config.googleDrive.folderId,
        url: config.googleDrive.webUrl
      },
      documentsToSync: [
        {
          name: 'channel-plan.md',
          localPath: this.paths.channelPlanFile,
          sizeBytes: fs.existsSync(this.paths.channelPlanFile) ? fs.statSync(this.paths.channelPlanFile).size : 0,
          remoteDrivePath: `Bones of Empires/channel-plan.md`
        },
        {
          name: 'PROGRESS.md',
          localPath: this.paths.progressFile,
          sizeBytes: fs.existsSync(this.paths.progressFile) ? fs.statSync(this.paths.progressFile).size : 0,
          remoteDrivePath: `Bones of Empires/PROGRESS.md`
        },
        {
          name: 'shorts-metadata.md',
          localPath: this.paths.shortsMetadataFile,
          sizeBytes: fs.existsSync(this.paths.shortsMetadataFile) ? fs.statSync(this.paths.shortsMetadataFile).size : 0,
          remoteDrivePath: `Bones of Empires/shorts-metadata.md`
        }
      ],
      videosToSync: status.finishedShorts.map(short => ({
        filename: short.filename,
        localPath: short.path,
        sizeMB: short.sizeMB,
        remoteDrivePath: `Bones of Empires/Finished Shorts/${short.filename}`,
        status: 'READY_TO_UPLOAD'
      }))
    };

    return manifest;
  }
}

module.exports = new SyncEngine();
