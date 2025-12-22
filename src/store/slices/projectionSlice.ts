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
  repeatChorusAfterVerse: boolean;
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
  repeatChorusAfterVerse: true,
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
      // Calculate display slides length based on chorus repetition setting
      let maxIndex = state.slides.length;
      if (state.repeatChorusAfterVerse) {
        const firstChorus = state.slides.find(
          (s) => s.type.toLowerCase() === "chorus"
        );
        if (firstChorus) {
          // Count how many verses don't have a chorus immediately after them
          let repetitions = 0;
          state.slides.forEach((slide, index) => {
            if (slide.type.toLowerCase() === "verse") {
              const nextSlide = state.slides[index + 1];
              const nextIsChorus =
                nextSlide && nextSlide.type.toLowerCase() === "chorus";
              if (!nextIsChorus) {
                repetitions++;
              }
            }
          });
          maxIndex = state.slides.length + repetitions;
        }
      }
      if (action.payload >= 0 && action.payload < maxIndex) {
        state.currentIndex = action.payload;
      }
    },
    goToNextSlide: (state) => {
      // Calculate display slides length based on chorus repetition setting
      let maxIndex = state.slides.length - 1;
      if (state.repeatChorusAfterVerse) {
        const firstChorus = state.slides.find(
          (s) => s.type.toLowerCase() === "chorus"
        );
        if (firstChorus) {
          // Count how many verses don't have a chorus immediately after them
          let repetitions = 0;
          state.slides.forEach((slide, index) => {
            if (slide.type.toLowerCase() === "verse") {
              const nextSlide = state.slides[index + 1];
              const nextIsChorus =
                nextSlide && nextSlide.type.toLowerCase() === "chorus";
              if (!nextIsChorus) {
                repetitions++;
              }
            }
          });
          maxIndex = state.slides.length + repetitions - 1;
        }
      }
      if (state.currentIndex < maxIndex) {
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
    setRepeatChorusAfterVerse: (state, action: PayloadAction<boolean>) => {
      state.repeatChorusAfterVerse = action.payload;
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
  setRepeatChorusAfterVerse,
  resetProjection,
} = projectionSlice.actions;

// Selector for display slides with chorus repetition
export const selectProjectionDisplaySlides = (state: {
  projection: ProjectionState;
}) => {
  const { slides, repeatChorusAfterVerse } = state.projection;

  if (!repeatChorusAfterVerse || slides.length === 0) {
    return slides;
  }

  // Find the first chorus
  const firstChorus = slides.find((s) => s.type.toLowerCase() === "chorus");
  if (!firstChorus) {
    return slides;
  }

  const displaySlides: Slide[] = [];

  slides.forEach((slide, index) => {
    displaySlides.push(slide);

    // After each verse, check if we should insert a chorus repeat
    if (slide.type.toLowerCase() === "verse") {
      const nextSlide = slides[index + 1];
      const nextIsChorus =
        nextSlide && nextSlide.type.toLowerCase() === "chorus";

      // Only insert chorus repeat if the next slide is NOT already a chorus
      if (!nextIsChorus) {
        displaySlides.push({
          ...firstChorus,
          // Note: no id field in projection Slide, identification is by position
        });
      }
    }
  });

  return displaySlides;
};

export default projectionSlice.reducer;
