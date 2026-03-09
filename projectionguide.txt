# Display Management Solution for Bible App

## Problem Statement

Users needed to frequently switch Windows display settings (duplicate/extend mode and primary display designation) when using different church applications. The Bible app required Display 1 as primary for proper window separation, while other apps (like VSB) required Display 2 as primary. These constant switches caused window positioning issues and poor user experience.

## Solution Overview

Implemented intelligent display detection that works **regardless of which display is set as primary in Windows**, eliminating the need for users to change display settings between applications.

---

## Implementation Details

### Core Concept

- **Main Window (Controller)**: Always targets the **internal/laptop display** (`display.internal === true`)
- **Projection Window (Audience)**: Always targets the **external monitor** (`display.internal === false`)
- This approach is **independent of Windows primary display settings**

---

## Code Changes

### 1. Main Window Creation (`electron/main/index.ts`)

**Before:**

```typescript
async function createMainWindow() {
  mainWin = new BrowserWindow({
    title: "Main window",
    frame: false,
    fullscreen: true,
    // No display specified - defaults to primary display (PROBLEM!)
    icon: path.join(process.env.VITE_PUBLIC, "bibleicon.png"),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0,
    },
  });
}
```

**After:**

```typescript
async function createMainWindow() {
  // Detect the internal (laptop) display for the controller
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  // Strategy: Main window should go to internal display (laptop screen)
  const internalDisplay = displays.find((d) => d.internal);
  const controllerDisplay = internalDisplay || primaryDisplay;

  console.log("🖥️ Main Window Display Selection:", {
    totalDisplays: displays.length,
    selectedDisplay: controllerDisplay.id,
    isInternal: controllerDisplay.internal,
    bounds: controllerDisplay.bounds,
  });

  mainWin = new BrowserWindow({
    title: "Main window",
    frame: false,
    // Explicitly position on internal display
    x: controllerDisplay.bounds.x,
    y: controllerDisplay.bounds.y,
    width: controllerDisplay.bounds.width,
    height: controllerDisplay.bounds.height,
    icon: path.join(process.env.VITE_PUBLIC, "bibleicon.png"),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1.0,
    },
  });

  // Note: Removed fullscreen: true to allow taskbar access
  mainWin.maximize(); // Called after window creation
}
```

**Key Changes:**

- Uses `screen.getAllDisplays()` to detect all available displays
- Finds internal display using `display.internal` property
- Explicitly sets `x`, `y`, `width`, `height` based on detected display
- Removed `fullscreen: true` (replaced with `.maximize()`) to allow Windows taskbar access

---

### 2. External Display Detection (`electron/main/projectionManager.ts`)

**Before:**

```typescript
export function detectExternalDisplay(): Electron.Display | null {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  // Strategy 1: Find non-internal displays (external monitors/projectors)
  const externalNonInternal = displays.find(
    (display) => !display.internal && display.id !== primaryDisplay.id
    // ❌ PROBLEM: Fails when external display IS the primary display
  );

  if (externalNonInternal) {
    return externalNonInternal;
  }

  // Fallback strategies...
}
```

**After:**

```typescript
export function detectExternalDisplay(): Electron.Display | null {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  console.log("🔍 Detecting external display...", {
    totalDisplays: displays.length,
    primaryDisplayId: primaryDisplay.id,
  });

  if (displays.length === 1) {
    console.log("⚠️ Only one display detected - using primary");
    return null;
  }

  // Strategy 1: Find non-internal displays (external monitors/projectors)
  // ✅ Works regardless of which display is set as "primary" in Windows
  const externalNonInternal = displays.find((display) => !display.internal);

  if (externalNonInternal) {
    console.log("✅ Strategy 1: Found non-internal external display", {
      id: externalNonInternal.id,
      bounds: externalNonInternal.bounds,
      isPrimary: externalNonInternal.id === primaryDisplay.id,
    });
    return externalNonInternal;
  }

  // Strategy 2: Find displays not at origin (0,0) - likely secondary monitors
  const externalNotAtOrigin = displays.find(
    (display) =>
      (display.bounds.x !== 0 || display.bounds.y !== 0) &&
      display.id !== primaryDisplay.id
  );

  if (externalNotAtOrigin) {
    console.log("✅ Strategy 2: Found display not at origin (secondary)", {
      id: externalNotAtOrigin.id,
      bounds: externalNotAtOrigin.bounds,
    });
    return externalNotAtOrigin;
  }

  // Strategy 3: Use second display if multiple exist
  const secondaryDisplay = displays.find(
    (display) => display.id !== primaryDisplay.id
  );

  if (secondaryDisplay) {
    console.log("✅ Strategy 3: Using second display as external", {
      id: secondaryDisplay.id,
      bounds: secondaryDisplay.bounds,
    });
    return secondaryDisplay;
  }

  console.log("⚠️ No external display found - falling back to primary");
  return null;
}
```

**Key Changes:**

- **Removed `display.id !== primaryDisplay.id` check** from Strategy 1
- Now Strategy 1 only checks `!display.internal`, which works regardless of primary display setting
- Added comprehensive logging for debugging
- Maintains fallback strategies for edge cases

---

## How It Works

### Display Detection Logic Flow

```
┌─────────────────────────────────────────┐
│  User Opens Bible App                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Main Window Creation                   │
├─────────────────────────────────────────┤
│  1. Get all displays                    │
│  2. Find display.internal === true      │
│  3. Position main window there          │
│  4. Fallback: Use primary display       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  User Clicks "Project"                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Projection Window Creation             │
├─────────────────────────────────────────┤
│  1. Call detectExternalDisplay()        │
│  2. Find display.internal === false     │
│  3. Position projection window there    │
│  4. Fallback: Use non-origin display    │
│  5. Final fallback: Use secondary       │
└─────────────────────────────────────────┘
```

---

## Benefits

✅ **No Manual Display Configuration Required**: Users never need to change Windows display settings for this app

✅ **Consistent Behavior**: Works in duplicate mode, extend mode, with any display set as primary

✅ **Multi-App Compatibility**: Bible app and VSB (or other apps) can have different "preferred" primary displays without conflicts

✅ **Robust Fallbacks**: Multiple detection strategies ensure the app works even on unusual display configurations

✅ **Better UX**: Taskbar remains accessible on main window (removed fullscreen mode)

---

## Testing Scenarios

The solution was tested and confirmed working in:

1. **Extend Mode, Display 1 Primary**: Main on laptop, projection on external ✅
2. **Extend Mode, Display 2 Primary**: Main on laptop, projection on external ✅
3. **Duplicate Mode**: Falls back gracefully ✅
4. **Single Display**: Main window only, no projection available ✅

---

## Key Electron APIs Used

```typescript
// Get all connected displays
screen.getAllDisplays(): Display[]

// Get the primary display (per Windows settings)
screen.getPrimaryDisplay(): Display

// Display properties used:
interface Display {
  id: number;                    // Unique identifier
  bounds: Rectangle;             // Position and size
  internal: boolean;             // True for laptop screen
  // Other properties...
}

// Rectangle structure:
interface Rectangle {
  x: number;      // Position from left
  y: number;      // Position from top
  width: number;  // Display width
  height: number; // Display height
}
```

---

## Future Enhancements

Potential improvements for even better display management:

1. **Remember User Preferences**: Store which display user prefers for projection if they manually change it
2. **Display Change Monitoring**: Already implemented - responds to display connect/disconnect events
3. **Multi-Monitor Setups**: Could support 3+ displays with priority selection
4. **Resolution Awareness**: Could optimize window size based on display resolution

---

This solution demonstrates how Electron's `screen` API can be used to create display-aware applications that work seamlessly across different hardware configurations and Windows display settings.
