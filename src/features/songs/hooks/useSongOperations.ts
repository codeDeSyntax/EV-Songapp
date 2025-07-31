import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
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
  ViewMode,
  ActiveTab,
} from "@/store/slices/songSlice";
import { setCurrentScreen } from "@/store/slices/appSlice";
import { Song } from "@/types";

export const useSongOperations = () => {
  const dispatch = useAppDispatch();
  const songs = useAppSelector((state) => state.songs.songs);
  const filteredSongs = useAppSelector((state) => state.songs.filteredSongs);
  const selectedSong = useAppSelector((state) => state.songs.selectedSong);
  const favorites = useAppSelector((state) => state.songs.favorites);
  const searchQuery = useAppSelector((state) => state.songs.searchQuery);
  const viewMode = useAppSelector((state) => state.songs.viewMode);
  const activeTab = useAppSelector((state) => state.songs.activeTab);
  const songRepo = useAppSelector((state) => state.songs.songRepo);
  const isLoading = useAppSelector((state) => state.songs.isLoading);
  const error = useAppSelector((state) => state.songs.error);
  const isDeleting = useAppSelector((state) => state.songs.isDeleting);
  const showDeleteDialog = useAppSelector(
    (state) => state.songs.showDeleteDialog
  );

  // Song selection operations
  const selectSong = useCallback(
    (song: Song) => {
      dispatch(setSelectedSong(song));
      dispatch(setActiveTab("Song"));
    },
    [dispatch]
  );

  const deselectSong = useCallback(() => {
    dispatch(setSelectedSong(null));
  }, [dispatch]);

  // Song presentation operations
  const presentSong = useCallback(
    (song: Song) => {
      if (song) {
        localStorage.setItem("selectedSong", JSON.stringify(song));
        window.api.projectSong(song);
        window.api.onDisplaySong((selectedSong) => {
          console.log(`songData: ${selectedSong.title}`);
        });

        // Add song to recents when presented
        dispatch(addToRecents(song));
      }
    },
    [dispatch]
  );

  const goToPresentation = useCallback(() => {
    dispatch(setCurrentScreen("Presentation"));
  }, [dispatch]);

  const presentSelectedSong = useCallback(() => {
    if (selectedSong) {
      presentSong(selectedSong);
    }
  }, [selectedSong, presentSong]);

  // Navigation operations
  const goToEdit = useCallback(() => {
    dispatch(setCurrentScreen("edit"));
  }, [dispatch]);

  const goToCreate = useCallback(() => {
    dispatch(setCurrentScreen("create"));
  }, [dispatch]);

  const goToCategorize = useCallback(() => {
    dispatch(setCurrentScreen("categorize"));
  }, [dispatch]);

  const goToUserGuide = useCallback(() => {
    dispatch(setCurrentScreen("userguide"));
  }, [dispatch]);

  const goToBackgrounds = useCallback(() => {
    dispatch(setCurrentScreen("backgrounds"));
  }, [dispatch]);

  // Search operations
  const updateSearchQuery = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  const clearSearchQuery = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  // View operations
  const changeViewMode = useCallback(
    (mode: ViewMode) => {
      dispatch(setViewMode(mode));
    },
    [dispatch]
  );

  const changeActiveTab = useCallback(
    (tab: ActiveTab) => {
      dispatch(setActiveTab(tab));
    },
    [dispatch]
  );

  // Repository operations
  const changeDirectory = useCallback(async () => {
    const path = await window.api.selectDirectory();
    if (typeof path === "string") {
      dispatch(setSongRepo(path));
    }
  }, [dispatch]);

  // Favorite operations
  const toggleSongFavorite = useCallback(
    (song: Song) => {
      dispatch(toggleFavorite(song));
    },
    [dispatch]
  );

  const isFavorite = useCallback(
    (song: Song) => {
      return favorites.some((fav) => fav.id === song.id);
    },
    [favorites]
  );

  // Loading operations
  const loadSongs = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const songsData = (await window.api.fetchSongs(songRepo)) as Song[];
      dispatch(setSongs(songsData));
    } catch (error) {
      // Extract meaningful information from error for better user experience
      let errorMessage = "Failed to load songs";

      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("fetch-songs")) {
          errorMessage = "Failed to fetch songs";
        } else if (
          message.includes("permission") ||
          message.includes("EACCES")
        ) {
          errorMessage = "Permission denied accessing song folder";
        } else if (
          message.includes("ENOENT") ||
          message.includes("not found")
        ) {
          errorMessage = "Song folder not found";
        } else if (
          message.includes("network") ||
          message.includes("connection")
        ) {
          errorMessage = "Network connection error";
        } else {
          errorMessage = message;
        }
      }

      dispatch(setError(errorMessage));
    }
  }, [dispatch, songRepo]);

  // Delete operations
  const showDeleteConfirmation = useCallback(() => {
    dispatch(setShowDeleteDialog(true));
  }, [dispatch]);

  const hideDeleteConfirmation = useCallback(() => {
    dispatch(setShowDeleteDialog(false));
  }, [dispatch]);

  const deleteSong = useCallback(
    async (filePath: string) => {
      try {
        dispatch(setDeleting(true));
        const response = await window.api.deleteSong(filePath);
        console.log("Delete song response:", response);
        dispatch(deleteSongFromState(selectedSong?.id || ""));
        dispatch(setDeleting(false));
        dispatch(setShowDeleteDialog(false));
        // Reload songs after deletion
        loadSongs();
      } catch (error) {
        console.error("Failed to delete song:", error);
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to delete song"
          )
        );
        dispatch(setDeleting(false));
      }
    },
    [dispatch, selectedSong, loadSongs]
  );

  const deleteSelectedSong = useCallback(() => {
    if (selectedSong?.path) {
      deleteSong(selectedSong.path);
    }
  }, [deleteSong, selectedSong]);

  // Remove song from recents
  const removeRecentSong = useCallback(
    (songId: string, date: string) => {
      dispatch(removeFromRecents({ songId, date }));
    },
    [dispatch]
  );

  return {
    // State
    songs,
    filteredSongs,
    selectedSong,
    favorites,
    searchQuery,
    viewMode,
    activeTab,
    songRepo,
    isLoading,
    error,
    isDeleting,
    showDeleteDialog,

    // Operations
    selectSong,
    deselectSong,
    presentSong,
    goToPresentation,
    presentSelectedSong,
    goToEdit,
    goToCreate,
    goToCategorize,
    goToUserGuide,
    goToBackgrounds,
    updateSearchQuery,
    clearSearchQuery,
    changeViewMode,
    changeActiveTab,
    changeDirectory,
    toggleSongFavorite,
    isFavorite,
    loadSongs,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    deleteSong,
    deleteSelectedSong,
    removeRecentSong,
  };
};
