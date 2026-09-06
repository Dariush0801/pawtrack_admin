/**
 * PawTrack Admin — Municipal Impoundment & Shelter Holding Operations
 * Active 72h countdown clocks, kennel bay assignments, extensions, fee clearing, and release processing
 */

window.ImpoundmentsView = {
  currentTab: 'active',

  render(container) {
    const store = window.adminStore;
    const impoundments = store.getImpoundments();
    const shelters = store.getShelters();

    let filtered = impoundments;
    if (this.currentTab === 'active') {
      filtered = impoundments.filter(i => i.status === 'active_impounded');
    } else if (this.currentTab === 'claimed') {
      filtered = impoundments.filter(i => i.status === 'claimed');
    }

    const counts = {
      all: impoundments.length,
      active: impoundments.filter(i => i.status === 'active_impounded').length,
      claimed: impoundments.filter(i => i.status === 'claimed').length,
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-titles">
          <h1>Municipal Impoundment Queue</h1>
          <div class="subtitle">
            <span>72-Hour Legal Holding Window · Quarantine & Kennel Administration</span>
          </div>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" id="btn-intake-modal">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Log Animal Intake
          </button>
        </div>
      </div>

      <!-- Quick Status Strip -->
      <div class="kpi-grid kpi-grid-3">
        <div class="kpi-card">
          <div class="kpi-label">Active Holding Cases</div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${counts.active} Cases</div>
              <div class="kpi-delta up">All under 72h SLA</div>
            </div>
            <div class="mono-tag" style="font-size: 11px; font-weight: 700;">LIVE QUEUE</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Successfully Reunited</div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${counts.claimed} Claims</div>
              <div class="kpi-delta up">100% verified release</div>
            </div>
            <div class="mono-tag" style="color: var(--color-green);">REUNITED</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Active Facilities</div>
          <div class="kpi-body">
            <div>
              <div class="kpi-value">${shelters.length} Facilities</div>
              <div class="kpi-delta up">Live multi-facility sync</div>
            </div>
            <div class="mono-tag">NCR BOUND</div>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-container">
        <div class="table-toolbar">
          <div class="table-filters">
            <button class="filter-pill ${this.currentTab === 'active' ? 'active' : ''}" data-tab="active">Active Holding</button>
            <button class="filter-pill ${this.currentTab === 'claimed' ? 'active' : ''}" data-tab="claimed">Claimed & Released</button>
            <button class="filter-pill ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">Full History</button>
          </div>
        </div>

        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Impounded Pet</th>
                <th>Facility & Kennel Bay</th>
                <th>Intake Timestamp</th>
                <th>72h Holding Window</th>
                <th>Condition / Officer Notes</th>
                <th style="text-align: right;">Operations</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 48px 24px; color: var(--ink-muted);">
                    <div style="font-weight: 700; color: var(--ink-primary); font-size: 14px; margin-bottom: 4px;">No Active Impoundment Cases (Queue Empty)</div>
                    <div style="font-size: 12px; max-width: 480px; margin: 0 auto; line-height: 1.5; color: var(--ink-muted);">
                      There are no pets currently logged in the 72-hour quarantine holding queue. All kennel bays across Quezon City, Manila, and Pasig are clear.
                    </div>
                  </td>
                </tr>
              ` : filtered.map(imp => {
                const deadlineMs = new Date(imp.claimDeadline).getTime();
                const nowMs = Date.now();
                const diffHours = Math.round((deadlineMs - nowMs) / (3600 * 1000));
                const isExpired = diffHours <= 0;
                const isClaimed = imp.status === 'claimed';

                return `
                  <tr data-impound-id="${imp.id}">
                    <td>
                      <div class="pet-cell">
                        <img src="${imp.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'}" class="pet-thumb" />
                        <div class="pet-meta">
                          <span class="pet-name">${imp.petName || 'Unidentified Pet'}</span>
                          <span class="mono-tag" style="font-size: 9px; width: max-content; margin-top: 2px;">${imp.rfidTag || 'NO TAG'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; flex-direction: column;">
                        <b style="font-size: 11.5px; color: var(--ink-primary);">${imp.shelterName || 'Municipal Shelter'}</b>
                        <span class="chip-subtle-terracotta" style="width: max-content; font-size: 9.5px; padding: 2px 6px; border-radius: 4px; margin-top: 3px; font-weight: 700;">
                          ${imp.cageNumber || 'Bay Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; flex-direction: column; font-size: 11px;">
                        <span>${new Date(imp.intakeDate).toLocaleDateString()}</span>
                        <span style="font-family: var(--font-mono); color: var(--ink-muted); font-size: 10px;">${new Date(imp.intakeDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      ${isClaimed ? `
                        <span class="status-pill status-reunited">CLAIMED & SAFE</span>
                        <div style="font-size: 10px; color: var(--ink-muted); margin-top: 2px; font-family: var(--font-mono);">
                          ${imp.claimedAt ? new Date(imp.claimedAt).toLocaleDateString() : 'Released'}
                        </div>
                      ` : isExpired ? `
                        <span class="status-pill status-lost">EXPIRED (${Math.abs(diffHours)}h overdue)</span>
                      ` : `
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="status-pill status-impounded">${diffHours}h REMAINING</span>
                        </div>
                        <div style="font-size: 10px; color: var(--ink-muted); margin-top: 2px; font-family: var(--font-mono);">
                          Until: ${new Date(imp.claimDeadline).toLocaleDateString()} ${new Date(imp.claimDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      `}
                    </td>
                    <td>
                      <div style="max-width: 200px; font-size: 11px; color: var(--ink-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${imp.healthCondition || ''}">
                        ${imp.healthCondition || 'No condition issues noted upon intake.'}
                      </div>
                      <span style="font-size: 10px; color: var(--ink-muted); font-family: var(--font-mono);">${imp.intakeOfficer || 'ACO Officer'}</span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: flex; justify-content: flex-end; gap: 6px;">
                        ${!isClaimed ? `
                          <button class="btn btn-sm chip-green btn-claim-impound" data-impound-id="${imp.id}" title="Release Pet to Owner">
                            Release
                          </button>
                          <button class="btn btn-sm btn-secondary btn-extend-deadline" data-impound-id="${imp.id}" title="Extend 24h Holding Window">
                            +24h
                          </button>
                        ` : ''}
                        <button class="btn btn-sm btn-secondary btn-edit-impound" data-impound-id="${imp.id}" title="Edit Impound Case">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents(container) {
    const store = window.adminStore;

    // Tabs
    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        this.currentTab = e.target.getAttribute('data-tab');
        this.render(container);
      });
    });

    // Intake modal trigger
    container.querySelector('#btn-intake-modal')?.addEventListener('click', () => {
      this.openIntakeModal();
    });

    // Claim / Release button
    container.querySelectorAll('.btn-claim-impound').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-impound-id');
        const imp = store.getImpoundmentById(id);
        if (imp && confirm(`Confirm pet release for "${imp.petName}"? This will set pet status back to SAFE and log recovery.`)) {
          store.claimImpoundment(id, 'Admin Officer');
          window.adminApp.showToast(`Pet "${imp.petName}" has been officially claimed and released.`, 'success');
          this.render(container);
        }
      });
    });

    // Extend 24h button
    container.querySelectorAll('.btn-extend-deadline').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-impound-id');
        store.extendImpoundDeadline(id, 24);
        window.adminApp.showToast('Holding deadline extended by 24 hours', 'success');
        this.render(container);
      });
    });

    // Edit button
    container.querySelectorAll('.btn-edit-impound').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-impound-id');
        const imp = store.getImpoundmentById(id);
        if (imp) this.openEditModal(imp);
      });
    });
  },

  openIntakeModal() {
    const store = window.adminStore;
    const pets = store.getPets();
    const shelters = store.getShelters();

    const modalHtml = `
      <div class="modal-header">
        <div class="nock-card-title">Log Animal Control Intake</div>
        <button class="icon-btn-subtle" id="intake-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <form id="intake-form" class="form-grid">
          <div class="form-group form-full">
            <label class="form-label">Link Registered Pet (Optional)</label>
            <select class="form-control" name="petSelect" id="intake-pet-select">
              <option value="">-- Unregistered / Stray Animal --</option>
              ${pets.map(p => `
                <option value="${p.id}" data-name="${p.name}" data-rfid="${p.rfidTag || ''}" data-photo="${p.photoUrl || ''}">
                  ${p.name} (${p.rfidTag || 'No RFID'}) — ${p.owner ? p.owner.name : 'Unknown Owner'}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Pet Name / Identifier *</label>
            <input type="text" class="form-control" name="petName" id="intake-pet-name" placeholder="e.g. Max" required />
          </div>

          <div class="form-group">
            <label class="form-label">RFID Collar Tag Code</label>
            <input type="text" class="form-control" name="rfidTag" id="intake-rfid-tag" placeholder="RFID-XXXXXX" style="font-family: var(--font-mono);" />
          </div>

          <div class="form-group">
            <label class="form-label">Intake Facility *</label>
            <select class="form-control" name="shelterId" id="intake-shelter-select">
              ${shelters.map(s => `
                <option value="${s.id}" data-name="${s.name}" data-phone="${s.phone}" data-address="${s.address}">
                  ${s.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned Kennel Bay *</label>
            <input type="text" class="form-control" name="cageNumber" value="Kennel Bay A-${Math.floor(1 + Math.random() * 20)}" required />
          </div>

          <div class="form-group form-full">
            <label class="form-label">Impound Location / Pickup Intersection</label>
            <input type="text" class="form-control" name="impoundLocation" placeholder="e.g. Corner E. Rodriguez & Tomas Morato" />
          </div>

          <div class="form-group">
            <label class="form-label">Animal Control Officer</label>
            <input type="text" class="form-control" name="intakeOfficer" value="Officer Rafael Garcia (ACO-412)" />
          </div>

          <div class="form-group">
            <label class="form-label">Daily Holding Fee</label>
            <input type="text" class="form-control" name="feesAccumulated" value="PHP 500" />
          </div>

          <div class="form-group form-full">
            <label class="form-label">Health & Veterinary Condition</label>
            <textarea class="form-control" name="healthCondition" placeholder="Describe physical status, injuries, appetite, hydration..."></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="intake-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="intake-submit-btn">Complete Intake & Dispatch Alert</button>
      </div>
    `;

    const modal = window.adminApp.openModalContent(modalHtml);

    // Auto-fill on pet selection
    const petSelect = modal.querySelector('#intake-pet-select');
    const petNameInput = modal.querySelector('#intake-pet-name');
    const rfidInput = modal.querySelector('#intake-rfid-tag');

    petSelect?.addEventListener('change', () => {
      const selected = petSelect.selectedOptions[0];
      if (selected && selected.value) {
        petNameInput.value = selected.getAttribute('data-name') || '';
        rfidInput.value = selected.getAttribute('data-rfid') || '';
      }
    });

    modal.querySelector('#intake-close-btn')?.addEventListener('click', () => window.adminApp.closeModal());
    modal.querySelector('#intake-cancel-btn')?.addEventListener('click', () => window.adminApp.closeModal());

    modal.querySelector('#intake-submit-btn')?.addEventListener('click', () => {
      const form = modal.querySelector('#intake-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const formData = new FormData(form);
      const shelterSelect = modal.querySelector('#intake-shelter-select');
      const shelterOpt = shelterSelect.selectedOptions[0];

      const newImpound = {
        petId: formData.get('petSelect') || null,
        petName: formData.get('petName'),
        rfidTag: formData.get('rfidTag'),
        shelterId: formData.get('shelterId'),
        shelterName: shelterOpt ? shelterOpt.getAttribute('data-name') : 'Municipal Animal Facility',
        shelterAddress: shelterOpt ? shelterOpt.getAttribute('data-address') : 'Metro Manila',
        shelterPhone: shelterOpt ? shelterOpt.getAttribute('data-phone') : '+63 2 8000 0000',
        cageNumber: formData.get('cageNumber'),
        impoundLocation: formData.get('impoundLocation'),
        intakeOfficer: formData.get('intakeOfficer'),
        healthCondition: formData.get('healthCondition') || 'Normal upon intake assessment.',
        feesAccumulated: formData.get('feesAccumulated'),
        photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'
      };

      window.adminStore.saveImpoundment(newImpound);
      window.adminApp.closeModal();
      window.adminApp.showToast(`Logged intake for ${newImpound.petName}. 72h countdown started.`, 'success');
      window.adminApp.renderView('impoundments');
    });
  },

  openEditModal(imp) {
    const modalHtml = `
      <div class="modal-header">
        <div class="nock-card-title">Edit Impound Record: ${imp.petName}</div>
        <button class="icon-btn-subtle" id="edit-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <form id="edit-impound-form" class="form-grid">
          <div class="form-group">
            <label class="form-label">Pet Name</label>
            <input type="text" class="form-control" name="petName" value="${imp.petName || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">RFID Tag</label>
            <input type="text" class="form-control" name="rfidTag" value="${imp.rfidTag || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Kennel Bay Assignment</label>
            <input type="text" class="form-control" name="cageNumber" value="${imp.cageNumber || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Holding Status</label>
            <select class="form-control" name="status">
              <option value="active_impounded" ${imp.status === 'active_impounded' ? 'selected' : ''}>Active Holding</option>
              <option value="claimed" ${imp.status === 'claimed' ? 'selected' : ''}>Claimed & Released</option>
            </select>
          </div>
          <div class="form-group form-full">
            <label class="form-label">Health Status Notes</label>
            <textarea class="form-control" name="healthCondition">${imp.healthCondition || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="edit-save-btn">Save Changes</button>
      </div>
    `;

    const modal = window.adminApp.openModalContent(modalHtml);

    modal.querySelector('#edit-close-btn')?.addEventListener('click', () => window.adminApp.closeModal());
    modal.querySelector('#edit-cancel-btn')?.addEventListener('click', () => window.adminApp.closeModal());

    modal.querySelector('#edit-save-btn')?.addEventListener('click', () => {
      const form = modal.querySelector('#edit-impound-form');
      const formData = new FormData(form);

      const updated = {
        ...imp,
        petName: formData.get('petName'),
        rfidTag: formData.get('rfidTag'),
        cageNumber: formData.get('cageNumber'),
        status: formData.get('status'),
        healthCondition: formData.get('healthCondition')
      };

      window.adminStore.saveImpoundment(updated);
      window.adminApp.closeModal();
      window.adminApp.showToast(`Updated impound case ${imp.id}`, 'success');
      window.adminApp.renderView('impoundments');
    });
  }
};
