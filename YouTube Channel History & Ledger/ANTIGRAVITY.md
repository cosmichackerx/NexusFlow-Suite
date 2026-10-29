# Antigravity Operations Guide: Channel History & Memory

## Quick Reference Commands

| Task | Command |
|---|---|
| View channel overview & cadence health | `node cli.js status` |
| Deep sync from NexusFlow & YouTube Uploader | `node cli.js sync` |
| List all tracked videos & statuses | `node cli.js list` |
| Inspect a specific video's full record | `node cli.js get latest` (or `<id>`) |
| View living channel memory bible | `node cli.js memory` |
| View prompt history & continuity scores | `node cli.js prompts` |
| View production turnaround & time analytics | `node cli.js analytics` |
| Export markdown history report | `node cli.js export` |
| Run MCP Server directly | `node mcp/server.js` |
| Register MCP Server in Antigravity | `node install.js` |

## Core Architecture
- **Config & Paths**: `config.js`
- **Channel Memory**: `channelMemory.js` & `CHANNEL_MEMORY.md`
- **Video History Ledger**: `historyLedger.js` & `video-ledger.json`
- **Prompt Evolution & Lineage**: `promptHistory.js` & `prompt-archive.json`
- **Time & Cadence Analytics**: `timeAnalytics.js`
- **NexusFlow / Uploader Sync**: `syncEngine.js`
- **CLI Suite**: `cli.js`
- **MCP Server**: `mcp/server.js`
