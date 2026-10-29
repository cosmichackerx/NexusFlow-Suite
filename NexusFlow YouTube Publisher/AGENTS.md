# Multi-Agent Orchestration & Antigravity Subagent Guide

## Autonomous Subagents

In Google Antigravity, complex YouTube tasks are divided across parallel subagents spawned via `invoke_subagent`.

### 1. Channel Health Audit (`/youtube audit`)
When invoked, Antigravity delegates to 4 parallel subagents:
1. **Technical SEO Auditor** (`Role: Technical SEO Auditor`): Audits title formulas, description architecture, tag strategy, chapter structures, and VideoObject JSON-LD schema against `references/seo-playbook.md`.
2. **Performance & Retention Auditor** (`Role: Performance Auditor`): Diagnoses click-through rates (CTR), average percentage viewed (APV/AVD), and retention drop-offs against `references/analytics-guide.md`.
3. **Content Strategy Auditor** (`Role: Content Strategy Auditor`): Evaluates upload cadence, Hub/Hero/Help pillar balance, and algorithm testing cascade health against `references/algorithm-guide.md`.
4. **Monetization Auditor** (`Role: Monetization Auditor`): Assesses 7 revenue streams, RPM benchmarks, sponsor rate cards, and external conversion funnels against `references/monetization-guide.md`.

### 2. Competitor Intelligence (`/youtube competitor`)
Spawns 4 concurrent investigative agents:
1. **Outlier Video Analyst**: Detects videos generating 3x+ channel median views.
2. **Keyword Gap Analyst**: Identifies high-volume search queries competitors fail to address.
3. **Format & Packaging Analyst**: Analyzes thumbnail visual formulas and script pacing differences.
4. **Audience Sentiment Analyst**: Mines comment sections for unanswered pain points and content requests.

### 3. Production & Publishing Agent
Coordinates video files rendered by NexusFlow with the YouTube Uploader:
- Discovers rendered videos in `C:\Google Flow Customized\Result` and `Output`.
- Probes format and aspect ratio using FFmpeg.
- Generates high-conversion metadata packages with Antigravity.
- Enqueues into YouTube Uploader queue for scheduled or instant publishing.
