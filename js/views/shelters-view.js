/**
 * PawTrack Admin — Municipal Shelters & Facilities Management
 * Facility directory, capacity meters, daily fee overrides, and operating hours
 */

window.SheltersView = {
  render(container) {
    const store = window.adminStore;
    const shelters = store.getShelters();
    const impoundments = store.getImpoundments();

    // Calculate real live occupancy
    shelters.forEach(sh => {
      const activeHere = impoundments.filter(i => i.shelterId === sh.id && i.status === 'active_impounded').length;
      sh.occupied = Math.max(sh.occupied || 0, activeHere);
    });

    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-titles">
          <h1>Municipal Shelter Facilities</h1>
          <div class="subtitle">
            <span>Facility Operations · Kennel Capacity & Municipal Tariff Schedules</span>
          </div>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" id="btn-add-shelter">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Shelter Facility
          </button>
        </div>
      </div>

      <!-- Facilities Grid -->
      <div class="facilities-grid">
        ${shelters.map(sh => {
          const capPercent = Math.round(((sh.occupied || 0) / (sh.capacity || 50)) * 100);
          const isHigh = capPercent > 80;

          return `
            <div class="nock-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 14px;">
              <div>
                <div class="nock-card-head">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 24px; height: 24px; border-radius: 6px; background: var(--bg-card-subtle); border: 1px solid var(--border-main); display: grid; place-items: center; font-size: 11px;">🏛️</span>
                    <span class="nock-card-title">${sh.name}</span>
                  </div>
                  <span class="mono-tag" style="font-size: 9.5px;">${sh.id}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                  <div style="color: var(--ink-muted); display: flex; align-items: center; gap: 6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${sh.address}</span>
                  </div>

                  <div style="display: flex; justify-content: space-between; color: var(--ink-secondary); margin-top: 4px;">
                    <span>📞 ${sh.phone}</span>
                    <span>✉️ ${sh.email || 'animalcare@lgu.gov.ph'}</span>
                  </div>

                  <div style="display: flex; justify-content: space-between; color: var(--ink-muted); font-size: 11px; margin-top: 2px;">
                    <span>🕒 ${sh.hours || 'Mon-Fri 8am-5pm'}</span>
                    <span style="font-weight: 700; color: var(--brand-terracotta);">${sh.fee || 'PHP 500 / day'}</span>
                  </div>
                </div>

                <!-- Capacity Gauge -->
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-light);">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: var(--ink-muted);">Kennel Occupancy</span>
                    <span style="font-family: var(--font-mono); font-weight: 700; color: ${isHigh ? 'var(--color-red)' : 'var(--color-green)'};">
                      ${sh.occupied || 0} / ${sh.capacity || 50} (${capPercent}%)
                    </span>
                  </div>
                  <div class="funnel-track">
                    <div class="funnel-fill" style="width: ${Math.min(capPercent, 100)}%; background: ${isHigh ? 'var(--color-red)' : 'var(--brand-terracotta)'};"></div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 6px; padding-top: 8px; border-top: 1px solid var(--border-light);">
                <button class="btn btn-sm btn-secondary btn-edit-shelter" data-shelter-id="${sh.id}">
                  Edit Facility
                </button>
                <button class="btn btn-sm btn-danger btn-delete-shelter" data-shelter-id="${sh.id}">
                  Delete
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents(container) {
    const store = window.adminStore;

    container.querySelector('#btn-add-shelter')?.addEventListener('click', () => {
      this.openShelterModal(null);
    });

    container.querySelectorAll('.btn-edit-shelter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-shelter-id');
        const sh = store.getShelters().find(s => s.id === id);
        if (sh) this.openShelterModal(sh);
      });
    });

    container.querySelectorAll('.btn-delete-shelter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-shelter-id');
        if (confirm(`Remove this municipal facility record (${id})?`)) {
          store.deleteShelter(id);
          window.adminApp.showToast('Shelter facility removed', 'warning');
          this.render(container);
        }
      });
    });
  },

  openShelterModal(initial = null) {
    const isEdit = !!initial;
    const store = window.adminStore;

    const modalHtml = `
      <div class="modal-header">
        <div class="nock-card-title">${isEdit ? 'Edit Municipal Shelter' : 'Add New Municipal Shelter Facility'}</div>
        <button class="icon-btn-subtle" id="shelter-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <form id="shelter-form" class="form-grid">
          <div class="form-group form-full">
            <label class="form-label">Facility Name *</label>
            <input type="text" class="form-control" name="name" value="${initial ? initial.name : ''}" placeholder="e.g. Makati City Animal Pound" required />
          </div>
          <div class="form-group form-full">
            <label class="form-label">Physical Address *</label>
            <input type="text" class="form-control" name="address" value="${initial ? initial.address : ''}" placeholder="Street, Barangay, City" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input type="text" class="form-control" name="phone" value="${initial ? initial.phone : '+63 (2) 8000-0000'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Official Email</label>
            <input type="email" class="form-control" name="email" value="${initial ? initial.email : 'vet@city.gov.ph'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Daily Holding Tariff</label>
            <input type="text" class="form-control" name="fee" value="${initial ? initial.fee : 'PHP 500 / day'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Kennel Total Capacity</label>
            <input type="number" class="form-control" name="capacity" value="${initial ? initial.capacity : 50}" min="1" max="500" />
          </div>
          <div class="form-group form-full">
            <label class="form-label">Operating Schedule</label>
            <input type="text" class="form-control" name="hours" value="${initial ? initial.hours : 'Mon - Fri: 8:00 AM - 5:00 PM'}" />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="shelter-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="shelter-save-btn">${isEdit ? 'Save Changes' : 'Create Facility'}</button>
      </div>
    `;

    const modal = window.adminApp.openModalContent(modalHtml);

    modal.querySelector('#shelter-close-btn')?.addEventListener('click', () => window.adminApp.closeModal());
    modal.querySelector('#shelter-cancel-btn')?.addEventListener('click', () => window.adminApp.closeModal());

    modal.querySelector('#shelter-save-btn')?.addEventListener('click', () => {
      const form = modal.querySelector('#shelter-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const formData = new FormData(form);

      const shelterData = {
        id: initial ? initial.id : 'sh-' + Date.now(),
        name: formData.get('name'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        fee: formData.get('fee'),
        capacity: parseInt(formData.get('capacity'), 10) || 50,
        occupied: initial ? initial.occupied : 0,
        hours: formData.get('hours'),
        lat: initial ? initial.lat : 14.6000,
        lng: initial ? initial.lng : 121.0000,
        holdingPeriodDays: 3
      };

      store.saveShelter(shelterData);
      window.adminApp.closeModal();
      window.adminApp.showToast(`Saved facility "${shelterData.name}"`, 'success');
      window.adminApp.renderView('shelters');
    });
  }
};
