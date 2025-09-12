import React, { useState, useEffect } from "react";
import { Search, Plus, X, FileAudio2 } from "lucide-react";
import { Song } from "@/types";

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
  setSearchTerm: (value: string) => void;
  handleSongSelection: (song: Song) => void;
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
  setSearchTerm,
  handleSongSelection,
}) => {
  // Use local theme for songs app instead of Redux theme
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  // Window width for responsive columns
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
        <div
          className="sticky top-0 pb-3 z-10"
          style={{
            backgroundColor: localTheme === "creamy" ? "#fdf4d0" : "#f9f9f9",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg font-semibold"
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
              className="w-full p-2 pl-9 shadow-sm border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor:
                  localTheme === "creamy" ? "#faeed1" : "#f8f9fa",
                color: localTheme === "creamy" ? "#8b6f3d" : "#374151",
                borderColor: localTheme === "creamy" ? "#e6d3b7" : "#e5e7eb",
              }}
            />
            <Search
              className="absolute left-2.5 top-2.5"
              size={16}
              style={{
                color: localTheme === "creamy" ? "#a67c5a" : "#6b7280",
              }}
            />
          </div>
        </div>

        {/* Multi-Column Content - Like BlessedMusic */}
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
                              className={`border-b z-0 border-stone-200 shadow rounded-md mt-0.5 flex items-center justify-between transition-colors cursor-pointer ${
                                isInCollection
                                  ? localTheme === "creamy"
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-stone-100 border-stone-300"
                                  : "hover:bg-stone-50"
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
                                  <FileAudio2
                                    className="w-4 h-4 flex-shrink-0"
                                    style={{
                                      color:
                                        localTheme === "creamy"
                                          ? "#92400e"
                                          : "#374151",
                                    }}
                                  />
                                  <span
                                    className="truncate"
                                    style={{
                                      color:
                                        localTheme === "creamy"
                                          ? "#92400e"
                                          : "#374151",
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
                                          : "#667eea",
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
      </div>
    );
  }

  // Modern List View - Like VirtualSongList
  return (
    <div className="w-full h-full overflow-x-hidden">
      {/* Modern Header - Compact and responsive */}
      <div
        className={`sticky top-0 z-10 mb-2 p-3 rounded-lg shadow-sm backdrop-blur-md ${
          localTheme === "creamy"
            ? "bg-gradient-to-r from-amber-600/10 to-orange-50/50 border border-amber-200"
            : "bg-gradient-to-r from-amber-50/90 to-amber-70/80 border border-orange-200"
        }`}
        style={{ maxWidth: "100%" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center shadow justify-center ${
                localTheme === "creamy"
                  ? "bg-gradient-to-r from-[#9a674a] to-[#9a674a]"
                  : "bg-gradient-to-r from-[#faeed1] to-[#faeed1]"
              }`}
            >
              <img src="./music1.png" className="w-4 h-4" alt="PDF icon" />
            </div>
            <div>
              <h3
                className="font-semibold text-sm text-gray-800"
                style={{ fontFamily: "Georgia" }}
              >
                Songs Collection
                {selectedCollection &&
                  ` - ${
                    collections.find((c) => c.id === selectedCollection)?.name
                  }`}
              </h3>
              <p className="text-xs text-gray-600">
                {filteredSongs.length} songs available
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-9 shadow-sm border rounded-lg focus:outline-none focus:ring-2 text-sm"
            style={{
              backgroundColor: localTheme === "creamy" ? "#faeed1" : "#f8f9fa",
              color: localTheme === "creamy" ? "#8b6f3d" : "#374151",
              borderColor: localTheme === "creamy" ? "#e6d3b7" : "#e5e7eb",
            }}
          />
          <Search
            className="absolute left-2.5 top-2.5"
            size={16}
            style={{
              color: localTheme === "creamy" ? "#a67c5a" : "#6b7280",
            }}
          />
        </div>
      </div>

      {/* Songs List - Properly constrained */}
      <div className="h-[calc(100vh-18rem)] overflow-y-auto no-scrollbar">
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
          <div className="space-y-1 px-2 py-1" style={{ maxWidth: "100%" }}>
            {filteredSongs.map((song) => {
              const isInCollection =
                selectedCollection &&
                collections
                  .find((c) => c.id === selectedCollection)
                  ?.songIds.includes(song.id);

              return (
                <div
                  key={song.id}
                  className="group pr-0.5 relative w-full overflow-hidden rounded transition-all duration-150 cursor-pointer transform hover:scale-[1.002] hover:shadow-sm"
                  style={{
                    backgroundColor: isInCollection
                      ? localTheme === "creamy"
                        ? "#faf5e4"
                        : "#f8fafc"
                      : localTheme === "creamy"
                      ? "#fdf4d0"
                      : "#ffffff",
                    border: `1px solid ${
                      isInCollection
                        ? localTheme === "creamy"
                          ? "#e5d5b7"
                          : "#e2e8f0"
                        : localTheme === "creamy"
                        ? "#f3e8d0"
                        : "#f1f5f9"
                    }`,
                    maxWidth: "100%",
                  }}
                  title={
                    song.path +
                    " \n" +
                    `${new Date(song.dateModified).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}` +
                    "\n" +
                    `${new Date(song.dateModified).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  }
                  onClick={() => handleSongSelection(song)}
                >
                  {/* Subtle gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-amber-50/15 via-transparent to-amber-50/15 transition-opacity duration-150 ${
                      isInCollection
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  ></div>

                  {/* Content - Ultra compact layout */}
                  <div className="relative px-1.5 py-1 w-full">
                    <div className="flex items-center justify-between w-full min-w-0">
                      {/* Left Section - Song Info */}
                      <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-1">
                        {/* Ultra compact Icon */}
                        <div className="flex-shrink-0">
                          <div
                            className="w-4 h-4 rounded-sm flex items-center justify-center"
                            style={{
                              background:
                                localTheme === "creamy"
                                  ? "linear-gradient(135deg, #48330d 0%, #d97706 100%)"
                                  : "linear-gradient(135deg, #faeed1 0%, #fffcef 100%)",
                            }}
                          >
                            <img
                              src="./music1.png"
                              className="w-2.5 h-2.5"
                              alt="PDF icon"
                            />
                          </div>
                        </div>

                        {/* Song Title - Properly constrained */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-xs font-medium truncate group-hover:text-amber-700 transition-colors leading-none"
                            style={{
                              fontFamily: "Georgia",
                              color:
                                localTheme === "creamy" ? "#92400e" : "#374151",
                            }}
                            title={song.title + " " + song.dateModified}
                          >
                            {song.title}
                          </h3>
                          {/* Ultra compact subtitle */}
                          <span
                            className="text-[10px] font-medium whitespace-nowrap block mt-0.5"
                            style={{
                              color:
                                localTheme === "creamy" ? "#a16207" : "#6b7280",
                            }}
                          >
                            {new Date(song.dateModified).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {selectedCollection && (
                        <div className="flex-shrink-0 ml-2">
                          <button
                            className={`p-1.5 h-7 w-7 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
                              isInCollection
                                ? "text-white hover:bg-red-600 bg-red-500"
                                : "text-white hover:opacity-80"
                            }`}
                            style={{
                              backgroundColor: isInCollection
                                ? "#ef4444"
                                : localTheme === "creamy"
                                ? "#d4a574"
                                : "#667eea",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSongSelection(song);
                            }}
                          >
                            {isInCollection ? (
                              <X size={12} />
                            ) : (
                              <Plus size={12} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-px transition-transform duration-150 origin-left ${
                      isInCollection
                        ? "scale-x-100"
                        : "transform scale-x-0 group-hover:scale-x-100"
                    }`}
                    style={{
                      background:
                        localTheme === "creamy"
                          ? "linear-gradient(90deg, #a16207 0%, #a16207 100%)"
                          : "linear-gradient(90deg, #a16207 0%, #a16207 100%)",
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongListPanel;
