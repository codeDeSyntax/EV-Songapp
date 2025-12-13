import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  nativeImage,
  screen,
  protocol,
} from "electron";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { v4 as uuidv4 } from "uuid";
// Import secret logger
import {
  secretLogger,
  logSystemInfo,
  logSystemError,
  logSongAction,
  logSongProjection,
  logSongFileOp,
  logSongError,
} from "../../src/utils/SecretLogger";
// Import projection module
import {
  createSongPresentationWindow,
  getProjectionState,
  setProjectionActive,
  setProjectionMinimized,
  registerProjectionHandlers,
  cleanupProjection,
  getSongPresentationWindow,
  getIsProjectionActive,
} from "./projection";
// Import font utilities
import { getSystemFonts } from "./fontUtils";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWin: BrowserWindow | null = null;
let projectionWin: BrowserWindow | null = null;
let isProjectionMinimized = false;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");
const projectionHtml = path.join(RENDERER_DIST, "projection.html");

async function createMainWindow() {
  // Create window with default positioning first
  let windowOptions = {
    title: "Main window",
    frame: false,
    minWidth: 1000,
    minHeight: 800,
    icon: path.join(process.env.VITE_PUBLIC, "evsongsicon.png"),
    webPreferences: {
      preload,
      // devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0,
    },
  };

  mainWin = new BrowserWindow(windowOptions);

  // Visual Song Book-style positioning after window creation
  try {
    const displays = screen.getAllDisplays();
    let controlDisplay = screen.getPrimaryDisplay(); // Default fallback

    if (displays.length > 1) {
      // Find internal (laptop) display for control interface
      const internalDisplay = displays.find((display) => display.internal);
      if (internalDisplay) {
        controlDisplay = internalDisplay;
        console.log(
          "🖥️ Control interface using laptop display (Visual Song Book mode):",
          {
            id: internalDisplay.id,
            bounds: internalDisplay.bounds,
            internal: internalDisplay.internal,
            isPrimary: internalDisplay.id === screen.getPrimaryDisplay().id,
          }
        );
      } else {
        // Fallback: Use non-external display if no internal display detected
        const primaryDisplay = screen.getPrimaryDisplay();
        const nonExternalDisplay =
          displays.find((display) => display.id === primaryDisplay.id) ||
          displays[0];
        controlDisplay = nonExternalDisplay;
        console.log("🖥️ Control interface fallback display:", {
          id: controlDisplay.id,
          bounds: controlDisplay.bounds,
        });
      }
    }

    //Position window on the appropriate display
    mainWin.setBounds({
      x: controlDisplay.bounds.x + 50, // Slight offset from edge
      y: controlDisplay.bounds.y + 50,
      width: Math.min(1200, controlDisplay.bounds.width - 100),
      height: Math.min(900, controlDisplay.bounds.height - 100),
    });
  } catch (error) {
    console.log("⚠️ Could not apply positioning:", error);
    // Window will use default positioning
  }

  if (VITE_DEV_SERVER_URL) {
    mainWin.loadURL(VITE_DEV_SERVER_URL);
    mainWin.maximize();
    mainWin.setMenuBarVisibility(false);
    mainWin.webContents.openDevTools();
    mainWin.webContents.setZoomFactor(1.0);
  } else {
    mainWin.maximize();
    mainWin.setMenuBarVisibility(false);
    // mainWin.webContents.openDevTools();
    mainWin.loadFile(indexHtml);
  }

  mainWin.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F12" || // Disable F12 for dev tools
      (input.key === "I" && input.control && input.shift) || // Disable Ctrl+Shift+I or Cmd+Opt+I
      (input.key === "R" && input.control) || // Disable Ctrl+R for reload
      (input.key === "R" && input.meta) // Disable Cmd+R for reload on macOS
    ) {
      event.preventDefault();
    }
  });

  ipcMain.on("minimizeApp", () => {
    mainWin?.minimize();
  });
  ipcMain.on("maximizeApp", () => {
    if (mainWin?.isMaximized()) {
      mainWin?.unmaximize();
    } else {
      mainWin?.maximize();
    }
  });
  ipcMain.on("closeApp", () => {
    mainWin?.close();
  });

  // Handle main window close event to cleanup all child windows
  mainWin.on("closed", () => {
    const { songPresentationWin } = getProjectionState();

    logSystemInfo("Main application window closed", {
      songPresentationActive: !!(
        songPresentationWin && !songPresentationWin.isDestroyed()
      ),
      projectionWinActive: !!(projectionWin && !projectionWin.isDestroyed()),
    });

    // Close all projection windows when main window closes
    cleanupProjection();
    if (projectionWin && !projectionWin.isDestroyed()) {
      projectionWin.close();
      projectionWin = null;
    }

    // Reset projection states
    isProjectionMinimized = false;

    // Clear main window reference
    mainWin = null;
  });

  return mainWin;
}

// Handle the escape key minimize functionality from the renderer
ipcMain.on("minimizeProjection", () => {
  // UPDATED: Now handles both static projection (disabled) and React-based song presentation
  const { songPresentationWin } = getProjectionState();
  if (songPresentationWin && !songPresentationWin.isDestroyed()) {
    songPresentationWin.minimize();

    // Focus the main window after minimizing the projection window
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.focus();
    }
  }
});

app.whenReady().then(() => {
  createMainWindow();

  // Register projection handlers
  registerProjectionHandlers();

  // Visual Song Book-style Display Change Handlers
  // Monitor Windows display changes and maintain proper app positioning
  screen.on("display-added", (event, newDisplay) => {
    console.log("🔌 Display connected:", {
      id: newDisplay.id,
      bounds: newDisplay.bounds,
      internal: newDisplay.internal,
    });

    // Auto-adjust projection window to new external display if projection is active
    const presentationWin = getSongPresentationWindow();
    if (
      getIsProjectionActive() &&
      presentationWin &&
      !presentationWin.isDestroyed()
    ) {
      console.log("📡 Auto-updating projection to new display...");
      // The projection.ts module will handle this via display detection
    }
  });

  screen.on("display-removed", (event, oldDisplay) => {
    console.log("🔌 Display disconnected:", {
      id: oldDisplay.id,
      bounds: oldDisplay.bounds,
    });
  });

  screen.on("display-metrics-changed", (event, display, changedMetrics) => {
    console.log("🔧 Display metrics changed:", {
      id: display.id,
      bounds: display.bounds,
      changedMetrics,
    });

    // Handle Windows main display changes (Visual Song Book mode)
    if (
      changedMetrics.includes("bounds") ||
      changedMetrics.includes("workArea")
    ) {
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();

      console.log(
        "🎯 Visual Song Book Mode - Windows main display changed, maintaining app positioning:",
        {
          newPrimaryId: primaryDisplay.id,
          totalDisplays: displays.length,
          mainWindowStaysOnLaptop: true,
        }
      );

      // Keep main window on laptop display regardless of Windows main display setting
      if (mainWin && !mainWin.isDestroyed() && displays.length > 1) {
        const internalDisplay = displays.find((d) => d.internal);
        if (internalDisplay && internalDisplay.id !== display.id) {
          // Main window should stay on laptop display
          console.log(
            "✅ Main window remains on laptop display (overriding Windows main display)"
          );
        }
      }
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  // Log system startup
  logSystemInfo("Application started successfully", {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    node: process.version,
  });
});

// Handle app quit - ensure all child windows are closed before quitting
app.on("before-quit", (event) => {
  console.log("App is quitting - cleaning up all windows...");

  // Close all projection windows
  cleanupProjection();
  if (projectionWin && !projectionWin.isDestroyed()) {
    projectionWin.close();
    projectionWin = null;
  }

  // Reset projection states
  isProjectionMinimized = false;
});

// Ensure app quits when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Final cleanup before app terminates
app.on("will-quit", () => {
  console.log("App will quit - final cleanup...");

  // Force close any remaining windows
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  });

  // Reset all variables
  mainWin = null;
  projectionWin = null;
  cleanupProjection();
});

ipcMain.handle("project-song", async (event, songData) => {
  console.log("Using React-based song projection:", songData);

  // Log projection attempt
  logSongProjection("Song projection initiated", {
    title: songData.title || "Unknown",
    hasBackground: !!songData.backgroundImage,
    fontSize: songData.fontSize,
    contentLength: songData.content ? songData.content.length : 0,
  });

  // Set projection as active
  setProjectionActive(true);

  const { songPresentationWin, isSongPresentationMinimized } =
    getProjectionState();

  // Check if window exists but is minimized
  if (
    songPresentationWin &&
    !songPresentationWin.isDestroyed() &&
    isSongPresentationMinimized
  ) {
    songPresentationWin.restore();
    setProjectionMinimized(false);
    setTimeout(() => {
      songPresentationWin?.webContents.send("display-song", songData);
      songPresentationWin?.focus();
      songPresentationWin?.moveTop();
    }, 300); // Short delay to ensure window is restored before sending data
    // Notify main window about projection state change
    console.log("Sending projection state change: true (restored)");
    mainWin?.webContents.send("projection-state-changed", true);
    return;
  }

  // If window doesn't exist or was destroyed, create a new one
  if (!songPresentationWin || songPresentationWin.isDestroyed()) {
    const newWindow = await createSongPresentationWindow(mainWin || undefined);
    // Wait for window to be ready before sending data
    newWindow?.once("ready-to-show", () => {
      newWindow?.webContents.send("display-song", songData);
      // Ensure window is properly focused and visible
      newWindow?.show();
      newWindow?.focus();
      newWindow?.moveTop();
      // Notify main window about projection state change
      console.log("Sending projection state change: true (new window)");
      mainWin?.webContents.send("projection-state-changed", true);
    });
  } else {
    // Window exists and is not minimized, just send the data and ensure it's visible
    songPresentationWin.webContents.send("display-song", songData);
    songPresentationWin.show();
    songPresentationWin.focus();
    songPresentationWin.moveTop();
    // Notify main window about projection state change
    console.log("Sending projection state change: true (existing window)");
    mainWin?.webContents.send("projection-state-changed", true);
  }
});

// Add handler to check if projection window is open
ipcMain.handle("is-projection-active", async () => {
  const { songPresentationWin, isProjectionActive } = getProjectionState();
  const isSongActive =
    isProjectionActive &&
    songPresentationWin &&
    !songPresentationWin.isDestroyed();

  console.log("Checking projection state:", {
    isActive: isSongActive,
    isSongActive,
  });

  // Log projection state check
  logSystemInfo("Projection state checked", {
    isActive: isSongActive,
    isSongActive,
    songWindowExists: !!(
      songPresentationWin && !songPresentationWin.isDestroyed()
    ),
  });

  return isSongActive;
});

// Add handler to close projection window
ipcMain.handle("close-projection-window", async () => {
  let closed = false;

  const { songPresentationWin } = getProjectionState();
  // Close song presentation window if it exists
  if (songPresentationWin && !songPresentationWin.isDestroyed()) {
    setProjectionActive(false); // Set projection as inactive before closing
    songPresentationWin.close();
    closed = true;

    // Notify main window that projection is no longer active
    console.log(
      "Sending projection state change: false (close-projection-window)"
    );
    mainWin?.webContents.send("projection-state-changed", false);
  }

  return closed;
});

// Handle selecting a directory via the file dialog
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Get system fonts
ipcMain.handle("get-system-fonts", async () => {
  return await getSystemFonts();
});

// Get default songs directory
ipcMain.handle("get-default-songs-directory", async () => {
  const songsDir = path.join(app.getPath("userData"), "Songs");
  // Ensure directory exists
  if (!fs.existsSync(songsDir)) {
    fs.mkdirSync(songsDir, { recursive: true });
  }
  return songsDir;
});

// Handle saving a song as a text file
ipcMain.handle("save-song", async (event, { directory, title, content }) => {
  // Use app data directory if no directory provided
  const songsDirectory =
    directory || path.join(app.getPath("userData"), "Songs");

  try {
    // Ensure songs directory exists
    if (!fs.existsSync(songsDirectory)) {
      fs.mkdirSync(songsDirectory, { recursive: true });
    }

    // Validate inputs
    if (!title || content === undefined) {
      const errorMsg =
        "Missing required fields: title and content are required.";
      logSongError("Song save validation failed", {
        directory: songsDirectory,
        title,
        hasContent: content !== undefined,
      });
      throw new Error(errorMsg);
    }

    // Validate title format
    if (title.trim().length === 0) {
      const errorMsg = "Song title cannot be empty.";
      logSongError("Empty song title provided", { title });
      throw new Error(errorMsg);
    }

    // Sanitize filename - remove invalid characters and extra spaces
    const sanitizedTitle = title
      .trim()
      .replace(/[<>:"/\\|?*]/g, "") // Remove invalid filename characters
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\.+$/g, "") // Remove trailing periods
      .substring(0, 200); // Limit length to prevent issues

    if (sanitizedTitle.length === 0) {
      const errorMsg = "Song title contains only invalid characters.";
      logSongError("Invalid characters in title", { title, sanitizedTitle });
      throw new Error(errorMsg);
    }

    // Check directory permissions
    try {
      fs.accessSync(songsDirectory, fs.constants.W_OK);
    } catch (permissionError) {
      const errorMsg =
        "Permission denied. You don't have write access to the songs directory.";
      logSongError("Directory permission denied", {
        directory: songsDirectory,
        error: permissionError,
      });
      throw new Error(errorMsg);
    }

    const filePath = path.join(songsDirectory, `${sanitizedTitle}.evsong`);

    // Validate the final file path
    if (!path.isAbsolute(filePath) || filePath.includes("..")) {
      const errorMsg = "Invalid file path generated.";
      logSongError("Path validation failed", {
        filePath,
        directory: songsDirectory,
        sanitizedTitle,
      });
      throw new Error(errorMsg);
    }

    const fileExists = fs.existsSync(filePath);

    // Write the file (create new or overwrite existing)
    // Content is expected to be base64-encoded JSON from the frontend
    fs.writeFileSync(filePath, content, "utf8");

    const result = {
      success: true,
      filePath,
      isNewFile: !fileExists,
      message: fileExists
        ? `Song "${sanitizedTitle}" has been successfully updated.`
        : `Song "${sanitizedTitle}" has been successfully created.`,
      sanitizedTitle, // Return the sanitized title so UI can update if needed
    };

    // Log successful operation
    logSongFileOp(
      fileExists
        ? "Song updated successfully"
        : "New song created successfully",
      {
        originalTitle: title,
        sanitizedTitle,
        filePath,
        contentLength: content.length,
        directory: songsDirectory,
      }
    );

    return result;
  } catch (error) {
    console.error("Error saving song:", error);
    logSongError("Failed to save song", {
      error: error instanceof Error ? error.message : String(error),
      title: title || "unknown",
      directory: songsDirectory || "unknown",
    });

    // Handle specific error types
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as any).code === "string"
    ) {
      const code = (error as any).code;
      if (code === "ENOENT") {
        throw new Error(
          "The file path is invalid or the directory no longer exists. Please ensure the directory exists and the song title doesn't contain invalid characters."
        );
      } else if (code === "EACCES" || code === "EPERM") {
        throw new Error(
          "Permission denied. Cannot write to the selected location."
        );
      } else if (code === "ENOSPC") {
        throw new Error("Not enough disk space to save the file.");
      } else if (code === "EMFILE" || code === "ENFILE") {
        throw new Error(
          "Too many files are open. Please close some applications and try again."
        );
      }
    }
    // Re-throw custom validation errors or unknown errors
    throw error;
  }
});

// Handle fetching songs from a directory
ipcMain.handle("fetch-songs", async (event, directory) => {
  try {
    // Use app data directory if no directory provided
    const songsDirectory =
      directory || path.join(app.getPath("userData"), "Songs");

    // Ensure songs directory exists
    if (!fs.existsSync(songsDirectory)) {
      fs.mkdirSync(songsDirectory, { recursive: true });
      return []; // Return empty array for new directory
    }

    const files = fs.readdirSync(songsDirectory);
    const songs = await Promise.all(
      files
        .filter((file) => file.endsWith(".evsong"))
        .map(async (file, index) => {
          const filePath = path.join(songsDirectory, file);
          const fileStats = fs.statSync(filePath);
          const encodedContent = fs.readFileSync(filePath, "utf8");

          // Decode the base64-encoded JSON
          let songData;
          let isPrelisted = false;
          try {
            const jsonString = Buffer.from(encodedContent, "base64").toString(
              "utf8"
            );
            songData = JSON.parse(jsonString);
            isPrelisted = songData.metadata?.isPrelisted || false;
          } catch (decodeError) {
            console.error(`Failed to decode song file ${file}:`, decodeError);
            // Skip invalid files
            return null;
          }

          return {
            id: `bmusic${index + 1}`,
            title: songData.title || path.basename(file, ".evsong"),
            path: filePath,
            content: encodedContent, // Return the encoded content
            dateModified:
              songData.metadata?.modified || fileStats.mtime.toISOString(),
            isPrelisted,
            slides: songData.slides || [], // Include slides data
            metadata: songData.metadata, // Include full metadata
          };
        })
    );

    // Filter out null entries (failed decodes)
    const validSongs = songs.filter((song) => song !== null);

    // Log successful fetch
    logSongAction("Songs loaded from directory", {
      directory: songsDirectory,
      songCount: validSongs.length,
      fileCount: files.length,
    });

    return validSongs;
  } catch (error) {
    console.error("Error fetching songs:", error);
    logSongError("Failed to fetch songs from directory", {
      directory: directory || app.getPath("userData"),
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Failed to fetch songs.");
  }
});

// Handle editing an existing song or renaming it
ipcMain.handle(
  "edit-song",
  async (event, { directory, newTitle, content, originalPath }) => {
    try {
      const fileExists = fs.existsSync(originalPath);

      if (fileExists) {
        fs.writeFileSync(originalPath, content, "utf8");
      } else {
        fs.writeFileSync(originalPath, content, "utf8");
      }

      const newFilePath = path.join(directory, `${newTitle}.txt`);
      if (newTitle && newFilePath !== originalPath) {
        if (fileExists && fs.existsSync(originalPath)) {
          fs.renameSync(originalPath, newFilePath);
        }
      }

      return newFilePath;
    } catch (error) {
      console.error("Error editing song:", error);
      throw error;
    }
  }
);

// Handle deleting a song
ipcMain.handle("delete-song", async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const fileName = path.basename(filePath);
      fs.unlinkSync(filePath);

      logSongFileOp("Song deleted successfully", {
        fileName,
        filePath,
      });

      return true;
    } else {
      logSongError("Attempted to delete non-existent song", { filePath });
      throw new Error("File not found");
    }
  } catch (error) {
    console.error("Error deleting song:", error);
    logSongError("Failed to delete song", {
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

async function loadImagesFromDirectory(dirPath: string) {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];

  try {
    const files = await new Promise<string[]>((resolve, reject) => {
      fs.readdir(dirPath, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });

    const imageFiles = files
      .filter((file) =>
        allowedExtensions.includes(path.extname(file).toLowerCase())
      )
      .slice(0, 10); // Increase limit to 7 images for better selection

    // Return custom protocol URLs instead of file:// URLs for security
    const imagePaths = imageFiles.map((file) => {
      const fullPath = path.join(dirPath, file);
      // Use our custom protocol to serve local images
      const customUrl = `local-image://${encodeURIComponent(fullPath)}`;
      return customUrl;
    });

    console.log(
      "📁 loadImagesFromDirectory: Returning custom protocol URLs:",
      imagePaths.slice(0, 3),
      "..."
    );

    // Log detailed image loading info
    logSystemInfo("Background images loaded from directory", {
      directory: dirPath,
      totalFiles: files.length,
      imageFiles: imageFiles.length,
      allowedExtensions,
      sampleImages: imagePaths
        .slice(0, 3)
        .map((url) => decodeURIComponent(url.replace("local-image://", ""))),
    });

    return imagePaths;
  } catch (error) {
    console.error("Error loading images:", error);
    logSystemError("Failed to load background images", {
      directory: dirPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

ipcMain.handle("get-images", async (event, dirPath) => {
  return loadImagesFromDirectory(dirPath); // Return the list of file:// URLs
});

// Handler to focus the main window from presentation
ipcMain.handle("focus-main-window", async () => {
  try {
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.focus();
      mainWin.show();
      return { success: true };
    }
    return { success: false, error: "Main window not found" };
  } catch (error) {
    console.error("Error focusing main window:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Handler to get display information for debugging
ipcMain.handle("get-display-info", async () => {
  try {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();

    const displayInfo = {
      totalDisplays: displays.length,
      primaryDisplay: {
        id: primaryDisplay.id,
        bounds: primaryDisplay.bounds,
        workArea: primaryDisplay.workArea,
        scaleFactor: primaryDisplay.scaleFactor,
        internal: primaryDisplay.internal,
      },
      allDisplays: displays.map((display) => ({
        id: display.id,
        bounds: display.bounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        rotation: display.rotation,
        internal: display.internal,
        isPrimary: display.id === primaryDisplay.id,
      })),
    };

    console.log("📊 Display Info Request:", displayInfo);
    logSystemInfo("Display information requested", displayInfo);
    return { success: true, data: displayInfo };
  } catch (error) {
    console.error("Error getting display info:", error);
    logSystemError("Failed to get display information", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Visual Song Book Override Test Handler
ipcMain.handle("test-visual-songbook-override", async () => {
  try {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();

    console.log("🧪 Visual Song Book Override Test Results:");
    console.log("==========================================");

    // Test 1: Display Detection
    const internalDisplay = displays.find((d) => d.internal);
    const externalDisplay = displays.find((d) => !d.internal);

    console.log("📊 Display Analysis:");
    console.log(`Total Displays: ${displays.length}`);
    console.log(
      `Windows Main Display: ${primaryDisplay.id} at (${primaryDisplay.bounds.x}, ${primaryDisplay.bounds.y})`
    );
    console.log(
      `Internal (Laptop) Display: ${
        internalDisplay
          ? `${internalDisplay.id} at (${internalDisplay.bounds.x}, ${internalDisplay.bounds.y})`
          : "Not detected"
      }`
    );
    console.log(
      `External Display: ${
        externalDisplay
          ? `${externalDisplay.id} at (${externalDisplay.bounds.x}, ${externalDisplay.bounds.y})`
          : "Not detected"
      }`
    );

    // Test 2: Visual Song Book Logic
    let projectionTarget = primaryDisplay; // Default
    let controlTarget = primaryDisplay; // Default

    if (displays.length > 1) {
      // Control interface: Always prefer laptop (internal) display
      controlTarget =
        internalDisplay ||
        displays.find((d) => d.id !== primaryDisplay.id) ||
        primaryDisplay;

      // Projection: Always prefer external display, regardless of Windows main display setting
      projectionTarget =
        externalDisplay ||
        displays.find((d) => d.id !== primaryDisplay.id) ||
        primaryDisplay;
    }

    console.log("🎯 Visual Song Book Override Results:");
    console.log(
      `Control Interface Target: Display ${controlTarget.id} (${
        controlTarget.internal ? "Laptop" : "External"
      }) - Overriding Windows main display: ${
        controlTarget.id !== primaryDisplay.id
      }`
    );
    console.log(
      `Projection Target: Display ${projectionTarget.id} (${
        projectionTarget.internal ? "Laptop" : "External"
      }) - Overriding Windows main display: ${
        projectionTarget.id !== primaryDisplay.id
      }`
    );

    // Test 3: Scenario Validation
    const scenarios = [];

    if (displays.length === 1) {
      scenarios.push(
        "✅ Single Display: Both control and projection on same display"
      );
    } else {
      scenarios.push(
        `✅ Multi-Display: Control on ${
          controlTarget.internal ? "laptop" : "external"
        }, Projection on ${projectionTarget.internal ? "laptop" : "external"}`
      );

      if (primaryDisplay.internal && externalDisplay) {
        scenarios.push(
          "✅ Scenario 1: Laptop is Windows main → Projection goes to external (correct)"
        );
      } else if (!primaryDisplay.internal && internalDisplay) {
        scenarios.push(
          "✅ Scenario 2: External is Windows main → Control stays on laptop, Projection on external (Visual Song Book mode!)"
        );
      }
    }

    return {
      success: true,
      data: {
        displayCount: displays.length,
        windowsMainDisplay: primaryDisplay.id,
        controlTarget: {
          id: controlTarget.id,
          bounds: controlTarget.bounds,
          internal: controlTarget.internal,
          isOverridingWindowsMain: controlTarget.id !== primaryDisplay.id,
        },
        projectionTarget: {
          id: projectionTarget.id,
          bounds: projectionTarget.bounds,
          internal: projectionTarget.internal,
          isOverridingWindowsMain: projectionTarget.id !== primaryDisplay.id,
        },
        scenarios,
        visualSongBookModeActive:
          controlTarget.internal &&
          !projectionTarget.internal &&
          !primaryDisplay.internal,
      },
    };
  } catch (error) {
    console.error("Error in Visual Song Book override test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Enhanced Projection API Configuration
// =====================================
// Note: Projection handlers moved to projection.ts module

// Note: Test display and projection metrics handlers moved to projection.ts module

// Note: Enhanced projection handlers moved to projection.ts module

// Display Configuration Handlers
ipcMain.handle("save-display-preferences", async (_, preferences) => {
  try {
    const prefsPath = path.join(
      os.homedir(),
      ".ev-songapp-display-config.json"
    );
    const prefsData = {
      displayId: preferences.displayId,
      mode: preferences.mode,
      timestamp: Date.now(),
    };

    fs.writeFileSync(prefsPath, JSON.stringify(prefsData, null, 2));

    logSystemInfo("Display preferences saved", prefsData);
    console.log("💾 Display preferences saved:", prefsData);

    return { success: true, data: prefsData };
  } catch (error) {
    console.error("Error saving display preferences:", error);
    logSystemError("Failed to save display preferences", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("load-display-preferences", async () => {
  try {
    const prefsPath = path.join(
      os.homedir(),
      ".ev-songapp-display-config.json"
    );

    if (!fs.existsSync(prefsPath)) {
      return { success: true, data: null };
    }

    const prefsData = JSON.parse(fs.readFileSync(prefsPath, "utf8"));
    console.log("📖 Display preferences loaded:", prefsData);

    return { success: true, data: prefsData };
  } catch (error) {
    console.error("Error loading display preferences:", error);
    logSystemError("Failed to load display preferences", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Secret Logging System Handlers
ipcMain.handle(
  "log-to-secret-logger",
  async (_, { application, category, message, details }) => {
    try {
      secretLogger.log(application, category, message, details);
      return { success: true };
    } catch (error) {
      console.error("Error logging to secret logger:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

ipcMain.handle("get-secret-logs", async () => {
  try {
    const logs = secretLogger.getLogs();
    logSystemInfo("Secret logs accessed by admin", { logCount: logs.length });
    return { success: true, logs };
  } catch (error) {
    console.error("Error getting secret logs:", error);
    logSystemError("Failed to retrieve secret logs", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("clear-secret-logs", async () => {
  try {
    secretLogger.clearAllLogs();
    logSystemInfo("All secret logs cleared by admin");
    return { success: true };
  } catch (error) {
    console.error("Error clearing secret logs:", error);
    logSystemError("Failed to clear secret logs", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("get-log-settings", async () => {
  try {
    const settings = secretLogger.getSettings();
    logSystemInfo("Log settings accessed by admin", settings);
    return { success: true, settings };
  } catch (error) {
    console.error("Error getting log settings:", error);
    logSystemError("Failed to retrieve log settings", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("update-log-settings", async (event, newSettings) => {
  try {
    secretLogger.updateSettings(newSettings);
    logSystemInfo("Log settings updated by admin", newSettings);
    return { success: true };
  } catch (error) {
    console.error("Error updating log settings:", error);
    logSystemError("Failed to update log settings", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("export-secret-logs", async () => {
  try {
    const logs = secretLogger.getLogs();
    const result = await dialog.showSaveDialog({
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "Text Files", extensions: ["txt"] },
      ],
      defaultPath: `blessed-music-logs-${
        new Date().toISOString().split("T")[0]
      }.json`,
    });

    if (!result.canceled && result.filePath) {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalLogs: logs.length,
        logs: logs,
      };

      fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
      logSystemInfo("Secret logs exported by admin", {
        filePath: result.filePath,
        logCount: logs.length,
      });
      return { success: true, filePath: result.filePath };
    }

    return { success: false, error: "Export cancelled" };
  } catch (error) {
    console.error("Error exporting secret logs:", error);
    logSystemError("Failed to export secret logs", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Handler to construct file path properly
ipcMain.handle(
  "construct-file-path",
  async (_, basePath: string, fileName: string) => {
    try {
      const fullPath = path.join(basePath, fileName);
      return { success: true, path: fullPath };
    } catch (error) {
      console.error("Error constructing file path:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to construct path",
      };
    }
  }
);

// Handler to open file in default app (e.g., notepad for .txt files)
ipcMain.handle("open-file-in-default-app", async (_, filePath: string) => {
  try {
    // Normalize the path to handle different path separators
    const normalizedPath = path.normalize(filePath);
    console.log("Opening file:", normalizedPath);

    // Check if file exists before trying to open
    if (!fs.existsSync(normalizedPath)) {
      return {
        success: false,
        error: `File not found: ${normalizedPath}`,
      };
    }

    await shell.openPath(normalizedPath);
    return { success: true };
  } catch (error) {
    console.error("Error opening file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open file",
    };
  }
});

// Presentation master handlers
function sanitizeFilename(title: string): string {
  // Remove invalid filename characters and replace spaces with underscores
  return title
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

// Note: createSongProjectionWindow moved to projection.ts module

// Note: create-song-projection-window handler moved to projection.ts module

// Note: send-to-song-projection handler moved to projection.ts module

ipcMain.handle("send-to-main-window", async (event, { type, data }) => {
  try {
    if (!mainWin || mainWin.isDestroyed()) {
      console.log("Main window not available");
      return { success: false, error: "No main window available" };
    }

    // Send message to the main window
    mainWin.webContents.send("main-window-message", { type, data });

    return { success: true };
  } catch (error) {
    console.error("Error sending to main window:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// ============== Enhanced Song Projection APIs ==============
// All projection handlers have been moved to projection.ts module for better organization

// Note: Display configuration and performance optimization handlers moved to projection.ts module

// ============== End Enhanced APIs ==============

// Register custom protocol for local images
app.whenReady().then(() => {
  // Register custom protocol to serve local images
  protocol.registerFileProtocol("local-image", (request, callback) => {
    try {
      // Extract the file path from the URL
      const url = request.url.substring("local-image://".length);
      const filePath = decodeURIComponent(url);

      console.log("🖼️ Custom protocol serving image:", filePath);

      // Security check - ensure the file exists and is an image
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const allowedExtensions = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".bmp",
          ".webp",
        ];

        if (allowedExtensions.includes(ext)) {
          // Log successful image serving
          logSystemInfo("Background image served via custom protocol", {
            filePath,
            extension: ext,
            fileSize: fs.statSync(filePath).size,
          });
          callback({ path: filePath });
        } else {
          console.error("❌ File is not an allowed image type:", ext);
          logSystemError("Invalid image type requested", {
            filePath,
            extension: ext,
            allowedExtensions,
          });
          callback({ error: -6 }); // INVALID_URL
        }
      } else {
        console.error("❌ Image file not found:", filePath);
        callback({ error: -6 }); // INVALID_URL
      }
    } catch (error) {
      console.error("❌ Error in custom protocol handler:", error);
      callback({ error: -6 }); // INVALID_URL
    }
  });
});
