# Gemini Context & Channel History Prompting Directives

When interacting with Gemini models for "Bones of Empires" and NexusFlow video generation:

## Core Channel Identity
- **Channel**: Bones of Empires (`@BonesOfEmpires`)
- **Format**: YouTube Shorts (Vertical 9:16, 24 fps, 24s)
- **Protagonist**: MARROW (anatomical skeleton, ivory bones, translucent cyan glass silhouette, amber glowing eyes, undyed wool Roman tunic)
- **Tone**: Mysterious, cinematic, authoritative documentary voice, visceral sound design.

## Grounding Rules
1. Before proposing new video topics or prompt changes, query `channel_history_get_channel_memory` to verify active story arcs and guardrails.
2. When creating prompts for NexusFlow, always maintain the exact `CHARACTER "MARROW"` continuity lock snippet.
3. Use `channel_history_sync_ecosystem` to keep track of current video status in the production pipeline.
