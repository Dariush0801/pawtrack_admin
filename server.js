const http = require('http');
const fs = require('fs');
const path = require('path');
const autoSync = require('./scripts/auto-sync');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;
const SHARED_DB_PATH = path.resolve(__dirname, '..', 'pawtrack-shared-db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const SEED_SHELTERS = [
  {
    id: 'sh-qc-payatas',
    name: 'Quezon City Animal Care & Adoption Facility',
    type: 'Municipal LGU Facility',
    city: 'Quezon City (District 2)',
    address: 'Clemente St., Lupang Pangako, Payatas, Quezon City',
    phone: '+63 (2) 8988-4242 loc 8036',
    email: 'animalcare@quezoncity.gov.ph',
    hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
    lat: 14.7118,
    lng: 121.1037,
    fee: 'PHP 500 / day',
    holdingPeriodDays: 3,
    capacity: 65,
    occupied: 0,
    partnered: true,
    officerInCharge: 'Dr. Fernando Gomez, DVM'
  },
  {
    id: 'sh-paws-qc',
    name: 'PAWS Animal Rehabilitation Center (PARC)',
    type: 'Non-Profit Animal Welfare Sanctuary',
    city: 'Quezon City (District 3)',
    address: 'Aurora Blvd. cor. Katipunan Ave., Loyola Heights, Quezon City',
    phone: '+63 (2) 8475-1688',
    email: 'philpaws@paws.org.ph',
    hours: 'Mon - Sat: 10:00 AM - 5:00 PM',
    lat: 14.6339,
    lng: 121.0741,
    fee: 'PHP 0 (NGO Shelter)',
    holdingPeriodDays: 30,
    capacity: 120,
    occupied: 0,
    partnered: true,
    officerInCharge: 'Anna Cabrera, Executive Director'
  },
  {
    id: 'sh-cara-mandaluyong',
    name: 'CARA Welfare Philippines Rescue Clinic',
    type: 'Non-Profit Rescue Clinic & Sanctuary',
    city: 'Mandaluyong City (Metro Manila)',
    address: '175 Lopez Rizal St. cor. Samat St., Mandaluyong City',
    phone: '+63 (2) 8532-3340',
    email: 'clinic@carawelfare.ph',
    hours: 'Tue - Sun: 9:00 AM - 5:00 PM',
    lat: 14.5886,
    lng: 121.0345,
    fee: 'Subsidized NGO Rates',
    holdingPeriodDays: 14,
    capacity: 45,
    occupied: 0,
    partnered: true,
    officerInCharge: 'Dr. Riza Zuniga, DVM'
  },
  {
    id: 'sh-akf-rescue',
    name: 'Animal Kingdom Foundation (AKF) Rescue Network',
    type: 'Anti-Cruelty Sanctuary & Rescue NGO',
    city: 'Quezon City / Capas Facility',
    address: '88 Malakas St., Diliman, Quezon City',
    phone: '+63 (939) 914-2402',
    email: 'akfrescue@gmail.com',
    hours: 'Mon - Sat: 9:00 AM - 5:00 PM',
    lat: 14.6465,
    lng: 121.0503,
    fee: 'PHP 0 (Non-Profit)',
    holdingPeriodDays: 60,
    capacity: 150,
    occupied: 0,
    partnered: true,
    officerInCharge: 'Atty. Heidi Caguioa'
  },
  {
    id: 'sh-ppbcc-foundation',
    name: 'Philippine Pet Birth Control Center Foundation (PPBCC)',
    type: 'Spay/Neuter & Animal Welfare Center',
    city: 'Metro Manila (QC Outreach)',
    address: '391 Boni Ave., Mandaluyong City',
    phone: '+63 (2) 8983-3933',
    email: 'ppbccfoundation@gmail.com',
    hours: 'Mon - Sun: 8:00 AM - 6:00 PM',
    lat: 14.5768,
    lng: 121.0381,
    fee: 'Subsidized Clinic',
    holdingPeriodDays: 7,
    capacity: 35,
    occupied: 0,
    partnered: true,
    officerInCharge: 'Dr. Mace Licuanan, DVM'
  },
  {
    id: 'sh-biyaya-care',
    name: 'Biyaya Animal Care Sanctuary & Hospital',
    type: 'Animal Welfare Hospital & Sanctuary',
    city: 'Quezon City / Mandaluyong',
    address: 'Katarungan St., Mandaluyong / QC Outpost',
    phone: '+63 (917) 543-3444',
    email: 'info@biyaya.org.ph',
    hours: 'Open 24/7 (Emergency & Shelter)',
    lat: 14.5824,
    lng: 121.0315,
    fee: 'Subsidized Rates',
    holdingPeriodDays: 21,
    capacity: 80,
    occupied: 0,
    partnered: true,
    officerInCharge: 'Dr. Ronald Santos, DVM'
  },
  {
    id: 'sh-sws-shelter',
    name: 'Strays Worth Saving (SWS) Rescue Shelter',
    type: 'Private Animal Rescue Sanctuary',
    city: 'Greater Manila Area',
    address: 'Tanauan / Metro Manila Operations Hub',
    phone: '+63 (917) 835-5177',
    email: 'straysworthsaving@gmail.com',
    hours: 'By Appointment',
    lat: 14.0845,
    lng: 121.1500,
    fee: 'PHP 0 (Private NGO)',
    holdingPeriodDays: 90,
    capacity: 180,
    occupied: 0,
    partnered: false,
    officerInCharge: 'Reena Del Rosario'
  },
  {
    id: 'sh-manila-vib',
    name: 'Manila City Pound & Veterinary Inspection Board',
    type: 'Municipal LGU Pound',
    city: 'City of Manila',
    address: 'Vitas St., Tondo, Manila, Metro Manila',
    phone: '+63 (2) 8243-7952',
    email: 'vib@manila.gov.ph',
    hours: 'Mon - Sat: 8:00 AM - 4:00 PM',
    lat: 14.6231,
    lng: 120.9634,
    fee: 'PHP 350 / day',
    holdingPeriodDays: 3,
    capacity: 50,
    occupied: 0,
    partnered: false,
    officerInCharge: 'Dr. Manuel Soriano, DVM'
  },
  {
    id: 'sh-pasig-pound',
    name: 'Pasig City Animal Welfare Facility & Pound',
    type: 'Municipal LGU Pound',
    city: 'Pasig City',
    address: 'Caruncho Ave., San Nicolas, Pasig City',
    phone: '+63 (2) 8643-1111',
    email: 'animalwelfare@pasigcity.gov.ph',
    hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
    lat: 14.5583,
    lng: 121.0825,
    fee: 'PHP 400 / day',
    holdingPeriodDays: 3,
    capacity: 40,
    occupied: 0,
    partnered: false,
    officerInCharge: 'Dr. Angela Bautista, DVM'
  },
  {
    id: 'sh-mby-sanctuary',
    name: 'MBY Pet Rescue & Sanctuary',
    type: 'Private No-Kill Sanctuary',
    city: 'Rizal / Metro East',
    address: '113 Pantay St., Sitio Pantay, Antipolo, Rizal',
    phone: '+63 (2) 8656-3456',
    email: 'mbypetrescue@yahoo.com',
    hours: 'Sat - Sun: 10:00 AM - 4:00 PM',
    lat: 14.5862,
    lng: 121.2185,
    fee: 'PHP 0 (Private Sanctuary)',
    holdingPeriodDays: 180,
    capacity: 300,
    occupied: 0,
    partnered: false,
    officerInCharge: 'Marita Baquiran'
  },
  {
    id: 'sh-mandaluyong-pound',
    name: 'Mandaluyong City Veterinary Services & Pound',
    type: 'Municipal LGU Pound',
    city: 'Mandaluyong City',
    address: 'Martinez St., Barangay Plainview, Mandaluyong City',
    phone: '+63 (2) 8532-5001 loc 523',
    email: 'veterinary@mandaluyong.gov.ph',
    hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
    lat: 14.5794,
    lng: 121.0359,
    fee: 'PHP 300 / day',
    holdingPeriodDays: 3,
    capacity: 35,
    occupied: 0,
    partnered: false,
    officerInCharge: 'Dr. Evelyn Morales, DVM'
  },
  {
    id: 'sh-caloocan-pound',
    name: 'Caloocan City Veterinary Office & Animal Pound',
    type: 'Municipal LGU Pound',
    city: 'Caloocan City',
    address: '8th Ave. cor. 8th St., Grace Park, Caloocan City',
    phone: '+63 (2) 8288-8811',
    email: 'vet@caloocancity.gov.ph',
    hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
    lat: 14.6507,
    lng: 120.9830,
    fee: 'PHP 350 / day',
    holdingPeriodDays: 3,
    capacity: 40,
    occupied: 0,
    partnered: false,
    officerInCharge: 'Dr. Teodoro Gomez, DVM'
  }
];

const SEED_RFID_TAGS = [
  { id: 'tag-1', code: 'RFID-882194', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-2', code: 'RFID-449102', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-3', code: 'RFID-109283', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-4', code: 'RFID-331908', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-5', code: 'RFID-771829', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-6', code: 'RFID-904123', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-7', code: 'RFID-662310', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null },
  { id: 'tag-8', code: 'RFID-551980', status: 'available', petId: null, petName: null, frequency: '134.2 kHz FDX-B', battery: '100%', lastScanned: null }
];

const SEED_SETTINGS = {
  systemName: 'PawTrack Municipal Gateway',
  holdingWindowHours: 72,
  dailyHoldingFeeDefault: 500,
  currency: 'PHP',
  autoNotifyOwnerOnIntake: true,
  autoNotifyOwnerOnExpiryWarning: true,
  expiryWarningHours: 12,
  rfidScannerBaudRate: 9600,
  municipalJurisdiction: 'National Capital Region (Metro Manila)',
  syncStatus: 'Active Multi-Tab Shared'
};

// Connected SSE clients
const sseClients = new Set();

function broadcastSSE(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

// SSE Keep-Alive Heartbeat every 25 seconds
setInterval(() => {
  for (const res of sseClients) {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      sseClients.delete(res);
    }
  }
}, 25000);

function getDefaultDatabase() {
  return {
    pets: [],
    impoundments: [],
    notifications: [],
    shelters: SEED_SHELTERS,
    rfidTags: SEED_RFID_TAGS,
    settings: SEED_SETTINGS,
    sightings: [],
    cases: []
  };
}

function getDatabase() {
  try {
    if (fs.existsSync(SHARED_DB_PATH)) {
      let raw = fs.readFileSync(SHARED_DB_PATH, 'utf8');
      raw = raw.replace(/^\uFEFF/, '').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (!Array.isArray(parsed.pets)) parsed.pets = [];
          if (!Array.isArray(parsed.impoundments)) parsed.impoundments = [];
          if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
          if (!Array.isArray(parsed.shelters) || parsed.shelters.length === 0) parsed.shelters = SEED_SHELTERS;
          if (!Array.isArray(parsed.rfidTags) || parsed.rfidTags.length === 0) parsed.rfidTags = SEED_RFID_TAGS;
          if (!Array.isArray(parsed.sightings)) parsed.sightings = [];
          if (!Array.isArray(parsed.cases)) parsed.cases = [];
          if (!parsed.settings) parsed.settings = SEED_SETTINGS;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('[Shared DB Read Error]:', err.message);
  }
  return getDefaultDatabase();
}

function saveDatabase(db) {
  try {
    const jsonStr = JSON.stringify(db, null, 2);
    fs.writeFileSync(SHARED_DB_PATH, jsonStr, 'utf8');
    return true;
  } catch (err) {
    console.error('[Shared DB Write Error, Retrying]:', err.message);
    try {
      setTimeout(() => {
        fs.writeFileSync(SHARED_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
      }, 50);
      return true;
    } catch (e2) {
      console.error('[Shared DB Fatal Write Error]:', e2.message);
      return false;
    }
  }
}

// Watch shared DB file for cross-server mutations
let watcher = null;
function setupWatcher() {
  if (watcher) {
    try { watcher.close(); } catch (e) {}
    watcher = null;
  }

  if (fs.existsSync(SHARED_DB_PATH)) {
    let debounceTimer = null;
    try {
      watcher = fs.watch(SHARED_DB_PATH, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          try {
            const db = getDatabase();
            broadcastSSE({ type: 'full_sync', db, timestamp: Date.now() });
          } catch (err) {}
        }, 80);
      });
      watcher.on('error', (err) => {
        console.warn('Watcher error:', err.message);
        setTimeout(setupWatcher, 1000);
      });
    } catch (err) {
      console.warn('File watch warning:', err.message);
    }
  }
}

// Initialize shared DB file if missing and setup watcher
if (!fs.existsSync(SHARED_DB_PATH)) {
  saveDatabase(getDefaultDatabase());
}
setupWatcher();

// Initialize Git Auto-Sync Watcher
try {
  autoSync.startWatcher();
} catch (e) {
  console.warn('Could not start Git Auto-Sync watcher:', e.message);
}

const server = http.createServer((req, res) => {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = req.url.split('?')[0];

  // API: Health & Status Check
  if (parsedUrl === '/api/health' || parsedUrl === '/api/ping') {
    const db = getDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'PawTrack Admin Gateway',
      port: PORT,
      timestamp: new Date().toISOString(),
      counts: {
        pets: (db.pets || []).length,
        impoundments: (db.impoundments || []).length,
        shelters: (db.shelters || []).length,
        rfidTags: (db.rfidTags || []).length,
        sightings: (db.sightings || []).length,
        cases: (db.cases || []).length
      },
      git: autoSync.getStatusSummary()
    }));
    return;
  }

  // API: Git Status Query
  if (parsedUrl === '/api/git/status' || parsedUrl === '/api/git-status') {
    const summary = autoSync.getStatusSummary();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(summary));
    return;
  }

  // API: Git Manual Sync / Force Push Trigger
  if ((parsedUrl === '/api/git/sync' || parsedUrl === '/api/git-sync') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const result = autoSync.performSync(payload.message);
        broadcastSSE({ type: 'git_synced', result, timestamp: Date.now() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 1: Real-time Server-Sent Events (SSE) stream
  if (parsedUrl === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', service: 'admin', port: PORT })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // API 2: Full State Sync (GET)
  if (parsedUrl === '/api/sync' && req.method === 'GET') {
    const db = getDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db));
    return;
  }

  // API 3: Update State Sync (POST)
  if (parsedUrl === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const db = getDatabase();
        if (!Array.isArray(db.pets)) db.pets = [];
        if (!Array.isArray(db.impoundments)) db.impoundments = [];
        if (!Array.isArray(db.notifications)) db.notifications = [];
        if (!Array.isArray(db.rfidTags)) db.rfidTags = [];
        if (!Array.isArray(db.sightings)) db.sightings = [];
        if (!Array.isArray(db.cases)) db.cases = [];

        if (payload.action === 'save_pet') {
          const pet = payload.pet;
          const idx = db.pets.findIndex(p => p.id === pet.id);
          if (idx >= 0) db.pets[idx] = pet;
          else db.pets.unshift(pet);

          // Update RFID Tag assignment
          if (pet.rfidTag) {
            const cleanTag = pet.rfidTag.trim().toUpperCase();
            const tagItem = db.rfidTags.find(t => (t.code || t.tag || '').toUpperCase() === cleanTag);
            if (tagItem) {
              tagItem.status = 'assigned';
              tagItem.petId = pet.id;
              tagItem.petName = pet.name;
              tagItem.lastScanned = new Date().toISOString();
            }
          }
        } else if (payload.action === 'update_pet_status') {
          const pet = db.pets.find(p => p.id === payload.petId);
          if (pet) {
            pet.status = payload.status;
            if (payload.extra) Object.assign(pet, payload.extra);
          }
        } else if (payload.action === 'create_impoundment') {
          db.impoundments.unshift(payload.impoundment);
          const pet = db.pets.find(p => p.id === payload.impoundment.petId);
          if (pet) pet.status = 'impounded';
        } else if (payload.action === 'claim_impoundment') {
          const imp = db.impoundments.find(i => i.id === payload.impoundId);
          if (imp) {
            imp.status = 'claimed';
            imp.claimedAt = new Date().toISOString();
            const pet = db.pets.find(p => p.id === imp.petId);
            if (pet) pet.status = 'safe';
          }
        } else if (payload.action === 'delete_pet') {
          const target = db.pets.find(p => p.id === payload.petId);
          db.pets = db.pets.filter(p => p.id !== payload.petId);
          if (target && target.rfidTag) {
            const cleanTag = target.rfidTag.trim().toUpperCase();
            const tagItem = db.rfidTags.find(t => (t.code || t.tag || '').toUpperCase() === cleanTag);
            if (tagItem) {
              tagItem.status = 'available';
              tagItem.petId = null;
              tagItem.petName = null;
            }
          }
        } else if (payload.action === 'create_sighting' || payload.action === 'save_sighting' || payload.action === 'update_sighting') {
          const sighting = payload.sighting;
          if (sighting) {
            const idx = db.sightings.findIndex(s => s.id === sighting.id);
            if (idx >= 0) db.sightings[idx] = sighting;
            else db.sightings.unshift(sighting);
          }
        } else if (payload.action === 'delete_sighting') {
          db.sightings = db.sightings.filter(s => s.id !== payload.sightingId);
        } else if (payload.action === 'set_key' && payload.key) {
          db[payload.key] = payload.data;
        } else if (payload.fullDatabase) {
          Object.assign(db, payload.fullDatabase);
        }

        saveDatabase(db);
        broadcastSSE({ type: 'mutation', payload, timestamp: Date.now() });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let safeUrl = parsedUrl;
  if (safeUrl === '/') safeUrl = '/index.html';

  const filePath = path.join(PUBLIC_DIR, safeUrl);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`\n[NOTICE] Port ${PORT} is already in use.`);
    console.warn(`PawTrack Admin service is already running on http://localhost:${PORT}`);
  } else {
    console.error('Server encountered an error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`  🐾 PawTrack Admin Console Server Running`);
  console.log(`  Local URL:    http://localhost:${PORT}`);
  console.log(`  Shared DB:    ${SHARED_DB_PATH}`);
  console.log(`  SSE Stream:   http://localhost:${PORT}/api/events`);
  console.log(`  Health API:   http://localhost:${PORT}/api/health`);
  console.log(`  Git Status:   http://localhost:${PORT}/api/git/status`);
  console.log(`  Git Sync:     POST http://localhost:${PORT}/api/git/sync`);
  console.log(`==================================================\n`);
});
