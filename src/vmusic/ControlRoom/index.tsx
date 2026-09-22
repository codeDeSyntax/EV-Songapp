import React, { useEffect, useState } from "react";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSlides,
  setSongTitle,
  setCurrentSongId,
  setCurrentSlide,
} from "@/store/slices/songSlidesSlice";
import { Song } from "@/types";
import TitleBar from "../../shared/TitleBar";
import DeletePopup from "./components/DeletePopup";
import { useProjectionState } from "@/hooks/useProjectionState";
import { ContentArea } from "./ContentArea";
import { useTheme } from "@/Provider/Theme";
import { useToast } from "./hooks/useToast";
import { Toaster } from "../shared/Notification";

const ControlRoom = () => {
  const {
    songs,
    filteredSongs,
    selectedSong,
    searchQuery,
    isLoading,
    error,
    isDeleting,
    showDeleteDialog,
    selectSong,
    deselectSong,
    loadSongs,
    updateSearchQuery,
    presentSong,
    presentSelectedSong,
    deleteSelectedSong,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    changeDirectory,
  } = useSongOperations();

  const dispatch = useAppDispatch();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isActive: isProjectionActive } = useProjectionState();
  const { toasts, addToast, dismissToast } = useToast();
  const songRepo = useAppSelector((state) => state.songs.songRepo);
  const { slides } = useAppSelector((state) => state.songSlides);
  const [deleteSlideRequested, setDeleteSlideRequested] = useState(false);

  // Save handlers
  const handleSaveSuccess = (message: string) => {
    addToast(message, "success");
  };

  const handleSaveError = (error: string) => {
    addToast(error, "error");
  };

  const handleRequestDelete = () => {
    setDeleteSlideRequested(true);
  };

  const handleSelectSongFromSearch = (song: Song) => {
    // Backend now provides decoded slides directly
    const slides = song.slides || [];
    dispatch(setSlides(slides));
    dispatch(setSongTitle(song.title));
    dispatch(setCurrentSongId(song.id));
    // Set current slide to first slide to ensure projection works
    if (slides.length > 0) {
      dispatch(setCurrentSlide(slides[0].id));
    }
    // Ensure selectedSong in Redux is updated (for TitleBar language display)
    dispatch({ type: "songs/setSelectedSong", payload: song });
    addToast(`Loaded "${song.title}" with ${slides.length} slides`, "success");
  };

  // Load songs on mount
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (isInputField) return;

      // Removed Enter key handler - use Spacebar in PreviewPanel to project
      if (e.key === "Delete" && selectedSong) {
        showDeleteConfirmation();
      } else if (e.key === "Escape") {
        deselectSong();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSong, presentSong, showDeleteConfirmation, deselectSong]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-app-bg">
      <TitleBar
        isDarkMode={isDarkMode}
        selectedSong={selectedSong}
        searchQuery={searchQuery}
        isProjectionActive={isProjectionActive}
        songs={songs}
        showDeleteConfirmation={showDeleteConfirmation}
        loadSongs={loadSongs}
        changeDirectory={changeDirectory}
        updateSearchQuery={updateSearchQuery}
        presentSong={presentSong}
        addToast={addToast}
        onRequestDelete={handleRequestDelete}
        onSelectSongFromSearch={handleSelectSongFromSearch}
      />

      {/* Main Content Area */}
      <div className="flex-1 pt-9 flex flex-col bg-app-bg overflow-hidden">
        <ContentArea
          filteredSongsCount={filteredSongs.length}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onSaveSuccess={handleSaveSuccess}
          onSaveError={handleSaveError}
          loadSongs={loadSongs}
          onRequestDelete={handleRequestDelete}
          deleteSlideRequested={deleteSlideRequested}
          onDeleteSlideComplete={() => setDeleteSlideRequested(false)}
          addToast={addToast}
          songs={songs}
          onSelectSongFromSearch={handleSelectSongFromSearch}
        />
      </div>

      {/* Delete Popup */}
      {showDeleteDialog && (
        <DeletePopup
          deleting={isDeleting}
          setDeleting={() => {}}
          refetch={loadSongs}
          showDeleting={showDeleteDialog}
          setShowDeleting={hideDeleteConfirmation}
          songPath={selectedSong?.path || ""}
          deleteSong={deleteSelectedSong}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        toasts={toasts}
        onDismiss={dismissToast}
        position="top-right"
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ControlRoom;
