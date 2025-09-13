import React, { useState, useEffect } from "react";
import { Search, Plus, X, FileAudio2 } from "lucide-react";
import { Song } from "@/types";
import {
  SongListSkeleton,
  SearchSkeleton,
  LoadingWrapper,
} from "./SkeletonLoaders";

interface Collection {
  id: string;
  name: string;
  songIds: string[];
  dateCreated: string;
}

interface SongListPanelProps {
  showSongList: boolean;
  isMobile: boolean;
  filteredSongs: Song[];
  searchTerm: string;
  selectedCollection: string | null;
  collections: Collection[];
  theme: string;
  viewMode: string; // Add viewMode prop
  isLoadingSongs?: boolean;
  setSearchTerm: (value: string) => void;
  handleSongSelection: (song: Song) => void;
  addSongToCollection?: (songId: string, collectionId: string) => void; // Add drag-drop handler
}

const SongListPanel: React.FC<SongListPanelProps> = ({
  showSongList,
  isMobile,
  filteredSongs,
  searchTerm,
  selectedCollection,
  collections,
  theme,
  viewMode = "table", // Default to table view
  isLoadingSongs = false,
  setSearchTerm,
  handleSongSelection,
  addSongToCollection,
}) => {
  // Use local theme for songs app instead of Redux theme
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  // Window width for responsive columns
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Drag state
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, song: Song) => {
    setDraggedSong(song);
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        songId: song.id,
        songTitle: song.title,
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggedSong(null);
  };

  // Determine number of columns based on screen size - like BlessedMusic
  const numberOfColumns = React.useMemo(() => {
    const availableWidth = windowWidth - 320; // Account for sidebar space
    return availableWidth >= 1024 ? 4 : availableWidth >= 768 ? 3 : 2;
  }, [windowWidth]);

  // Split songs into columns like BlessedMusic
  const columnSongs = React.useMemo(() => {
    const songsPerColumn = Math.ceil(filteredSongs.length / numberOfColumns);
    const columns: Song[][] = [];

    for (let i = 0; i < numberOfColumns; i++) {
      const startIndex = i * songsPerColumn;
      const endIndex = Math.min(
        startIndex + songsPerColumn,
        filteredSongs.length
      );
      columns.push(filteredSongs.slice(startIndex, endIndex));
    }

    return columns;
  }, [filteredSongs, numberOfColumns]);

  // Update theme when localStorage changes
  useEffect(() => {
    // Listen for localStorage changes (when theme is changed from TitleBar)
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

  // Window resize handler
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!showSongList && isMobile) return null;

  // Table View - Exact VirtualSongList style
  if (viewMode === "table") {
    return (
      <div className="w-full h-full">
        {/* Search Header */}
        <LoadingWrapper
          isLoading={isLoadingSongs}
          skeleton={<SearchSkeleton theme={localTheme} />}
        >
          <div
            className="sticky top-0 pb-3 z-10"
            style={
              {
                // backgroundColor: localTheme === "creamy" ? "#fdf4d0" : "#f9f9f9",
              }
            }
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-lg font-semibold font-oswald"
                style={{
                  color: localTheme === "creamy" ? "#8b6f3d" : "#374151",
                }}
              >
                Songs Collection{" "}
                {selectedCollection &&
                  `- ${
                    collections.find((c) => c.id === selectedCollection)?.name
                  }`}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm"
                  style={{
                    color: localTheme === "creamy" ? "#a67c5a" : "#6b7280",
                  }}
                >
                  {filteredSongs.length} songs
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search songs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-[30%] rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#9a674a]/30 focus:border-transparent text-sm"
                style={{
                  backgroundColor:
                    localTheme === "creamy" ? "#faeed1" : "#f6f6f6",
                  color: localTheme === "creamy" ? "#8b6f3d" : "#374151",
                }}
              />
              <Search
                className="absolute left-3 top-3.5 w-5 h-5 text-stone-500"
                size={20}
              />
            </div>
          </div>
        </LoadingWrapper>

        {/* Multi-Column Content - Like BlessedMusic */}
        <LoadingWrapper
          isLoading={isLoadingSongs}
          skeleton={<SongListSkeleton theme={localTheme} />}
        >
          <div className="w-full h-full">
            {filteredSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 w-full">
                <div className="text-center">
                  <img
                    src="./something-lost.png"
                    alt="No songs found"
                    className="h-24 mx-auto mb-4 opacity-50"
                  />
                  <h3
                    className="text-base font-medium mb-2"
                    style={{
                      color: localTheme === "creamy" ? "#8b6f3d" : "#374151",
                    }}
                  >
                    No songs found
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      color: localTheme === "creamy" ? "#a67c5a" : "#6b7280",
                    }}
                  >
                    Try changing your search criteria or select a different
                    collection.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`flex gap-6 w-full h-full ${
                  numberOfColumns === 3 ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
                {columnSongs.map((columnSongList, columnIndex) => (
                  <div key={columnIndex} className="flex-1 min-w-0">
                    {/* Individual Column with Independent Scrolling */}
                    <div className="h-full flex flex-col">
                      {/* Table Header for each column */}
                      <div
                        className="rounded-md sticky top-0 z-10 mb-2 flex-shrink-0"
                        style={{
                          backgroundColor:
                            localTheme === "creamy" ? "#fdf4d0" : "#f9f9f9",
                        }}
                      >
                        <div className="text-[#9a674a] rounded-md">
                          <div
                            className="px-4 py-2 text-left flex justify-between items-center text-sm"
                            style={{
                              borderWidth: 2,
                              borderColor: "#9a674a",
                              borderStyle: "dashed",
                              borderRadius: 10,
                            }}
                          >
                            <span>Title</span>
                            <span className="font-bold text-xs">
                              |||||||||||||||||||
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              Modified
                              {selectedCollection && (
                                <span className="ml-2">Action</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Independently Scrollable Column Content */}
                      <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="space-y-0.5">
                          {columnSongList.map((song) => {
                            const isInCollection =
                              selectedCollection &&
                              collections
                                .find((c) => c.id === selectedCollection)
                                ?.songIds.includes(song.id);

                            return (
                              <div
                                key={song.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, song)}
                                onDragEnd={handleDragEnd}
                                className={`border-b z-0 border-stone-200 shadow rounded-md mt-0.5 flex items-center justify-between transition-colors cursor-pointer ${
                                  isInCollection
                                    ? localTheme === "creamy"
                                      ? "bg-amber-50 border-amber-200"
                                      : "bg-stone-100 border-stone-300"
                                    : "hover:bg-stone-50"
                                } ${
                                  draggedSong?.id === song.id
                                    ? "opacity-50 scale-95"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: isInCollection
                                    ? localTheme === "creamy"
                                      ? "#faf5e4"
                                      : "#f8fafc"
                                    : localTheme === "creamy"
                                    ? "#fdf4d0"
                                    : "#ffffff",
                                }}
                                title={song.path}
                                onClick={() => handleSongSelection(song)}
                              >
                                <div
                                  className="px-3 py-1 flex items-center justify-between gap-2 text-[11px] font-medium w-full"
                                  style={{ fontFamily: "Georgia" }}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileAudio2 className="w-4 h-4 flex-shrink-0 text-primary" />
                                    <span
                                      className="truncate "
                                      style={{
                                        color:
                                          localTheme === "creamy"
                                            ? "#141413"
                                            : "#181818",
                                      }}
                                    >
                                      {song.title.charAt(0).toUpperCase() +
                                        song.title.slice(1).toLowerCase()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                      className="text-[9px] font-serif hidden sm:block"
                                      style={{
                                        color:
                                          localTheme === "creamy"
                                            ? "#a16207"
                                            : "#6b7280",
                                      }}
                                    >
                                      {song.dateModified
                                        ? song.dateModified.slice(5, 10)
                                        : "N/A"}
                                    </span>

                                    {selectedCollection && (
                                      <button
                                        className={`p-1 h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
                                          isInCollection
                                            ? "text-white hover:bg-red-600 bg-red-500"
                                            : "text-white hover:opacity-80"
                                        }`}
                                        style={{
                                          backgroundColor: isInCollection
                                            ? "#ef4444"
                                            : localTheme === "creamy"
                                            ? "#d4a574"
                                            : "#d4a574",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSongSelection(song);
                                        }}
                                      >
                                        {isInCollection ? (
                                          <X size={10} />
                                        ) : (
                                          <Plus size={10} />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </LoadingWrapper>
      </div>
    );
  }

  return null;
};

export default SongListPanel;
