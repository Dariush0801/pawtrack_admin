/**
 * PawTrack Admin Unified Reactive State Store
 * Direct bidirectional LocalStorage integration with cross-tab live synchronization
 */

const STORAGE_KEYS = {
  PETS: 'pawtrack_pets',
  IMPOUNDMENTS: 'pawtrack_impoundments',
  NOTIFICATIONS: 'pawtrack_notifications',
  SHELTERS: 'pawtrack_shelters',
  CURRENT_USER: 'pawtrack_current_user',
  THEME: 'pawtrack_theme',
  RFID_TAGS: 'pawtrack_rfid_tags',
  ADMIN_LOGS: 'pawtrack_admin_logs',
  SETTINGS: 'pawtrack_system_settings',
  SIGHTINGS: 'pawtrack_sightings',
  CASES: 'pawtrack_cases'
};

// Clean Reset: 0 initial registered pets as requested
const SEED_PETS = [];
const SEED_IMPOUNDMENTS = [];
const SEED_NOTIFICATIONS = [];
const SEED_SIGHTINGS = [];
const SEED_CASES = [];

const SEED_SHELTERS = [
  {
    id: 'sh-1',
    name: 'Quezon City Animal Care & Adoption Facility',
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
    officerInCharge: 'Dr. Fernando Gomez, DVM'
  },
  {
    id: 'sh-2',
    name: 'Manila City Pound & Veterinary Inspection Board',
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
    officerInCharge: 'Dr. Manuel Soriano, DVM'
  },
  {
    id: 'sh-3',
    name: 'Pasig City Animal Welfare Facility',
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
    officerInCharge: 'Dr. Angela Bautista, DVM'
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

class AdminStore {
  constructor() {
    this.listeners = [];
    this.activeBackendUrl = null;
    this.eventSource = null;
    this.broadcastChannel = null;
    this.reconnectTimer = null;
    this.syncStatus = 'connecting';
    this.init();
    this.initBroadcastBus();
    this.initRealtimeSync();
  }

  init() {
    // Safe initialization: Only set defaults if keys do not exist in localStorage
    if (localStorage.getItem(STORAGE_KEYS.PETS) === null) {
      localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(SEED_PETS));
    }
    if (localStorage.getItem(STORAGE_KEYS.IMPOUNDMENTS) === null) {
      localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(SEED_IMPOUNDMENTS));
    }
    if (localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) === null) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (localStorage.getItem(STORAGE_KEYS.SHELTERS) === null) {
      localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(SEED_SHELTERS));
    }
    if (localStorage.getItem(STORAGE_KEYS.RFID_TAGS) === null) {
      localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(SEED_RFID_TAGS));
    }
    if (localStorage.getItem(STORAGE_KEYS.SETTINGS) === null) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
    }
    if (localStorage.getItem(STORAGE_KEYS.SIGHTINGS) === null) {
      localStorage.setItem(STORAGE_KEYS.SIGHTINGS, JSON.stringify(SEED_SIGHTINGS));
    }
    if (localStorage.getItem(STORAGE_KEYS.CASES) === null) {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
    }
    if (localStorage.getItem(STORAGE_KEYS.ADMIN_LOGS) === null) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_LOGS, JSON.stringify([
        {
          id: 'log-1',
          action: 'System Boot',
          details: 'PawTrack Admin Console initialized and synced with local storage.',
          operator: 'Super Admin',
          timestamp: new Date().toISOString()
        }
      ]));
    }
    localStorage.setItem('pawtrack_schema_v', '5.1');
  }

  initBroadcastBus() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('pawtrack_sync_bus');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.handleIncomingBroadcast(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported, using storage fallback.');
    }

    // Cross-tab fallback listener
    window.addEventListener('storage', (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        this.notify('cross_tab_sync');
      }
    });
  }

  handleIncomingBroadcast(data) {
    if (data.type === 'mutation' && data.payload) {
      this.syncFromBackend();
    } else if (data.type === 'state_push' && data.db) {
      this.applyDatabaseState(data.db, 'broadcast_sync');
    }
  }

  getEndpoints() {
    const list = [];
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
      list.push(window.location.origin);
    }
    list.push(''); // Relative /api/sync
    list.push('http://localhost:8080'); // Admin server
    list.push('http://localhost:3000'); // Owner server
    list.push('http://127.0.0.1:8080');
    list.push('http://127.0.0.1:3000');
    return Array.from(new Set(list));
  }

  async discoverBackend() {
    const endpoints = this.getEndpoints();
    for (const url of endpoints) {
      try {
        const testUrl = (url ? url : '') + '/api/sync';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(testUrl, { signal: controller.signal, mode: 'cors' });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.activeBackendUrl = url;
          this.syncStatus = 'connected';
          return url;
        }
      } catch (err) {
        // try next endpoint
      }
    }
    this.syncStatus = 'offline_local';
    return null;
  }

  applyDatabaseState(db, source = 'backend') {
    if (!db) return;
    try {
      if (Array.isArray(db.pets)) {
        localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(db.pets));
      }
      if (Array.isArray(db.impoundments)) {
        localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(db.impoundments));
      }
      if (Array.isArray(db.notifications)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(db.notifications));
      }
      if (Array.isArray(db.shelters) && db.shelters.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(db.shelters));
      }
      if (Array.isArray(db.rfidTags) && db.rfidTags.length > 0) {
        localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(db.rfidTags));
      }
      if (Array.isArray(db.sightings)) {
        localStorage.setItem(STORAGE_KEYS.SIGHTINGS, JSON.stringify(db.sightings));
      }
      if (Array.isArray(db.cases)) {
        localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(db.cases));
      }
      if (db.settings && typeof db.settings === 'object') {
        const curr = this.getSettings();
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...curr, ...db.settings }));
      }
      this.notify(source);
    } catch (e) {
      console.error('Error applying database state:', e);
    }
  }

  async initRealtimeSync() {
    await this.discoverBackend();
    await this.syncFromBackend();
    this.connectSSE();
  }

  connectSSE() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
      this.eventSource = null;
    }

    const sseUrl = (this.activeBackendUrl !== null ? this.activeBackendUrl : '') + '/api/events';
    
    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.syncStatus = 'live_sse';
        this.notify('connection_open');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'full_sync' && msg.db) {
            this.applyDatabaseState(msg.db, 'realtime_sync');
          } else if (msg.type === 'mutation') {
            this.syncFromBackend();
          }
        } catch (e) {}
      };

      this.eventSource.onerror = () => {
        try { this.eventSource.close(); } catch (e) {}
        this.eventSource = null;
        this.syncStatus = 'reconnecting';
        
        // Exponential/debounced reconnect & rediscover
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(async () => {
          await this.discoverBackend();
          this.connectSSE();
        }, 3500);
      };
    } catch (err) {
      // SSE not supported or offline
    }
  }

  async syncFromBackend() {
    const candidateUrls = [this.activeBackendUrl, ...this.getEndpoints()].filter(u => u !== undefined && u !== null);
    const unique = Array.from(new Set(candidateUrls));

    for (const url of unique) {
      try {
        const fetchUrl = (url ? url : '') + '/api/sync';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(fetchUrl, { signal: controller.signal, mode: 'cors' });
        clearTimeout(timeoutId);
        if (res.ok) {
          const db = await res.json();
          if (db) {
            this.activeBackendUrl = url;
            this.applyDatabaseState(db, 'backend_fetch');
            return true;
          }
        }
      } catch (err) {}
    }
    return false;
  }

  pushBackendMutation(action, payload = {}) {
    // Broadcast locally to tabs first for zero-latency response
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'mutation', action, payload, timestamp: Date.now() });
      } catch (e) {}
    }

    const payloadStr = JSON.stringify({ action, ...payload });
    const endpoints = Array.from(new Set([this.activeBackendUrl, ...this.getEndpoints()].filter(Boolean)));
    if (endpoints.length === 0) endpoints.push('');

    endpoints.forEach(url => {
      try {
        const dest = (url ? url : '') + '/api/sync';
        fetch(dest, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
          mode: 'cors'
        }).catch(() => {});
      } catch (e) {}
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(eventReason = 'update') {
    this.listeners.forEach(fn => fn(this, eventReason));
  }

  // --- Audit Logs ---
  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_LOGS)) || [];
    } catch {
      return [];
    }
  }

  logAction(action, details, operator = 'Admin Controller') {
    const logs = this.getLogs();
    const newLog = {
      id: 'log-' + Date.now(),
      action,
      details,
      operator,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGS, JSON.stringify(logs));
    return newLog;
  }

  // --- Pets API ---
  getPets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PETS)) || [];
    } catch {
      return [];
    }
  }

  getPetById(id) {
    return this.getPets().find(p => p.id === id);
  }

  getPetByRFID(rfidTag) {
    if (!rfidTag) return null;
    const clean = rfidTag.trim().toUpperCase();
    return this.getPets().find(p => (p.rfidTag || '').toUpperCase() === clean);
  }

  savePet(petData) {
    const pets = this.getPets();
    const existingIndex = pets.findIndex(p => p.id === petData.id);
    let isNew = false;

    if (existingIndex >= 0) {
      pets[existingIndex] = { ...pets[existingIndex], ...petData, lastUpdated: new Date().toISOString() };
      this.logAction('Updated Pet', `Modified profile for ${petData.name} (${petData.rfidTag || 'No RFID'})`);
    } else {
      isNew = true;
      petData.id = petData.id || 'pet-' + Date.now();
      petData.registeredDate = petData.registeredDate || new Date().toISOString().split('T')[0];
      pets.unshift(petData);
      this.logAction('Registered Pet', `Added new pet ${petData.name} with RFID ${petData.rfidTag}`);
    }

    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));

    // Ensure RFID tag inventory is synced
    if (petData.rfidTag) {
      this.syncRfidAssignment(petData.rfidTag, petData.id, petData.name);
    }

    this.pushBackendMutation('save_pet', { pet: petData });
    this.notify('pets_updated');
    return petData;
  }

  deletePet(petId) {
    const pets = this.getPets();
    const target = pets.find(p => p.id === petId);
    if (!target) return false;

    const filtered = pets.filter(p => p.id !== petId);
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(filtered));

    // Free RFID Tag
    if (target.rfidTag) {
      this.freeRfidTag(target.rfidTag);
    }

    this.pushBackendMutation('delete_pet', { petId });
    this.logAction('Deleted Pet', `Removed pet ${target.name} (${target.id}) from registry.`);
    this.notify('pets_deleted');
    return true;
  }

  updatePetStatus(petId, status, extraFields = {}) {
    const pets = this.getPets();
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      const prev = pet.status;
      pet.status = status;
      Object.assign(pet, extraFields);
      localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
      this.pushBackendMutation('update_pet_status', { petId, status, extra: extraFields });
      this.logAction('Changed Pet Status', `Status for ${pet.name} changed from ${prev} to ${status}`);
      this.notify('pet_status_changed');
    }
    return pet;
  }

  // --- Impoundments API ---
  getImpoundments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.IMPOUNDMENTS)) || [];
    } catch {
      return [];
    }
  }

  getImpoundmentById(id) {
    return this.getImpoundments().find(i => i.id === id);
  }

  saveImpoundment(data) {
    const impoundments = this.getImpoundments();
    const index = impoundments.findIndex(i => i.id === data.id);

    if (index >= 0) {
      impoundments[index] = { ...impoundments[index], ...data };
      this.logAction('Updated Impoundment', `Modified impound case ${data.id} for ${data.petName}`);
    } else {
      const newImpound = {
        id: data.id || 'imp-' + Date.now(),
        intakeDate: data.intakeDate || new Date().toISOString(),
        claimDeadline: data.claimDeadline || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        status: data.status || 'active_impounded',
        notificationSent: true,
        ...data
      };
      impoundments.unshift(newImpound);

      // Update pet status
      if (data.petId) {
        this.updatePetStatus(data.petId, 'impounded');
      }

      // Add alert notification
      this.addNotification({
        type: 'impound_alert',
        title: `Impoundment Notice: Pet "${data.petName || 'Unknown'}"`,
        message: `RFID: ${data.rfidTag} logged at ${data.shelterName || 'Shelter Facility'} (${data.cageNumber || 'Bay B-01'}). 72-hour holding window is active.`,
        petId: data.petId,
        impoundId: newImpound.id
      });

      this.pushBackendMutation('create_impoundment', { impoundment: newImpound });
      this.logAction('Created Impoundment', `Logged impoundment for ${data.petName} at ${data.shelterName}`);
      data = newImpound;
    }

    localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(impoundments));
    this.pushBackendMutation('set_key', { key: 'impoundments', data: impoundments });
    this.notify('impoundments_updated');
    return data;
  }

  claimImpoundment(impoundId, operator = 'Admin') {
    const impoundments = this.getImpoundments();
    const imp = impoundments.find(i => i.id === impoundId);
    if (imp) {
      imp.status = 'claimed';
      imp.claimedAt = new Date().toISOString();
      imp.claimedByOfficer = operator;
      localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(impoundments));

      if (imp.petId) {
        this.updatePetStatus(imp.petId, 'safe');
      }

      this.addNotification({
        type: 'reunited',
        title: `Pet Claimed & Released`,
        message: `Pet "${imp.petName}" was officially claimed by guardian at ${imp.shelterName}.`,
        petId: imp.petId,
        impoundId: imp.id
      });

      this.pushBackendMutation('claim_impoundment', { impoundId });
      this.logAction('Claimed Pet', `Completed release clearance for case ${imp.id} (${imp.petName})`);
      this.notify('impoundment_claimed');
    }
    return imp;
  }

  extendImpoundDeadline(impoundId, additionalHours = 24) {
    const impoundments = this.getImpoundments();
    const imp = impoundments.find(i => i.id === impoundId);
    if (imp) {
      const current = new Date(imp.claimDeadline).getTime();
      imp.claimDeadline = new Date(current + additionalHours * 3600 * 1000).toISOString();
      localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(impoundments));
      this.pushBackendMutation('set_key', { key: 'impoundments', data: impoundments });
      this.logAction('Extended Deadline', `Extended holding window for ${imp.petName} by ${additionalHours} hours.`);
      this.notify('impound_extended');
    }
    return imp;
  }

  // --- Shelters API ---
  getShelters() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHELTERS)) || SEED_SHELTERS;
    } catch {
      return SEED_SHELTERS;
    }
  }

  saveShelter(shelterData) {
    const shelters = this.getShelters();
    const index = shelters.findIndex(s => s.id === shelterData.id);

    if (index >= 0) {
      shelters[index] = { ...shelters[index], ...shelterData };
      this.logAction('Updated Facility', `Updated shelter details for ${shelterData.name}`);
    } else {
      shelterData.id = shelterData.id || 'sh-' + Date.now();
      shelters.push(shelterData);
      this.logAction('Added Facility', `Added new shelter facility ${shelterData.name}`);
    }

    localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(shelters));
    this.pushBackendMutation('set_key', { key: 'shelters', data: shelters });
    this.notify('shelters_updated');
    return shelterData;
  }

  deleteShelter(shelterId) {
    const shelters = this.getShelters().filter(s => s.id !== shelterId);
    localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(shelters));
    this.pushBackendMutation('set_key', { key: 'shelters', data: shelters });
    this.logAction('Deleted Facility', `Removed facility with ID ${shelterId}`);
    this.notify('shelters_deleted');
    return true;
  }

  // --- RFID Tag Management ---
  getRfidTags() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RFID_TAGS)) || SEED_RFID_TAGS;
    } catch {
      return SEED_RFID_TAGS;
    }
  }

  syncRfidAssignment(rfidCode, petId, petName) {
    if (!rfidCode) return;
    const clean = rfidCode.trim().toUpperCase();
    const tags = this.getRfidTags();
    let tag = tags.find(t => ((t.code || t.tag || '').toUpperCase() === clean));
    if (tag) {
      tag.status = 'assigned';
      tag.petId = petId;
      tag.petName = petName;
      tag.lastScanned = new Date().toISOString();
      if (!tag.code && tag.tag) tag.code = tag.tag;
    } else {
      tags.push({
        id: 'tag-' + Date.now(),
        code: clean,
        tag: clean,
        status: 'assigned',
        petId,
        petName,
        frequency: '134.2 kHz FDX-B',
        battery: '100%',
        lastScanned: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(tags));
    this.pushBackendMutation('set_key', { key: 'rfidTags', data: tags });
  }

  freeRfidTag(rfidCode) {
    if (!rfidCode) return;
    const clean = rfidCode.trim().toUpperCase();
    const tags = this.getRfidTags();
    let tag = tags.find(t => ((t.code || t.tag || '').toUpperCase() === clean));
    if (tag) {
      tag.status = 'available';
      tag.petId = null;
      tag.petName = null;
      localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(tags));
      this.pushBackendMutation('set_key', { key: 'rfidTags', data: tags });
    }
  }

  createRfidTag(tagData) {
    const tags = this.getRfidTags();
    const newTag = {
      id: 'tag-' + Date.now(),
      status: 'available',
      frequency: '134.2 kHz FDX-B',
      battery: '100%',
      ...tagData
    };
    tags.unshift(newTag);
    localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(tags));
    this.pushBackendMutation('set_key', { key: 'rfidTags', data: tags });
    this.logAction('Generated RFID Tag', `Provisioned tag ${newTag.code}`);
    this.notify('rfid_updated');
    return newTag;
  }

  // --- Notifications & Broadcasts API ---
  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    } catch {
      return [];
    }
  }

  addNotification(notif) {
    const notifs = this.getNotifications();
    const newNotif = {
      id: 'notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.pushBackendMutation('set_key', { key: 'notifications', data: notifs });
    this.logAction('Broadcast Alert', `Dispatched notification: "${newNotif.title}"`);
    this.notify('notifications_updated');
    return newNotif;
  }

  deleteNotification(notifId) {
    const notifs = this.getNotifications().filter(n => n.id !== notifId);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.pushBackendMutation('set_key', { key: 'notifications', data: notifs });
    this.notify('notifications_updated');
  }

  markAllNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.pushBackendMutation('set_key', { key: 'notifications', data: notifs });
    this.notify('notifications_updated');
  }

  // --- System Settings ---
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || SEED_SETTINGS;
    } catch {
      return SEED_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const merged = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    this.pushBackendMutation('set_key', { key: 'settings', data: merged });
    this.logAction('Updated Settings', 'Municipal gateway configuration updated.');
    this.notify('settings_updated');
    return merged;
  }

  // --- Sightings & Unregistered Stray Pet Reports API ---
  getSightings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SIGHTINGS)) || [];
    } catch {
      return [];
    }
  }

  getSightingById(id) {
    return this.getSightings().find(s => s.id === id);
  }

  saveSighting(sightingData) {
    const sightings = this.getSightings();
    const existingIndex = sightings.findIndex(s => s.id === sightingData.id);

    if (existingIndex >= 0) {
      sightings[existingIndex] = { ...sightings[existingIndex], ...sightingData, lastUpdated: new Date().toISOString() };
      this.logAction('Updated Found Report', `Updated report ${sightingData.id} (${sightingData.species || 'Pet'} found at ${sightingData.location || 'Unknown'})`);
    } else {
      sightingData.id = sightingData.id || 'SIGHT-' + Date.now().toString().slice(-6);
      sightingData.timestamp = sightingData.timestamp || new Date().toISOString();
      sightingData.reportType = sightingData.reportType || 'found';
      sightings.unshift(sightingData);
      this.logAction('Created Found Report', `Logged report for ${sightingData.species || 'Pet'} at ${sightingData.location || 'Unknown'}`);
    }

    localStorage.setItem(STORAGE_KEYS.SIGHTINGS, JSON.stringify(sightings));
    this.pushBackendMutation('create_sighting', { sighting: sightingData });
    this.pushBackendMutation('set_key', { key: 'sightings', data: sightings });
    this.notify('sightings_updated');
    return sightingData;
  }

  deleteSighting(sightingId) {
    const sightings = this.getSightings();
    const target = sightings.find(s => s.id === sightingId);
    if (!target) return false;

    const filtered = sightings.filter(s => s.id !== sightingId);
    localStorage.setItem(STORAGE_KEYS.SIGHTINGS, JSON.stringify(filtered));

    this.pushBackendMutation('delete_sighting', { sightingId });
    this.pushBackendMutation('set_key', { key: 'sightings', data: filtered });
    this.logAction('Deleted Found Report', `Removed report ${target.id} (${target.species} found at ${target.location || 'Unknown'})`);
    this.notify('sightings_deleted');
    return true;
  }

  // --- Backup, Export & Factory Reset ---
  exportDatabaseJSON() {
    const data = {
      exportTimestamp: new Date().toISOString(),
      schemaVersion: '5.2',
      pets: this.getPets(),
      impoundments: this.getImpoundments(),
      shelters: this.getShelters(),
      notifications: this.getNotifications(),
      rfidTags: this.getRfidTags(),
      sightings: this.getSightings(),
      settings: this.getSettings(),
      logs: this.getLogs()
    };
    return JSON.stringify(data, null, 2);
  }

  importDatabaseJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.pets) localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(data.pets));
      if (data.impoundments) localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(data.impoundments));
      if (data.shelters) localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(data.shelters));
      if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      if (data.rfidTags) localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(data.rfidTags));
      if (data.sightings) localStorage.setItem(STORAGE_KEYS.SIGHTINGS, JSON.stringify(data.sightings));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.logs) localStorage.setItem(STORAGE_KEYS.ADMIN_LOGS, JSON.stringify(data.logs));

      this.pushBackendMutation('full_sync', {
        fullDatabase: {
          pets: data.pets || this.getPets(),
          impoundments: data.impoundments || this.getImpoundments(),
          shelters: data.shelters || this.getShelters(),
          notifications: data.notifications || this.getNotifications(),
          rfidTags: data.rfidTags || this.getRfidTags(),
          sightings: data.sightings || this.getSightings(),
          settings: data.settings || this.getSettings()
        }
      });

      this.logAction('Restored Database', 'Imported data bundle successfully.');
      this.notify('database_restored');
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(SEED_PETS));
    localStorage.setItem(STORAGE_KEYS.IMPOUNDMENTS, JSON.stringify(SEED_IMPOUNDMENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(SEED_SHELTERS));
    localStorage.setItem(STORAGE_KEYS.RFID_TAGS, JSON.stringify(SEED_RFID_TAGS));
    localStorage.setItem(STORAGE_KEYS.SIGHTINGS, JSON.stringify(SEED_SIGHTINGS));
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(SEED_CASES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));

    this.pushBackendMutation('full_sync', {
      fullDatabase: {
        pets: SEED_PETS,
        impoundments: SEED_IMPOUNDMENTS,
        notifications: SEED_NOTIFICATIONS,
        shelters: SEED_SHELTERS,
        rfidTags: SEED_RFID_TAGS,
        sightings: SEED_SIGHTINGS,
        cases: SEED_CASES,
        settings: SEED_SETTINGS
      }
    });

    this.logAction('Factory Reset', 'Restored all seed data to factory defaults.');
    this.notify('factory_reset');
  }
}

// Global Store Instance
if (typeof window !== 'undefined') {
  window.adminStore = new AdminStore();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminStore;
}
