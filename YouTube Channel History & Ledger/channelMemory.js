const fs = require('fs');
const path = require('path');
const { paths, defaultChannelMemory, ensureDirs } = require('./config');

/**
 * Load or initialize channel memory.
 */
function getChannelMemory() {
  ensureDirs();
  if (fs.existsSync(paths.CHANNEL_MEMORY_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(paths.CHANNEL_MEMORY_FILE, 'utf8'));
      // Deep merge with defaults to ensure all fields exist
      return {
        channel: { ...defaultChannelMemory.channel, ...data.channel },
        character: { ...defaultChannelMemory.character, ...data.character },
        productionConventions: { ...defaultChannelMemory.productionConventions, ...data.productionConventions },
        audience: { ...defaultChannelMemory.audience, ...data.audience },
        storyArcs: data.storyArcs || defaultChannelMemory.storyArcs,
        rulesAndGuardrails: data.rulesAndGuardrails || defaultChannelMemory.rulesAndGuardrails,
        publishingCadence: { ...defaultChannelMemory.publishingCadence, ...data.publishingCadence },
        metricsAndGoals: { ...defaultChannelMemory.metricsAndGoals, ...data.metricsAndGoals },
        changeLog: data.changeLog || []
      };
    } catch (e) {
      console.error('[ChannelMemory] Error reading memory JSON, resetting to default:', e.message);
    }
  }

  // First time initialization
  saveChannelMemory(defaultChannelMemory, 'Initial profile creation');
  return defaultChannelMemory;
}

/**
 * Save channel memory to JSON and compile to Markdown.
 */
function saveChannelMemory(memory, reason = 'Update memory') {
  ensureDirs();
  const now = new Date().toISOString();
  memory.channel.lastSyncDate = now;

  if (!memory.changeLog) memory.changeLog = [];
  memory.changeLog.unshift({
    timestamp: now,
    reason
  });
  if (memory.changeLog.length > 50) memory.changeLog = memory.changeLog.slice(0, 50);

  // Write JSON
  fs.writeFileSync(paths.CHANNEL_MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf8');

  // Generate and write Markdown to both user data and workspace root
  const md = generateMarkdownProfile(memory);
  try {
    fs.writeFileSync(paths.CHANNEL_MEMORY_MD, md, 'utf8');
    fs.writeFileSync(paths.WORKSPACE_MEMORY_MD, md, 'utf8');
  } catch (e) {
    // Ignore workspace write error if permission issue
  }

  return memory;
}

/**
 * Partial update channel memory.
 */
function updateChannelMemory(patch, reason = 'Manual update') {
  const current = getChannelMemory();
  const updated = {
    ...current,
    channel: { ...current.channel, ...(patch.channel || {}) },
    character: { ...current.character, ...(patch.character || {}) },
    productionConventions: { ...current.productionConventions, ...(patch.productionConventions || {}) },
    audience: { ...current.audience, ...(patch.audience || {}) },
    storyArcs: patch.storyArcs || current.storyArcs,
    rulesAndGuardrails: patch.rulesAndGuardrails || current.rulesAndGuardrails,
    publishingCadence: { ...current.publishingCadence, ...(patch.publishingCadence || {}) },
    metricsAndGoals: { ...current.metricsAndGoals, ...(patch.metricsAndGoals || {}) }
  };

  return saveChannelMemory(updated, reason);
}

/**
 * Convert memory object to comprehensive Markdown format.
 */
function generateMarkdownProfile(mem) {
  const c = mem.channel || {};
  const ch = mem.character || {};
  const pc = mem.productionConventions || {};
  const aud = mem.audience || {};
  const cad = mem.publishingCadence || {};
  const met = mem.metricsAndGoals || {};

  return `# ${c.name} — Living Channel Memory & Strategy Bible
*Channel Memory File — Generated on ${new Date().toISOString()}*

---

## 1. Channel Identity & Scope
- **Channel Name**: ${c.name}
- **Channel Handle**: \`${c.handle}\`
- **Official URL**: [${c.url}](${c.url})
- **Subscribe Link**: [One-Click Subscribe](${c.subscribeUrl})
- **Primary Niche**: ${c.primaryNiche}
- **Sub-Niche**: ${c.subNiche}
- **Core Promise**: "${c.corePromise}"
- **Status**: \`${c.status.toUpperCase()}\` (Active Production)
- **Palette**: Cyan (\`${c.brandColor}\`) & Amber (\`${c.accentColor}\`)

---

## 2. Character & Persona Bible: "${ch.name}"
> **Title**: ${ch.title}
> 
> *${ch.voice}*

### Visual Anatomy & Design
- **Bone Structure**: ${ch.anatomy}
- **Ocular Expression**: ${ch.eyes}
- **Attire & Wardrobe**: ${ch.attire}
- **Vocal Signature**: ${ch.voice}

### NexusFlow Continuity Lock Formula
\`\`\`text
${ch.continuityLockPrompt}
\`\`\`

---

## 3. Production Conventions & Style Guide
| Dimension | Specification |
|---|---|
| **Aspect Ratio** | ${pc.format} |
| **Frame Rate** | ${pc.frameRate} |
| **Duration Target** | ${pc.targetDurationSec} seconds (${pc.minDurationSec}s - ${pc.maxDurationSec}s) |
| **Visual Lighting** | ${pc.visualGrade} |
| **Scene Layout** | ${pc.sceneStructure} |
| **Audio Ambiance** | ${pc.audioBed} |
| **Cinematography** | ${pc.cameraStyle} |

---

## 4. Audience & Psychology
- **Demographics**: ${aud.targetDemographic}
- **Primary Regions**: ${(aud.primaryMarkets || []).join(', ')}
- **Psychological Hook**: ${aud.viewerIntent}

---

## 5. Story Arcs & Lore Ledger
${(mem.storyArcs || []).map((arc, i) => `### Arc ${i + 1}: ${arc.title} [${arc.status.toUpperCase()}]
- **Theme**: ${arc.theme}
- **Episodes Completed**: ${arc.episodesCount}
`).join('\n')}

---

## 6. Algorithmic Rules & Guardrails
${(mem.rulesAndGuardrails || []).map(r => `- ${r}`).join('\n')}

---

## 7. Publishing Cadence & Windows
- **Upload Cadence**: ${cad.targetPerWeek} Shorts per week
- **Optimal Days**: ${(cad.bestPublishDays || []).join(', ')}
- **Prime Time EST**: \`${cad.bestTimeEST}\`
- **Prime Time PKT**: \`${cad.bestTimePKT}\`
- **Prime Time UTC**: \`${cad.bestTimeUTC}\`

---

## 8. Channel Goals & Milestones
${(met.milestones || []).map(m => `- [${m.reached ? 'x' : ' '}] **${m.goal}** (Target: ${m.targetDate})`).join('\n')}

- **Target Average Retention**: ${met.targetAverageRetention}
- **Target CTR**: ${met.targetCTR}

---

## 9. Recent Revision History
${(mem.changeLog || []).slice(0, 10).map(cl => `- \`${cl.timestamp}\`: ${cl.reason}`).join('\n')}
`;
}

module.exports = {
  getChannelMemory,
  saveChannelMemory,
  updateChannelMemory,
  generateMarkdownProfile
};
