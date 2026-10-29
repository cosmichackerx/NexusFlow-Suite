# Antigravity YouTube — YouTube Creator Suite

## Project Overview

This repository contains the **Antigravity YouTube Creator Suite** for Google Antigravity (AGY).
It provides 14 deep sub-skills, 9 reference guides, 9 channel archetype templates, and 7 execution utilities
covering channel audits, video SEO, retention-engineered scripts, hook writing, thumbnail briefs & generation,
content strategy, Shorts optimization, analytics, monetization, competitor research, cross-platform repurposing,
and automated video publishing via the NexusFlow YouTube Uploader MCP server.

## Architecture

```
skills/youtube/                       # Main Antigravity skill
  SKILL.md                           # Entry point, routing, quality gates, MCP links
  sub-skills/                        # 14 specialized sub-skill instruction files (.md)
    audit.md, seo.md, script.md, hook.md, thumbnail.md,
    strategy.md, calendar.md, shorts.md, analyze.md,
    repurpose.md, monetize.md, competitor.md, metadata.md, ideate.md
  references/                        # 9 on-demand empirical knowledge guides
    algorithm-guide.md               # 3-system architecture, testing cascade, CTR/AVD benchmarks
    seo-playbook.md                  # Title/description/tags/chapters rules, VideoObject schema
    retention-scripting-guide.md     # Hook frameworks, pattern interrupts, CTA placement
    thumbnail-ctr-guide.md           # CTR by niche, face psychology, A/B testing
    shorts-playbook.md               # Shorts algorithm, format specs, monetization
    analytics-guide.md               # Metrics hierarchy, funnel ratios, RPM/CPM by niche
    monetization-guide.md            # YPP tiers, 7 revenue streams, brand rate cards
    repurposing-guide.md             # Hub/Hero/Help model, multi-platform workflows
    dataforseo-integration.md        # DataForSEO live keyword and SERP research
  templates/                         # 9 channel archetype templates
    education, entertainment, tutorial, vlog, review, commentary,
    niche-authority, personal-brand, shorts-first
  execution/                         # Python execution scripts & utilities
    fetch_channel_data.py            # YouTube Data API v3 channel stats (~16 quota units)
    fetch_transcript.py              # Video transcript extraction via API & yt-dlp
    fetch_video_analytics.py         # Private analytics via OAuth 2.0
    search_competitor_videos.py      # Competitor video search with outlier detection
    utils/
      paths.py                       # Cross-platform Antigravity path resolver
      quota_tracker.py               # 10,000 unit/day quota tracker with warning thresholds
      youtube_auth.py                # API key & OAuth credential validator
```

## Available Slash Commands

| Command | Purpose |
|---------|---------|
| `/youtube audit` | Full channel health audit across 4 dimensions with 4 parallel subagents |
| `/youtube seo` | Video SEO package (search/browse/hybrid titles, description, tags, chapters, schema) |
| `/youtube script` | Retention-engineered script with pattern interrupts every 60-90s |
| `/youtube hook` | 5 hook variants (shock, agitation, story, curiosity, social proof) + drop-off risk |
| `/youtube thumbnail` | Thumbnail design brief with 3 A/B variants + direct AI image generation |
| `/youtube strategy` | Channel positioning, content pillars (Hub/Hero/Help), and 30/60/90-day roadmap |
| `/youtube calendar` | Monthly content calendar with Shorts supplements and seasonal CPM alignment |
| `/youtube shorts` | Vertical short-form production package with visual change markers |
| `/youtube analyze` | Analytics diagnosis, retention curve classification, and priority interventions |
| `/youtube repurpose` | Multi-platform repackaging (Shorts, LinkedIn, X thread, newsletter, blog) |
| `/youtube monetize` | Revenue diversification across 7 streams and sponsor rate cards |
| `/youtube competitor` | Competitor intelligence with 4 parallel subagents (outliers, gaps, audience mining) |
| `/youtube metadata` | Copy-paste upload package with optional direct NexusFlow queueing |
| `/youtube ideate` | 10 ranked video concepts with search demand and keyword validation |

## Antigravity Integrations

1. **Subagent Orchestration**: `/youtube audit` and `/youtube competitor` spawn 4 parallel subagents using `invoke_subagent`. Antigravity resumes automatically upon subagent completion.
2. **NexusFlow YouTube Uploader MCP**: When active, video metadata can be directly queued (`youtube_add_to_queue`) or published (`youtube_upload_video`).
3. **Thumbnail Generation**: Native support for Antigravity `image-generator` subagent, Gemini Imagen 3, and NanoBanana MCP (`generate_image`).
4. **DataForSEO MCP**: Live keyword volume, keyword difficulty, trends, and YouTube SERP ranking intelligence.

## Development Rules

- Keep `SKILL.md` focused, clean, and under 500 lines.
- Sub-skills live as modular instruction files in `sub-skills/`.
- Never hallucinate benchmarks; always ground metrics in `references/`.
- Execution scripts must use `utils.paths` for cross-platform compatibility with Antigravity (`~/.gemini/antigravity/` and `~/.gemini/config/`).
