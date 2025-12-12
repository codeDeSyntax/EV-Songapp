import React, { useState, useEffect, useRef } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setSlides,
  setIsSaving,
  setSongTitle,
  updateSlide,
  addSlide,
  removeSlide,
  setCurrentSlide,
} from "@/store/slices/songSlidesSlice";
import {
  setIsEditingSlide,
  setShowAddSlideDialog,
  setShowTitleDialog,
} from "@/store/slices/uiSlice";
import { parseLyrics, SongSlide } from "../utils/lyricsParser";
import { TitleInputDialog } from "../components/TitleInputDialog";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { SlideEditor } from "../components/SlideEditor";
import { AddSlideDialog } from "../components/AddSlideDialog";
import {
  formatSlidesForSave,
  validateSongForSave,
} from "../utils/songFormatter";
import { useProjectionState } from "@/features/songs/hooks/useProjectionState";

interface PreviewPanelProps {
  isDarkMode: boolean;
  songRepo: string;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  loadSongs: () => void;
  onRequestDelete: () => void;
  deleteSlideRequested: boolean;
  onDeleteSlideComplete: () => void;
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isDarkMode,
  songRepo,
  onSaveSuccess,
  onSaveError,
  loadSongs,
  onRequestDelete,
  deleteSlideRequested,
  onDeleteSlideComplete,
  addToast,
}) => {
  const dispatch = useAppDispatch();
  const { slides, currentSlideId, songTitle, isSaving } = useAppSelector(
    (state) => state.songSlides
  );
  const { showSettings, isEditingSlide, showAddSlideDialog, showTitleDialog } =
    useAppSelector((state) => state.ui);
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);
  const { isProjectionActive } = useProjectionState();

  // Get current slide
  const currentSlide = slides.find((s) => s.id === currentSlideId) || null;
  const currentIndex = slides.findIndex((s) => s.id === currentSlideId);

  // Load saved background on mount
  useEffect(() => {
    const savedBg = localStorage.getItem("bmusicpresentationbg");
    if (savedBg) {
      setSelectedBgSrc(savedBg);
    }
  }, []);

  // Listen for background changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg" && e.newValue) {
        setSelectedBgSrc(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Sync current slide to projection window
  useEffect(() => {
    if (isProjectionActive && currentSlide && slides.length > 0) {
      const slideData = {
        type: "SLIDE_UPDATE",
        slide: {
          content: currentSlide.content,
          type: currentSlide.type,
          number: currentSlide.number,
        },
        songTitle: songTitle,
        currentIndex: currentIndex,
        totalSlides: slides.length,
        backgroundColor: selectedBgSrc || "#000000",
      };

      window.api.sendToSongProjection(slideData).catch((error) => {
        console.error("Failed to send slide to projection:", error);
      });
    }
  }, [isProjectionActive, currentSlideId, slides, songTitle, selectedBgSrc]);

  // Keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea and not editing
      if (
        document.activeElement?.tagName.toLowerCase() === "input" ||
        document.activeElement?.tagName.toLowerCase() === "textarea" ||
        isEditingSlide
      ) {
        return;
      }

      if (slides.length === 0) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex + 1;
        if (nextIndex < slides.length) {
          dispatch(setCurrentSlide(slides[nextIndex].id));
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          dispatch(setCurrentSlide(slides[prevIndex].id));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides, currentIndex, isEditingSlide, dispatch]);

  // Handle delete slide request
  useEffect(() => {
    if (deleteSlideRequested) {
      handleDeleteSlide();
      onDeleteSlideComplete();
    }
  }, [deleteSlideRequested]);

  // Handle delete slide
  const handleDeleteSlide = async () => {
    if (!currentSlideId || !isEditingSlide) {
      return;
    }

    const slideToDelete = slides.find((s) => s.id === currentSlideId);
    if (!slideToDelete) {
      return;
    }

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Delete ${slideToDelete.label}?\n\nThis will permanently remove this slide from the song.`
    );

    if (!confirmDelete) {
      return;
    }

    // Remove from Redux
    dispatch(removeSlide(currentSlideId));
    dispatch(setIsEditingSlide(false));

    // Auto-save to file if we have a title and repo
    if (songTitle && songRepo) {
      try {
        const updatedSlides = slides.filter((s) => s.id !== currentSlideId);

        // If no slides left, show warning
        if (updatedSlides.length === 0) {
          onSaveError(
            "Cannot save song with no slides. Please add at least one slide or delete the song."
          );
          return;
        }

        const formattedContent = formatSlidesForSave(updatedSlides);
        await window.api.saveSong(songRepo, songTitle, formattedContent);
        onSaveSuccess(
          `${slideToDelete.label} deleted and saved to "${songTitle}".txt`
        );
        // Reload songs to refresh the list
        loadSongs();
      } catch (error) {
        console.error("Error saving after delete:", error);
        onSaveError("Failed to save changes after deletion");
      }
    }
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent) => {
    // Disable paste parsing when in edit or add mode
    if (isEditingSlide || showAddSlideDialog) {
      return; // Allow normal paste behavior
    }

    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (text && text.trim()) {
      const parsed = parseLyrics(text);
      dispatch(setSlides(parsed.slides));
    }
  };

  // Handle save song
  const handleSaveSong = async (title: string) => {
    const validation = validateSongForSave(title, slides);
    if (!validation.valid) {
      onSaveError(validation.error || "Invalid song data");
      return;
    }

    try {
      dispatch(setIsSaving(true));
      dispatch(setSongTitle(title));
      const formattedContent = formatSlidesForSave(slides);
      const result = await window.api.saveSong(
        songRepo,
        title,
        formattedContent
      );

      onSaveSuccess(
        `Song "${title}" saved successfully! 🎵\n${slides.length} slide${
          slides.length !== 1 ? "s" : ""
        } saved to ${songRepo}`
      );
      dispatch(setShowTitleDialog(false));
      // Reload songs to refresh the list
      loadSongs();
    } catch (error) {
      console.error("Error saving song:", error);
      onSaveError(
        "Failed to save song. Please check the directory and try again."
      );
    } finally {
      dispatch(setIsSaving(false));
    }
  };

  // Focus on click to enable paste (only when not editing or adding)
  const handleClick = (e: React.MouseEvent) => {
    // Don't handle clicks when in edit or add mode
    if (isEditingSlide || showAddSlideDialog) {
      return;
    }
    if (contentRef.current) {
      contentRef.current.focus();
    }
  };

  // Handle edit slide
  const handleEditSlide = async (id: string, content: string) => {
    dispatch(updateSlide({ id, content }));
    dispatch(setIsEditingSlide(false));

    // Auto-save to file if we have a title and repo
    if (songTitle && songRepo) {
      try {
        const formattedContent = formatSlidesForSave(
          slides.map((s) => (s.id === id ? { ...s, content } : s))
        );
        await window.api.saveSong(songRepo, songTitle, formattedContent);
        onSaveSuccess(`Slide updated and saved to "${songTitle}".txt`);
        // Reload songs to refresh the list
        loadSongs();
      } catch (error) {
        console.error("Error saving after edit:", error);
        onSaveError("Failed to save changes to file");
      }
    }
  };

  // Handle add slide
  const handleAddSlide = async (
    content: string,
    type:
      | "verse"
      | "chorus"
      | "bridge"
      | "prechorus"
      | "tag"
      | "ending"
      | "intro"
  ) => {
    const currentIndex = slides.findIndex((s) => s.id === currentSlideId);
    const slideNumber = currentIndex + 2; // Next slide number

    const newSlide: SongSlide = {
      id: `slide-${Date.now()}`,
      type,
      number: slideNumber,
      content,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${slideNumber}`,
    };

    dispatch(addSlide(newSlide));
    dispatch(setShowAddSlideDialog(false));

    // Auto-save to file if we have a title and repo
    if (songTitle && songRepo) {
      try {
        const updatedSlides = [...slides, newSlide];
        const formattedContent = formatSlidesForSave(updatedSlides);
        await window.api.saveSong(songRepo, songTitle, formattedContent);
        onSaveSuccess(
          `New ${type} slide added and saved to \"${songTitle}\".txt`
        );
        // Reload songs to refresh the list
        loadSongs();
      } catch (error) {
        console.error("Error saving after add:", error);
        onSaveError("Failed to save new slide to file");
      }
    }
  };

  return (
    <div onClick={handleClick} className="h-full relative">
      <TitleInputDialog
        isOpen={showTitleDialog}
        initialTitle={songTitle}
        isDarkMode={isDarkMode}
        onClose={() => dispatch(setShowTitleDialog(false))}
        onSave={handleSaveSong}
      />

      <DeleteConfirmModal addToast={addToast} loadSongs={loadSongs} />

      <div
        className="h-full w-full relative rounded-xl overflow-hidden"
        style={{
          background: selectedBgSrc
            ? `url(${selectedBgSrc}) center/cover no-repeat`
            : "#000000",
        }}
      >
        {/* Settings View Overlay */}
        {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
            <div className="p-6">
              <h2 className="text-white text-2xl font-bold mb-6">Settings</h2>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Display Settings
                  </h3>
                  <p className="text-white/70 text-sm">
                    Configure display preferences
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Text Settings
                  </h3>
                  <p className="text-white/70 text-sm">
                    Configure text formatting options
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Background Settings
                  </h3>
                  <p className="text-white/70 text-sm">
                    Manage background preferences
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Area with Selected Background */}
        <div
          ref={contentRef}
          tabIndex={0}
          onPaste={handlePaste}
          className="w-full h-full focus:outline-none flex items-center justify-center overflow-y-auto no-scrollbar cursor-text"
        >
          {/* Content based on state */}
          {isEditingSlide && currentSlide ? (
            <SlideEditor
              slide={currentSlide}
              isDarkMode={isDarkMode}
              backgroundImage={selectedBgSrc}
              onSave={handleEditSlide}
              onCancel={() => dispatch(setIsEditingSlide(false))}
            />
          ) : showAddSlideDialog ? (
            <AddSlideDialog
              isDarkMode={isDarkMode}
              backgroundImage={selectedBgSrc}
              onAdd={handleAddSlide}
              onCancel={() => dispatch(setShowAddSlideDialog(false))}
            />
          ) : currentSlide ? (
            <div className="text-app-accent dark:text-white text-center max-w-6xl w-full max-h-full px-4">
              <pre
                className="font-sans text-2xl leading-relaxed whitespace-pre-wrap text-shadow-lg"
                style={{
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                  fontFamily: "Arial Black",
                }}
              >
                {currentSlide.content}
              </pre>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div
                  className="w-20 h-20 opacity-40 text-app-text"
                  style={{
                    WebkitMaskImage: "url(./paste_icon.svg)",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskImage: "url(./paste_icon.svg)",
                    maskRepeat: "no-repeat",
                    maskSize: "contain",
                    maskPosition: "center",
                    backgroundColor: isDarkMode ? "#e5e7eb" : "#1f2937",
                  }}
                />
                <div className="absolute inset-0 bg-app-accent/20 rounded-full blur-xl animate-pulse" />
              </div>
              <p className="text-app-text font-semibold text-ew-base mb-2">
                Ready to paste lyrics
              </p>
              <p className="text-app-text-muted text-ew-sm mb-1">
                Click here and press{" "}
                <kbd className="px-2 py-1 bg-app-surface border border-app-border rounded text-ew-xs font-mono">
                  Ctrl+V
                </kbd>
              </p>
              <p className="text-app-text-muted text-ew-xs mt-3">
                Your song will be automatically organized into slides
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
