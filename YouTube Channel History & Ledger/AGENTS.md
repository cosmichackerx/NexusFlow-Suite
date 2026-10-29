# Subagent Orchestration Rules: YouTube Channel History & Memory

When executing channel management, historical logging, or memory maintenance tasks, adhere to the following principles:

## Subagent Roles

1. **Channel Memory Archivist Subagent**:
   - Maintains `CHANNEL_MEMORY.md` and `channel-memory.json`.
   - Protects protagonist lore ("Marrow") and production constraints.
   - Grounded in `skills/youtube-channel-history/sub-skills/channel-memory.md`.

2. **Video Ledger Chronicle Subagent**:
   - Manages immutable video entries across drafts, renders, queued, and published states.
   - Grounded in `skills/youtube-channel-history/sub-skills/video-ledger.md`.

3. **Prompt Continuity & Lineage Subagent**:
   - Analyzes multi-scene prompt diffs, ensures continuity locks are preserved, and grades prompt readiness (>= 85/100).
   - Grounded in `skills/youtube-channel-history/sub-skills/prompt-lineage.md`.

4. **Cadence & Time Intelligence Subagent**:
   - Tracks velocity from prompt to upload, detects scheduling gaps, and recommends optimal posting slots.
   - Grounded in `skills/youtube-channel-history/sub-skills/time-analytics.md`.

## Quality Gates
- **Character Lock**: Never alter or omit Marrow's core physical cues in prompt history.
- **Timing Integrity**: Verify that recorded durations accurately match probed video files.
- **Auto-Sync**: Always run `syncEcosystem` before answering detailed queries about recent uploads or queue items.
