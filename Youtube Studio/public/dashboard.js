document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const targetView = document.getElementById(`view-${targetTab}`);
      if (targetView) targetView.classList.add('active');
    });
  });

  // Fetch Studio State
  async function loadStudioData() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to load state');
      const data = await res.json();
      renderDashboard(data);
    } catch (err) {
      console.warn('Using client fallback data', err);
    }
  }

  function renderDashboard(data) {
    if (!data) return;

    // Overview Stats
    const overview = data.analyticsOverview || {};
    document.getElementById('val-subscribers').innerText = overview.currentSubscribers || '6';
    document.getElementById('val-views').innerText = Number(overview.views28d || 3200).toLocaleString();
    document.getElementById('val-watchtime').innerText = `${overview.watchTimeHours28d || '13.7'} hrs`;

    // Latest Short
    const latest = data.latestShortPerformance || {};
    if (latest.title) {
      document.getElementById('latest-short-title').innerText = latest.title;
      document.getElementById('latest-short-time').innerText = latest.timeSincePublish || 'Recent';
      document.getElementById('latest-short-rank').innerText = latest.rankingByViews || '6 of 10';
      document.getElementById('latest-short-views').innerText = latest.views || 31;
      document.getElementById('latest-short-apv').innerText = `${latest.averagePercentageViewed || 50.6}%`;
      document.getElementById('latest-short-likes').innerText = latest.likes || 0;
      if (latest.performanceVerdict) {
        document.getElementById('latest-short-verdict').innerText = latest.performanceVerdict;
      }
    }

    // Top Content List
    const topListEl = document.getElementById('top-content-list');
    if (topListEl && data.topContent48Hours) {
      topListEl.innerHTML = data.topContent48Hours.map(item => `
        <div class="top-item">
          <div>
            <div class="top-item-title">${item.title}</div>
            <div class="top-item-sub">${item.status || 'Active'} • ${item.likes || 0} likes</div>
          </div>
          <div class="top-item-stats">
            <div class="top-item-views">+${item.views48h}</div>
            <div class="top-item-sub">views (48h)</div>
          </div>
        </div>
      `).join('');
    }

    // Published Videos Table
    const tableBody = document.getElementById('videos-table-body');
    if (tableBody && data.publishedVideos) {
      tableBody.innerHTML = data.publishedVideos.map(video => `
        <tr>
          <td><strong>${video.title}</strong></td>
          <td><span class="pill-type">${video.type || 'Short'}</span></td>
          <td>${new Date(video.publishedAt).toLocaleDateString()}</td>
          <td>${Number(video.views).toLocaleString()}</td>
          <td>${video.likes}</td>
          <td>${video.comments}</td>
          <td><span class="pill-apv">${video.apv ? video.apv + '%' : '—'}</span></td>
          <td><span class="stat-badge positive">${video.visibility}</span></td>
          <td>
            <button class="btn btn-small" onclick="handleEdit('${video.id}')">Manage</button>
          </td>
        </tr>
      `).join('');
    }

    // YPP Progress
    const ypp = data.monetizationProgress || {};
    if (ypp.subscribersCurrent !== undefined) {
      document.getElementById('ypp-subs-label').innerText = `${ypp.subscribersCurrent} / ${ypp.subscribersRequired} (${ypp.subscribersPercent}%)`;
      document.getElementById('ypp-subs-bar').style.width = `${Math.min(100, ypp.subscribersPercent)}%`;

      document.getElementById('ypp-hours-label').innerText = `${ypp.watchHoursCurrent} / ${ypp.watchHoursRequired} hrs (${ypp.watchHoursPercent}%)`;
      document.getElementById('ypp-hours-bar').style.width = `${Math.min(100, ypp.watchHoursPercent)}%`;

      document.getElementById('ypp-shorts-label').innerText = `${ypp.shortsViewsCurrent} / 10,000,000 (${ypp.shortsViewsPercent}%)`;
      document.getElementById('ypp-shorts-bar').style.width = `${Math.min(100, ypp.shortsViewsPercent)}%`;
    }

    // Community
    const commBox = document.getElementById('community-content');
    if (commBox && data.communityModeration) {
      const comm = data.communityModeration;
      commBox.innerHTML = `
        <div style="background:#242424; padding:16px; border-radius:8px;">
          <h4 style="margin-bottom:8px;">Latest Community Engagement</h4>
          <p style="font-size:0.85rem; color:#aaa; margin-bottom:12px;">Total Channel Comments: <strong>${comm.totalComments}</strong></p>
          ${comm.latestComment ? `
            <div style="background:#181818; padding:12px; border-radius:6px; border-left:3px solid #00f0ff;">
              <div style="font-size:0.8rem; color:#00f0ff; font-weight:600;">${comm.latestComment.author} on "${comm.latestComment.videoTitle}"</div>
              <p style="font-size:0.9rem; margin:6px 0;">"${comm.latestComment.text}"</p>
              <div style="font-size:0.75rem; color:#888;">Status: Hearted ❤️ • Auto-reply active</div>
            </div>
          ` : '<p>No pending comments.</p>'}
        </div>
      `;
    }
  }

  // Button actions
  const syncBtn = document.getElementById('btn-sync');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.innerText = 'Syncing...';
      try {
        const res = await fetch('/api/sync', { method: 'POST' });
        const result = await res.json();
        alert(result.message || 'Synchronized successfully with NexusFlow!');
        loadStudioData();
      } catch (e) {
        alert('Sync failed: ' + e.message);
      } finally {
        syncBtn.innerText = '🔄 Sync NexusFlow';
      }
    });
  }

  window.handleEdit = (id) => {
    alert(`Editing Studio metadata for ${id} (Connects to YouTube Studio / NexusFlow Publisher)`);
  };

  loadStudioData();
});
