# Story Continuity & NexusFlow Prompt Sub-Skill

This sub-skill bridges narrative ideation with production execution by generating production-ready 3-scene prompts for NexusFlow.

## Prompt Architecture Requirements

Each generated prompt block must satisfy the exact engine specifications of NexusFlow:

1. **Resolution & Pacing**:
   - `Vertical 9:16`, `24 fps`, `ultra-detailed cinematic stylised 3D CGI`, `Pixar-meets-documentary realism`.
   - `rich teal-and-amber colour grade`, `high-contrast volumetric lighting`.

2. **Character Continuity Lock**:
   - `CHARACTER "MARROW": a stylised anatomical human skeleton made of polished ivory-white bones, surrounded by a faintly translucent pale-cyan glass-like body silhouette around the torso and limbs, with two warm amber glowing lights inside the eye sockets that flare brighter or dim with emotion, expressive stylised proportions with a large skull and slim ribcage, wearing a plain undyed wool Roman tunic with a brown leather belt and a small leather coin pouch on the left hip, no modern items.`

3. **Voice Directives**:
   - `VOICE CHARACTER: Marrow speaks with a deep, resonant, slightly raspy male voice, calm but ominous, with clear English pronunciation, cinematic documentary delivery, subtle vocal grit, and natural pauses. Dialogue must synchronise with Marrow's gestures and skull movements.`

4. **Scene Staging & Pacing (3 x 8s = 24s total)**:
   - **Scene 1**: Establishing & Discovery (0-2s hook, 2-5s approach, 5-8s revelation).
   - **Scene 2**: Escalation & Interaction (Matches final frame of Scene 1, mechanism or artifact unlocks).
   - **Scene 3**: Climax & Cliffhanger (Matches final frame of Scene 2, portals or energy burst, sudden cut to black).

5. **Deployment**:
   - `node cli.js apply-prompt 1` writes directly into `C:\Google Flow Customized\Prompt.txt` with timestamped backups.
