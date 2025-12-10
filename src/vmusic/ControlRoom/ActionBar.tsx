import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Folder,
  Radio,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Save,
  X,
} from "lucide-react";
import { Tooltip } from "antd";
import { GamyCard } from "../shared/GamyCard";
import { SearchWithDropdown } from "./ActionBar/SearchWithDropdown";
import { Song } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store";
import { useToast } from "./hooks/useToast";
import { Toaster } from "../shared/Notification";
import { setSongRepo } from "@/store/slices/songSlice";

interface ActionBarProps {
  isDarkMode: boolean;
  selectedSong: any;
  searchQuery: string;
  isProjectionActive: boolean;
  songs: Song[];
  goToCreate: () => void;
  goToEdit: () => void;
  showDeleteConfirmation: () => void;
  loadSongs: () => void;
  changeDirectory: () => void;
  updateSearchQuery: (query: string) => void;
  presentSong: (song: any) => void;
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  onRequestSave: () => void;
  onRequestEdit: () => void;
  onRequestAdd: () => void;
}

const fontFamilies = [
  { name: "Open Sans", value: "Open Sans" },
  { name: "Segoe UI", value: "segoe" },
  { name: "Inter", value: "inter" },
  { name: "Anton SC", value: "anton" },
  { name: "Oswald", value: "oswald" },
  { name: "Roboto", value: "roboto" },
  { name: "Impact", value: "impact" },
  { name: "Teko", value: "teko" },
];

export const ActionBar: React.FC<ActionBarProps> = ({
  isDarkMode,
  selectedSong,
  searchQuery,
  isProjectionActive,
  songs,
  goToCreate,
  goToEdit,
  showDeleteConfirmation,
  loadSongs,
  changeDirectory,
  updateSearchQuery,
  presentSong,
  addToast,
  onRequestSave,
  onRequestEdit,
  onRequestAdd,
}) => {
  const [selectedFont, setSelectedFont] = useState(fontFamilies[0].name);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const folderDropdownRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const { slides, isSaving, currentSlideId } = useAppSelector(
    (state) => state.songSlides
  );
  const songRepo = useAppSelector((state) => state.songs.songRepo);

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
    if (!songRepo || songRepo.trim() === "") {
      addToast(
        "No songs directory set. Please select a folder first.",
        "error"
      );
      return;
    }
    if (slides.length === 0) {
      addToast("No slides to save. Paste lyrics first.", "warning");
      return;
    }
    onRequestSave();
  };

  return (
    <div className="w-full border-b border-app-border bg-app-surface dark:bg-black rounded-full">
      <div className="h-10 flex items-center justify-between px-3 gap-3">
        {/* Left: Main Actions */}
        <div className="flex items-center gap-1.5">
          <Tooltip title="Create New Song" placement="bottom">
            <button
              onClick={goToCreate}
              className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-blue hover:bg-app-blue-hover text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Edit Current Slide" placement="bottom">
            <button
              onClick={onRequestEdit}
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
              onClick={onRequestAdd}
              className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-accent text-white hover:bg-app-accent/80 border border-app-border"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Delete Selected Song" placement="bottom">
            <button
              onClick={() => selectedSong && showDeleteConfirmation()}
              disabled={!selectedSong}
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg text-app-text border border-app-border ${
                selectedSong
                  ? "hover:bg-app-surface-hover"
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
              className={`flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-green-500 text-white ${
                !isSaving && slides.length > 0
                  ? "hover:bg-green-600"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
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
                        localStorage.removeItem("songRepo");
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
              <div className="absolute top-full left-0 mt-1 w-40 bg-app-bg border border-app-border rounded-3xl-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {fontFamilies.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => {
                      setSelectedFont(font.name);
                      setShowFontDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-ew-xs text-app-text hover:bg-app-surface-hover transition-colors"
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-1 bg-app-border"></div>

          {/* Text Formatting */}
          <Tooltip title="Bold Text" placement="bottom">
            <button className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border">
              <Bold className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Italic Text" placement="bottom">
            <button className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border">
              <Italic className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Underline Text" placement="bottom">
            <button className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border">
              <Underline className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Strikethrough Text" placement="bottom">
            <button className="flex items-center justify-center w-7 h-7 rounded-3xl transition-all bg-app-bg hover:bg-app-surface-hover text-app-text border border-app-border">
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Center: Search */}
        <SearchWithDropdown
          searchQuery={searchQuery}
          updateSearchQuery={updateSearchQuery}
          songs={songs}
          onEdit={goToEdit}
          onPresent={presentSong}
          onDelete={showDeleteConfirmation}
          isDarkMode={isDarkMode}
        />

        {/* Right: Status & Go Live */}
        <div className="flex items-center gap-2">
          {isProjectionActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-3xl border border-red-200 bg-red-50">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-ew-xs font-medium text-red-600">LIVE</span>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
};
