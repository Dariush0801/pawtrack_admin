const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('  PawTrack Admin & Owner Ecosystem Verification');
console.log('==================================================\n');

const adminDir = path.resolve(__dirname, '..');
const baseDir = path.resolve(adminDir, '..');
const ownerDir = path.join(baseDir, 'PawTrack');
const sharedDbPath = path.join(baseDir, 'pawtrack-shared-db.json');

let hasErrors = false;

// 1. Verify Shared DB
console.log('--- 1. Shared Database Verification ---');
if (fs.existsSync(sharedDbPath)) {
  try {
    let raw = fs.readFileSync(sharedDbPath, 'utf8');
    raw = raw.replace(/^\uFEFF/, '').trim();
    const db = JSON.parse(raw);
    console.log(`[PASS] Shared DB exists and is valid JSON (${raw.length} bytes)`);
    console.log(`       Pets: ${(db.pets || []).length}, Shelters: ${(db.shelters || []).length}, RFID Tags: ${(db.rfidTags || []).length}`);
    
    // Check required collections
    const collections = ['pets', 'impoundments', 'notifications', 'shelters', 'rfidTags'];
    const missing = collections.filter(c => !Array.isArray(db[c]));
    if (missing.length > 0) {
      console.warn(`[WARN] Collections missing/non-array: ${missing.join(', ')}`);
    }
  } catch (e) {
    hasErrors = true;
    console.error(`[FAIL] Shared DB JSON error:`, e.message);
  }
} else {
  hasErrors = true;
  console.error(`[FAIL] Shared DB file missing at ${sharedDbPath}`);
}

// 2. Syntax check all JS files in Admin
console.log('\n--- 2. Checking Admin JavaScript Syntax ---');
const adminJsFiles = [
  'server.js',
  'js/admin-store.js',
  'js/admin-app.js',
  'js/views/activation-view.js',
  'js/views/pets-view.js',
  'js/views/impoundments-view.js',
  'js/views/shelters-view.js',
  'js/views/rfid-view.js',
  'js/views/notifs-view.js',
  'js/views/settings-view.js'
];

adminJsFiles.forEach(rel => {
  const full = path.join(adminDir, rel);
  if (!fs.existsSync(full)) {
    hasErrors = true;
    console.error(`[FAIL] Missing Admin file: ${rel}`);
    return;
  }
  const code = fs.readFileSync(full, 'utf8');
  try {
    new Function(code);
    console.log(`[PASS] Admin: ${rel} syntax is clean.`);
  } catch (err) {
    hasErrors = true;
    console.error(`[FAIL] Admin: ${rel} syntax error:`, err.message);
  }
});

// 3. Syntax check all JS files in Owner
console.log('\n--- 3. Checking Owner JavaScript Syntax ---');
const ownerJsFiles = [
  'server.js',
  'js/store.js',
  'js/app.js',
  'js/notifications.js',
  'js/rfid-scanner.js',
  'js/views/owner-view.js',
  'js/views/shelter-view.js',
  'js/views/public-view.js',
  'js/views/hardware-view.js'
];

ownerJsFiles.forEach(rel => {
  const full = path.join(ownerDir, rel);
  if (!fs.existsSync(full)) {
    hasErrors = true;
    console.error(`[FAIL] Missing Owner file: ${rel}`);
    return;
  }
  const code = fs.readFileSync(full, 'utf8');
  try {
    new Function(code);
    console.log(`[PASS] Owner: ${rel} syntax is clean.`);
  } catch (err) {
    hasErrors = true;
    console.error(`[FAIL] Owner: ${rel} syntax error:`, err.message);
  }
});

// 4. Check HTML and launcher scripts
console.log('\n--- 4. Checking Launcher Scripts ---');
const launchers = [
  path.join(adminDir, 'start-server.bat'),
  path.join(adminDir, 'start-all.bat'),
  path.join(ownerDir, 'start-server.bat'),
  path.join(baseDir, 'start-pawtrack-all.bat')
];

launchers.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`[PASS] Launcher exists: ${f}`);
  } else {
    hasErrors = true;
    console.error(`[FAIL] Launcher missing: ${f}`);
  }
});

console.log('\n==================================================');
if (!hasErrors) {
  console.log('  All Systems Verified & Synchronized Successfully');
} else {
  console.log('  Verification completed with issues detected above.');
}
console.log('==================================================\n');

process.exit(hasErrors ? 1 : 0);
