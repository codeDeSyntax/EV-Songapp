# 🔒 Secret Logging System - Implementation Guide

## Overview

This document provides the secret credentials and implementation details for the BlessedMusic logging system.

## 🔐 SECRET CREDENTIALS

### Password

```
evapp56
```

### Secret Key Sequence

```
Ctrl + ` or Ctrl + Shift + L
```

_Use Ctrl+backtick (like VS Code terminal) or Ctrl+Shift+L_

## 🚀 How to Access the Logs

1. **Trigger the Secret Window**

   - Press `Ctrl + ` ` (backtick key, above Tab)
   - OR press `Ctrl + Shift + L`
   - A password prompt will appear

2. **Enter the Password**

   - Type: `evapp56`
   - Press Enter or click "AUTHENTICATE"

3. **View the Logs**
   - The secret logs window will open with a terminal-like interface
   - Browse logs by application, category, and time
   - Search, filter, export, or clear logs as needed

## 📋 Log Categories

### Applications

- **SONGS** - Song management operations
- **BIBLE** - Bible app operations
- **EVPRESENTER** - EvPresenter operations
- **SYSTEM** - System-level operations

### Categories

- **ACTION** - User actions (create, edit, delete)
- **PROJECTION** - Projection operations
- **FILE_OPERATION** - File system operations
- **INFO** - General information
- **WARNING** - Warning messages
- **ERROR** - Error conditions

## 🗃️ Log Storage

- Logs are stored in: `~/.blessedmusic/.system_logs.json`
- Auto-cleanup: Logs older than 3 weeks are automatically deleted
- Persistent across app restarts

## 📊 Log Entry Structure

```json
{
  "id": "log_1234567890_abc123",
  "timestamp": 1640995200000,
  "date": "2021-12-31T23:00:00.000Z",
  "application": "SONGS",
  "category": "ACTION",
  "message": "New song created successfully",
  "details": "{\"title\":\"Amazing Grace\",\"contentLength\":1250}",
  "age": "2 minutes ago"
}
```

## 🔍 **Enhanced Detailed Logging**

The system now captures comprehensive details for all operations:

### **Display & Projection Details**

- Multi-monitor detection with full display properties
- External display configuration and bounds
- Projection window creation with exact coordinates
- Display scaling factors and internal/external status

### **File Operations**

- Complete file paths and directory structures
- File counts and content lengths
- Background image loading with sample file lists
- Custom protocol image serving with security validation

### **Song Management**

- Song directory loading with precise counts (e.g., "1021 songs loaded")
- Projection details including content length and background status
- File modification timestamps and content analysis

### **System Performance**

- Projection state monitoring with active window tracking
- Memory usage and resource allocation
- Error conditions with full context and stack traces

### **Example Detailed Log Entries**

**Song Directory Loading:**

```json
{
  "message": "Songs loaded from directory",
  "details": {
    "directory": "J:\\eastvoice\\newsongs",
    "songCount": 1021,
    "fileCount": 1021,
    "processTime": "2.3s"
  }
}
```

**Display Detection:**

```json
{
  "message": "Display detection completed",
  "details": {
    "displayCount": 2,
    "displays": [
      {
        "id": 2528732444,
        "bounds": { "x": 0, "y": 0, "width": 1280, "height": 720 },
        "internal": true,
        "scaleFactor": 1.5
      },
      {
        "id": 2480450848,
        "bounds": { "x": 1280, "y": 0, "width": 1612, "height": 720 },
        "internal": false,
        "scaleFactor": 1
      }
    ]
  }
}
```

**Background Image Loading:**

```json
{
  "message": "Background images loaded from directory",
  "details": {
    "directory": "J:\\bmusic\\pbgs\\bgs4",
    "totalFiles": 15,
    "imageFiles": 9,
    "sampleImages": [
      "J:\\bmusic\\pbgs\\bgs4\\4882066.jpg",
      "J:\\bmusic\\pbgs\\bgs4\\blue-brush-stroke-frame.jpg",
      "J:\\bmusic\\pbgs\\bgs4\\blue-grunge-wall-texture.jpg"
    ]
  }
}
```

## 🔧 Integration Points

### Adding to Your App

Wrap your main app component with the SecretLogsManager:

```tsx
import { SecretLogsManager } from "@/components/SecretLogsManager";

function App() {
  return (
    <SecretLogsManager>{/* Your existing app components */}</SecretLogsManager>
  );
}
```

### Current Logging Points

#### Songs App

- ✅ Song creation/updates/deletions
- ✅ Song directory loading with counts
- ✅ Song projection events with content details
- ✅ File operation errors and validation
- ✅ Background image loading with file paths
- ✅ Custom protocol image serving

#### System

- ✅ Application startup and display detection
- ✅ Multi-monitor configuration details
- ✅ Projection window creation with bounds
- ✅ Projection state changes and monitoring
- ✅ Background image directory scanning
- ✅ File system operations and errors
- ✅ Log system access/exports

#### Bible App

- ✅ Bible data initialization with translation counts
- ✅ Translation switching and loading
- ✅ Book/chapter/verse navigation
- ✅ Search operations with result metrics
- ✅ Error handling and recovery

#### EvPresenter App

- ✅ Presentation loading with counts
- ✅ Slideshow operations and navigation
- ✅ File operations and validation
- ✅ Error tracking and debugging

## 🛡️ Security Features

1. **Hidden Access** - No visible UI elements, only secret key combo
2. **Password Protection** - Strong password required for access
3. **Auto-lockout** - Wrong password closes prompt after 2 seconds
4. **Audit Trail** - Admin access is logged
5. **Data Encryption** - Consider encrypting log files (future enhancement)

## 🎨 UI Design

The logs window features a terminal/Git Bash-like design:

- Dark background with green text
- Monospace fonts
- Color-coded applications and categories
- Real-time age updates
- Detailed log inspection panel

## 📤 Export Features

- Export logs to JSON or TXT format
- Includes metadata (export date, log count)
- Saves to user-selected location
- Logged for audit purposes

## 🧹 Maintenance

- Automatic cleanup of old logs (3+ weeks)
- Manual clear all logs option
- Log file size monitoring
- Performance impact monitoring

---

**⚠️ CONFIDENTIAL - This information should only be shared with authorized administrators.**
