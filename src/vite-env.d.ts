/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import("electron").IpcRenderer;
}

interface Window {
  api: {
    minimizeApp: () => void;
    minimizeProjection: () => void;
    maximizeApp: () => void;
    closeApp: () => void;
    selectDirectory: () => void;
    saveSong: (directory: string, title: string, content: string) => void;
    editSong: (
      directory: string,
      newTitle: string,
      content: string,
      originalPath: string
    ) => void;
    searchSong: (directory: string, searchTerm: string) => Promise<Song[]>;
    fetchSongs: (directory: string) => Promise<Song[]>;
    deleteSong: (filePath: string) => void;
    onSongsLoaded: (callback: (songs: Song[]) => void) => void;
    getPresentationImages: (directory: string) => Promise<string[]>;
    projectSong: (songs: any) => void;
    isProjectionActive: () => Promise<boolean>;
    closeProjectionWindow: () => Promise<boolean>;
    onProjectionStateChanged: (
      callback: (isActive: boolean) => void
    ) => () => void;
    onDisplaySong: (callback: (songData: Song) => void) => void;
    onDisplayInfo: (callback: (info: any) => void) => void;
    getImages: (dirPath: string) => Promise<string[]>;
    createEvPresentation: (
      path: string,
      presentation: Omit<Presentation, "id" | "createdAt" | "updatedAt">
    ) => Promise<Presentation>;
    loadEvPresentations: (path: string) => Promise<Presentation[]>;
    deleteEvPresentation: (id: string, directory: string) => Promise<void>;
    updateEvPresentation: (
      id: string,
      directoryPath: string,
      presentation: Partial<Presentation>
    ) => Promise<Presentation>;
    createBiblePresentationWindow: (
      data: any
    ) => Promise<{ success: boolean; error?: string }>;
    sendToBiblePresentation: (data: {
      type: string;
      data: any;
    }) => Promise<{ success: boolean; error?: string }>;
    focusMainWindow: () => Promise<{ success: boolean; error?: string }>;
    openFileInDefaultApp: (
      filePath: string
    ) => Promise<{ success: boolean; error?: string }>;
    constructFilePath: (
      basePath: string,
      fileName: string
    ) => Promise<{ success: boolean; path?: string; error?: string }>;
    getDisplayInfo: () => Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    logToSecretLogger: (logData: {
      application: "SONGS" | "BIBLE" | "EVPRESENTER" | "SYSTEM";
      category:
        | "INFO"
        | "WARNING"
        | "ERROR"
        | "ACTION"
        | "PROJECTION"
        | "FILE_OPERATION";
      message: string;
      details?: any;
    }) => Promise<{ success: boolean; error?: string }>;
    getSecretLogs: () => Promise<{
      success: boolean;
      logs?: Array<{
        id: string;
        timestamp: number;
        date: string;
        application: "SONGS" | "BIBLE" | "EVPRESENTER" | "SYSTEM";
        category:
          | "INFO"
          | "WARNING"
          | "ERROR"
          | "ACTION"
          | "PROJECTION"
          | "FILE_OPERATION";
        message: string;
        details?: string;
        age: string;
      }>;
      error?: string;
    }>;
    clearSecretLogs: () => Promise<{ success: boolean; error?: string }>;
    exportSecretLogs: () => Promise<{
      success: boolean;
      filePath?: string;
      error?: string;
    }>;
    getLogSettings: () => Promise<{
      success: boolean;
      settings?: {
        autoCleanup: boolean;
        interval: number;
        unit: "minutes" | "hours" | "days" | "weeks";
        customInterval: number;
      };
      error?: string;
    }>;
    updateLogSettings: (settings: {
      autoCleanup: boolean;
      interval: number;
      unit: "minutes" | "hours" | "days" | "weeks";
      customInterval: number;
    }) => Promise<{ success: boolean; error?: string }>;
    sendToSongProjection: (data: {
      type: string;
      command?: string;
      fontSize?: number;
      data?: any;
    }) => Promise<{ success: boolean; error?: string }>;
    onSongProjectionUpdate: (callback: (data: any) => void) => () => void;
    sendToMainWindow: (data: {
      type: string;
      data?: any;
    }) => Promise<{ success: boolean; error?: string }>;
    onSongProjectionCommand: (callback: (data: any) => void) => () => void;
    onFontSizeUpdate: (callback: (fontSize: number) => void) => () => void;
    onMainWindowMessage: (callback: (data: any) => void) => () => void;
  };
}
