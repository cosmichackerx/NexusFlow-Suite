const fs = require('fs');
const path = require('path');
const config = require('./config');

class DriveManager {
  constructor() {
    this.config = config;
    this.paths = config.paths;
  }

  loadState() {
    try {
      if (fs.existsSync(this.paths.stateFile)) {
        return JSON.parse(fs.readFileSync(this.paths.stateFile, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load driveState.json:', e.message);
    }
    return null;
  }

  saveState(state) {
    try {
      fs.writeFileSync(this.paths.stateFile, JSON.stringify(state, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Failed to save driveState.json:', e.message);
      return false;
    }
  }

  getStatus() {
    const state = this.loadState();
    const shortsInDir = this.listFinishedShorts();
    const filesStatus = {};

    config.googleDrive.trackedFiles.forEach(file => {
      const filePath = path.join(this.paths.dataDir, file);
      const exists = fs.existsSync(filePath);
      let size = 0;
      let modified = null;
      if (exists) {
        const stat = fs.statSync(filePath);
        size = stat.size;
        modified = stat.mtime;
      }
      filesStatus[file] = {
        exists,
        sizeBytes: size,
        lastModified: modified,
        driveLocation: `My Drive > ${config.googleDrive.folderName} > ${file}`
      };
    });

    return {
      folderName: config.googleDrive.folderName,
      folderId: config.googleDrive.folderId,
      driveUrl: config.googleDrive.webUrl,
      channel: config.channel,
      trackedFiles: filesStatus,
      finishedShortsCount: shortsInDir.length,
      finishedShorts: shortsInDir,
      lastSyncCheck: state ? state.googleDrive.lastSyncCheck : null
    };
  }

  listFinishedShorts() {
    if (!fs.existsSync(this.paths.finishedShortsDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(this.paths.finishedShortsDir);
      return files
        .filter(f => f.toLowerCase().endsWith('.mp4'))
        .map(file => {
          const fullPath = path.join(this.paths.finishedShortsDir, file);
          const stat = fs.statSync(fullPath);
          return {
            filename: file,
            sizeBytes: stat.size,
            sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
            modified: stat.mtime,
            path: fullPath
          };
        });
    } catch (e) {
      return [];
    }
  }

  getChannelPlan() {
    if (fs.existsSync(this.paths.channelPlanFile)) {
      return fs.readFileSync(this.paths.channelPlanFile, 'utf8');
    }
    return null;
  }

  getProgress() {
    if (fs.existsSync(this.paths.progressFile)) {
      return fs.readFileSync(this.paths.progressFile, 'utf8');
    }
    return null;
  }

  getShortsMetadata() {
    if (fs.existsSync(this.paths.shortsMetadataFile)) {
      return fs.readFileSync(this.paths.shortsMetadataFile, 'utf8');
    }
    return null;
  }
}

module.exports = new DriveManager();
