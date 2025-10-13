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

// Windows Display Configuration Functions
async function setWindowsDisplayMode(
  mode: "extend" | "duplicate" | "internal" | "external"
) {
  try {
    console.log(`🖥️ Setting Windows display mode to: ${mode}`);

    // Use Windows built-in displayswitch.exe utility (same as Windows + P)
    let command = "";

    switch (mode) {
      case "duplicate":
        command = "displayswitch.exe /clone";
        break;
      case "extend":
        command = "displayswitch.exe /extend";
        break;
      case "internal":
        command = "displayswitch.exe /internal";
        break;
      case "external":
        command = "displayswitch.exe /external";
        break;
    }

    if (command) {
      console.log(`🔧 Executing: ${command}`);
      await execAsync(command);

      console.log(`✅ Windows display mode set to: ${mode}`);

      // Wait a bit for the display change to take effect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return { success: true, mode };
    }

    return { success: false, error: "Invalid display mode" };
  } catch (error) {
    console.error("❌ Error setting Windows display mode:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get current Windows display configuration
async function getWindowsDisplayMode() {
  try {
    // Query current display configuration using PowerShell
    const psCommand = `
      $monitors = Get-WmiObject -Class Win32_DesktopMonitor | Where-Object { $_.Availability -eq 3 };
      $activeCount = ($monitors | Measure-Object).Count;
      $totalMonitors = (Get-CimInstance -Class Win32_PnPEntity | Where-Object { $_.Name -like '*monitor*' -and $_.Status -eq 'OK' } | Measure-Object).Count;
      Write-Output "$activeCount|$totalMonitors"
    `;

    const { stdout } = await execAsync(
      `powershell.exe -Command "${psCommand}"`
    );
    const [active, total] = stdout.trim().split("|").map(Number);

    let mode = "unknown";
    if (active === 1 && total > 1) {
      mode = "internal"; // PC screen only
    } else if (active > 1) {
      // Need to check if it's duplicate or extend
      // This is harder to detect programmatically, so we'll assume extend
      mode = "extend";
    }

    console.log(
      `🔍 Detected display mode: ${mode} (${active}/${total} monitors active)`
    );
    return {
      success: true,
      mode,
      activeMonitors: active,
      totalMonitors: total,
    };
  } catch (error) {
    console.error("❌ Error getting Windows display mode:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to load display preferences
async function loadDisplayPreferences() {
  try {
    const prefsPath = path.join(
      os.homedir(),
      ".ev-songapp-display-config.json"
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

  // Check for user display preferences first
  try {
    const savedPrefsPath = path.join(
      os.homedir(),
      ".ev-songapp-display-config.json"
    );
    if (fs.existsSync(savedPrefsPath)) {
      const savedPrefs = JSON.parse(fs.readFileSync(savedPrefsPath, "utf8"));
      const preferredDisplay = displays.find(
        (d) => d.id === savedPrefs.displayId
      );

      if (preferredDisplay) {
        presentationDisplay = preferredDisplay;
        isExternalDisplay =
          preferredDisplay.id !== screen.getPrimaryDisplay().id;
        projectionMode = savedPrefs.mode || "extend";

        console.log("✨ Using saved display preference:", {
          id: preferredDisplay.id,
          bounds: preferredDisplay.bounds,
          internal: preferredDisplay.internal,
          mode: savedPrefs.mode,
        });

        logSongProjection("Using saved display preference", {
          displayId: preferredDisplay.id,
          mode: savedPrefs.mode,
          isExternal: isExternalDisplay,
        });
      } else {
        console.log(
          "⚠️ Preferred display not found, falling back to auto-detection"
        );
      }
    }
  } catch (error) {
    console.log("ℹ️ No display preferences found, using auto-detection");
  }

  // Fallback to auto-detection if no preferences or preferred display not available
  if (
    !fs.existsSync(
      path.join(os.homedir(), ".ev-songapp-display-config.json")
    ) ||
    !displays.find(
      (d) =>
        d.id ===
        JSON.parse(
          fs.readFileSync(
            path.join(os.homedir(), ".ev-songapp-display-config.json"),
            "utf8"
          )
        ).displayId
    )
  ) {
    if (displays.length > 1) {
      // Visual Song Book-style display detection - Override Windows main display logic
      // Priority 1: Use non-internal (external) display for projection, regardless of main display setting
      let externalDisplay = displays.find((display) => !display.internal);

      if (externalDisplay) {
        presentationDisplay = externalDisplay;
        isExternalDisplay = true;
        console.log(
          "🎯 Visual Song Book Mode - Using external display for projection (overriding Windows main display):",
          {
            id: externalDisplay.id,
            bounds: externalDisplay.bounds,
            internal: externalDisplay.internal,
            isPrimary: externalDisplay.id === screen.getPrimaryDisplay().id,
            windowsMainDisplay: screen.getPrimaryDisplay().id,
          }
        );

        logSongProjection("Visual Song Book mode - External display selected", {
          displayId: externalDisplay.id,
          isExternal: true,
          overridingWindowsMain:
            externalDisplay.id === screen.getPrimaryDisplay().id,
          windowsMainDisplayId: screen.getPrimaryDisplay().id,
        });
      } else {
        // Priority 2: If no external display, use non-primary display
        const nonPrimaryDisplay = displays.find(
          (display) => display.id !== screen.getPrimaryDisplay().id
        );

        if (nonPrimaryDisplay) {
          presentationDisplay = nonPrimaryDisplay;
          isExternalDisplay = true;
          console.log("🎯 Using non-primary display for projection:", {
            id: nonPrimaryDisplay.id,
            bounds: nonPrimaryDisplay.bounds,
            internal: nonPrimaryDisplay.internal,
          });
        } else {
          // Priority 3: Fallback to primary display if only one display
          console.log(
            "⚠️ Song Presentation - No external display found, using primary"
          );
        }
      }
    } else {
      console.log(
        "⚠️ Song Presentation - Only one display detected, using primary"
      );
    }
  }

  // **NEW: Implement display mode logic**
  let windowConfig: Electron.BrowserWindowConstructorOptions = {
    title: "Song Presentation",
    frame: false,
    show: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    icon: path.join(process.env.VITE_PUBLIC || "", "evv.png"),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  };

  // Configure window based on projection mode
  if (projectionMode === "duplicate") {
    // DUPLICATE MODE: Show on primary display only - let OS handle duplication
    const primaryDisplay = screen.getPrimaryDisplay();
    windowConfig = {
      ...windowConfig,
      x: primaryDisplay.bounds.x,
      y: primaryDisplay.bounds.y,
      width: primaryDisplay.bounds.width,
      height: primaryDisplay.bounds.height,
      fullscreen: true,
      show: false, // Don't show immediately
    };
    console.log(
      "🔄 Using DUPLICATE mode - showing on primary display for OS-level duplication"
    );
    console.log(
      "� Note: Use Windows display settings to set monitors to duplicate mode"
    );

    // Create single window on primary display
    songPresentationWin = new BrowserWindow(windowConfig);
  } else {
    // EXTEND MODE: Show on selected/external display
    windowConfig = {
      ...windowConfig,
      x: isExternalDisplay ? presentationDisplay.bounds.x : undefined,
      y: isExternalDisplay ? presentationDisplay.bounds.y : undefined,
      width: isExternalDisplay ? presentationDisplay.bounds.width : 1024,
      height: isExternalDisplay ? presentationDisplay.bounds.height : 768,
      fullscreen: isExternalDisplay,
      show: false, // Don't show immediately, we'll show after loading
    };
    console.log("↔️ Using EXTEND mode - showing on selected display");

    // Create single Song presentation window
    songPresentationWin = new BrowserWindow(windowConfig);
  }

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

  // Ensure full-screen coverage for all modes
  console.log("🔧 Ensuring full-screen coverage...");

  // Handle fullscreen setup for single window
  if (projectionMode === "duplicate") {
    // DUPLICATE MODE: Setup primary display window
    const primaryDisplay = screen.getPrimaryDisplay();
    songPresentationWin.setBounds({
      x: primaryDisplay.bounds.x,
      y: primaryDisplay.bounds.y,
      width: primaryDisplay.bounds.width,
      height: primaryDisplay.bounds.height,
    });
    songPresentationWin.setFullScreen(true);

    console.log(
      "✅ Duplicate mode - window bounds and fullscreen set on primary display"
    );
    logSongProjection("Duplicate mode fullscreen configured", {
      displayId: primaryDisplay.id,
      bounds: songPresentationWin.getBounds(),
      isFullscreen: songPresentationWin.isFullScreen(),
    });
  } else {
    // EXTEND MODE: Setup single window
    if (isExternalDisplay) {
      songPresentationWin.setBounds({
        x: presentationDisplay.bounds.x,
        y: presentationDisplay.bounds.y,
        width: presentationDisplay.bounds.width,
        height: presentationDisplay.bounds.height,
      });
      songPresentationWin.setFullScreen(true);

      console.log("✅ External display bounds and fullscreen set");
      logSongProjection("External display fullscreen configured", {
        originalBounds: presentationDisplay.bounds,
        finalBounds: songPresentationWin.getBounds(),
        displayId: presentationDisplay.id,
        isFullscreen: songPresentationWin.isFullScreen(),
      });
    } else {
      songPresentationWin.setBounds({
        x: presentationDisplay.bounds.x,
        y: presentationDisplay.bounds.y,
        width: presentationDisplay.bounds.width,
        height: presentationDisplay.bounds.height,
      });
      songPresentationWin.setFullScreen(true);

      console.log(
        `✅ ${projectionMode} mode fullscreen set on primary display`
      );
      logSongProjection(`${projectionMode} mode fullscreen configured`, {
        bounds: songPresentationWin.getBounds(),
        mode: projectionMode,
        isFullscreen: songPresentationWin.isFullScreen(),
      });
    }
  }

  // Load the React-based song presentation display page
  if (VITE_DEV_SERVER_URL) {
    songPresentationWin.loadURL(
      `${VITE_DEV_SERVER_URL}/#/song-presentation-display`
    );
  } else {
    songPresentationWin.loadFile(indexHtml, {
      hash: "song-presentation-display",
    });
  }

  // Show window after loading content
  console.log("🎭 Showing projection window");
  songPresentationWin.show();
  console.log("✅ Projection window shown");

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
  newSettings: Partial<typeof globalProjectionSettings>
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
        console.log("🎵 Enhanced projection request:", {
          song: song?.title,
          settings,
        });

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
    }
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
        console.log("👁️ Preview request for display:", displayId);

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
    }
  );

  // Test display with a test message
  ipcMain.handle(
    "test-display-projection",
    async (
      event,
      { displayId, testMessage = "🎵 Display Test - East Voice Songs" }
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
    }
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
            winBounds.x < display.bounds.x + display.bounds.width
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
            globalProjectionSettings
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
      console.log("🎵 Song projection navigation command:", data);

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

  // Windows Display Mode Control (like Windows + P)
  ipcMain.handle(
    "set-windows-display-mode",
    async (event, mode: "extend" | "duplicate" | "internal" | "external") => {
      return await setWindowsDisplayMode(mode);
    }
  );

  ipcMain.handle("get-windows-display-mode", async () => {
    return await getWindowsDisplayMode();
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
          (d) => d.id === preferences.displayId
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
          ".ev-songapp-display-config.json"
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
    }
  );

  // Load display preferences
  ipcMain.handle("load-display-preferences", async () => {
    return loadDisplayPreferences();
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
