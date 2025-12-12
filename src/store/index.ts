import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import appSlice, { AppState } from "./slices/appSlice";
import songSlice from "./slices/songSlice";
import songSlidesSlice from "./slices/songSlidesSlice";
import uiSlice from "./slices/uiSlice";

/**
 * Redux store configuration optimized for large song collections.
 * Serialization checks are configured to ignore song-related actions and state paths
 * to prevent performance warnings in development mode.
 */

export const store = configureStore({
  reducer: {
    songs: songSlice,
    app: appSlice,
    songSlides: songSlidesSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types to speed up dev performance
        ignoredActions: [
          "persist/PERSIST",
          "songs/setSongs",
          "songs/setSelectedSong",
          "songs/toggleFavorite",
          "songSlides/setSlides",
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          "payload.songs",
          "payload.content",
          "payload.slides",
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "songs.songs",
          "songs.filteredSongs",
          "songs.favorites",
          "songSlides.slides",
        ],
        // Reduce warning threshold to catch only very slow operations
        warnAfter: 128,
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
