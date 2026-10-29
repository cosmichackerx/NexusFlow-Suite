const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { paths } = require('./config');
const { log } = require('./logger');

let browserContext = null;
let browserLaunchQueue = Promise.resolve();

function getBrowserContextInstance() {
  return browserContext;
}

function cleanupOrphanedChrome() {
  if (browserContext) return;
  if (process.platform === 'win32') {
    try {
      const { execFileSync } = require('child_process');
      const q = String.fromCharCode(34);
      const script = 'Get-CimInstance Win32_Process -Filter ' + q + 'name = \'chrome.exe\'' + q + ' | Where-Object { $_.CommandLine -like \'*playwright-profile*\' } | Stop-Process -Force';
      execFileSync('powershell.exe', ['-NoProfile', '-Command', script], { stdio: 'ignore', windowsHide: true });
    } catch (e) {}
  }
}

function removeStaleLocks() {
  try {
    if (!fs.existsSync(paths.USER_DATA_DIR)) return;
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'lockfile'];
    for (const f of lockFiles) {
      const p = path.join(paths.USER_DATA_DIR, f);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
    }
  } catch (e) {}
}

async function closeBrowserContext() {
  if (browserContext) {
    const ctx = browserContext;
    browserContext = null;
    try {
      await ctx.close();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
  }
  removeStaleLocks();
}

async function doLaunchBrowser(headless = true) {
  if (browserContext) {
    if (browserContext._nexusHeadless === headless) {
      return browserContext;
    }
    await closeBrowserContext();
  }

  cleanupOrphanedChrome();
  removeStaleLocks();

  log('info', `Launching browser (headless: ${headless})...`);
  let context;
  try {
    context = await chromium.launchPersistentContext(paths.USER_DATA_DIR, {
      headless: headless,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
      ignoreDefaultArgs: ['--enable-automation'],
      viewport: { width: 1280, height: 720 },
      permissions: ['clipboard-read', 'clipboard-write'],
      acceptDownloads: true
    });
  } catch (err) {
    log('warn', `Browser launch attempt encountered obstacle: ${err.message}. Retrying with clean profile state...`);
    cleanupOrphanedChrome();
    removeStaleLocks();
    await new Promise(r => setTimeout(r, 1000));
    context = await chromium.launchPersistentContext(paths.USER_DATA_DIR, {
      headless: headless,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled'],
      ignoreDefaultArgs: ['--enable-automation'],
      viewport: { width: 1280, height: 720 },
      permissions: ['clipboard-read', 'clipboard-write'],
      acceptDownloads: true
    });
  }

  context._nexusHeadless = headless;
  browserContext = context;

  context.on('close', () => {
    if (browserContext === context) {
      browserContext = null;
    }
  });

  return context;
}

function getBrowserContext(headless = true) {
  return new Promise((resolve, reject) => {
    browserLaunchQueue = browserLaunchQueue.then(async () => {
      try {
        const ctx = await doLaunchBrowser(headless);
        resolve(ctx);
      } catch (err) {
        reject(err);
      }
    }).catch(reject);
  });
}

module.exports = {
  getBrowserContext,
  getBrowserContextInstance,
  closeBrowserContext,
  cleanupOrphanedChrome,
  removeStaleLocks
};
