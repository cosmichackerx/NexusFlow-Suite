# YouTube Channel Metadata & History with Antigravity

Comprehensive Channel Memory, Video Metadata Ledger, Prompt Lineage, Production Chronicle & Analytics Suite for NexusFlow & Google Antigravity.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       Google Antigravity Agent        |
                      +-------------------+-------------------+
                                          |
                      +-------------------+-------------------+
                      |      MCP Server: Server.js            |
                      | (10 Specialized Autonomous Tools)     |
                      +---------+-------------------+---------+
                                |                   |
        +-----------------------+                   +-----------------------+
        |                                                                   |
+-------v-------------------------+                       +-----------------v-----------------+
| Channel Memory Engine           |                       | Master Video Ledger               |
| - channelMemory.js              |                       | - historyLedger.js                |
| - CHANNEL_MEMORY.md             |                       | - video-ledger.json               |
| - Character Continuity ("Marrow")                       | - Full lifecycle tracking         |
+-------+-------------------------+                       +-----------------+-----------------+
        |                                                                   |
        |                                                                   |
+-------v-------------------------+                       +-----------------v-----------------+
| Prompt History & Lineage        |                       | Time & Cadence Analytics          |
| - promptHistory.js              |                       | - timeAnalytics.js                |
| - 3-Scene Layout & Dialogue     |                       | - Production turnaround velocity  |
| - 0-100 Continuity Validator    |                       | - Peak YouTube upload slots       |
+-------+-------------------------+                       +-----------------+-----------------+
        |                                                                   |
        +-----------------------+                   +-----------------------+
                                |                   |
                      +---------v-------------------v---------+
                      |         Deep Sync Engine              |
                      |         - syncEngine.js               |
                      +---------+-------------------+---------+
                                |                   |
             +------------------+                   +------------------+
             |                                                         |
+------------v--------------------+                      +-------------v---------------------+
| NexusFlow Core Generator        |                      | YouTube Studio Uploader           |
| - C:\Google Flow Customized     |                      | - upload-queue.json               |
| - Prompt.txt, Result, Output    |                      | - upload-history.json             |
+---------------------------------+                      +-----------------------------------+
```

---

## Features

1. **Channel Memory Bible (`channelMemory.js`)**:
   - Living repository of channel positioning, hero character ("Marrow") bible, visual and acoustic grade, audience psychographics, content pillars, and lore arcs.
   - Generates and synchronizes `CHANNEL_MEMORY.md`.

2. **Master Video Ledger (`historyLedger.js`)**:
   - Tracks complete video lifecycle: `draft` -> `rendered` -> `merged` -> `seo_generated` -> `queued` -> `published`.
   - Records titles, 4 title variants (Browse CTR, Search Intent, Mobile Hook), technical specs, durations, timestamps, and live YouTube URLs.

3. **Prompt Lineage & Continuity (`promptHistory.js`)**:
   - Automatically archives multi-scene prompts from NexusFlow's `Prompt.txt`.
   - Validates continuity locks: Marrow's ivory skeleton, translucent cyan silhouette, glowing amber eyes, and Roman tunic.
   - 0-100 quantitative quality scoring.

4. **Time & Cadence Analytics (`timeAnalytics.js`)**:
   - Analyzes turnaround time from prompt formulation to YouTube upload.
   - Calculates cadence health score and recommends the next optimal publishing slot (Tuesday/Thursday/Saturday @ 14:00 EST / 23:00 PKT).

5. **Deep Sync Engine (`syncEngine.js`)**:
   - Ingests prompts and video files directly from NexusFlow and YouTube Uploader into the permanent ledger.

6. **Full MCP Server (`mcp/server.js`)**:
   - Exposes 10 specialized MCP tools directly into Google Antigravity.

---

## Quick Start & Installation

Run the automated installer:
```powershell
node install.js
```
Or with PowerShell:
```powershell
.\install.ps1
```

---

## CLI Usage

```powershell
# View holistic channel overview, video inventory, and cadence health
node cli.js status

# Deep sync from NexusFlow and YouTube Uploader
node cli.js sync

# List all tracked videos in the catalog
node cli.js list

# Deep inspect a specific video (prompts, SEO, timestamps)
node cli.js get latest

# Display the living channel memory bible
node cli.js memory

# Review prompt archive and continuity scores
node cli.js prompts

# View time and cadence analytics
node cli.js analytics

# Export full chronological markdown history report
node cli.js export
```
