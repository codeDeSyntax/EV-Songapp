// ActionBar Component - Main control panel for song management and projection
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Folder,
  Radio,
  ChevronDown,
  Printer,
  Underline,
  Strikethrough,
  Save,
  X,
  Settings,
  Monitor,
  MonitorStop,
  MonitorCheck,
  BellPlus,
  Sheet,
  Music,
  BarChart3,
  NotebookPen,
  FilePlus2,
} from "lucide-react";
import { Tooltip } from "antd";
import { GamyCard } from "../shared/GamyCard";
import { DepthButton as DepthIconButton } from "@/shared/DepthButton";
import { SearchWithDropdown } from "./ActionBar/SearchWithDropdown";
import { Song } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  openDeleteConfirmModal,
  toggleSettings,
  toggleStatistics,
  toggleAllSongsView,
  setRightPanelView,
  setIsEditingSlide,
  setShowAddSlideDialog,
  setShowTitleDialog,
  setShowPrelistTitleDialog,
  toggleSongEditor,
  toggleNewSongModal,
} from "@/store/slices/uiSlice";
import { useToast } from "./hooks/useToast";
import { Toaster } from "../shared/Notification";
import { setSongRepo } from "@/store/slices/songSlice";
import { setFontFamily } from "@/store/slices/projectionSlice";
import { addProjectionEntry } from "@/store/slices/projectionHistorySlice";
import { recordProjection } from "@/store/slices/statisticsSlice";
import BackupNotification from "./components/BackupNotification";

interface ActionBarProps {
  isDarkMode: boolean;
  selectedSong: any;
  searchQuery: string;
  isProjectionActive: boolean;
  songs: Song[];
  showDeleteConfirmation: () => void;
  loadSongs: () => void;
  changeDirectory: () => void;
  updateSearchQuery: (query: string) => void;
  presentSong: (song: any) => void;
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  onRequestDelete: () => void;
  onSelectSongFromSearch: (song: Song) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isDarkMode,
  selectedSong,
  searchQuery,
  isProjectionActive,
  songs,
  showDeleteConfirmation,
  loadSongs,
  changeDirectory,
  updateSearchQuery,
  presentSong,
  addToast,
  onRequestDelete,
  onSelectSongFromSearch,
}) => {
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState("");
  // BUG 15 fix: track scroll position so we can render only visible font rows
  const [fontListScrollTop, setFontListScrollTop] = useState(0);
  const fontListRef = useRef<HTMLDivElement>(null);

  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const fontSearchInputRef = useRef<HTMLInputElement>(null);

  // Virtual-scroll constants
  const FONT_ITEM_HEIGHT = 32; // px per item (matches GamyCard py-0.5 + button height)
  const FONT_LIST_HEIGHT = 500; // max height of the scroll container
  const OVERSCAN = 3; // extra items above/below viewport for smooth scrolling

  // Load system fonts on mount
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fonts = await window.api.getSystemFonts();
        setSystemFonts(fonts);

        // Load saved font from localStorage
        const savedFont = localStorage.getItem("bmusicfontFamily");
        if (savedFont) {
          setSelectedFont(savedFont);
        } else if (fonts.length > 0 && !selectedFont) {
          setSelectedFont(fonts[0]);
        }
      } catch (error) {
        console.error("Error loading system fonts:", error);
        // Fallback fonts
        setSystemFonts([
          "Arial",
          "Calibri",
          "Cambria",
          "Comic Sans MS",
          "Courier New",
          "Georgia",
          "Impact",
          "Segoe UI",
          "Tahoma",
          "Times New Roman",
          "Verdana",
        ]);
      }
    };
    loadFonts();
  }, []);

  // Focus search input when dropdown opens; reset on close
  useEffect(() => {
    if (showFontDropdown && fontSearchInputRef.current) {
      setTimeout(() => fontSearchInputRef.current?.focus(), 100);
    } else if (!showFontDropdown) {
      setFontSearchQuery("");
      setFontListScrollTop(0); // reset virtual scroll position on close
    }
  }, [showFontDropdown]);

  // Reset virtual scroll position when search narrows the list
  useEffect(() => {
    setFontListScrollTop(0);
    if (fontListRef.current) fontListRef.current.scrollTop = 0;
  }, [fontSearchQuery]);

  // Filter fonts based on search query
  const filteredFonts = systemFonts.filter((font) =>
    font.toLowerCase().includes(fontSearchQuery.toLowerCase()),
  );

  const dispatch = useAppDispatch();
  const { slides, isSaving, currentSlideId, currentSongId, songTitle } =
    useAppSelector((state) => state.songSlides);
  const songRepo = useAppSelector((state) => state.songs.songRepo);
  const { rightPanelView, isEditingSlide, showSongEditor, showNewSongModal } =
    useAppSelector((state) => state.ui);

  // Get the currently loaded song from the songs list (using songs prop)
  const currentSong = songs.find((song) => song.id === currentSongId);

  const getProjectionStatsSongId = (title: string) => {
    if (currentSong?.id) return currentSong.id;
    if (currentSongId) return currentSongId;

    const normalizedTitle = title.trim().toLowerCase().replace(/\s+/g, "-");
    return `unsaved-${normalizedTitle || "untitled"}`;
  };

  // Get prelist songs and all songs
  const prelistedSongs = songs.filter((song) => song.isPrelisted);
  const allSongs = songs;

  // PDF generation handlers
  const handlePrintPrelistToPDF = async () => {
    try {
      const { generatePrelistPDF } = await import("@/utils/pdfGenerator");
      await generatePrelistPDF(prelistedSongs);
      addToast(`Prelist PDF generated successfully!`, "success");
    } catch (error) {
      console.error("Error generating prelist PDF:", error);
      addToast(
        error instanceof Error
          ? error.message
          : "Failed to generate prelist PDF",
        "error",
      );
    }
  };

  const handlePrintAllSongsToPDF = async () => {
    try {
      const { generateSongsDatabasePDF } = await import("@/utils/pdfGenerator");
      await generateSongsDatabasePDF(allSongs);
      addToast(`Songs database PDF generated successfully!`, "success");
    } catch (error) {
      console.error("Error generating songs database PDF:", error);
      addToast(
        error instanceof Error
          ? error.message
          : "Failed to generate songs database PDF",
        "error",
      );
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showFontDropdown && !showFolderDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFontDropdown(false);
      }
      if (
        folderDropdownRef.current &&
        !folderDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFolderDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFontDropdown, showFolderDropdown]);

  const handleSaveClick = () => {
    // No need to check songRepo anymore - we auto-use app data directory
    if (slides.length === 0) {
      addToast("No slides to save. Paste lyrics first.", "warning");
      return;
    }
    dispatch(setShowTitleDialog(true));
  };

  const handleProjectionToggle = async () => {
    try {
      if (isProjectionActive) {
        // Close projection
        await window.api.closeProjectionWindow();
        addToast("Projection closed", "info");
      } else {
        // Start projection with current song
        if (slides.length === 0) {
          addToast("No slides to project. Paste lyrics first.", "warning");
          return;
        }

        // First, open the projection window with basic song data
        const songData = {
          title: songTitle || currentSong?.title || "Untitled Song",
          content: "", // Not used anymore
          slides: slides.map((slide) => ({
            content: slide.content,
            type: slide.type,
            number: slide.number,
          })),
        };

        await window.api.projectSong(songData);

        const projectedTitle =
          songTitle || currentSong?.title || "Untitled Song";
        const projectedAt = Date.now();
        const projectionSongId = getProjectionStatsSongId(projectedTitle);

        // Add to projection history
        dispatch(
          addProjectionEntry({
            songId: projectionSongId,
            songTitle: projectedTitle,
          }),
        );

        dispatch(
          recordProjection({
            songId: projectionSongId,
            songTitle: projectedTitle,
            projectedAt,
          }),
        );

        // Wait a moment for window to be ready, then send the first slide
        setTimeout(async () => {
          if (slides.length > 0 && currentSlideId) {
            const currentIndex = slides.findIndex(
              (s) => s.id === currentSlideId,
            );
            const currentSlide = slides[currentIndex] || slides[0];

            const slideData = {
              type: "SLIDE_UPDATE",
              slide: {
                content: currentSlide.content,
                type: currentSlide.type,
                number: currentSlide.number,
              },
              songTitle: songTitle || currentSong?.title || "Untitled Song",
              currentIndex: Math.max(0, currentIndex),
              totalSlides: slides.length,
              backgroundColor: "#000000",
              slides: slides.map((slide) => ({
                content: slide.content,
                type: slide.type,
                number: slide.number,
              })),
            };

            await window.api.sendToSongProjection(slideData);
          }
        }, 500);

        addToast("Projection started", "success");
      }
    } catch (error) {
      console.error("Projection error:", error);
      addToast(
        `Failed to ${isProjectionActive ? "close" : "start"} projection`,
        "error",
      );
    }
  };

  return (
    <div className="w-full border-b border-app-border bg-app-surface dark:bg-black rounded-full relative">
      <div className="h-10 flex items-center justify-between px-3 gap-3">
        {/* Left: Main Actions */}
        <div className="flex items-center gap-1.5">
          {/* Songs Library Button */}
          <Tooltip title="Browse All Songs" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(toggleAllSongsView())}
              active={rightPanelView === "allSongs"}
              activeClassName="text-white border-blue-500"
              activeSurfaceClassName="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-500"
            >
              <Music className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <div className="w-px h-6 mx-1 bg-app-border"></div>

          <Tooltip title="Add Current Song to Prelist" placement="bottom">
            <DepthIconButton
              onClick={() => {
                if (slides.length === 0) {
                  addToast(
                    "No slides to add to prelist. Paste lyrics first.",
                    "warning",
                  );
                  return;
                }
                dispatch(setShowPrelistTitleDialog(true));
              }}
              disabled={slides.length === 0}
              activeClassName="text-white border-app-text-muted"
              activeSurfaceClassName="bg-gradient-to-br from-app-text-muted via-app-text-muted/90 to-app-text-muted "
            >
              <BellPlus className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Edit Current Slide" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(setIsEditingSlide(true))}
              disabled={currentSlideId === null}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Edit Full Song" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(toggleSongEditor())}
              disabled={slides.length === 0}
              active={showSongEditor}
            >
              <NotebookPen className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="New Song" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(toggleNewSongModal())}
              active={showNewSongModal}
              activeClassName="text-white border-green-500"
              activeSurfaceClassName="bg-gradient-to-br from-green-500 via-green-600 to-green-500"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Add New Slide" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(setShowAddSlideDialog(true))}
              inactiveClassName="text-app-text border-app-border hover:text-white"
              inactiveSurfaceClassName="bg-gradient-to-br from-app-bg via-app-surface to-app-bg group-hover:from-app-accent/80 group-hover:via-app-accent group-hover:to-app-accent/80"
            >
              <Plus className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip
            title={
              isEditingSlide ? "Delete Current Slide" : "Delete Selected Song"
            }
            placement="bottom"
          >
            <DepthIconButton
              onClick={() => {
                if (isEditingSlide) {
                  onRequestDelete();
                } else if (currentSong) {
                  dispatch(
                    openDeleteConfirmModal({
                      song: currentSong,
                      type: "permanent",
                    }),
                  );
                }
              }}
              disabled={isEditingSlide ? currentSlideId === null : !currentSong}
              className="enabled:hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Save Current Song" placement="bottom">
            <DepthIconButton
              onClick={handleSaveClick}
              disabled={isSaving || slides.length === 0}
              inactiveClassName="text-app-text border-app-border hover:text-white"
              inactiveSurfaceClassName="bg-gradient-to-br from-app-bg via-app-surface to-app-bg group-hover:from-app-accent/80 group-hover:via-app-accent group-hover:to-app-accent/80"
            >
              <Save className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Settings" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(toggleSettings())}
              active={rightPanelView === "settings"}
            >
              <Settings className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Statistics" placement="bottom">
            <DepthIconButton
              onClick={() => dispatch(toggleStatistics())}
              active={rightPanelView === "statistics"}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          {isProjectionActive && (
            <Tooltip
              title="Focus Projection Window (Shift+F)"
              placement="bottom"
            >
              <DepthIconButton
                onClick={async () => {
                  try {
                    await window.api.focusProjectionWindow();
                  } catch (e) {
                    addToast("Could not focus projection window", "error");
                  }
                }}
                className="enabled:hover:text-white"
                inactiveSurfaceClassName="bg-gradient-to-br from-app-bg via-app-surface to-app-bg group-hover:from-blue-600 group-hover:via-blue-600 group-hover:to-blue-700"
              >
                <MonitorCheck className="w-3.5 h-3.5" />
              </DepthIconButton>
            </Tooltip>
          )}

          <Tooltip
            title={isProjectionActive ? "Stop Projection" : "Start Projection"}
            placement="bottom"
          >
            <DepthIconButton
              onClick={handleProjectionToggle}
              disabled={!isProjectionActive && slides.length === 0}
              active={isProjectionActive}
              activeClassName="text-white border-yellow-600"
              activeSurfaceClassName="bg-gradient-to-br from-yellow-600 via-yellow-600 to-yellow-700"
            >
              {isProjectionActive ? (
                <MonitorStop className="w-3.5 h-3.5" />
              ) : (
                <Monitor className="w-3.5 h-3.5" />
              )}
            </DepthIconButton>
          </Tooltip>

          <div className="w-px h-6 mx-1 bg-app-border"></div>

          <Tooltip title="Refresh Song List" placement="bottom">
            <DepthIconButton onClick={loadSongs}>
              <RefreshCw className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <div className="relative" ref={folderDropdownRef}>
            <Tooltip title="Songs Directory" placement="bottom">
              <DepthIconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderDropdown(!showFolderDropdown);
                }}
              >
                <Folder className="w-3.5 h-3.5" />
              </DepthIconButton>
            </Tooltip>

            {showFolderDropdown && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-app-surface border border-app-border rounded-lg shadow-lg z-[9999] ">
                <div className="p-3 border-b border-app-border">
                  <p className="text-[10px] text-app-text-muted mb-1 font-medium">
                    Current Directory:
                  </p>
                  <p className="text-sm text-app-text break-all">
                    {songRepo || "No directory selected"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <GamyCard
                    isDarkMode={isDarkMode}
                    transparent={true}
                    className="bg-app-surface m-2 space-y-1 w-1/2"
                  >
                    <button
                      onClick={() => {
                        changeDirectory();
                        setShowFolderDropdown(false);
                      }}
                      className="w-full  text-left text-ew-xs text-app-text bg-transparent transition-colors flex items-center gap-2"
                    >
                      <Folder className="w-3.5 h-3.5" />
                      Choose Directory
                    </button>
                  </GamyCard>
                  <GamyCard
                    isDarkMode={isDarkMode}
                    transparent={true}
                    className="bg-app-surface m-2 space-y-1 w-1/2"
                  >
                    <button
                      disabled={songRepo.trim() === ""}
                      onClick={() => {
                        dispatch(setSongRepo(""));
                        localStorage.removeItem("bmusicsongdir");
                        addToast("Songs directory cleared", "info");
                        setShowFolderDropdown(false);
                      }}
                      className="w-full  text-left text-ew-xs text-red-500 hover:text-red-600 bg-transparent transition-colors flex items-center gap-2"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear Directory
                    </button>
                  </GamyCard>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-1 bg-app-border"></div>

          {/* Font Family Selector */}
          <div className="relative" ref={fontDropdownRef}>
            <Tooltip title="Select Font Family" placement="bottom">
              <DepthIconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFontDropdown(!showFontDropdown);
                }}
                active={showFontDropdown}
                sizeClassName="h-7 px-2.5"
                className="gap-1.5 rounded-full"
              >
                <span className="font-medium">{selectedFont}</span>
                <ChevronDown className="w-3 h-3" />
              </DepthIconButton>
            </Tooltip>

            {showFontDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-app-surface border border-app-border rounded-lg shadow-lg z-[9999] flex flex-col">
                {/* Search Box */}
                <div className="p-2 border-b border-app-border">
                  <input
                    ref={fontSearchInputRef}
                    type="text"
                    value={fontSearchQuery}
                    onChange={(e) => setFontSearchQuery(e.target.value)}
                    placeholder="Search fonts..."
                    className="w-full px-2 py-1.5 text-ew-xs bg-app-bg text-app-text placeholder-app-text-muted border border-app-border rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent/50 shadow-inner"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* BUG 15 fix: virtual-scroll font list.
                    Only DOM nodes for the ~20 visible items are created at any
                    time instead of 200-500 for the full system font list. */}
                <div
                  ref={fontListRef}
                  className="overflow-y-auto no-scrollbar p-3 mb-4"
                  style={{ maxHeight: `${FONT_LIST_HEIGHT}px` }}
                  onScroll={(e) =>
                    setFontListScrollTop(
                      (e.currentTarget as HTMLDivElement).scrollTop,
                    )
                  }
                >
                  {filteredFonts.length > 0 ? (
                    (() => {
                      const startIndex = Math.max(
                        0,
                        Math.floor(fontListScrollTop / FONT_ITEM_HEIGHT) -
                          OVERSCAN,
                      );
                      const visibleCount =
                        Math.ceil(FONT_LIST_HEIGHT / FONT_ITEM_HEIGHT) +
                        OVERSCAN * 2;
                      const endIndex = Math.min(
                        filteredFonts.length,
                        startIndex + visibleCount,
                      );
                      const paddingTop = startIndex * FONT_ITEM_HEIGHT;
                      const paddingBottom =
                        (filteredFonts.length - endIndex) * FONT_ITEM_HEIGHT;

                      return (
                        <>
                          <div style={{ height: paddingTop }} />
                          {filteredFonts
                            .slice(startIndex, endIndex)
                            .map((font) => (
                              <GamyCard
                                isDarkMode={isDarkMode}
                                key={font}
                                className="px-2 py-0.5 mt-1"
                                transparent={true}
                                style={{ borderRadius: "7px", border: "none" }}
                              >
                                <button
                                  onClick={async () => {
                                    setSelectedFont(font);
                                    setShowFontDropdown(false);
                                    setFontSearchQuery("");
                                    dispatch(setFontFamily(font));
                                    localStorage.setItem(
                                      "bmusicfontFamily",
                                      font,
                                    );

                                    if (isProjectionActive) {
                                      try {
                                        await window.api.sendToSongProjection({
                                          type: "FONT_FAMILY_UPDATE",
                                          fontFamily: font,
                                        });
                                      } catch (error) {
                                        console.error(
                                          "Error sending font update to projection:",
                                          error,
                                        );
                                      }
                                    }

                                    window.dispatchEvent(
                                      new StorageEvent("storage", {
                                        key: "bmusicfontFamily",
                                        oldValue: null,
                                        newValue: font,
                                        storageArea: localStorage,
                                      }),
                                    );
                                  }}
                                  className={`w-full bg-transparent text-left px-3 text-ew-sm text-app-text-muted hover:bg-app-surface-hover transition-colors ${
                                    selectedFont === font
                                      ? "bg-app-surface"
                                      : ""
                                  }`}
                                  style={{ fontFamily: font }}
                                >
                                  {font}
                                </button>
                              </GamyCard>
                            ))}
                          <div style={{ height: paddingBottom }} />
                        </>
                      );
                    })()
                  ) : (
                    <div className="px-3 py-4 text-center text-app-text-muted text-ew-xs">
                      No fonts found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-1 bg-app-border"></div>

          {/* PDF Export */}
          <Tooltip title="Print Prelist to PDF" placement="bottom">
            <DepthIconButton
              onClick={handlePrintPrelistToPDF}
              disabled={prelistedSongs.length === 0}
            >
              <Sheet className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          <Tooltip title="Print All Songs to PDF" placement="bottom">
            <DepthIconButton
              onClick={handlePrintAllSongsToPDF}
              disabled={allSongs.length === 0}
            >
              <Printer className="w-3.5 h-3.5" />
            </DepthIconButton>
          </Tooltip>

          {/* <Tooltip title="Underline Text" placement="bottom">
            <button className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border">
              <Underline className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Strikethrough Text" placement="bottom">
            <button className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border">
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </Tooltip> */}
        </div>

        {/* Center: Search */}
        <SearchWithDropdown
          searchQuery={searchQuery}
          updateSearchQuery={updateSearchQuery}
          songs={songs}
          onPresent={presentSong}
          onDelete={showDeleteConfirmation}
          onSelectSong={(song) => {
            onSelectSongFromSearch(song);
            dispatch(setRightPanelView("bento"));
          }}
          isDarkMode={isDarkMode}
        />

        {/* Right: Status & Go Live */}
        <div className="flex items-center gap-2">
          <BackupNotification />
          {isProjectionActive && (
            <Tooltip title="Present Song Live" placement="bottom">
              <DepthIconButton
                onClick={() => selectedSong && presentSong(selectedSong)}
                disabled={!selectedSong}
                active
                activeClassName="text-white border-yellow"
                activeSurfaceClassName="bg-gradient-to-br from-yellow-500 via-yellow-800 to-yellow-500"
              >
                <Radio className="w-3.5 h-3.5" />
              </DepthIconButton>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
