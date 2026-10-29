const fs = require('fs');
const crypto = require('crypto');
const { paths } = require('./config');
const { log } = require('./logger');

const projectsFilePath = paths.PROJECTS_FILE || require('path').join(
  process.env.APPDATA || process.env.HOME || '.',
  'nexusflow',
  'flow-projects.json'
);

function getPromptHash(promptText) {
  if (!promptText) return '';
  const normalized = promptText.trim().replace(/\s+/g, ' ').toLowerCase();
  return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 10);
}

function loadProjectsData() {
  try {
    if (fs.existsSync(projectsFilePath)) {
      return JSON.parse(fs.readFileSync(projectsFilePath, 'utf8'));
    }
  } catch (e) {
    // If parse error, return clean structure
  }
  return { projects: {}, lastActiveProjectUrl: null };
}

function saveProjectsData(data) {
  try {
    const dir = require('path').dirname(projectsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(projectsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    log('error', `Failed to save projects history: ${e.message}`);
  }
}

function isProjectUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('/project/') && !url.includes('/project/new');
}

function cleanProjectUrl(url) {
  if (!url) return null;
  const match = url.match(/(https?:\/\/[^\/]+\/project\/[a-zA-Z0-9_-]+)/);
  return match ? match[1] : url.split('?')[0];
}

function savePromptProject(promptIndex, promptText, projectUrl) {
  if (!isProjectUrl(projectUrl)) return;
  const cleanUrl = cleanProjectUrl(projectUrl);
  const data = loadProjectsData();
  
  const promptKey = String(promptIndex);
  const hash = getPromptHash(promptText);
  const promptSummary = (promptText || '').slice(0, 100).trim();

  data.projects[promptKey] = {
    index: promptIndex,
    hash: hash,
    prompt: promptSummary,
    url: cleanUrl,
    updatedAt: Date.now()
  };
  data.lastActiveProjectUrl = cleanUrl;

  saveProjectsData(data);
  log('info', `Recorded project URL for prompt ${promptIndex + 1}: ${cleanUrl}`);
}

function getPromptProject(promptIndex, promptText) {
  const data = loadProjectsData();
  const promptKey = String(promptIndex);
  const record = data.projects[promptKey];
  if (!record || !record.url) return null;

  // STRICT VALIDATION: Only rescue if this project actually matches the current prompt!
  if (promptText) {
    const currentHash = getPromptHash(promptText);
    if (record.hash && record.hash !== currentHash) {
      log('info', `[Credit Rescue] Saved project for slot ${promptIndex + 1} belonged to a different prompt. Ignoring old project.`);
      return null;
    }
    if (!record.hash && record.prompt) {
      const recNorm = record.prompt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 50);
      const curNorm = promptText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 50);
      if (recNorm !== curNorm) {
        log('info', `[Credit Rescue] Saved project for slot ${promptIndex + 1} was for an older different prompt. Starting fresh.`);
        return null;
      }
    }
  }

  return record;
}

function clearStaleProjects(currentPrompts) {
  if (!Array.isArray(currentPrompts) || currentPrompts.length === 0) return;
  const data = loadProjectsData();
  if (!data.projects || Object.keys(data.projects).length === 0) return;

  let clearedCount = 0;
  for (let idx = 0; idx < currentPrompts.length; idx++) {
    const key = String(idx);
    const rec = data.projects[key];
    if (rec) {
      const expectedHash = getPromptHash(currentPrompts[idx]);
      if (rec.hash && rec.hash !== expectedHash) {
        delete data.projects[key];
        clearedCount++;
      } else if (!rec.hash && rec.prompt) {
        const recNorm = rec.prompt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 50);
        const curNorm = currentPrompts[idx].replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 50);
        if (recNorm !== curNorm) {
          delete data.projects[key];
          clearedCount++;
        }
      }
    }
  }

  // Also remove slots beyond current prompts length
  for (const k of Object.keys(data.projects)) {
    if (parseInt(k, 10) >= currentPrompts.length) {
      delete data.projects[k];
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    saveProjectsData(data);
    log('info', `Cleaned up ${clearedCount} stale Google Flow project records from previous prompt sessions.`);
  }
}

function getLastActiveProject() {
  const data = loadProjectsData();
  return data.lastActiveProjectUrl || null;
}

function setLastActiveProject(projectUrl) {
  if (!isProjectUrl(projectUrl)) return;
  const cleanUrl = cleanProjectUrl(projectUrl);
  const data = loadProjectsData();
  data.lastActiveProjectUrl = cleanUrl;
  saveProjectsData(data);
}

function clearProjects() {
  saveProjectsData({ projects: {}, lastActiveProjectUrl: null });
  log('info', 'Tracked Google Flow projects cleared.');
}

module.exports = {
  isProjectUrl,
  cleanProjectUrl,
  getPromptHash,
  savePromptProject,
  getPromptProject,
  clearStaleProjects,
  getLastActiveProject,
  setLastActiveProject,
  loadProjects: loadProjectsData,
  clearProjects
};
