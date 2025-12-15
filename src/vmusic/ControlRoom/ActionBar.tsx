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
  BellPlus,
  Sheet,
} from "lucide-react";
import { Tooltip } from "antd";
import { GamyCard } from "../shared/GamyCard";
import { SearchWithDropdown } from "./ActionBar/SearchWithDropdown";
import { Song } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  openDeleteConfirmModal,
  toggleSettings,
  setIsEditingSlide,
  setShowAddSlideDialog,
  setShowTitleDialog,
  setShowPrelistTitleDialog,
} from "@/store/slices/uiSlice";
import { useToast } from "./hooks/useToast";
import { Toaster } from "../shared/Notification";
import { setSongRepo } from "@/store/slices/songSlice";
import { setFontFamily } from "@/store/slices/projectionSlice";

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
    type: "success" | "error" | "warning" | "info"
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

  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const fontSearchInputRef = useRef<HTMLInputElement>(null);

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showFontDropdown && fontSearchInputRef.current) {
      setTimeout(() => fontSearchInputRef.current?.focus(), 100);
    } else if (!showFontDropdown) {
      setFontSearchQuery("");
    }
  }, [showFontDropdown]);

  // Filter fonts based on search query
  const filteredFonts = systemFonts.filter((font) =>
    font.toLowerCase().includes(fontSearchQuery.toLowerCase())
  );

  const dispatch = useAppDispatch();
  const { slides, isSaving, currentSlideId, currentSongId, songTitle } =
    useAppSelector((state) => state.songSlides);
  const songRepo = useAppSelector((state) => state.songs.songRepo);
  const { showSettings, isEditingSlide } = useAppSelector((state) => state.ui);

  // Get the currently loaded song from the songs list (using songs prop)
  const currentSong = songs.find((song) => song.id === currentSongId);

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
        "error"
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
        "error"
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
      console.log(
        "🎬 Projection toggle clicked, current state:",
        isProjectionActive
      );
      if (isProjectionActive) {
        // Close projection
        console.log("🔴 Closing projection...");
        const result = await window.api.closeProjectionWindow();
        console.log("🔴 Close projection result:", result);
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

        // Wait a moment for window to be ready, then send the first slide
        setTimeout(async () => {
          console.log("⏱️ Timeout callback executing...");
          console.log("  - slides.length:", slides.length);
          console.log("  - currentSlideId:", currentSlideId);
          console.log(
            "  - Condition check:",
            slides.length > 0 && currentSlideId
          );

          if (slides.length > 0 && currentSlideId) {
            const currentIndex = slides.findIndex(
              (s) => s.id === currentSlideId
            );
            console.log("  - Found currentIndex:", currentIndex);
            const currentSlide = slides[currentIndex] || slides[0];
            console.log("  - currentSlide:", currentSlide);

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

            console.log("📤 Sending projection data:");
            console.log("  - Song title:", slideData.songTitle);
            console.log("  - Current index:", slideData.currentIndex);
            console.log("  - Total slides:", slideData.totalSlides);
            console.log("  - Slides array:", slideData.slides);
            console.log("  - Current slide:", slideData.slide);

            await window.api.sendToSongProjection(slideData);
          }
        }, 500);

        addToast("Projection started", "success");
      }
    } catch (error) {
      console.error("Projection error:", error);
      addToast(
        `Failed to ${isProjectionActive ? "close" : "start"} projection`,
        "error"
      );
    }
  };

  return (
    <div className="w-full border-b border-app-border bg-app-surface dark:bg-black rounded-full">
      <div className="h-10 flex items-center justify-between px-3 gap-3">
        {/* Left: Main Actions */}
        <div className="flex items-center gap-1.5">
          <Tooltip title="Add Current Song to Prelist" placement="bottom">
            <button
              onClick={() => {
                if (slides.length === 0) {
                  addToast(
                    "No slides to add to prelist. Paste lyrics first.",
                    "warning"
                  );
                  return;
                }
                dispatch(setShowPrelistTitleDialog(true));
              }}
              disabled={slides.length === 0}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-text-muted dark:bg-app-surface hover:bg-app-surface-hover text-white ${
                slides.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <BellPlus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Edit Current Slide" placement="bottom">
            <button
              onClick={() => dispatch(setIsEditingSlide(true))}
              disabled={currentSlideId === null}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg text-app-text border border-app-border ${
                currentSlideId !== null
                  ? "hover:bg-app-surface-hover"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Add New Slide" placement="bottom">
            <button
              onClick={() => dispatch(setShowAddSlideDialog(true))}
              className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-text-muted daek:bg-app-surface text-white hover:bg-app-accent/80 border border-app-border"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip
            title={
              isEditingSlide ? "Delete Current Slide" : "Delete Selected Song"
            }
            placement="bottom"
          >
            <button
              onClick={() => {
                if (isEditingSlide) {
                  onRequestDelete();
                } else if (currentSong) {
                  dispatch(
                    openDeleteConfirmModal({
                      song: currentSong,
                      type: "permanent",
                    })
                  );
                }
              }}
              disabled={isEditingSlide ? currentSlideId === null : !currentSong}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg text-app-text border border-app-border ${
                (isEditingSlide ? currentSlideId !== null : currentSong)
                  ? "hover:bg-app-surface-hover hover:text-red-500"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Save Current Song" placement="bottom">
            <button
              onClick={handleSaveClick}
              disabled={isSaving || slides.length === 0}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-text-muted text-white ${
                !isSaving && slides.length > 0
                  ? "hover:bg-app-surface-hover"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Settings" placement="bottom">
            <button
              onClick={() => dispatch(toggleSettings())}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all border border-app-border ${
                showSettings
                  ? "bg-app-accent text-white"
                  : "bg-app-bg text-app-text hover:bg-app-surface-hover"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip
            title={isProjectionActive ? "Stop Projection" : "Start Projection"}
            placement="bottom"
          >
            <button
              onClick={handleProjectionToggle}
              disabled={!isProjectionActive && slides.length === 0}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all border border-app-border ${
                isProjectionActive
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : slides.length === 0
                  ? "bg-app-bg text-app-text opacity-50 cursor-not-allowed"
                  : "bg-app-bg text-app-text hover:bg-app-surface-hover"
              }`}
            >
              {isProjectionActive ? (
                <MonitorStop className="w-3.5 h-3.5" />
              ) : (
                <Monitor className="w-3.5 h-3.5" />
              )}
            </button>
          </Tooltip>

          <div className="w-px h-6 mx-1 bg-app-border"></div>

          <Tooltip title="Refresh Song List" placement="bottom">
            <button
              onClick={loadSongs}
              className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <div className="relative" ref={folderDropdownRef}>
            <Tooltip title="Songs Directory" placement="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderDropdown(!showFolderDropdown);
                }}
                className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border"
              >
                <Folder className="w-3.5 h-3.5" />
              </button>
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFontDropdown(!showFontDropdown);
                }}
                className="flex items-center gap-1.5 px-2.5 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text text-ew-xs border border-app-border"
              >
                <span className="font-medium">{selectedFont}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
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
                    className="w-full px-2 py-1 text-ew-xs bg-app-surface text-app-text border border-app-border border-none rounded focus:outline-none focus:ring-1 focus:ring-app-accent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Font List - Tall scrollable area */}
                <div
                  className="overflow-y-auto no-scrollbar p-3 mb-4"
                  style={{ maxHeight: "500px" }}
                >
                  {filteredFonts.length > 0 ? (
                    filteredFonts.map((font) => (
                      <GamyCard
                        isDarkMode={isDarkMode}
                        key={font}
                        className="px-2 py-0.5 mt-1"
                        transparent={true}
                        style={{ borderRadius: "7px", border: "none" }}
                      >
                        <button
                          key={font}
                          onClick={async () => {
                            setSelectedFont(font);
                            setShowFontDropdown(false);
                            setFontSearchQuery("");
                            // Update Redux store and localStorage
                            dispatch(setFontFamily(font));
                            localStorage.setItem("bmusicfontFamily", font);

                            // Send IPC message to update projection window immediately
                            if (isProjectionActive) {
                              try {
                                await window.api.sendToSongProjection({
                                  type: "FONT_FAMILY_UPDATE",
                                  fontFamily: font,
                                });
                              } catch (error) {
                                console.error(
                                  "Error sending font update to projection:",
                                  error
                                );
                              }
                            }

                            // Dispatch storage event for cross-component updates
                            window.dispatchEvent(
                              new StorageEvent("storage", {
                                key: "bmusicfontFamily",
                                oldValue: null,
                                newValue: font,
                                storageArea: localStorage,
                              })
                            );
                          }}
                          className={`w-full bg-transparent text-left px-3  text-ew-sm text-app-text-muted hover:bg-app-surface-hover transition-colors ${
                            selectedFont === font ? "bg-app-surface" : ""
                          }`}
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </button>
                      </GamyCard>
                    ))
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
            <button
              onClick={handlePrintPrelistToPDF}
              disabled={prelistedSongs.length === 0}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg text-app-text border border-app-border ${
                prelistedSongs.length > 0
                  ? "hover:bg-app-surface-hover"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Sheet className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Print All Songs to PDF" placement="bottom">
            <button
              onClick={handlePrintAllSongsToPDF}
              disabled={allSongs.length === 0}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg text-app-text border border-app-border ${
                allSongs.length > 0
                  ? "hover:bg-app-surface-hover"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
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
          onSelectSong={onSelectSongFromSearch}
          isDarkMode={isDarkMode}
        />

        {/* Right: Status & Go Live */}
        <div className="flex items-center gap-2">
          {isProjectionActive && (
            <Tooltip title="Present Song Live" placement="bottom">
              <button
                onClick={() => selectedSong && presentSong(selectedSong)}
                disabled={!selectedSong}
                className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-red text-white ${
                  selectedSong
                    ? "hover:bg-app-red-hover"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
