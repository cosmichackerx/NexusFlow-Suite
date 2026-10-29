const { getBrowserContext, getBrowserContextInstance, closeBrowserContext } = require('./browser');
const { getAccountsData, getActiveAccount, setActiveAccount, updateAccountRecord, broadcastAccounts } = require('./accounts');
const { getMainWindow, log } = require('./logger');

let activeSyncPromise = null;

function getActiveSyncPromise() {
  return activeSyncPromise;
}

async function fetchGoogleFlowCredits(context, targetEmail = null) {
  let syncPage;
  try {
    syncPage = await context.newPage();
    const url = targetEmail 
      ? `https://one.google.com/ai/activity?authuser=${encodeURIComponent(targetEmail)}&utm_source=flow`
      : 'https://one.google.com/ai/activity?utm_source=flow';

    await syncPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await syncPage.waitForTimeout(3000); // give it time to render
    
    const data = await syncPage.evaluate(async (paramTargetEmail) => {
         let credits = null;
         let email = null;
         let plan = 'Normal';
         const discoveredEmails = [];
         
         const bodyText = document.body.innerText;
         const match = bodyText.match(/Google Flow credits[\s\n]*([0-9,]+)/i);
         if (match) {
           credits = match[1].replace(/,/g, '');
         }
         
         const accountBtn = document.querySelector('a[href^="https://accounts.google.com/SignOutOptions"]');
         let popupText = "";
         if (accountBtn) {
            const ariaLabel = accountBtn.getAttribute('aria-label') || '';
            const emailMatch = ariaLabel.match(/\(([^@\s]+@[^@\s]+)\)/);
            if (emailMatch) email = emailMatch[1];
            
            try {
                accountBtn.click();
                await new Promise(r => setTimeout(r, 1200));
                popupText = document.body.innerText;
                
                // Discover all signed-in accounts from the popover
                const popupHtml = document.body.innerHTML;
                const emailMatches = popupHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                for (const em of emailMatches) {
                   const clean = em.toLowerCase().trim();
                   if (!clean.includes('example.com') && 
                       !clean.includes('w3.org') && 
                       !clean.includes('schema.org') && 
                       !clean.includes('google.com') && 
                       !clean.includes('noreply') && 
                       !clean.endsWith('.png') && 
                       !clean.endsWith('.jpg')) {
                      discoveredEmails.push(clean);
                   }
                }
                document.body.click(); 
            } catch(e) {}
         }
         
         if (!email && paramTargetEmail) {
            email = paramTargetEmail;
         }
         if (email) {
            discoveredEmails.push(email.toLowerCase().trim());
         }
         
         const checkPlan = (text) => {
            if (!text) return null;
            if (text.includes('Ultra $200') || text.includes('Google AI Ultra $200')) return 'Google AI Ultra $200';
            if (text.includes('Ultra $100') || text.includes('Google AI Ultra $100')) return 'Google AI Ultra $100';
            if (text.includes('Google AI Ultra')) return 'Google AI Ultra';
            if (text.match(/Google AI Pro/i) || text.match(/\bPro plan\b/i)) return 'Google AI Pro';
            if (text.match(/Google AI Plus/i) || text.match(/\bPlus plan\b/i)) return 'Google AI Plus';
            
            if (email && text.includes(email)) {
                const idx = text.indexOf(email);
                const snippet = text.substring(Math.max(0, idx - 500), Math.min(text.length, idx + 500));
                if (snippet.match(/\bPro\b/i)) return 'Google AI Pro';
                if (snippet.match(/\bPlus\b/i)) return 'Google AI Plus';
            }
            return null;
         };
         
         let detectedPlan = checkPlan(popupText) || checkPlan(bodyText);
         if (detectedPlan) {
             plan = detectedPlan;
         }
         return { credits, email, plan, discoveredEmails: Array.from(new Set(discoveredEmails)) };
      }, targetEmail);
      
      // Fallback: If plan is still Normal, check myaccount.google.com directly for absolute certainty
      if (data.plan === 'Normal') {
          try {
              const myAccountUrl = (targetEmail || data.email)
                ? `https://myaccount.google.com/?authuser=${encodeURIComponent(targetEmail || data.email)}`
                : 'https://myaccount.google.com/';
              await syncPage.goto(myAccountUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
              await syncPage.waitForTimeout(2000);
              const planFromMyAccount = await syncPage.evaluate(() => {
                  const text = document.body.innerText;
                  if (text.match(/Google AI Ultra \$200/i)) return 'Google AI Ultra $200';
                  if (text.match(/Google AI Ultra \$100/i)) return 'Google AI Ultra $100';
                  if (text.match(/Google AI Ultra/i)) return 'Google AI Ultra';
                  if (text.match(/Google AI Pro/i) || text.match(/\bPro plan\b/i)) return 'Google AI Pro';
                  if (text.match(/Google AI Plus/i) || text.match(/\bPlus plan\b/i)) return 'Google AI Plus';
                  return 'Normal';
              });
              data.plan = planFromMyAccount;
          } catch (e) {}
      }
    
    await syncPage.close();
    
    const parsedCredits = (data.credits && !isNaN(parseInt(data.credits, 10))) ? parseInt(data.credits, 10) : null;
    
    // Update internal accounts database
    if (data.email) {
        updateAccountRecord(data.email, parsedCredits, data.plan || 'Normal', data.discoveredEmails);
    } else {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed() && !getActiveAccount()) {
            mainWindow.webContents.send('user-email', null);
        }
    }
    
    return parsedCredits;
  } catch(e) {
    if (syncPage) await syncPage.close().catch(()=>{});
    return null;
  }
}

async function syncCredits(manual = false, targetEmail = null) {
  if (activeSyncPromise) {
    log('info', 'Credit sync is already in progress, awaiting existing operation...');
    return activeSyncPromise;
  }

  const activeAccount = getActiveAccount();
  const emailToSync = targetEmail || activeAccount;

  activeSyncPromise = (async () => {
    let isTempCtx = false;
    let ctx = getBrowserContextInstance();

    try {
      if (!ctx) {
        log('info', `Syncing live credits from Google One${emailToSync ? ` (${emailToSync})` : ''}${manual ? '' : ' on startup'}...`);
        ctx = await getBrowserContext(true);
        isTempCtx = true;
      } else {
        log('info', `Syncing live credits from Google One${emailToSync ? ` (${emailToSync})` : ''}...`);
      }

      const credits = await fetchGoogleFlowCredits(ctx, emailToSync);
      const mainWindow = getMainWindow();

      if (credits !== null) {
        log('info', `${manual ? 'Live credits resynced' : 'Startup sync'}: ${credits} credits available${emailToSync ? ` for ${emailToSync}` : ''}.`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('credits-updated', credits);
        }
      } else {
        log('warn', `Could not sync credits automatically from Google One${emailToSync ? ` for ${emailToSync}` : ''}. Please check your login.`);
        if (mainWindow && !mainWindow.isDestroyed() && !activeAccount) {
          mainWindow.webContents.send('user-email', 'Not detected (click Refresh)');
        }
      }

      return credits;
    } catch (err) {
      log('error', `Credit sync failed: ${err.message}`);
      return null;
    } finally {
      if (isTempCtx) {
        await closeBrowserContext();
        log('info', 'Headless browser closed to save RAM/CPU.');
      }
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}

async function findAndSwitchToAccountWithCredits(bContext, reason = 'Credits low') {
  let isTempCtx = false;
  let ctx = bContext || getBrowserContextInstance();
  if (!ctx) {
    try {
      ctx = await getBrowserContext(true);
      isTempCtx = true;
    } catch (e) {
      log('warn', `[Auto-Switch] Could not initialize browser context: ${e.message}`);
    }
  }

  try {
    const accountsData = getAccountsData();
    const activeAccount = accountsData.activeAccount;
    const savedAccounts = accountsData.accounts;
    const autoSwitchOnLowCredits = accountsData.autoSwitchOnLowCredits;

    if (!autoSwitchOnLowCredits) {
      log('info', `[Auto-Switch] Auto-switching is disabled in settings.`);
      return null;
    }
    if (!savedAccounts || savedAccounts.length <= 1) {
      log('info', `[Auto-Switch] Only 1 account registered (${activeAccount || 'default'}). No alternative accounts to switch to.`);
      return null;
    }

    log('info', `[Auto-Switch] ${reason} on account ${activeAccount}. Searching for an account with available credits...`);

    // Filter candidates that are not the current active account
    const candidates = savedAccounts.filter(a => a.email.toLowerCase() !== (activeAccount || '').toLowerCase());
    
    for (const candidate of candidates) {
      log('info', `[Auto-Switch] Checking credits for account: ${candidate.email}...`);
      try {
        let cCredits = ctx ? await fetchGoogleFlowCredits(ctx, candidate.email) : null;
        if (cCredits === null && typeof candidate.credits === 'number' && candidate.credits >= 10) {
          cCredits = candidate.credits;
          log('info', `[Auto-Switch] Using known cached balance (${cCredits} credits) for ${candidate.email}.`);
        }
        if (cCredits !== null && cCredits >= 10) {
          log('success', `[Auto-Switch] Account ${candidate.email} has ${cCredits} credits available! Auto-switching active account...`);
          setActiveAccount(candidate.email);
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('credits-updated', cCredits);
          }
          return { email: candidate.email, credits: cCredits };
        } else {
          log('info', `[Auto-Switch] Account ${candidate.email} has ${cCredits !== null ? cCredits : 'unknown'} credits (< 10). Trying next account...`);
        }
      } catch (e) {
        log('warn', `[Auto-Switch] Could not verify credits for ${candidate.email}: ${e.message}`);
      }
    }

    log('warn', `[Auto-Switch] No alternative accounts have sufficient credits (>= 10 credits required).`);
    return null;
  } finally {
    if (isTempCtx) {
      await closeBrowserContext().catch(()=>{});
    }
  }
}

module.exports = {
  fetchGoogleFlowCredits,
  syncCredits,
  findAndSwitchToAccountWithCredits,
  getActiveSyncPromise
};
