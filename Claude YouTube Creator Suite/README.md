# Antigravity YouTube Creator Suite

> **The Ultimate AI-Powered YouTube Growth, Retention & Automation Suite for Google Antigravity & Claude Code**

A battle-tested creator engineering framework tailored natively for [Google Antigravity](https://deepmind.google/technologies/gemini/) (AGY) and fully cross-compatible with Claude Code. Covers channel health audits, video SEO, retention-engineered scripts, hook writing, thumbnail briefs & generation, content strategy, monthly calendars, Shorts optimization, deep analytics interpretation, monetization strategy, competitor research, cross-platform repurposing, upload metadata packages, and automated publishing via the NexusFlow YouTube Uploader.

**40 files** | **5,500+ lines of markdown** | **1,400+ lines of Python** | **14 sub-skills** | **9 reference guides** | **9 channel templates** | **7 execution scripts & utilities**

---

## Key Capabilities

Antigravity YouTube transforms your AI agent into an expert YouTube growth strategist and production partner. Every recommendation is strictly grounded in platform-specific benchmarks, testing cascade mechanics, and real channel data.

### 14 Core Commands

| Command | What It Does |
|---------|-------------|
| `/youtube audit` | Full channel health audit across 4 dimensions (SEO, performance, content, monetization) powered by 4 parallel subagents |
| `/youtube seo` | Video SEO package: 3 title variants (Search/Browse/Hybrid), full description, tags, chapters, hashtags, VideoObject JSON-LD schema |
| `/youtube script` | Retention-engineered script with hook/intro/body blocks, pattern interrupts every 60–90s, and high-conversion CTA placement |
| `/youtube hook` | 5 hook variants (Shock, Problem-Agitation, Story, Curiosity-Gap, Social Proof) with drop-off risk ratings |
| `/youtube thumbnail` | Thumbnail brief with 3 A/B variants, color hex codes, composition rules, title-thumbnail synergy check, and direct AI image generation |
| `/youtube strategy` | Channel positioning, content pillars (Hub/Hero/Help), niche viability analysis, upload cadence, 30/60/90-day roadmap |
| `/youtube calendar` | Monthly content calendar with per-video metadata, Shorts supplement plan, and seasonal CPM timing |
| `/youtube shorts` | Shorts production package: script with visual change markers, SEO metadata, performance prediction, loop setup |
| `/youtube analyze` | Analytics interpretation: funnel diagnosis, retention graph classification, traffic source health, priority actions |
| `/youtube repurpose` | Cross-platform repurposing package: Shorts clips, blog outline, LinkedIn post, X thread, newsletter, podcast outline, community post |
| `/youtube monetize` | Revenue strategy across 7 streams, brand deal rate card calculator, external funnel design, 90-day activation plan |
| `/youtube competitor` | Competitor intelligence with 4 parallel subagents: outlier video analysis (3x+ channel average), keyword gaps, format gaps, audience comment mining |
| `/youtube metadata` | Copy-paste-ready upload package with optional direct queueing to the NexusFlow YouTube Uploader MCP |
| `/youtube ideate` | 10 ranked video concepts with search demand analysis, hook angles, thumbnail concepts, and revenue potential |

---

## Architecture

Built on modern agentic engineering standards with a modular 3-layer architecture:

```
skills/youtube/
  SKILL.md                          # Orchestrator (routing, context-gathering, quality gates, MCP integration)
  sub-skills/                       # 14 specialized sub-skill instruction files
    audit.md, seo.md, script.md, hook.md, thumbnail.md,
    strategy.md, calendar.md, shorts.md, analyze.md,
    repurpose.md, monetize.md, competitor.md, metadata.md, ideate.md
  references/                       # 9 empirical, data-grounded reference guides
    algorithm-guide.md              # 3-system architecture, testing cascade, CTR/AVD benchmarks
    seo-playbook.md                 # Title/description/tags/chapters rules, VideoObject schema
    retention-scripting-guide.md    # Hook frameworks, pattern interrupts, CTA placement
    thumbnail-ctr-guide.md          # CTR by niche, face psychology, A/B testing, title formulas
    shorts-playbook.md              # Shorts algorithm, format specs, monetization
    analytics-guide.md              # Metrics hierarchy, funnel ratios, RPM/CPM by niche
    monetization-guide.md           # YPP tiers, 7 revenue streams, brand deal rates
    repurposing-guide.md            # Hub/Hero/Help model, cross-platform workflows
    dataforseo-integration.md       # DataForSEO MCP tool reference for live data
  templates/                        # 9 channel-type archetypes
    education-channel.md, entertainment-channel.md, tutorial-channel.md,
    vlog-channel.md, review-channel.md, commentary-channel.md,
    niche-authority-channel.md, personal-brand-channel.md, shorts-first-channel.md
  execution/                        # 7 Python scripts & utilities
    fetch_channel_data.py           # Channel stats + recent videos (~16 quota units)
    fetch_transcript.py             # Transcript extraction via API & yt-dlp
    fetch_video_analytics.py        # Private analytics via OAuth 2.0
    search_competitor_videos.py     # Competitor video search with outlier detection
    utils/
      paths.py                      # Cross-platform Antigravity path resolver
      quota_tracker.py              # 10K unit/day quota management with early warning
      youtube_auth.py               # API key + OAuth 2.0 authentication validator
```

---

## Integrations

### 1. Parallel Subagents (`invoke_subagent`)
In `/youtube audit` and `/youtube competitor`, Antigravity spawns 4 parallel subagents simultaneously:
- **Audit**: Technical SEO Auditor, Performance Auditor, Content Strategy Auditor, Monetization Auditor.
- **Competitor**: Top Video Analyst, Keyword Gap Analyst, Format Gap Analyst, Audience Gap Analyst.

All subagents execute concurrently in the background and synthesize their findings upon completion.

### 2. NexusFlow YouTube Uploader MCP
When the `youtube-uploader` MCP server is active:
- Direct queueing of metadata packages (`youtube_add_to_queue`).
- Instant automated uploads (`youtube_upload_video`).
- Auto-Shorts detection & video duration probing (`youtube_probe_video`).
- NexusFlow generated video discovery (`youtube_scan_nexusflow_videos`).

### 3. AI Thumbnail Generation
- Native Antigravity `image-generator` subagent / Gemini Imagen 3.
- NanoBanana MCP server support (`generate_image`).
- Text-based briefs detailing hex codes, typography, facial expressions, and composition for human designers.

### 4. DataForSEO MCP (Optional Live SERP & Keyword Intelligence)
- Live YouTube search result rankings (`serp_youtube_organic_live_advanced`).
- Deep video metadata and engagement metrics (`serp_youtube_video_info_live_advanced`).
- Live audience comment mining (`serp_youtube_video_comments_live_advanced`).
- Search volume and keyword difficulty (`kw_data_google_ads_search_volume`).

---

## Installation

### Method 1: Automatic Installer (Recommended)

#### Windows (PowerShell):
```powershell
.\install.ps1
```

#### Linux / macOS (Bash):
```bash
chmod +x install.sh && ./install.sh
```

The installer copies the suite into Antigravity's global skills directory (`~/.gemini/config/skills/youtube/`) and mirrors to Claude Code (`~/.claude/skills/youtube/`) if present.

### Method 2: Manual Installation

Copy the `skills/youtube` folder to your Antigravity skills directory:
```bash
# Windows
Copy-Item -Recurse -Force skills\youtube "$env:USERPROFILE\.gemini\config\skills\youtube"

# Linux / macOS
mkdir -p ~/.gemini/config/skills/youtube
cp -r skills/youtube/* ~/.gemini/config/skills/youtube/
```

---

## Setup & Credentials

### Optional: YouTube Data API v3
The skill functions with manual user inputs, but automated fetching requires API credentials:
1. Obtain an API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Set the environment variable:
   ```bash
   # Windows PowerShell
   $env:YOUTUBE_API_KEY = "your-api-key-here"

   # Linux/macOS
   export YOUTUBE_API_KEY="your-api-key-here"
   ```
   Or place it in `~/.gemini/antigravity/youtube-credentials.json`:
   ```json
   {
     "api_key": "your-api-key-here"
   }
   ```

### Optional: Python Dependencies
For execution scripts (fetching channel data, transcripts):
```bash
pip install google-api-python-client google-auth-oauthlib yt-dlp
```

---

## Usage in Antigravity

Invoke any command directly in Antigravity chat:

```text
> /youtube audit
> /youtube ideate
> /youtube script "Building an Autonomous AI Agent in 2026"
> /youtube thumbnail
> /youtube seo
```

Antigravity checks for your channel niche, size tier, and primary goal before executing, then applies quality gates and self-annealing to verify deliverable excellence.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
