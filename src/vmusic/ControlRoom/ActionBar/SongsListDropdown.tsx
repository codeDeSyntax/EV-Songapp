import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, Search, Music } from "lucide-react";
import { Song } from "@/types";

interface SongsListDropdownProps {
  songs: Song[];
  isDarkMode: boolean;
  onSelectSong: (song: Song) => void;
  onClose: () => void;
}

export const SongsListDropdown: React.FC<SongsListDropdownProps> = ({
  songs,
  isDarkMode,
  onSelectSong,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Filter and sort songs by language and title
  const filteredSongs = useMemo(() => {
    let filtered = songs.filter((song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (languageFilter !== "All") {
      filtered = filtered.filter(
        (song) => (song.language || "English") === languageFilter
      );
    }
    // Sort by language, then title
    return filtered.sort((a, b) => {
      const langA = (a.language || "English").localeCompare(
        b.language || "English"
      );
      if (langA !== 0) return langA;
      return a.title.localeCompare(b.title);
    });
  }, [songs, searchQuery, languageFilter]);

  // Split songs into 5 columns
  const columnCount = 5;
  const itemsPerColumn = Math.ceil(filteredSongs.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, i) =>
    filteredSongs.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
  );

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[95vw] max-w-7xl bg-app-surface border border-app-border rounded-lg shadow-2xl z-[9999] overflow-hidden"
      style={{
        maxHeight: "80vh",
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-app-surface border-b border-app-border p-4 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3 flex-1">
          <Music className="w-5 h-5 text-app-text-muted" />
          <h3 className="text-app-text font-semibold text-base">
            Song Library
            <span className="ml-2 text-sm text-app-text-muted font-normal">
              ({filteredSongs.length}{" "}
              {filteredSongs.length === 1 ? "song" : "songs"})
            </span>
          </h3>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="language-filter"
            className="text-xs text-app-text-muted"
          >
            Language:
          </label>
          <select
            id="language-filter"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="h-8 px-2 text-xs rounded border border-app-border/30 bg-app-surface text-app-text focus:outline-none"
          >
            <option value="All">All</option>
            <option value="English">English</option>
            <option value="Twi">Twi</option>
            <option value="Ga">Ga</option>
            <option value="Ewe">Ewe</option>
          </select>
        </div>

        {/* Search Box */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="w-full pl-10  pr-4 py-2 bg-app-bg border-none border-app-border rounded-lg text-sm text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-border"
          />
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-app-hover rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-app-text-muted hover:text-app-text" />
        </button>
      </div>

      {/* Song Columns */}
      <div
        className="p-4"
        style={{
          height: "calc(95vh - 80px)",
        }}
      >
        {filteredSongs.length === 0 ? (
          <div className="text-center py-12 text-app-text-muted flex flex-col items-center justify-center">
            <img
              src="./error_bug.svg"
              alt="empty"
              className="h-40 animate-bounce "
            />
            No songs found
          </div>
        ) : (
          <div
            className="grid grid-cols-5 gap-5"
            style={{ height: "calc(95vh - 120px)" }}
          >
            {columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="space-y-1 overflow-y-auto no-scrollbar  border-app-border border-r-2 border-y-0 border-l-0 "
              >
                {column.map((song, index) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      onSelectSong(song);
                      onClose();
                    }}
                    className=" bg-app-surface border-none w-full text-left px-3 py-1 mt-1 shadow shadow-app-accent dark:shadow-black/50 rounded-md text-sm text-app-text hover:bg-app-hover transition-colors group flex items-center gap-2"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-app-bg flex items-center justify-center group-hover:bg-app-border group-hover:text-white transition-colors">
                      <span className="text-[10px] font-medium">
                        {columnIndex * itemsPerColumn + index + 1}
                      </span>
                    </div>
                    <span className="truncate group-hover:font-bold transition-colors">
                      {song.title}
                    </span>
                    <span className="ml-2 text-xs text-app-text-muted font-semibold">
                      {song.language || "English"}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-app-surface border-t border-app-border px-4 py-2 flex items-center justify-between text-xs text-app-text-muted">
        <div>
          <kbd className="px-2 py-1 bg-app-bg border border-app-border rounded text-[10px]">
            Esc
          </kbd>{" "}
          to close
        </div>
        <div>Click on a song to select and present</div>
      </div>
    </div>
  );
};
