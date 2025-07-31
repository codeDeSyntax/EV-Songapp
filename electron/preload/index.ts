import { ipcRenderer, contextBridge, dialog } from "electron";
import { DisplayInfo } from "@/types/electron-api";

// --------- Splash Screen Implementation ---------
function createSplashScreen() {
  // Create splash screen container
  const splashContainer = document.createElement("div");
  splashContainer.id = "blessed-music-splash";
  splashContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #fdf4d0 0%, #faeed1 50%, #f3e8d0 100%);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Georgia', serif;
    overflow: hidden;
  `;

  // Create animated background particles
  const particlesContainer = document.createElement("div");
  particlesContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  `;

  // Add floating particles for elegance
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: rgba(154, 103, 74, 0.1);
      border-radius: 50%;
      animation: float-${i} ${15 + Math.random() * 10}s infinite linear;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
    `;
    particlesContainer.appendChild(particle);

    // Add keyframes for each particle
    const style = document.createElement("style");
    style.textContent = `
      @keyframes float-${i} {
        0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Main content container
  const contentContainer = document.createElement("div");
  contentContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 10;
  `;

  // Static base icon (always visible)
  const staticIcon = document.createElement("img");
  staticIcon.src = "./evsongsicon.png";
  staticIcon.style.cssText = `
    width: 120px;
    height: 120px;
    object-fit: contain;
    filter: drop-shadow(0 8px 24px rgba(154, 103, 74, 0.15));
    position: relative;
    z-index: 1;
  `;

  // Animated overlay icon (Microsoft Word style - slides in and out)
  const animatedIcon = document.createElement("img");
  animatedIcon.src = "./evsongsicon.png";
  animatedIcon.style.cssText = `
    width: 120px;
    height: 120px;
    object-fit: contain;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    animation: slideInOut 2s ease-in-out infinite;
  `;

  // Icon container to hold both static and animated versions
  const iconContainer = document.createElement("div");
  iconContainer.style.cssText = `
    position: relative;
    margin-bottom: 40px;
    transform: translateY(-20px);
  `;

  // Loading progress bar container
  const progressContainer = document.createElement("div");
  progressContainer.style.cssText = `
    width: 240px;
    height: 3px;
    background: rgba(154, 103, 74, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 30px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  `;

  const progressBar = document.createElement("div");
  progressBar.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #d97706 0%, #9a674a 50%, #92400e 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
    box-shadow: 0 1px 3px rgba(154, 103, 74, 0.3);
  `;

  // Add CSS animations
  const animationStyles = document.createElement("style");
  animationStyles.textContent = `
    @keyframes slideInOut {
      0% { 
        transform: translateX(-100%);
        opacity: 0;
      }
      25% { 
        transform: translateX(0);
        opacity: 1;
      }
      75% { 
        transform: translateX(0);
        opacity: 1;
      }
      100% { 
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shimmer {
      0% { background-position: -240px 0; }
      100% { background-position: 240px 0; }
    }
  `;
  document.head.appendChild(animationStyles);

  // Assemble the splash screen
  iconContainer.appendChild(staticIcon);
  iconContainer.appendChild(animatedIcon);
  progressContainer.appendChild(progressBar);
  contentContainer.appendChild(iconContainer);
  contentContainer.appendChild(progressContainer);
  splashContainer.appendChild(particlesContainer);
  splashContainer.appendChild(contentContainer);

  // Add to DOM
  document.body.appendChild(splashContainer);

  // Animate progress bar
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress > 100) progress = 100;
    progressBar.style.width = progress + "%";

    if (progress >= 100) {
      clearInterval(progressInterval);
      // Keep splash visible for a moment after completion
      setTimeout(() => {
        // Fade out splash screen
        splashContainer.style.transition =
          "opacity 0.8s ease, transform 0.8s ease";
        splashContainer.style.opacity = "0";
        splashContainer.style.transform = "scale(1.05)";

        setTimeout(() => {
          splashContainer.remove();
        }, 800);
      }, 500);
    }
  }, 100);

  // Fallback removal after 5 seconds
  setTimeout(() => {
    if (document.getElementById("blessed-music-splash")) {
      clearInterval(progressInterval);
      splashContainer.style.transition = "opacity 0.8s ease";
      splashContainer.style.opacity = "0";
      setTimeout(() => splashContainer.remove(), 800);
    }
  }, 5000);
}

// Show splash screen when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createSplashScreen);
} else {
  createSplashScreen();
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
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
  saveSong: (directory: string, title: string, content: string) =>
    ipcRenderer.invoke("save-song", { directory, title, content }),
  editSong: (songData: any) => ipcRenderer.invoke("edit-song", songData),
  fetchSongs: (directory: string) =>
    ipcRenderer.invoke("fetch-songs", directory),
  deleteSong: (filePath: string) => ipcRenderer.invoke("delete-song", filePath),
  searchSong: (directory: string, query: string) =>
    ipcRenderer.invoke("search-songs", directory, query),
  onSongsLoaded: (
    callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => ipcRenderer.on("songs-loaded", callback),
  projectSong: (song: Song) => ipcRenderer.invoke("project-song", song),
  isProjectionActive: () => ipcRenderer.invoke("is-projection-active"),
  closeProjectionWindow: () => ipcRenderer.invoke("close-projection-window"),
  onProjectionStateChanged: (callback: (isActive: boolean) => void) => {
    ipcRenderer.on("projection-state-changed", (event, isActive) =>
      callback(isActive)
    );
    return () => {
      ipcRenderer.removeAllListeners("projection-state-changed");
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
  logToSecretLogger: (logData: {
    application: string;
    category: string;
    message: string;
    details?: any;
  }) => ipcRenderer.invoke("log-to-secret-logger", logData),
  getSecretLogs: () => ipcRenderer.invoke("get-secret-logs"),
  clearSecretLogs: () => ipcRenderer.invoke("clear-secret-logs"),
  exportSecretLogs: () => ipcRenderer.invoke("export-secret-logs"),
  getLogSettings: () => ipcRenderer.invoke("get-log-settings"),
  updateLogSettings: (settings: any) =>
    ipcRenderer.invoke("update-log-settings", settings),

  // Song Projection Navigation and Font Size API
  sendToSongProjection: (data: {
    command?: string;
    data?: any;
    fontSize?: number;
  }) => ipcRenderer.invoke("send-to-song-projection", data),
  sendToMainWindow: (data: { type: string; data: any }) =>
    ipcRenderer.invoke("send-to-main-window", data),
  onSongProjectionCommand: (
    callback: (event: { command: string; data?: any }) => void
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      data: { command: string; data?: any }
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
    callback: (event: { type: string; data: any }) => void
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      data: { type: string; data: any }
    ) => {
      callback(data);
    };
    ipcRenderer.on("main-window-message", listener);
    return () => {
      ipcRenderer.removeListener("main-window-message", listener);
    };
  },
});

// --------- Preload scripts loading ---------
function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"]
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
  oDiv.innerHTML = `<div class="${className}"><img src="./evsongsicon.png" alt="Loading..." /></div>`;

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
