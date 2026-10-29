# Antigravity Operations Guide

## Quick Reference Commands

| Task | Command |
|---|---|
| Check channel & video status | `node cli.js status` |
| View channel strategy & pillars | `node cli.js channel` |
| Generate full SEO package | `node cli.js seo` |
| Audit video metadata (0-100 score) | `node cli.js audit` |
| Discover viral trend ideas | `node cli.js trends` |
| Generate next video prompt | `node cli.js next-video 1` |
| Deploy prompt to NexusFlow | `node cli.js apply-prompt 1` |
| Queue video for YouTube upload | `node cli.js queue` |
| Run autonomous end-to-end pipeline | `node cli.js full-cycle` |

## Architecture
- **Config**: `config.js`
- **Channel**: `channelManager.js`
- **System**: `systemStatus.js`
- **Video Prober**: `videoAnalyzer.js`
- **SEO Engine**: `seoEngine.js`
- **Auditor**: `seoAuditor.js`
- **Trend Hunter**: `trendHunter.js`
- **Prompt Generator**: `promptGenerator.js`
- **Publisher Bridge**: `publisherBridge.js`
- **Pipeline Runner**: `pipeline.js`
- **CLI**: `cli.js`
- **MCP Server**: `mcp/server.js`
