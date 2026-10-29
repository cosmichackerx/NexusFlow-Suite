// State
let currentSelectedVideoPath = null;
let currentProbeData = null;
let currentSettings = null;

// DOM Elements
const channelBadge = document.getElementById('channelBadge');
const channelNameText = document.getElementById('channelNameText');
const authStatusTitle = document.getElementById('authStatusTitle');
const authStatusSubtitle = document.getElementById('authStatusSubtitle');
const statusBadge = document.getElementById('statusBadge');
const refreshBtn = document.getElementById('refreshBtn');
const restartBtn = document.getElementById('restartBtn');
const settingsBtn = document.getElementById('settingsBtn');
const loginBtn = document.getElementById('loginBtn');

// Video Drop & Form
const dropZone = document.getElementById('dropZone');
const selectedFilename = document.getElementById('selectedFilename');
const probeCard = document.getElementById('probeCard');
const shortsPill = document.getElementById('shortsPill');
const probeDuration = document.getElementById('probeDuration');
const probeRes = document.getElementById('probeRes');
const probeRatio = document.getElementById('probeRatio');
const probeSize = document.getElementById('probeSize');

const videoTitle = document.getElementById('videoTitle');
const videoDesc = document.getElementById('videoDesc');
const videoTags = document.getElementById('videoTags');
const videoVisibility = document.getElementById('videoVisibility');
const titleCounter = document.getElementById('titleCounter');
const descCounter = document.getElementById('descCounter');
const uploadSingleBtn = document.getElementById('uploadSingleBtn');
const addToQueueBtn = document.getElementById('addToQueueBtn');

// Tabs & Lists
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const queueBadgeCount = document.getElementById('queueBadgeCount');
const historyBadgeCount = document.getElementById('historyBadgeCount');
const queueList = document.getElementById('queueList');
const historyList = document.getElementById('historyList');
const logContainer = document.getElementById('logContainer');
const copyLogsBtn = document.getElementById('copyLogsBtn');

// Queue Controls
const scanNexusBtn = document.getElementById('scanNexusBtn');
const autoQueueNexusBtn = document.getElementById('autoQueueNexusBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const startQueueBtn = document.getElementById('startQueueBtn');
const stopQueueBtn = document.getElementById('stopQueueBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const queueProgressContainer = document.getElementById('queueProgressContainer');
const queueProgressBar = document.getElementById('queueProgressBar');

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingVisibility = document.getElementById('settingVisibility');
const settingDelay = document.getElementById('settingDelay');
const settingDefaultTags = document.getElementById('settingDefaultTags');
const settingAutoShorts = document.getElementById('settingAutoShorts');
const settingAddShortsTag = document.getElementById('settingAddShortsTag');
const settingOutputDir = document.getElementById('settingOutputDir');
const settingResultDir = document.getElementById('settingResultDir');
const browseOutputBtn = document.getElementById('browseOutputBtn');
const browseResultBtn = document.getElementById('browseResultBtn');

// Window Controls
document.getElementById('minBtn').addEventListener('click', () => window.api.minimizeWindow());
document.getElementById('maxBtn').addEventListener('click', () => window.api.maximizeWindow());
document.getElementById('closeBtn').addEventListener('click', () => window.api.closeWindow());
restartBtn.addEventListener('click', () => window.api.restartApp());

// Helper: Append Log
function appendLog(entry) {
  const div = document.createElement('div');
  div.className = 'log-entry';
  const time = new Date(entry.timestamp).toLocaleTimeString();
  div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${entry.type}">[${entry.type.toUpperCase()}]</span> <span>${escapeHtml(entry.message)}</span>`;
  logContainer.appendChild(div);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Character Counters
videoTitle.addEventListener('input', () => {
  titleCounter.textContent = `${videoTitle.value.length} / 100`;
});
videoDesc.addEventListener('input', () => {
  descCounter.textContent = `${videoDesc.value.length} / 5000`;
});

// Tab Switcher
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add('active');
    copyLogsBtn.style.display = btn.dataset.tab === 'logsTab' ? 'block' : 'none';
  });
});

// File Selection & Probing
dropZone.addEventListener('click', async () => {
  const filePath = await window.api.selectVideoFile();
  if (filePath) handleVideoSelected(filePath);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.path) handleVideoSelected(file.path);
  }
});

async function handleVideoSelected(filePath) {
  currentSelectedVideoPath = filePath;
  selectedFilename.textContent = filePath;
  selectedFilename.style.color = 'var(--text-primary)';

  const res = await window.api.probeVideo(filePath);
  if (res && res.probe) {
    currentProbeData = res.probe;
    probeCard.style.display = 'block';
    probeDuration.textContent = res.probe.formattedDuration;
    probeRes.textContent = `${res.probe.width}x${res.probe.height}`;
    probeRatio.textContent = res.probe.aspectRatio;
    probeSize.textContent = `${res.probe.sizeMB} MB`;

    if (res.probe.isShort) {
      shortsPill.style.display = 'inline-block';
      shortsPill.textContent = '⚡ YouTube Shorts';
      shortsPill.className = 'shorts-pill';
    } else {
      shortsPill.style.display = 'inline-block';
      shortsPill.textContent = 'Standard Video';
      shortsPill.className = 'status-badge idle';
    }

    if (res.meta) {
      videoTitle.value = res.meta.title;
      videoDesc.value = res.meta.description;
      videoTags.value = res.meta.tags.join(', ');
      videoVisibility.value = res.meta.visibility;
      titleCounter.textContent = `${videoTitle.value.length} / 100`;
      descCounter.textContent = `${videoDesc.value.length} / 5000`;
    }
  }
}

// Single Upload Button
uploadSingleBtn.addEventListener('click', async () => {
  if (!currentSelectedVideoPath) {
    alert('Please select a video file first.');
    return;
  }
  uploadSingleBtn.disabled = true;
  uploadSingleBtn.textContent = 'Uploading...';

  try {
    const res = await window.api.uploadSingle({
      videoPath: currentSelectedVideoPath,
      title: videoTitle.value,
      description: videoDesc.value,
      tags: videoTags.value.split(',').map(t => t.trim()).filter(Boolean),
      visibility: videoVisibility.value
    });

    if (res.success) {
      alert(`Upload complete! Video URL: ${res.result.url}`);
    } else {
      alert(`Upload failed: ${res.error}`);
    }
  } catch (err) {
    alert(`Upload error: ${err.message}`);
  } finally {
    uploadSingleBtn.disabled = false;
    uploadSingleBtn.textContent = 'Upload Video Directly';
    refreshAll();
  }
});

// Add To Queue Button
addToQueueBtn.addEventListener('click', async () => {
  if (!currentSelectedVideoPath) {
    alert('Please select a video file first.');
    return;
  }
  await window.api.addToQueue({
    videoPath: currentSelectedVideoPath,
    title: videoTitle.value,
    description: videoDesc.value,
    tags: videoTags.value.split(',').map(t => t.trim()).filter(Boolean),
    visibility: videoVisibility.value,
    probeData: currentProbeData
  });
  renderQueue();
});

// Queue Toolbar
scanNexusBtn.addEventListener('click', async () => {
  scanNexusBtn.disabled = true;
  scanNexusBtn.textContent = 'Scanning...';
  const scan = await window.api.scanNexusFlow();
  scanNexusBtn.disabled = false;
  scanNexusBtn.textContent = '🔍 Scan NexusFlow';
  alert(`NexusFlow Scan:\nFound: ${scan.totalFound} videos\nReady to Queue: ${scan.readyToQueue.length}\nAlready Queued: ${scan.currentlyQueued.length}\nUploaded: ${scan.alreadyUploaded.length}`);
});

autoQueueNexusBtn.addEventListener('click', async () => {
  autoQueueNexusBtn.disabled = true;
  autoQueueNexusBtn.textContent = 'Queueing...';
  const res = await window.api.queueNexusFlow();
  autoQueueNexusBtn.disabled = false;
  autoQueueNexusBtn.textContent = '+ Queue NexusFlow';
  alert(`Queued ${res.queuedCount} videos from NexusFlow!`);
  renderQueue();
});

clearQueueBtn.addEventListener('click', async () => {
  if (confirm('Clear all items from upload queue?')) {
    await window.api.clearQueue('all');
    renderQueue();
  }
});

startQueueBtn.addEventListener('click', async () => {
  startQueueBtn.style.display = 'none';
  stopQueueBtn.style.display = 'inline-block';
  queueProgressContainer.style.display = 'block';
  await window.api.startQueue();
});

stopQueueBtn.addEventListener('click', async () => {
  await window.api.stopUpload();
  stopQueueBtn.style.display = 'none';
  startQueueBtn.style.display = 'inline-block';
});

clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Clear upload history?')) {
    await window.api.clearHistory();
    renderHistory();
  }
});

// Render Queue List
async function renderQueue() {
  const queue = await window.api.getQueue();
  queueBadgeCount.textContent = queue.length;

  if (!queue || queue.length === 0) {
    queueList.innerHTML = '<div class="empty-state">No videos in queue. Click "Queue NexusFlow" or add a video on the left.</div>';
    return;
  }

  queueList.innerHTML = '';
  queue.forEach(item => {
    const card = document.createElement('div');
    card.className = 'queue-card';
    card.innerHTML = `
      <div class="queue-card-left">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="card-title">${escapeHtml(item.title)}</span>
          ${item.isShort ? '<span class="shorts-pill" style="font-size: 9px; padding: 1px 5px;">Shorts</span>' : ''}
        </div>
        <div class="card-sub">${item.formattedDuration || '00:00'} • ${item.visibility.toUpperCase()} • ${escapeHtml(item.filename)}</div>
        ${item.url ? `<a href="${item.url}" class="history-url" target="_blank">${item.url}</a>` : ''}
        ${item.error ? `<span style="color: var(--error-color); font-size: 11px;">${escapeHtml(item.error)}</span>` : ''}
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="queue-status-tag ${item.status}">${item.status}</span>
        <button class="win-btn close-btn" style="font-size: 12px; width: 24px; height: 24px;" title="Remove from Queue" onclick="removeQueueItem('${item.id}')">✕</button>
      </div>
    `;
    queueList.appendChild(card);
  });
}

window.removeQueueItem = async function(id) {
  await window.api.removeFromQueue(id);
  renderQueue();
};

// Render History List
async function renderHistory() {
  const history = await window.api.getHistory();
  historyBadgeCount.textContent = history.length;

  if (!history || history.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No upload history yet.</div>';
    return;
  }

  historyList.innerHTML = '';
  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const date = new Date(item.uploadedAt).toLocaleString();
    card.innerHTML = `
      <div class="queue-card-left">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="card-title">${escapeHtml(item.title || item.filename)}</span>
          ${item.isShort ? '<span class="shorts-pill" style="font-size: 9px; padding: 1px 5px;">Shorts</span>' : ''}
        </div>
        <div class="card-sub">${date} • ${item.visibility ? item.visibility.toUpperCase() : ''}</div>
        ${item.url ? `<a href="#" class="history-url" onclick="window.api.openExternal('${item.url}'); return false;">${item.url}</a>` : ''}
        ${item.error ? `<span style="color: var(--error-color); font-size: 11px;">Error: ${escapeHtml(item.error)}</span>` : ''}
      </div>
      <div>
        <span class="queue-status-tag ${item.success ? 'completed' : 'failed'}">${item.success ? 'Published' : 'Failed'}</span>
      </div>
    `;
    historyList.appendChild(card);
  });
}

// Copy Logs
copyLogsBtn.addEventListener('click', async () => {
  const logs = await window.api.getLogs(500);
  const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
  await window.api.copyToClipboard(text);
  copyLogsBtn.textContent = 'Copied!';
  setTimeout(() => { copyLogsBtn.textContent = 'Copy Logs'; }, 1500);
});

// YouTube Studio Auth
loginBtn.addEventListener('click', async () => {
  loginBtn.disabled = true;
  loginBtn.textContent = 'Opening Browser...';
  await window.api.openLogin();
  loginBtn.disabled = false;
  loginBtn.textContent = 'Studio Login';
  refreshAuth();
});

async function refreshAuth() {
  const auth = await window.api.checkAuth(true);
  updateAuthUI(auth);
}

function updateAuthUI(auth) {
  const dot = channelBadge.querySelector('.auth-dot');
  if (auth && auth.loggedIn) {
    dot.className = 'auth-dot auth';
    channelNameText.textContent = auth.channelName || 'YouTube Studio';
    authStatusTitle.textContent = auth.channelName || 'Channel Active';
    authStatusSubtitle.textContent = auth.channelHandle ? `${auth.channelHandle} (Ready to Publish)` : 'Ready to Publish';
    loginBtn.textContent = 'Switch/Re-login';
  } else {
    dot.className = 'auth-dot not-auth';
    channelNameText.textContent = 'Not Logged In';
    authStatusTitle.textContent = 'YouTube Studio Session';
    authStatusSubtitle.textContent = 'Sign in to publish videos';
    loginBtn.textContent = 'Studio Login';
  }
}

// Settings Modal
settingsBtn.addEventListener('click', async () => {
  const data = await window.api.getSettings();
  currentSettings = data.settings;
  settingVisibility.value = currentSettings.defaultVisibility || 'public';
  settingDelay.value = currentSettings.uploadDelaySec || 15;
  settingDefaultTags.value = (currentSettings.defaultTags || []).join(', ');
  settingAutoShorts.checked = currentSettings.autoShortsDetection !== false;
  settingAddShortsTag.checked = currentSettings.addShortsTag !== false;
  settingOutputDir.value = data.paths.NEXUSFLOW_OUTPUT_DIR || '';
  settingResultDir.value = data.paths.NEXUSFLOW_RESULT_DIR || '';
  settingsModal.classList.add('active');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

browseOutputBtn.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) settingOutputDir.value = folder;
});

browseResultBtn.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) settingResultDir.value = folder;
});

saveSettingsBtn.addEventListener('click', async () => {
  const updated = {
    defaultVisibility: settingVisibility.value,
    uploadDelaySec: parseInt(settingDelay.value, 10) || 15,
    defaultTags: settingDefaultTags.value.split(',').map(t => t.trim()).filter(Boolean),
    autoShortsDetection: settingAutoShorts.checked,
    addShortsTag: settingAddShortsTag.checked,
    nexusflowOutputDir: settingOutputDir.value,
    nexusflowResultDir: settingResultDir.value
  };
  await window.api.saveSettings(updated);
  settingsModal.classList.remove('active');
  alert('Settings saved successfully!');
});

// Refresh button
refreshBtn.addEventListener('click', () => {
  refreshAll();
});

async function refreshAll() {
  refreshAuth();
  renderQueue();
  renderHistory();
  const logs = await window.api.getLogs(50);
  logContainer.innerHTML = '';
  logs.forEach(appendLog);
}

// IPC Subscriptions
window.api.onLog(appendLog);
window.api.onStatusChange((status) => {
  statusBadge.className = `status-badge ${status.state}`;
  statusBadge.textContent = status.text;
});
window.api.onQueueUpdated(() => renderQueue());
window.api.onHistoryUpdated(() => renderHistory());
window.api.onAuthUpdated(updateAuthUI);

// Initial Load
refreshAll();
