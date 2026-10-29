---
name: youtube
description: >
  The ultimate YouTube creator suite for Antigravity. Covers channel audits,
  video SEO, retention-engineered scripts, hook writing, thumbnail briefs & generation,
  content strategy, content calendars, Shorts optimization, analytics interpretation,
  monetization planning, competitor research, cross-platform repurposing,
  upload metadata packages, automated publishing via YouTube Uploader MCP, and
  data-driven video idea generation.
  Triggers on: "youtube", "channel", "video", "views", "subscribers",
  "watch time", "shorts", "thumbnail", "CTR", "retention", "monetize",
  "script", "hook", "upload", "youtube audit", "video ideas",
  "content calendar", "competitor analysis", "repurpose video",
  "youtube seo", "youtube strategy", "youtube analytics".
tools:
  - read_file
  - write_file
  - edit_file
  - run_command
  - search_web
  - invoke_subagent
  - ask_question
  - call_mcp_tool
---

# Antigravity YouTube — YouTube Creator Suite

> Master orchestrator for 14 sub-skills covering every dimension of YouTube channel growth,
> retention optimization, monetization, competitive intelligence, and automated publishing.
> Antigravity routes, delegates to parallel subagents, and quality-checks deliverables against
> empirical platform benchmarks.

## Command Router

| Command | Sub-Skill | Trigger Phrases |
|---------|-----------|----------------|
| `/youtube audit` | `sub-skills/audit.md` | "audit my channel", "channel health", "what's wrong with my channel", "my channel isn't growing" |
| `/youtube seo` | `sub-skills/seo.md` | "video SEO", "rank higher", "keyword research", "improve search ranking" |
| `/youtube script` | `sub-skills/script.md` | "write a script", "script for my video", "help me script" |
| `/youtube hook` | `sub-skills/hook.md` | "write a hook", "improve my intro", "first 30 seconds", "opening" |
| `/youtube thumbnail` | `sub-skills/thumbnail.md` | "thumbnail brief", "improve CTR", "design thumbnail", "generate thumbnail" |
| `/youtube strategy` | `sub-skills/strategy.md` | "channel strategy", "content plan", "positioning", "niche" |
| `/youtube calendar` | `sub-skills/calendar.md` | "content calendar", "upload schedule", "what should I post this month" |
| `/youtube shorts` | `sub-skills/shorts.md` | "Shorts", "short video", "vertical video", "Shorts strategy" |
| `/youtube analyze` | `sub-skills/analyze.md` | "analyze metrics", "why are views dropping", "interpret analytics" |
| `/youtube repurpose` | `sub-skills/repurpose.md` | "repurpose video", "turn into Shorts", "cross-platform", "extract clips" |
| `/youtube monetize` | `sub-skills/monetize.md` | "monetize", "make money", "revenue", "brand deals", "memberships" |
| `/youtube competitor` | `sub-skills/competitor.md` | "competitor analysis", "spy on channel", "what is [channel] doing" |
| `/youtube metadata` | `sub-skills/metadata.md` | "upload metadata", "title and description", "pre-publish checklist", "queue upload" |
| `/youtube ideate` | `sub-skills/ideate.md` | "video ideas", "what should I make next", "brainstorm", "content ideas" |

If the user's request doesn't clearly match one command, ask a clarifying question using `ask_question`.
If the request spans multiple sub-skills (e.g., "help me plan and script my next video"), run the relevant
sub-skills sequentially, passing structured output from each as input to the next.

## Context-Gathering Protocol

Before invoking ANY sub-skill, collect these core inputs (ask if missing):

1. **Channel niche/topic** — What is the channel about? Be specific (e.g., "budget mechanical keyboard reviews", not "tech").
2. **Channel size tier:**
   - Nano: < 1K subscribers
   - Micro: 1K–10K subscribers
   - Established: 10K–100K subscribers
   - Authority: 100K+ subscribers
3. **Primary goal:** Growth / Monetisation / Brand Authority / Audience Engagement

For `audit`, `analyze`, and `competitor` sub-skills, also collect the channel URL or `@handle`.

## Channel Type Detection

Based on niche and content description, classify into one of 9 archetypes and load the matching template from `templates/`:

| Type | Template | Signals |
|------|----------|---------|
| Education | `templates/education-channel.md` | How-to, explainers, courses |
| Entertainment | `templates/entertainment-channel.md` | Comedy, challenges, reactions |
| Tutorial | `templates/tutorial-channel.md` | Step-by-step, walkthroughs, code/hardware demos |
| Vlog | `templates/vlog-channel.md` | Day-in-the-life, personal storytelling, travel |
| Review | `templates/review-channel.md` | Product reviews, comparisons, unboxings |
| Commentary | `templates/commentary-channel.md` | News commentary, video essays, cultural critique |
| Niche Authority | `templates/niche-authority-channel.md` | Deep-dive single topic, industry expertise |
| Personal Brand | `templates/personal-brand-channel.md` | Creator-as-brand, multi-format business |
| Shorts-First | `templates/shorts-first-channel.md` | Vertical-native short-form content |

## Parallel Subagent Architecture

Antigravity leverages autonomous subagents via `invoke_subagent` to execute intensive research tasks in parallel:

### 1. `audit` Sub-Skill (4 Parallel Subagents)
Invoke 4 subagents simultaneously with `invoke_subagent`:
- **Subagent A (`Role: Technical SEO Auditor`)**: Loads `references/seo-playbook.md`, audits titles, descriptions, tags, chapters, metadata.
- **Subagent B (`Role: Performance Auditor`)**: Loads `references/analytics-guide.md`, evaluates CTR, AVD, funnel drop-offs, benchmark gaps.
- **Subagent C (`Role: Content Strategy Auditor`)**: Loads `references/algorithm-guide.md`, analyzes cadence, topic clustering, format mix.
- **Subagent D (`Role: Monetization Auditor`)**: Loads `references/monetization-guide.md`, inspects YPP status, 7 revenue streams, rate cards.

### 2. `competitor` Sub-Skill (4 Parallel Subagents)
- **Subagent A (`Role: Competitor Top Video Analyst`)**: Outlier video discovery (3x+ channel average) and hook analysis.
- **Subagent B (`Role: Competitor Keyword Gap Analyst`)**: High-demand search term gaps using DataForSEO / search scripts.
- **Subagent C (`Role: Competitor Format Gap Analyst`)**: Missing content formats, packaging differences, and pacing weaknesses.
- **Subagent D (`Role: Competitor Audience Gap Analyst`)**: Comment mining for unanswered questions and audience frustrations.

*Note: In environments where subagents are not available or disabled, fall back to sequential inline execution.*

## Reference Files

Load on-demand only when requested by a sub-skill. Never preload all files into context:

| File | Content |
|------|---------|
| `references/algorithm-guide.md` | 3-system architecture, testing cascade, CTR/AVD benchmarks, 2024-2025 algorithm shifts |
| `references/seo-playbook.md` | Title/description/tags/chapters/hashtags rules, VideoObject JSON-LD schema |
| `references/retention-scripting-guide.md` | Hook frameworks, pattern interrupts, CTA placement, retention graph diagnostics |
| `references/thumbnail-ctr-guide.md` | CTR benchmarks by niche, composition rules, face psychology, title-thumbnail synergy |
| `references/shorts-playbook.md` | Shorts algorithm, format specs, monetization, long-to-short repurposing |
| `references/analytics-guide.md` | Metrics hierarchy, funnel conversion ratios, RPM/CPM by niche |
| `references/monetization-guide.md` | YPP tiers, 7 revenue streams, sponsor rate card calculator |
| `references/repurposing-guide.md` | Hub/Hero/Help model, cross-platform repurposing workflows, multi-platform specs |
| `references/dataforseo-integration.md` | DataForSEO MCP tool reference, YouTube SERP analysis, keyword research, trends |

## Tool & MCP Integrations

### 1. NexusFlow YouTube Uploader MCP Integration
When the `youtube-uploader` MCP server is active, Antigravity seamlessly connects strategy and production directly to YouTube:
- **Direct Queueing**: In `/youtube metadata`, use `youtube_add_to_queue` to automatically queue generated packages with titles, descriptions, tags, and visibility settings.
- **Direct Uploading**: Call `youtube_upload_video` for immediate headless or headful video upload to YouTube Studio.
- **Shorts Auto-Detection**: Call `youtube_probe_video` to automatically verify video aspect ratio and duration.
- **NexusFlow Pipeline Discovery**: Call `youtube_scan_nexusflow_videos` and `youtube_queue_nexusflow_videos` to ingest generated videos from NexusFlow.

### 2. Thumbnail Generation (NanoBanana & Antigravity Image Generator)
When generating thumbnails in `/youtube thumbnail`:
- **Antigravity `image-generator` Subagent / Gemini Imagen**: Use to produce production-ready 16:9 4K thumbnail variants directly from the engineered prompts.
- **NanoBanana MCP**: If configured, call `generate_image` with `aspect_ratio: "16:9"`, `resolution: "4k"`, `model_tier: "nb2"`.
- **Text-Only Fallback**: If image generation tools are absent, deliver full design briefs (composition, typography, color codes, visual contrast) for human designers.

### 3. DataForSEO MCP Integration (Live YouTube & Search Intelligence)
When the DataForSEO MCP server is available (configured in `~/.gemini/config/mcp_config.json`):
- `serp_youtube_organic_live_advanced`: YouTube search results, competitor video rankings, view counts.
- `serp_youtube_video_info_live_advanced`: Rich video metadata, tags, category classification, engagement ratios.
- `serp_youtube_video_comments_live_advanced`: Comment mining for competitor research and sentiment analysis.
- `serp_youtube_video_subtitles_live_advanced`: Transcript extraction for content analysis.
- `kw_data_google_ads_search_volume`: Accurate search volume, CPC, and competition data.
- `dataforseo_labs_bulk_keyword_difficulty`: Keyword difficulty scores (0–100).
- `kw_data_google_trends_explore`: Google Trends time-series filtered for YouTube search.

*Fallback: When DataForSEO is not configured, Antigravity uses WebSearch (`search_web`) and the local Python execution scripts.*

## Python Execution Scripts

Local scripts located in `execution/` interact with YouTube APIs and tools:

| Script | Purpose | Quota Cost |
|--------|---------|-----------|
| `execution/fetch_channel_data.py` | Channel stats + last N videos via Data API v3 | ~16 units |
| `execution/fetch_video_analytics.py` | Private channel analytics via OAuth 2.0 | ~5 units |
| `execution/search_competitor_videos.py` | Competitor video search with outlier detection | 100 units/call |
| `execution/fetch_transcript.py` | Video transcript extraction via API & yt-dlp | 1–2 units |
| `execution/utils/quota_tracker.py` | Tracks 10,000 units/day API quota with alerts | 0 units |
| `execution/utils/youtube_auth.py` | API key & OAuth credential validator | 0 units |
| `execution/utils/paths.py` | Cross-platform Antigravity path & environment resolver | 0 units |

**API Key Setup:**
- Set `YOUTUBE_API_KEY` environment variable, or
- Place `{ "api_key": "YOUR_KEY" }` in `~/.gemini/antigravity/youtube-credentials.json`.

## Quality Gates & Self-Anneal Loop

Every sub-skill deliverable MUST pass three quality gates before presentation:

1. **Hyper-Specificity** — Zero generic platitudes (e.g., never say "post consistently" without stating the exact cadence for their tier and niche).
2. **Data Grounding** — All cited CTR, retention, and RPM benchmarks must cite specific reference files. Never hallucinate statistics.
3. **Deliverable Completeness** — Every section required by the sub-skill template must be populated in full.

**Self-Anneal Protocol:**
If an output fails any gate during generation, Antigravity re-reads the relevant reference file, re-generates the deficient sections, verifies compliance, and only then presents the final report to the user.
