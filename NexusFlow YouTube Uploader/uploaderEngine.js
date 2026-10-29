const path = require('path');
const fs = require('fs');
const { paths, loadSettings } = require('./config');
const { getYoutubeContext, closeYoutubeContext } = require('./browser');
const { probeVideo, formatUploadMetadata } = require('./metadataManager');
const { log, setStatus } = require('./logger');

let isUploading = false;
let stopRequested = false;

function stopCurrentUpload() {
  if (isUploading) {
    stopRequested = true;
    log('warn', 'Stop requested for active YouTube upload.');
    setStatus('idle', 'Upload stopped');
    return { success: true, message: 'Upload stop flag set.' };
  }
  return { success: false, message: 'No active upload to stop.' };
}

function getIsUploading() {
  return isUploading;
}

function recordUploadHistory(entry) {
  try {
    let history = [];
    if (fs.existsSync(paths.HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(paths.HISTORY_FILE, 'utf8'));
      if (!Array.isArray(history)) history = [];
    }
    history.unshift(entry);
    if (history.length > 500) history = history.slice(0, 500);
    fs.writeFileSync(paths.HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (e) {
    log('warn', `Failed to write history: ${e.message}`);
  }
}

async function uploadVideoToYoutube({
  videoPath,
  title,
  description,
  tags,
  visibility,
  headless = null
}) {
  if (isUploading) {
    throw new Error('Another upload is already in progress.');
  }

  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error(`Video file not found at: ${videoPath}`);
  }

  isUploading = true;
  stopRequested = false;

  const settings = loadSettings();
  const runHeadless = headless !== null ? headless : settings.headless;

  log('info', `Starting YouTube upload for: ${path.basename(videoPath)}`);
  setStatus('uploading', `Probing video ${path.basename(videoPath)}...`);

  try {
    // 1. Probe video metadata
    const probe = await probeVideo(videoPath);
    if (!probe.exists) {
      throw new Error(`Unable to probe video file: ${probe.error || 'Unknown error'}`);
    }

    log('info', `Video Probed: ${probe.formattedDuration} | ${probe.width}x${probe.height} | ${probe.aspectRatio} | ${probe.isShort ? 'YouTube Shorts' : 'Standard Video'}`);

    // 2. Format upload metadata
    const metadata = formatUploadMetadata({
      videoPath,
      title,
      description,
      tags,
      visibility,
      probeData: probe
    });

    log('info', `Target Title: "${metadata.title}"`);
    log('info', `Visibility: ${metadata.visibility} | Shorts: ${metadata.isShort}`);

    // 3. Launch YouTube Context
    setStatus('uploading', 'Connecting to YouTube Studio...');
    const context = await getYoutubeContext(runHeadless);
    const page = context.pages()[0] || await context.newPage();

    // 4. Navigate to YouTube Studio
    log('info', 'Navigating to YouTube Studio...');
    let navLoaded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto('https://studio.youtube.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
        navLoaded = true;
        break;
      } catch (err) {
        log('warn', `Navigation attempt ${attempt} failed: ${err.message}. Retrying in 2s...`);
        await page.waitForTimeout(2000);
      }
    }
    if (!navLoaded) {
      throw new Error('Could not connect to https://studio.youtube.com/ after 3 attempts.');
    }
    await page.waitForTimeout(3000);

    if (stopRequested) throw new Error('Upload cancelled by user.');

    // Verify auth
    const currentUrl = page.url();
    if (currentUrl.includes('accounts.google.com') || currentUrl.includes('/signin')) {
      throw new Error('Not logged into YouTube Studio. Please authenticate via "Open Browser for Login" first.');
    }

    // 5. Open Create Dialog
    log('info', 'Opening upload dialog in YouTube Studio...');
    setStatus('uploading', 'Opening Create dialog...');

    let isModalOpen = await page.$('ytcp-uploads-dialog, ytcp-video-upload-wizard');
    if (!isModalOpen) {
      // Look for Create button
      const createBtn = await page.waitForSelector('#create-icon, button[aria-label="Create"], button:has-text("Create")', { timeout: 15000 }).catch(() => null);
      if (createBtn) {
        await createBtn.click();
        await page.waitForTimeout(1000);

        // Click "Upload videos"
        const uploadItem = await page.waitForSelector('tp-yt-paper-item:has-text("Upload videos"), #text-item-0, [test-id="upload-button"]', { timeout: 10000 }).catch(() => null);
        if (uploadItem) {
          await uploadItem.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Locate file input
    const uploadInput = await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 25000 });
    if (!uploadInput) {
      throw new Error('Could not find file input element on YouTube Studio.');
    }

    if (stopRequested) throw new Error('Upload cancelled by user.');

    // 6. Set input files (Upload the video)
    log('info', `Uploading video file: ${path.basename(videoPath)}...`);
    setStatus('uploading', `Uploading ${path.basename(videoPath)}...`);
    await uploadInput.setInputFiles(videoPath);

    // 7. Wait for Details dialog to load
    log('info', 'Waiting for upload dialog details form...');
    const titleBox = await page.waitForSelector('#textbox[aria-label*="title" i], div#title-textarea #textbox, [aria-label*="Add a title" i]', { timeout: 35000 });
    if (!titleBox) {
      throw new Error('Title input field did not appear.');
    }

    await page.waitForTimeout(1500);

    // 8. Fill Title
    log('info', 'Filling video title...');
    await titleBox.evaluate(el => el.focus());
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(metadata.title, { delay: 10 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await titleBox.evaluate(el => el.blur());
    await page.evaluate(() => {
      document.querySelectorAll('ytcp-social-suggestions-dropdown').forEach(d => d.remove());
    });
    await page.waitForTimeout(600);

    if (stopRequested) throw new Error('Upload cancelled by user.');

    // 9. Fill Description
    log('info', 'Filling video description...');
    const descBox = await page.$('#textbox[aria-label*="description" i], div#description-textarea #textbox, [aria-label*="Tell viewers" i]');
    if (descBox) {
      await descBox.evaluate(el => el.focus());
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(metadata.description, { delay: 5 });
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await descBox.evaluate(el => el.blur());
      await page.evaluate(() => {
        document.querySelectorAll('ytcp-social-suggestions-dropdown').forEach(d => d.remove());
      });
      await page.waitForTimeout(600);
    }

    // 10. Select "Not made for kids" (Mandatory by YouTube)
    log('info', 'Configuring Audience setting (Not made for kids)...');
    await page.evaluate(() => {
      document.querySelectorAll('ytcp-social-suggestions-dropdown').forEach(d => d.remove());
      const r = document.querySelector('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]');
      if (r) r.click();
    });
    await page.waitForTimeout(1000);

    // 11. Tags (optional: expand "Show more" if present)
    try {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#toggle-button, ytcp-button#toggle-button, button, ytcp-button'));
        const btn = btns.find(b => {
          const t = (b.textContent || '').toLowerCase();
          const aria = (b.getAttribute('aria-label') || '').toLowerCase();
          return b.id === 'toggle-button' || t.includes('show more') || aria.includes('show more');
        });
        if (btn) btn.click();
      });
      await page.waitForTimeout(1000);

      const tagsInput = await page.$('#tags-container input, input[aria-label="Tags"]');
      if (tagsInput && metadata.tags.length > 0) {
        log('info', `Adding tags: ${metadata.tags.join(', ')}...`);
        await tagsInput.evaluate(el => el.focus());
        await page.keyboard.type(metadata.tags.join(',') + ',', { delay: 10 });
        await page.waitForTimeout(800);
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      log('warn', `Could not populate tags: ${e.message}`);
    }

    if (stopRequested) throw new Error('Upload cancelled by user.');

    // 12. Advance through wizard steps to Visibility
    log('info', 'Advancing wizard steps to Visibility...');
    setStatus('uploading', 'Advancing to Visibility...');

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const next = document.querySelector('ytcp-button#next-button:not([hidden]), #next-button');
        if (next && next.getAttribute('aria-disabled') !== 'true') next.click();
      });
      await page.waitForTimeout(1500);
    }

    // Ensure we are on Visibility tab (step 4)
    await page.evaluate(() => {
      const steps = Array.from(document.querySelectorAll('#step-badge-3, [test-id="VISIBILITY"], ytcp-stepper-step, ytcp-badge-step'));
      const step = steps.find(s => {
        const t = (s.textContent || '').toLowerCase();
        return s.id === 'step-badge-3' || s.getAttribute('test-id') === 'VISIBILITY' || t.includes('visibility');
      });
      if (step) step.click();
    });
    await page.waitForTimeout(1500);

    if (stopRequested) throw new Error('Upload cancelled by user.');

    // 13. Set Visibility
    log('info', `Setting visibility to: ${metadata.visibility.toUpperCase()}...`);
    const visName = metadata.visibility.toUpperCase();
    await page.evaluate((vName) => {
      const r = document.querySelector(`tp-yt-paper-radio-button[name="${vName}"], [name="${vName}"]`);
      if (r) r.click();
    }, visName);
    await page.waitForTimeout(2000);

    // Check for short URL displayed during upload
    let capturedUrl = null;
    try {
      const linkEl = await page.$('a.ytcp-video-info, a[href*="youtu.be"], #share-url');
      if (linkEl) {
        const text = (await linkEl.innerText()).trim();
        const href = await linkEl.getAttribute('href');
        capturedUrl = href || text;
      }
    } catch (e) {}

    if (stopRequested) throw new Error('Upload cancelled by user.');

    // 14. Click Done / Publish / Save
    log('info', 'Publishing video to YouTube...');
    setStatus('uploading', 'Publishing video...');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ytcp-button#done-button, #done-button, button'));
      const active = btns.filter(b => {
        const text = (b.textContent || '').trim().toLowerCase();
        const id = b.id || '';
        return (id === 'done-button' || text === 'publish' || text === 'save') &&
               !b.hasAttribute('hidden') &&
               b.getAttribute('aria-disabled') !== 'true';
      });
      if (active.length > 0) {
        active[active.length - 1].click();
      }
    });
    await page.waitForTimeout(4000);

    // 15. Wait for published confirmation modal & extract Video Link
    log('info', 'Waiting for upload confirmation...');
    setStatus('uploading', 'Extracting published video URL...');

    try {
      await page.waitForSelector('.ytcp-video-info, a[href*="youtu.be"], #share-url, ytcp-dialog', { timeout: 20000 });
      const finalLinkEl = await page.$('a[href*="youtu.be"], #share-url, a.ytcp-video-info');
      if (finalLinkEl) {
        const href = await finalLinkEl.getAttribute('href');
        const text = (await finalLinkEl.innerText()).trim();
        capturedUrl = href || text;
      }
    } catch (e) {}

    // Extract video ID from URL if available
    let videoId = null;
    if (capturedUrl) {
      const match = capturedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/) || capturedUrl.match(/v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    }

    // Close any remaining dialog
    try {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#close-button, ytcp-button#close-button, button, ytcp-button'));
        const closeBtn = btns.find(b => {
          const t = (b.textContent || '').trim().toLowerCase();
          return b.id === 'close-button' || t === 'close';
        });
        if (closeBtn) closeBtn.click();
      });
      await page.waitForTimeout(1000);
    } catch (e) {}

    const result = {
      success: true,
      videoPath,
      filename: path.basename(videoPath),
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      visibility: metadata.visibility,
      isShort: metadata.isShort,
      duration: probe.duration,
      formattedDuration: probe.formattedDuration,
      url: capturedUrl || 'https://studio.youtube.com/',
      videoId: videoId || null,
      uploadedAt: new Date().toISOString()
    };

    recordUploadHistory(result);

    log('success', `Upload completed successfully! URL: ${result.url}`);
    setStatus('idle', `Uploaded: ${metadata.title}`);

    return result;
  } catch (err) {
    log('error', `YouTube upload error: ${err.message}`);
    setStatus('idle', `Upload failed: ${err.message}`);

    const failedRecord = {
      success: false,
      videoPath,
      filename: path.basename(videoPath),
      error: err.message,
      uploadedAt: new Date().toISOString()
    };
    recordUploadHistory(failedRecord);

    throw err;
  } finally {
    isUploading = false;
    stopRequested = false;
    try { await closeYoutubeContext(); } catch (e) {}
  }
}

module.exports = {
  uploadVideoToYoutube,
  stopCurrentUpload,
  getIsUploading,
  recordUploadHistory
};
