const fs = require('fs');
const path = require('path');
const { paths, accounts: accountConfig } = require('./config');
const auditor = require('./logAuditor');

class AccountManager {
  constructor() {
    this.allKnownAccounts = [
      { email: 'astravoidxecho@gmail.com', plan: 'Google AI Plus', role: 'Primary YouTube Uploader / Generation', credits: 56 },
      { email: 'amazingarsl@gmail.com', plan: 'Google AI Pro', role: 'Backup / Channel Status & Analytics', credits: 14 },
      { email: 'cosmichackerx@gmail.com', plan: 'Normal', role: 'Generation Pool Account (Auto-Shift)', credits: null },
      { email: 'xinfinite.dev@gmail.com', plan: 'Normal', role: 'Generation Pool Account (Auto-Shift)', credits: null },
      { email: 'cosmicarmyx@gmail.com', plan: 'Normal', role: 'Generation Pool Account (Auto-Shift)', credits: null },
      { email: 'marslan9417406@gmail.com', plan: 'Normal', role: 'Generation Pool Account (Auto-Shift)', credits: null }
    ];
  }

  loadSettings() {
    try {
      if (fs.existsSync(paths.CORE_SETTINGS_FILE)) {
        return JSON.parse(fs.readFileSync(paths.CORE_SETTINGS_FILE, 'utf8'));
      }
    } catch (e) {
      auditor.warn('ACCOUNT_MGR', `Could not read settings file: ${e.message}`);
    }
    return {};
  }

  saveSettings(data) {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...data };
      fs.writeFileSync(paths.CORE_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
      return updated;
    } catch (e) {
      auditor.error('ACCOUNT_MGR', `Failed to write settings file: ${e.message}`);
      return null;
    }
  }

  getAccountsState() {
    const settings = this.loadSettings();
    const diskAccounts = Array.isArray(settings.accounts) ? settings.accounts : [];

    // Merge known accounts with disk accounts
    const merged = this.allKnownAccounts.map(known => {
      const found = diskAccounts.find(d => d.email.toLowerCase() === known.email.toLowerCase());
      return {
        email: known.email,
        plan: (found && found.plan) ? found.plan : known.plan,
        credits: (found && found.credits !== null && found.credits !== undefined) ? found.credits : known.credits,
        lastSynced: (found && found.lastSynced) ? found.lastSynced : null,
        role: known.role,
        isUploaderTarget: known.email.toLowerCase() === accountConfig.primaryUploader.toLowerCase(),
        isBackupStatusTarget: known.email.toLowerCase() === accountConfig.backupStatus.toLowerCase()
      };
    });

    const activeAccount = settings.activeAccount || accountConfig.primaryUploader;
    const activeObj = merged.find(a => a.email.toLowerCase() === activeAccount.toLowerCase()) || merged[0];

    return {
      accounts: merged,
      activeAccount: activeAccount,
      activeCredits: activeObj ? activeObj.credits : null,
      autoSwitchEnabled: settings.autoSwitchOnLowCredits !== false,
      threshold: accountConfig.minCreditThreshold,
      uploaderAccount: accountConfig.primaryUploader,
      backupStatusAccount: accountConfig.backupStatus
    };
  }

  switchAccount(targetEmail) {
    auditor.step('ACCOUNT_MGR', `Switching active NexusFlow account to: ${targetEmail}`);
    const state = this.getAccountsState();
    const exists = state.accounts.some(a => a.email.toLowerCase() === targetEmail.toLowerCase());
    if (!exists) {
      auditor.warn('ACCOUNT_MGR', `Account ${targetEmail} not found in pool! Registering it.`);
    }

    this.saveSettings({
      activeAccount: targetEmail,
      accounts: state.accounts.map(a => ({
        email: a.email,
        plan: a.plan,
        credits: a.credits,
        lastSynced: a.lastSynced
      }))
    });

    auditor.success('ACCOUNT_MGR', `Active account successfully switched to ${targetEmail}`);
    return this.getAccountsState();
  }

  checkAndAutoShift() {
    const state = this.getAccountsState();
    auditor.info('ACCOUNT_MGR', `Auditing accounts... Active: ${state.activeAccount} | Credits: ${state.activeCredits}`);

    if (!state.autoSwitchEnabled) {
      auditor.info('ACCOUNT_MGR', 'Auto-switch is disabled in settings. No shift performed.');
      return { shifted: false, activeAccount: state.activeAccount, credits: state.activeCredits };
    }

    if (state.activeCredits !== null && state.activeCredits < state.threshold) {
      auditor.warn('ACCOUNT_MGR', `Credits low (${state.activeCredits} < ${state.threshold}) on ${state.activeAccount}. Initiating auto-shift...`);

      // Find best alternative account: highest credits >= 10, or un-exhausted account
      const candidates = state.accounts
        .filter(a => a.email.toLowerCase() !== state.activeAccount.toLowerCase())
        .sort((a, b) => {
          const credA = a.credits === null ? 20 : a.credits;
          const credB = b.credits === null ? 20 : b.credits;
          return credB - credA;
        });

      if (candidates.length > 0 && (candidates[0].credits === null || candidates[0].credits >= state.threshold)) {
        const nextAccount = candidates[0];
        auditor.step('ACCOUNT_MGR', `Auto-shifting from ${state.activeAccount} to ${nextAccount.email} (Est. Credits: ${nextAccount.credits ?? 'Unsynced/Fresh'})`);
        this.switchAccount(nextAccount.email);
        return {
          shifted: true,
          previousAccount: state.activeAccount,
          newAccount: nextAccount.email,
          newCredits: nextAccount.credits
        };
      } else {
        auditor.error('ACCOUNT_MGR', `All accounts in the pool are below ${state.threshold} credits! Manual refill or credit sync required.`);
        return { shifted: false, exhausted: true, activeAccount: state.activeAccount, credits: state.activeCredits };
      }
    }

    return { shifted: false, activeAccount: state.activeAccount, credits: state.activeCredits };
  }

  updateAccountCredit(email, credits, plan = null) {
    const state = this.getAccountsState();
    const updated = state.accounts.map(a => {
      if (a.email.toLowerCase() === email.toLowerCase()) {
        return {
          ...a,
          credits: credits,
          plan: plan || a.plan,
          lastSynced: Date.now()
        };
      }
      return a;
    });

    this.saveSettings({
      accounts: updated.map(a => ({
        email: a.email,
        plan: a.plan,
        credits: a.credits,
        lastSynced: a.lastSynced
      }))
    });

    auditor.success('ACCOUNT_MGR', `Updated credits for ${email}: ${credits} (${plan || 'Current Plan'})`);
    return this.getAccountsState();
  }
}

const manager = new AccountManager();
module.exports = manager;
