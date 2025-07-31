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
  saveSong: (directory: string, title: string, content: string) => void;
  projectSong: (song: any) => void;
  isProjectionActive: () => Promise<boolean>;
  closeProjectionWindow: () => Promise<boolean>;
  onProjectionStateChanged: (
    callback: (isActive: boolean) => void
  ) => () => void;
  onDisplaySong: (callback: (songData: any) => void) => () => void;
  onDisplayInfo: (callback: (info: DisplayInfo) => void) => () => void;
  getImages: (dirPath: string) => Promise<string[]>;
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
    data?: DetailedDisplayInfo;
    error?: string;
  }>;
  // Add other API methods as needed
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export { DisplayInfo, DetailedDisplayInfo, ElectronAPI };
