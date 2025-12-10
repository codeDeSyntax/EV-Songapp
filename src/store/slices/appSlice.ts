import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CurrentScreen =
  | "Home"
  | "Songs"
  | "create"
  | "edit"
  | "Presentation"
  | "categorize"
  | "userguide"
  | "backgrounds"
  | "ControlRoom";

export type Theme = "dark" | "light" | "creamy";

export interface AppState {
  currentScreen: CurrentScreen;
  theme: Theme;
  presentationbgs: string[];
  bibleBgs: string[];
  isFullscreen: boolean;
  windowDimensions: {
    width: number;
    height: number;
  };
}

const initialState: AppState = {
  currentScreen:
    (localStorage.getItem("lastScreen") as CurrentScreen) || "Home",
  theme: (localStorage.getItem("theme") as Theme) || "creamy",
  presentationbgs: [],
  bibleBgs: [], // Initialize as empty since we'll only use custom images
  isFullscreen: false,
  windowDimensions: {
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  },
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setCurrentScreen: (state, action: PayloadAction<CurrentScreen>) => {
      state.currentScreen = action.payload;
      localStorage.setItem("lastScreen", action.payload);
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    setPresentationBgs: (state, action: PayloadAction<string[]>) => {
      state.presentationbgs = action.payload;
    },
    setBibleBgs: (state, action: PayloadAction<string[]>) => {
      state.bibleBgs = action.payload;
    },
    clearBibleBgs: (state) => {
      state.bibleBgs = [];
    },
    setWindowDimensions: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      state.windowDimensions = action.payload;
    },
    toggleFullscreen: (state) => {
      state.isFullscreen = !state.isFullscreen;
    },
    // Window control actions
    minimizeApp: () => {
      window.api?.minimizeApp();
    },
    maximizeApp: () => {
      window.api?.maximizeApp();
    },
    closeApp: () => {
      window.api?.closeApp();
    },
  },
});

export const {
  setCurrentScreen,
  setTheme,
  setPresentationBgs,
  setBibleBgs,
  clearBibleBgs,
  setWindowDimensions,
  toggleFullscreen,
  minimizeApp,
  maximizeApp,
  closeApp,
} = appSlice.actions;

export default appSlice.reducer;
