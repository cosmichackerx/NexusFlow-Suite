const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { paths, ensureDirs } = require('./config');

/**
 * Load archived prompts.
 */
function getPromptArchive() {
  ensureDirs();
  if (fs.existsSync(paths.PROMPT_ARCHIVE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(paths.PROMPT_ARCHIVE_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.error('[PromptHistory] Error reading prompt archive:', e.message);
    }
  }
  return [];
}

/**
 * Save prompt archive to disk.
 */
function savePromptArchive(archive) {
  ensureDirs();
  fs.writeFileSync(paths.PROMPT_ARCHIVE_FILE, JSON.stringify(archive, null, 2), 'utf8');
  return archive;
}

/**
 * Read current live prompt from NexusFlow's Prompt.txt.
 */
function getCurrentNexusFlowPrompt() {
  if (fs.existsSync(paths.NEXUSFLOW_PROMPT_FILE)) {
    try {
      return fs.readFileSync(paths.NEXUSFLOW_PROMPT_FILE, 'utf8');
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Parse raw multi-scene prompt text into structured scenes and metadata.
 */
function parsePrompt(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { rawText: '', sceneCount: 0, scenes: [], characterLock: null, dialogueQuotes: [] };
  }

  // Split into scenes by double newlines or lines starting with Vertical
  const sceneBlocks = rawText
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(b => b.length > 50);

  const scenes = [];
  const allQuotes = [];

  sceneBlocks.forEach((block, index) => {
    // Extract timing
    const timingMatch = block.match(/TIMING:\s*([^;]+;[^;]+;[^.]+)/i) || block.match(/TIMING:\s*([^.\n]+)/i);
    // Extract dialogue
    const quotes = [...block.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    quotes.forEach(q => {
      if (q.length > 3 && !allQuotes.includes(q)) allQuotes.push(q);
    });

    // Extract Camera
    const cameraMatch = block.match(/CAMERA AND LENS:\s*([^.\n]+(?:\.[^.\n]+)?)/i);
    // Extract SFX
    const sfxMatch = block.match(/SFX:\s*([^.\n]+(?:\.[^.\n]+)?)/i);
    // Extract Start & Final Frame
    const startMatch = block.match(/START FRAME:\s*([^.\n]+(?:\.[^.\n]+)?)/i);
    const finalMatch = block.match(/FINAL FRAME:\s*([^.\n]+(?:\.[^.\n]+)?)/i);

    scenes.push({
      sceneNumber: index + 1,
      rawText: block,
      timing: timingMatch ? timingMatch[1].trim() : '0 to 8s',
      quotes,
      camera: cameraMatch ? cameraMatch[1].trim() : 'Cinematic 9:16',
      sfx: sfxMatch ? sfxMatch[1].trim() : 'Cavern ambiance',
      startFrame: startMatch ? startMatch[1].trim() : '',
      finalFrame: finalMatch ? finalMatch[1].trim() : ''
    });
  });

  // Check character lock
  const hasMarrow = /CHARACTER\s*"MARROW"/i.test(rawText);
  const hasSkeleton = /skeleton/i.test(rawText);
  const hasAmberEyes = /amber.*eye/i.test(rawText);
  const hasCyanSilhouette = /cyan.*silhouette/i.test(rawText);

  return {
    rawText,
    sceneCount: scenes.length,
    scenes,
    characterLock: {
      characterName: hasMarrow ? 'MARROW' : 'Unknown',
      isComplete: hasMarrow && hasSkeleton && hasAmberEyes && hasCyanSilhouette,
      details: {
        hasMarrow,
        hasSkeleton,
        hasAmberEyes,
        hasCyanSilhouette
      }
    },
    dialogueQuotes: allQuotes
  };
}

/**
 * Validate prompt continuity and production standards.
 */
function validatePromptContinuity(rawText) {
  const parsed = parsePrompt(rawText);
  const checks = [];

  checks.push({
    rule: 'Aspect Ratio: Vertical 9:16',
    passed: /vertical\s*9:16/i.test(rawText),
    weight: 15
  });

  checks.push({
    rule: 'Frame Rate: 24 fps',
    passed: /24\s*fps/i.test(rawText),
    weight: 10
  });

  checks.push({
    rule: 'Character Continuity: MARROW Lock',
    passed: parsed.characterLock.isComplete,
    weight: 25
  });

  checks.push({
    rule: 'Voice Character Specification',
    passed: /VOICE CHARACTER:/i.test(rawText),
    weight: 15
  });

  checks.push({
    rule: 'Scene Structure: 3-Scene Layout',
    passed: parsed.sceneCount >= 3,
    weight: 15
  });

  checks.push({
    rule: 'Timing Brackets (0 to 2s, 2 to 5s, 5 to 8s)',
    passed: /0\s*to\s*2\s*sec/i.test(rawText) && /2\s*to\s*5\s*sec/i.test(rawText),
    weight: 10
  });

  checks.push({
    rule: 'Synchronized Dialogue Quotes',
    passed: parsed.dialogueQuotes.length >= 2,
    weight: 10
  });

  let totalScore = 0;
  let maxScore = 0;
  checks.forEach(c => {
    maxScore += c.weight;
    if (c.passed) totalScore += c.weight;
  });

  return {
    score: Math.round((totalScore / maxScore) * 100),
    isProductionReady: totalScore >= 85,
    checks,
    sceneCount: parsed.sceneCount,
    dialogueQuotes: parsed.dialogueQuotes
  };
}

/**
 * Archive a prompt in the ledger with automatic hashing and metadata.
 */
function archivePrompt(rawText, metadata = {}) {
  const archive = getPromptArchive();
  const parsed = parsePrompt(rawText);
  const validation = validatePromptContinuity(rawText);

  const hash = crypto.createHash('sha256').update(rawText.trim()).digest('hex').slice(0, 16);

  const existingIdx = archive.findIndex(p => p.hash === hash || (metadata.id && p.id === metadata.id));

  const now = new Date().toISOString();
  const promptId = metadata.id || `prompt_${Date.now()}_${(metadata.title || 'short').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 20)}`;

  const entry = {
    id: promptId,
    hash,
    title: metadata.title || 'Untitled NexusFlow Scene Set',
    arcId: metadata.arcId || 'arc_01_alexandria',
    associatedVideoId: metadata.videoId || null,
    createdAt: (existingIdx >= 0 && archive[existingIdx].createdAt) || metadata.createdAt || now,
    archivedAt: now,
    sceneCount: parsed.sceneCount,
    validationScore: validation.score,
    isProductionReady: validation.isProductionReady,
    characterLock: parsed.characterLock,
    dialogueQuotes: parsed.dialogueQuotes,
    scenes: parsed.scenes.map(s => ({
      sceneNumber: s.sceneNumber,
      timing: s.timing,
      quotes: s.quotes,
      camera: s.camera,
      sfx: s.sfx,
      startFrame: s.startFrame,
      finalFrame: s.finalFrame
    })),
    rawText
  };

  if (existingIdx >= 0) {
    archive[existingIdx] = entry;
  } else {
    archive.unshift(entry);
  }

  savePromptArchive(archive);
  return entry;
}

/**
 * Compare two prompts and output continuity diff summary.
 */
function comparePrompts(promptA, promptB) {
  const parsedA = parsePrompt(promptA);
  const parsedB = parsePrompt(promptB);

  return {
    scenesA: parsedA.sceneCount,
    scenesB: parsedB.sceneCount,
    characterMatch: parsedA.characterLock.characterName === parsedB.characterLock.characterName,
    dialogueA: parsedA.dialogueQuotes,
    dialogueB: parsedB.dialogueQuotes,
    newDialogueInB: parsedB.dialogueQuotes.filter(q => !parsedA.dialogueQuotes.includes(q)),
    characterLockIntact: parsedA.characterLock.isComplete && parsedB.characterLock.isComplete
  };
}

module.exports = {
  getPromptArchive,
  savePromptArchive,
  getCurrentNexusFlowPrompt,
  parsePrompt,
  validatePromptContinuity,
  archivePrompt,
  comparePrompts
};
