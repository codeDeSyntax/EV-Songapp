import React, { useEffect, useState, useMemo } from "react";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import { Song } from "@/types";
import TitleBar from "../shared/TitleBar";
import DeletePopup from "./DeletePopup";
import SongProjectionControls from "./components/SongProjectionControls";
import { useProjectionState } from "@/hooks/useProjectionState";
import { GamyCard } from "./shared/GamyCard";
import { ActionBar } from "./ControlRoom/ActionBar";
import { ContentArea } from "./ControlRoom/ContentArea";
import { useTheme } from "@/Provider/Theme";
import { useToast } from "./ControlRoom/hooks/useToast";
import { Toaster } from "./shared/Notification";

const ControlRoomLayout = () => {
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
    goToEdit,
    goToCreate,
    deleteSelectedSong,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    changeDirectory,
  } = useSongOperations();

  const dispatch = useAppDispatch();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isActive: isProjectionActive } = useProjectionState();
  const { toasts, addToast, dismissToast } = useToast();
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [showAddSlideDialog, setShowAddSlideDialog] = useState(false);

  // Save handlers
  const handleSaveSuccess = (message: string) => {
    addToast(message, "success");
  };

  const handleSaveError = (error: string) => {
    addToast(error, "error");
  };

  const handleRequestSave = () => {
    setShowTitleDialog(true);
  };

  const handleRequestEdit = () => {
    setIsEditingSlide(true);
  };

  const handleRequestAdd = () => {
    setShowAddSlideDialog(true);
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
      } else if (e.key === "e" && (e.ctrlKey || e.metaKey) && selectedSong) {
        e.preventDefault();
        goToEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedSong,
    presentSong,
    showDeleteConfirmation,
    deselectSong,
    goToEdit,
  ]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-app-bg">
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex-1  pt-8 flex flex-col bg-app-bg">
        <GamyCard
          isDarkMode={isDarkMode}
          transparent={true}
          className="flex-1 py-0  bg-app-bg "
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
            goToCreate={goToCreate}
            goToEdit={goToEdit}
            showDeleteConfirmation={showDeleteConfirmation}
            loadSongs={loadSongs}
            changeDirectory={changeDirectory}
            updateSearchQuery={updateSearchQuery}
            presentSong={presentSong}
            addToast={addToast}
            onRequestSave={handleRequestSave}
            onRequestEdit={handleRequestEdit}
            onRequestAdd={handleRequestAdd}
          />
          <ContentArea
            filteredSongsCount={filteredSongs.length}
            isDarkMode={isDarkMode}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
            showTitleDialog={showTitleDialog}
            onShowTitleDialog={setShowTitleDialog}
            isEditingSlide={isEditingSlide}
            onEditingSlideChange={setIsEditingSlide}
            showAddSlideDialog={showAddSlideDialog}
            onShowAddSlideDialog={setShowAddSlideDialog}
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

      {/* Projection Controls */}
      <SongProjectionControls />

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

export default ControlRoomLayout;
