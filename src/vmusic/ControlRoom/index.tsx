import React, { useEffect, useState } from "react";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSlides,
  setSongTitle,
  setCurrentSongId,
  setCurrentSlide,
} from "@/store/slices/songSlidesSlice";
import { updateSong } from "@/store/slices/songSlice";
import { parseLyrics } from "./utils/lyricsParser";
import { encodeSongData, validateSongForSave } from "./utils/songFileFormat";
import { Song } from "@/types";
import TitleBar from "../../shared/TitleBar";
import DeletePopup from "./components/DeletePopup";
import { useProjectionState } from "@/hooks/useProjectionState";
import { GamyCard } from "../shared/GamyCard";
import { ActionBar } from "./ActionBar";
import { ContentArea } from "./ContentArea";
import { TitleInputDialog } from "./components/TitleInputDialog";
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
  const { slides, songTitle } = useAppSelector((state) => state.songSlides);
  const [deleteSlideRequested, setDeleteSlideRequested] = useState(false);
  const [showPrelistTitleDialog, setShowPrelistTitleDialog] = useState(false);

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

  const handleAddToPrelist = async () => {
    if (slides.length === 0) {
      addToast("No slides to add to prelist. Paste lyrics first.", "warning");
      return;
    }

    // No need to check songRepo - we auto-use app data directory
    setShowPrelistTitleDialog(true);
  };

  const saveToPrelist = async (title: string, language: string) => {
    const validation = validateSongForSave(title, slides);
    if (!validation.valid) {
      addToast(validation.error || "Invalid song data", "error");
      return;
    }

    try {
      const encodedContent = encodeSongData(
        title,
        slides,
        true,
        undefined,
        language
      );
      const result = await window.api.saveSong("", title, encodedContent);

      const newSong: Song = {
        id: Date.now().toString(),
        title: result.sanitizedTitle || title,
        path: result.filePath || "",
        content: encodedContent,
        categories: [],
        dateModified: new Date().toISOString(),
        size: encodedContent.length,
        isPrelisted: true,
        language: language,
      };

      dispatch(updateSong(newSong));
      addToast(`"${title}" added to prelist! 🎵`, "success");
      setShowPrelistTitleDialog(false);
      loadSongs();
    } catch (error) {
      console.error("Error adding to prelist:", error);
      addToast("Failed to add to prelist. Please try again.", "error");
    }
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

      if (e.key === "Enter" && selectedSong) {
        presentSong(selectedSong);
      } else if (e.key === "Delete" && selectedSong) {
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
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex-1 pt-8 flex flex-col bg-app-bg">
        <GamyCard
          isDarkMode={isDarkMode}
          transparent={true}
          className="flex-1 py-0 bg-app-bg"
          style={{
            border: "none",
            borderRadius: 0,
          }}
        >
          <ActionBar
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
          />
        </GamyCard>
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

      {/* Prelist Title Dialog */}
      <TitleInputDialog
        isOpen={showPrelistTitleDialog}
        initialTitle={songTitle || ""}
        isDarkMode={isDarkMode}
        onClose={() => setShowPrelistTitleDialog(false)}
        onSave={saveToPrelist}
      />

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
