import React, { useEffect, useState } from "react";
import {
  Focus,
  Monitor,
  MonitorStop,
  RefreshCcw,
  ScreenShare,
  ScreenShareOff,
  Wrench,
  FilePlus2,
  Save,
  BellPlus,
  Plus,
  Edit3,
  NotebookPen,
  Trash2,
  RefreshCw,
  Sheet,
  Printer,
  Radio,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { DepthSurface } from "@/shared/DepthButton";
import { addProjectionEntry } from "@/store/slices/projectionHistorySlice";
import {
  toggleSongEditor,
  toggleNewSongModal,
  setShowAddSlideDialog,
  setShowTitleDialog,
  setIsEditingSlide,
  openDeleteConfirmModal,
} from "@/store/slices/uiSlice";
import { updateSong } from "@/store/slices/songSlice";
import { encodeSongData, validateSongForSave } from "../utils/songFileFormat";
import { Song } from "@/types";

interface QuickActionsCardProps {
  isDarkMode: boolean;
  songs?: Song[];
  loadSongs?: () => void;
  onRequestDelete?: () => void;
  addToast?: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
}

interface QueueState {
  queueCount: number;
  doneCount: number;
  remainingCount: number;
}

const initialQueueState: QueueState = {
  queueCount: 0,
  doneCount: 0,
  remainingCount: 0,
};

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  isDarkMode: _isDarkMode,
  songs = [],
  loadSongs = () => {},
  onRequestDelete = () => {},
  addToast = () => {},
}) => {
  const dispatch = useAppDispatch();
  const {
    displaySlides,
    currentDisplayIndex,
    songTitle,
    currentSongId,
    currentSlideId,
    slides,
    isSaving,
  } = useAppSelector((state) => state.songSlides);
  const { isEditingSlide } = useAppSelector((state) => state.ui);

  const [queueState, setQueueState] = useState<QueueState>(initialQueueState);
  const [isProjectionActive, setIsProjectionActive] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [backgroundSrc, setBackgroundSrc] = useState(
    localStorage.getItem("bmusicpresentationbg") || "",
  );

  const currentSong = songs.find((s) => s.id === currentSongId);
  const prelistedSongs = songs.filter((s) => s.isPrelisted);

  useEffect(() => {
    const handleQueueState = (event: Event) => {
      const customEvent = event as CustomEvent<QueueState>;
      if (!customEvent.detail) return;
      setQueueState(customEvent.detail);
    };

    window.addEventListener("queueflow:state", handleQueueState as EventListener);
    window.dispatchEvent(
      new CustomEvent("queueflow:action", { detail: { type: "refresh" } }),
    );

    return () => {
      window.removeEventListener("queueflow:state", handleQueueState as EventListener);
    };
  }, []);

  useEffect(() => {
    const syncProjectionState = async () => {
      try {
        const active = await window.api.isProjectionActive();
        setIsProjectionActive(Boolean(active));
      } catch {
        setIsProjectionActive(false);
      }
    };

    syncProjectionState();
    const cleanup = window.api.onProjectionStateChanged((active) => {
      setIsProjectionActive(active);
    });

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "bmusicpresentationbg") {
        setBackgroundSrc(event.newValue || "");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      cleanup?.();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const applyBackground = (value: string) => {
    localStorage.setItem("bmusicpresentationbg", value);
    setBackgroundSrc(value);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: null,
        newValue: value,
        storageArea: localStorage,
      }),
    );

    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: value, isPreview: false },
      }),
    );
  };

  // Song operations
  const handleNewSong = () => {
    dispatch(toggleNewSongModal());
  };

  const handleSaveSong = () => {
    if (slides.length === 0) {
      addToast("No slides to save. Paste lyrics first.", "warning");
      return;
    }
    dispatch(setShowTitleDialog(true));
  };

  const handleSaveToPrelist = async () => {
    const title = songTitle || currentSong?.title || "";
    const language = currentSong?.language || "English";

    if (slides.length === 0) {
      addToast("No slides to add to prelist. Paste lyrics first.", "warning");
      return;
    }

    if (!title.trim()) {
      addToast("Select a song before adding it to prelist.", "warning");
      return;
    }

    const validation = validateSongForSave(title, slides);
    if (!validation.valid) {
      addToast(validation.error || "Invalid song data", "error");
      return;
    }

    try {
      const now = new Date().toISOString();
      const createdAt: string = currentSong?.metadata?.created ?? now;
      const encodedContent = encodeSongData(title, slides, true, undefined, language);
      const result = await window.api.saveSong("", title, encodedContent);

      if (currentSongId || currentSong?.id) {
        const updatedSong: Song = {
          id: currentSongId || currentSong!.id,
          title: result.sanitizedTitle || title,
          path: result.filePath || currentSong?.path || "",
          content: encodedContent,
          categories: currentSong?.categories || [],
          dateModified: new Date().toISOString(),
          size: encodedContent.length,
          isPrelisted: true,
          language,
          metadata: {
            created: createdAt,
            modified: now,
            isPrelisted: true,
            language,
          },
        };
        dispatch(updateSong(updatedSong));
        dispatch({ type: "songs/setSelectedSong", payload: updatedSong });
      }

      addToast(`"${title}" added to prelist! 🎵`, "success");
      loadSongs();
      window.dispatchEvent(new CustomEvent("queueflow:action", { detail: { type: "refresh" } }));
    } catch (error) {
      addToast("Failed to add to prelist. Please try again.", "error");
    }
  };

  const handleEditSlide = () => {
    dispatch(setIsEditingSlide(true));
  };

  const handleEditFullSong = () => {
    dispatch(toggleSongEditor());
  };

  const handleAddSlide = () => {
    dispatch(setShowAddSlideDialog(true));
  };

  const handleDelete = () => {
    if (isEditingSlide) {
      onRequestDelete();
    } else if (currentSong) {
      dispatch(openDeleteConfirmModal({ song: currentSong, type: "permanent" }));
    } else {
      addToast("No song selected to delete", "info");
    }
  };

  const handleRefreshSongs = () => {
    loadSongs();
    addToast("Song library refreshed", "success");
  };

  const handlePrintPrelist = async () => {
    try {
      const { generatePrelistPDF } = await import("@/utils/pdfGenerator");
      if (prelistedSongs.length === 0) {
        addToast("No songs currently in prelist", "info");
        return;
      }
      await generatePrelistPDF(prelistedSongs);
      addToast("Prelist PDF generated successfully!", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to generate prelist PDF", "error");
    }
  };

  const handlePrintAllSongs = async () => {
    try {
      const { generateSongsDatabasePDF } = await import("@/utils/pdfGenerator");
      if (songs.length === 0) {
        addToast("No songs found to export", "info");
        return;
      }
      await generateSongsDatabasePDF(songs);
      addToast("Songs database PDF generated successfully!", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to generate database PDF", "error");
    }
  };

  // Projection operations
  const handleProjectionToggle = async () => {
    try {
      if (isProjectionActive) {
        await window.api.closeProjectionWindow();
        setStatusText("Projection stopped");
        addToast("Projection stopped", "info");
        return;
      }

      if (displaySlides.length === 0) {
        setStatusText("No slides to project");
        addToast("No slides to project. Select a song first.", "warning");
        return;
      }

      const projectData = {
        title: songTitle || "Untitled Song",
        content: displaySlides.map((slide) => slide.content).join("\n\n"),
        slides: displaySlides.map((slide) => ({
          content: slide.content,
          type: slide.type,
          number: slide.number,
        })),
      };

      await window.api.projectSong(projectData);

      const currentSlide = displaySlides[currentDisplayIndex] || displaySlides[0];
      if (currentSlide) {
        await window.api.sendToSongProjection({
          type: "SLIDE_UPDATE",
          slide: {
            content: currentSlide.content,
            type: currentSlide.type,
            number: currentSlide.number,
          },
          songTitle: songTitle || "Untitled Song",
          currentIndex: currentDisplayIndex,
          totalSlides: displaySlides.length,
        });
      }

      dispatch(
        addProjectionEntry({
          songId: currentSongId || `temp-${Date.now()}`,
          songTitle: songTitle || "Untitled Song",
        }),
      );

      setStatusText("Projection started");
      addToast("Projection started", "success");
    } catch {
      setStatusText("Projection action failed");
      addToast("Failed to toggle projection", "error");
    }
  };

  const handleFocusProjection = async () => {
    try {
      const result = await window.api.focusProjectionWindow();
      setStatusText(result.success ? "Projection focused" : "Focus unavailable");
    } catch {
      setStatusText("Focus unavailable");
    }
  };

  const handleSyncCurrentSlide = async () => {
    const currentSlide = displaySlides[currentDisplayIndex];
    if (!currentSlide) {
      setStatusText("No slide to sync");
      return;
    }

    try {
      await window.api.sendToSongProjection({
        type: "SLIDE_UPDATE",
        slide: {
          content: currentSlide.content,
          type: currentSlide.type,
          number: currentSlide.number,
        },
        songTitle: songTitle || "Untitled Song",
        currentIndex: currentDisplayIndex,
        totalSlides: displaySlides.length,
      });
      setStatusText("Current slide synced");
      addToast("Current slide synced to display", "success");
    } catch {
      setStatusText("Slide sync failed");
      addToast("Failed to sync slide", "error");
    }
  };

  const handleBlackout = () => {
    const existing = localStorage.getItem("bmusicpresentationbg") || "";
    if (existing && existing !== "solid:#000000") {
      localStorage.setItem("ev-last-bg-before-blackout", existing);
    }
    applyBackground("solid:#000000");
    setStatusText("Blackout applied");
  };

  const handleRestoreBackground = () => {
    const previous = localStorage.getItem("ev-last-bg-before-blackout");
    if (!previous) {
      setStatusText("No previous background");
      addToast("No previous background to restore", "info");
      return;
    }
    applyBackground(previous);
    setStatusText("Background restored");
  };

  return (
    <div className="h-full rounded-lg bg-app-surface border border-app-border overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="px-3 py-2 border-b border-app-border flex items-center justify-between gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Wrench className="w-3.5 h-3.5 text-app-text-muted" />
          <h3 className="text-[11px] font-semibold text-app-text tracking-wide uppercase whitespace-nowrap">
            Quick Actions
          </h3>
        </div>
      </div>

      {/* Restored Quick Actions Artwork Image */}
      <div className="p-2 border-b border-app-border flex-shrink-0">
        <DepthSurface className="rounded-md p-1.5 flex items-center justify-center bg-black/5 dark:bg-black/30 border border-app-border">
          <img
            src="./quick.svg"
            alt="Quick actions"
            className="w-full h-auto max-h-20 object-contain"
          />
        </DepthSurface>
      </div>

      {/* Single Column Compact Action Rows */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-dashed divide-app-border/70 p-1">
        {/* 1. New Song */}
        <button
          type="button"
          onClick={handleNewSong}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <FilePlus2 className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              New Song
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Create a new song presentation
            </span>
          </div>
        </button>

        {/* 2. Save Song */}
        <button
          type="button"
          onClick={handleSaveSong}
          disabled={isSaving || slides.length === 0}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Save className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Save Song
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Save verse and styling changes
            </span>
          </div>
        </button>

        {/* 3. Add to Prelist */}
        <button
          type="button"
          onClick={handleSaveToPrelist}
          disabled={slides.length === 0}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <BellPlus className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Add to Prelist
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Push song to live service queue
            </span>
          </div>
          {prelistedSongs.length > 0 && (
            <div className="w-5 h-5 rounded-full border border-app-border flex items-center justify-center text-[10px] font-bold text-app-text-muted flex-shrink-0">
              {prelistedSongs.length}
            </div>
          )}
        </button>

        {/* 4. Edit Slide */}
        <button
          type="button"
          onClick={handleEditSlide}
          disabled={currentSlideId === null}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Edit3 className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Edit Slide
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              In-place slide lyrics editor
            </span>
          </div>
        </button>

        {/* 5. Full Song Editor */}
        <button
          type="button"
          onClick={handleEditFullSong}
          disabled={slides.length === 0}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <NotebookPen className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Full Song Editor
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Multi-slide editor and arrangements
            </span>
          </div>
        </button>

        {/* 6. Song Presentation (Projection Toggle) */}
        <button
          type="button"
          onClick={handleProjectionToggle}
          disabled={!isProjectionActive && slides.length === 0}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            {isProjectionActive ? (
              <MonitorStop className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
            ) : (
              <Monitor className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Song Presentation
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              {isProjectionActive ? "Active projector running" : "Open presentation projector"}
            </span>
          </div>
          {isProjectionActive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </button>

        {/* 7. Blackout Screen */}
        <button
          type="button"
          onClick={handleBlackout}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <ScreenShareOff className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Blackout Screen
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Immediate blackout on presentation screen
            </span>
          </div>
        </button>

        {/* 8. Restore Background */}
        <button
          type="button"
          onClick={handleRestoreBackground}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <ScreenShare className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Restore Background
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Restore previous stage background
            </span>
          </div>
        </button>

        {/* 9. Focus Projector */}
        <button
          type="button"
          onClick={handleFocusProjection}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Focus className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Focus Projector
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Bring projection window to front
            </span>
          </div>
        </button>

        {/* 10. Re-sync Slide */}
        <button
          type="button"
          onClick={handleSyncCurrentSlide}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <RefreshCcw className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Re-sync Slide
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Force sync staged slide to live display
            </span>
          </div>
        </button>

        {/* 11. Add New Slide */}
        <button
          type="button"
          onClick={handleAddSlide}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Plus className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Add New Slide
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Append a new verse or chorus slide
            </span>
          </div>
        </button>

        {/* 12. Prelist PDF */}
        <button
          type="button"
          onClick={handlePrintPrelist}
          disabled={prelistedSongs.length === 0}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Sheet className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Export Prelist PDF
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Print worship service setlist
            </span>
          </div>
        </button>

        {/* 13. Songs Database PDF */}
        <button
          type="button"
          onClick={handlePrintAllSongs}
          disabled={songs.length === 0}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Printer className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Export Songs PDF
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Print full catalog songbook
            </span>
          </div>
        </button>

        {/* 14. Refresh Library */}
        <button
          type="button"
          onClick={handleRefreshSongs}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <RefreshCw className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              Refresh Library
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Reload songs and index from storage
            </span>
          </div>
        </button>

        {/* 15. Delete Slide or Song */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isEditingSlide ? currentSlideId === null : !currentSong}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-black/35 border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
            <Trash2 className="w-4 h-4 text-app-text-muted group-hover:text-app-text transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-app-text group-hover:text-app-text block leading-tight truncate">
              {isEditingSlide ? "Delete Slide" : "Delete Song"}
            </span>
            <span className="text-[10px] text-app-text-muted block leading-tight truncate mt-0.5">
              Remove active slide or delete song
            </span>
          </div>
        </button>
      </div>

      {/* Status Footer */}
      <div className="px-2.5 py-1 border-t border-app-border flex items-center justify-between text-[10px] text-app-text-muted bg-black/[0.02] dark:bg-black/20 flex-shrink-0">
        <span className="truncate max-w-[120px]">{statusText}</span>
        <span className="tabular-nums">
          Queue: {queueState.remainingCount}/{queueState.queueCount}
        </span>
      </div>
    </div>
  );
};
