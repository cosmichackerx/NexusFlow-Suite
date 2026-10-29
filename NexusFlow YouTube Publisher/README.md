# YouTube With Antigravity

> **The Native YouTube Creator, Retention Engineering & Automated Publishing Suite for Google Antigravity & NexusFlow**

YouTube With Antigravity bridges AI video generation, retention-engineered scripting, thumbnail psychology, video SEO, and automated YouTube Studio publishing into a single, cohesive ecosystem.

---

## Key Features

1. **14 Core Creator Commands**:
   - Channel Health Audit (`/youtube audit`) with 4 parallel subagents
   - Video SEO (`/youtube seo`) with Search, Browse, and Hybrid title variants
   - Retention-Engineered Scripting (`/youtube script`) with 60–90s pattern interrupts
   - Hook Crafting (`/youtube hook`) across 5 psychological frameworks
   - Thumbnail Briefs & AI Image Generation (`/youtube thumbnail`)
   - Channel Positioning & Roadmaps (`/youtube strategy`)
   - Monthly Content Calendars (`/youtube calendar`)
   - Vertical Shorts Optimization (`/youtube shorts`)
   - Analytics Diagnosis (`/youtube analyze`)
   - Multi-Platform Repurposing (`/youtube repurpose`)
   - Monetization Strategy & Rate Cards (`/youtube monetize`)
   - Competitor Intelligence (`/youtube competitor`)
   - Copy-Paste Metadata Packages (`/youtube metadata`)
   - Data-Driven Idea Generation (`/youtube ideate`)

2. **NexusFlow Deep Integration**:
   - Auto-discovers generated clips and merged videos in `C:\Google Flow Customized\Result` and `Output`.
   - Reads prompts, dialogues, and characters from `Prompt.txt`.
   - Probes video duration and aspect ratio with FFmpeg to detect YouTube Shorts.

3. **YouTube Studio Automated Uploader Integration**:
   - Verifies channel authentication (e.g. channel "Bones of Empires").
   - Queues videos with optimized titles, descriptions, chapters, tags, and audience settings.
   - Triggers headless or headful automated uploads via Playwright.

4. **Multi-Agent Architecture**:
   - Native parallel execution using Antigravity `invoke_subagent`.
   - Automated quality gates verifying hyper-specificity, data grounding, and deliverable completeness.

---

## Directory Structure

```
Youtube With Antigravity/
├── config.js               # Central path & directory resolver
├── bridgeClient.js         # Unified HTTP & disk bridge to NexusFlow & YouTube Uploader
├── metadataGenerator.js    # FFmpeg probe & Antigravity metadata synthesizer
├── pipeline.js             # End-to-end autonomous pipeline runner
├── cli.js                  # Operational command-line interface
├── package.json            # Node project configuration
├── plugin.json             # Antigravity plugin manifest
├── GEMINI.md               # Gemini / Antigravity instruction context
├── AGENTS.md               # Subagent orchestration rules
├── ANTIGRAVITY.md          # Quick reference operations guide
├── install.ps1             # One-click installer for Antigravity skills
├── mcp/
│   └── server.js           # Stdio JSON-RPC MCP server for Antigravity
└── skills/
    └── youtube/
        ├── SKILL.md        # Master orchestrator skill
        ├── sub-skills/     # 14 specialized sub-skill guides (.md)
        ├── references/     # 9 empirical reference playbooks (.md)
        ├── templates/      # 9 channel archetype templates (.md)
        └── execution/      # Python API & quota utilities
```

---

## Installation & Setup

To install or refresh the skill in your Antigravity environment:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

---

## Usage

### Run System Status Check
```bash
node cli.js status
```

### Scan Generated Videos
```bash
node cli.js scan
```

### Probe Video Details
```bash
node cli.js probe "C:\Google Flow Customized\Result\Combined_Video_Full.mp4"
```

### Generate Video Metadata Package
```bash
node cli.js metadata "C:\Google Flow Customized\Result\Combined_Video_Full.mp4"
```

### Run Full Autonomous Pipeline
```bash
node cli.js pipeline
```
