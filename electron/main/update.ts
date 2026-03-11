import { app, ipcMain } from "electron";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

const { autoUpdater } = createRequire(import.meta.url)("electron-updater");

// ── Preference storage ───────────────────────────────────────────────────────
// Stored at: userData/bor-update-prefs.json
// Default: { autoUpdate: false } → manual mode

function prefsPath() {
  return path.join(app.getPath("userData"), "bor-update-prefs.json");
}

function readPrefs(): { autoUpdate: boolean } {
  try {
    return JSON.parse(fs.readFileSync(prefsPath(), "utf8"));
  } catch {
    return { autoUpdate: false };
  }
}

function writePrefs(prefs: { autoUpdate: boolean }) {
  fs.writeFileSync(prefsPath(), JSON.stringify(prefs, null, 2), "utf8");
}

// ── Main update function ─────────────────────────────────────────────────────

export function update(win: Electron.BrowserWindow) {
  const prefs = readPrefs();
  autoUpdater.autoDownload = prefs.autoUpdate;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;

  // Helper: send a status update to renderer
  const send = (
    status:
      | "checking"
      | "available"
      | "downloading"
      | "ready"
      | "up-to-date"
      | "error",
    extra?: object,
  ) => {
    if (!win.isDestroyed()) {
      win.webContents.send("update-status", { status, ...extra });
    }
  };

  // ── autoUpdater events ─────────────────────────────────────────────────────

  autoUpdater.on("checking-for-update", () => {
    send("checking");
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    if (autoUpdater.autoDownload) {
      // auto mode: download already started — show downloading state
      send("downloading", { version: info.version, percent: 0 });
    } else {
      // manual mode: show "Download" button
      send("available", { version: info.version });
    }
  });

  autoUpdater.on("update-not-available", () => {
    send("up-to-date");
  });

  autoUpdater.on("download-progress", (info: ProgressInfo) => {
    send("downloading", {
      percent: Math.floor(info.percent),
    });
  });

  autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
    send("ready", { version: info.version });
  });

  autoUpdater.on("error", (err: Error) => {
    send("error", { message: err.message });
  });

  // ── IPC handlers ───────────────────────────────────────────────────────────

  // Trigger update check manually
  ipcMain.handle("check-update", async () => {
    try {
      send("checking");
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (err: any) {
      send("error", { message: err.message });
      return { message: "Network error", error: err };
    }
  });

  // Start download (manual mode — called when user clicks "Download")
  ipcMain.handle("download-update", async () => {
    try {
      send("downloading", { percent: 0 });
      await autoUpdater.downloadUpdate();
    } catch (err: any) {
      send("error", { message: err.message });
    }
  });

  // Read current preference
  ipcMain.handle("get-update-preference", () => {
    return readPrefs();
  });

  // Save preference + apply immediately for current session
  ipcMain.handle(
    "set-update-preference",
    (_e, newPrefs: { autoUpdate: boolean }) => {
      writePrefs(newPrefs);
      autoUpdater.autoDownload = newPrefs.autoUpdate;
      return newPrefs;
    },
  );

  // Install the downloaded update
  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // ── Auto-check on startup ──────────────────────────────────────────────────
  // Wait for the renderer to finish loading before checking, so the
  // update-status event is received by the mounted React component.
  win.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }, 3000);
  });
}
