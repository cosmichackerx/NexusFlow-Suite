# Antigravity YouTube Creator Skills Suite

[![CI](https://github.com/ITZSHOAIB/youtube-creator-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/ITZSHOAIB/youtube-creator-skills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-FF8A24.svg)](LICENSE)
[![Antigravity Native](https://img.shields.io/badge/Antigravity-Native-4285F4.svg)](ANTIGRAVITY.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-53D8FF.svg)](CONTRIBUTING.md)

**Native, channel-aware skills for Google Antigravity (AGY)** and cross-compatible with Claude Code and Codex. Research the channel and product, interview the creator for real experience, then shape data-backed ideas, scripts, high-CTR packaging, and production around approved channel memory.

This repository packages 11 production-grade skills installable as a unified Antigravity plugin, as workspace customizations, or as global skills.

---

## Skills in this Suite

| Skill | Description & Responsibilities |
|---|---|
| [`youtube-manager`](skills/youtube-manager/SKILL.md) | Channel setup, creator-approved `CHANNEL_MEMORY.md`, channel research, content strategy, and optional reviews of supplied Studio analytics. |
| [`topic-scout`](skills/topic-scout/SKILL.md) | Deep, current research and evidence-backed ranking of video topic opportunities for a specific channel. |
| [`review-grill`](skills/review-grill/SKILL.md) | Product/service research followed by an adaptive, 1-question-at-a-time interview saving firsthand experience in a structured `review-brief.md`. |
| [`video-kit`](skills/video-kit/SKILL.md) | Per-video research, recording outlines or scripts, publishing assets, and optional open-source HyperFrames production. |
| [`youtube-shorts`](skills/youtube-shorts/SKILL.md) | Short-specific concepts, scripts, upload assets, production briefs, overlays, and requested local renders. |
| [`compose-video`](skills/compose-video/SKILL.md) | Open-source HyperFrames production: brief to checked composition to approved render, with honest tooling fallbacks. |
| [`youtube-thumbnail`](skills/youtube-thumbnail/SKILL.md) | Honest 16:9 thumbnail strategy, 3–5 word hook copy, focal crops, and final exports (integrated with Antigravity `image-generator`). |
| [`creator-voice`](skills/creator-voice/SKILL.md) | An approved creator voice profile (`CREATOR_VOICE.md`) derived from real scripts and transcripts. |
| [`social-repurpose`](skills/social-repurpose/SKILL.md) | A selected cross-platform repurposing plan (Shorts, Reels, carousels, threads, newsletters) from an approved source video. |
| [`fact-check`](skills/fact-check/SKILL.md) | Audits factual claims in scripts and videos with parallel subagent research (`invoke_subagent`), direct sources, corrections, and claim ledgers. |
| [`youtube-analytics`](skills/youtube-analytics/SKILL.md) | Evidence-based decisions from supplied YouTube Studio data. |

---

## Antigravity Native Architecture

This repository is designed from the ground up for **Google Antigravity (AGY)**:

- **`plugin.json`**: Marks this repository as an installable Antigravity plugin bundle.
- **`GEMINI.md`**: Directory-level workspace rules and execution guidelines for Antigravity.
- **`AGENTS.md`**: Autonomous multi-agent orchestration architecture detailing subagent handoffs, reactive wakeup, and MCP integration.
- **`ANTIGRAVITY.md`**: Comprehensive operational manual and workflow recipes for pair programming in Antigravity.
- **`.agents/skills/`**: Direct project workspace discovery for Antigravity IDE and CLI.
- **Subagent Parallelism**: Uses `invoke_subagent` with `flash` / `flash_lite` models for parallel claim verification in `fact-check` and opportunity scouting in `topic-scout`.
- **MCP Server Links**: Out-of-the-box integration with `youtube-uploader` (automated Studio publishing and queueing) and `nexusflow` (AI video generation and lossless video concatenation).

---

## Installation

### Method 1: Antigravity One-Click Setup (Recommended)

In PowerShell (Windows):
```powershell
.\install.ps1
```

Or on Linux / macOS:
```bash
chmod +x install.sh
./install.sh
```

This registers all 11 skills into `~/.gemini/config/skills/` and creates the workspace `.agents/skills/` environment.

### Method 2: Skills CLI (Cross-Compatible)

```bash
npx skills add ITZSHOAIB/youtube-creator-skills
```

---

## Quick Antigravity Prompts

Once installed, use natural language in Antigravity:

- **Channel Onboarding**: `Set up a channel manager for my YouTube channel: https://youtube.com/@handle`
- **Topic Discovery**: `Use my channel memory and current YouTube evidence to find and rank five video opportunities.`
- **Product Review**: `Interview me about my experience with this controller and save a review brief. Then help me turn it into a YouTube review video.`
- **Script & Packaging**: `Research this topic, make a high-retention recording outline, and prepare the title, description, tags, thumbnail copy, and music options.`
- **Thumbnail Design**: `Create a 1280x720 thumbnail concept and packaging promise for this video project.`
- **Shorts Production**: `Turn the strongest moment from this review into a self-contained YouTube Short.`
- **Fact-Check Audit**: `Audit all factual claims in videos/2026/Review/script.md and generate claims.md and audit-report.md.`
- **Studio Analytics**: `Analyze supplied YouTube Studio metrics and recommend the top 3 actionable decisions.`

---

## Repository Layout

```text
├── plugin.json                 # Antigravity Plugin manifest
├── GEMINI.md                   # Workspace rules for Antigravity
├── AGENTS.md                   # Multi-agent orchestration & subagent guide
├── ANTIGRAVITY.md              # Complete Antigravity operational manual
├── install.ps1                 # Windows installer for Antigravity
├── install.sh                  # Unix/macOS installer for Antigravity
├── .agents/
│   ├── skills.json             # Workspace skill registration
│   └── skills/                 # Discovered workspace skills
├── skills/
│   ├── youtube-manager/        # Channel setup, memory & strategy
│   │   ├── SKILL.md
│   │   ├── references/
│   │   └── scripts/
│   ├── topic-scout/            # Opportunity research & ranking
│   ├── review-grill/           # Adaptive firsthand interview
│   ├── video-kit/              # Scripts, outlines & publishing
│   ├── youtube-shorts/         # Vertical Short production
│   ├── compose-video/          # HyperFrames motion composition
│   ├── youtube-thumbnail/      # Thumbnail packaging & mockups
│   ├── creator-voice/          # Spoken/written voice profiling
│   ├── social-repurpose/       # Multi-platform derivatives
│   ├── fact-check/             # Parallel claim verification
│   └── youtube-analytics/      # Studio evidence diagnosis
└── site/                       # Documentation web app (Vite + React)
```

---

## Contributing

Contributions are welcome — skill guidance fixes, new skills, and site improvements all count. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, skill conventions, and the pull request checklist. All participation is covered by our [Code of Conduct](CODE_OF_CONDUCT.md).

- Bugs and suggestions use the [issue forms](https://github.com/ITZSHOAIB/youtube-creator-skills/issues/new/choose)
- Security issues go through [SECURITY.md](SECURITY.md) instead of public issues

---

## Documentation Site

The documentation site lives in [`site/`](site/). It is a Vite + React + TypeScript app styled with Tailwind CSS.

After editing any skill, run `npm run skills:sync` in `site/` to synchronize documentation copies.

```bash
cd site
npm install
npm run dev
```

---

## License

Licensed under the [MIT License](LICENSE).
