const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { paths, getActiveCooldown } = require('./config');
const { getBrowserContext, closeBrowserContext, cleanupOrphanedChrome } = require('./browser');
const { getActiveAccount, getAutoSwitch } = require('./accounts');
const { combineVideosLossless } = require('./videoMerger');

let isRunning = false;
let stopRequested = false;

function stopAutomation() {
  if (isRunning) {
    stopRequested = true;
    log('warn', 'Automation stop requested. Terminating active session...');
    try {
      closeBrowserContext();
      cleanupOrphanedChrome();
    } catch (e) {}
    setStatus('idle', 'Stopped');
    isRunning = false;
    return { success: true, message: 'Automation stop executed successfully.' };
  }
  return { success: false, message: 'Automation is not currently running.' };
}

function isAutomationRunning() {
  return isRunning;
}
const { fetchGoogleFlowCredits, findAndSwitchToAccountWithCredits, getActiveSyncPromise } = require('./credits');
const {
  generateVideoFilename,
  recordVideoManifest,
  findExistingVideoForIndex,
  generateFrameFilename,
  findExistingFrameForIndex,
  broadcastPromptStats,
  stopPromptWatcher
} = require('./promptManager');
const { applySmartHandlers } = require('./smartHandlers');
const {
  isProjectUrl,
  cleanProjectUrl,
  savePromptProject,
  getPromptProject,
  clearStaleProjects,
  getLastActiveProject,
  setLastActiveProject
} = require('./projectTracker');
const { getMainWindow, log, setStatus } = require('./logger');


async function downloadVideoFromPage(page, i, currentPrompt) {
  const expectedFilename = generateVideoFilename(i, currentPrompt);
  const finalMp4Path = path.join(paths.OUTPUT_DIR, expectedFilename);

  if (!fs.existsSync(paths.OUTPUT_DIR)) {
    fs.mkdirSync(paths.OUTPUT_DIR, { recursive: true });
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    log('info', `Downloading generated video (attempt ${attempt} of 3)...`);
    try {
      await applySmartHandlers(page, 'video_download_obstacle');
      await page.waitForTimeout(1000);

      // 1. Locate completed video cards on canvas (they have play_circle)
      const completedCard = await page.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const playBtns = allBtns.filter(b => (b.textContent || '').includes('play_circle'));
        
        for (let pb of playBtns.slice().reverse()) {
          let card = pb.parentElement;
          for (let d = 0; d < 6 && card && card !== document.body; d++) {
            const cardBtns = Array.from(card.querySelectorAll('button, [role="button"]'));
            const more = cardBtns.find(b => {
              const aria = (b.getAttribute('aria-label') || '').toLowerCase();
              const text = (b.textContent || '').trim();
              return aria.includes('more') || aria.includes('option') || text.includes('more_vert');
            });
            if (more) {
              const r = more.getBoundingClientRect();
              return {
                title: (pb.getAttribute('aria-label') || pb.textContent || '').trim().slice(0, 50),
                moreX: r.x + r.width / 2,
                moreY: r.y + r.height / 2
              };
            }
            card = card.parentElement;
          }
        }
        return null;
      });

      if (!completedCard) {
        log('warn', 'No completed card with more_vert button found on canvas. Retrying...');
        await page.waitForTimeout(2000);
        continue;
      }

      log('info', `Found completed video card ("${completedCard.title}"). Clicking options menu...`);
      await page.mouse.click(completedCard.moreX, completedCard.moreY);
      await page.waitForTimeout(1000);

      // 2. Find enabled Download menu item
      const dlBtn = page.locator('[role="menuitem"]:not([disabled])').filter({ hasText: /download/i }).first();
      const isDlVisible = await dlBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (!isDlVisible) {
        log('warn', 'Download option not visible or was disabled. Retrying...');
        await page.mouse.click(50, 50).catch(() => {});
        await page.waitForTimeout(1500);
        continue;
      }

      log('info', 'Hovering Download menu item to reveal resolution flyout...');
      await dlBtn.hover({ timeout: 2000 });
      await page.waitForTimeout(800);

      // 3. Find 720p / Original size in the flyout submenu
      const quality720 = page.locator('flow-menu-item, button, [role="menuitem"]').filter({ hasText: /720p|Original size/i }).last();
      const has720 = await quality720.isVisible({ timeout: 3000 }).catch(() => false);

      if (!has720) {
        log('warn', '720p option not visible in flyout. Retrying click directly on Download item...');
      }

      const downloadPromise = page.waitForEvent('download', { timeout: 35000 });

      if (has720) {
        log('info', 'Clicking "720p (Original size)" download button...');
        await quality720.click({ force: true });
      } else {
        await dlBtn.click({ force: true });
      }

      const download = await downloadPromise;
      const suggested = download.suggestedFilename();
      const savePath = path.join(paths.OUTPUT_DIR, suggested);
      log('info', `Saving downloaded video: ${suggested}...`);
      await download.saveAs(savePath);

      if (fs.existsSync(savePath)) {
        if (fs.existsSync(finalMp4Path) && savePath !== finalMp4Path) {
          try { fs.unlinkSync(finalMp4Path); } catch (e) {}
        }
        if (savePath !== finalMp4Path) {
          fs.renameSync(savePath, finalMp4Path);
        }
        log('success', `Video saved to: ${path.basename(finalMp4Path)}!`);
        return finalMp4Path;
      }
    } catch(err) {
      log('warn', `Download attempt ${attempt} encountered obstacle: ${err.message}`);
      await page.waitForTimeout(2000);
    }
  }

  // Direct media stream extraction fallback
  log('info', 'Checking for direct media stream URL as final fallback...');
  try {
    const videoSrc = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      for (let v of videos) {
        if (v.src && v.src.startsWith('http')) return v.src;
        if (v.currentSrc && v.currentSrc.startsWith('http')) return v.currentSrc;
        const srcEl = v.querySelector('source');
        if (srcEl && srcEl.src && srcEl.src.startsWith('http')) return srcEl.src;
      }
      return null;
});

      if (videoSrc) {
        log('info', 'Found direct video source stream. Downloading file...');
        const response = await fetch(videoSrc);
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(finalMp4Path, Buffer.from(arrayBuffer));
        log('success', `Video saved via direct stream: ${path.basename(finalMp4Path)}!`);
        return finalMp4Path;
      }
    } catch (srcErr) {
      log('warn', `Direct media stream fallback could not extract URL: ${srcErr.message}`);
    }

  return null;
}

async function navigateToFreshProject(page, accountEmail) {
  const targetUrl = accountEmail
    ? `https://labs.google/fx/tools/flow?authuser=${encodeURIComponent(accountEmail)}`
    : 'https://labs.google/fx/tools/flow';

  log('info', `Navigating to Google Flow (${accountEmail || 'default account'})...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  // Handle potential landing page
  try {
    const startBtn = page.getByRole('button', { name: /Create with Google Flow/i });
    if (await startBtn.isVisible({ timeout: 3500 }).catch(() => false)) {
      await startBtn.click();
      log('info', 'Clicked "Create with Google Flow" button.');
      await page.waitForTimeout(2000);
    } else {
      log('info', 'Landing page button not found or already bypassed.');
    }
  } catch (e) {
    log('info', 'Landing page button not found or already bypassed.');
  }

  // Handle Dashboard state
  try {
    log('info', 'Checking for "+ New project" dashboard button...');
    const newProjectBtn = page.locator('div[role="button"], button').filter({ hasText: /New project/i });
    if (await newProjectBtn.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      await newProjectBtn.first().click();
      log('info', 'Clicked "+ New project" button.');
      await page.waitForTimeout(3000);
    } else {
      log('info', 'No "+ New project" button found, proceeding...');
    }
  } catch (e) {
    log('info', 'No "+ New project" button found, proceeding...');
  }
}

async function startAutomation(totalCredits, cooldown = 10, configOptions = null) {
  isRunning = true;
  stopRequested = false;
  let activeCooldown = cooldown || getActiveCooldown();
  let page;
  let browserContext;

  try {
    const activeSyncPromise = getActiveSyncPromise();
    if (activeSyncPromise) {
      log('info', 'Waiting for background sync to complete before starting...');
      await activeSyncPromise;
    }

    stopPromptWatcher();

    setStatus('running', 'Running Automation');
    log('info', 'Scanning output folder for existing files (Checkpointing)...');

    const promptText = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
    // Split prompts by newlines and filter out empty ones
    const prompts = promptText.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(p => p);

    if (prompts.length === 0) {
      throw new Error('No prompts found in prompt.txt.');
    }

    log('info', `Found ${prompts.length} prompts to process.`);

    // Invalidate stale project URLs from older prompt batches
    clearStaleProjects(prompts);

    // Rename any genuinely unnumbered mp4 files (not matching 0_... or 0.mp4)
    if (fs.existsSync(paths.OUTPUT_DIR)) {
      const allFiles = fs.readdirSync(paths.OUTPUT_DIR);
      const unnumberedFiles = allFiles.filter(f => f.toLowerCase().endsWith('.mp4') && !/^\d+(_|\.mp4)/i.test(f))
                                      .map(f => ({ name: f, time: fs.statSync(path.join(paths.OUTPUT_DIR, f)).mtime.getTime() }))
                                      .sort((a, b) => a.time - b.time);

      for (let unnumbered of unnumberedFiles) {
        let idx = 0;
        while (findExistingVideoForIndex(paths.OUTPUT_DIR, idx)) {
          idx++;
        }
        fs.renameSync(path.join(paths.OUTPUT_DIR, unnumbered.name), path.join(paths.OUTPUT_DIR, `${idx}_video.mp4`));
        log('info', `Renamed unnumbered video ${unnumbered.name} to ${idx}_video.mp4`);
      }
    }

    let existingVideosCount = 0;
    if (fs.existsSync(paths.OUTPUT_DIR)) {
      for (let idx = 0; idx < prompts.length; idx++) {
        if (findExistingVideoForIndex(paths.OUTPUT_DIR, idx, prompts[idx])) {
          existingVideosCount++;
        }
      }
    }

    let remainingVideos = prompts.length - existingVideosCount;
    broadcastPromptStats(null);

    if (existingVideosCount > 0) {
      if (remainingVideos === 0) {
        log('info', `All ${prompts.length} videos found in Output folder. Skipping generation.`);
      } else {
        log('info', `Previous ${existingVideosCount} videos found. Automating remaining ${remainingVideos} videos...`);
      }
    }

    let previousVideoPath = null;
    let currentCredits = totalCredits;
    let activeAccount = getActiveAccount();
    const autoSwitchOnLowCredits = getAutoSwitch();
    let videosGeneratedThisSession = 0;

    if (remainingVideos > 0) {
      browserContext = await getBrowserContext(false); // keep visible so user sees progress

      log('info', `Syncing live credits from Google One${activeAccount ? ` (${activeAccount})` : ''}...`);
      let liveCredits = await fetchGoogleFlowCredits(browserContext, activeAccount);
      const mainWindow = getMainWindow();

      if (liveCredits !== null) {
        totalCredits = liveCredits;
        currentCredits = liveCredits;
        log('info', `Live credits synced: ${totalCredits}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('credits-updated', totalCredits);
        }
      } else {
        log('info', 'Could not sync live credits from Google One automatically. Proceeding with execution...');
      }

      // If credits were fetched and confirmed to be completely unavailable (< 10)
      if (liveCredits !== null && liveCredits < 10) {
        let switched = false;
        if (autoSwitchOnLowCredits) {
          const switchRes = await findAndSwitchToAccountWithCredits(browserContext, `Initial credits low (${liveCredits} credits)`);
          if (switchRes) {
            liveCredits = switchRes.credits;
            totalCredits = liveCredits;
            currentCredits = liveCredits;
            activeAccount = switchRes.email;
            switched = true;
          }
        }
        if (!switched) {
          log('warn', `Credits not available (${liveCredits} credits detected). You need at least 10 credits to generate a video.`);
          log('info', `All existing progress (${existingVideosCount} videos) and states are safely backed up.`);
          log('info', `Please recharge or switch to an account with available credits in Settings, then click Start.`);
          setStatus('idle', 'Credits Not Available');
          return;
        }
      }
    }

    // Initialize ffmpeg
    let ffmpegPath;
    try {
      ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
    } catch(e) {
      log('error', `Failed to load ffmpeg: ${e.message}`);
      throw new Error('ffmpeg not installed properly.');
    }

    if (remainingVideos > 0) {
      page = browserContext.pages()[0] || await browserContext.newPage();
      await navigateToFreshProject(page, activeAccount);
    }

    for (let i = 0; i < prompts.length; i++) {
      if (stopRequested) {
        log('warn', 'Automation stopped before processing prompt ' + (i + 1) + '.');
        break;
      }
      // Re-read prompt file so user can edit failed prompts during cooldown
      const latestPromptText = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
      const latestPrompts = latestPromptText.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(p => p);
      const currentPrompt = latestPrompts[i] || prompts[i];

      const existingVideo = findExistingVideoForIndex(paths.OUTPUT_DIR, i, currentPrompt);
      if (existingVideo) {
        log('info', `Video for prompt ${i + 1} already exists (${path.basename(existingVideo)}). Skipping generation...`);
        previousVideoPath = existingVideo;
        continue;
      }

      // --- CREDIT RESCUE: Check if video was previously generated in a project ---
      const savedProject = getPromptProject(i, currentPrompt);
      if (savedProject && savedProject.url && page) {
        log('info', `[Credit Rescue] Found saved Google Flow project for Prompt ${i + 1}: ${savedProject.url}`);
        log('info', '[Credit Rescue] Checking if video is already rendered in this project to prevent spending credits...');
        try {
          await page.goto(savedProject.url, { waitUntil: 'networkidle', timeout: 35000 });
          await page.waitForTimeout(5000);

          // Check for completed cards (they have play_circle)
          const hasCompletedCard = await page.evaluate(() => {
            const allBtns = Array.from(document.querySelectorAll('button, [role="button"]'));
            return allBtns.some(b => (b.textContent || '').includes('play_circle'));
          });

          if (hasCompletedCard) {
            log('success', `[Credit Rescue] Detected completed video in project! Initiating recovery download...`);
            const savedFile = await downloadVideoFromPage(page, i, currentPrompt);
            if (savedFile && fs.existsSync(savedFile)) {
              log('success', `[Credit Rescue] Prompt ${i + 1} video successfully recovered! (0 credits used)`);
              previousVideoPath = savedFile;
              broadcastPromptStats(null);
              continue;
            }
          } else {
            log('info', '[Credit Rescue] No completed video found in saved project. Proceeding with fresh generation...');
          }
        } catch(err) {
          log('warn', `[Credit Rescue] Could not check saved project: ${err.message}. Proceeding with standard flow.`);
        }
      }

      // Check credits right before fresh generation (after recovery check)
      let switchedHere = false;
      if (currentCredits !== null && currentCredits < 10) {
        if (autoSwitchOnLowCredits) {
          const switchRes = await findAndSwitchToAccountWithCredits(browserContext, `Credits low (${currentCredits} credits)`);
          if (switchRes) {
            currentCredits = switchRes.credits;
            activeAccount = switchRes.email;
            switchedHere = true;

            log('success', `[Auto-Switch] Switched to account: ${activeAccount} (${currentCredits} credits available)!`);
            await navigateToFreshProject(page, activeAccount);
          }
        }
        if (!switchedHere) {
          log('warn', `Credits not available (${currentCredits} credits remaining). You need at least 10 credits to generate Video ${i + 1}.`);
          log('info', `All existing progress is safely backed up.`);
          log('info', 'Please switch accounts or recharge, then click Start Automation to continue.');
          setStatus('idle', 'Credits Not Available');
          break;
        }
      }

      log('info', `\n--- Starting Video ${i + 1} of ${prompts.length} ---`);
      broadcastPromptStats(i);

      if (videosGeneratedThisSession > 0 && !switchedHere) {
        log('info', 'Closing current project tab and opening a fresh one...');
        let oldPage = page;
        page = await browserContext.newPage();
        await oldPage.close();
        await navigateToFreshProject(page, activeAccount);
      }

      if (configOptions) {
        log('info', 'Applying custom configurations...');
        try {
          let settingsBtn = page.getByRole('button', { name: /setting/i }).last();

          if (await settingsBtn.isVisible({ timeout: 4000 }).catch(()=>false)) {
            await settingsBtn.click({ force: true });
            await page.waitForTimeout(1500);

            if (configOptions.confirmBeforeGenerating) {
              await page.locator(`text=${configOptions.confirmBeforeGenerating}`).first().click({ force: true, timeout: 2000 }).catch(()=>{});
            }

            if (configOptions.aspectRatio) {
              await page.locator(`text=${configOptions.aspectRatio}`).last().click({ force: true, timeout: 2000 }).catch(()=>{});
              await page.waitForTimeout(300);
            }

            if (configOptions.count) {
              const countStr = `x${configOptions.count}`;
              await page.locator(`text=${countStr}`).last().click({ force: true, timeout: 2000 }).catch(()=>{});
              await page.waitForTimeout(300);
            }

            if (configOptions.model) {
              const dropdownFound = await page.evaluate(() => {
                const modal = document.querySelector('[role="dialog"]') || document.body;
                const walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT, null, false);
                const textNodes = [];
                let n;
                while (n = walker.nextNode()) {
                  if (n.nodeValue.trim()) textNodes.push(n);
                }
                const saveIdx = textNodes.findIndex(node => node.nodeValue.trim() === 'Save');
                if (saveIdx > 0) {
                  let el = textNodes[saveIdx - 1].parentElement;
                  while(el && el !== modal && el.tagName !== 'BUTTON' && el.getAttribute('role') !== 'combobox' && el.getAttribute('role') !== 'button' && el.getAttribute('role') !== 'radio') {
                    el = el.parentElement;
                  }
                  const target = (el && el !== modal) ? el : textNodes[saveIdx - 1].parentElement;
                  target.id = 'temp-model-dropdown';
                  return true;
                }
                return false;
              });

              if (dropdownFound) {
                await page.locator('#temp-model-dropdown').click({ force: true, timeout: 2000 }).catch(()=>{});
                await page.waitForTimeout(1000);
                await page.locator(`text="${configOptions.model}"`).last().click({ force: true, timeout: 2000 }).catch(()=>{});
              }
            }

            const saveBtn = page.getByRole('button', { name: 'Save' });
            if (await saveBtn.isVisible({ timeout: 2000 }).catch(()=>false)) {
              await saveBtn.click({ force: true, timeout: 2000 }).catch(()=>{});
            } else {
              await page.locator('text=Save').last().click({ force: true, timeout: 2000 }).catch(()=>{});
            }
            await page.waitForTimeout(1000);
            log('info', 'Configurations successfully clicked and saved.');
          } else {
            throw new Error('Could not find the Settings button on the page. Aborting to avoid spending credits on wrong configurations.');
          }
        } catch(e) {
          throw new Error(`Failed to apply config settings: ${e.message}`);
        }
      }

      // 1. Prepare to enter image and prompt
      log('info', 'Focusing prompt input...');
      const specificLocator = page.getByPlaceholder(/What do you want to create/i).first();
      const textareaLocator = page.locator('textarea:visible').first();
      const contentEditableLocator = page.locator('[contenteditable="true"]:visible, [role="textbox"]:visible').first();

      let focused = false;
      let activeLocator = null;

      try {
        await applySmartHandlers(page, 'prompt_focus');
      } catch(e) {}

      async function attemptFocus() {
        for (const loc of [specificLocator, textareaLocator, contentEditableLocator]) {
          try {
            if (await loc.isVisible({ timeout: 1000 }).catch(()=>false)) {
              await loc.focus({ timeout: 2000 });
              await loc.click({ timeout: 1000, force: true }).catch(()=>{});
              activeLocator = loc;
              return true;
            }
          } catch(e) {}
        }
        return false;
      }

      try {
        focused = await attemptFocus();
        if (!focused) throw new Error('Initial focus failed');
      } catch (e) {
        log('info', 'Input box blocked or not found. Running smart handlers to clear obstacles...');
        await applySmartHandlers(page, 'prompt_focus');
        await page.waitForTimeout(1000);

        focused = await attemptFocus();
        if (!focused) {
          try {
            await specificLocator.focus({ timeout: 2000 });
            await specificLocator.click({ force: true, timeout: 1000 }).catch(()=>{});
            activeLocator = specificLocator;
            focused = true;
          } catch(err) {
            throw new Error('Could not find or click a visible prompt input box.');
          }
        }
      }

      if (focused) {
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
      }

      // 1.5 Inject last frame if i > 0
      let framePath = null;
      if (i > 0 && !previousVideoPath) {
        previousVideoPath = findExistingVideoForIndex(paths.OUTPUT_DIR, i - 1, prompts[i - 1]);
      }
      if (i > 0) {
        try {
          if (!fs.existsSync(paths.FRAMES_DIR)) {
            fs.mkdirSync(paths.FRAMES_DIR, { recursive: true });
          }

          if (previousVideoPath) {
            const frameName = generateFrameFilename(i - 1, prompts[i - 1], previousVideoPath);
            framePath = path.join(paths.FRAMES_DIR, frameName);
            log('info', `Extracting last frame of previous video (${path.basename(previousVideoPath)}) to ${frameName}...`);

            try {
              await new Promise((resolve, reject) => {
                execFile(ffmpegPath, ['-sseof', '-0.1', '-i', previousVideoPath, '-frames:v', '1', '-q:v', '2', '-y', framePath], (err) => {
                  if (err) {
                    execFile(ffmpegPath, ['-i', previousVideoPath, '-frames:v', '1', '-q:v', '2', '-y', framePath], (err2) => {
                      if (err2) return reject(err2);
                      resolve();
                    });
                  } else {
                    resolve();
                  }
                });
              });
            } catch(err) {
              log('error', `Failed to extract frame with ffmpeg: ${err.message}`);
            }
          } else {
            framePath = findExistingFrameForIndex(paths.FRAMES_DIR, i - 1);
            if (framePath) {
              log('info', `Using existing frame: ${path.basename(framePath)}...`);
            }
          }

          if (framePath && fs.existsSync(framePath)) {
            log('info', `Copying frame to clipboard and pasting via Ctrl+V...`);
            const { clipboard, nativeImage } = require('electron');
            const image = nativeImage.createFromPath(framePath);
            clipboard.writeImage(image);

            if (focused && activeLocator) {
              try { 
                await activeLocator.focus({ timeout: 1000 }); 
                await activeLocator.click({ timeout: 1000, force: true }).catch(()=>{});
              } catch(e) {}
            }

            const initialImgCount = await page.locator('img').count();

            await page.keyboard.down('Control');
            await page.keyboard.press('V');
            await page.keyboard.up('Control');

            log('info', 'Frame pasted! Monitoring image upload progress...');

            let uploadStartTime = Date.now();
            let lastUploadProgress = -1;
            let uploadComplete = false;

            while (Date.now() - uploadStartTime < 25000) {
              const currentImgCount = await page.locator('img').count();
              if (currentImgCount > initialImgCount) {
                log('info', 'Image uploaded successfully! (100%)');
                uploadComplete = true;
                break;
              }

              const progressText = await page.evaluate(() => {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                let node;
                let highest = -1;
                while ((node = walker.nextNode())) {
                  const text = node.nodeValue.trim();
                  const match = text.match(/^(\d{1,3})%$/);
                  if (match) {
                    const val = parseInt(match[1]);
                    if (val > highest) highest = val;
                  }
                }
                return highest >= 0 ? highest + '%' : null;
              });

              if (progressText) {
                let progressVal = parseInt(progressText.replace('%', ''));
                if (progressVal > lastUploadProgress) {
                  log('info', `Upload progress: ${progressText}`);
                  lastUploadProgress = progressVal;
                }
              }

              await page.waitForTimeout(500);
            }

            if (!uploadComplete) {
              log('warn', 'Upload monitoring timed out, assuming complete...');
            }

            await page.waitForTimeout(3000);

            try {
              const addToPromptBtn = page.getByRole('button', { name: /Add to Prompt/i });
              if (await addToPromptBtn.isVisible({ timeout: 2000 })) {
                log('info', 'Gallery opened! Clicking "Add to Prompt" to attach image...');
                await addToPromptBtn.click({ timeout: 2000 });
                await page.waitForTimeout(1000);
              }
            } catch(e) {}
          }
        } catch(err) {
          log('error', `Failed to inject frame: ${err.message}. Proceeding without frame.`);
        }
      }

      log('info', 'Writing text prompt...');
      if (focused && activeLocator) {
        try { 
          await activeLocator.focus({ timeout: 1000 });
          await activeLocator.click({ timeout: 1000 }).catch(()=>{}); 
        } catch(e) { 
          log('info', 'Re-focusing input box failed (overlay?). Running smart handlers...');
          await applySmartHandlers(page, 'prompt_focus');
          try { 
            await activeLocator.focus({ timeout: 1000 });
            await activeLocator.click({ timeout: 1000, force: true }).catch(()=>{}); 
          } catch(err) {}
        }
      }

      try {
        await page.keyboard.insertText(currentPrompt);
      } catch (insertErr) {
        await page.keyboard.type(currentPrompt);
      }

      log('info', 'Filled prompt successfully.');

      // 2. Click Generate
      log('info', 'Clicking Generate button (or pressing Enter)...');
      try {
        const activeProjUrl = page.url();
        if (isProjectUrl(activeProjUrl)) {
          savePromptProject(i, currentPrompt, activeProjUrl);
        }
      } catch(e) {}

      const previousContentPolicy = await page.evaluate(() => {
        return (document.body.textContent.match(/I can't generate the video|third-party content|safety/gi) || []).length;
      });
      const previousRateLimits = await page.evaluate(() => {
        return (document.body.textContent.match(/rate limit|too many requests/gi) || []).length;
      });
      const previousOopsCount = await page.evaluate(() => {
        return (document.body.innerText.match(/Oops, something went wrong/gi) || []).length;
      });
      const previousVideoCount = await page.locator('video').count();
      const previousCompletedCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, [role="button"]'))
          .filter(b => (b.textContent || '').includes('play_circle')).length;
      });

      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      await page.keyboard.down('Control');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Control');
      await page.waitForTimeout(1000);

      try {
        const generateLocators = [
          page.locator('button:visible').filter({ hasText: /Generate|Create|Send/i }).last(),
          page.locator('button[aria-label*="Send" i], button[aria-label*="Create" i], button[aria-label*="Submit" i]').last(),
          page.locator('textarea:visible, [contenteditable="true"]:visible').last().locator('xpath=ancestor::div[1]').locator('button').last()
        ];

        for (const btn of generateLocators) {
          if (await btn.isVisible().catch(()=>false)) {
            await btn.click({ timeout: 1000, force: true }).catch(()=>{});
          }
        }
      } catch(e) {}

      let hasApproved = false;

      // 2.5 Handle Approval prompt (Credit Usage)
      try {
        log('info', 'Checking for credit usage Approval prompt...');
        for (let attempt = 0; attempt < 15; attempt++) {
          if (await applySmartHandlers(page, 'video_render_wait')) {
            hasApproved = true;
            log('info', 'Smart Handler cleared an obstacle during render wait.');
            break;
          }
          await page.waitForTimeout(1000);
        }

        if (!hasApproved) {
          log('info', 'No approval prompt appeared, or already approved.');
        } else {
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        log('info', 'No approval prompt appeared, or already approved.');
      }

      // 3. Monitor generation progress
      log('info', 'Waiting for video rendering to begin (may be in queue)...');
      let previousProgress = '';
      let waitStartTime = Date.now();
      let last100WaitLog = 0;
      let isCompleted = false;
      let isRetrying = false;
      let isSkipping = false;
      let creditsExhausted = false;

      while (Date.now() - waitStartTime < 1800000) { // 30 min timeout
        try {
          if (!hasApproved) {
            if (await applySmartHandlers(page, 'video_render_wait')) {
              hasApproved = true;
              log('info', 'Caught a late-arriving obstacle or Approval prompt and cleared it.');
            }
          }

          // 1. Check for standard <video> tag
          const currentVideoCount = await page.locator('video').count();
          if (currentVideoCount > previousVideoCount) {
            isCompleted = true;
            break;
          }

          // 2. Play circle / Completed card detection (Google Flow uses lazy <video> rendering; card displays play_circle or options menu)
          const hasCompletedCard = await page.evaluate(() => {
            const allBtns = Array.from(document.querySelectorAll('button, [role="button"]'));
            const hasPlay = allBtns.some(b => (b.textContent || '').includes('play_circle'));
            if (hasPlay) return true;

            const hasOptions = allBtns.some(b => {
              const aria = (b.getAttribute('aria-label') || '').toLowerCase();
              const text = (b.textContent || '').trim();
              return aria.includes('more') || aria.includes('option') || text.includes('more_vert');
            });
            const hasActiveProgress = Array.from(document.querySelectorAll('*')).some(el => 
              el.children.length === 0 && (el.textContent || '').trim().match(/^[0-9]{1,2}%$/)
            );
            return hasOptions && !hasActiveProgress;
          });

          if (hasCompletedCard && (previousProgress === '100%' || Date.now() - waitStartTime > 15000)) {
            isCompleted = true;
            break;
          }

          // 3. Automatically simulate hover over canvas to trigger Google Flow's lazy video loader
          if (previousProgress === '100%') {
            await page.mouse.move(600, 380).catch(() => {});
          }

          const creditError = await page.evaluate(() => {
            const text = document.body.innerText || '';
            const match = text.match(/not enough credits|insufficient credits|out of credits|no credits remaining|zero credits|credits are exhausted|credit limit reached|need more credits/i);
            return match ? match[0] : null;
          });
          if (creditError) {
            log('warn', `Google Flow reported: "${creditError}".`);
            if (autoSwitchOnLowCredits) {
              const switchRes = await findAndSwitchToAccountWithCredits(browserContext, 'Google Flow reported exhausted credits');
              if (switchRes) {
                currentCredits = switchRes.credits;
                activeAccount = switchRes.email;
                log('info', `[Auto-Switch] Switched to ${activeAccount} (${currentCredits} credits) to retry Video ${i + 1}...`);
                await navigateToFreshProject(page, activeAccount);
                i--;
                isRetrying = true;
                break;
              }
            }
            log('info', 'All completed videos and state are safely backed up.');
            log('info', `Automation paused. Once you have credits available, click Start to continue from Video ${i + 1}!`);
            setStatus('idle', 'Paused - Credits Not Available');
            creditsExhausted = true;
            break;
          }

          const currentOopsCount = await page.evaluate(() => {
            return (document.body.innerText.match(/Oops, something went wrong/gi) || []).length;
          });
          if (currentOopsCount > previousOopsCount) {
            log('error', 'Google Flow failed mid-generation (Oops, something went wrong).');
            log('info', 'Initiating 1-minute cooldown before retrying...');
            for(let w = 60; w > 0; w -= 10) {
              log('info', `Cooldown: ${w} seconds remaining...`);
              await page.waitForTimeout(10000);
            }
            log('info', 'Cooldown complete! Clearing UI and retrying...');
            await page.reload();
            await page.waitForTimeout(5000);
            i--;
            isRetrying = true;
            break;
          }

          const texts = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll('*'));
            return els.filter(el => el.children.length === 0 && el.textContent.trim().match(/^[0-9]{1,3}%$/))
                      .map(el => el.textContent.trim());
          });

          if (texts.length > 0) {
            const currentProgress = texts[texts.length - 1];
            if (currentProgress !== previousProgress) {
              log('info', `Generation progress: ${currentProgress}`);
              if (currentProgress === '100%') {
                log('info', 'AI generation reached 100%! Waiting for Google Flow to finalize & encode video (takes ~60-90s)...');
                last100WaitLog = Date.now();
              }
              previousProgress = currentProgress;
            }
          }

          if (previousProgress === '100%') {
            if (!last100WaitLog) last100WaitLog = Date.now();
            if (Date.now() - last100WaitLog >= 20000) {
              log('info', 'Still finalizing video on Google Flow servers (assembling MP4 container)...');
              last100WaitLog = Date.now();
            }
          }

          const currentContentPolicy = await page.evaluate(() => {
            return (document.body.textContent.match(/I can't generate the video|third-party content|safety/gi) || []).length;
          });
          const currentRateLimits = await page.evaluate(() => {
            return (document.body.textContent.match(/rate limit|too many requests/gi) || []).length;
          });

          if (currentContentPolicy > previousContentPolicy) {
            log('error', `Google Flow blocked prompt ${i} (Safety/Content Policy).`);
            log('info', `PAUSED: Please open prompt.txt, edit prompt ${i} to be safer, and SAVE the file.`);
            log('info', `The script will automatically resume as soon as you save the file!`);

            const originalPromptText = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
            let newPromptText = originalPromptText;

            while (newPromptText === originalPromptText) {
              await page.waitForTimeout(2000);
              try {
                newPromptText = fs.readFileSync(paths.PROMPT_FILE, 'utf8');
              } catch (e) {}
            }

            log('info', 'Prompt edit detected! Clearing UI and retrying now...');
            await page.reload();
            await page.waitForTimeout(5000);

            i--;
            isRetrying = true;
            break;
          }

          if (currentRateLimits > previousRateLimits) {
            log('error', `Google Flow hit rate limit on prompt ${i}.`);
            log('info', 'Initiating 1-minute cooldown before retrying...');

            for(let w = 60; w > 0; w -= 10) {
              log('info', `Cooldown: ${w} seconds remaining...`);
              await page.waitForTimeout(10000);
            }

            log('info', 'Cooldown complete! Clearing UI and retrying...');
            await page.reload();
            await page.waitForTimeout(5000);

            i--;
            isRetrying = true;
            break;
          }
        } catch(e) {
          if (e.message && e.message.includes('rejected')) {
            throw e;
          }
          if (e.message && e.message.includes('Rate limit')) {
            throw e;
          }
        }

        await page.waitForTimeout(2000);
      }

      if (creditsExhausted) {
        broadcastPromptStats(null);
        break;
      }

      if (isRetrying || isSkipping) {
        continue;
      }

      if (!isCompleted) {
        log('error', `Progress monitor timed out after 30 minutes for Video ${i}.`);
        log('info', 'Google Flow might be stuck. Reloading and retrying...');
        await page.reload();
        await page.waitForTimeout(5000);
        i--;
        isRetrying = true;
        continue;
      }

      log('info', 'Video successfully generated! Initiating download sequence...');
      await page.waitForTimeout(1500);

      // Record active project URL for credit safety
      const currentUrl = page.url();
      if (isProjectUrl(currentUrl)) {
        savePromptProject(i, currentPrompt, currentUrl);
      }

      const downloadedVideo = await downloadVideoFromPage(page, i, currentPrompt);
      if (downloadedVideo && fs.existsSync(downloadedVideo)) {
        previousVideoPath = downloadedVideo;
        videosGeneratedThisSession++;
        recordVideoManifest(paths.OUTPUT_DIR, i, path.basename(downloadedVideo), currentPrompt);
        broadcastPromptStats(null);
      } else {
        log('warn', `Video ${i + 1} was generated, but the browser download could not be completed.`);
        log('info', `SAFEGUARD: Project URL (${currentUrl}) is recorded! No credits will be wasted.`);
        log('info', 'You can restart or resume anytime and NexusFlow will recover this video without generating again.');
        setStatus('idle', 'Paused - Download Required');
        break;
      }

      // Update credits
      log('info', `Syncing live credits after generation${activeAccount ? ` (${activeAccount})` : ''}...`);
      let updatedCredits = await fetchGoogleFlowCredits(browserContext, activeAccount);
      const mainWindow = getMainWindow();

      if (updatedCredits !== null) {
        currentCredits = updatedCredits;
      } else {
        currentCredits = Math.max(0, currentCredits - 10);
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('credits-updated', currentCredits);
      }
      log('info', `Remaining credits on ${activeAccount || 'active account'}: ${currentCredits}`);

      if (i < prompts.length - 1 && currentCredits < 10) {
        let switched = false;
        if (autoSwitchOnLowCredits) {
          log('warn', `Credits low on ${activeAccount} (${currentCredits} remaining). Attempting auto-switch for next video...`);
          const switchRes = await findAndSwitchToAccountWithCredits(browserContext, `Credits low (${currentCredits} remaining)`);
          if (switchRes) {
            currentCredits = switchRes.credits;
            activeAccount = switchRes.email;
            log('success', `Successfully auto-switched to ${switchRes.email} with ${currentCredits} credits! Continuing automation seamlessly...`);
            switched = true;
          }
        }
        if (!switched) {
          log('warn', `Credits not available for next video (${currentCredits} credits remaining across accounts).`);
          log('info', `Video ${i + 1} and frame state have been safely backed up.`);
          log('info', `Automation paused. Recharge credits and click Start to resume from Video ${i + 2}!`);
          setStatus('idle', 'Paused - Credits Not Available');
          broadcastPromptStats(null);
          break;
        }
      }

      if (i < prompts.length - 1) {
        log('info', `Pacing requests to avoid rate limits. Waiting ${activeCooldown} seconds before starting next video...`);
        let waited = 0;
        while (waited < activeCooldown) {
          if (stopRequested) break;
          await page.waitForTimeout(1000);
          waited += 1;
        }
      }
    }

    // --- COMBINE ALL VIDEOS ---
    try {
      const validVideos = [];
      for (let j = 0; j < prompts.length; j++) {
        const vidPath = findExistingVideoForIndex(paths.OUTPUT_DIR, j, prompts[j]);
        if (vidPath && fs.existsSync(vidPath)) {
          validVideos.push(vidPath);
        }
      }

      if (validVideos.length === prompts.length && validVideos.length > 1) {
        log('info', `All prompts finished! Combining ${validVideos.length} generated videos into a single continuous video...`);
        const finalVideoPath = path.join(paths.RESULT_DIR, 'Combined_Video_Full.mp4');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const timestampedPath = path.join(paths.RESULT_DIR, `Combined_Video_${timestamp}.mp4`);

        await combineVideosLossless(validVideos, finalVideoPath);
        try { fs.copyFileSync(finalVideoPath, timestampedPath); } catch (e) {}

        log('success', `Automation complete for all ${prompts.length} videos!`);
        setStatus('success', 'Completed');
        broadcastPromptStats(null);
      } else if (validVideos.length === prompts.length) {
        log('success', `Automation complete for all ${prompts.length} videos!`);
        setStatus('success', 'Completed');
        broadcastPromptStats(null);
      } else {
        log('info', `Progress preserved: ${validVideos.length} of ${prompts.length} videos completed in Output folder.`);
        log('info', `All state is safely saved. You can resume from video ${validVideos.length + 1} whenever credits are available!`);
        broadcastPromptStats(null);
      }
    } catch(err) {
      log('error', `Failed to combine videos: ${err.message}`);
    }

  } catch (error) {
    log('error', `Automation failed: ${error.message}`);
    setStatus('error', 'Error Occurred');
    broadcastPromptStats(null);
  } finally {
    isRunning = false;
    stopRequested = false;
  }
}

module.exports = {
  startAutomation,
  stopAutomation,
  isAutomationRunning,
  findExistingVideoForIndex
};
