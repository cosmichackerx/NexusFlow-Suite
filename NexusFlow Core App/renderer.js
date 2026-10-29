const logContainer = document.getElementById('logContainer');
const statusBadge = document.getElementById('statusBadge');
const promptDisplay = document.getElementById('promptDisplay');
const statTotalPrompts = document.getElementById('statTotalPrompts');
const statCurrentPrompt = document.getElementById('statCurrentPrompt');
const statRemainingPrompts = document.getElementById('statRemainingPrompts');
const promptProgressBar = document.getElementById('promptProgressBar');

  
  const editCreditsBtn = document.getElementById('editCreditsBtn');
  
  // Load saved credits on startup
  try {
    const savedCredits = localStorage.getItem('creditTableData');
    if (savedCredits) {
      const parsed = JSON.parse(savedCredits);
      const inputs = document.querySelectorAll('.credit-input');
      inputs.forEach((input, index) => {
        if (parsed[index] !== undefined) {
          input.value = parsed[index];
        }
      });
    }
  } catch (e) {
    console.error('Failed to parse saved credits', e);
  }

  let isEditingCredits = false;

  if (editCreditsBtn) {
    editCreditsBtn.addEventListener('click', () => {
      isEditingCredits = !isEditingCredits;
      const inputs = document.querySelectorAll('.credit-input');
      if (isEditingCredits) {
        editCreditsBtn.style.color = 'var(--primary-color)';
        editCreditsBtn.title = 'Save Costs';
        editCreditsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
        inputs.forEach(input => {
          input.removeAttribute('readonly');
          input.style.border = '1px solid rgba(255,255,255,0.2)';
          input.style.background = 'rgba(0,0,0,0.3)';
          input.style.borderRadius = '3px';
        });
        if (inputs.length > 0) inputs[0].focus();
      } else {
        editCreditsBtn.style.color = 'var(--text-secondary)';
        editCreditsBtn.title = 'Edit Costs';
        editCreditsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        
          inputs.forEach(input => {
            input.setAttribute('readonly', 'true');
            input.style.border = '1px solid transparent';
            input.style.background = 'transparent';
          });
          // Save values to localStorage
          try {
            const values = Array.from(inputs).map(i => i.value);
            localStorage.setItem('creditTableData', JSON.stringify(values));
            appendLog({ type: 'success', message: 'Credit table values saved locally.' });
          } catch (e) {
            console.error('Failed to save credits', e);
          }

      }
    });
  }

  const startBtn = document.getElementById('startBtn');
const loginBtn = document.getElementById('loginBtn');
const creditsDisplay = document.getElementById('creditsDisplay');
const creditsInput = {
  get value() {
    return creditsDisplay ? creditsDisplay.innerText : '0';
  },
  set value(v) {
    if (creditsDisplay) {
      creditsDisplay.innerText = (v !== null && v !== undefined) ? v : '0';
      if (typeof v === 'string' && isNaN(parseInt(v, 10))) {
        creditsDisplay.style.fontSize = '0.9rem';
        creditsDisplay.style.color = 'var(--text-secondary)';
      } else {
        creditsDisplay.style.fontSize = '1.15rem';
        creditsDisplay.style.color = '#10b981';
      }
    }
  },
  set disabled(_v) {}
};
const minBtn = document.getElementById('minBtn');
const maxBtn = document.getElementById('maxBtn');
const closeBtn = document.getElementById('closeBtn');
const automationTimer = document.getElementById('automationTimer');

let timerInterval = null;
let startTime = null;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  automationTimer.style.display = 'flex';
  automationTimer.innerText = '00:00:00';
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    automationTimer.innerText = formatTime(elapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

if (minBtn) {
  minBtn.addEventListener('click', () => {
    window.api.minimizeWindow();
  });
}

if (maxBtn) {
  maxBtn.addEventListener('click', () => {
    window.api.maximizeWindow();
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    window.api.closeWindow();
  });
}

const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    if (window.api && window.api.restartApp) {
      window.api.restartApp();
    }
  });
}

// Settings Modal Logic
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const settingsModal = document.getElementById('settingsModal');

const settingsBody = document.getElementById('settingsBody');
const scrollIndicator = document.getElementById('scrollIndicator');

function checkScrollIndicator() {
  if (!settingsBody || !scrollIndicator) return;
  const isScrollable = settingsBody.scrollHeight > settingsBody.clientHeight;
  const isAtBottom = Math.abs(settingsBody.scrollHeight - settingsBody.scrollTop - settingsBody.clientHeight) < 10;
  
  if (isScrollable && !isAtBottom) {
    scrollIndicator.classList.add('visible');
  } else {
    scrollIndicator.classList.remove('visible');
    scrollIndicator.classList.remove('bounce');
  }
}

if (settingsBody) {
  settingsBody.addEventListener('scroll', checkScrollIndicator);
}

if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    if (settingsBody) {
      settingsBody.scrollTo({
        top: settingsBody.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
}

if (settingsBtn && settingsModal) {
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    setTimeout(() => {
      checkScrollIndicator();
      if (scrollIndicator && scrollIndicator.classList.contains('visible')) {
        scrollIndicator.classList.add('bounce');
        setTimeout(() => {
           if (scrollIndicator) scrollIndicator.classList.remove('bounce');
        }, 3000);
      }
    }, 50);
  });
}
if (closeSettingsBtn && settingsModal) {
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });
}
if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });
}

const defaultTemplate = `You are an expert cinematic director and AI prompt engineer specializing in Google Veo video generation. Convert the user's concept into a sequence of EXACTLY 18 individual 10-second 16:9 cinematic video prompts that build a cohesive 3-minute (180-second) video.
To avoid low-effort, generic, or glitchy results, EVERY prompt MUST strictly include these 6 elements:
Camera Framing & Motion: Specific lens sizes (e.g., 35mm, 85mm anamorphic), shot types (wide establishing, extreme close-up, low-angle tracking, overhead), and fluid camera movements (dolly-in, whip pan, crane down).
Subject & Physical Dynamics: Precise character/object actions with real-world physics (e.g., rain splashing, smoke rising, tire drift physics). Write the action to fill a continuous 10-second window to allow for post-production trimming and beat-syncing.
Spatial Integrity & Anti-Clipping: Explicitly define the physical distance and separation between moving objects to prevent AI hallucination or "matrix-style" object merging (e.g., explicitly state "a man stands safely on the foreground sidewalk while a car passes in the deep background").
Lighting & Palette: Specific light sources, shadows, and color grading (e.g., volumetric neon glow, golden hour rim lighting, dark moody contrast).
Visual Consistency: Maintain recurring subject attributes, atmospheric depth, and color palettes across all 18 scenes to keep visual continuity.
Native Foley Audio: End every prompt with explicit audio cues starting with "Audio:" describing environmental acoustics, footsteps, engines, or spatial sound effects.
Vary the camera angles and perspectives across consecutive scenes (Wide -> Medium -> Close-up -> Dynamic Tracking) to maintain high visual pacing. Assume a default widescreen 16:9 cinematic aspect ratio unless explicitly stated otherwise.
Concept:
[ Describe what kind of video you want here ]
Format your output EXACTLY as a list of 18 prompts separated by double newlines (one blank line between each prompt).
Provide ONLY the generated prompts. Do not include labels like "Prompt 1", "Scene 1", etc. Do not include any extra information, greetings, formatting, markdown code blocks, or conversational text.`;

const templateEditor = document.getElementById('templateEditor');
const editTemplateBtn = document.getElementById('editTemplateBtn');

let lastSavedCooldown = document.getElementById('pacingInput') ? document.getElementById('pacingInput').value : '10';
let lastSavedTemplate = localStorage.getItem('aiPromptTemplate') || defaultTemplate;

if (templateEditor) {
  templateEditor.value = lastSavedTemplate;
}

let isEditingTemplate = false;
if (editTemplateBtn && templateEditor) {
  editTemplateBtn.addEventListener('click', () => {
    isEditingTemplate = !isEditingTemplate;
    if (isEditingTemplate) {
      editTemplateBtn.style.color = 'var(--primary-color)';
      editTemplateBtn.title = 'Save Template';
      editTemplateBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
      templateEditor.removeAttribute('readonly');
      templateEditor.style.background = 'rgba(0,0,0,0.3)';
      templateEditor.style.border = '1px solid rgba(255,255,255,0.2)';
      templateEditor.style.opacity = '1';
      templateEditor.focus();
    } else {
      editTemplateBtn.style.color = 'var(--text-secondary)';
      editTemplateBtn.title = 'Edit Template';
      editTemplateBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
      templateEditor.setAttribute('readonly', 'true');
      templateEditor.style.background = 'transparent';
      templateEditor.style.border = '1px solid transparent';
      templateEditor.style.opacity = '0.8';

      localStorage.setItem('aiPromptTemplate', templateEditor.value);
      lastSavedTemplate = templateEditor.value;
      appendLog({ type: 'success', message: 'AI Prompt Template saved.' });
    }
  });
}

const promptPathInput = document.getElementById('promptPathInput');
const outputPathInput = document.getElementById('outputPathInput');
const resultPathInput = document.getElementById('resultPathInput');
const framesPathInput = document.getElementById('framesPathInput');

if (window.api && window.api.getPaths) {
  window.api.getPaths().then(paths => {
    if (promptPathInput) promptPathInput.value = paths.promptFile || '';
    if (outputPathInput) outputPathInput.value = paths.outputDir || '';
    if (resultPathInput) resultPathInput.value = paths.resultDir || '';
    if (framesPathInput) framesPathInput.value = paths.framesDir || '';
    const pacingEl = document.getElementById('pacingInput');
    if (pacingEl && paths.cooldown) {
      pacingEl.value = paths.cooldown;
      lastSavedCooldown = String(paths.cooldown);
    }
  });
}

const editPromptFileBtn = document.getElementById('editPromptFileBtn');
if (editPromptFileBtn) {
  editPromptFileBtn.addEventListener('click', () => {
    if (promptPathInput && promptPathInput.value) {
      window.api.openFile(promptPathInput.value);
    }
  });
}

const autoSavePaths = () => {
  if (promptPathInput && outputPathInput && resultPathInput && framesPathInput && window.api && window.api.updatePaths) {
    window.api.updatePaths(promptPathInput.value, outputPathInput.value, resultPathInput.value, framesPathInput.value);
  }
};

if (promptPathInput) promptPathInput.addEventListener('change', autoSavePaths);
if (outputPathInput) outputPathInput.addEventListener('change', autoSavePaths);
if (resultPathInput) resultPathInput.addEventListener('change', autoSavePaths);
if (framesPathInput) framesPathInput.addEventListener('change', autoSavePaths);

const browsePromptBtn = document.getElementById('browsePromptBtn');
if (browsePromptBtn) {
  browsePromptBtn.addEventListener('click', async () => {
    const file = await window.api.selectFile();
    if (file) {
      promptPathInput.value = file;
      autoSavePaths();
    }
  });
}

const browseOutputBtn = document.getElementById('browseOutputBtn');
if (browseOutputBtn) {
  browseOutputBtn.addEventListener('click', async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      outputPathInput.value = folder;
      autoSavePaths();
    }
  });
}

const browseResultBtn = document.getElementById('browseResultBtn');
if (browseResultBtn) {
  browseResultBtn.addEventListener('click', async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      resultPathInput.value = folder;
      autoSavePaths();
    }
  });
}

const browseFramesBtn = document.getElementById('browseFramesBtn');
if (browseFramesBtn) {
  browseFramesBtn.addEventListener('click', async () => {
    const folder = await window.api.selectFolder();
    if (folder) {
      framesPathInput.value = folder;
      autoSavePaths();
    }
  });
}

const useConfigJsonCheckbox = document.getElementById('useConfigJson');
const configOptionsContainer = document.getElementById('configOptionsContainer');
const configConfirm = document.getElementById('configConfirm');
const configAspectRatio = document.getElementById('configAspectRatio');
const configCount = document.getElementById('configCount');
const configModel = document.getElementById('configModel');
const configDuration = document.getElementById('configDuration');

let lastSavedUseConfig = localStorage.getItem('useConfigJson') === 'true';
let lastSavedConfigConfirm = localStorage.getItem('configConfirm') || 'Always';
let lastSavedConfigAspectRatio = localStorage.getItem('configAspectRatio') || '16:9';
let lastSavedConfigCount = localStorage.getItem('configCount') || '1';
let lastSavedConfigModel = localStorage.getItem('configModel') || 'Omni Flash';

function updateTemplateText() {
  if (!templateEditor) return;
  const currentParts = templateEditor.value.split('---\n\n');
  let customText = "";
  if (currentParts.length > 1) {
    customText = currentParts.slice(1).join('---\n\n');
  } else if (templateEditor.value && !templateEditor.value.startsWith('## Technical')) {
    customText = templateEditor.value;
  }

  if (!useConfigJsonCheckbox || !useConfigJsonCheckbox.checked) {
    templateEditor.value = customText;
    return;
  }

  const model = configModel ? configModel.value : 'Omni Flash';
  const durationStr = configDuration ? configDuration.value : '10s';
  const ar = configAspectRatio ? configAspectRatio.value : '16:9';
  const header = '## Technical Parameters\n* Model Selection: ' + model + '\n* Duration: ' + durationStr + '\n* Aspect Ratio: ' + ar + '\n\n---\n\n';
  templateEditor.value = header + customText;
}

function handleModelChange() {
  if (!configModel || !configDuration) return;
  const model = configModel.value;
  const isOmni = model === 'Omni Flash';
  const option10s = Array.from(configDuration.options).find(opt => opt.value === '10s');
  if (isOmni) {
    if (option10s) option10s.style.display = '';
    configDuration.value = '10s';
  } else {
    if (option10s) option10s.style.display = 'none';
    configDuration.value = '8s';
  }
  updateTemplateText();
}

function toggleConfigOptions() {
  if (!useConfigJsonCheckbox || !configOptionsContainer) return;
  configOptionsContainer.style.display = useConfigJsonCheckbox.checked ? 'flex' : 'none';
  updateTemplateText();
}

if (useConfigJsonCheckbox) {
  useConfigJsonCheckbox.checked = lastSavedUseConfig;
  if (configConfirm) configConfirm.value = lastSavedConfigConfirm;
  if (configAspectRatio) configAspectRatio.value = lastSavedConfigAspectRatio;
  if (configCount) configCount.value = lastSavedConfigCount;
  if (configModel) configModel.value = lastSavedConfigModel;

  useConfigJsonCheckbox.addEventListener('change', toggleConfigOptions);
  if (configModel) configModel.addEventListener('change', handleModelChange);
  if (configDuration) configDuration.addEventListener('change', updateTemplateText);
  if (configAspectRatio) configAspectRatio.addEventListener('change', updateTemplateText);

  toggleConfigOptions();
  handleModelChange();
}

const saveSettingsBtn = document.getElementById('saveSettingsBtn');
if (saveSettingsBtn && settingsModal) {
  saveSettingsBtn.addEventListener('click', () => {
    let changes = [];
    const currentCooldown = document.getElementById('pacingInput') ? document.getElementById('pacingInput').value : '10';
    
    if (currentCooldown !== lastSavedCooldown) {
      changes.push(`Cooldown updated to ${currentCooldown}s`);
      lastSavedCooldown = currentCooldown;
      if (window.api && window.api.updateCooldown) {
        window.api.updateCooldown(currentCooldown);
      }
    }
    
    if (templateEditor && templateEditor.value !== lastSavedTemplate) {
      localStorage.setItem('aiPromptTemplate', templateEditor.value);
      changes.push(`AI Prompt Template updated`);
      lastSavedTemplate = templateEditor.value;
    }

    if (document.getElementById('useConfigJson')) {
        const currentUseConfig = document.getElementById('useConfigJson').checked;
        const currentConfigConfirm = document.getElementById('configConfirm').value;
        const currentConfigAspectRatio = document.getElementById('configAspectRatio').value;
        const currentConfigCount = document.getElementById('configCount').value;
        const currentConfigModel = document.getElementById('configModel').value;

        let configChanged = false;
        if (currentUseConfig !== lastSavedUseConfig) {
          localStorage.setItem('useConfigJson', currentUseConfig);
          lastSavedUseConfig = currentUseConfig;
          configChanged = true;
        }
        if (currentConfigConfirm !== lastSavedConfigConfirm) {
          localStorage.setItem('configConfirm', currentConfigConfirm);
          lastSavedConfigConfirm = currentConfigConfirm;
          configChanged = true;
        }
        if (currentConfigAspectRatio !== lastSavedConfigAspectRatio) {
          localStorage.setItem('configAspectRatio', currentConfigAspectRatio);
          lastSavedConfigAspectRatio = currentConfigAspectRatio;
          configChanged = true;
        }
        if (currentConfigCount !== lastSavedConfigCount) {
          localStorage.setItem('configCount', currentConfigCount);
          lastSavedConfigCount = currentConfigCount;
          configChanged = true;
        }
        if (currentConfigModel !== lastSavedConfigModel) {
          localStorage.setItem('configModel', currentConfigModel);
          lastSavedConfigModel = currentConfigModel;
          configChanged = true;
        }
        
        if (configChanged) {
          if (currentUseConfig) {
              changes.push(`Configurations applied (Confirm: ${currentConfigConfirm}, AR: ${currentConfigAspectRatio}, Count: ${currentConfigCount}, Model: ${currentConfigModel})`);
          } else {
              changes.push(`Configurations turned off`);
          }
        }
    }

    if (promptPathInput && outputPathInput && resultPathInput && framesPathInput && window.api && window.api.updatePaths) {
        window.api.getPaths().then(paths => {
           if (paths.promptFile !== promptPathInput.value || 
               paths.outputDir !== outputPathInput.value || 
               paths.resultDir !== resultPathInput.value ||
               paths.framesDir !== framesPathInput.value) {
               
               window.api.updatePaths(promptPathInput.value, outputPathInput.value, resultPathInput.value, framesPathInput.value);
               
               if (paths.promptFile !== promptPathInput.value) changes.push(`Prompt path: ${promptPathInput.value}`);
               if (paths.outputDir !== outputPathInput.value) changes.push(`Output folder: ${outputPathInput.value}`);
               if (paths.resultDir !== resultPathInput.value) changes.push(`Result folder: ${resultPathInput.value}`);
               if (paths.framesDir !== framesPathInput.value) changes.push(`Frames folder: ${framesPathInput.value}`);
               
               settingsModal.classList.remove('active');
               if (changes.length > 0) {
                   appendLog({ type: 'success', message: `Settings saved: ${changes.join(', ')}.` });
               } else {
                   appendLog({ type: 'info', message: 'Settings saved (no changes made).' });
               }
           } else {
               settingsModal.classList.remove('active');
               if (changes.length > 0) {
                   appendLog({ type: 'success', message: `Settings saved: ${changes.join(', ')}.` });
               } else {
                   appendLog({ type: 'info', message: 'Settings saved (no changes made).' });
               }
           }
        });
        return; // Early return because of async logic
    }

  });
}

const copyPromptBtn = document.getElementById('copyPromptBtn');
if (copyPromptBtn) {
  copyPromptBtn.addEventListener('click', () => {
    const textToCopy = templateEditor ? templateEditor.value : defaultTemplate;
    window.api.copyToClipboard(textToCopy);
    
    const originalText = copyPromptBtn.innerText;
    copyPromptBtn.innerText = 'Copied!';
    copyPromptBtn.style.background = 'var(--success-color)';
    copyPromptBtn.style.color = '#fff';
    
    setTimeout(() => {
      copyPromptBtn.innerText = originalText;
      copyPromptBtn.style.background = '';
      copyPromptBtn.style.color = '';
    }, 2000);
  });
}

const copyLogsBtn = document.getElementById('copyLogsBtn');
if (copyLogsBtn) {
  copyLogsBtn.addEventListener('click', () => {
    let logsText = '';
    const logEntries = logContainer.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
      logsText += entry.innerText + '\n';
    });
    
    window.api.copyToClipboard(logsText);
    
    const originalText = copyLogsBtn.innerText;
    copyLogsBtn.innerText = 'Copied!';
    copyLogsBtn.style.background = 'var(--success-color)';
    copyLogsBtn.style.color = '#fff';
    
    setTimeout(() => {
      copyLogsBtn.innerText = originalText;
      copyLogsBtn.style.background = '';
      copyLogsBtn.style.color = '';
    }, 2000);
  });
}

const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    appendLog({ type: 'info', message: 'Triggered Manual Refresh / Resync...' });
    
    const originalText = refreshBtn.innerText;
    refreshBtn.innerText = '⟳ Syncing...';
    refreshBtn.style.opacity = '0.7';
    refreshBtn.disabled = true;
    
    window.api.refreshSync().then(() => {
      refreshBtn.innerText = originalText;
      refreshBtn.style.opacity = '1';
      refreshBtn.disabled = false;
    }).catch(() => {
      refreshBtn.innerText = originalText;
      refreshBtn.style.opacity = '1';
      refreshBtn.disabled = false;
    });
  });
}

function appendLog(log) {
  const div = document.createElement('div');
  div.className = 'log-entry';
  
  const time = new Date().toLocaleTimeString();
  const timeSpan = `<span class="log-timestamp">[${time}]</span>`;
  
  let content = log.message;
  if (log.type === 'error') {
    content = `<span class="log-error">${content}</span>`;
  } else if (log.type === 'success') {
    content = `<span class="log-success">${content}</span>`;
  } else {
    content = `<span class="log-info">${content}</span>`;
  }
  
  div.innerHTML = `${timeSpan} ${content}`;
  logContainer.appendChild(div);
  logContainer.scrollTop = logContainer.scrollHeight;
}

window.api.onLog((log) => {
  appendLog(log);
});

window.api.onCreditsUpdated((credits) => {
  creditsInput.value = credits;
});

window.api.onStatusChange((status) => {
  statusBadge.className = `status-badge ${status.state}`;
  statusBadge.innerText = status.text;
  statusBadge.title = status.text;
  
  if (status.state === 'running') {
    if (!timerInterval) startTimer();
    startBtn.disabled = true;
    loginBtn.disabled = true;
    creditsInput.disabled = true;
  } else if (status.state === 'error') {
    stopTimer();
    startBtn.disabled = false;
    loginBtn.disabled = false;
    creditsInput.disabled = false;
  } else {
    stopTimer();
    startBtn.disabled = false;
    loginBtn.disabled = false;
    creditsInput.disabled = false;
    if (window.api && window.api.getPromptStats) {
      window.api.getPromptStats().then(updatePromptStatsUI);
    }
  }
});


function updatePromptStatsUI(data) {
  if (!data) return;
  const total = typeof data.total === 'number' ? data.total : 0;
  const completed = typeof data.completed === 'number' ? data.completed : 0;
  const remaining = typeof data.remaining === 'number' ? data.remaining : Math.max(0, total - completed);
  const current = data.current || 0;

  if (statTotalPrompts) {
    statTotalPrompts.innerText = total;
  }

  if (statRemainingPrompts) {
    statRemainingPrompts.innerText = remaining;
  }

  if (statCurrentPrompt) {
    if (data.status === 'running' && current > 0) {
      statCurrentPrompt.innerText = '#' + current + ' of ' + total;
      statCurrentPrompt.style.color = 'var(--accent-color)';
    } else if (total > 0 && completed === total) {
      statCurrentPrompt.innerText = 'Completed';
      statCurrentPrompt.style.color = 'var(--success-color)';
    } else {
      statCurrentPrompt.innerText = '—';
      statCurrentPrompt.style.color = 'var(--text-primary)';
    }
  }

  if (promptProgressBar) {
    const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    promptProgressBar.style.width = percent + '%';
    promptProgressBar.title = completed + ' / ' + total + ' completed (' + percent + '%)';
  }
}

if (window.api && window.api.onPromptStatsUpdated) {
  window.api.onPromptStatsUpdated((data) => {
    updatePromptStatsUI(data);
  });
}

if (window.api && window.api.getPromptStats) {
  window.api.getPromptStats().then(stats => {
    updatePromptStatsUI(stats);
  });
}

window.api.onPromptLoaded((prompt) => {
  promptDisplay.innerText = prompt || 'No prompt found in prompt.txt';
  if (window.api && window.api.getPromptStats) {
    window.api.getPromptStats().then(updatePromptStatsUI);
  }
});

startBtn.addEventListener('click', () => {
  const credits = parseInt(creditsInput.value, 10) || 0;
  const cooldownInput = document.getElementById('pacingInput');
  const cooldown = cooldownInput ? parseInt(cooldownInput.value, 10) || 10 : 10;
  
  const useConfigJsonCheckbox = document.getElementById('useConfigJson');
  let configOptions = null;
  if (useConfigJsonCheckbox && useConfigJsonCheckbox.checked) {
     configOptions = {
        confirmBeforeGenerating: document.getElementById('configConfirm').value,
        aspectRatio: document.getElementById('configAspectRatio').value,
        count: document.getElementById('configCount').value,
        model: document.getElementById('configModel').value
     };
  }
  
  window.api.startAutomation(credits, cooldown, configOptions);
});

loginBtn.addEventListener('click', () => {
  window.api.openLogin();
});

const userEmailDisplay = document.getElementById('userEmailDisplay');
const homeAccountDisplay = document.getElementById('homeAccountDisplay');
const accountSelect = document.getElementById('accountSelect');
const syncAccountBtn = document.getElementById('syncAccountBtn');
const addAccountBtn = document.getElementById('addAccountBtn');
const accountStatusDetail = document.getElementById('accountStatusDetail');
const autoSwitchAccountsCheckbox = document.getElementById('autoSwitchAccountsCheckbox');

function updateAccountSelectUI(accounts, activeAccount, autoSwitchOnLowCredits) {
  if (!accountSelect) return;
  accountSelect.innerHTML = '';
  
  if (autoSwitchAccountsCheckbox && typeof autoSwitchOnLowCredits === 'boolean') {
    autoSwitchAccountsCheckbox.checked = autoSwitchOnLowCredits;
  }

  if (!accounts || accounts.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.innerText = activeAccount ? `${activeAccount} (Default)` : 'No accounts detected (click + Add Account)';
    accountSelect.appendChild(opt);
    return;
  }

  accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.email;
    let label = acc.email;
    if (acc.credits !== null && acc.credits !== undefined) {
      label += ` (${acc.credits} credits - ${acc.plan || 'Normal'})`;
    } else if (acc.plan) {
      label += ` (${acc.plan})`;
    }
    opt.innerText = label;
    if (activeAccount && acc.email.toLowerCase() === activeAccount.toLowerCase()) {
      opt.selected = true;
    }
    accountSelect.appendChild(opt);
  });
}

function updateHomeAccountDisplay(activeEmail, plan, credits) {
  if (!homeAccountDisplay) return;
  if (!activeEmail || activeEmail === 'Not detected (click Refresh)') {
    homeAccountDisplay.innerText = activeEmail || 'Not logged in';
    homeAccountDisplay.style.color = 'var(--error-color)';
    return;
  }
  const planStr = plan && plan !== 'Normal' ? plan : 'Google Flow';
  const credStr = (credits !== null && credits !== undefined) ? ` • ${credits} credits` : '';
  homeAccountDisplay.innerHTML = `Active: <strong style="color: var(--text-primary);">${activeEmail}</strong> <span style="color: var(--success-color);">(${planStr}${credStr})</span>`;
  homeAccountDisplay.style.color = 'var(--text-secondary)';
}

if (accountSelect) {
  accountSelect.addEventListener('change', async () => {
    const selectedEmail = accountSelect.value;
    if (!selectedEmail) return;
    
    if (accountStatusDetail) {
      accountStatusDetail.innerText = `Switching to ${selectedEmail} & auto-syncing credits...`;
      accountStatusDetail.style.color = 'var(--accent-color)';
    }
    if (homeAccountDisplay) {
      homeAccountDisplay.innerText = `Switching to ${selectedEmail}...`;
    }
    
    try {
      const res = await window.api.switchAccount(selectedEmail);
      if (res && res.credits !== null && res.credits !== undefined) {
        if (creditsInput) creditsInput.value = res.credits;
        if (accountStatusDetail) {
          accountStatusDetail.innerText = `Switched & synced: ${res.credits} credits (${res.plan || 'Normal'}).`;
          accountStatusDetail.style.color = 'var(--success-color)';
        }
        updateHomeAccountDisplay(selectedEmail, res.plan, res.credits);
      } else {
        if (accountStatusDetail) {
          accountStatusDetail.innerText = `Switched to ${selectedEmail}. Syncing in background...`;
          accountStatusDetail.style.color = 'var(--text-secondary)';
        }
      }
    } catch (err) {
      if (accountStatusDetail) {
        accountStatusDetail.innerText = `Failed to switch account: ${err.message}`;
        accountStatusDetail.style.color = 'var(--error-color)';
      }
    }
  });
}

if (syncAccountBtn) {
  syncAccountBtn.addEventListener('click', async () => {
    const currentEmail = accountSelect ? accountSelect.value : null;
    const originalText = syncAccountBtn.innerText;
    syncAccountBtn.innerText = '⟳ Syncing...';
    syncAccountBtn.disabled = true;
    
    if (accountStatusDetail) {
      accountStatusDetail.innerText = `Syncing live credits for ${currentEmail || 'selected account'}...`;
      accountStatusDetail.style.color = 'var(--accent-color)';
    }
    
    try {
      const credits = await window.api.syncAccount(currentEmail);
      if (credits !== null && credits !== undefined) {
        if (creditsInput) creditsInput.value = credits;
        if (accountStatusDetail) {
          accountStatusDetail.innerText = `Sync complete: ${credits} credits available.`;
          accountStatusDetail.style.color = 'var(--success-color)';
        }
      } else {
        if (accountStatusDetail) {
          accountStatusDetail.innerText = `Sync finished. See logs for details.`;
          accountStatusDetail.style.color = 'var(--text-secondary)';
        }
      }
    } catch (err) {
      if (accountStatusDetail) {
        accountStatusDetail.innerText = `Sync failed: ${err.message}`;
        accountStatusDetail.style.color = 'var(--error-color)';
      }
    } finally {
      syncAccountBtn.innerText = originalText;
      syncAccountBtn.disabled = false;
    }
  });
}

if (addAccountBtn) {
  addAccountBtn.addEventListener('click', async () => {
    if (accountStatusDetail) {
      accountStatusDetail.innerText = 'Opening browser to sign in to another Google account...';
      accountStatusDetail.style.color = 'var(--accent-color)';
    }
    await window.api.addAccount();
  });
}

if (autoSwitchAccountsCheckbox) {
  autoSwitchAccountsCheckbox.addEventListener('change', () => {
    const enabled = autoSwitchAccountsCheckbox.checked;
    window.api.toggleAutoSwitch(enabled);
  });
}

if (window.api && window.api.onAccountsUpdated) {
  window.api.onAccountsUpdated((data) => {
    if (data) {
      updateAccountSelectUI(data.accounts, data.activeAccount, data.autoSwitchOnLowCredits);
      const activeObj = (data.accounts || []).find(a => a.email.toLowerCase() === (data.activeAccount || '').toLowerCase());
      if (activeObj) {
        updateHomeAccountDisplay(activeObj.email, activeObj.plan, activeObj.credits);
      }
    }
  });
}

if (window.api.onUserEmail) {
  window.api.onUserEmail((email) => {
    const isError = !email || email === 'Not detected (click Refresh)';
    const displayTxt = isError ? (email || 'Not logged in') : email;
    
    if (userEmailDisplay) {
      userEmailDisplay.innerText = displayTxt;
      userEmailDisplay.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';
    }
    if (homeAccountDisplay && (!accountSelect || !accountSelect.value)) {
      homeAccountDisplay.innerText = displayTxt;
      homeAccountDisplay.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';
    }
  });
}

// Fetch initial accounts and credits on load
if (window.api && window.api.getAccounts) {
  window.api.getAccounts().then(data => {
    if (data) {
      updateAccountSelectUI(data.accounts, data.activeAccount, data.autoSwitchOnLowCredits);
      const activeObj = (data.accounts || []).find(a => a.email.toLowerCase() === (data.activeAccount || '').toLowerCase());
      if (activeObj) {
        updateHomeAccountDisplay(activeObj.email, activeObj.plan, activeObj.credits);
      }
    }
  });
}

creditsInput.value = 'Syncing...';
if (homeAccountDisplay) homeAccountDisplay.innerText = 'Syncing...';

window.api.fetchCreditsOnLoad().then(credits => {
  if (credits !== null && credits !== undefined) {
    creditsInput.value = credits;
  } else {
    creditsInput.value = '0'; // fallback
    if (userEmailDisplay) {
       userEmailDisplay.innerText = 'Not detected (click Refresh)';
       userEmailDisplay.style.color = 'var(--error-color)';
    }
    if (homeAccountDisplay) {
       homeAccountDisplay.innerText = 'Not detected (click Refresh)';
       homeAccountDisplay.style.color = 'var(--error-color)';
    }
  }
});

