import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Song } from "@/types";

export type ViewMode = "table" | "grid" | "list";
export type ActiveTab = "collections" | "Song" | "favorites";

interface RecentSong extends Song {
  presentedAt: string; // ISO string of date when the song was presented
}

interface RecentGroup {
  date: string; // Date in ISO format (YYYY-MM-DD)
  songs: RecentSong[]; // Songs presented on this date
}

interface SongState {
  songs: Song[];
  filteredSongs: Song[];
  selectedSong: Song | null;
  favorites: Song[];
  recentSongs: RecentGroup[]; // Songs grouped by presentation date
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
  recentSongs: JSON.parse(localStorage.getItem("recentSongs") || "[]"),
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
    addToRecents: (state, action: PayloadAction<Song>) => {
      const song = action.payload;
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      // Convert song to RecentSong
      const recentSong: RecentSong = {
        ...song,
        presentedAt: new Date().toISOString(),
      };

      // Find if we already have an entry for today
      const todayGroupIndex = state.recentSongs.findIndex(
        (group) => group.date === today
      );

      if (todayGroupIndex !== -1) {
        // Check if song is already in today's group
        const songIndex = state.recentSongs[todayGroupIndex].songs.findIndex(
          (s) => s.id === song.id
        );

        if (songIndex !== -1) {
          // Move the song to the top of today's group and update the presentedAt time
          const updatedSong = {
            ...state.recentSongs[todayGroupIndex].songs[songIndex],
            presentedAt: recentSong.presentedAt,
          };
          state.recentSongs[todayGroupIndex].songs.splice(songIndex, 1);
          state.recentSongs[todayGroupIndex].songs.unshift(updatedSong);
        } else {
          // Add song to today's group at the beginning (most recent first)
          state.recentSongs[todayGroupIndex].songs.unshift(recentSong);
        }
      } else {
        // Create new group for today
        state.recentSongs.push({
          date: today,
          songs: [recentSong],
        });
      }

      // Sort groups by date (newest first)
      state.recentSongs.sort((a, b) => b.date.localeCompare(a.date));

      // Within each group, sort songs by presentedAt (newest first)
      state.recentSongs.forEach((group) => {
        group.songs.sort(
          (a, b) =>
            new Date(b.presentedAt).getTime() -
            new Date(a.presentedAt).getTime()
        );
      });

      // Keep only the last 3 weeks of songs
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // 3 weeks = 21 days
      const threeWeeksAgoStr = threeWeeksAgo.toISOString().split("T")[0];

      state.recentSongs = state.recentSongs.filter(
        (group) => group.date >= threeWeeksAgoStr
      );

      // Update localStorage
      try {
        localStorage.setItem("recentSongs", JSON.stringify(state.recentSongs));
        console.log("Recent songs saved to localStorage successfully");
      } catch (error) {
        console.error("Failed to save recent songs to localStorage:", error);
      }
    },
    removeFromRecents: (
      state,
      action: PayloadAction<{ songId: string; date: string }>
    ) => {
      const { songId, date } = action.payload;

      // Find the group for the specified date
      const groupIndex = state.recentSongs.findIndex(
        (group) => group.date === date
      );

      if (groupIndex !== -1) {
        // Remove the song from that group
        state.recentSongs[groupIndex].songs = state.recentSongs[
          groupIndex
        ].songs.filter((song) => song.id !== songId);

        // If the group is empty, remove it
        if (state.recentSongs[groupIndex].songs.length === 0) {
          state.recentSongs.splice(groupIndex, 1);
        }

        // Update localStorage
        try {
          localStorage.setItem(
            "recentSongs",
            JSON.stringify(state.recentSongs)
          );
          console.log("Recent songs updated in localStorage after removal");
        } catch (error) {
          console.error(
            "Failed to save recent songs to localStorage after removal:",
            error
          );
        }
      }
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

      // Update in recent songs if it exists there
      state.recentSongs.forEach((group) => {
        const recentIndex = group.songs.findIndex(
          (song) => song.id === updatedSong.id
        );
        if (recentIndex !== -1) {
          group.songs[recentIndex] = {
            ...updatedSong,
            presentedAt: group.songs[recentIndex].presentedAt,
          };
        }
      });
      localStorage.setItem("recentSongs", JSON.stringify(state.recentSongs));
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
  addToRecents,
  removeFromRecents,
  updateSong,
} = songSlice.actions;

export default songSlice.reducer;
