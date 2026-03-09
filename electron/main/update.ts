import { app, ipcMain } from "electron";
import { createRequire } from "node:module";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

const { autoUpdater } = createRequire(import.meta.url)("electron-updater");

export function update(win: Electron.BrowserWindow) {
  // Silent auto-download: download starts as soon as an update is found
  autoUpdater.autoDownload = true;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;

  // start check
  autoUpdater.on("checking-for-update", function () {});
  // update available — download starts automatically because autoDownload = true
  autoUpdater.on("update-available", (arg: UpdateInfo) => {
    win.webContents.send("update-can-available", {
      update: true,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });
  // update not available
  autoUpdater.on("update-not-available", (arg: UpdateInfo) => {
    win.webContents.send("update-can-available", {
      update: false,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });
  // download finished — tell the renderer to show the TitleBar badge
  autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
    win.webContents.send("update-downloaded", { version: info.version });
  });
  // forward download progress to renderer
  autoUpdater.on("download-progress", (info: ProgressInfo) => {
    win.webContents.send("download-progress", info);
  });

  // ── DEV SIMULATION ── fires the badge after 5s so you can test the UI
  // Remove this block before shipping the next release.
  if (!app.isPackaged) {
    setTimeout(() => {
      win.webContents.send("update-downloaded", { version: "99.9.9" });
    }, 5000);
    return;
  }

  // Checking for updates
  ipcMain.handle("check-update", async () => {
    try {
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      return { message: "Network error", error };
    }
  });

  // Start downloading and feedback on progress
  ipcMain.handle("start-download", (event: Electron.IpcMainInvokeEvent) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          event.sender.send("update-error", { message: error.message, error });
        } else {
          // feedback update progress message
          event.sender.send("download-progress", progressInfo);
        }
      },
      () => {
        // feedback update downloaded message
        event.sender.send("update-downloaded");
      },
    );
  });

  // Install now
  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  _complete: (event: UpdateDownloadedEvent) => void,
) {
  // download-progress and update-downloaded are already forwarded to the
  // renderer via top-level listeners in update(). Just kick off the download.
  autoUpdater.on("error", (error: Error) => callback(error, null));
  autoUpdater.downloadUpdate();
}
