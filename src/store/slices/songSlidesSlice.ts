import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SongSlide } from "@/vmusic/ControlRoom/utils/lyricsParser";

interface SongSlidesState {
  slides: SongSlide[];
  currentSlideId: string | null;
  songTitle: string;
  isSaving: boolean;
}

const initialState: SongSlidesState = {
  slides: [],
  currentSlideId: null,
  songTitle: "",
  isSaving: false,
};

const songSlidesSlice = createSlice({
  name: "songSlides",
  initialState,
  reducers: {
    setSlides: (state, action: PayloadAction<SongSlide[]>) => {
      state.slides = action.payload;
      // Auto-select first slide if slides exist
      if (action.payload.length > 0 && !state.currentSlideId) {
        state.currentSlideId = action.payload[0].id;
      }
      // Auto-generate title from first few words when new slides are pasted
      if (action.payload.length > 0) {
        const firstSlideContent = action.payload[0].content.trim();
        const firstWords = firstSlideContent.split(/\s+/).slice(0, 5).join(" ");
        state.songTitle =
          firstWords.length > 30
            ? firstWords.substring(0, 30) + "..."
            : firstWords;
      }
    },
    setSongTitle: (state, action: PayloadAction<string>) => {
      state.songTitle = action.payload;
    },
    setCurrentSlide: (state, action: PayloadAction<string>) => {
      state.currentSlideId = action.payload;
    },
    setIsSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    clearSlides: (state) => {
      state.slides = [];
      state.currentSlideId = null;
      state.songTitle = "";
    },
    addSlide: (state, action: PayloadAction<SongSlide>) => {
      state.slides.push(action.payload);
    },
    updateSlide: (
      state,
      action: PayloadAction<{ id: string; content: string }>
    ) => {
      const slide = state.slides.find((s) => s.id === action.payload.id);
      if (slide) {
        slide.content = action.payload.content;
      }
    },
    removeSlide: (state, action: PayloadAction<string>) => {
      state.slides = state.slides.filter((s) => s.id !== action.payload);
      // If removed slide was current, select first available
      if (state.currentSlideId === action.payload && state.slides.length > 0) {
        state.currentSlideId = state.slides[0].id;
      }
    },
  },
});

export const {
  setSlides,
  setCurrentSlide,
  setSongTitle,
  setIsSaving,
  clearSlides,
  addSlide,
  updateSlide,
  removeSlide,
} = songSlidesSlice.actions;

export default songSlidesSlice.reducer;
