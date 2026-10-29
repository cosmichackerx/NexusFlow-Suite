# Subagent Orchestration Rules: YouTube SEO

When executing YouTube SEO, Channel Management, or Trend Hunting tasks, adhere to the following principles:

## Subagent Responsibilities

1. **Channel Strategist Subagent**:
   - Focuses on channel brand health, subscriber retention signals, avatar/banner visual coherence, and competitive benchmark gaps.
   - Grounded in `skills/youtube-seo/sub-skills/channel.md`.

2. **SEO Metadata Subagent**:
   - Focuses on title CTR hooks, description above-the-fold previews, 500-char tag optimization, hashtag selection, and VideoObject schema markup.
   - Grounded in `skills/youtube-seo/sub-skills/seo.md`.

3. **Trend Hunter & Prompt Architect Subagent**:
   - Focuses on viral trend discovery, curiosity gap formulas, search volume tiering, and synthesizing 3-scene production prompts for NexusFlow.
   - Grounded in `skills/youtube-seo/sub-skills/trends.md` and `continuity-prompt.md`.

4. **Quality Auditor Subagent**:
   - Evaluates outputs against the 0-100 algorithmic audit scorecard. Rejects any metadata package scoring under 85 points.
   - Grounded in `skills/youtube-seo/sub-skills/audit.md`.

## Quality Gates

- **Title Limit**: Must never exceed 100 characters; mobile variants must be under 50 characters.
- **Tag Limit**: Must strictly stay under 485 characters (leaving safe buffer under 500).
- **Prompt Format**: Prompts for NexusFlow must strictly specify `Vertical 9:16`, `24 fps`, `CHARACTER "MARROW"`, `VOICE CHARACTER`, `CONTINUITY LOCK`, `TIMING (0 to 2s, 2 to 5s, 5 to 8s)`, and `FINAL FRAME`.
