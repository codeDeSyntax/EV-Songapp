import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
  Image as ImageIcon,
  Video,
  FolderUp,
  Menu,
  Check,
  X,
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

interface CombinedActionsCardProps {
  isDarkMode: boolean;
  songs?: Song[];
  loadSongs?: () => void;
  onRequestDelete?: () => void;
  addToast?: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
}

interface Background {
  name: string;
  src: string;
  category: string;
  isCustom?: boolean;
}

type MediaType = "images" | "videos";

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

export const CombinedActionsCard: React.FC<CombinedActionsCardProps> = ({
  isDarkMode: _isDarkMode,
  songs = [],
  loadSongs = () => {},
  onRequestDelete = () => {},
  addToast = () => {},
}) => {
  const dispatch = useAppDispatch();

  // Tab switcher state - Quick Actions shows first by default
  const [activeTab, setActiveTab] = useState<"quickActions" | "backgrounds">("quickActions");

  // Redux state
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

  // Quick Actions local state
  const [queueState, setQueueState] = useState<QueueState>(initialQueueState);
  const [isProjectionActive, setIsProjectionActive] = useState(false);
  const [statusText, setStatusText] = useState("Ready");

  // Background Selector local state
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<Background | null>(null);
  const [pendingBackground, setPendingBackground] = useState<Background | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationPosition, setConfirmationPosition] = useState({ x: 0, y: 0 });
  const [customImagesPath, setCustomImagesPath] = useState(
    localStorage.getItem("vmusicImageDirectory") || "",
  );
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("images");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuTriggerRef = useRef<HTMLDivElement | null>(null);

  const currentSong = React.useMemo(
    () => songs.find((s) => s.id === currentSongId),
    [songs, currentSongId],
  );
  const prelistedSongs = React.useMemo(
    () => songs.filter((s) => s.isPrelisted),
    [songs],
  );

  // Default public videos
  const defaultVideos: Background[] = [
    {
      name: "Blue Particles",
      src: "./blue_particle.mp4",
      category: "Default",
    },
    {
      name: "Water Glass",
      src: "./waterglass.mp4",
      category: "Default",
    },
    {
      name: "Welcome Video",
      src: "./welcomvid1.mp4",
      category: "Default",
    },
  ];

  // -------------------------------------------------------------
  // Queue flow & projection state hooks
  // -------------------------------------------------------------
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
        const val = event.newValue || "";
        const savedBg = backgrounds.find(
          (bg) => bg.src === val || bg.src === val.replace(/^solid:/, "").replace(/^gradient:/, "")
        );
        setSelectedBackground(savedBg || null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      cleanup?.();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [backgrounds]);

  // -------------------------------------------------------------
  // Backgrounds loading & management
  // -------------------------------------------------------------
  const loadBackgrounds = useCallback(async () => {
    setIsLoadingBackgrounds(true);
    try {
      if (mediaType === "videos") {
        setBackgrounds(defaultVideos);
      } else if (customImagesPath) {
        try {
          const imageFiles = await window.api.getImages(customImagesPath);
          const customBackgrounds: Background[] = imageFiles.map(
            (src: string, index: number) => ({
              name: `Custom ${index + 1}`,
              src,
              category: "Custom",
              isCustom: true,
            }),
          );
          setBackgrounds(customBackgrounds);
        } catch (error) {
          console.error("Failed to load custom images:", error);
          setBackgrounds([]);
        }
      } else {
        setBackgrounds([]);
      }
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      setBackgrounds([]);
    } finally {
      setIsLoadingBackgrounds(false);
    }
  }, [customImagesPath, mediaType]);

  useEffect(() => {
    loadBackgrounds();
  }, [loadBackgrounds]);

  // Outside click listener for background menu & confirmation popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showBgMenu &&
        !target.closest(".menu-container") &&
        !target.closest('div[title="Menu"]')
      ) {
        setShowBgMenu(false);
      }
      if (showConfirmation && !target.closest(".confirmation-menu")) {
        handleCancelBackground();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBgMenu, showConfirmation]);

  // Load saved background on mount & backgrounds change
  useEffect(() => {
    const savedBackgroundSrc = localStorage.getItem("bmusicpresentationbg");
    if (savedBackgroundSrc) {
      const srcWithoutPrefix = savedBackgroundSrc
        .replace(/^solid:/, "")
        .replace(/^gradient:/, "");

      const savedBg = backgrounds.find(
        (bg) => bg.src === savedBackgroundSrc || bg.src === srcWithoutPrefix,
      );
      if (savedBg) {
        setSelectedBackground(savedBg);
      }
    }
  }, [backgrounds]);

  const updateMenuPosition = useCallback(() => {
    if (!menuTriggerRef.current) return;
    const rect = menuTriggerRef.current.getBoundingClientRect();
    const menuWidth = 188;
    const margin = 8;
    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin,
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 140 - margin);
    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showBgMenu) return;
    updateMenuPosition();
    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showBgMenu, updateMenuPosition]);

  const applyBackground = (value: string) => {
    localStorage.setItem("bmusicpresentationbg", value);
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

  const handleSelectBackground = (
    background: Background,
    event: React.MouseEvent,
  ) => {
    setPendingBackground(background);
    const rect = event.currentTarget.getBoundingClientRect();
    setConfirmationPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: background.src, isPreview: true },
      }),
    );
    setShowConfirmation(true);
  };

  const handleApplyBackground = () => {
    if (!pendingBackground) return;
    setSelectedBackground(pendingBackground);
    applyBackground(pendingBackground.src);
    setShowConfirmation(false);
    setPendingBackground(null);
  };

  const handleCancelBackground = () => {
    const revertSrc = selectedBackground ? selectedBackground.src : "";
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: revertSrc, isPreview: false, isCancel: true },
      }),
    );
    setShowConfirmation(false);
    setPendingBackground(null);
  };

  const handleUploadDirectory = async () => {
    try {
      const result = await window.api.selectDirectory();
      if (typeof result === "string" && result) {
        setCustomImagesPath(result);
        localStorage.setItem("vmusicImageDirectory", result);
        loadBackgrounds();
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  const handleRemoveBackground = () => {
    localStorage.removeItem("bmusicpresentationbg");
    setSelectedBackground(null);
    applyBackground("");
    setShowBgMenu(false);
  };

  const handleClearAll = () => {
    localStorage.removeItem("bmusicpresentationbg");
    setSelectedBackground(null);
    localStorage.removeItem("vmusicImageDirectory");
    setCustomImagesPath("");
    setBackgrounds([]);
    applyBackground("");
    setShowBgMenu(false);
  };

  // -------------------------------------------------------------
  // Quick Actions Handlers
  // -------------------------------------------------------------
  const handleNewSong = () => {
    dispatch(toggleNewSongModal());
    setStatusText("Creating new song");
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
      setStatusText("Added to prelist");
    } catch {
      addToast("Failed to add to prelist. Please try again.", "error");
      setStatusText("Prelist failed");
    }
  };

  const handleEditSlide = () => {
    dispatch(setIsEditingSlide(!isEditingSlide));
    setStatusText(isEditingSlide ? "Slide editor closed" : "Slide editor opened");
  };

  const handleOpenEditor = () => {
    dispatch(toggleSongEditor());
    setStatusText("Song editor opened");
  };

  const handleAddSlide = () => {
    dispatch(setShowAddSlideDialog(true));
    setStatusText("Add slide dialog");
  };

  const handleExportPrelistPDF = async () => {
    try {
      const { generatePrelistPDF } = await import("@/utils/pdfGenerator");
      if (prelistedSongs.length === 0) {
        addToast("No songs currently in prelist", "info");
        return;
      }
      await generatePrelistPDF(prelistedSongs);
      addToast("Prelist PDF generated successfully!", "success");
      setStatusText("Prelist PDF exported");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to generate prelist PDF", "error");
    }
  };

  const handleExportAllSongsPDF = async () => {
    try {
      const { generateSongsDatabasePDF } = await import("@/utils/pdfGenerator");
      if (songs.length === 0) {
        addToast("No songs found to export", "info");
        return;
      }
      await generateSongsDatabasePDF(songs);
      addToast("Songs database PDF generated successfully!", "success");
      setStatusText("All songs PDF exported");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to generate database PDF", "error");
    }
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

  const handleToggleProjection = async () => {
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

  const handleFocusProjector = async () => {
    try {
      const result = await window.api.focusProjectionWindow();
      setStatusText(result.success ? "Projection focused" : "Focus unavailable");
    } catch {
      setStatusText("Focus unavailable");
    }
  };

  const handleResyncSlide = async () => {
    const currentSlide = displaySlides[currentDisplayIndex];
    if (!currentSlide) {
      setStatusText("No slide to sync");
      addToast("No slide available to sync", "warning");
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
    <DepthSurface className="h-full flex flex-col overflow-hidden rounded-lg">
      {/* Card Header with Tab Switcher */}
      <div className="px-2.5 py-1.5 border-b border-app-border flex items-center justify-between gap-2 flex-shrink-0 bg-black/[0.02] dark:bg-black/20">
        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] border border-app-border/60 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("quickActions")}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === "quickActions"
                ? "bg-app-bg text-app-text shadow-sm border border-app-border/70"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Quick Actions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("backgrounds")}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === "backgrounds"
                ? "bg-app-bg text-app-text shadow-sm border border-app-border/70"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Backgrounds</span>
            {backgrounds.length > 0 && (
              <span className="text-[10px] text-app-text-muted tabular-nums bg-app-bg/80 border border-app-border px-1.5 py-0.2 rounded-full leading-none flex-shrink-0">
                {backgrounds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: Quick Actions (Shows by default) */}
      <div
        className={`flex-1 flex flex-col min-h-0 ${
          activeTab === "quickActions" ? "flex" : "hidden"
        }`}
      >
        {/* Compact Action Rows */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* 1. New Song */}
          <button
            type="button"
            onClick={handleNewSong}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <FilePlus2 className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                New Song
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Create a new song presentation
              </span>
            </div>
          </button>

          {/* 2. Save Song */}
          <button
            type="button"
            onClick={handleSaveSong}
            disabled={isSaving || slides.length === 0}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Save className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Save Song
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                {isSaving ? "Saving changes..." : "Persist active song to disk"}
              </span>
            </div>
          </button>

          {/* 3. Add to Prelist */}
          <button
            type="button"
            onClick={handleSaveToPrelist}
            disabled={slides.length === 0}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <BellPlus className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                  Add to Prelist
                </span>
                {prelistedSongs.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-app-text-muted font-medium">
                    {prelistedSongs.length}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Queue song for active presentation
              </span>
            </div>
          </button>

          {/* 4. Edit Slide */}
          <button
            type="button"
            onClick={handleEditSlide}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                  Edit Slide
                </span>
                {isEditingSlide && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-app-accent/15 text-app-accent font-medium border border-app-accent/30">
                    Editing
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Toggle slide content editor
              </span>
            </div>
          </button>

          {/* 5. Song Editor */}
          <button
            type="button"
            onClick={handleOpenEditor}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <NotebookPen className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Song Editor
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Full song lyrics and slides manager
              </span>
            </div>
          </button>

          {/* 6. Toggle Projection */}
          <button
            type="button"
            onClick={handleToggleProjection}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              {isProjectionActive ? (
                <ScreenShareOff className="w-3.5 h-3.5 text-red-500 transition-colors" />
              ) : (
                <ScreenShare className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                  Toggle Projection
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                    isProjectionActive
                      ? "bg-red-500/15 text-red-500 border border-red-500/30"
                      : "bg-black/10 dark:bg-white/10 text-app-text-muted"
                  }`}
                >
                  {isProjectionActive ? "Live" : "Off"}
                </span>
              </div>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                {isProjectionActive ? "Stop audience projection" : "Launch projector window"}
              </span>
            </div>
          </button>

          {/* 7. Blackout */}
          <button
            type="button"
            onClick={handleBlackout}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <MonitorStop className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Blackout
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Instant blackout screen for display
              </span>
            </div>
          </button>

          {/* 8. Restore Background */}
          <button
            type="button"
            onClick={handleRestoreBackground}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Monitor className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Restore Background
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Restore background prior to blackout
              </span>
            </div>
          </button>

          {/* 9. Focus Projector */}
          <button
            type="button"
            onClick={handleFocusProjector}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Focus className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Focus Projector
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Bring projection window to front
              </span>
            </div>
          </button>

          {/* 10. Re-sync Slide */}
          <button
            type="button"
            onClick={handleResyncSlide}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <RefreshCcw className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Re-sync Slide
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Force re-send active slide to screen
              </span>
            </div>
          </button>

          {/* 11. Add Slide */}
          <button
            type="button"
            onClick={handleAddSlide}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Plus className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Add Slide
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Insert a new slide to current song
              </span>
            </div>
          </button>

          {/* 12. Prelist PDF */}
          <button
            type="button"
            onClick={handleExportPrelistPDF}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Sheet className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Prelist PDF
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Print or export queued songs
              </span>
            </div>
          </button>

          {/* 13. All Songs PDF */}
          <button
            type="button"
            onClick={handleExportAllSongsPDF}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Printer className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                All Songs PDF
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Export complete music repertoire
              </span>
            </div>
          </button>

          {/* 14. Refresh Library */}
          <button
            type="button"
            onClick={() => {
              loadSongs();
              addToast("Song library refreshed", "success");
            }}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                Refresh Library
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Reload songs and index from storage
              </span>
            </div>
          </button>

          {/* 15. Delete Slide or Song */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isEditingSlide ? currentSlideId === null : !currentSong}
            className="w-full flex items-center gap-2 py-1.5 px-2.5 border-0 border-b border-dashed border-t-0 border-l-0 border-r-0 border-black/30 dark:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex items-center justify-center flex-shrink-0 group-hover:border-app-accent transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-app-text-muted group-hover:text-app-text transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-app-text block leading-tight truncate">
                {isEditingSlide ? "Delete Slide" : "Delete Song"}
              </span>
              <span className="text-[9.5px] text-app-text-muted block leading-tight truncate">
                Remove active slide or delete song
              </span>
            </div>
          </button>
        </div>

        {/* Status Footer */}
        <div className="px-3 py-1.5 border-t border-app-border flex items-center justify-between text-[10px] text-app-text-muted bg-black/[0.02] dark:bg-black/20 flex-shrink-0">
          <span className="truncate max-w-[150px]">{statusText}</span>
          <span className="tabular-nums">
            Queue: {queueState.remainingCount}/{queueState.queueCount}
          </span>
        </div>
      </div>

      {/* VIEW 2: Backgrounds */}
      <div
        className={`flex-1 flex flex-col min-h-0 ${
          activeTab === "backgrounds" ? "flex" : "hidden"
        }`}
      >
        {/* Backgrounds Individual View Header */}
        <div className="px-2.5 py-1.5 border-0 border-b border-t-0 border-l-0 border-r-0 border-app-border bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-between gap-2 flex-shrink-0">
          {/* Images / Videos toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-white/30 dark:bg-white/[0.04] border border-app-border/40 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMediaType("images")}
              title="Show Images"
              className={`cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition-all ${
                mediaType === "images"
                  ? "bg-app-bg text-app-text shadow-sm border border-app-border/50"
                  : "text-app-text-muted hover:text-app-text"
              }`}
            >
              <ImageIcon className="w-3 h-3 flex-shrink-0" />
              <span>Images</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("videos")}
              title="Show Videos"
              className={`cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition-all ${
                mediaType === "videos"
                  ? "bg-app-bg text-app-text shadow-sm border border-app-border/50"
                  : "text-app-text-muted hover:text-app-text"
              }`}
            >
              <Video className="w-3 h-3 flex-shrink-0" />
              <span>Videos</span>
            </button>
          </div>

          {/* Directory & Actions Menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleUploadDirectory}
              title="Choose Custom Directory"
              className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-app-text hover:bg-black/5 dark:hover:bg-white/5 border border-app-border/60 transition-colors whitespace-nowrap"
            >
              <FolderUp className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Folder</span>
            </button>

            {/* Menu Trigger */}
            <div className="relative flex-shrink-0">
              <div
                ref={menuTriggerRef}
                onClick={() => setShowBgMenu(!showBgMenu)}
                title="Background Options Menu"
                className="cursor-pointer p-1 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors"
              >
                <Menu className="w-4 h-4" />
              </div>

              {showBgMenu &&
                createPortal(
                  <div
                    className="menu-container fixed z-[99999] min-w-[172px]"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                  >
                    <DepthSurface
                      className="p-1.5 rounded-xl shadow-xl"
                      surfaceClassName="bg-app-bg border border-app-border"
                    >
                      <div
                        onClick={() => {
                          handleUploadDirectory();
                          setShowBgMenu(false);
                        }}
                        className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-app-text hover:bg-app-surface-hover transition-colors"
                      >
                        <FolderUp className="w-3.5 h-3.5 flex-shrink-0" />
                        Choose Directory
                      </div>
                      <div className="h-px my-1 bg-app-border/60" />
                      <div
                        onClick={handleRemoveBackground}
                        className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-orange-500 hover:bg-orange-500/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                        Remove Background
                      </div>
                      <div
                        onClick={handleClearAll}
                        className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                        Clear All
                      </div>
                    </DepthSurface>
                  </div>,
                  document.body,
                )}
            </div>
          </div>
        </div>

        {/* Background Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2.5">
          {isLoadingBackgrounds ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-app-surface-hover animate-pulse"
                />
              ))}
            </div>
          ) : backgrounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-1 select-none py-8">
              <img
                src="./no_files.svg"
                alt="No files"
                className="w-16 h-16 mb-2 opacity-40"
              />
              <p className="text-[11px] font-medium text-app-text-muted">
                {customImagesPath
                  ? `No ${mediaType} found`
                  : "No directory selected"}
              </p>
              <p className="text-[10px] text-app-text-muted/70 text-center max-w-[200px]">
                {customImagesPath
                  ? `Add ${mediaType} to the selected folder`
                  : "Use the menu above to choose a directory"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {backgrounds.map((background, index) => {
                const isSelected = selectedBackground?.src === background.src;
                const isPending = pendingBackground?.src === background.src;

                return (
                  <div
                    key={`${background.src}-${index}`}
                    onClick={(e) => handleSelectBackground(background, e)}
                    className={`relative cursor-pointer aspect-video rounded-lg overflow-hidden transition-all duration-200 group ${
                      isPending
                        ? "ring-2 ring-amber-400 shadow-md"
                        : isSelected
                          ? "ring-2 ring-app-accent shadow-md"
                          : "ring-1 ring-app-border/60 hover:ring-app-border hover:shadow-sm"
                    }`}
                  >
                    {mediaType === "videos" ? (
                      <video
                        src={background.src}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={background.src}
                        alt={background.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    )}

                    {/* Name label — slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 pointer-events-none">
                      <p className="text-white text-[10px] font-medium truncate leading-tight">
                        {background.name}
                      </p>
                    </div>

                    {/* Pending badge */}
                    {isPending && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-md">
                        <span className="text-[9px] font-bold leading-none">?</span>
                      </div>
                    )}

                    {/* Selected badge */}
                    {isSelected && !isPending && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-app-accent text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Background Confirmation Popup */}
        {showConfirmation && pendingBackground && (
          <div
            className="confirmation-menu fixed z-[9999] w-44 rounded-xl shadow-xl border bg-app-bg border-app-border overflow-hidden"
            style={{
              left: `${confirmationPosition.x}px`,
              top: `${confirmationPosition.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <p className="text-[11px] font-semibold text-app-text text-center px-4 pt-3 pb-2">
              Apply this background?
            </p>
            <div className="px-2 pb-2 flex flex-col gap-1">
              <div
                onClick={handleApplyBackground}
                className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white bg-app-accent hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Apply
              </div>
              <div
                onClick={handleCancelBackground}
                className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-app-text-muted hover:bg-app-surface-hover transition-colors"
              >
                Cancel
              </div>
            </div>
          </div>
        )}

        {/* Backgrounds Footer */}
        <div className="px-3 py-1.5 border-t border-app-border flex items-center justify-between text-[10px] text-app-text-muted bg-black/[0.02] dark:bg-black/20 flex-shrink-0">
          <span className="truncate max-w-[150px]">
            {selectedBackground ? selectedBackground.name : "Default background"}
          </span>
          <span className="tabular-nums">
            {backgrounds.length} {mediaType}
          </span>
        </div>
      </div>
    </DepthSurface>
  );
};
