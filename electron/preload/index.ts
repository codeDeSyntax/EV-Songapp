import { ipcRenderer, contextBridge } from "electron";
import { DisplayInfo } from "@/types/electron-api";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("api", {
  maximizeApp: () => ipcRenderer.send("maximizeApp"),
  minimizeApp: () => {
    console.log("Minimize action triggered");
    ipcRenderer.send("minimizeApp");
  },
  // Add this to your preload script's contextBridge.exposeInMainWorld call
  minimizeProjection: () => ipcRenderer.send("minimizeProjection"),
  closeApp: () => {
    console.log("Close action triggered");
    ipcRenderer.send("closeApp");
  },
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  getSystemFonts: () => ipcRenderer.invoke("get-system-fonts"),
  getDefaultSongsDirectory: () =>
    ipcRenderer.invoke("get-default-songs-directory"),
  saveSong: (directory: string, title: string, content: string) =>
    ipcRenderer.invoke("save-song", { directory, title, content }),
  editSong: (songData: any) => ipcRenderer.invoke("edit-song", songData),
  fetchSongs: (directory: string) =>
    ipcRenderer.invoke("fetch-songs", directory),
  deleteSong: (filePath: string) => ipcRenderer.invoke("delete-song", filePath),
  searchSong: (directory: string, query: string) =>
    ipcRenderer.invoke("search-songs", directory, query),
  onSongsLoaded: (
    callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
  ) => ipcRenderer.on("songs-loaded", callback),
  projectSong: (song: Song) => ipcRenderer.invoke("project-song", song),
  isProjectionActive: () => ipcRenderer.invoke("is-projection-active"),
  closeProjectionWindow: () => ipcRenderer.invoke("close-projection-window"),
  focusProjectionWindow: () => ipcRenderer.invoke("focus-projection-window"),
  onProjectionStateChanged: (callback: (isActive: boolean) => void) => {
    const listener = (event: Electron.IpcRendererEvent, isActive: boolean) => {
      callback(isActive);
    };
    ipcRenderer.on("projection-state-changed", listener);
    return () => {
      ipcRenderer.removeListener("projection-state-changed", listener);
    };
  },
  onDisplaySong: (callback: (songData: any) => void) => {
    ipcRenderer.on("display-song", (event, songData) => callback(songData));
    return () => {
      ipcRenderer.removeAllListeners("display-song");
    };
  },
  onDisplayInfo: (callback: (info: DisplayInfo) => void) => {
    ipcRenderer.on("display-info", (event, info) => callback(info));
    return () => {
      ipcRenderer.removeAllListeners("display-info");
    };
  },
  getImages: (dirPath: string) => ipcRenderer.invoke("get-images", dirPath),

  // Song Presentation API
  focusMainWindow: () => ipcRenderer.invoke("focus-main-window"),
  openFileInDefaultApp: (filePath: string) =>
    ipcRenderer.invoke("open-file-in-default-app", filePath),
  constructFilePath: (basePath: string, fileName: string) =>
    ipcRenderer.invoke("construct-file-path", basePath, fileName),
  getDisplayInfo: () => ipcRenderer.invoke("get-display-info"),
  testVisualSongBookOverride: () =>
    ipcRenderer.invoke("test-visual-songbook-override"),
  saveDisplayPreferences: (preferences: any) =>
    ipcRenderer.invoke("save-display-preferences", preferences),
  loadDisplayPreferences: () => ipcRenderer.invoke("load-display-preferences"),
  setProjectionPreferences: (preferences: {
    displayId: number;
    mode: string;
  }) => ipcRenderer.invoke("set-projection-preferences", preferences),

  // Song Projection Navigation and Font Size API
  sendToSongProjection: (data: {
    command?: string;
    data?: any;
    fontSize?: number;
  }) => ipcRenderer.invoke("send-to-song-projection", data),
  sendToMainWindow: (data: { type: string; data: any }) =>
    ipcRenderer.invoke("send-to-main-window", data),
  onSongProjectionCommand: (
    callback: (event: { command: string; data?: any }) => void,
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      data: { command: string; data?: any },
    ) => {
      callback(data);
    };
    ipcRenderer.on("song-projection-command", listener);
    return () => {
      ipcRenderer.removeListener("song-projection-command", listener);
    };
  },
  onFontSizeUpdate: (callback: (fontSize: number) => void) => {
    const listener = (event: Electron.IpcRendererEvent, fontSize: number) => {
      callback(fontSize);
    };
    ipcRenderer.on("font-size-update", listener);
    return () => {
      ipcRenderer.removeListener("font-size-update", listener);
    };
  },
  onMainWindowMessage: (
    callback: (event: { type: string; data: any }) => void,
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      data: { type: string; data: any },
    ) => {
      callback(data);
    };
    ipcRenderer.on("main-window-message", listener);
    return () => {
      ipcRenderer.removeListener("main-window-message", listener);
    };
  },

  // Enhanced Song Projection APIs
  projectSongWithSettings: (
    song: Song,
    settings?: {
      display?: number;
      fontSize?: number;
      fontFamily?: string;
      backgroundColor?: string;
      textColor?: string;
      backgroundImage?: string;
      transition?: "fade" | "slide" | "none";
      duration?: number;
    },
  ) => ipcRenderer.invoke("project-song-with-settings", { song, settings }),

  updateProjectionSettings: (settings: {
    fontSize?: number;
    fontFamily?: string;
    backgroundColor?: string;
    textColor?: string;
    backgroundImage?: string;
  }) => ipcRenderer.invoke("update-projection-settings", settings),

  getProjectionSettings: () => ipcRenderer.invoke("get-projection-settings"),

  previewSongOnDisplay: (song: Song, displayId: number) =>
    ipcRenderer.invoke("preview-song-on-display", { song, displayId }),

  testDisplayProjection: (displayId: number, testMessage?: string) =>
    ipcRenderer.invoke("test-display-projection", { displayId, testMessage }),

  getProjectionStatus: () => ipcRenderer.invoke("get-projection-status"),

  setProjectionTheme: (theme: "light" | "dark" | "creamy" | "custom") =>
    ipcRenderer.invoke("set-projection-theme", theme),

  captureProjectionScreenshot: () =>
    ipcRenderer.invoke("capture-projection-screenshot"),

  // Real-time projection control
  sendProjectionCommand: (
    command: "next" | "prev" | "pause" | "resume" | "stop",
  ) => ipcRenderer.invoke("send-projection-command", command),

  onProjectionError: (
    callback: (error: { message: string; code?: string }) => void,
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      error: { message: string; code?: string },
    ) => {
      callback(error);
    };
    ipcRenderer.on("projection-error", listener);
    return () => {
      ipcRenderer.removeListener("projection-error", listener);
    };
  },

  onProjectionReady: (
    callback: (status: { ready: boolean; displayId?: number }) => void,
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      status: { ready: boolean; displayId?: number },
    ) => {
      callback(status);
    };
    ipcRenderer.on("projection-ready", listener);
    return () => {
      ipcRenderer.removeListener("projection-ready", listener);
    };
  },

  // Advanced display management
  detectDisplayChanges: () => ipcRenderer.invoke("detect-display-changes"),
  validateDisplayConfiguration: () =>
    ipcRenderer.invoke("validate-display-configuration"),
  optimizeProjectionPerformance: () =>
    ipcRenderer.invoke("optimize-projection-performance"),

  onDisplayConfigChanged: (callback: (displays: any[]) => void) => {
    const listener = (event: Electron.IpcRendererEvent, displays: any[]) => {
      callback(displays);
    };
    ipcRenderer.on("display-config-changed", listener);
    return () => {
      ipcRenderer.removeListener("display-config-changed", listener);
    };
  },

  // Windows Display Mode Control (like Windows + P)
  setWindowsDisplayMode: (
    mode: "extend" | "duplicate" | "internal" | "external",
  ) => ipcRenderer.invoke("set-windows-display-mode", mode),
  getWindowsDisplayMode: () => ipcRenderer.invoke("get-windows-display-mode"),

  // ---- Backup & Google Drive ----
  googleAuthStart: () => ipcRenderer.invoke("google-auth-start"),
  googleDriveStatus: () => ipcRenderer.invoke("google-drive-status"),
  googleDriveDisconnect: () => ipcRenderer.invoke("google-drive-disconnect"),
  googleDriveBackup: (songsDir?: string) =>
    ipcRenderer.invoke("google-drive-backup", songsDir),
  backupSongsLocal: (songsDir?: string) =>
    ipcRenderer.invoke("backup-songs-local", songsDir),
  getLastBackupTime: () => ipcRenderer.invoke("get-last-backup-time"),
  onBackupProgress: (
    callback: (progress: { stage: "zipping" | "uploading" }) => void,
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      progress: { stage: "zipping" | "uploading" },
    ) => callback(progress);
    ipcRenderer.on("backup-progress", listener);
    return () => ipcRenderer.removeListener("backup-progress", listener);
  },
  generatePdf: (type: "prelist" | "database", songs: any[]) =>
    ipcRenderer.invoke("generate-pdf", type, songs),

  // ── Clipboard ─────────────────────────────────────────────────────────────
  clipboardWrite: (text: string) =>
    ipcRenderer.invoke("clipboard-write-text", text),
  clipboardRead: (): Promise<string> =>
    ipcRenderer.invoke("clipboard-read-text"),

  // ── App info ──────────────────────────────────────────────────────────────
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("get-app-version"),

  // ── Launch on startup ──────────────────────────────────────────────────────
  getLoginItemSettings: () => ipcRenderer.invoke("get-login-item-settings"),
  setLoginItemSettings: (openAtLogin: boolean) =>
    ipcRenderer.invoke("set-login-item-settings", openAtLogin),

  // ── Cursor ─────────────────────────────────────────────────────────────────
  getCursorScreenPoint: () => ipcRenderer.invoke("get-cursor-screen-point"),

  // ── OS Notifications ───────────────────────────────────────────────────────
  sendOsNotification: (payload: {
    title: string;
    body: string;
    silent?: boolean;
  }) => ipcRenderer.invoke("send-os-notification", payload),

  // ── Native theme ───────────────────────────────────────────────────────────
  getNativeTheme: () => ipcRenderer.invoke("get-native-theme"),
  onNativeThemeChange: (
    callback: (info: { shouldUseDarkColors: boolean }) => void,
  ) => {
    const listener = (
      _e: Electron.IpcRendererEvent,
      info: { shouldUseDarkColors: boolean },
    ) => callback(info);
    ipcRenderer.on("native-theme-updated", listener);
    return () => ipcRenderer.removeListener("native-theme-updated", listener);
  },

  // ── Tray ───────────────────────────────────────────────────────────────────
  refreshTrayMenu: () => ipcRenderer.invoke("refresh-tray-menu"),
  onTrayAction: (callback: (action: string) => void) => {
    const listener = (
      _e: Electron.IpcRendererEvent,
      payload: { action: string },
    ) => callback(payload.action);
    ipcRenderer.on("tray-action", listener);
    return () => ipcRenderer.removeListener("tray-action", listener);
  },

  // ── Global shortcuts (system-wide) ────────────────────────────────────────
  onGlobalShortcut: (callback: (action: string) => void) => {
    const listener = (
      _e: Electron.IpcRendererEvent,
      payload: { action: string },
    ) => callback(payload.action);
    ipcRenderer.on("global-shortcut", listener);
    return () => ipcRenderer.removeListener("global-shortcut", listener);
  },

  // ── Shell ─────────────────────────────────────────────────────────────────
  shellOpenExternal: (url: string) =>
    ipcRenderer.invoke("shell-open-external", url),
});

// --------- Preload scripts loading ---------
function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"],
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__image-spin`;
  const styleContent = `
@keyframes image-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.${className} > img {
  width: 50px;
  height: 50px;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faeed1;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  // oDiv.innerHTML = `<div class="${className}"><img src="./evsongsicon.png" alt="Loading..." /></div>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 4999);
