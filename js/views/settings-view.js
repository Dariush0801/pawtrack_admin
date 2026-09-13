/**
 * PawTrack Admin — System Settings & Data Governance
 * Municipal fee configurations, auto-alert triggers, JSON backup/restore, GitHub sync & seed reset
 */

window.SettingsView = {
  render(container) {
    const store = window.adminStore;
    const settings = store.getSettings();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-titles">
          <h1>System Settings & Data Governance</h1>
          <div class="subtitle">
            <span>Municipal Tariffs, Holding Window Policies, Real-Time Ecosystem & GitHub Cloud Sync</span>
          </div>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-secondary" id="btn-export-db">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export JSON Backup
          </button>
          <button class="btn btn-primary" id="btn-save-settings">
            Save Configuration
          </button>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Left Column: Municipal Policies -->
        <div class="nock-card">
          <div class="nock-card-head">
            <span class="nock-card-title">Municipal Ordinance Parameters</span>
            <span class="nock-card-right">Active Policy</span>
          </div>

          <form id="settings-form" class="form-grid">
            <div class="form-group form-full">
              <label class="form-label">Gateway System Title</label>
              <input type="text" class="form-control" name="systemName" value="${settings.systemName || 'PawTrack Municipal Gateway'}" />
            </div>

            <div class="form-group">
              <label class="form-label">Default Holding Window (Hours)</label>
              <input type="number" class="form-control" name="holdingWindowHours" value="${settings.holdingWindowHours || 72}" min="24" max="240" />
            </div>

            <div class="form-group">
              <label class="form-label">Default Daily Holding Fee (PHP)</label>
              <input type="number" class="form-control" name="dailyHoldingFeeDefault" value="${settings.dailyHoldingFeeDefault || 500}" min="0" step="50" />
            </div>

            <div class="form-group">
              <label class="form-label">Expiry Warning Notice (Hours)</label>
              <input type="number" class="form-control" name="expiryWarningHours" value="${settings.expiryWarningHours || 12}" min="1" max="48" />
            </div>

            <div class="form-group">
              <label class="form-label">Regional Jurisdiction</label>
              <input type="text" class="form-control" name="municipalJurisdiction" value="${settings.municipalJurisdiction || 'Metro Manila'}" />
            </div>

            <div class="form-full" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--border-light);">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <input type="checkbox" name="autoNotifyOwnerOnIntake" ${settings.autoNotifyOwnerOnIntake ? 'checked' : ''} />
                <span>Automatically dispatch urgent push alert to owner upon shelter intake</span>
              </label>

              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <input type="checkbox" name="autoNotifyOwnerOnExpiryWarning" ${settings.autoNotifyOwnerOnExpiryWarning ? 'checked' : ''} />
                <span>Send 12-hour holding expiration reminder to owner contact</span>
              </label>
            </div>
          </form>
        </div>

        <!-- Right Column: Real-Time Sync, GitHub & Data Governance -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- GitHub & Realtime Ecosystem Status -->
          <div class="nock-card">
            <div class="nock-card-head">
              <span class="nock-card-title">Real-Time Sync & GitHub Integration</span>
              <span class="status-pill status-safe" id="git-settings-status-badge">Live Synced</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
              <div style="background: var(--bg-hover); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: var(--ink-secondary);">Owner Portal Bridge:</span>
                  <span class="status-pill status-safe" style="font-size: 10px;">Port 3000 (Connected)</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: var(--ink-secondary);">Admin Console:</span>
                  <span class="status-pill status-safe" style="font-size: 10px;">Port 8080 (SSE Active)</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: var(--ink-secondary);">GitHub Remote:</span>
                  <span style="font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-primary);">github.com/Dariush0801/pawtrack_admin</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: var(--ink-secondary);">Active Branch:</span>
                  <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-emerald);">main</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;" id="git-settings-last-commit-row">
                  <span style="font-weight: 600; color: var(--ink-secondary);">Latest Commit:</span>
                  <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);" id="git-settings-last-commit">Fetching...</span>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button class="btn btn-primary" id="btn-settings-git-sync" style="flex: 1;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2"/></svg>
                  Sync to GitHub Now
                </button>
                <button class="btn btn-secondary" id="btn-settings-git-refresh">
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          <!-- Backup & Restore -->
          <div class="nock-card">
            <div class="nock-card-head">
              <span class="nock-card-title">Database Backup & JSON Restore</span>
              <span class="nock-card-right">Shared Node Sync</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12px;">
              <p style="color: var(--ink-secondary); line-height: 1.45;">
                Export full system state (Pets, Impoundments, Shelters, RFID inventory, Notifications, Audit logs) as a portable JSON snapshot.
              </p>

              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" id="btn-trigger-import" style="flex: 1;">
                  Import JSON File
                </button>
                <input type="file" id="file-import-input" accept=".json" style="display: none;" />
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="nock-card" style="border-color: var(--color-red-border); background: #fffaf9;">
            <div class="nock-card-head">
              <span class="nock-card-title" style="color: var(--color-red);">Danger Zone: Factory Reset</span>
              <span class="nock-card-right" style="color: var(--color-red);">Irreversible</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12px;">
              <p style="color: var(--ink-secondary); line-height: 1.45;">
                Reset all pets, impoundments, shelters, notifications, and RFID tags back to original initial seed demo records.
              </p>

              <button class="btn btn-danger" id="btn-factory-reset">
                Reset All Data to Factory Seeds
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents(container) {
    const store = window.adminStore;

    // Load Git Status
    const loadGitDetails = async () => {
      try {
        const res = await fetch('/api/git/status');
        if (res.ok) {
          const data = await res.json();
          const commitEl = container.querySelector('#git-settings-last-commit');
          const badgeEl = container.querySelector('#git-settings-status-badge');
          if (commitEl && data.lastCommit) {
            commitEl.textContent = data.lastCommit;
          }
          if (badgeEl) {
            badgeEl.textContent = data.isClean ? 'Working Tree Clean' : `${data.uncommittedCount} Modified File(s)`;
            badgeEl.className = data.isClean ? 'status-pill status-safe' : 'status-pill status-warning';
          }
        }
      } catch (e) {}
    };
    loadGitDetails();

    // GitHub Sync buttons
    container.querySelector('#btn-settings-git-sync')?.addEventListener('click', async () => {
      await window.adminApp.triggerGitSync('Manual sync from Admin Settings Console');
      loadGitDetails();
    });

    container.querySelector('#btn-settings-git-refresh')?.addEventListener('click', () => {
      loadGitDetails();
      window.adminApp.showToast('Git and Ecosystem status refreshed.', 'info', 1500);
    });

    // Save Settings button
    container.querySelector('#btn-save-settings')?.addEventListener('click', () => {
      const form = container.querySelector('#settings-form');
      const formData = new FormData(form);

      const newSettings = {
        systemName: formData.get('systemName'),
        holdingWindowHours: parseInt(formData.get('holdingWindowHours'), 10) || 72,
        dailyHoldingFeeDefault: parseInt(formData.get('dailyHoldingFeeDefault'), 10) || 500,
        expiryWarningHours: parseInt(formData.get('expiryWarningHours'), 10) || 12,
        municipalJurisdiction: formData.get('municipalJurisdiction'),
        autoNotifyOwnerOnIntake: form.querySelector('[name="autoNotifyOwnerOnIntake"]').checked,
        autoNotifyOwnerOnExpiryWarning: form.querySelector('[name="autoNotifyOwnerOnExpiryWarning"]').checked
      };

      store.saveSettings(newSettings);
      window.adminApp.showToast('Municipal gateway settings saved successfully!', 'success');
    });

    // Export Database JSON
    container.querySelector('#btn-export-db')?.addEventListener('click', () => {
      const json = store.exportDatabaseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pawtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.adminApp.showToast('Database exported to JSON file', 'success');
    });

    // Import Database JSON
    const fileInput = container.querySelector('#file-import-input');
    container.querySelector('#btn-trigger-import')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const success = store.importDatabaseJSON(content);
        if (success) {
          window.adminApp.showToast('Database restored successfully from JSON backup!', 'success');
          this.render(container);
        } else {
          window.adminApp.showToast('Failed to parse JSON backup file.', 'error');
        }
      };
      reader.readAsText(file);
    });

    // Factory Reset
    container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
      if (confirm('CRITICAL WARNING: This will reset all pets, shelters, impoundments, and alerts back to default seed records. Proceed?')) {
        store.resetToDefaults();
        window.adminApp.showToast('Factory reset complete. Seed data restored.', 'warning');
        this.render(container);
      }
    });
  }
};
