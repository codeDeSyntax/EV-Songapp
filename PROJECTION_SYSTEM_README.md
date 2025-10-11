# 🎵 East Voice Songs - Projection System Documentation

## Overview

The East Voice Songs application features a comprehensive projection system that allows displaying song lyrics on external monitors/projectors while providing real-time control and monitoring capabilities. The system consists of multiple interconnected components that work together to provide a seamless projection experience.

## Architecture Overview

```
┌─────────────────┐    ┌────────────────────┐    ┌─────────────────────────┐
│   Main App      │    │   IPC Bridge       │    │   Projection Window     │
│   (Renderer)    │◄──►│   (Main Process)   │◄──►│   (Renderer)           │
└─────────────────┘    └────────────────────┘    └─────────────────────────┘
         │                                                       │
         ▼                                                       ▼
┌─────────────────┐                                 ┌─────────────────────────┐
│  Mini Controls  │                                 │   Section Navigation    │
│   & Preview     │                                 │   & Display Updates     │
└─────────────────┘                                 └─────────────────────────┘
```

## Core Components

### 1. Main Process (`projection.ts`)

**Location:** `electron/main/projection.ts`

**Purpose:** Manages projection windows, display configuration, and IPC communication between renderer processes.

#### Key Functions:

##### `createSongPresentationWindow(mainWin?: BrowserWindow)`

- **Purpose:** Creates and configures the projection window on the selected display
- **Display Detection:** Automatically detects external displays or uses saved preferences
- **Mode Support:** Handles both extend and duplicate projection modes
- **Window Configuration:** Sets up fullscreen, borderless projection window

##### `setWindowsDisplayMode(mode: "extend" | "duplicate" | "internal" | "external")`

- **Purpose:** Controls Windows display modes using native `displayswitch.exe`
- **Integration:** Provides same functionality as Windows + P shortcuts
- **Modes:**
  - `extend`: Separate content on each screen
  - `duplicate`: Mirror content on all screens
  - `internal`: Primary screen only
  - `external`: External screen only

##### `getWindowsDisplayMode()`

- **Purpose:** Detects current Windows display configuration
- **Method:** Uses PowerShell WMI queries to determine active displays
- **Returns:** Current mode and monitor counts

#### IPC Handlers:

```typescript
// Projection control
ipcMain.handle("project-song-with-settings", async (event, { song, settings }) => { ... })
ipcMain.handle("send-to-song-projection", async (event, data) => { ... })

// Display management
ipcMain.handle("set-windows-display-mode", async (event, mode) => { ... })
ipcMain.handle("get-windows-display-mode", async () => { ... })
ipcMain.handle("detect-display-changes", async () => { ... })

// Preferences
ipcMain.handle("set-projection-preferences", async (event, preferences) => { ... })
ipcMain.handle("load-display-preferences", async () => { ... })
```

### 2. Song Presentation Display (`SongPresentationDisplay.tsx`)

**Location:** `src/vmusic/components/SongPresentationDisplay/SongPresentationDisplay.tsx`

**Purpose:** The actual projection window that displays song content on external screens.

#### Key Features:

##### Song Section Parsing

```typescript
// Parses song content into structured sections
const parseSongContent = (content: string) => {
  // Identifies: Verse 1, Verse 2, Chorus, Bridge, etc.
  // Creates navigable sections with content arrays
};
```

##### Real-time Updates

```typescript
// Sends current section info to main window
useEffect(() => {
  window.api?.sendToMainWindow({
    type: "SONG_PROJECTION_UPDATE",
    data: {
      type: "PAGE_CHANGE",
      currentPage: currentIndex,
      totalPages: songSections.length,
      currentSection: songSections[currentIndex]?.type,
      sectionNumber: songSections[currentIndex]?.number,
    },
  });
}, [currentIndex, songSections]);
```

##### Event Listeners:

1. **Projection Commands:** Listens for navigation and section commands

   ```typescript
   window.api?.onSongProjectionCommand?.((event, data) => {
     // Handles: next, previous, goto-section, font-size updates
   });
   ```

2. **Keyboard Navigation:** Responds to arrow keys and section shortcuts
   ```typescript
   useEffect(() => {
     const handleKeyDown = (event: KeyboardEvent) => {
       switch (event.code) {
         case "ArrowLeft":
           goToPrevious();
           break;
         case "ArrowRight":
           goToNext();
           break;
         case "KeyC":
           goToChorus();
           break;
         // ... verse shortcuts 1-9
       }
     };
   }, []);
   ```

### 3. Projection Navigation Hook (`useSongProjectionNavigation.ts`)

**Location:** `src/features/songs/hooks/useSongProjectionNavigation.ts`

**Purpose:** Provides centralized navigation controls and state management for projection.

#### Key Functions:

##### Navigation Commands

```typescript
const sendNavigationCommand = async (command: "next" | "previous" | "goto") => {
  await window.api.sendToSongProjection({
    command: command,
    type: "NAVIGATION",
  });
};

const sendSectionCommand = async (
  sectionType: "chorus" | "verse",
  sectionNumber?: number
) => {
  await window.api.sendToSongProjection({
    command: "goto-section",
    type: "SECTION_NAVIGATION",
    data: { sectionType, sectionNumber },
  });
};
```

##### Keyboard Event Handling

- **Arrow Keys:** Next/Previous slides
- **'C' Key:** Jump to Chorus
- **Number Keys (1-9):** Jump to specific verses
- **Font Size:** +/- keys for text size adjustment

##### State Management

```typescript
// Tracks projection state across components
const { isProjectionActive } = useProjectionState();
const [currentPage, setCurrentPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
```

### 4. Projection Controls (`SongProjectionControls.tsx`)

**Location:** `src/vmusic/components/SongProjectionControls.tsx`

**Purpose:** Floating mini-control panel that appears when projection is active.

#### Features:

##### Control Buttons

- **Previous/Next:** Navigate between sections
- **Page Counter:** Shows current position (e.g., "3/8")
- **Font Size:** Adjustable text scaling

##### Auto-Show/Hide Logic

```typescript
// Only displays when projection is active
if (!isProjectionActive) {
  return null;
}
```

##### Real-time Sync

- Updates button states based on current position
- Disables navigation when at boundaries
- Reflects changes from keyboard shortcuts

### 5. Floating Projection Preview (`FloatingProjectionPreview.tsx`)

**Location:** `src/components/FloatingProjectionPreview/FloatingProjectionPreview.tsx`

**Purpose:** Zoom-like floating window showing current section information.

#### Key Features:

##### Message Listening

```typescript
useEffect(() => {
  const handleMainWindowMessage = (data: any) => {
    // Listen for SONG_PROJECTION_UPDATE messages
    if (data.type === "SONG_PROJECTION_UPDATE" && data.data) {
      const { currentSection, sectionNumber } = data.data;
      const sectionName = sectionNumber
        ? `${currentSection} ${sectionNumber}`
        : currentSection;
      setCurrentSectionName(sectionName);
    }
  };

  const cleanup = window.api?.onMainWindowMessage?.(handleMainWindowMessage);
  return () => cleanup?.();
}, []);
```

##### Draggable Interface

- **Position Persistence:** Saves location in localStorage
- **Boundary Constraints:** Prevents dragging outside screen
- **Minimize/Maximize:** Collapsible to save space

##### Auto-Visibility

```typescript
// Shows/hides based on projection state
const { isVisible } = useProjectionState();
```

### 6. Display Configuration (`DisplayTabContent.tsx`)

**Location:** `src/vmusic/Sidebar/components/tabs/DisplayTabContent.tsx`

**Purpose:** User interface for configuring display preferences and Windows display modes.

#### Key Features:

##### Display Detection

```typescript
const loadDisplays = async () => {
  // Discovers all available displays
  // Gets resolution, position, and internal/external status
  const response = await window.api?.getDisplayInfo?.();
};
```

##### Windows Display Mode Control

```typescript
const handleWindowsDisplayMode = async (mode) => {
  // Direct integration with Windows display switching
  const result = await window.api?.setWindowsDisplayMode?.(mode);
  // Equivalent to Windows + P shortcuts
};
```

##### Preference Management

- **Display Selection:** Choose target projection screen
- **Mode Selection:** Extend vs. Duplicate modes
- **Persistence:** Save settings across app sessions

## Communication Flow

### 1. Projection Startup

```
User Click "Project Song"
    ↓
Main App → IPC → Main Process
    ↓
createSongPresentationWindow()
    ↓
Projection Window Created & Song Loaded
    ↓
Real-time Updates Begin
```

### 2. Section Navigation

```
User Input (Keyboard/Button)
    ↓
useSongProjectionNavigation Hook
    ↓
sendSectionCommand() → IPC Bridge
    ↓
SongPresentationDisplay Receives Command
    ↓
Updates Current Section & UI
    ↓
Sends Update to Main Window
    ↓
FloatingProjectionPreview Updates Display
```

### 3. Display Mode Changes

```
User Selects Display Mode
    ↓
DisplayTabContent Component
    ↓
handleWindowsDisplayMode() → IPC Bridge
    ↓
Main Process Executes displayswitch.exe
    ↓
Windows Changes Display Configuration
    ↓
Success Notification Shown
```

## Event Types and Data Structures

### IPC Message Types

#### Navigation Commands

```typescript
{
  command: "next" | "previous" | "goto",
  type: "NAVIGATION"
}
```

#### Section Navigation

```typescript
{
  command: "goto-section",
  type: "SECTION_NAVIGATION",
  data: {
    sectionType: "chorus" | "verse",
    sectionNumber?: number
  }
}
```

#### Projection Updates

```typescript
{
  type: "SONG_PROJECTION_UPDATE",
  data: {
    type: "PAGE_CHANGE",
    currentPage: number,
    totalPages: number,
    currentSection: string,
    sectionNumber: number | null
  }
}
```

### Song Section Structure

```typescript
interface SongSection {
  type: string; // "Verse", "Chorus", "Bridge", etc.
  content: string[]; // Array of lyric lines
  number?: number; // Verse/section number if applicable
  isRepeating?: boolean;
}
```

### Display Information

```typescript
interface Display {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
  internal: boolean; // Built-in vs. external display
}
```

## Key Integration Points

### 1. Electron IPC Bridge

- **Main Process:** Handles window creation, display detection, OS integration
- **Renderer Processes:** UI components, user interaction, content display
- **Cross-Process Communication:** Real-time updates, command execution

### 2. Windows OS Integration

- **displayswitch.exe:** Native display mode switching
- **PowerShell WMI:** Display configuration detection
- **Window Management:** Fullscreen projection positioning

### 3. State Synchronization

- **Projection State:** Shared across components via hooks
- **Current Section:** Real-time updates from projection window
- **Display Preferences:** Persistent storage and retrieval

## Error Handling and Resilience

### Display Detection Failures

- **Fallback Logic:** Uses primary display when external not available
- **Refresh Mechanism:** Re-detect displays on configuration changes
- **User Notifications:** Clear error messages and recovery guidance

### Projection Window Issues

- **Window Recovery:** Automatic recreation on crashes
- **Focus Management:** Prevents projection window from losing focus
- **Cross-Display Compatibility:** Handles different resolutions and DPI

### Communication Failures

- **IPC Timeouts:** Graceful handling of communication errors
- **State Reconciliation:** Automatic sync when connections restored
- **User Feedback:** Clear status indicators and error reporting

## Development Notes

### Adding New Features

1. **Navigation Commands:** Extend `sendSectionCommand()` types
2. **Display Modes:** Add new modes to `setWindowsDisplayMode()`
3. **UI Components:** Follow existing IPC communication patterns

### Testing Considerations

- **Multi-Display Setups:** Test with various monitor configurations
- **Windows Versions:** Verify displayswitch.exe compatibility
- **Performance:** Monitor memory usage with multiple projection windows

### Debugging Tools

- **Console Logging:** Comprehensive logging throughout IPC chain
- **Developer Tools:** Available in both main and projection windows
- **State Inspection:** Real-time state monitoring in React DevTools

---

This projection system provides a robust, professional-grade solution for live song projection with real-time control, multi-display support, and seamless integration with Windows display management.
