# Google Antigravity (AGY) YouTube Creator Suite — Complete Manual

Welcome to the **Antigravity YouTube Creator Skills Suite**, engineered natively for Google Antigravity pair programming and autonomous execution.

---

## 1. Quick Start

### Installation into Antigravity
To install these skills globally into your Antigravity environment (`~/.gemini/config/skills/`), run:

```powershell
# In PowerShell:
.\install.ps1
```

Or on Linux/macOS:
```bash
./install.sh
```

Once installed, all 11 skills are immediately recognized across any Antigravity conversation or project workspace.

---

## 2. The 11 Skills at a Glance

| Skill Name | Trigger / Prompt | Primary Responsibilities |
|---|---|---|
| [`youtube-manager`](skills/youtube-manager/SKILL.md) | "Set up my channel manager" / "Update channel memory" | Public channel research, persistent `CHANNEL_MEMORY.md`, transcript extraction, content strategy. |
| [`creator-voice`](skills/creator-voice/SKILL.md) | "Analyze my creator voice" / "Update CREATOR_VOICE.md" | Analyzes authentic scripts and transcripts to build a durable tone, register, and cadence profile. |
| [`topic-scout`](skills/topic-scout/SKILL.md) | "Find 5 video opportunities" / "Scout topics for my niche" | Current search demand, competitor coverage gaps, channel fit, and ranked opportunity shortlist. |
| [`review-grill`](skills/review-grill/SKILL.md) | "Interview me about this product" / "Create review brief" | Researches specs/pricing independently, grills creator 1 question per turn, outputs `review-brief.md`. |
| [`video-kit`](skills/video-kit/SKILL.md) | "Write an outline/script for this video" / "Generate publishing pack" | Full long-form package: research, hook alternatives, retention-engineered outline/script, title/tags/desc. |
| [`youtube-thumbnail`](skills/youtube-thumbnail/SKILL.md) | "Design a thumbnail concept" / "Create thumbnail mockup" | 16:9 packaging promise, 3-5 word hook text, focal crop, visual mockup via Antigravity `image-generator`. |
| [`youtube-shorts`](skills/youtube-shorts/SKILL.md) | "Turn this into a Short" / "Script a vertical Short" | Short-specific hooks, scene beat breakdown, text overlays, safe zone compliance, and render plans. |
| [`compose-video`](skills/compose-video/SKILL.md) | "Render this video with HyperFrames" / "Compose motion video" | HyperFrames composition, local asset checks, structural quality gates, and local MP4 rendering. |
| [`fact-check`](skills/fact-check/SKILL.md) | "Fact check this script" / "Audit factual claims" | Extracts atomic claims into `claims.md`, runs parallel subagent research, outputs cited `audit-report.md`. |
| [`social-repurpose`](skills/social-repurpose/SKILL.md) | "Repurpose this video for social media" | Extracts stand-alone high-value angles into platform-native formats (Shorts, LinkedIn, X, newsletters). |
| [`youtube-analytics`](skills/youtube-analytics/SKILL.md) | "Analyze my YouTube Studio stats" / "Diagnose retention" | Diagnostic breakdown of CTR, viewer journey, retention drop-offs, and 3 actionable next steps. |

---

## 3. End-to-End Workflow in Antigravity

### Phase 1: Channel Foundation
1. Start by introducing your channel:
   ```
   "Set up a channel manager for my YouTube channel: https://youtube.com/@handle"
   ```
   `youtube-manager` inspects public videos, extracts transcripts (via `transcribe_youtube.py` if needed), and prepares a draft channel profile.
2. Review and approve the profile. Antigravity writes `CHANNEL_MEMORY.md`.
3. Optionally run `creator-voice` to capture your natural speaking cadence into `CREATOR_VOICE.md`.

### Phase 2: Idea Scouting & Review Grilling
1. Ask `topic-scout` for ranked concepts:
   ```
   "Use my channel memory to find and rank five high-potential video opportunities."
   ```
2. If working on a physical product or software review, invoke `review-grill`:
   ```
   "Interview me about my experience testing the DJI Mic 2 for a review video."
   ```
   The agent searches specs and pricing via `search_web`, then asks you questions one at a time. The result is saved to `videos/2026/DJI-Mic-2-Review/review-brief.md`.

### Phase 3: Scripting, Packaging & Production
1. Launch `video-kit`:
   ```
   "Write a retention-engineered recording outline and publishing package for this review."
   ```
   The agent creates `script.md` with pattern interrupts every 60-90 seconds and `publishing.md` with title variants and SEO descriptions.
2. Create thumbnail packaging with `youtube-thumbnail`:
   ```
   "Create 3 thumbnail concepts for this video."
   ```
   The agent defines visual focal points and can invoke the `image-generator` subagent to generate visual previews.
3. Repurpose or build Shorts with `youtube-shorts`.

### Phase 4: Fact-Checking & Quality Gate
1. Before recording or rendering, run `fact-check`:
   ```
   "Fact-check all claims in videos/2026/DJI-Mic-2-Review/script.md."
   ```
   Antigravity extracts atomic claims, dispatches parallel subagents via `invoke_subagent`, verifies evidence against authoritative sources, and generates `audit-report.md`.

### Phase 5: Publishing & Post-Mortem
1. When publishing assets are ready, connect with the **NexusFlow YouTube Uploader MCP**:
   - `youtube_probe_video` to verify video health.
   - `youtube_add_to_queue` to schedule publication.
2. Once the video has gathered viewer data, share Studio metrics with `youtube-analytics` for post-publish diagnosis.

---

## 4. Antigravity Tool & Command Reference

- **`search_web`**: Web research with cited URLs and timestamps.
- **`invoke_subagent`**: Spawns parallel research and image generation workers.
- **`run_command`**: Runs local tools:
  - `python skills/youtube-manager/scripts/transcribe_youtube.py <url>`
  - `powershell skills/youtube-manager/scripts/setup_local_asr.ps1 -Source <url>`
  - `npx hyperframes render`
- **MCP Servers**:
  - `youtube-uploader`: Studio uploading, queue management, video probing.
  - `nexusflow`: Generative pipeline automation and video concatenation.
