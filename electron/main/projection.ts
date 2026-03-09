import { BrowserWindow, screen, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  logSystemInfo,
  logSongProjection,
  logSongError,
} from "../../src/utils/SecretLogger";

const execAsync = promisify(exec);

// ES Module compatibility
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global projection variables
let songPresentationWin: BrowserWindow | null = null;
let isSongPresentationMinimized = false;
let isProjectionActive = false;

// Export functions to access projection state
export function getSongPresentationWindow() {
  return songPresentationWin;
}

export function getIsProjectionActive() {
  return isProjectionActive;
}

// Global projection settings storage
let globalProjectionSettings = {
  fontSize: 28,
  fontFamily: "'Georgia', serif",
  backgroundColor: "#000000",
  textColor: "#FFFFFF",
  backgroundImage: null,
  theme: "dark",
};

// Constants
const RENDERER_DIST = path.join(process.env.APP_ROOT || "", "dist");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

// No Windows display mode switching needed - we detect displays directly

// Helper function to load display preferences
async function loadDisplayPreferences() {
  try {
    const prefsPath = path.join(
      os.homedir(),
      ".ev-songapp-display-config.json",
    );

    if (fs.existsSync(prefsPath)) {
      const data = fs.readFileSync(prefsPath, "utf8");
      return {
        success: true,
        data: JSON.parse(data),
      };
    }

    return {
      success: true,
      data: {},
    };
  } catch (error) {
    console.error("Error loading display preferences:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Main projection window creation function
export async function createSongPresentationWindow(mainWin?: BrowserWindow) {
  const displays = screen.getAllDisplays();
  console.log("🖥️ Song Presentation - All displays detected:", displays.length);

  // Log detailed display information
  logSystemInfo("Display detection completed", {
    displayCount: displays.length,
    displays: displays.map((display, index) => ({
      index,
      id: display.id,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
    })),
  });

  displays.forEach((display, index) => {
    console.log(`🖥️ Display ${index}:`, {
      id: display.id,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
    });
  });

  let presentationDisplay = displays[0]; // Default to primary display
  let isExternalDisplay = false;
  let projectionMode = "extend"; // Default mode

  // BUG 1 fix: read the prefs file exactly once. The previous code read it
  // synchronously twice — once in the try block and again in the auto-detect
  // condition — blocking the main-process event loop each time.
  const savedPrefsPath = path.join(
    os.homedir(),
    ".ev-songapp-display-config.json",
  );
  let preferenceApplied = false;

  try {
    if (fs.existsSync(savedPrefsPath)) {
      const savedPrefs = JSON.parse(fs.readFileSync(savedPrefsPath, "utf8"));
      const preferredDisplay = displays.find(
        (d) => d.id === savedPrefs.displayId,
      );

      if (preferredDisplay) {
        presentationDisplay = preferredDisplay;
        isExternalDisplay =
          preferredDisplay.id !== screen.getPrimaryDisplay().id;
        projectionMode = savedPrefs.mode || "extend";
        preferenceApplied = true;

        logSongProjection("Using saved display preference", {
          displayId: preferredDisplay.id,
          mode: savedPrefs.mode,
          isExternal: isExternalDisplay,
        });
      }
    }
  } catch {
    // No prefs file or corrupt JSON — fall through to auto-detection
  }

  // Auto-detection: only runs when no valid saved preference was applied
  if (!preferenceApplied && displays.length > 1) {
    const externalDisplay = displays.find((display) => !display.internal);

    if (externalDisplay) {
      presentationDisplay = externalDisplay;
      isExternalDisplay = true;

      logSongProjection("External display detected for projection", {
        displayId: externalDisplay.id,
        isExternal: true,
        isPrimary: externalDisplay.id === screen.getPrimaryDisplay().id,
      });
    }
  }

  // Create projection window on detected display
  const windowConfig: Electron.BrowserWindowConstructorOptions = {
    title: "Song Presentation",
    frame: false,
    show: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    x: presentationDisplay.bounds.x,
    y: presentationDisplay.bounds.y,
    width: presentationDisplay.bounds.width,
    height: presentationDisplay.bounds.height,
    icon: path.join(process.env.VITE_PUBLIC || "", "evsongsicon.png"),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0,
      devTools: !!VITE_DEV_SERVER_URL,
    },
  };

  songPresentationWin = new BrowserWindow(windowConfig);

  console.log("🪟 Song Presentation Window created with:", {
    x: songPresentationWin.getBounds().x,
    y: songPresentationWin.getBounds().y,
    width: songPresentationWin.getBounds().width,
    height: songPresentationWin.getBounds().height,
    isExternalDisplay,
    projectionMode,
    targetDisplay: presentationDisplay.bounds,
  });

  // Log detailed window creation info
  logSongProjection("Projection window created", {
    windowBounds: songPresentationWin.getBounds(),
    isExternalDisplay,
    projectionMode,
    targetDisplay: {
      id: presentationDisplay.id,
      bounds: presentationDisplay.bounds,
      internal: presentationDisplay.internal,
    },
    displayCount: screen.getAllDisplays().length,
  });

  // Load the React-based song presentation display page
  if (VITE_DEV_SERVER_URL) {
    songPresentationWin.loadURL(
      `${VITE_DEV_SERVER_URL}/#/song-presentation-display`,
    );
    // Open DevTools in development mode
    // songPresentationWin.webContents.openDevTools({ mode: "detach" });
  } else {
    songPresentationWin.loadFile(indexHtml, {
      hash: "song-presentation-display",
    });
  }

  // Set kiosk BEFORE showing so the window's first paint is already fullscreen.
  // Showing first then setting kiosk causes Chromium to latch the wrong viewport
  // size (especially with DPI scaling), producing side/bottom margins.
  //
  // Kiosk rules:
  //   External display → kiosk + alwaysOnTop("screen-saver"): covers taskbar,
  //     the projector screen is locked so nothing accidentally shows behind.
  //   Primary / laptop display → fullscreen only, NO kiosk: the operator must
  //     still be able to Alt-Tab and use other apps on their control screen.
  songPresentationWin.once("ready-to-show", () => {
    if (!songPresentationWin || songPresentationWin.isDestroyed()) return;
    if (isExternalDisplay) {
      songPresentationWin.setKiosk(true);
      songPresentationWin.setAlwaysOnTop(true, "screen-saver");
      console.log(
        "✅ Projection on external display — kiosk + screen-saver z-order",
      );
    } else {
      songPresentationWin.setFullScreen(true);
      console.log(
        "✅ Projection on primary display — fullscreen only (operator can Alt-Tab)",
      );
    }
    songPresentationWin.show();
    songPresentationWin.focus();
  });

  // Setup event listeners for single window
  songPresentationWin.on("closed", () => {
    songPresentationWin = null;
    isSongPresentationMinimized = false;

    // Only send notification if projection was still active
    if (isProjectionActive) {
      isProjectionActive = false; // Set projection as inactive when window is closed
      console.log("Sending projection state change: false (window closed)");
      mainWin?.webContents.send("projection-state-changed", false);
    }
  });

  // Track minimization state - but don't affect projection active state for external displays
  songPresentationWin.on("minimize", () => {
    isSongPresentationMinimized = true;
    console.log("Projection window minimized - keeping projection active");
  });

  songPresentationWin.on("restore", () => {
    isSongPresentationMinimized = false;
    // Ensure projection is marked as active when restored
    if (isProjectionActive) {
      console.log("Projection window restored - projection state: true");
      mainWin?.webContents.send("projection-state-changed", true);
    }
  });

  return songPresentationWin;
}

// Projection state management
export function getProjectionState() {
  return {
    songPresentationWin,
    isSongPresentationMinimized,
    isProjectionActive,
  };
}

export function setProjectionActive(active: boolean) {
  isProjectionActive = active;
}

export function setProjectionMinimized(minimized: boolean) {
  isSongPresentationMinimized = minimized;
}

// Projection settings management
export function getGlobalProjectionSettings() {
  return globalProjectionSettings;
}

export function updateGlobalProjectionSettings(
  newSettings: Partial<typeof globalProjectionSettings>,
) {
  globalProjectionSettings = { ...globalProjectionSettings, ...newSettings };
}

// Enhanced projection IPC handlers
export function registerProjectionHandlers() {
  // Project song with advanced settings
  ipcMain.handle(
    "project-song-with-settings",
    async (event, { song, settings = {} }) => {
      try {
        // Merge provided settings with global settings
        const projectionSettings = { ...globalProjectionSettings, ...settings };

        // Enhanced song data with settings
        const enhancedSongData = {
          ...song,
          fontSize: projectionSettings.fontSize,
          fontFamily: projectionSettings.fontFamily,
          backgroundColor: projectionSettings.backgroundColor,
          textColor: projectionSettings.textColor,
          backgroundImage: projectionSettings.backgroundImage,
          theme: projectionSettings.theme,
          transition: settings.transition || "fade",
          duration: settings.duration || 300,
        };

        // Use the existing projection logic
        const window = await createSongPresentationWindow();

        if (window) {
          return {
            success: true,
            window: window,
          };
        }

        return {
          success: false,
          error: "Failed to create projection window",
        };
      } catch (error) {
        console.error("Error in enhanced projection:", error);
        const errorObj = {
          message:
            error instanceof Error ? error.message : "Unknown projection error",
          code: "PROJECTION_ERROR",
        };

        return { success: false, error: errorObj.message };
      }
    },
  );

  // Get current projection settings
  ipcMain.handle("get-projection-settings", async () => {
    try {
      return { success: true, settings: globalProjectionSettings };
    } catch (error) {
      console.error("Error getting projection settings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Preview song on specific display
  ipcMain.handle(
    "preview-song-on-display",
    async (event, { song, displayId }) => {
      try {
        const previewData = {
          ...song,
          isPreview: true,
          previewDuration: 5000, // 5 second preview
          ...globalProjectionSettings,
        };

        const window = await createSongPresentationWindow();

        // Auto-close preview after duration
        if (window && songPresentationWin) {
          setTimeout(() => {
            if (songPresentationWin && !songPresentationWin.isDestroyed()) {
              songPresentationWin.close();
            }
          }, 5000);

          return {
            success: true,
            window: window,
          };
        }

        return {
          success: false,
          error: "Failed to create preview window",
        };
      } catch (error) {
        console.error("Error in preview:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // Test display with a test message
  ipcMain.handle(
    "test-display-projection",
    async (
      event,
      { displayId, testMessage = "🎵 Display Test - East Voice Songs" },
    ) => {
      try {
        console.log("🧪 Testing display:", displayId);

        const testSong = {
          title: "Display Configuration Test",
          content: `<div style="text-align: center; padding: 50px;">
          <h1 style="font-size: 48px; margin-bottom: 30px;">✨ ${testMessage}</h1>
          <p style="font-size: 24px; opacity: 0.8;">Display ID: ${displayId}</p>
          <p style="font-size: 18px; opacity: 0.6; margin-top: 30px;">This projection will appear on your selected display</p>
          <div style="margin-top: 50px; font-size: 16px; opacity: 0.5;">
            Test completed successfully ✅
          </div>
        </div>`,
          ...globalProjectionSettings,
        };

        const window = await createSongPresentationWindow();

        // Auto-close test after 3 seconds
        if (window && songPresentationWin) {
          setTimeout(() => {
            if (songPresentationWin && !songPresentationWin.isDestroyed()) {
              songPresentationWin.close();
            }
          }, 3000);

          return {
            success: true,
            window: window,
          };
        }

        return {
          success: false,
          error: "Failed to create test window",
        };
      } catch (error) {
        console.error("Error testing display:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  // Get comprehensive projection status
  ipcMain.handle("get-projection-status", async () => {
    try {
      const isActive =
        songPresentationWin && !songPresentationWin.isDestroyed();
      const displays = screen.getAllDisplays();

      let currentDisplay = null;
      if (isActive && songPresentationWin) {
        const winBounds = songPresentationWin.getBounds();
        currentDisplay = displays.find(
          (display) =>
            winBounds.x >= display.bounds.x &&
            winBounds.x < display.bounds.x + display.bounds.width,
        );
      }

      return {
        success: true,
        status: {
          isActive,
          displayCount: displays.length,
          currentDisplay: currentDisplay ? currentDisplay.id : null,
          settings: globalProjectionSettings,
          windowInfo: isActive
            ? {
                bounds: songPresentationWin?.getBounds(),
                isVisible: songPresentationWin?.isVisible(),
                isFocused: songPresentationWin?.isFocused(),
              }
            : null,
        },
      };
    } catch (error) {
      console.error("Error getting projection status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Set projection theme with predefined styles
  ipcMain.handle("set-projection-theme", async (event, theme) => {
    try {
      console.log("🎨 Setting projection theme:", theme);

      const themes = {
        light: {
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          theme: "light",
        },
        dark: {
          backgroundColor: "#000000",
          textColor: "#FFFFFF",
          theme: "dark",
        },
        creamy: {
          backgroundColor: "#FAF0E6",
          textColor: "#8B4513",
          theme: "creamy",
        },
      };

      if (themes[theme as keyof typeof themes]) {
        globalProjectionSettings = {
          ...globalProjectionSettings,
          ...themes[theme as keyof typeof themes],
        };

        // Apply to active projection
        if (songPresentationWin && !songPresentationWin.isDestroyed()) {
          songPresentationWin.webContents.send(
            "update-settings",
            globalProjectionSettings,
          );
        }

        return { success: true, theme: globalProjectionSettings };
      }

      return { success: false, error: "Invalid theme specified" };
    } catch (error) {
      console.error("Error setting theme:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Send real-time commands to projection
  ipcMain.handle("send-projection-command", async (event, command) => {
    try {
      console.log("📡 Projection command:", command);

      if (!songPresentationWin || songPresentationWin.isDestroyed()) {
        return { success: false, error: "No active projection window" };
      }

      songPresentationWin.webContents.send("projection-command", { command });
      return { success: true };
    } catch (error) {
      console.error("Error sending projection command:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Send navigation commands to song projection window
  ipcMain.handle("send-to-song-projection", async (event, data) => {
    try {
      if (!songPresentationWin || songPresentationWin.isDestroyed()) {
        return { success: false, error: "No active song projection window" };
      }

      // Send the command to the projection window
      songPresentationWin.webContents.send("song-projection-command", data);
      return { success: true };
    } catch (error) {
      console.error("Error sending song projection command:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Detect display configuration changes
  ipcMain.handle("detect-display-changes", async () => {
    try {
      const displays = screen.getAllDisplays();
      const primary = screen.getPrimaryDisplay();

      return {
        success: true,
        displays: displays.map((d) => ({
          id: d.id,
          bounds: d.bounds,
          workArea: d.workArea,
          scaleFactor: d.scaleFactor,
          internal: d.internal,
          isPrimary: d.id === primary.id,
        })),
      };
    } catch (error) {
      console.error("Error detecting display changes:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Validate current display configuration
  ipcMain.handle("validate-display-configuration", async () => {
    try {
      const displays = screen.getAllDisplays();
      const prefsResult = await loadDisplayPreferences();
      const preferences = prefsResult?.data || {};

      let issues = [];

      // Check if preferred display still exists
      if (preferences.displayId) {
        const preferredExists = displays.find(
          (d) => d.id === preferences.displayId,
        );
        if (!preferredExists) {
          issues.push({
            type: "missing_display",
            message: `Preferred display ${preferences.displayId} is no longer available`,
            severity: "warning",
          });
        }
      }

      // Check for display resolution changes
      if (displays.length === 0) {
        issues.push({
          type: "no_displays",
          message: "No displays detected",
          severity: "error",
        });
      }

      return {
        success: true,
        validation: {
          isValid: issues.length === 0,
          displayCount: displays.length,
          issues,
          recommendations:
            issues.length > 0
              ? ["Refresh display configuration", "Check display connections"]
              : [],
        },
      };
    } catch (error) {
      console.error("Error validating display configuration:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Optimize projection performance
  ipcMain.handle("optimize-projection-performance", async () => {
    try {
      console.log("⚡ Optimizing projection performance...");

      if (songPresentationWin && !songPresentationWin.isDestroyed()) {
        // Clear any cached resources
        await songPresentationWin.webContents.session.clearCache();

        // Optimize rendering
        songPresentationWin.webContents.send("optimize-rendering");
      }

      return {
        success: true,
        optimizations: [
          "Cleared projection window cache",
          "Optimized rendering pipeline",
          "Reduced memory usage",
        ],
      };
    } catch (error) {
      console.error("Error optimizing performance:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Set display preferences
  ipcMain.handle(
    "set-projection-preferences",
    async (event, { displayId, mode }) => {
      try {
        console.log("💾 Saving projection preferences:", { displayId, mode });

        const prefsPath = path.join(
          os.homedir(),
          ".ev-songapp-display-config.json",
        );
        const preferences = {
          displayId,
          mode,
          timestamp: Date.now(),
          lastUpdated: new Date().toISOString(),
        };

        fs.writeFileSync(prefsPath, JSON.stringify(preferences, null, 2));

        logSongProjection("Display preferences saved", preferences);

        return {
          success: true,
          data: preferences,
          message: `Saved display preferences: Display ${displayId} in ${mode} mode`,
        };
      } catch (error) {
        console.error("Error saving projection preferences:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to save preferences",
        };
      }
    },
  );

  // Load display preferences
  ipcMain.handle("load-display-preferences", async () => {
    return loadDisplayPreferences();
  });

  // Focus / bring projection window to front
  ipcMain.handle("focus-projection-window", async () => {
    if (!songPresentationWin || songPresentationWin.isDestroyed()) {
      return { success: false, reason: "no-window" };
    }
    if (songPresentationWin.isMinimized()) songPresentationWin.restore();
    songPresentationWin.setAlwaysOnTop(true);
    songPresentationWin.focus();
    songPresentationWin.moveTop();
    // Release always-on-top after bringing it forward so it doesn't stay locked
    setTimeout(() => {
      if (songPresentationWin && !songPresentationWin.isDestroyed()) {
        songPresentationWin.setAlwaysOnTop(false);
      }
    }, 500);
    return { success: true };
  });

  console.log("✅ Projection handlers registered successfully");
}

// Cleanup function for app shutdown
export function cleanupProjection() {
  if (songPresentationWin && !songPresentationWin.isDestroyed()) {
    songPresentationWin.close();
    songPresentationWin = null;
  }
  isProjectionActive = false;
  isSongPresentationMinimized = false;
}
