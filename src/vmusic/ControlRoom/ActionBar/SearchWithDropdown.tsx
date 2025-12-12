import React, { useState, useRef, useEffect } from "react";
import { Search, Radio, Trash2, X } from "lucide-react";
import { Song } from "@/types";
import { GamyCard } from "../../shared/GamyCard";
import { motion, AnimatePresence } from "framer-motion";

interface SearchWithDropdownProps {
  searchQuery: string;
  updateSearchQuery: (query: string) => void;
  songs: Song[];
  onPresent?: (song: Song) => void;
  onDelete?: (song: Song) => void;
  onSelectSong?: (song: Song) => void;
  isDarkMode: boolean;
}

export const SearchWithDropdown: React.FC<SearchWithDropdownProps> = ({
  searchQuery,
  updateSearchQuery,
  songs,
  onPresent,
  onDelete,
  onSelectSong,
  isDarkMode,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter songs based on search query (only after Enter is pressed)
  const filteredSongs = searchQuery.trim()
    ? songs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

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

  const handleSearch = () => {
    if (searchTerm.trim()) {
      updateSearchQuery(searchTerm);
      setShowDropdown(true);
    } else {
      updateSearchQuery("");
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setSearchTerm("");
      updateSearchQuery("");
      setShowDropdown(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search songs... (Press Enter)"
          className="w-full pl-8 pr-8 py-1.5 rounded-3xl border-none border-app-border focus:outline-none focus:ring-1 focus:ring-app-surface-hover text-ew-xs bg-app-bg text-app-text placeholder:text-app-text-muted"
          spellCheck={false}
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-app-text-muted hover:text-app-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Results with Animation */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-1 z-[9999] max-h-80 overflow-y-auto no-scrollbar bg-app-bg border border-app-border rounded-lg  p-1"
          >
            <GamyCard
              isDarkMode={isDarkMode}
              transparent={true}
              style={{ boxShadow: "none" }}
            >
              {filteredSongs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-8 flex flex-col items-center justify-center text-center text-app-text-muted text-ew-xs col-span-2"
                >
                  <img
                    src="./no_files.svg"
                    alt="No Results"
                    className="mx-auto mb-3 w-16 h-16 opacity-50"
                  />
                  <p className="font-medium">No songs found</p>
                  <p className="text-ew-2xs mt-1">
                    Try a different search term
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredSongs.map((song, index) => (
                    <motion.div
                      key={song.path}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => {
                        if (onSelectSong) {
                          onSelectSong(song);
                          setShowDropdown(false);
                          setSearchTerm("");
                          updateSearchQuery("");
                        }
                      }}
                    >
                      <GamyCard
                        isDarkMode={isDarkMode}
                        className="cursor-pointer px-2 py-0.5 hover:bg-app-surface-hover transition-colors"
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
                    </motion.div>
                  ))}
                </div>
              )}
            </GamyCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
