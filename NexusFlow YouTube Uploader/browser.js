const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { paths } = require('./config');
const { log, setStatus } = require('./logger');

let activeContext = null;
let activeAuthCheckPromise = null;

function cleanupOrphanedChrome(force = false) {
  if (activeContext && !force) return;
  if (process.platform === 'win32') {
    try {
      const { execFileSync } = require('child_process');
      const script = "Get-CimInstance Win32_Process -Filter \"Name = 'chrome.exe'\" | Where-Object { $_.CommandLine -like '*playwright-youtube-profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
      execFileSync('powershell.exe', ['-NoProfile', '-Command', script], { stdio: 'ignore', windowsHide: true });
    } catch (e) {}
  }
}

function removeStaleLocks() {
  try {
    if (!fs.existsSync(paths.PROFILE_DIR)) return;
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'lockfile'];
    for (const f of lockFiles) {
      const p = path.join(paths.PROFILE_DIR, f);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
    }
  } catch (e) {}
}

async function closeYoutubeContext() {
  if (activeContext) {
    const ctx = activeContext;
    activeContext = null;
    try {
      await ctx.close();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
  }
  removeStaleLocks();
}

function getStealthArgs() {
  return [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-accelerated-2d-canvas',
    '--start-maximized'
  ];
}

async function getYoutubeContext(headless = true) {
  if (activeContext) {
    if (activeContext._headlessState === headless) {
      try {
        if (activeContext.pages().length >= 0) {
          return activeContext;
        }
      } catch (e) {
        activeContext = null;
      }
    } else {
      await closeYoutubeContext();
    }
  }

  cleanupOrphanedChrome();
  removeStaleLocks();

  log('info', `Launching YouTube automation browser (headless: ${headless})...`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const hasSystemChrome = fs.existsSync(chromePath);

  let context;
  try {
    context = await chromium.launchPersistentContext(paths.PROFILE_DIR, {
      headless,
      channel: hasSystemChrome ? 'chrome' : undefined,
      executablePath: hasSystemChrome ? chromePath : undefined,
      args: getStealthArgs(),
      ignoreDefaultArgs: ['--enable-automation'],
      viewport: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      acceptDownloads: true
    });
  } catch (err) {
    log('warn', `Browser launch obstacle: ${err.message}. Cleaning locks and retrying...`);
    activeContext = null;
    cleanupOrphanedChrome(true);
    await new Promise(r => setTimeout(r, 1500));
    removeStaleLocks();
    context = await chromium.launchPersistentContext(paths.PROFILE_DIR, {
      headless,
      channel: hasSystemChrome ? 'chrome' : undefined,
      executablePath: hasSystemChrome ? chromePath : undefined,
      args: getStealthArgs(),
      ignoreDefaultArgs: ['--enable-automation'],
      viewport: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      acceptDownloads: true
    });
  }

  context._headlessState = headless;
  activeContext = context;

  context.on('close', () => {
    if (activeContext === context) {
      activeContext = null;
    }
  });

  return context;
}

async function checkAuthStatus(headless = true) {
  if (activeAuthCheckPromise) return activeAuthCheckPromise;

  activeAuthCheckPromise = (async () => {
    let context = null;
    try {
      context = await getYoutubeContext(headless);
      const page = context.pages()[0] || await context.newPage();

      log('info', 'Checking YouTube Studio authentication status...');
      setStatus('authenticating', 'Checking YouTube Studio auth...');

      await page.goto('https://studio.youtube.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('accounts.google.com') || currentUrl.includes('/signin') || currentUrl.includes('ServiceLogin')) {
        log('warn', 'YouTube session: Not logged in (Redirected to Google Login).');
        setStatus('idle', 'Not Logged In');
        return {
          loggedIn: false,
          channelName: null,
          channelHandle: null,
          channelUrl: null,
          url: currentUrl
        };
      }

      // Check for channel header / avatar in YouTube Studio
      const channelData = await page.evaluate(() => {
        let name = null;
        let handle = null;
        let avatar = null;

        // Try studio header / channel title
        const nameEl = document.querySelector('#entity-name, #channel-title, ytcp-entity-page-header h1, #channel-name');
        if (nameEl) name = (nameEl.textContent || '').trim();

        const handleEl = document.querySelector('#channel-handle, .channel-handle');
        if (handleEl) handle = (handleEl.textContent || '').trim();

        const imgEl = document.querySelector('#entity-avatar img, ytcp-entity-page-header img, img#img');
        if (imgEl) avatar = imgEl.src;

        return { name, handle, avatar };
      });

      const loggedIn = !currentUrl.includes('accounts.google.com');
      const channelName = channelData.name || 'YouTube Creator';
      const channelHandle = channelData.handle || '';

      log('success', `YouTube session active: ${channelName} ${channelHandle ? `(${channelHandle})` : ''}`);
      setStatus('idle', `Logged in as ${channelName}`);

      return {
        loggedIn,
        channelName,
        channelHandle,
        channelUrl: currentUrl,
        avatar: channelData.avatar
      };
    } catch (err) {
      log('error', `Failed to check YouTube auth: ${err.message}`);
      setStatus('idle', 'Auth check error');
      return {
        loggedIn: false,
        error: err.message
      };
    } finally {
      activeAuthCheckPromise = null;
      if (headless) {
        try { await closeYoutubeContext(); } catch (e) {}
      }
    }
  })();

  return activeAuthCheckPromise;
}

async function openLoginWindow() {
  log('info', 'Opening headful browser window for YouTube Studio login...');
  setStatus('authenticating', 'Waiting for user login in browser...');

  const context = await getYoutubeContext(false); // headful
  const page = context.pages()[0] || await context.newPage();

  await page.goto('https://studio.youtube.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Poll for successful login
  return new Promise((resolve) => {
    let resolved = false;

    const checkInterval = setInterval(async () => {
      try {
        if (!activeContext || context.pages().length === 0) {
          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            resolve({ success: false, message: 'Browser window was closed by user.' });
          }
          return;
        }

        const url = page.url();
        if (url.includes('studio.youtube.com') && !url.includes('accounts.google.com') && !url.includes('signin')) {
          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            log('success', 'User successfully authenticated into YouTube Studio!');
            const authInfo = await checkAuthStatus(false);
            resolve({ success: true, ...authInfo });
          }
        }
      } catch (e) {
        clearInterval(checkInterval);
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: e.message });
        }
      }
    }, 2000);

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!resolved) {
        resolved = true;
        resolve({ success: false, message: 'Login timed out after 10 minutes.' });
      }
    }, 600000);
  });
}

module.exports = {
  getYoutubeContext,
  closeYoutubeContext,
  cleanupOrphanedChrome,
  checkAuthStatus,
  openLoginWindow
};
