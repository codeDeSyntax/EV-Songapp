import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Slide {
  content: string;
  type: string;
  number?: number;
}

interface LastProjectedSong {
  slides: Slide[];
  songTitle: string;
  currentIndex: number;
}

interface ProjectionState {
  slides: Slide[];
  currentIndex: number;
  songTitle: string;
  fontSizeMultiplier: number;
  backgroundImage: string;
  fontFamily: string;
  backgroundOverlayOpacity: number;
  isExternalDisplay: boolean;
  isFontCalculated: boolean;
  lastProjectedSong: LastProjectedSong | null;
}

const initialState: ProjectionState = {
  slides: [],
  currentIndex: 0,
  songTitle: "",
  fontSizeMultiplier: 1.0,
  backgroundImage: "./wood7.png",
  fontFamily: "EB Garamond, serif",
  backgroundOverlayOpacity: 0.5,
  isExternalDisplay: false,
  isFontCalculated: false,
  lastProjectedSong: null,
};

const projectionSlice = createSlice({
  name: "projection",
  initialState,
  reducers: {
    setSlides: (state, action: PayloadAction<Slide[]>) => {
      state.slides = action.payload;
      // Reset to first slide when new slides are loaded
      if (action.payload.length > 0) {
        state.currentIndex = 0;
        // Save as last projected song
        state.lastProjectedSong = {
          slides: action.payload,
          songTitle: state.songTitle,
          currentIndex: 0,
        };
      }
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.slides.length) {
        state.currentIndex = action.payload;
      }
    },
    goToNextSlide: (state) => {
      if (state.currentIndex < state.slides.length - 1) {
        state.currentIndex += 1;
      }
    },
    goToPreviousSlide: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },
    setSongTitle: (state, action: PayloadAction<string>) => {
      state.songTitle = action.payload;
      // Update last projected song title if it exists
      if (state.lastProjectedSong) {
        state.lastProjectedSong.songTitle = action.payload;
      }
    },
    setLastProjectedSong: (
      state,
      action: PayloadAction<LastProjectedSong | null>
    ) => {
      state.lastProjectedSong = action.payload;
    },
    setFontSizeMultiplier: (state, action: PayloadAction<number>) => {
      // Clamp between 0.5 and 3.0
      state.fontSizeMultiplier = Math.max(0.5, Math.min(3.0, action.payload));
    },
    increaseFontSize: (state) => {
      const newSize = Math.min(3.0, state.fontSizeMultiplier + 0.1);
      state.fontSizeMultiplier = newSize;
    },
    decreaseFontSize: (state) => {
      const newSize = Math.max(0.5, state.fontSizeMultiplier - 0.1);
      state.fontSizeMultiplier = newSize;
    },
    setBackgroundImage: (state, action: PayloadAction<string>) => {
      state.backgroundImage = action.payload;
    },
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
    },
    setBackgroundOverlayOpacity: (state, action: PayloadAction<number>) => {
      state.backgroundOverlayOpacity = Math.max(0, Math.min(1, action.payload));
    },
    setIsExternalDisplay: (state, action: PayloadAction<boolean>) => {
      state.isExternalDisplay = action.payload;
    },
    setIsFontCalculated: (state, action: PayloadAction<boolean>) => {
      state.isFontCalculated = action.payload;
    },
    resetProjection: (state) => {
      state.slides = [];
      state.currentIndex = 0;
      state.songTitle = "";
      state.isFontCalculated = false;
    },
  },
});

export const {
  setSlides,
  setCurrentIndex,
  goToNextSlide,
  goToPreviousSlide,
  setSongTitle,
  setFontSizeMultiplier,
  increaseFontSize,
  decreaseFontSize,
  setBackgroundImage,
  setFontFamily,
  setBackgroundOverlayOpacity,
  setIsExternalDisplay,
  setIsFontCalculated,
  setLastProjectedSong,
  resetProjection,
} = projectionSlice.actions;

export default projectionSlice.reducer;
