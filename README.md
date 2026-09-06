# PawTrack Admin Console · Municipal Gateway

> Municipal Pet Recovery, Impoundment Management, and Emergency Alert Gateway — Paired with [PawTrack Pet Owner App](https://github.com/Dariush0801/pawtrack.git).

---

## 🏛️ Ecosystem Repositories

| Application | Role | GitHub Repository | Local Port |
|---|---|---|---|
| **PawTrack Admin** | Municipal Pound & LGU Animal Welfare Admin Console | [github.com/Dariush0801/pawtrack_admin](https://github.com/Dariush0801/pawtrack_admin.git) | `http://localhost:8080` |
| **PawTrack Owner** | Citizen & Pet Owner Portal (Registration & Lost/Found Reports) | [github.com/Dariush0801/pawtrack](https://github.com/Dariush0801/pawtrack.git) | `http://localhost:3000` |

---

## ⚡ Key Features

- **Pet Registry Management**: Real-time municipal registry with quick status updates, RFID & microchip mapping, and search filters.
- **Unregistered Stray & Found Reports**: Live citizen report triage submitted from the Owner App with GPS pins, photo previews, edit drawers, and 1-click **+ Register** promotion to official registry.
- **Municipal Impoundment Queue**: 72-hour legal holding window tracker, facility kennel assignments, fee calculations, and release processing.
- **Emergency Broadcast Dispatch**: Multi-channel push alerts for lost pets, quarantine advisories, and owner notifications.
- **Facility Operations & RFID Telemetry**: Real-time capacity meters and RFID scanner emulator.
- **Real-Time Cross-App Sync**: Live bidirectional data synchronization via Server-Sent Events (SSE), multi-tab `BroadcastChannel`, and shared state.

---

## 🚀 Quick Start (Local)

```bash
# 1. Start PawTrack Admin Console
npm start
# Opens at http://localhost:8080

# 2. Run All Automated Verification Tests
npm run test:all
```

---

## 🔄 Automatic Git Synchronization

Every file modification in this repository can be automatically committed and pushed to GitHub:

- **Run Continuous Watcher**: Double-click `auto-sync.bat` or run:
  ```bash
  node scripts/auto-sync.js
  ```
- **Instant Manual Push**: Double-click `sync-now.bat`.

---

## ☁️ Vercel Deployment

This repository is pre-configured with `vercel.json` and serverless functions in `api/`:

1. Import this repository (`https://github.com/Dariush0801/pawtrack_admin.git`) in [Vercel](https://vercel.com).
2. Framework Preset: **Other** / Static HTML.
3. Root Directory: `./`
4. Click **Deploy**. Vercel will automatically serve `index.html` with clean URLs and serverless endpoints.
