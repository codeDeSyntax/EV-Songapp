import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Song } from "@/types";
import SongRow from "./SongRow";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { Music } from "lucide-react";

interface VirtualSongListProps {
  songs: Song[];
  viewMode: string;
  onSingleClick: (song: Song) => void;
  onDoubleClick: (song: Song) => void;
  containerHeight?: number;
  selectedSong?: Song | null;
}

const ITEM_HEIGHT = 50; // Reduced height for more compact list view
const BUFFER_SIZE = 5; // Number of items to render outside visible area

const VirtualSongList = React.memo(
  ({
    songs,
    viewMode,
    onSingleClick,
    onDoubleClick,
    containerHeight = 600,
    selectedSong,
  }: VirtualSongListProps) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(
      null
    );

    // Use local theme for songs app instead of Redux theme
    const [localTheme, setLocalTheme] = useState(
      localStorage.getItem("bmusictheme") || "white"
    );

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

    const visibleItems = useMemo(() => {
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
      );
      const endIndex = Math.min(
        songs.length - 1,
        Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
      );
      return { startIndex, endIndex };
    }, [scrollTop, containerHeight, songs.length]);

    const visibleSongs = useMemo(() => {
      return songs.slice(visibleItems.startIndex, visibleItems.endIndex + 1);
    }, [songs, visibleItems]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const totalHeight = songs.length * ITEM_HEIGHT;
    const offsetY = visibleItems.startIndex * ITEM_HEIGHT;

    if (viewMode === "table") {
      return (
        <div
          ref={setContainerRef}
          className="overflow-y-auto w-full no-scrollbar h-full"
          onScroll={handleScroll}
          style={{
            height: containerHeight,
          }}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              <table className="w-full table-auto rounded-md">
                <thead
                  className={`rounded-md sticky top-0  z-10 $`}
                  style={{
                    backgroundColor:
                      localTheme === "creamy" ? "#fdf4d0" : "#f9f9f9",
                  }}
                >
                  <tr className="text-[#9a674a] rounded-md">
                    <th
                      className="px-4 text-left flex justify-between items-center"
                      style={{
                        borderWidth: 2,
                        borderColor: "#9a674a",
                        borderStyle: "dashed",
                        borderRadius: 10,
                      }}
                    >
                      <p>Title</p>
                      <p className="font-bold lg:hidden">
                        ||||||||||||||||||||||||||||||||||||||||
                      </p>
                      <p className="font-bold hidden lg:block">
                        |||||||||||||||||||||||||||||||||
                      </p>
                      Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSongs.map((song, index) => (
                    <SongRow
                      key={`${song.path}-${visibleItems.startIndex + index}`}
                      song={song}
                      onSingleClick={onSingleClick}
                      onDoubleClick={onDoubleClick}
                      isTable={true}
                      localTheme={localTheme}
                      selectedSong={selectedSong}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Modern List View Design - Improved responsive container
    return (
      <div
        ref={setContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden no-scrollbar h-full"
        onScroll={handleScroll}
        style={{
          height: containerHeight || 600,
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            height: totalHeight,
            position: "relative",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              width: "100%",
              maxWidth: "100%",
            }}
          >
            {/* Modern Header - Compact and responsive */}
            <div
              className={`sticky top-0 z-10 mb-2 p-3 rounded-lg shadow-sm backdrop-blur-md ${
                localTheme === "creamy"
                  ? "bg-gradient-to-r from-amber-600/10 to-orange-50/50 border border-amber-200"
                  : "bg-gradient-to-r from-amber-50/90 to-amber-70/80 border border-orange-200"
              }`}
              style={{ maxWidth: "100%" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center shadow justify-center ${
                      localTheme === "creamy"
                        ? "bg-gradient-to-r from-[#9a674a] to-[#9a674a]"
                        : "bg-gradient-to-r from-[#faeed1] to-[#faeed1"
                    }`}
                  >
                    <img src="./music1.png" className="w-4 h-4" alt="PDF icon" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-sm text-gray-800"
                      style={{ fontFamily: "Georgia" }}
                    >
                      {viewMode === "table" ? "Songs Collection" : "List View"}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {songs.length} songs available
                    </p>
                  </div>
                </div>

                {/* <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    localTheme === "creamy"
                      ? "bg-[#9a674a] text-white"
                      : "bg-[#9a674a] text-white"
                  }`}>
                    {viewMode === "table" ? "Table" : "List"}
                  </div>
                </div> */}
              </div>
            </div>

            {/* Songs List - Properly constrained */}
            <div className="space-y-1 px-2 py-1" style={{ maxWidth: "100%" }}>
              {visibleSongs.map((song, index) => (
                <SongRow
                  key={`${song.id}-${visibleItems.startIndex + index}`}
                  song={song}
                  onSingleClick={onSingleClick}
                  onDoubleClick={onDoubleClick}
                  isTable={viewMode === "table"}
                  localTheme={localTheme}
                  selectedSong={selectedSong}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VirtualSongList.displayName = "VirtualSongList";

export default VirtualSongList;
