import React, { useState, useRef, useEffect } from "react";
import { Search, Edit3, Radio, Trash2, X } from "lucide-react";
import { Song } from "@/types";
import { GamyCard } from "../../shared/GamyCard";

interface SearchWithDropdownProps {
  searchQuery: string;
  updateSearchQuery: (query: string) => void;
  songs: Song[];
  onEdit?: (song: Song) => void;
  onPresent?: (song: Song) => void;
  onDelete?: (song: Song) => void;
  isDarkMode: boolean;
}

export const SearchWithDropdown: React.FC<SearchWithDropdownProps> = ({
  searchQuery,
  updateSearchQuery,
  songs,
  onEdit,
  onPresent,
  onDelete,
  isDarkMode,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter songs based on search query
  const filteredSongs = searchQuery.trim()
    ? songs.filter((song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Show dropdown when there's a search query
  useEffect(() => {
    setShowDropdown(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearSearch = () => {
    updateSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-app-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => updateSearchQuery(e.target.value)}
          placeholder="Search songs..."
          className="w-full pl-8 pr-8 py-1.5 rounded-3xl border-none border-app-border focus:outline-none focus:ring-1 focus:ring-app-surface-hover text-ew-xs bg-app-bg text-app-text placeholder:text-app-text-muted"
          spellCheck={false}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-app-text-muted hover:text-app-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto no-scrollbar bg-app-surface border border-app-border rounded-lg shadow-lg p-1"
        >
          <GamyCard isDarkMode={isDarkMode} transparent={true}>
            {filteredSongs.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center text-app-text-muted text-ew-xs col-span-2">
                <img
                  src="./no_files.svg"
                  alt="No Results"
                  className="mx-auto mb-3 w-16 h-16 opacity-50"
                />
                <p className="font-medium">No songs found</p>
                <p className="text-ew-2xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredSongs.map((song) => (
                  <GamyCard
                    key={song.path}
                    isDarkMode={isDarkMode}
                    className="cursor-pointer px-2 py-1"
                  >
                    <div
                      className="flex items-center justify-between gap-2"
                      onMouseEnter={() => setHoveredSong(song.path)}
                      onMouseLeave={() => setHoveredSong(null)}
                    >
                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-ew-sm font-medium text-app-text truncate block">
                          {song.title}
                        </span>
                      </div>
                    </div>
                  </GamyCard>
                ))}
              </div>
            )}
          </GamyCard>
        </div>
      )}
    </div>
  );
};
