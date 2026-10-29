// NexusFlow & Antigravity Master Suite — Client App
let logEntries = [];
let activeFilter = 'ALL';
let autoScroll = true;

const terminalBody = document.getElementById('terminal-logs-body');
const logCountVal = document.getElementById('log-count-val');
const accountListContainer = document.getElementById('account-list-container');
const chkAutoscroll = document.getElementById('chk-autoscroll');
const streamStatus = document.getElementById('stream-status');

// Header elements
const uploaderTargetVal = document.getElementById('uploader-target-val');
const backupTargetVal = document.getElementById('backup-target-val');
const activeAccountVal = document.getElementById('active-account-val');
const activeCreditsVal = document.getElementById('active-credits-val');
const pipelineStageTag = document.getElementById('pipeline-stage-tag');

// Stat elements
const statPromptsCount = document.getElementById('stat-prompts-count');
const statOutputCount = document.getElementById('stat-output-count');
const statResultCount = document.getElementById('stat-result-count');
const statQueueCount = document.getElementById('stat-queue-count');

// Buttons
const btnRunFull = document.getElementById('btn-run-full');
const btnAutoShift = document.getElementById('btn-auto-shift');
const btnGenPrompts = document.getElementById('btn-gen-prompts');
const btnMergeClips = document.getElementById('btn-merge-clips');
const btnQueueUpload = document.getElementById('btn-queue-upload');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Connect Server-Sent Events (SSE) Stream
function initLogStream() {
  const evtSource = new EventSource('/api/logs/stream');

  evtSource.onopen = () => {
    streamStatus.textContent = '● Live Stream Connected (SSE)';
    streamStatus.style.color = 'var(--emerald-accent)';
  };

  evtSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'snapshot' && Array.isArray(data.logs)) {
        logEntries = data.logs;
        renderLogs();
      } else if (data.id && data.level) {
        logEntries.push(data);
        appendLogEntry(data);
      }
      updateLogCount();
    } catch (e) {
      console.error('Error parsing SSE data', e);
    }
  };

  evtSource.onerror = () => {
    streamStatus.textContent = '○ Reconnecting to Stream...';
    streamStatus.style.color = 'var(--amber-accent)';
  };
}

function appendLogEntry(entry) {
  if (activeFilter !== 'ALL' && entry.level !== activeFilter) {
    return;
  }

  const row = document.createElement('div');
  row.className = `log-entry log-${entry.level}`;
  row.innerHTML = `
    <span class="log-time">[${entry.timeFormatted || entry.timestamp.split('T')[1].split('.')[0]}]</span>
    <span class="log-level">[${entry.level}]</span>
    <span class="log-sub">[${entry.subsystem}]</span>
    <span class="log-msg">${escapeHtml(entry.message)}</span>
  `;

  terminalBody.appendChild(row);

  if (autoScroll) {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
}

function renderLogs() {
  terminalBody.innerHTML = '';
  const filtered = activeFilter === 'ALL'
    ? logEntries
    : logEntries.filter(e => e.level === activeFilter);

  filtered.forEach(entry => {
    const row = document.createElement('div');
    row.className = `log-entry log-${entry.level}`;
    row.innerHTML = `
      <span class="log-time">[${entry.timeFormatted || entry.timestamp.split('T')[1].split('.')[0]}]</span>
      <span class="log-level">[${entry.level}]</span>
      <span class="log-sub">[${entry.subsystem}]</span>
      <span class="log-msg">${escapeHtml(entry.message)}</span>
    `;
    terminalBody.appendChild(row);
  });

  if (autoScroll) {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
  updateLogCount();
}

function updateLogCount() {
  logCountVal.textContent = `${logEntries.length} entries`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Fetch Full System State
async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.success) {
      updateUI(data);
    }
  } catch (e) {
    console.error('Fetch status failed', e);
  }
}

function updateUI(data) {
  const p = data.pipeline;
  const a = data.accounts;

  // Header badges
  uploaderTargetVal.textContent = a.uploaderAccount;
  backupTargetVal.textContent = a.backupStatusAccount;
  activeAccountVal.textContent = a.activeAccount;
  activeCreditsVal.textContent = a.activeCredits !== null ? `${a.activeCredits} Credits` : 'Unsynced';
  if (a.activeCredits !== null && a.activeCredits < a.threshold) {
    activeCreditsVal.style.background = 'var(--rose-accent)';
  } else {
    activeCreditsVal.style.background = 'var(--cyan-accent)';
  }

  // Pipeline stage tag
  pipelineStageTag.textContent = p.currentStage.toUpperCase();

  // Inventory stats
  statPromptsCount.textContent = p.prompts ? p.prompts.totalScenes : 0;
  statOutputCount.textContent = p.outputClipsCount;
  statResultCount.textContent = p.resultVideosCount;
  statQueueCount.textContent = p.queueCount;

  // Accounts List
  renderAccounts(a.accounts, a.activeAccount, a.threshold);
}

function renderAccounts(accounts, activeEmail, threshold) {
  accountListContainer.innerHTML = '';

  accounts.forEach(acc => {
    const isActive = acc.email.toLowerCase() === activeEmail.toLowerCase();
    const isLow = acc.credits !== null && acc.credits < threshold;

    const item = document.createElement('div');
    item.className = `account-item ${isActive ? 'active' : ''} ${isLow ? 'low-credits' : ''}`;

    let roleTag = '';
    if (acc.isUploaderTarget) {
      roleTag = '<span style="color:var(--rose-accent);font-weight:700;">[CH-UPLOAD]</span>';
    } else if (acc.isBackupStatusTarget) {
      roleTag = '<span style="color:var(--amber-accent);font-weight:700;">[BACKUP]</span>';
    }

    const creditsDisplay = acc.credits !== null
      ? `<span class="acc-credits ${isLow ? 'low' : ''}">${acc.credits} cr</span>`
      : `<span class="acc-credits" style="color:#64748b;background:rgba(255,255,255,0.05);">Fresh</span>`;

    item.innerHTML = `
      <div class="account-info">
        <div class="acc-email">${acc.email} ${roleTag}</div>
        <div class="acc-meta">
          <span class="acc-plan-badge">${acc.plan || 'Normal'}</span>
          <span>${acc.role}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${creditsDisplay}
        <div class="acc-actions">
          ${!isActive ? `<button onclick="switchAccount('${acc.email}')">Use</button>` : `<span style="font-size:0.7rem;color:var(--cyan-accent);font-weight:700;">ACTIVE</span>`}
        </div>
      </div>
    `;

    accountListContainer.appendChild(item);
  });
}

async function switchAccount(email) {
  try {
    const res = await fetch('/api/accounts/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      fetchStatus();
    }
  } catch (e) {
    console.error('Account switch failed', e);
  }
}

// Action Button Handlers
btnRunFull.addEventListener('click', async () => {
  btnRunFull.disabled = true;
  btnRunFull.style.opacity = '0.5';
  try {
    await fetch('/api/pipeline/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'alexandria' })
    });
  } finally {
    setTimeout(() => {
      btnRunFull.disabled = false;
      btnRunFull.style.opacity = '1';
    }, 2000);
  }
});

btnAutoShift.addEventListener('click', async () => {
  await fetch('/api/accounts/auto-shift', { method: 'POST' });
  fetchStatus();
});

btnGenPrompts.addEventListener('click', async () => {
  await fetch('/api/pipeline/generate-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: 'alexandria' })
  });
  fetchStatus();
});

btnMergeClips.addEventListener('click', async () => {
  await fetch('/api/pipeline/merge', { method: 'POST' });
  fetchStatus();
});

btnQueueUpload.addEventListener('click', async () => {
  await fetch('/api/pipeline/queue-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  fetchStatus();
});

btnClearLogs.addEventListener('click', () => {
  terminalBody.innerHTML = '';
});

chkAutoscroll.addEventListener('change', (e) => {
  autoScroll = e.target.checked;
});

// Filter Bar
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.level;
    renderLogs();
  });
});

// Initialization
initLogStream();
fetchStatus();
setInterval(fetchStatus, 3000);
