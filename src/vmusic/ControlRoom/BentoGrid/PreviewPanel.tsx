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

  // Get current display slide (for showing label and content)
  // currentDisplayIndex comes from Redux state
  const currentDisplaySlide =
    currentDisplayIndex >= 0 && currentDisplayIndex < displaySlides.length
      ? displaySlides[currentDisplayIndex]
      : null;

  // BUG 14 fix: split into two effects.
  // Effect 1 — initialization from localStorage, runs exactly once on mount.
  useEffect(() => {
    const savedBg = localStorage.getItem("bmusicpresentationbg");
    if (savedBg) {
      setSelectedBgSrc(savedBg);
      setPreviewBgSrc(savedBg);
    }
    const savedFont = localStorage.getItem("bmusicfontFamily");
    if (savedFont) setFontFamily(savedFont);
    const savedOpacity = localStorage.getItem("bmusicOverlayOpacity");
    if (savedOpacity) setOverlayOpacity(parseFloat(savedOpacity));
  }, []); // mount only

  // Effect 2 — event listeners, also registered once for the lifetime of the component.
  // Previously these were re-attached on every bg/font/opacity state change.
  useEffect(() => {
    const handlePreviewBackgroundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        src: string;
        isPreview: boolean;
        isCancel?: boolean;
      }>;
      if (customEvent.detail) {
        if (customEvent.detail.isCancel) {
          setPreviewBgSrc("");
        } else {
          setPreviewBgSrc(customEvent.detail.src);
        }
      }
    };

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
      window.removeEventListener(
        "preview-background-change",
        handlePreviewBackgroundChange,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // mount only — no deps means no unnecessary re-attachment

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
      // BUG 12 fix: send only the index for navigation — the projection window
      // already holds the full slides array from the initial display-song event.
      // Sending the whole array on every keypress was serializing hundreds of
      // characters through IPC on every arrow-key press.
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

    // BUG 16 fix: use the map index directly — previous code called
    // updatedSlides.indexOf(slide) inside the map, making this O(n²).
    const typeCounters: Record<string, number> = {};
    const renumberedSlides = updatedSlides.map((slide) => {
      typeCounters[slide.type] = (typeCounters[slide.type] || 0) + 1;
      const newNumber = typeCounters[slide.type];
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

  // Slide type → badge style map
  const slideTypeBadgeClass = (type: string) => {
    switch (type) {
      case "chorus":
        return "bg-blue-500/40 text-blue-100 border-blue-400/30";
      case "bridge":
        return "bg-purple-500/40 text-purple-100 border-purple-400/30";
      case "prechorus":
        return "bg-amber-500/40 text-amber-100 border-amber-400/30";
      default:
        return "bg-white/15 text-white/90 border-white/20";
    }
  };

  const showHUD =
    !isEditingSlide && !showAddSlideDialog && !showSettings && !showStatistics;

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

      <div className="h-full w-full relative rounded-xl overflow-hidden">
        {/* ── Background layer ── */}
        {selectedBgSrc ? (
          backgroundType === "video" ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={backgroundValue}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : backgroundType === "solid" ? (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: backgroundValue }}
            />
          ) : backgroundType === "gradient" ? (
            <div
              className="absolute inset-0"
              style={{ background: backgroundValue }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${backgroundValue})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-neutral-950" />
        )}

        {/* ── Darken overlay ── */}
        {selectedBgSrc && (
          <div
            className="absolute inset-0 bg-black transition-opacity duration-200"
            style={{ opacity: overlayOpacity }}
          />
        )}

        {/* ── Overlay panels (settings / statistics) ── */}
        {showStatistics && <StatisticsView isDarkMode={isDarkMode} />}
        {showSettings && (
          <SettingsView
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}

        {/* ── Top HUD: section badge + song title ── */}
        {showHUD && currentDisplaySlide && (
          <div className="absolute top-3 inset-x-3 flex items-start justify-between z-20 pointer-events-none gap-2">
            {/* Section badge */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-sm transition-colors ${slideTypeBadgeClass(
                currentDisplaySlide.type,
              )}`}
            >
              {currentDisplaySlide.label === "Chorus Repeat"
                ? "↻ Chorus"
                : currentDisplaySlide.label}
            </div>

            {/* Song title chip */}
            {songTitle && (
              <div className="px-2.5 py-1 rounded-lg bg-black/35 backdrop-blur-sm border border-white/10 text-[10px] text-white/55 font-medium truncate max-w-[50%]">
                {songTitle}
              </div>
            )}
          </div>
        )}

        {/* ── Main content area ── */}
        <div
          ref={contentRef}
          tabIndex={0}
          onPaste={handlePaste}
          className="relative w-full h-full focus:outline-none flex items-center justify-center z-10 cursor-text"
        >
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
            /* ── Lyrics display ── */
            <div className="text-white text-center w-full px-8 max-h-[78%] overflow-y-auto no-scrollbar">
              <pre
                className="font-sans text-2xl leading-relaxed whitespace-pre-wrap"
                style={{
                  textShadow: `
                    0 0 8px rgba(0,0,0,0.9),
                    0 0 16px rgba(0,0,0,0.7),
                    3px 3px 6px rgba(0,0,0,0.8),
                    -3px -3px 6px rgba(0,0,0,0.8),
                    5px 5px 12px rgba(0,0,0,0.6)
                  `,
                  fontFamily: fontFamily,
                }}
              >
                {currentSlide.content}
              </pre>
            </div>
          ) : (
            /* ── Empty / paste state ── */
            <div className="flex flex-col items-center justify-center text-center px-6 select-none">
              <div className="relative mb-5">
                <div
                  className="w-16 h-16 opacity-35"
                  style={{
                    WebkitMaskImage: "url(./paste_icon.svg)",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskImage: "url(./paste_icon.svg)",
                    maskRepeat: "no-repeat",
                    maskSize: "contain",
                    maskPosition: "center",
                    backgroundColor: "#ffffff",
                  }}
                />
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" />
              </div>
              <p className="text-white/80 font-semibold text-ew-sm mb-2 tracking-wide">
                Ready to paste lyrics
              </p>
              <p className="text-white/50 text-ew-xs mb-1">
                Click here then press{" "}
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[11px] font-mono text-white/70">
                  Ctrl+V
                </kbd>
              </p>
              <p className="text-white/35 text-ew-xs mt-2">
                Lyrics are automatically split into slides
              </p>
            </div>
          )}
        </div>

        {/* ── Bottom HUD: slide navigation dots / counter ── */}
        {showHUD && displaySlides.length > 0 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-20 pointer-events-none">
            {displaySlides.length <= 14 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-sm border border-white/10">
                {displaySlides.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-200 ${
                      i === currentDisplayIndex
                        ? s.type === "chorus"
                          ? "w-4 h-2 bg-blue-300"
                          : s.type === "bridge"
                            ? "w-4 h-2 bg-purple-300"
                            : "w-4 h-2 bg-white"
                        : "w-1.5 h-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 text-white/60 text-[11px] font-mono tabular-nums">
                {currentDisplayIndex + 1} / {displaySlides.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
