# Sub-Skill: Prompt Lineage & Continuity Verification

## Overview
NexusFlow generates video clips based on multi-scene text prompts. Maintaining strict narrative and visual continuity across serial Shorts requires verifying the Character Lock, Voice Character, and scene pacing.

## Continuity Lock Specification
Every prompt submitted to NexusFlow must adhere to the following specification:

```text
CHARACTER "MARROW": a stylised anatomical human skeleton made of polished ivory-white bones, surrounded by a faintly translucent pale-cyan glass-like body silhouette around the torso and limbs, with two warm amber glowing lights inside the eye sockets that flare brighter or dim with emotion, expressive stylised proportions with a large skull and slim ribcage, wearing a plain undyed wool Roman tunic with a brown leather belt and a small leather coin pouch on the left hip, no modern items.

VOICE CHARACTER: Marrow speaks with a deep, resonant, slightly raspy male voice, calm but ominous, with clear English pronunciation, cinematic documentary delivery, subtle vocal grit, and natural pauses. Dialogue must synchronise with Marrow's gestures and skull movements.
```

## Scene Timing Structure
Shorts must follow the 3-Scene formula:
- **Scene 1 (0 to 8s)**:
  - 0-2s: Immediate visual / auditory curiosity hook.
  - 2-5s: Environment establishment and atmospheric mystery.
  - 5-8s: First anomaly / supernatural revelation.
- **Scene 2 (8 to 16s)**:
  - Dynamic camera orbit, gear grind, or artifact emergence. Escalates stakes.
- **Scene 3 (16 to 24s)**:
  - Climax, cosmic projection, or portal opening. Cliffhanger dialogue before cut to black.

## Continuity Validation Metrics (0-100)
- Aspect Ratio: Vertical 9:16 (15 pts)
- Frame Rate: 24 fps (10 pts)
- Character Lock Formula Intact (25 pts)
- Voice Character Specification (15 pts)
- 3-Scene Layout (15 pts)
- Timing Brackets Explicit (10 pts)
- Synchronized Dialogue Quotes (10 pts)
Threshold for production readiness: **>= 85 points**.
