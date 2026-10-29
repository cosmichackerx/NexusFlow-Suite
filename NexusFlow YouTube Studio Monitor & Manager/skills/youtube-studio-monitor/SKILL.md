---
name: youtube-studio-monitor
description: Monitor and manage YouTube Studio operations, real-time analytics, retention curves (APV), subscriber growth, comment moderation, and NexusFlow synchronization.
---

# YouTube Studio Monitor & Manager Skill

This skill provides Google Antigravity and AI agents with direct, autonomous capabilities to monitor and manage **YouTube Studio** for the channel **Bones of Empires** (`@BonesOfEmpires`, Channel ID `UCZXJSiKIw60aaUVBJv1ucCQ`) and integrate live performance data back into NexusFlow.

---

## 1. Core Capabilities

### 📊 Real-Time Studio Performance Monitoring
- **Channel Dashboard Snapshot**: Monitor subscribers, 28-day views, watch hours, and channel health.
- **Velocity Tracker (48h / 60m)**: Track rapid view acceleration on new Shorts and identify viral breakout signals.
- **Shorts Retention (APV) Diagnostics**: Evaluate Average Percentage Viewed against the 75%+ viral benchmark.

### 🛠️ Studio Operations & Metadata Management
- **Video & Short Management**: Update titles, descriptions, visibility (Unlisted vs Public), and tags directly in the catalog.
- **Community Moderation**: Scan audience comments, heart positive engagement, and generate on-brand replies in the voice of **Marrow** (The Wandering Scribe).
- **Pinned Engagement Questions**: Automatically generate high-retention conversation starters to boost comment activity.
- **Monetization & YPP Tracking**: Track progress towards 1,000 subscribers, 4,000 watch hours, or 10M Short views.

### ⚡ NexusFlow Continuous Feedback Loop
- **Ledger Synchronization**: Automatically sync views, likes, and APV back to `video-ledger.json` in `YouTube Channel History & Ledger`.
- **SEO Trends Feeding**: Feed high-performing topics (e.g. "Pirates Treasure" at 1.1K views) back to `YouTube SEO & Trends` for future script generation.

---

## 2. MCP Tools Reference

| Tool Name | Purpose |
|---|---|
| `studio_get_channel_overview` | High-level metrics: subscribers, 28d views, watch time, copyright status |
| `studio_get_recent_performance` | Latest Short metrics: views, rank out of 10, APV %, retention analysis |
| `studio_get_top_content` | Top content over the last 48 hours sorted by velocity |
| `studio_get_monetization_status`| Progress bars towards YouTube Partner Program milestones |
| `studio_audit_performance` | Deep dive into retention curves, strengths, and hook fixes |
| `studio_update_metadata` | Update title, description, or visibility for a video |
| `studio_moderate_comments` | Moderates comments and returns recommended Marrow responses |
| `studio_sync_nexusflow_ledger` | Syncs Studio metrics into `YouTube Channel History & Ledger` |

---

## 3. CLI Quick Commands

Run from the module directory:

```bash
# View dashboard metrics
node cli.js status

# Analyze retention curves and hook quality
node cli.js audit

# Track monetization milestones (1,000 subs / 4,000 hrs / 10M views)
node cli.js earn

# Sync live performance with NexusFlow video-ledger.json
node cli.js sync

# Check comments and get suggested replies
node cli.js moderate

# Start the interactive web dashboard on http://localhost:3800
npm start
```
