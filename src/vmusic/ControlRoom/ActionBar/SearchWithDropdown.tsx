import React, { useState, useRef, useEffect } from "react";
import { Search, Radio, Trash2, X } from "lucide-react";
import { Song } from "@/types";
import { GamyCard } from "../../shared/GamyCard";
import { motion, AnimatePresence } from "framer-motion";
import { DepthSurface } from "@/shared/DepthButton";

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
  const [searchTerm, setSearchTerm] = useState(
    () => localStorage.getItem("lastSearchTerm") || ""
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [letterFilter, setLetterFilter] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Persist search term to localStorage
  useEffect(() => {
    localStorage.setItem("lastSearchTerm", searchTerm);
  }, [searchTerm]);

  // On mount, auto-select the input text if there is a last search
  useEffect(() => {
    if (inputRef.current && searchTerm) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Filter songs based on search query (only after Enter is pressed)
  let filteredSongs = searchQuery.trim()
    ? songs.filter((song) => {
        const lowerQuery = searchQuery.toLowerCase();
        const titleMatch = song.title.toLowerCase().includes(lowerQuery);

        // Search in decoded slides content if available
        const contentMatch =
          song.slides && song.slides.length > 0
            ? song.slides.some((slide) =>
                slide.content.toLowerCase().includes(lowerQuery)
              )
            : song.content.toLowerCase().includes(lowerQuery);

        return titleMatch || contentMatch;
      })
    : [];

  // Apply letter filter if set
  if (letterFilter) {
    filteredSongs = filteredSongs.filter((song) =>
      song.title.toLowerCase().startsWith(letterFilter.toLowerCase())
    );
  }

  // Reset selected index when filtered songs change
  useEffect(() => {
    if (filteredSongs.length > 0) {
      setSelectedIndex(0);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [filteredSongs.length]);

  // Global keyboard handler for alphabet filtering when dropdown is open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if dropdown is open and input is not focused
      if (!showDropdown || document.activeElement === inputRef.current) {
        return;
      }

      // Ignore events that originated from the input (prevents immediate selection after search)
      if (e.target === inputRef.current) {
        return;
      }

      // Handle arrow keys for navigation
      if (e.key === "ArrowDown" && filteredSongs.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSongs.length);
      } else if (e.key === "ArrowUp" && filteredSongs.length > 0) {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredSongs.length) % filteredSongs.length
        );
      } else if (e.key === "Enter" && filteredSongs.length > 0) {
        // Select the currently highlighted song
        e.preventDefault();
        e.stopPropagation(); // Prevent ControlRoom handler from catching this
        if (onSelectSong && filteredSongs[selectedIndex]) {
          onSelectSong(filteredSongs[selectedIndex]);
          setShowDropdown(false);
        }
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        // Check if it's a single alphabet key (a-z or A-Z)
        e.preventDefault();
        setLetterFilter(e.key);
        setSelectedIndex(0);
      } else if (e.key === "Backspace" || e.key === "Escape") {
        e.preventDefault();
        setLetterFilter("");
        setSelectedIndex(0);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showDropdown, filteredSongs, selectedIndex, onSelectSong]);

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
      e.stopPropagation(); // Prevent ControlRoom handler from catching this
      // If dropdown is showing and there's a selected song, load it
      if (
        showDropdown &&
        filteredSongs.length > 0 &&
        filteredSongs[selectedIndex]
      ) {
        if (onSelectSong) {
          onSelectSong(filteredSongs[selectedIndex]);
          setShowDropdown(false);
          // Do NOT clear the search term or updateSearchQuery here
        }
      } else {
        // Otherwise, trigger search and blur input to enable letter filtering
        handleSearch();
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setSearchTerm("");
      updateSearchQuery("");
      setShowDropdown(false);
      // Blur the input
      inputRef.current?.blur();
    } else if (
      e.key === "ArrowDown" &&
      showDropdown &&
      filteredSongs.length > 0
    ) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredSongs.length);
    } else if (
      e.key === "ArrowUp" &&
      showDropdown &&
      filteredSongs.length > 0
    ) {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredSongs.length) % filteredSongs.length
      );
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    updateSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-md search-dropdown-container">
      {/* Search Input */}
      <DepthSurface className="relative rounded-full">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-app-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search songs... (Press Enter)"
          className="w-full pl-8 pr-8 py-1.5 rounded-3xl border-none border-app-border focus:outline-none focus:ring-1 focus:ring-app-surface-hover text-ew-xs bg-white/20 dark:bg-app-bg text-app-text placeholder:text-app-text-muted"
          spellCheck={false}
          autoFocus={!!searchTerm}
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-app-text-muted hover:text-app-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </DepthSurface>

      {/* Dropdown Results with Animation */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full w-[80%] left-0 right-0 mt-1 z-[9999] max-h-[80vh] min-h-[60vh] overflow-y-auto no-scrollbar bg-white dark:bg-app-bg border border-app-border rounded-lg  p-1"
          >
            <GamyCard
              isDarkMode={isDarkMode}
              // transparent={true}
              className="h-[70vh] "
              style={{ boxShadow: "none" }}
            >
              {/* Letter Filter Indicator */}
              {letterFilter && (
                <div className="px-3 py-1 mb-2 bg-app-blue/10 border border-app-blue rounded-lg flex items-center justify-between">
                  <span className="text-ew-xs text-app-text">
                    Filtering by:{" "}
                    <span className="font-bold uppercase">{letterFilter}</span>
                  </span>
                  <button
                    onClick={() => setLetterFilter("")}
                    className="text-app-text-muted hover:text-app-text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {filteredSongs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-8 flex flex-col  items-center justify-center text-center text-app-text-muted text-ew-xs col-span-2"
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
                <div className="flex justify-between gap-2 h-full no-scrollbar">
                  {/* Song List - Left Column */}
                  <div className="w-[50%] h-full overflow-y-auto no-scrollbar">
                    <div className="space-y-1">
                      {filteredSongs.map((song, index) => (
                        <motion.div
                          key={song.path}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.2 }}
                          onClick={() => {
                            if (onSelectSong) {
                              onSelectSong(song);
                              setShowDropdown(false);
                              // Do NOT clear the search term or updateSearchQuery here
                              // inputRef.current?.blur(); // Optionally keep focus
                            }
                          }}
                        >
                          <GamyCard
                            isDarkMode={isDarkMode}
                            className={`cursor-pointer px-2 py-0 transition-colors  shadow rounded-none ${
                              selectedIndex === index
                                ? "bg-app-surface dark:bg-black text-white border-app-blue"
                                : "hover:bg-app-surface-hover bg-[#e6e6e6] dark:bg-app-surface border-app-border text-app-text"
                            }`}
                            style={{
                              boxShadow: "none",
                              borderRadius: "100px",
                              border: "none",
                            }}
                          >
                            <div
                              className="flex items-center gap-2"
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              <span
                                className={`text-ew-sm font-medium  truncate block ${
                                  selectedIndex === index ? "text-white " : ""
                                }`}
                              >
                                {song.title}
                              </span>
                            </div>
                          </GamyCard>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {/* Lyrics Preview - Right Column */}
                  <div className="flex- w-[50%] h-full overflow-y-auto ">
                    <GamyCard
                      isDarkMode={isDarkMode}
                      className="h-full p-3 app "
                      style={{ border: "none" }}
                    >
                      {filteredSongs[selectedIndex] && (
                        <motion.div
                          key={filteredSongs[selectedIndex].path}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <h3 className="text-ew-sm font-semibold text-app-text-muted mb-2">
                            {filteredSongs[selectedIndex].title}
                          </h3>
                          <div className="text-ew-xs text-app-text whitespace-pre-wrap leading-relaxed">
                            {filteredSongs[selectedIndex].slides &&
                            filteredSongs[selectedIndex].slides!.length > 0
                              ? filteredSongs[selectedIndex]
                                  .slides!.map((slide, idx) => slide.content)
                                  .join("\n\n")
                              : filteredSongs[selectedIndex].content}
                          </div>
                        </motion.div>
                      )}
                    </GamyCard>
                  </div>
                </div>
              )}
            </GamyCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
