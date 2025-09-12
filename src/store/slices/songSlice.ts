import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Song } from "@/types";

export type ViewMode = "table" | "grid" | "list";
export type ActiveTab = "collections" | "Song" | "favorites";

interface SongState {
  songs: Song[];
  filteredSongs: Song[];
  selectedSong: Song | null;
  favorites: Song[];
  searchQuery: string;
  viewMode: ViewMode;
  activeTab: ActiveTab;
  songRepo: string;
  isLoading: boolean;
  error: string | null;
  isDeleting: boolean;
  showDeleteDialog: boolean;
}

const initialState: SongState = {
  songs: [],
  filteredSongs: [],
  selectedSong: JSON.parse(localStorage.getItem("selectedSong") || "null"),
  favorites: JSON.parse(localStorage.getItem("favorites") || "[]"),
  searchQuery: "",
  viewMode: (localStorage.getItem("bmusiclayout") as ViewMode) || "table",
  activeTab: "collections",
  songRepo: localStorage.getItem("bmusicsongdir") || "",
  isLoading: false,
  error: null,
  isDeleting: false,
  showDeleteDialog: false,
};

const songSlice = createSlice({
  name: "songs",
  initialState,
  reducers: {
    setSongs: (state, action: PayloadAction<Song[]>) => {
      // Use Object.freeze to prevent mutations and speed up serialization checks
      const songs = action.payload.map((song) => Object.freeze(song));
      state.songs = songs;
      state.filteredSongs = songs;
      state.isLoading = false;
      state.error = null;
    },
    setSelectedSong: (state, action: PayloadAction<Song | null>) => {
      state.selectedSong = action.payload;
      if (action.payload) {
        localStorage.setItem("selectedSong", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("selectedSong");
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      // Filter songs based on search query
      if (action.payload.trim() === "") {
        state.filteredSongs = state.songs;
      } else {
        const query = action.payload.toLowerCase();
        state.filteredSongs = state.songs.filter(
          (song) =>
            song.title.toLowerCase().includes(query) ||
            song.content.toLowerCase().includes(query)
        );
      }
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
      localStorage.setItem("bmusiclayout", action.payload);
    },
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      state.activeTab = action.payload;
    },
    setSongRepo: (state, action: PayloadAction<string>) => {
      state.songRepo = action.payload;
      localStorage.setItem("bmusicsongdir", action.payload);
    },
    toggleFavorite: (state, action: PayloadAction<Song>) => {
      const song = action.payload;
      const existingIndex = state.favorites.findIndex(
        (fav) => fav.id === song.id
      );

      if (existingIndex >= 0) {
        state.favorites.splice(existingIndex, 1);
      } else {
        state.favorites.push(song);
      }

      localStorage.setItem("favorites", JSON.stringify(state.favorites));
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload;
    },
    setShowDeleteDialog: (state, action: PayloadAction<boolean>) => {
      state.showDeleteDialog = action.payload;
    },
    deleteSongFromState: (state, action: PayloadAction<string>) => {
      const songId = action.payload;
      state.songs = state.songs.filter((song) => song.id !== songId);
      state.filteredSongs = state.filteredSongs.filter(
        (song) => song.id !== songId
      );
      state.favorites = state.favorites.filter((song) => song.id !== songId);

      // Clear selected song if it was deleted
      if (state.selectedSong?.id === songId) {
        state.selectedSong = null;
        localStorage.removeItem("selectedSong");
      }

      localStorage.setItem("favorites", JSON.stringify(state.favorites));
    },
    clearSearch: (state) => {
      state.searchQuery = "";
      state.filteredSongs = state.songs;
    },
    updateSong: (state, action: PayloadAction<Song>) => {
      const updatedSong = action.payload;

      // Update the song in the main songs array
      const songIndex = state.songs.findIndex(
        (song) => song.id === updatedSong.id
      );
      if (songIndex !== -1) {
        state.songs[songIndex] = Object.freeze(updatedSong);
      }

      // Update the song in the filtered songs array
      const filteredIndex = state.filteredSongs.findIndex(
        (song) => song.id === updatedSong.id
      );
      if (filteredIndex !== -1) {
        state.filteredSongs[filteredIndex] = Object.freeze(updatedSong);
      }

      // Update the selected song if it's the same song
      if (state.selectedSong && state.selectedSong.id === updatedSong.id) {
        state.selectedSong = updatedSong;
        localStorage.setItem("selectedSong", JSON.stringify(updatedSong));
      }

      // Update in favorites if it exists there
      const favoriteIndex = state.favorites.findIndex(
        (song) => song.id === updatedSong.id
      );
      if (favoriteIndex !== -1) {
        state.favorites[favoriteIndex] = Object.freeze(updatedSong);
        localStorage.setItem("favorites", JSON.stringify(state.favorites));
      }
    },
  },
});

export const {
  setSongs,
  setSelectedSong,
  setSearchQuery,
  setViewMode,
  setActiveTab,
  setSongRepo,
  toggleFavorite,
  setLoading,
  setError,
  setDeleting,
  setShowDeleteDialog,
  deleteSongFromState,
  clearSearch,
  updateSong,
} = songSlice.actions;

export default songSlice.reducer;
