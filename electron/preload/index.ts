import { ipcRenderer, contextBridge, dialog } from "electron";
import { DisplayInfo } from "@/types/electron-api";
import {
  createPianoAnimationWithAudio,
  PianoAnimation,
} from "./pianoAnimation";

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

  // Create the fragmented tile container
  const tilesContainer = document.createElement("div");
  tilesContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 20;
  `;

  // Create broken tiles that will animate into position with icon backgrounds
  const rows = 6; // Reduced for better visibility
  const cols = 8; // Reduced for better visibility
  const tiles: HTMLDivElement[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = document.createElement("div");
      const tileWidth = 100 / cols;
      const tileHeight = 100 / rows;

      // Determine which edge this tile should come from
      let startX = 0;
      let startY = 0;
      let entryDirection = "";

      // Assign tiles to edges in a more systematic way
      const totalTiles = rows * cols;
      const tileIndex = row * cols + col;
      const tilesPerEdge = Math.floor(totalTiles / 4);

      if (tileIndex < tilesPerEdge) {
        // First quarter - come from TOP edge
        startX = (Math.random() - 0.5) * window.innerWidth * 0.5;
        startY = -window.innerHeight * 1.5;
        entryDirection = "top";
      } else if (tileIndex < tilesPerEdge * 2) {
        // Second quarter - come from RIGHT edge
        startX = window.innerWidth * 1.5;
        startY = (Math.random() - 0.5) * window.innerHeight * 0.5;
        entryDirection = "right";
      } else if (tileIndex < tilesPerEdge * 3) {
        // Third quarter - come from BOTTOM edge
        startX = (Math.random() - 0.5) * window.innerWidth * 0.5;
        startY = window.innerHeight * 1.5;
        entryDirection = "bottom";
      } else {
        // Fourth quarter - come from LEFT edge
        startX = -window.innerWidth * 1.5;
        startY = (Math.random() - 0.5) * window.innerHeight * 0.5;
        entryDirection = "left";
      }

      const randomRotation = (Math.random() - 0.5) * 900; // More dramatic rotation
      const randomScale = 0.05 + Math.random() * 0.2; // Very small initial scale
      const delay = tileIndex * 0.02; // Sequential delay

      // Calculate background position to show the correct portion of the icon
      const bgPosX = -(col / cols) * 100; // Correct percentage positioning
      const bgPosY = -(row / rows) * 100; // Correct percentage positioning

      tile.style.cssText = `
        position: absolute;
        left: ${col * tileWidth}%;
        top: ${row * tileHeight}%;
        width: ${tileWidth}%;
        height: ${tileHeight}%;
        background-image: url('./evsongsicon.png');
        background-position: ${bgPosX}% ${bgPosY}%;
        background-size: ${cols * 100}% ${rows * 100}%;
        background-repeat: no-repeat;
        border: 0.5px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        transform: translate(${startX}px, ${startY}px) rotate(${randomRotation}deg) scale(${randomScale});
        opacity: 0;
        animation: assembleTile 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        animation-delay: ${delay}s;
        z-index: ${1000 - tileIndex};
        overflow: hidden;
        transition: all 0.3s ease;
      `;

      // Store entry direction for exit animation
      tile.setAttribute("data-entry", entryDirection);
      tile.setAttribute("data-index", tileIndex.toString());

      // Add a very subtle overlay to enhance the image
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(160, 82, 45, 0.15) 100%);
        pointer-events: none;
        mix-blend-mode: multiply;
      `;
      tile.appendChild(overlay);

      // Add shimmer effect that runs after assembly
      const shimmer = document.createElement("div");
      shimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 255, 255, 0.6) 50%, 
          transparent);
        animation: tileShimmer 2.5s ease-in-out infinite;
        animation-delay: ${delay + 2}s;
        pointer-events: none;
        z-index: 10;
      `;
      tile.appendChild(shimmer);

      tiles.push(tile);
      tilesContainer.appendChild(tile);
    }
  }

  // Main content container (will appear after tiles assemble)
  const contentContainer = document.createElement("div");
  contentContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 30;
    opacity: 0;
    animation: contentAppear 1s ease-out forwards;
    animation-delay: 2s;
  `;

  // Piano Animation Container
  const pianoContainer = document.createElement("div");

  // Create piano animation instance with audio enabled
  const pianoAnimation = createPianoAnimationWithAudio(pianoContainer, {
    totalKeys: 15,
    keyWidth: 16,
    keyHeight: 60,
    blackKeyHeight: 35,
    animationSpeed: 100,
    glowColor: "rgba(255, 215, 0, 0.6)",
    audioVolume: 0.25, // Moderate volume for loading screen
  });

  // Add CSS animations
  const animationStyles = document.createElement("style");
  animationStyles.textContent = `
    @keyframes assembleTile {
      0% {
        opacity: 0;
        transform: translate(var(--start-x, 0), var(--start-y, 0)) rotate(var(--start-rotation, 0)) scale(var(--start-scale, 1));
        filter: blur(4px) brightness(0.5);
      }
      30% {
        opacity: 0.8;
        filter: blur(2px) brightness(0.8);
      }
      70% {
        opacity: 1;
        transform: translate(0, 0) rotate(5deg) scale(1.02);
        filter: blur(0px) brightness(1.1);
      }
      100% {
        opacity: 1;
        transform: translate(0, 0) rotate(0deg) scale(1);
        filter: blur(0px) brightness(1);
      }
    }

    @keyframes contentAppear {
      0% {
        opacity: 0;
        transform: translateY(50px) scale(0.8);
        filter: blur(10px);
      }
      50% {
        opacity: 0.5;
        transform: translateY(25px) scale(0.9);
        filter: blur(5px);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0px);
      }
    }

    @keyframes tilesDisassemble {
      0% {
        opacity: 1;
        transform: translate(0, 0) rotate(0deg) scale(1);
        filter: brightness(1);
      }
      50% {
        opacity: 0.5;
        filter: brightness(1.5) blur(2px);
      }
      100% {
        opacity: 0;
        transform: translate(var(--exit-x, 0), var(--exit-y, 0)) rotate(var(--exit-rotation, 0)) scale(0.1);
        filter: brightness(0.5) blur(4px);
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

    @keyframes tileShimmer {
      0% { 
        left: -100%;
        opacity: 0;
      }
      50% { 
        left: 0%;
        opacity: 1;
      }
      100% { 
        left: 100%;
        opacity: 0;
      }
    }

    @keyframes tileGlow {
      0% { 
        opacity: 0;
        transform: scale(0.8);
      }
      50% { 
        opacity: 0.6;
        transform: scale(1.05);
      }
      100% { 
        opacity: 0;
        transform: scale(0.8);
      }
    }
  `;
  document.head.appendChild(animationStyles);

  // Assemble the splash screen
  contentContainer.appendChild(pianoContainer);

  splashContainer.appendChild(particlesContainer);
  splashContainer.appendChild(tilesContainer);
  splashContainer.appendChild(contentContainer);

  // Add to DOM
  document.body.appendChild(splashContainer);

  // Start progress animation after tiles begin assembling
  setTimeout(() => {
    // Once tiles are assembled, fade out the tile borders to create seamless background
    setTimeout(() => {
      tilesContainer.style.transition = "opacity 0.8s ease";
      tilesContainer.style.opacity = "0";
    }, 1500); // Wait for tiles to settle

    // Start piano key animation using the new module
    pianoAnimation.startProgressAnimation(
      (progress: number) => {
        // Optional: handle progress updates
        console.log(`Loading progress: ${progress.toFixed(1)}%`);
      },
      () => {
        // Loading complete callback
        setTimeout(() => {
          // Animate tiles out with reverse effect based on their entry direction
          tilesContainer.style.opacity = "1"; // Show tiles again for exit animation
          tiles.forEach((tile, index) => {
            const entryDirection = tile.getAttribute("data-entry");
            const tileIndex = parseInt(tile.getAttribute("data-index") || "0");

            // Calculate exit direction based on entry direction
            let exitX = 0;
            let exitY = 0;

            switch (entryDirection) {
              case "top":
                exitX = (Math.random() - 0.5) * window.innerWidth * 0.3;
                exitY = -window.innerHeight * 2;
                break;
              case "right":
                exitX = window.innerWidth * 2;
                exitY = (Math.random() - 0.5) * window.innerHeight * 0.3;
                break;
              case "bottom":
                exitX = (Math.random() - 0.5) * window.innerWidth * 0.3;
                exitY = window.innerHeight * 2;
                break;
              case "left":
                exitX = -window.innerWidth * 2;
                exitY = (Math.random() - 0.5) * window.innerHeight * 0.3;
                break;
              default:
                // Fallback - exit to random corner
                exitX = (Math.random() - 0.5) * window.innerWidth * 2;
                exitY = (Math.random() - 0.5) * window.innerHeight * 2;
            }

            const exitRotation = (Math.random() - 0.5) * 1080; // More dramatic exit rotation
            const exitDelay = tileIndex * 8; // Staggered exit based on original index

            setTimeout(() => {
              tile.style.transition = `all 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53)`;
              tile.style.transform = `translate(${exitX}px, ${exitY}px) rotate(${exitRotation}deg) scale(0.05)`;
              tile.style.opacity = "0";
              tile.style.filter = "brightness(0.3) blur(2px)";
            }, exitDelay);
          });

          // Fade out splash screen after tiles start exiting
          setTimeout(() => {
            splashContainer.style.transition = "opacity 1s ease";
            splashContainer.style.opacity = "0";

            setTimeout(() => {
              pianoAnimation.destroy(); // Clean up piano animation
              splashContainer.remove();
            }, 1000);
          }, 800);
        }, 500); // Delay before exit animation
      }
    );
  }, 2000); // Start progress after tiles have started assembling

  // Fallback removal after 7 seconds (increased due to longer animation)
  setTimeout(() => {
    if (document.getElementById("blessed-music-splash")) {
      splashContainer.style.transition = "opacity 0.8s ease";
      splashContainer.style.opacity = "0";
      setTimeout(() => splashContainer.remove(), 800);
    }
  }, 7000);
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
    callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => ipcRenderer.on("songs-loaded", callback),
  projectSong: (song: Song) => ipcRenderer.invoke("project-song", song),
  isProjectionActive: () => ipcRenderer.invoke("is-projection-active"),
  closeProjectionWindow: () => ipcRenderer.invoke("close-projection-window"),
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
    }
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
    command: "next" | "prev" | "pause" | "resume" | "stop"
  ) => ipcRenderer.invoke("send-projection-command", command),

  onProjectionError: (
    callback: (error: { message: string; code?: string }) => void
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      error: { message: string; code?: string }
    ) => {
      callback(error);
    };
    ipcRenderer.on("projection-error", listener);
    return () => {
      ipcRenderer.removeListener("projection-error", listener);
    };
  },

  onProjectionReady: (
    callback: (status: { ready: boolean; displayId?: number }) => void
  ) => {
    const listener = (
      event: Electron.IpcRendererEvent,
      status: { ready: boolean; displayId?: number }
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
    mode: "extend" | "duplicate" | "internal" | "external"
  ) => ipcRenderer.invoke("set-windows-display-mode", mode),
  getWindowsDisplayMode: () => ipcRenderer.invoke("get-windows-display-mode"),
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
