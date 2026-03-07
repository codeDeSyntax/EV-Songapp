interface DisplayInfo {
  isExternalDisplay: boolean;
  displayBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DetailedDisplayInfo {
  totalDisplays: number;
  primaryDisplay: {
    id: number;
    bounds: { x: number; y: number; width: number; height: number };
    workArea: { x: number; y: number; width: number; height: number };
    scaleFactor: number;
    internal: boolean;
  };
  allDisplays: Array<{
    id: number;
    bounds: { x: number; y: number; width: number; height: number };
    workArea: { x: number; y: number; width: number; height: number };
    scaleFactor: number;
    rotation: number;
    internal: boolean;
    isPrimary: boolean;
  }>;
}

interface ElectronAPI {
  minimizeApp: () => void;
  minimizeProjection: () => void;
  maximizeApp: () => void;
  closeApp: () => void;
  selectDirectory: () => Promise<string>;
  getDefaultSongsDirectory: () => Promise<string>;
  saveSong: (
    directory: string,
    title: string,
    content: string,
  ) => Promise<{
    success: boolean;
    filePath: string;
    isNewFile: boolean;
    message: string;
    sanitizedTitle: string;
  }>;
  projectSong: (song: any) => void;
  isProjectionActive: () => Promise<boolean>;
  closeProjectionWindow: () => Promise<boolean>;
  onProjectionStateChanged: (
    callback: (isActive: boolean) => void,
  ) => () => void;
  onDisplaySong: (callback: (songData: any) => void) => () => void;
  onDisplayInfo: (callback: (info: DisplayInfo) => void) => () => void;
  getImages: (dirPath: string) => Promise<string[]>;
  focusMainWindow: () => Promise<{ success: boolean; error?: string }>;
  openFileInDefaultApp: (
    filePath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  constructFilePath: (
    basePath: string,
    fileName: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  getDisplayInfo: () => Promise<{
    success: boolean;
    data?: DetailedDisplayInfo;
    error?: string;
  }>;
  testVisualSongBookOverride: () => Promise<{
    success: boolean;
    data?: {
      displayCount: number;
      windowsMainDisplay: number;
      controlTarget: {
        id: number;
        bounds: { x: number; y: number; width: number; height: number };
        internal: boolean;
        isOverridingWindowsMain: boolean;
      };
      projectionTarget: {
        id: number;
        bounds: { x: number; y: number; width: number; height: number };
        internal: boolean;
        isOverridingWindowsMain: boolean;
      };
      scenarios: string[];
      visualSongBookModeActive: boolean;
    };
    error?: string;
  }>;
  saveDisplayPreferences: (preferences: {
    displayId: number;
    mode: string;
  }) => Promise<{ success: boolean; data?: any; error?: string }>;
  loadDisplayPreferences: () => Promise<{
    success: boolean;
    data?: { displayId: number; mode: string; timestamp: number } | null;
    error?: string;
  }>;
  setProjectionPreferences: (preferences: {
    displayId: number;
    mode: string;
  }) => Promise<{
    success: boolean;
    data?: { displayId: number; mode: string; timestamp: number };
    error?: string;
  }>;

  // Enhanced Projection APIs
  projectSongWithSettings: (data: {
    song: any;
    settings?: any;
  }) => Promise<{ success: boolean; error?: string }>;
  getProjectionSettings: () => Promise<any>;
  updateProjectionSettings: (
    settings: any,
  ) => Promise<{ success: boolean; error?: string }>;
  previewSongOnDisplay: (data: {
    song: any;
    displayId: number;
  }) => Promise<{ success: boolean; error?: string }>;
  testDisplayProjection: (
    displayId: number,
    testMessage: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getProjectionStatus: () => Promise<{
    success: boolean;
    status?: any;
    error?: string;
  }>;
  setProjectionTheme: (
    theme: string,
  ) => Promise<{ success: boolean; error?: string }>;
  detectDisplayChanges: () => Promise<{
    success: boolean;
    displays?: any[];
    error?: string;
  }>;
  validateDisplayConfiguration: () => Promise<{
    success: boolean;
    validation?: any;
    error?: string;
  }>;
  optimizeProjectionPerformance: () => Promise<{
    success: boolean;
    optimizations?: any;
    error?: string;
  }>;
  onDisplayConfigChanged: (callback: (displays: any[]) => void) => () => void;

  // System Fonts
  getSystemFonts: () => Promise<string[]>;

  // Backup & Google Drive
  googleAuthStart: () => Promise<{ success: boolean }>;
  googleDriveStatus: () => Promise<{ connected: boolean; email?: string }>;
  googleDriveDisconnect: () => Promise<{ success: boolean }>;
  googleDriveBackup: (songsDir?: string) => Promise<{
    success: boolean;
    uploaded: number;
    timestamp: string;
    folderId: string;
  }>;
  backupSongsLocal: (songsDir?: string) => Promise<{
    success: boolean;
    cancelled?: boolean;
    count?: number;
    destDir?: string;
    timestamp?: string;
  }>;
  getLastBackupTime: () => Promise<string | null>;
  onBackupProgress: (
    callback: (progress: { current: number; total: number }) => void,
  ) => () => void;

  // Clipboard
  clipboardWrite: (text: string) => Promise<{ success: boolean }>;
  clipboardRead: () => Promise<string>;

  // App info
  getAppVersion: () => Promise<string>;

  // Launch on startup
  getLoginItemSettings: () => Promise<{ openAtLogin: boolean }>;
  setLoginItemSettings: (
    openAtLogin: boolean,
  ) => Promise<{ openAtLogin: boolean }>;

  // Cursor
  getCursorScreenPoint: () => Promise<{ x: number; y: number }>;

  // OS Notifications
  sendOsNotification: (payload: {
    title: string;
    body: string;
    silent?: boolean;
  }) => Promise<{ success: boolean; reason?: string }>;

  // Native theme
  getNativeTheme: () => Promise<{
    shouldUseDarkColors: boolean;
    themeSource: string;
  }>;
  onNativeThemeChange: (
    callback: (info: { shouldUseDarkColors: boolean }) => void,
  ) => () => void;

  // Tray
  refreshTrayMenu: () => Promise<{ success: boolean }>;
  onTrayAction: (callback: (action: string) => void) => () => void;

  // Global shortcuts
  onGlobalShortcut: (callback: (action: string) => void) => () => void;

  // Shell
  shellOpenExternal: (url: string) => Promise<{ success: boolean }>;

  // Focus projection (added earlier)
  focusProjectionWindow: () => Promise<{ success: boolean; reason?: string }>;

  // Add other API methods as needed
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export { DisplayInfo, DetailedDisplayInfo, ElectronAPI };
