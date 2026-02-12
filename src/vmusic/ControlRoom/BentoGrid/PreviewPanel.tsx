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
  setCurrentDisplayIndex,
  selectDisplaySlides,
} from "@/store/slices/songSlidesSlice";
import {
  setIsEditingSlide,
  setShowAddSlideDialog,
  setShowTitleDialog,
  setShowPrelistTitleDialog,
} from "@/store/slices/uiSlice";
import { parseLyrics, SongSlide } from "../utils/lyricsParser";
import { TitleInputDialog } from "../components/TitleInputDialog";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { SlideEditor } from "../components/SlideEditor";
import { AddSlideDialog } from "../components/AddSlideDialog";
import { SettingsView } from "../components/SettingsView";
import { encodeSongData, validateSongForSave } from "../utils/songFileFormat";
import { useProjectionState } from "@/features/songs/hooks/useProjectionState";
import { Song } from "@/types";
import { updateSong } from "@/store/slices/songSlice";
import { addProjectionEntry } from "@/store/slices/projectionHistorySlice";
import { recordProjection } from "@/store/slices/statisticsSlice";
import { StatisticsView } from "../components/StatisticsView";

interface PreviewPanelProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
  songRepo: string;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  loadSongs: () => void;
  onRequestDelete: () => void;
  deleteSlideRequested: boolean;
  onDeleteSlideComplete: () => void;
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isDarkMode,
  toggleDarkMode,
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
  const {
    slides,
    currentSlideId,
    songTitle,
    isSaving,
    currentSongId,
    currentDisplayIndex,
  } = useAppSelector((state) => state.songSlides);
  const displaySlides = useAppSelector(selectDisplaySlides); // Display slides with chorus repetition
  const songs = useAppSelector((state) => state.songs.songs);
  const {
    showSettings,
    showStatistics,
    isEditingSlide,
    showAddSlideDialog,
    showTitleDialog,
    showPrelistTitleDialog,
  } = useAppSelector((state) => state.ui);
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");
  const [previewBgSrc, setPreviewBgSrc] = useState<string>("");
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem("bmusicfontFamily") || "Arial Black";
  });
  const [overlayOpacity, setOverlayOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("bmusicOverlayOpacity");
    return saved ? parseFloat(saved) : 0.3;
  });
  // Prefill language with current song's language if available
  const currentSong = currentSongId
    ? songs.find((s) => s.id === currentSongId)
    : null;
  const [language, setLanguage] = useState<string>(
    currentSong?.language || "English",
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const { isProjectionActive } = useProjectionState();

  // Track if we're loading a new song to prevent auto-projection
  const isLoadingSongRef = useRef(false);
  const previousSongTitleRef = useRef(songTitle);

  // Detect background type (use previewBgSrc for display)
  const backgroundType = React.useMemo(() => {
    const bgSrc = previewBgSrc || selectedBgSrc;
    if (bgSrc.startsWith("solid:")) {
      return "solid";
    }
    if (bgSrc.startsWith("gradient:")) {
      return "gradient";
    }
    if (
      bgSrc.endsWith(".mp4") ||
      bgSrc.endsWith(".webm") ||
      bgSrc.endsWith(".mov")
    ) {
      return "video";
    }
    return "image";
  }, [previewBgSrc, selectedBgSrc]);

  // Extract background value (use previewBgSrc for display)
  const backgroundValue = React.useMemo(() => {
    const bgSrc = previewBgSrc || selectedBgSrc;
    if (backgroundType === "solid") {
      return bgSrc.replace("solid:", "");
    }
    if (backgroundType === "gradient") {
      return bgSrc.replace("gradient:", "");
    }
    return bgSrc;
  }, [previewBgSrc, selectedBgSrc, backgroundType]);

  // Check if background is a video (legacy support)
  const isVideoBg = React.useMemo(() => {
    return backgroundType === "video";
  }, [backgroundType]);

  // Get current slide from original slides (for editing)
  const currentSlide = slides.find((s) => s.id === currentSlideId) || null;
  const currentIndex = slides.findIndex((s) => s.id === currentSlideId);

  // Log displaySlides for debugging
  React.useEffect(() => {
    console.log(
      "DisplaySlides array:",
      displaySlides.map(
        (s, i) => `${i}: ${s.type} ${s.number || ""} - ${s.label}`,
      ),
    );
  }, [displaySlides]);

  // Get current display slide (for showing label and content)
  // currentDisplayIndex comes from Redux state
  const currentDisplaySlide =
    currentDisplayIndex >= 0 && currentDisplayIndex < displaySlides.length
      ? displaySlides[currentDisplayIndex]
      : null;

  // Load saved background and font on mount and poll for changes
  useEffect(() => {
    const updateSettings = () => {
      const savedBg = localStorage.getItem("bmusicpresentationbg");
      if (savedBg && savedBg !== selectedBgSrc) {
        setSelectedBgSrc(savedBg);
        // Only update preview if no preview is active
        if (!previewBgSrc || previewBgSrc === selectedBgSrc) {
          setPreviewBgSrc(savedBg);
        }
      }

      const savedFont = localStorage.getItem("bmusicfontFamily");
      if (savedFont && savedFont !== fontFamily) {
        setFontFamily(savedFont);
      }

      const savedOpacity = localStorage.getItem("bmusicOverlayOpacity");
      if (savedOpacity) {
        const opacity = parseFloat(savedOpacity);
        if (opacity !== overlayOpacity) {
          setOverlayOpacity(opacity);
        }
      }
    };

    // Initial load
    updateSettings();

    // Poll for changes every 100ms to catch immediate updates
    const interval = setInterval(updateSettings, 100);

    // Listen for preview background changes (before confirmation)
    const handlePreviewBackgroundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        src: string;
        isPreview: boolean;
        isCancel?: boolean;
      }>;
      if (customEvent.detail) {
        if (customEvent.detail.isCancel) {
          // On cancel, revert to the selected background
          setPreviewBgSrc("");
        } else {
          // Set preview background (doesn't affect localStorage)
          setPreviewBgSrc(customEvent.detail.src);
        }
      }
    };

    // Also listen for storage events (after confirmation/apply)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg" && e.newValue) {
        setSelectedBgSrc(e.newValue);
        setPreviewBgSrc(e.newValue);
      }
      if (e.key === "bmusicfontFamily" && e.newValue) {
        setFontFamily(e.newValue);
      }
      if (e.key === "bmusicOverlayOpacity" && e.newValue) {
        setOverlayOpacity(parseFloat(e.newValue));
      }
    };

    window.addEventListener(
      "preview-background-change",
      handlePreviewBackgroundChange,
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "preview-background-change",
        handlePreviewBackgroundChange,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [selectedBgSrc, previewBgSrc, fontFamily, overlayOpacity]); // NOTE: Slide sync removed - navigation is handled by SongProjectionControls commands
  // The PreviewPanel used to sync on every slide change, causing duplicate navigation
  // Now only SongLibraryPanel sends slide updates when clicking slides directly

  // Track song title changes to prevent auto-projection when loading a new song
  useEffect(() => {
    if (previousSongTitleRef.current !== songTitle) {
      isLoadingSongRef.current = true;
      previousSongTitleRef.current = songTitle;

      // Clear the flag after a short delay to allow the song to fully load
      const timer = setTimeout(() => {
        isLoadingSongRef.current = false;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [songTitle]);

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

      if (displaySlides.length === 0) return;

      // Handle Space bar for projection
      if (e.key === " ") {
        e.preventDefault();
        handleProjectCurrentSong();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = currentDisplayIndex + 1;
        if (nextIndex < displaySlides.length) {
          dispatch(setCurrentDisplayIndex(nextIndex));
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = currentDisplayIndex - 1;
        if (prevIndex >= 0) {
          dispatch(setCurrentDisplayIndex(prevIndex));
        }
      } else if (e.key.toLowerCase() === "c") {
        // Jump to first chorus
        e.preventDefault();
        const chorusIndex = displaySlides.findIndex(
          (slide) => slide.type.toLowerCase() === "chorus",
        );
        if (chorusIndex !== -1) {
          dispatch(setCurrentDisplayIndex(chorusIndex));
        }
      } else if (/^[1-9]$/.test(e.key)) {
        // Jump to specific verse (1-9)
        e.preventDefault();
        const verseNum = parseInt(e.key, 10);
        const verseIndex = displaySlides.findIndex(
          (slide) =>
            slide.type.toLowerCase() === "verse" && slide.number === verseNum,
        );
        if (verseIndex !== -1) {
          dispatch(setCurrentDisplayIndex(verseIndex));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    displaySlides,
    currentDisplayIndex,
    isEditingSlide,
    dispatch,
    songTitle,
    addToast,
  ]);

  // Send updates to projection window when display index changes
  // BUT ONLY if we're actively projecting (not just loading a song)
  useEffect(() => {
    if (!isProjectionActive || !currentDisplaySlide) return;

    // Don't auto-project when song title changes (user is loading a new song)
    // Only send updates when navigating within the same song
    if (!songTitle) return;

    // Prevent auto-projection during song loading
    if (isLoadingSongRef.current) {
      return;
    }

    const sendProjectionUpdate = async () => {
      const slideData = {
        type: "SLIDE_UPDATE",
        slide: {
          content: currentDisplaySlide.content,
          type: currentDisplaySlide.type,
          number: currentDisplaySlide.number,
        },
        songTitle: songTitle || "Untitled Song",
        currentIndex: currentDisplayIndex,
        totalSlides: displaySlides.length,
        backgroundColor: "#000000",
        slides: displaySlides.map((slide) => ({
          content: slide.content,
          type: slide.type,
          number: slide.number,
        })),
      };

      await window.api.sendToSongProjection(slideData);
    };

    sendProjectionUpdate();
  }, [
    currentDisplayIndex,
    isProjectionActive,
    currentDisplaySlide,
    displaySlides,
    // Removed songTitle from dependencies to prevent auto-projection on song change
  ]);

  // Handle projection of current song
  const handleProjectCurrentSong = async () => {
    if (!songTitle || displaySlides.length === 0) {
      addToast("No song to project", "warning");
      return;
    }

    try {
      const songData = {
        title: songTitle,
        content: displaySlides.map((s) => s.content).join("\n\n"),
        slides: displaySlides.map((s) => ({
          content: s.content,
          type: s.type,
          number: s.number,
        })),
        language: language || "English",
      };

      await window.api.projectSong(songData);

      // Add to projection history
      dispatch(
        addProjectionEntry({
          songId: currentSongId || `temp-${Date.now()}`,
          songTitle: songTitle,
        }),
      );

      // Persist statistics
      dispatch(
        recordProjection({
          songId: currentSongId || `temp-${Date.now()}`,
          songTitle: songTitle,
          projectedAt: Date.now(),
        }),
      );

      addToast(`Projecting: ${songTitle}`, "success");
    } catch (error) {
      console.error("Error projecting song:", error);
      addToast("Failed to project song", "error");
    }
  };

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
      `Delete ${slideToDelete.label}?\n\nThis will permanently remove this slide from the song.`,
    );

    if (!confirmDelete) {
      return;
    }

    // Remove from Redux
    dispatch(removeSlide(currentSlideId));
    dispatch(setIsEditingSlide(false));

    // Filter out the deleted slide
    const updatedSlides = slides.filter((s) => s.id !== currentSlideId);

    // If no slides left, show warning (for saved songs only)
    if (updatedSlides.length === 0 && songTitle) {
      onSaveError(
        "Cannot save song with no slides. Please add at least one slide or delete the song.",
      );
      return;
    }

    // Renumber slides by type (important for both saved and unsaved songs)
    const renumberedSlides = updatedSlides.map((slide) => {
      // Count how many slides of the same type come before this one
      const sameTypeBefore = updatedSlides
        .slice(0, updatedSlides.indexOf(slide))
        .filter((s) => s.type === slide.type).length;

      const newNumber = sameTypeBefore + 1;

      return {
        ...slide,
        number: newNumber,
        label: `${
          slide.type.charAt(0).toUpperCase() + slide.type.slice(1)
        } ${newNumber}`,
      };
    });

    // Update Redux state with renumbered slides
    dispatch(setSlides(renumberedSlides));

    // Auto-save to file if we have a title
    if (songTitle) {
      try {
        // Get current song to preserve isPrelisted status
        const currentSong = currentSongId
          ? songs.find((s) => s.id === currentSongId)
          : null;
        const isPrelisted = currentSong?.isPrelisted || false;

        const encodedContent = encodeSongData(
          songTitle,
          renumberedSlides,
          isPrelisted,
        );
        await window.api.saveSong("", songTitle, encodedContent);
        onSaveSuccess(
          `${slideToDelete.label} deleted and saved to "${songTitle}".evsong`,
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
  const handleSaveSong = async (title: string, lang: string) => {
    setLanguage(lang);
    const validation = validateSongForSave(title, slides);
    if (!validation.valid) {
      onSaveError(validation.error || "Invalid song data");
      return;
    }

    try {
      dispatch(setIsSaving(true));
      dispatch(setSongTitle(title));
      // Preserve isPrelisted from current song
      const currentSong = currentSongId
        ? songs.find((s) => s.id === currentSongId)
        : null;
      const isPrelisted = currentSong?.isPrelisted || false;
      const encodedContent = encodeSongData(
        title,
        slides,
        isPrelisted,
        undefined,
        lang,
      );
      const result = await window.api.saveSong("", title, encodedContent);

      onSaveSuccess(
        `Song "${title}" saved successfully! 🎵\n${slides.length} slide${
          slides.length !== 1 ? "s" : ""
        } saved`,
      );
      // Update Redux song list with new language so UI reflects change immediately
      if (currentSongId) {
        const updatedSong = {
          id: currentSongId,
          title: result.sanitizedTitle || title,
          path: result.filePath || "",
          content: encodedContent,
          categories: [],
          dateModified: new Date().toISOString(),
          size: encodedContent.length,
          isPrelisted,
          language: lang,
        };
        dispatch(updateSong(updatedSong));
        // Also update selectedSong in Redux so UI reflects new language
        dispatch({ type: "songs/setSelectedSong", payload: updatedSong });
      }
      dispatch(setShowTitleDialog(false));
      // Reload songs to refresh the list
      loadSongs();
    } catch (error) {
      console.error("Error saving song:", error);
      onSaveError(
        "Failed to save song. Please check the directory and try again.",
      );
    } finally {
      dispatch(setIsSaving(false));
    }
  };

  // Handle save to prelist
  const handleSaveToPrelist = async (title: string, lang: string) => {
    setLanguage(lang);
    const validation = validateSongForSave(title, slides);
    if (!validation.valid) {
      onSaveError(validation.error || "Invalid song data");
      return;
    }

    try {
      const encodedContent = encodeSongData(
        title,
        slides,
        true,
        undefined,
        lang,
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
        language: lang || "English",
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          isPrelisted: true,
          language: lang || "English",
        },
      };

      dispatch(updateSong(newSong));
      addToast(`"${title}" added to prelist! 🎵`, "success");
      dispatch(setShowPrelistTitleDialog(false));
      loadSongs();
    } catch (error) {
      console.error("Error adding to prelist:", error);
      addToast("Failed to add to prelist. Please try again.", "error");
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

    // Auto-save to file if we have a title
    if (songTitle) {
      try {
        const updatedSlides = slides.map((s) =>
          s.id === id ? { ...s, content } : s,
        );
        // Get current song to preserve isPrelisted status
        const currentSong = currentSongId
          ? songs.find((s) => s.id === currentSongId)
          : null;
        const isPrelisted = currentSong?.isPrelisted || false;

        const encodedContent = encodeSongData(
          songTitle,
          updatedSlides,
          isPrelisted,
        );
        await window.api.saveSong("", songTitle, encodedContent);
        onSaveSuccess(`Slide updated and saved to \"${songTitle}\".evsong`);
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
      | "intro",
  ) => {
    // Count how many slides of this type already exist
    const sameTypeCount = slides.filter((s) => s.type === type).length;
    const slideNumber = sameTypeCount + 1; // Next number for this type

    const newSlide: SongSlide = {
      id: `slide-${Date.now()}`,
      type,
      number: slideNumber,
      content,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${slideNumber}`,
    };

    dispatch(addSlide(newSlide));
    dispatch(setShowAddSlideDialog(false));

    // Auto-save to file if we have a title
    if (songTitle) {
      try {
        const updatedSlides = [...slides, newSlide];
        // Get current song to preserve isPrelisted status
        const currentSong = currentSongId
          ? songs.find((s) => s.id === currentSongId)
          : null;
        const isPrelisted = currentSong?.isPrelisted || false;

        const encodedContent = encodeSongData(
          songTitle,
          updatedSlides,
          isPrelisted,
        );
        await window.api.saveSong("", songTitle, encodedContent);
        onSaveSuccess(
          `New ${type} slide added and saved to \"${songTitle}\".evsong`,
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
    <div onClick={handleClick} className="h-full relative z-10">
      <TitleInputDialog
        isOpen={showTitleDialog}
        initialTitle={songTitle}
        initialLanguage={language}
        isDarkMode={isDarkMode}
        onClose={() => dispatch(setShowTitleDialog(false))}
        onSave={handleSaveSong}
      />

      <TitleInputDialog
        isOpen={showPrelistTitleDialog}
        initialTitle={songTitle}
        initialLanguage={currentSong?.language || language}
        isDarkMode={isDarkMode}
        onClose={() => dispatch(setShowPrelistTitleDialog(false))}
        onSave={handleSaveToPrelist}
      />

      <DeleteConfirmModal addToast={addToast} loadSongs={loadSongs} />

      <div className="h-full w-full relative rounded-xl overflow-y-auto">
        {/* Background - Solid, Gradient, Video or Image */}
        {selectedBgSrc &&
          (backgroundType === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
              src={backgroundValue}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : backgroundType === "solid" ? (
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: backgroundValue }}
            />
          ) : backgroundType === "gradient" ? (
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: backgroundValue }}
            />
          ) : (
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundImage: `url(${backgroundValue})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
          ))}
        {!selectedBgSrc && (
          <div className="absolute inset-0 bg-black rounded-xl" />
        )}

        {/* Dark overlay for text visibility */}
        {selectedBgSrc && (
          <div
            className="absolute inset-0 bg-black rounded-xl transition-opacity duration-200"
            style={{ opacity: overlayOpacity }}
          />
        )}

        {/* Statistics View Overlay */}
        {showStatistics && <StatisticsView isDarkMode={isDarkMode} />}

        {/* Settings View Overlay */}
        {showSettings && (
          <SettingsView
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}

        {/* Preview Area with Selected Background */}
        <div
          ref={contentRef}
          tabIndex={0}
          onPaste={handlePaste}
          className="relative w-full h-full focus:outline-none flex items-center justify-center overflow-y-auto no-scrollbar cursor-text z-10"
        >
          {/* Content based on state */}
          {isEditingSlide && currentSlide ? (
            <SlideEditor
              slide={currentSlide}
              isDarkMode={isDarkMode}
              onSave={handleEditSlide}
              onCancel={() => dispatch(setIsEditingSlide(false))}
            />
          ) : showAddSlideDialog ? (
            <AddSlideDialog
              isDarkMode={isDarkMode}
              onAdd={handleAddSlide}
              onCancel={() => dispatch(setShowAddSlideDialog(false))}
            />
          ) : currentSlide ? (
            <div className="text-white text-center max-w-6xl w-full overflow-y-scroll h-[95%] max-h-[54vh] px-4 no-scrollbar">
              {/* Show label if it's a Chorus Repeat */}
              {currentDisplaySlide?.label === "Chorus Repeat" && (
                <div className=" text-lg font-bold opacity-80 font-mono bg-black/20 py-1 px-4 rounded-lg inline-block">
                  [{currentDisplaySlide.label}]
                </div>
              )}
              <pre
                className="font-sans text-2xl leading-relaxed whitespace-pre-wrap text-shadow-lg"
                style={{
                  textShadow: `
                  0 0 8px rgba(0, 0, 0, 0.9),
                  0 0 12px rgba(0, 0, 0, 0.8),
                  0 0 16px rgba(0, 0, 0, 0.7),
                  3px 3px 6px rgba(0, 0, 0, 0.8),
                  -3px -3px 6px rgba(0, 0, 0, 0.8),
                  3px -3px 6px rgba(0, 0, 0, 0.8),
                  -3px 3px 6px rgba(0, 0, 0, 0.8),
                  5px 5px 10px rgba(0, 0, 0, 0.6),
                  -5px -5px 10px rgba(0, 0, 0, 0.6)
                `,
                  fontFamily: fontFamily,
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
                    backgroundColor: isDarkMode ? "#e5e7eb" : "#ebeef2",
                  }}
                />
                <div className="absolute inset-0 bg-app-accent/20 rounded-full blur-xl animate-pulse" />
              </div>
              <p className="text-white font-mono font-semibold text-ew-base mb-2">
                Ready to paste lyrics
              </p>
              <p className="text-white font-mono text-ew-sm mb-1">
                Click here and press{" "}
                <kbd className="px-2 py-1 bg-app-surface border border-app-border rounded text-sm font-mono">
                  Ctrl+V
                </kbd>
              </p>
              <p className="text-white font-mono text-ew-xs mt-3">
                Your song will be automatically organized into slides
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
