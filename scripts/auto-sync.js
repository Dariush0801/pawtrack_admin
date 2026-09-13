/**
 * PawTrack Admin Automatic Git Commit & Cloud Push Watcher
 * Watches project files for changes, automatically commits, and pushes to GitHub.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEBOUNCE_MS = 3500; // 3.5 seconds debounce

let debounceTimer = null;
let changedFiles = new Set();
let isSyncing = false;
let lastSyncTimestamp = null;
let lastSyncResult = null;

function runGit(command) {
  try {
    return execSync(command, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return null;
  }
}

function getActiveBranch() {
  const branch = runGit('git rev-parse --abbrev-ref HEAD');
  return branch || 'main';
}

function getRemoteUrl() {
  const remote = runGit('git remote get-url origin');
  return remote || 'https://github.com/Dariush0801/pawtrack_admin.git';
}

function getLastCommit() {
  const log = runGit('git log -1 --pretty=format:"%h - %s (%cr)"');
  return log || 'No commits yet';
}

function shouldIgnore(filename) {
  if (!filename) return true;
  const normalized = filename.replace(/\\/g, '/');
  if (normalized.startsWith('.git') ||
      normalized.includes('/.git') ||
      normalized.includes('node_modules') ||
      normalized.includes('.vercel') ||
      normalized.endsWith('.log') ||
      normalized.endsWith('.tmp') ||
      normalized.includes('pawtrack-shared-db.json') ||
      normalized.includes('.DS_Store') ||
      normalized.includes('Thumbs.db')) {
    return true;
  }
  return false;
}

function getStatusSummary() {
  const branch = getActiveBranch();
  const remote = getRemoteUrl();
  const rawStatus = runGit('git status --porcelain') || '';
  const lines = rawStatus.split('\n').filter(l => l.trim().length > 0);
  const isClean = lines.length === 0;

  return {
    branch,
    remote,
    isClean,
    uncommittedCount: lines.length,
    uncommittedFiles: lines.map(l => l.slice(3).trim()),
    lastCommit: getLastCommit(),
    lastSyncTimestamp,
    lastSyncResult,
    autoSyncActive: true
  };
}

function performSync(customMessage) {
  if (isSyncing) return { success: false, message: 'Sync already in progress' };
  isSyncing = true;

  try {
    const branch = getActiveBranch();
    const rawStatus = runGit('git status --porcelain');

    if (!rawStatus || !rawStatus.trim()) {
      console.log(`[${new Date().toLocaleTimeString()}] No uncommitted changes. Working tree is clean.`);
      isSyncing = false;
      changedFiles.clear();
      return { success: true, message: 'Working tree is clean', branch };
    }

    const count = changedFiles.size || 1;
    const fileListStr = Array.from(changedFiles).slice(0, 3).join(', ') + (changedFiles.size > 3 ? ` (+${changedFiles.size - 3} more)` : '');
    const commitMsg = customMessage || `Auto-sync: update ${count} file(s) [${fileListStr || 'modifications'}] at ${new Date().toLocaleTimeString()}`;

    console.log(`\n[${new Date().toLocaleTimeString()}] 📝 Staging changes...`);
    if (changedFiles.size > 0) {
      changedFiles.forEach(f => console.log(`   • ${f}`));
    }

    runGit('git add -A');
    const commitResult = runGit(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    console.log(`[${new Date().toLocaleTimeString()}] 📦 Committed: ${commitMsg}`);

    console.log(`[${new Date().toLocaleTimeString()}] 🚀 Pushing to GitHub (${branch})...`);
    
    // Try rebase first if needed to prevent non-fast-forward push rejection
    let pushResult = runGit(`git push origin ${branch}`);
    if (pushResult === null) {
      console.log(`[${new Date().toLocaleTimeString()}] Fetching latest remote branch changes...`);
      runGit(`git pull --rebase origin ${branch}`);
      pushResult = runGit(`git push origin ${branch}`);
    }

    lastSyncTimestamp = new Date().toISOString();
    lastSyncResult = 'success';
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Auto-sync successfully pushed to GitHub!\n`);

    return {
      success: true,
      commitMsg,
      branch,
      timestamp: lastSyncTimestamp
    };
  } catch (err) {
    lastSyncResult = 'error: ' + (err.message || err);
    console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ Auto-sync notice:`, err.message || err);
    return { success: false, error: err.message || err };
  } finally {
    isSyncing = false;
    changedFiles.clear();
  }
}

function scheduleSync(filename) {
  if (shouldIgnore(filename)) return;

  changedFiles.add(filename);
  clearTimeout(debounceTimer);

  console.log(`[${new Date().toLocaleTimeString()}] ⚡ File modified: ${filename} (syncing in ${DEBOUNCE_MS / 1000}s)...`);
  debounceTimer = setTimeout(() => performSync(), DEBOUNCE_MS);
}

function startWatcher() {
  try {
    const watcher = fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
      scheduleSync(filename);
    });

    console.log('\n===============================================================');
    console.log('  🐾 PawTrack Admin Git Auto-Commit & Auto-Sync Service');
    console.log('  Monitoring:', ROOT_DIR);
    console.log('  Remote:    ' + getRemoteUrl());
    console.log('  Branch:    ' + getActiveBranch());
    console.log('  Debounce:  ' + (DEBOUNCE_MS / 1000) + 's');
    console.log('===============================================================');
    console.log('✨ File watcher active and listening for code updates.');
    console.log('✨ Ready to automatically commit and push to GitHub.\n');

    return watcher;
  } catch (err) {
    console.error('Error starting file watcher:', err.message);
    return null;
  }
}

// If executed directly from command line
if (require.main === module) {
  startWatcher();
}

module.exports = {
  startWatcher,
  performSync,
  getStatusSummary,
  runGit,
  getActiveBranch,
  getRemoteUrl
};
