import React, { useState, useEffect, useRef } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setSlides,
  setIsSaving,
  setSongTitle,
  updateSlide,
  addSlide,
} from "@/store/slices/songSlidesSlice";
import { parseLyrics, SongSlide } from "../utils/lyricsParser";
import { TitleInputDialog } from "../components/TitleInputDialog";
import { SlideEditor } from "../components/SlideEditor";
import { AddSlideDialog } from "../components/AddSlideDialog";
import {
  formatSlidesForSave,
  validateSongForSave,
} from "../utils/songFormatter";

interface PreviewPanelProps {
  isDarkMode: boolean;
  songRepo: string;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  showTitleDialog: boolean;
  onShowTitleDialog: (show: boolean) => void;
  isEditingSlide: boolean;
  onEditingSlideChange: (editing: boolean) => void;
  showAddSlideDialog: boolean;
  onShowAddSlideDialog: (show: boolean) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isDarkMode,
  songRepo,
  onSaveSuccess,
  onSaveError,
  showTitleDialog,
  onShowTitleDialog,
  isEditingSlide,
  onEditingSlideChange,
  showAddSlideDialog,
  onShowAddSlideDialog,
}) => {
  const dispatch = useAppDispatch();
  const { slides, currentSlideId, songTitle, isSaving } = useAppSelector(
    (state) => state.songSlides
  );
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Get current slide
  const currentSlide = slides.find((s) => s.id === currentSlideId) || null;

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
      onShowTitleDialog(false);
    } catch (error) {
      console.error("Error saving song:", error);
      onSaveError(
        "Failed to save song. Please check the directory and try again."
      );
    } finally {
      dispatch(setIsSaving(false));
    }
  };

  // Focus on click to enable paste
  const handleClick = () => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  };

  // Handle edit slide
  const handleEditSlide = (id: string, content: string) => {
    dispatch(updateSlide({ id, content }));
    onEditingSlideChange(false);
  };

  // Handle add slide
  const handleAddSlide = (
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
    onShowAddSlideDialog(false);
  };

  return (
    <div onClick={handleClick} className="h-full relative">
      <TitleInputDialog
        isOpen={showTitleDialog}
        initialTitle={songTitle}
        isDarkMode={isDarkMode}
        onClose={() => onShowTitleDialog(false)}
        onSave={handleSaveSong}
      />

      <GamyCard
        isDarkMode={isDarkMode}
        blackBackground={true}
        style={{
          border: "none",
          boxShadow: "none",
        }}
        className="h-full p-0 px-0 py-0 relative overflow-hidden cursor-text"
      >
        {/* Preview Area with Selected Background */}
        <div
          ref={contentRef}
          tabIndex={0}
          onPaste={handlePaste}
          className="w-full h-full flex items-center justify-center bg-cover bg-center bg-no-repeat p-8 focus:outline-none relative"
          style={{
            backgroundImage: selectedBgSrc ? `url(${selectedBgSrc})` : "none",
          }}
        >
          {/* Content based on state */}
          {/* Content based on state */}
          {isEditingSlide && currentSlide ? (
            <SlideEditor
              slide={currentSlide}
              isDarkMode={isDarkMode}
              backgroundImage={selectedBgSrc}
              onSave={handleEditSlide}
              onCancel={() => onEditingSlideChange(false)}
            />
          ) : showAddSlideDialog ? (
            <AddSlideDialog
              isDarkMode={isDarkMode}
              backgroundImage={selectedBgSrc}
              onAdd={handleAddSlide}
              onCancel={() => onShowAddSlideDialog(false)}
            />
          ) : currentSlide ? (
            <div className="text-white text-center max-w-4xl">
              <pre
                className="font-sans text-ew-lg leading-relaxed whitespace-pre-wrap text-shadow-lg"
                style={{
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                }}
              >
                {currentSlide.content}
              </pre>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-app-text-muted text-ew-sm mb-2">
                Click here and paste lyrics
              </p>
              <p className="text-app-text-muted text-ew-xs">
                Ctrl+V to paste song lyrics
              </p>
            </div>
          )}
        </div>
      </GamyCard>
    </div>
  );
};
