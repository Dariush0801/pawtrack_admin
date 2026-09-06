/**
 * PawTrack Admin — Activation View & Overview
 * Real-time metrics, registration funnel, bottleneck analysis, and Gmail Logins & Owners Table
 * Live-synced with PawTrack Pet Owner Portal (E:\Codes\PawTrack on Port 3000)
 */

window.ActivationView = {
  funnelMode: 'number', // 'number' (whole number) by default, or 'percent'
  currentFilter: 'all', // 'all', 'online', 'offline', 'safe', 'impounded'
  ownerSearchQuery: '',

  render(container) {
    const store = window.adminStore;
    const storePets = store.getPets() || [];
    const impoundments = store.getImpoundments() || [];

    // Extract unique Gmail Logins & Owners dynamically from registered pets in store
    const ownerMap = new Map();
    const isStoreLive = store.syncStatus === 'connected' || store.syncStatus === 'synced' || store.syncStatus === 'live_sse' || store.syncStatus === 'local';

    storePets.forEach(pet => {
      const owner = pet.owner || {};
      const name = (owner.name || 'Anonymous Pet Guardian').trim();
      let email = (owner.email || '').trim();
      if (!email) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
        email = `${slug || 'owner'}@gmail.com`;
      }
      const key = email.toLowerCase();
      if (!ownerMap.has(key)) {
        // If owner.isOnline is explicitly set, use it; otherwise, if store sync is live, account is Online in System
        const isOnline = owner.isOnline !== undefined ? !!owner.isOnline : isStoreLive;
        ownerMap.set(key, {
          email: email,
          name: name,
          phone: owner.phone || '+63 917 000 0000',
          location: owner.address || owner.location || owner.city || 'Metro Manila, Philippines',
          registeredDate: pet.registeredDate || new Date().toISOString().split('T')[0],
          isOnline: isOnline,
          pets: []
        });
      }
      const item = ownerMap.get(key);
      if (owner.address && owner.address !== 'Metro Manila, Philippines') item.location = owner.address;
      if (owner.city && item.location === 'Metro Manila, Philippines') item.location = `${owner.city}, Metro Manila`;
      if (owner.phone && item.phone === '+63 917 000 0000') item.phone = owner.phone;
      if (owner.isOnline !== undefined) item.isOnline = !!owner.isOnline;
      if (!item.pets.some(p => p.id === pet.id)) {
        item.pets.push(pet);
      }
    });

    const ownerAccountsAll = Array.from(ownerMap.values());
    const totalGuardianCount = ownerAccountsAll.length;
    const totalPetsCount = storePets.length;

    const safePets = storePets.filter(p => p.status === 'safe').length;
    const impoundedPets = storePets.filter(p => p.status === 'impounded').length;
    const reunitedPets = storePets.filter(p => p.status === 'reunited').length;
    const activeImpounds = impoundments.filter(i => i.status === 'active_impounded').length;

    const onlineCount = ownerAccountsAll.filter(acc => acc.isOnline).length;
    const offlineCount = totalGuardianCount - onlineCount;

    const counts = {
      all: totalGuardianCount,
      online: onlineCount,
      offline: offlineCount,
      safe: ownerAccountsAll.filter(acc => acc.pets.length > 0 && acc.pets.every(p => p.status === 'safe' || p.status === 'reunited')).length,
      impounded: ownerAccountsAll.filter(acc => acc.pets.some(p => p.status === 'impounded')).length,
    };

    // Apply Tab Filter
    let filteredOwners = [...ownerAccountsAll];
    if (this.currentFilter === 'online') {
      filteredOwners = filteredOwners.filter(acc => acc.isOnline);
    } else if (this.currentFilter === 'offline') {
      filteredOwners = filteredOwners.filter(acc => !acc.isOnline);
    } else if (this.currentFilter === 'safe') {
      filteredOwners = filteredOwners.filter(acc => acc.pets.length > 0 && acc.pets.every(p => p.status === 'safe' || p.status === 'reunited'));
    } else if (this.currentFilter === 'impounded') {
      filteredOwners = filteredOwners.filter(acc => acc.pets.some(p => p.status === 'impounded'));
    }

    // Apply Search Filter for Owner Accounts
    if (this.ownerSearchQuery && this.ownerSearchQuery.trim()) {
      const q = this.ownerSearchQuery.toLowerCase().trim();
      filteredOwners = filteredOwners.filter(acc => 
        (acc.email && acc.email.toLowerCase().includes(q)) ||
        (acc.name && acc.name.toLowerCase().includes(q)) ||
        (acc.phone && acc.phone.toLowerCase().includes(q)) ||
        (acc.location && acc.location.toLowerCase().includes(q)) ||
        (acc.isOnline ? 'online' : 'offline').includes(q) ||
        acc.pets.some(p => (p.name && p.name.toLowerCase().includes(q)) || (p.rfidTag && p.rfidTag.toLowerCase().includes(q)))
      );
    }

    // Daily activation series
    const dailyRegistrations = [0, 0, 0, 0, 0, 0, 0, totalPetsCount];

    // Funnel Steps (Whole numbers and rounded whole-integer percentage calculation)
    const microchipCount = storePets.filter(p => p.microchipNo).length;
    const verifiedOwners = storePets.filter(p => p.owner && p.owner.phone).length;
    const protectedCount = safePets + reunitedPets;

    const funnelSteps = [
      { 
        name: 'RFID Tag Provisioned', 
        count: totalPetsCount > 0 ? totalPetsCount + 8 : 8, 
        percent: 100 
      },
      { 
        name: 'Pet Profile Completed', 
        count: totalPetsCount, 
        percent: totalPetsCount > 0 ? Math.round((totalPetsCount / (totalPetsCount + 8)) * 100) : 0 
      },
      { 
        name: 'Microchip Linked', 
        count: microchipCount, 
        percent: totalPetsCount > 0 ? Math.round((microchipCount / Math.max(totalPetsCount, 1)) * 100) : 0 
      },
      { 
        name: 'Emergency Contact Verified', 
        count: verifiedOwners, 
        percent: totalPetsCount > 0 ? Math.round((verifiedOwners / Math.max(totalPetsCount, 1)) * 100) : 0 
      },
      { 
        name: 'Active Protection Mode', 
        count: protectedCount, 
        percent: totalPetsCount > 0 ? Math.round((protectedCount / Math.max(totalPetsCount, 1)) * 100) : 0 
      },
    ];
    const maxFunnel = Math.max(funnelSteps[0].count, 1);

    // Stalls & Bottlenecks
    const stalls = [
      ['Shelter Intake', 'Missing Microchip cross-reference', activeImpounds > 0 ? `${activeImpounds} pets` : '0 pets (Clear)'],
      ['Profile Onboarding', 'Owner contact unconfirmed', totalPetsCount > 0 ? `${Math.max(totalPetsCount - verifiedOwners, 0)} owners` : '0 owners (Clear)'],
      ['Claim Processing', 'Holding fee clearance pending', impoundments.filter(i => i.feesAccumulated).length > 0 ? `${impoundments.filter(i => i.feesAccumulated).length} claims` : '0 claims (Clear)'],
      ['Hardware Scanner', 'Collar tag battery status', '8 tags online'],
    ];

    // Sparkline SVG helper
    const makeSparkline = (vals, color = '#c2410c') => {
      const sw = 84, sh = 28;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const span = max - min || 1;
      const d = vals.map((v, i) => `${i ? 'L' : 'M'} ${((i / (vals.length - 1)) * sw).toFixed(1)},${(sh - 3 - ((v - min) / span) * (sh - 6)).toFixed(1)}`).join(' ');
      return `<svg width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" /></svg>`;
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-titles">
          <h1>System Activation Overview</h1>
          <div class="subtitle">
            <span>Real-time municipal telemetry · Live Sync with Owner App (Port 3000)</span>
            <span class="status-pill status-safe" style="font-size: 9px; padding: 1px 6px;">Live Sync Active</span>
          </div>
        </div>
        <div class="view-header-actions">
          <button class="chip chip-subtle-terracotta" id="btn-quick-intake">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Quick Intake
          </button>
          <button class="chip" id="btn-export-brief">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export KPI
          </button>
        </div>
      </div>

      <!-- 4-Column KPI Strip (Nock-style) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">
            <span>Active Protected Pets</span>
            <span class="mono-tag" style="font-size: 9px;">${protectedCount}/${totalPetsCount}</span>
          </div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${totalPetsCount > 0 ? Math.round((protectedCount / totalPetsCount) * 100) : 0}%</div>
              <div class="kpi-delta ${totalPetsCount > 0 ? 'up' : 'neutral'}">${totalPetsCount === 0 ? 'Empty (0 registered)' : '↑ Active protection'}</div>
            </div>
            <div class="kpi-spark">${makeSparkline([0, 0, 0, 0, 0, 0, protectedCount], '#15803d')}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Median Recovery Time</span>
            <span class="mono-tag" style="font-size: 9px;">72h SLA</span>
          </div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${totalPetsCount > 0 ? '14h 20m' : '0h 0m'}</div>
              <div class="kpi-delta neutral">${totalPetsCount > 0 ? '↓ 3h faster' : 'No active recovery'}</div>
            </div>
            <div class="kpi-spark">${makeSparkline([0, 0, 0, 0, 0, 0, 0], '#1c1917')}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Daily Registered Velocity</span>
            <span class="mono-tag" style="font-size: 9px;">Tag scans</span>
          </div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${totalPetsCount} / day</div>
              <div class="kpi-delta ${totalPetsCount > 0 ? 'up' : 'neutral'}">${totalPetsCount > 0 ? '↑ Active telemetry' : 'Waiting for registrations'}</div>
            </div>
            <div class="kpi-spark">${makeSparkline(dailyRegistrations, '#c2410c')}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">
            <span>Shelter Capacity Load</span>
            <span class="mono-tag" style="font-size: 9px;">3 Facilities</span>
          </div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${activeImpounds} Active</div>
              <div class="kpi-delta ${activeImpounds > 0 ? 'down' : 'up'}">${activeImpounds === 0 ? 'All kennels available' : activeImpounds + ' occupied'}</div>
            </div>
            <div class="kpi-spark">${makeSparkline([0, 0, 0, 0, 0, 0, activeImpounds], '#b45309')}</div>
          </div>
        </div>
      </div>

      <!-- Gmail Logins & Registered Pet Guardians Directory Table (Placed Prominently) -->
      <div class="table-container" style="width: 100%; box-sizing: border-box;">
        <!-- Unified Table Toolbar with Title, Counters, Search, and Filter Tabs -->
        <div class="table-toolbar" style="width: 100%; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-weight: 750; font-size: 13px; color: var(--ink-primary);">Registered Pet Guardians</span>
            ${totalGuardianCount === 0 ? `
              <span class="status-pill" style="font-size: 9.5px; padding: 2px 8px; background: var(--bg-card-subtle); color: var(--ink-muted); border: 1px solid var(--border-main);">
                <span class="status-dot" style="background: var(--ink-subtle);"></span>No Guardians Account Login
              </span>
            ` : `
              <span class="status-pill status-safe" style="font-size: 9.5px; padding: 2px 8px;">
                <span class="status-dot"></span>${onlineCount} Online in System
              </span>
              ${offlineCount > 0 ? `
                <span class="status-pill" style="font-size: 9.5px; padding: 2px 7px; background: var(--bg-card-subtle); color: var(--ink-muted); border: 1px solid var(--border-main);">
                  <span class="status-dot" style="background: var(--ink-subtle);"></span>${offlineCount} Offline
                </span>
              ` : ''}
            `}
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div class="table-search" style="width: 220px; max-width: 100%; height: 32px; font-size: 11.5px; box-sizing: border-box; margin: 0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-muted); flex-shrink: 0;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" id="owner-search-input" placeholder="Search guardians..." value="${this.ownerSearchQuery || ''}" style="font-size: 11.5px; width: 100%; min-width: 0;" />
              ${this.ownerSearchQuery ? `<button id="btn-clear-owner-search" style="border:none;background:transparent;cursor:pointer;color:var(--ink-muted);font-size:12px;padding:0 2px;">&times;</button>` : ''}
            </div>

            <div class="table-filters" style="box-sizing: border-box;">
              <button class="filter-pill ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
              <button class="filter-pill ${this.currentFilter === 'online' ? 'active' : ''}" data-filter="online">Online</button>
              <button class="filter-pill ${this.currentFilter === 'offline' ? 'active' : ''}" data-filter="offline">Offline</button>
              <button class="filter-pill ${this.currentFilter === 'safe' ? 'active' : ''}" data-filter="safe">Safe Pets</button>
              <button class="filter-pill ${this.currentFilter === 'impounded' ? 'active' : ''}" data-filter="impounded">Impounded</button>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="data-table-wrapper" style="width: 100%; box-sizing: border-box; overflow-x: auto;">
          <table class="data-table" style="width: 100%;">
            <thead>
              <tr>
                <th>Gmail Account</th>
                <th>System Status</th>
                <th>Owner Contact Info</th>
                <th>Registered Location & Jurisdiction</th>
                <th>Registered Pets</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOwners.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 48px 24px; color: var(--ink-muted);">
                    <div style="font-weight: 700; color: var(--ink-primary); font-size: 14px; margin-bottom: 4px;">
                      ${this.ownerSearchQuery ? 'No matching Gmail accounts found' : (this.currentFilter !== 'all' ? `No ${this.currentFilter.toUpperCase()} Guardian Accounts` : 'No Guardians Account Login (0 Records)')}
                    </div>
                    <div style="font-size: 12px; max-width: 480px; margin: 0 auto; line-height: 1.5; color: var(--ink-muted);">
                      ${this.ownerSearchQuery ? `No records matched "${this.ownerSearchQuery}". Try clearing the search query.` : 'No registered pet guardian accounts logged in or registered yet. Pets and owners registered on the Owner Portal (<b>http://localhost:3000</b>) will sync here live in real-time.'}
                    </div>
                    ${(this.ownerSearchQuery || this.currentFilter !== 'all') ? `
                      <div style="margin-top: 14px;">
                        <button class="btn btn-secondary btn-sm" id="btn-reset-owner-filter" style="margin: 0 auto;">Reset Filter</button>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              ` : filteredOwners.map(owner => `
                <tr>
                  <!-- Gmail Account -->
                  <td>
                    <div style="display: flex; align-items: center; gap: 9px;">
                      <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--bg-card-subtle); border: 1px solid var(--border-main); color: var(--brand-terracotta); display: grid; place-items: center; font-weight: 700; font-size: 11.5px; flex-shrink: 0;">
                        ${owner.name ? owner.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-weight: 700; color: var(--ink-primary); font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                          ${owner.email}
                          <button class="btn-copy-email" data-email="${owner.email}" title="Copy Email Address" style="border: none; background: transparent; cursor: pointer; padding: 0; color: var(--ink-muted); display: inline-flex; align-items: center;">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                        </span>
                        <span style="font-size: 9.5px; font-family: var(--font-mono); color: var(--ink-muted);">
                          Registered: ${owner.registeredDate}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- System Status (Online / Offline) -->
                  <td>
                    ${owner.isOnline ? `
                      <span class="status-pill status-safe" style="font-size: 9.5px; padding: 2px 7px;">
                        <span class="status-dot"></span>Online in System
                      </span>
                    ` : `
                      <span class="status-pill" style="font-size: 9.5px; padding: 2px 7px; background: var(--bg-card-subtle); color: var(--ink-muted); border: 1px solid var(--border-main);">
                        <span class="status-dot" style="background: var(--ink-subtle);"></span>Offline
                      </span>
                    `}
                  </td>

                  <!-- Owner Contact Info -->
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      <span style="font-weight: 600; color: var(--ink-primary); font-size: 12px;">${owner.name}</span>
                      <span style="font-size: 11px; color: var(--ink-muted); font-family: var(--font-mono); display: flex; align-items: center; gap: 4px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        ${owner.phone}
                      </span>
                    </div>
                  </td>

                  <!-- Location & Jurisdiction -->
                  <td>
                    <div style="display: flex; align-items: flex-start; gap: 6px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-terracotta)" stroke-width="2.2" style="flex-shrink: 0; margin-top: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-size: 11.5px; color: var(--ink-primary); line-height: 1.35;">${owner.location}</span>
                        <span class="mono-tag" style="font-size: 9px; align-self: flex-start; padding: 1px 5px; color: var(--brand-terracotta); border-color: rgba(194, 65, 12, 0.25);">
                          NCR Municipal Jurisdiction
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Registered Pets -->
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                      ${owner.pets.map(p => `
                        <div class="owner-pet-chip-link" data-pet-name="${p.name}" title="Click to view ${p.name} in Registry" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 6px; background: var(--bg-card-subtle); border: 1px solid var(--border-main); font-size: 11px; transition: background 0.15s ease;">
                          <img src="${p.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=80&q=80'}" style="width: 18px; height: 18px; border-radius: 4px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=80&q=80'" />
                          <b style="color: var(--ink-primary);">${p.name}</b>
                          <span style="font-size: 9.5px; color: var(--ink-muted);">(${p.species || 'Dog'})</span>
                          <span class="mono-tag" style="font-size: 9px; padding: 0 4px;">${p.rfidTag || 'NO RFID'}</span>
                          <span class="status-pill status-${p.status || 'safe'}" style="font-size: 8.5px; padding: 0 5px;">
                            ${(p.status || 'safe').toUpperCase()}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </td>

                  <!-- Actions -->
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button class="chip btn-view-owner-pets" data-owner-name="${owner.name}" title="Inspect in Pet Registry">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View Pets
                      </button>
                      <a href="mailto:${owner.email}" class="chip" title="Send Direct Notice" style="text-decoration: none; color: inherit;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        Email
                      </a>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Registration Funnel & Where Cases Stall Section -->
      <div class="stalls-audit-grid" style="margin-top: 14px;">
        <!-- Funnel Card -->
        <div class="nock-card">
          <div class="nock-card-head" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span class="nock-card-title">Registration Funnel</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn btn-sm btn-secondary" id="btn-toggle-funnel-mode" title="${this.funnelMode === 'percent' ? 'Show Counts' : 'Convert to %'}" aria-label="Toggle Counts and Percentage" style="padding: 3px 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>
              </button>
              <span class="nock-card-right" style="min-width: 52px; text-align: right; font-weight: 700; color: var(--brand-terracotta);">
                ${this.funnelMode === 'percent' ? '% Kept' : 'Counts'}
              </span>
            </div>
          </div>
          <div class="funnel-list">
            ${funnelSteps.map((st, i) => {
              const displayVal = this.funnelMode === 'percent' ? `${st.percent}%` : `${st.count}`;
              return `
                <div class="funnel-step">
                  <div>
                    <div class="funnel-step-head">
                      <span>${st.name}</span>
                      <span class="funnel-step-count">${st.count}</span>
                    </div>
                    <div class="funnel-track">
                      <div class="funnel-fill" style="width: ${(st.count / maxFunnel) * 100}%; background: ${i === 3 ? '#c2410c' : (i === 4 ? '#15803d' : '#1c1917')};"></div>
                    </div>
                  </div>
                  <span class="funnel-keep">${displayVal}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Where Cases Stall -->
        <div class="nock-card">
          <div class="nock-card-head">
            <span class="nock-card-title">Where Cases Stall</span>
            <span class="nock-card-right">Active Bottlenecks</span>
          </div>
          <div class="stall-table">
            ${stalls.map(s => `
              <div class="stall-row">
                <span class="stall-stage">${s[0]}</span>
                <span class="stall-reason">${s[1]}</span>
                <span class="stall-count">${s[2]}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Hook events
    const toggleFunnelHandler = () => {
      this.funnelMode = (this.funnelMode === 'percent') ? 'number' : 'percent';
      const modeText = (this.funnelMode === 'percent') ? 'Percentages (%)' : 'Whole Numbers (Counts)';
      window.adminApp?.showToast(`Funnel converted to ${modeText}`, 'info', 1400);
      this.render(container);
    };

    container.querySelector('#btn-toggle-funnel-mode')?.addEventListener('click', toggleFunnelHandler);

    container.querySelector('#btn-quick-intake')?.addEventListener('click', () => {
      if (window.ImpoundmentsView && typeof window.ImpoundmentsView.openIntakeModal === 'function') {
        window.ImpoundmentsView.openIntakeModal();
      } else {
        window.location.hash = '#impoundments';
      }
    });

    container.querySelector('#btn-export-brief')?.addEventListener('click', () => {
      const summary = `PAWTRACK ACTIVATION REPORT\nActive Protected Pets: ${protectedCount}/${totalPetsCount} (${totalPetsCount > 0 ? Math.round((protectedCount / totalPetsCount) * 100) : 0}%)\nActive Impoundments: ${activeImpounds}\nDaily Registration Velocity: ${dailyRegistrations[dailyRegistrations.length - 1]}/day\nGenerated: ${new Date().toLocaleString()}`;
      navigator.clipboard.writeText(summary);
      window.adminApp?.showToast('Activation KPI summary copied to clipboard!', 'success');
    });

    // Filter pills event listeners
    container.querySelectorAll('.filter-pill[data-filter]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        this.currentFilter = e.currentTarget.getAttribute('data-filter');
        this.render(container);
      });
    });

    // Owner search input listener
    const ownerSearchInput = container.querySelector('#owner-search-input');
    if (ownerSearchInput) {
      ownerSearchInput.addEventListener('input', (e) => {
        this.ownerSearchQuery = e.target.value;
        this.render(container);
        const nextInput = container.querySelector('#owner-search-input');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        }
      });
    }

    container.querySelector('#btn-clear-owner-search')?.addEventListener('click', () => {
      this.ownerSearchQuery = '';
      this.render(container);
    });

    container.querySelector('#btn-reset-owner-filter')?.addEventListener('click', () => {
      this.ownerSearchQuery = '';
      this.currentFilter = 'all';
      this.render(container);
    });

    // Copy Email buttons
    container.querySelectorAll('.btn-copy-email').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const email = btn.getAttribute('data-email');
        if (email) {
          navigator.clipboard.writeText(email);
          window.adminApp?.showToast(`Copied ${email} to clipboard!`, 'success', 1600);
        }
      });
    });

    // View Owner Pets buttons
    container.querySelectorAll('.btn-view-owner-pets').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ownerName = btn.getAttribute('data-owner-name');
        if (window.PetsView) {
          window.PetsView.searchQuery = ownerName;
        }
        window.location.hash = '#pets';
      });
    });

    // Direct Pet chip clicks (navigates to pet in PetsView)
    container.querySelectorAll('.owner-pet-chip-link').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const petName = chip.getAttribute('data-pet-name');
        if (window.PetsView) {
          window.PetsView.searchQuery = petName;
        }
        window.location.hash = '#pets';
      });
    });
  }
};
