/**
 * PawTrack Admin Main Controller & Navigation Engine
 * High-performance SPA routing, command palette (Ctrl+K), slideout drawers, and reactive listeners
 */

class AdminApp {
  constructor() {
    this.currentRoute = 'activation';
    this.init();
  }

  init() {
    this.initSeenTracking();
    this.initAdminGate();
    this.initUserMenu();
    this.initEventListeners();
    this.initCommandPalette();
    this.initKeyboardShortcuts();
    this.handleRoute();

    // Subscribe to store updates
    window.adminStore.subscribe((store, reason) => {
      this.renderView(this.currentRoute);
      this.updateSidebarBadges();
      this.updateSyncIndicator();
      if (reason === 'cross_tab_sync' || reason === 'broadcast_sync') {
        this.showToast('Data synchronized live with PawTrack Hub', 'info', 1800);
      }
    });

    this.updateSidebarBadges();
    this.updateSyncIndicator();
  }

  initUserMenu() {
    const avatarTrigger = document.getElementById('admin-avatar-trigger');
    const dropdown = document.getElementById('admin-user-dropdown');
    const configBtn = document.getElementById('menu-btn-config');
    const ownerBtn = document.getElementById('menu-btn-owner-app');
    const logoutBtn = document.getElementById('admin-logout-btn');

    if (!avatarTrigger || !dropdown) return;

    avatarTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== avatarTrigger) {
        dropdown.classList.remove('open');
      }
    });

    configBtn?.addEventListener('click', () => {
      dropdown.classList.remove('open');
      window.location.hash = '#settings';
    });

    ownerBtn?.addEventListener('click', () => {
      dropdown.classList.remove('open');
      this.openOwnerApp();
    });

    logoutBtn?.addEventListener('click', () => {
      dropdown.classList.remove('open');
      this.logoutAdmin();
    });
  }

  logoutAdmin() {
    sessionStorage.setItem('pawtrack_admin_authenticated', 'false');
    const gate = document.getElementById('admin-gate-backdrop');
    const passInput = document.getElementById('admin-pass-input');
    const errorMsg = document.getElementById('admin-gate-error');

    if (errorMsg) errorMsg.style.display = 'none';
    if (passInput) {
      passInput.value = '';
      passInput.classList.remove('input-error');
    }

    if (gate) {
      gate.style.display = 'flex';
      gate.style.opacity = '1';
      gate.style.pointerEvents = 'auto';
      gate.classList.add('open');
      setTimeout(() => passInput?.focus(), 150);
    }

    this.showToast('Admin console locked. Please authenticate to continue.', 'info');
  }

  updateSyncIndicator() {
    const el = document.getElementById('live-sync-indicator-text');
    const dot = document.getElementById('live-sync-indicator-dot');
    if (!el) return;

    const status = window.adminStore?.syncStatus || 'connected';
    if (status === 'live_sse') {
      el.textContent = 'Realtime SSE Synced';
      if (dot) { dot.className = 'pulse-emerald'; dot.style.background = '#10b981'; }
    } else if (status === 'connected' || status === 'broadcast_sync') {
      el.textContent = 'Hub Connected';
      if (dot) { dot.className = 'pulse-emerald'; dot.style.background = '#10b981'; }
    } else if (status === 'reconnecting') {
      el.textContent = 'Sync Reconnecting…';
      if (dot) { dot.className = ''; dot.style.background = '#f59e0b'; }
    } else {
      el.textContent = 'Local Store Synced';
      if (dot) { dot.className = ''; dot.style.background = '#3b82f6'; }
    }
  }

  openOwnerApp() {
    // Probe if Owner server is running on port 3000
    fetch('http://localhost:3000/api/health', { mode: 'cors' })
      .then(res => {
        if (res.ok) window.open('http://localhost:3000', '_blank');
        else window.open('../PawTrack/index.html', '_blank');
      })
      .catch(() => {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
          window.open('http://localhost:3000', '_blank');
        } else {
          window.open('../PawTrack/index.html', '_blank');
        }
      });
  }

  initAdminGate() {
    const gate = document.getElementById('admin-gate-backdrop');
    const form = document.getElementById('admin-login-form');
    const passInput = document.getElementById('admin-pass-input');
    const errorMsg = document.getElementById('admin-gate-error');

    const isAuthenticated = sessionStorage.getItem('pawtrack_admin_authenticated');
    if (isAuthenticated === 'false') {
      if (gate) {
        gate.style.display = 'flex';
        gate.style.opacity = '1';
        gate.style.pointerEvents = 'auto';
        gate.classList.add('open');
      }
    } else {
      sessionStorage.setItem('pawtrack_admin_authenticated', 'true');
      if (gate) {
        gate.style.display = 'none';
        gate.style.opacity = '0';
        gate.style.pointerEvents = 'none';
        gate.classList.remove('open');
      }
    }

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (passInput?.value || '').trim();

      if (val === 'admin4j') {
        sessionStorage.setItem('pawtrack_admin_authenticated', 'true');
        if (gate) {
          gate.style.opacity = '0';
          gate.style.pointerEvents = 'none';
          gate.classList.remove('open');
          setTimeout(() => { gate.style.display = 'none'; }, 200);
        }
        if (passInput) {
          passInput.value = '';
          passInput.classList.remove('input-error');
        }
        if (errorMsg) errorMsg.style.display = 'none';
        this.showToast('Admin access authorized. Welcome to Municipal Console.', 'success');
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
        passInput?.classList.add('input-error');
        passInput?.focus();
      }
    });
  }

  initEventListeners() {
    // Hash routing
    window.addEventListener('hashchange', () => this.handleRoute());

    // Navigation item clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-route');
        if (route) {
          window.location.hash = '#' + route;
        }
      });
    });

    // Global Search trigger (Ctrl+K)
    document.getElementById('global-search-trigger')?.addEventListener('click', () => {
      this.openCommandPalette();
    });

    // Drawer backdrop click to close
    document.getElementById('app-drawer-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'app-drawer-backdrop') {
        this.closeDrawer();
      }
    });

    // Modal backdrop click to close
    document.getElementById('app-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'app-modal-backdrop') {
        this.closeModal();
      }
    });

    // Open User App direct button
    document.getElementById('btn-open-user-app')?.addEventListener('click', () => {
      this.openOwnerApp();
    });
    document.getElementById('btn-topbar-open-owner')?.addEventListener('click', () => {
      this.openOwnerApp();
    });
  }

  initSeenTracking() {
    const store = window.adminStore;
    const pets = store.getPets ? store.getPets() : [];
    const sightings = store.getSightings ? store.getSightings() : [];
    const impoundments = store.getImpoundments ? store.getImpoundments() : [];
    const notifs = store.getNotifications ? store.getNotifications() : [];

    const activeImpounds = impoundments.filter(i => i.status === 'active_impounded').length;
    const unreadNotifs = notifs.filter(n => !n.read).length;

    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem('pawtrack_seen_counts'));
    } catch (e) {
      saved = null;
    }

    if (!saved) {
      this.seenCounts = {
        pets: pets.length,
        sightings: sightings.length,
        impoundments: activeImpounds,
        notifs: unreadNotifs
      };
      try {
        sessionStorage.setItem('pawtrack_seen_counts', JSON.stringify(this.seenCounts));
      } catch (e) {}
    } else {
      this.seenCounts = saved;
    }
  }

  markRouteSeen(route) {
    if (!this.seenCounts) this.initSeenTracking();
    const store = window.adminStore;

    if (route === 'pets' || route === 'unregistered') {
      const pets = store.getPets ? store.getPets() : [];
      const sightings = store.getSightings ? store.getSightings() : [];
      this.seenCounts.pets = pets.length;
      this.seenCounts.sightings = sightings.length;
    } else if (route === 'impoundments') {
      const impoundments = store.getImpoundments ? store.getImpoundments() : [];
      this.seenCounts.impoundments = impoundments.filter(i => i.status === 'active_impounded').length;
    } else if (route === 'notifs') {
      const notifs = store.getNotifications ? store.getNotifications() : [];
      this.seenCounts.notifs = notifs.filter(n => !n.read).length;
    }

    try {
      sessionStorage.setItem('pawtrack_seen_counts', JSON.stringify(this.seenCounts));
    } catch (e) {}

    this.updateSidebarBadges();
  }

  handleRoute() {
    const rawHash = (window.location.hash || '#activation').replace('#', '');
    const validRoutes = ['activation', 'pets', 'impoundments', 'shelters', 'rfid', 'notifs', 'settings'];
    this.currentRoute = rawHash === 'unregistered' ? 'pets' : (validRoutes.includes(rawHash) ? rawHash : 'activation');

    // Update active nav state
    document.querySelectorAll('.nav-item').forEach(item => {
      const route = item.getAttribute('data-route');
      if (route === this.currentRoute) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    this.markRouteSeen(this.currentRoute);
    this.renderView(this.currentRoute);
  }

  renderView(route) {
    const container = document.getElementById('view-container');
    if (!container) return;

    try {
      switch (route) {
        case 'activation':
          if (window.ActivationView) window.ActivationView.render(container);
          break;
        case 'pets':
        case 'unregistered':
          if (window.PetsView) window.PetsView.render(container);
          break;
        case 'impoundments':
          if (window.ImpoundmentsView) window.ImpoundmentsView.render(container);
          break;
        case 'shelters':
          if (window.SheltersView) window.SheltersView.render(container);
          break;
        case 'rfid':
          if (window.RfidView) window.RfidView.render(container);
          break;
        case 'notifs':
          if (window.NotifsView) window.NotifsView.render(container);
          break;
        case 'settings':
          if (window.SettingsView) window.SettingsView.render(container);
          break;
        default:
          if (window.ActivationView) window.ActivationView.render(container);
      }
    } catch (err) {
      console.error(`Error rendering view ${route}:`, err);
      container.innerHTML = `
        <div class="nock-card" style="padding: 32px; text-align: center;">
          <h3 style="color: var(--color-red); margin-bottom: 8px;">View Render Notice</h3>
          <p style="color: var(--ink-muted); font-size: 13px; margin-bottom: 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="window.adminApp.renderView('${route}')">Retry</button>
        </div>
      `;
    }
  }

  updateSidebarBadges() {
    if (!this.seenCounts) this.initSeenTracking();
    const store = window.adminStore;
    const pets = store.getPets ? store.getPets() : [];
    const sightings = store.getSightings ? store.getSightings() : [];
    const impoundments = store.getImpoundments ? store.getImpoundments() : [];
    const notifs = store.getNotifications ? store.getNotifications() : [];

    const activeImpounds = impoundments.filter(i => i.status === 'active_impounded').length;
    const unreadNotifs = notifs.filter(n => !n.read).length;

    // Only count items added above the last seen count
    const newPets = Math.max(0, pets.length - (this.seenCounts.pets || 0));
    const newSightings = Math.max(0, sightings.length - (this.seenCounts.sightings || 0));
    const newRegistryTotal = newPets + newSightings;
    const newImpounds = Math.max(0, activeImpounds - (this.seenCounts.impoundments || 0));
    const newNotifs = Math.max(0, unreadNotifs - (this.seenCounts.notifs || 0));

    const petBadge = document.getElementById('badge-pets-count');
    if (petBadge) {
      if (newRegistryTotal > 0 && this.currentRoute !== 'pets') {
        petBadge.textContent = `+${newRegistryTotal}`;
        petBadge.style.display = 'inline-flex';
      } else {
        petBadge.textContent = '';
        petBadge.style.display = 'none';
      }
    }

    const impoundBadge = document.getElementById('badge-impounds-count');
    if (impoundBadge) {
      if (newImpounds > 0 && this.currentRoute !== 'impoundments') {
        impoundBadge.textContent = `+${newImpounds}`;
        impoundBadge.style.display = 'inline-flex';
        impoundBadge.classList.add('danger');
      } else {
        impoundBadge.textContent = '';
        impoundBadge.style.display = 'none';
        impoundBadge.classList.remove('danger');
      }
    }

    const notifBadge = document.getElementById('badge-notifs-count');
    if (notifBadge) {
      if (newNotifs > 0 && this.currentRoute !== 'notifs') {
        notifBadge.textContent = `+${newNotifs}`;
        notifBadge.style.display = 'inline-flex';
      } else {
        notifBadge.textContent = '';
        notifBadge.style.display = 'none';
      }
    }
  }

  // --- Drawer API ---
  openDrawer(htmlContent) {
    const backdrop = document.getElementById('app-drawer-backdrop');
    const panel = document.getElementById('app-drawer-panel');
    if (backdrop && panel) {
      panel.innerHTML = htmlContent;
      backdrop.classList.add('open');
    }
    return panel;
  }

  closeDrawer() {
    const backdrop = document.getElementById('app-drawer-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  // --- Modal API ---
  openModalContent(htmlContent) {
    const backdrop = document.getElementById('app-modal-backdrop');
    const box = document.getElementById('app-modal-box');
    if (backdrop && box) {
      box.innerHTML = htmlContent;
      backdrop.classList.add('open');
    }
    return box;
  }

  closeModal() {
    const backdrop = document.getElementById('app-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  // --- Toast Manager ---
  showToast(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
    if (type === 'success') iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    if (type === 'error') iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    if (type === 'warning') iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

    toast.innerHTML = `
      <span style="display: inline-flex; align-items: center; flex-shrink: 0;">${iconSvg}</span>
      <span style="flex: 1; line-height: 1.35; font-size: 12px;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // --- Command Palette (Ctrl+K) ---
  initCommandPalette() {
    const backdrop = document.getElementById('command-palette-backdrop');
    const input = document.getElementById('command-palette-input');
    const list = document.getElementById('command-palette-list');

    if (!backdrop || !input || !list) return;

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeCommandPalette();
    });

    input.addEventListener('input', (e) => {
      this.filterCommandPalette(e.target.value);
    });
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeCommandPalette();
        this.closeModal();
        this.closeDrawer();
      }
    });
  }

  openCommandPalette() {
    const backdrop = document.getElementById('command-palette-backdrop');
    const input = document.getElementById('command-palette-input');
    if (backdrop && input) {
      backdrop.classList.add('open');
      input.value = '';
      input.focus();
      this.filterCommandPalette('');
    }
  }

  closeCommandPalette() {
    const backdrop = document.getElementById('command-palette-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  filterCommandPalette(query) {
    const list = document.getElementById('command-palette-list');
    if (!list) return;

    const store = window.adminStore;
    const pets = store.getPets();
    const shelters = store.getShelters();
    const q = query.toLowerCase().trim();

    const commands = [
      { label: 'Go to System Activation Dashboard', route: 'activation', cat: 'Navigation' },
      { label: 'Manage Pet Registry (All Registered Pets)', route: 'pets', cat: 'Navigation' },
      { label: 'View Unregistered Stray & Found Reports', route: 'pets', filter: 'unregistered', cat: 'Navigation' },
      { label: 'View Impoundment Queue & 72h SLA', route: 'impoundments', cat: 'Navigation' },
      { label: 'Inspect Shelter Facilities', route: 'shelters', cat: 'Navigation' },
      { label: 'RFID Tag Provisioning & Hardware', route: 'rfid', cat: 'Navigation' },
      { label: 'Dispatch Emergency Broadcast', route: 'notifs', cat: 'Navigation' },
      { label: 'Municipal Settings & JSON Backup', route: 'settings', cat: 'Navigation' },
      { label: 'Register New Pet', action: 'add-pet', cat: 'Actions' },
      { label: 'Log Found Stray Pet Report', action: 'add-report', cat: 'Actions' },
      { label: 'Log Animal Control Intake', action: 'intake', cat: 'Actions' },
      { label: 'Launch RFID Scanner Simulator', action: 'scanner', cat: 'Actions' },
    ];

    // Append dynamic pets
    pets.forEach(p => {
      commands.push({
        label: `Pet: ${p.name} (${p.rfidTag || 'No Tag'}) — ${p.status.toUpperCase()}`,
        petId: p.id,
        cat: 'Pets Database'
      });
    });

    // Append unregistered sighting reports
    const sightings = store.getSightings ? store.getSightings() : [];
    sightings.forEach(r => {
      commands.push({
        label: `Unregistered Stray: ${r.species || 'Animal'} (${r.breed || 'Mixed'}) found at ${r.location || 'Metro Manila'}`,
        reportId: r.id,
        cat: 'Unregistered Reports'
      });
    });

    // Append shelters
    shelters.forEach(s => {
      commands.push({
        label: `Facility: ${s.name} (${s.fee})`,
        shelterId: s.id,
        cat: 'Municipal Shelters'
      });
    });

    const filtered = q ? commands.filter(c => c.label.toLowerCase().includes(q)) : commands;

    list.innerHTML = filtered.slice(0, 12).map(item => `
      <div class="command-item" data-route="${item.route || ''}" data-filter="${item.filter || ''}" data-action="${item.action || ''}" data-pet-id="${item.petId || ''}" data-report-id="${item.reportId || ''}">
        <span>${item.label}</span>
        <span class="mono-tag" style="font-size: 9px;">${item.cat}</span>
      </div>
    `).join('');

    // Attach click events to command items
    list.querySelectorAll('.command-item').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.getAttribute('data-route');
        const filter = el.getAttribute('data-filter');
        const action = el.getAttribute('data-action');
        const petId = el.getAttribute('data-pet-id');
        const reportId = el.getAttribute('data-report-id');

        this.closeCommandPalette();

        if (route) {
          window.location.hash = '#' + route;
          if (filter && window.PetsView) {
            window.PetsView.currentFilter = filter;
            const container = document.getElementById('view-container');
            if (container) window.PetsView.render(container);
          }
        } else if (action === 'add-pet') {
          window.location.hash = '#pets';
          setTimeout(() => window.PetsView?.openPetEditorModal(null), 100);
        } else if (action === 'add-report') {
          window.location.hash = '#pets';
          if (window.PetsView) {
            window.PetsView.currentFilter = 'unregistered';
            const container = document.getElementById('view-container');
            if (container) window.PetsView.render(container);
          }
          setTimeout(() => window.PetsView?.openReportEditorModal(null), 100);
        } else if (action === 'intake') {
          window.location.hash = '#impoundments';
          setTimeout(() => window.ImpoundmentsView?.openIntakeModal(), 100);
        } else if (action === 'scanner') {
          window.location.hash = '#rfid';
          setTimeout(() => window.RfidView?.openScannerSimulatorModal(), 100);
        } else if (petId) {
          window.location.hash = '#pets';
          const pet = store.getPetById(petId);
          if (pet) setTimeout(() => window.PetsView?.openPetDrawer(pet), 100);
        } else if (reportId) {
          window.location.hash = '#pets';
          if (window.PetsView) {
            window.PetsView.currentFilter = 'unregistered';
            const container = document.getElementById('view-container');
            if (container) window.PetsView.render(container);
          }
          const report = store.getSightingById ? store.getSightingById(reportId) : null;
          if (report) setTimeout(() => window.PetsView?.openReportDrawer(report), 100);
        }
      });
    });
  }
}

// Global App Instance
function bootstrapAdmin() {
  if (!window.adminApp) {
    window.adminApp = new AdminApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAdmin);
} else {
  bootstrapAdmin();
}
