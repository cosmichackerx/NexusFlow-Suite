---
name: google-drive-bones-of-empires
description: Complete Google Drive cloud repository and asset management skill for Bones of Empires within the NexusFlow automated production ecosystem. Manages channel-plan.md, PROGRESS.md, shorts-metadata.md, and staging/syncing finished video renders into the Google Drive folder.
---

# Google Drive — Bones of Empires Manager

This skill governs the cloud repository, synchronization, and asset pipeline between local NexusFlow video production and the official Google Drive workspace for **Bones of Empires**.

## Cloud Identity & Coordinates
- **Drive Folder Name**: `Bones of Empires`
- **Drive Folder ID**: `10y_1F0F0Hlm5yaMQSJ1mGrlJ_ttnMOTG`
- **Direct Web URL**: `https://drive.google.com/drive/u/0/folders/10y_1F0F0Hlm5yaMQSJ1mGrlJ_ttnMOTG`
- **Target YouTube Channel**: `Bones of Empires` (`@BonesOfEmpires`)
- **Protagonist**: `Marrow` (The Ancient Wandering Scribe)

## Folder & Asset Architecture

The official Google Drive folder contains:
1. `Finished Shorts/`: Cloud directory storing finished 9:16 vertical MP4 renders.
2. `channel-plan.md`: Master channel strategy, aesthetic guide, character bible, 4-arc roadmap, and algorithmic targets.
3. `PROGRESS.md`: Live production sprint status, episode completion matrix, and milestone checklist.
4. `shorts-metadata.md`: Publishing metadata registry (titles, descriptions, tags, pinned comments).

## Key Operations

### 1. Check Status & Synchronized Documents
```bash
node cli.js status
```

### 2. Inspect Channel Strategy or Metadata
```bash
node cli.js plan
node cli.js progress
node cli.js metadata
```

### 3. Stage Rendered Short from NexusFlow Result
```bash
node cli.js stage
```
Scans `C:\Google Flow Customized\Result`, retrieves `Combined_Video_Full.mp4`, and stages it as `BOE_EP01_Alexandria_The_Archimedes_Vault_9x16.mp4` in `Finished Shorts/`.

### 4. Generate Cloud Sync Manifest
```bash
node cli.js manifest
```

### 5. Open Official Google Drive Folder
```bash
node cli.js open
```

## Cross-Module Synergies
- **NexusFlow Core App**: Produces multi-shot AI video scenes in `C:\Google Flow Customized\Result`.
- **Google Drive Bones of Empires**: Archives documentation and stages master finished video files.
- **NexusFlow YouTube Uploader**: Consumes finished video files from `Finished Shorts/` and uses metadata from `shorts-metadata.md` to publish to YouTube Studio.
- **NexusFlow YouTube Studio Monitor & Manager**: Tracks subscriber growth, APV %, and retention metrics after upload.
