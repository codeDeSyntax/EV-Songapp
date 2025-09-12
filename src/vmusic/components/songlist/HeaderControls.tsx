import React, { useEffect, useState } from "react";
import {
  Monitor,
  Search,
  List,
  Table,
  PlusIcon,
  TvIcon,
  X,
  RefreshCcw,
  Folder,
  Menu,
  ChevronLeft,
  ChevronRight,
  Radio,
  XCircle,
} from "lucide-react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { Song } from "@/types";
import { useSongOperations } from "../../../features/songs/hooks/useSongOperations";
import { useProjectionState } from "../../../features/songs/hooks/useProjectionState";
import { useAppSelector } from "../../../store";

interface HeaderControlsProps {
  selectedSong: Song | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  songRepo: string;
  folderColor: string;
  onEditClick: () => void;
  onPresentationClick: () => void;
  onDeleteClick: () => void;
  onDeselectClick: () => void;
  onCreateClick: () => void;
  onPresentSongClick: (e: React.MouseEvent) => void;
  onRefetch: () => void;
  onChangeDirectory: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
}

const HeaderControls = React.memo(
  ({
    selectedSong,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    songRepo,
    folderColor,
    onEditClick,
    onPresentationClick,
    onDeleteClick,
    onDeselectClick,
    onCreateClick,
    onPresentSongClick,
    onRefetch,
    onChangeDirectory,
    onToggleSidebar,
    sidebarVisible,
  }: HeaderControlsProps) => {
    // Local theme state management
    const [localTheme, setLocalTheme] = useState(
      localStorage.getItem("bmusictheme") || "white"
    );

    // Projection state management
    const { isProjectionActive, closeProjection } = useProjectionState();

    // Listen for theme changes
    useEffect(() => {
      const handleCustomStorageChange = (e: CustomEvent) => {
        if (e.detail.key === "bmusictheme") {
          setLocalTheme(e.detail.newValue);
        }
      };

      window.addEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );

      return () => {
        window.removeEventListener(
          "localStorageChange",
          handleCustomStorageChange as EventListener
        );
      };
    }, []);

    return (
      <div className="flex flex-col justify-center mb-8">
        <div className="flex justify-between items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Sidebar Toggle Button */}
            <Tooltip
              title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
              placement="bottom"
            >
              <div
                onClick={onToggleSidebar}
                className="h-8 w-8 rounded-full flex items-center cursor-pointer justify-center text-stone-500 hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-all duration-300"
                style={{
                  borderWidth: 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                {sidebarVisible ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </Tooltip>

            <h1 className="text-[1.3rem] font-oswald text-vmprim font-bold">
              Songs of Zion
              <span
                className={`ml-4 text-[.7rem] italic animate-pulse ${
                  selectedSong ? "" : "hidden"
                }`}
              >
                {"--" + selectedSong?.title.slice(0, 32) + "--"}
              </span>
            </h1>

            {/* Live Indicator */}
            {isProjectionActive && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-500 bg-opacity-10 border border-red-300">
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                  <span className="text-red-600 text-xs font-medium">LIVE</span>
                  <Tooltip title="Close projection" placement="bottom">
                    <XCircle
                      className="w-3 h-3 text-red-500 hover:text-red-700 cursor-pointer ml-1"
                      onClick={closeProjection}
                    />
                  </Tooltip>
                </div>
              </div>
            )}
          </div>

          <div
            className={`flex flex-col justify-center items-center ${
              selectedSong ? "flex" : "hidden"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Tooltip title="Edit song" placement="bottom">
                <span>
                  <EditOutlined
                    className="w-4 h-4 hover:scale-110 hover:cursor-pointer text-[#9a674a]"
                    onClick={onEditClick}
                  />
                </span>
              </Tooltip>
              <Tooltip title="Present here" placement="bottom">
                <span>
                  <TvIcon
                    className="w-4 h-4 hover:scale-110 hover:cursor-pointer text-[#9a674a]"
                    onClick={onPresentationClick}
                  />
                </span>
              </Tooltip>
              <Tooltip title="Delete song" placement="bottom">
                <span>
                  <DeleteOutlined
                    className="w-4 h-4 hover:scale-110 hover:cursor-pointer text-[#9a674a]"
                    onClick={onDeleteClick}
                  />
                </span>
              </Tooltip>
              <Tooltip title="Deselect song" placement="bottom">
                <span>
                  <X
                    className="w-4 h-4 hover:scale-110 hover:cursor-pointer text-[#9a674a]"
                    onClick={onDeselectClick}
                  />
                </span>
              </Tooltip>
            </div>

            {/* Display saved path */}
            {songRepo && (
              <div className="mt-1">
                <p className="text-xs text-[#9a674a]/70 truncate max-w-xs">
                  📂 {songRepo}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative ">
            <input
              type="text"
              placeholder="Search hymns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-64 rounded-full border-none border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9a674a]/30 focus:border-transparent"
              style={{
                backgroundColor:
                  localTheme === "creamy" ? "#faeed1" : "#f9fafb",
              }}
            />
            <Search className="absolute left-3 top-1.5 w-5 h-5 text-stone-500" />
          </div>

          {/* View Toggle Controls */}
          <div className="flex items-center space-x-2">
            <Tooltip title="Table view" placement="bottom">
              <div
                onClick={() => setViewMode("table")}
                className={`h-8 w-8 rounded-full flex items-center cursor-pointer justify-center ${
                  viewMode === "table" ? " text-stone-500" : "  text-stone-500"
                } hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-colors`}
                style={{
                  borderWidth: viewMode === "table" ? 2 : 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                <Table className="w-3 h-3" />
              </div>
            </Tooltip>

            <Tooltip title="List view" placement="bottom">
              <div
                onClick={() => setViewMode("list")}
                className={`h-8 w-8 rounded-full flex items-center cursor-pointer justify-center ${
                  viewMode === "list"
                    ? "bg-[#9a674a] text-stone-500"
                    : "  text-stone-500"
                } hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-colors`}
                style={{
                  borderWidth: viewMode === "list" ? 2 : 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                <List className="w-3 h-3" />
              </div>
            </Tooltip>

            <Tooltip title="Add new song" placement="bottom">
              <div
                onClick={onCreateClick}
                className="h-8 w-8 rounded-full flex items-center cursor-pointer justify-center text-stone-500 hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-colors"
                style={{
                  borderWidth: 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                <PlusIcon className="w-3 h-3" />
              </div>
            </Tooltip>

            <Tooltip title="Present on external screen" placement="bottom">
              <div
                onClick={onPresentSongClick}
                className={`h-8 w-8 rounded-full flex items-center cursor-pointer justify-center text-stone-500 hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-colors ${
                  selectedSong ? "block" : "hidden"
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                <Monitor className="w-3 h-3" />
              </div>
            </Tooltip>

            <Tooltip title="Refresh songs" placement="bottom">
              <div
                onClick={onRefetch}
                className="h-8 w-8 rounded-full flex items-center cursor-pointer justify-center text-stone-500 hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-colors"
                style={{
                  borderWidth: 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                <RefreshCcw className="w-3 h-3" />
              </div>
            </Tooltip>

            <Tooltip title="Change songs directory" placement="bottom">
              <div
                onClick={onChangeDirectory}
                className="h-8 w-8 rounded-full flex items-center cursor-pointer justify-center text-stone-500 hover:bg-transparent hover:scale-105 hover:text-stone-500 transition-colors"
                style={{
                  borderWidth: 1,
                  borderColor: "#3f2817",
                  borderStyle: "dashed",
                  backgroundColor:
                    localTheme === "creamy" ? "#fdf4d0" : "#f9fafb",
                }}
              >
                <Folder className="w-3 h-3" />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
);

HeaderControls.displayName = "HeaderControls";

export default HeaderControls;
