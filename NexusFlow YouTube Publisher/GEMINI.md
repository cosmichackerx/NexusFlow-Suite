# YouTube With Antigravity

This repository houses **YouTube With Antigravity** — the native YouTube creator, retention engineering, and automated publishing suite designed specifically for Google Antigravity (AGY) and deeply integrated with NexusFlow.

## Architecture

- **Skills & Knowledge Base**: `skills/youtube/`
  - `SKILL.md`: Main Antigravity skill orchestrator.
  - `sub-skills/`: 14 modular sub-skills covering audits, SEO, retention scripts, hooks, thumbnails, strategy, calendars, Shorts, analytics, repurposing, monetization, competitor research, metadata, and idea generation.
  - `references/`: 9 empirical reference playbooks.
  - `templates/`: 9 channel archetype templates.
  - `execution/`: Python API and quota utilities.
- **Unified Automation Engine**:
  - `cli.js`: Command-line interface for status, scanning, video probing, metadata synthesis, queue management, and end-to-end pipeline execution.
  - `pipeline.js`: Autonomous pipeline connecting NexusFlow video outputs (`C:\Google Flow Customized\Result` and `Output`) to YouTube Studio via Playwright.
  - `metadataGenerator.js`: FFmpeg-powered probing, Shorts detection, and high-CTR title/description/tag generation.
  - `bridgeClient.js`: Unified bridge client interfacing with NexusFlow and YouTube Uploader local services.
  - `mcp/server.js`: Stdio JSON-RPC MCP server exposing native tools for Antigravity agents.

## Core Workflows

1. **Check Status**:
   ```bash
   node cli.js status
   ```

2. **Probe Video**:
   ```bash
   node cli.js probe "path/to/video.mp4"
   ```

3. **Generate Metadata Package**:
   ```bash
   node cli.js metadata "path/to/video.mp4"
   ```

4. **Run End-to-End Pipeline**:
   ```bash
   node cli.js pipeline
   ```
