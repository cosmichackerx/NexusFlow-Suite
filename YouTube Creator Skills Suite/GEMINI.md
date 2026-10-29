# Antigravity YouTube Creator Skills Suite

Native Google Antigravity (AGY) project rules and configuration for the 11-skill YouTube Creator Suite.
See [AGENTS.md](AGENTS.md) for multi-agent orchestration patterns and [ANTIGRAVITY.md](ANTIGRAVITY.md) for the complete operational guide.

## Project Overview

This repository provides 11 production-grade skills for the entire lifecycle of YouTube content creation:
1. **`youtube-manager`**: Channel setup, persistent approved `CHANNEL_MEMORY.md`, content strategy, and studio reviews.
2. **`topic-scout`**: Evidence-backed, demand-driven ranking of YouTube video topic opportunities.
3. **`review-grill`**: Product/service research + adaptive 1-question-per-turn creator interviews saving `review-brief.md`.
4. **`video-kit`**: Per-video research, retention-engineered recording outlines/scripts, and copy-ready publishing packages.
5. **`youtube-shorts`**: Short-specific concepts, retention hooks, scene beats, text overlays, and production briefs.
6. **`compose-video`**: HyperFrames motion composition, quality gates, and local render pipeline.
7. **`youtube-thumbnail`**: 16:9 packaging promise, 3-5 word hook copy, layout briefs, and final 1280x720 visual mockups.
8. **`creator-voice`**: Spoken and written voice profiling (`CREATOR_VOICE.md`) from authentic creator scripts and transcripts.
9. **`social-repurpose`**: Platform-native derivatives (Shorts, Reels, carousels, threads, newsletters) without lazy repetition.
10. **`fact-check`**: Traceable content auditing, atomic claim extraction, parallel subagent verification, and cited corrections.
11. **`youtube-analytics`**: Grounded YouTube Studio data diagnosis, audience journey analysis, and high-impact decisions.

## Antigravity Execution Rules

- **Channel Memory Precedence**: When `CHANNEL_MEMORY.md` exists, follow it strictly for tone, audience, language, disclosures, and production constraints.
- **One-Question-At-A-Time**: When using `review-grill` or resolving build gaps, never overwhelm the creator with questionnaires. Ask exactly one question per turn.
- **Human Approval Gates**: Never save permanent channel memory, overwrite existing voice profiles, generate final video renders, or dispatch public uploads without explicit creator approval.
- **Subagent Parallelism**: Dispatch research tasks (in `fact-check` and `topic-scout`) using `invoke_subagent` with `TypeName: "research"` or `"self"` and `Model: "flash"` or `"flash_lite"`. Antigravity handles reactive wakeup automatically.
- **Artifact Management**: Place video deliverables inside `videos/<year>/<video-title>/`. Keep `script.md`, `publishing.md`, `review-brief.md`, and assets together.
- **Toolchain Integrity**: Use `search_web` for real-time web verification, `run_command` for local ASR (`transcribe_youtube.py`) and HyperFrames rendering, and MCP tools (`youtube-uploader`, `nexusflow`) for studio publishing.
