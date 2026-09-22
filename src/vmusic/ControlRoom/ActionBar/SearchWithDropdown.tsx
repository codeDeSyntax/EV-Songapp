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

  // Filter songs based on search query (memoized to prevent heavy re-filtering on every render)
  const filteredSongs = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();

    let results = songs.filter((song) => {
      const titleMatch = song.title.toLowerCase().includes(lowerQuery);
      if (titleMatch) return true;

      // Search in decoded slides content if available (skip raw base64 content)
      return song.slides && song.slides.length > 0
        ? song.slides.some((slide) =>
            slide.content.toLowerCase().includes(lowerQuery),
          )
        : false;
    });

    if (letterFilter) {
      const lowerLetter = letterFilter.toLowerCase();
      results = results.filter((song) =>
        song.title.toLowerCase().startsWith(lowerLetter),
      );
    }

    return results;
  }, [searchQuery, songs, letterFilter]);

  // Cap displayed dropdown items to 50 for smooth animations and instant rendering
  const displayedSongs = React.useMemo(
    () => filteredSongs.slice(0, 50),
    [filteredSongs],
  );

  // Reset selected index when filtered songs change
  useEffect(() => {
    if (displayedSongs.length > 0) {
      setSelectedIndex(0);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [displayedSongs.length]);

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
    <div className="relative w-full search-dropdown-container">
      {/* Search Input */}
      <div className="relative flex items-center w-full group">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40 group-focus-within:text-black/70 dark:group-focus-within:text-white/70 transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search songs…"
          className="w-full h-7 pl-8 pr-14 rounded-full text-[11.5px] font-normal border border-transparent bg-black/[0.05] hover:bg-black/[0.08] focus:bg-black/[0.09] dark:bg-white/[0.05] dark:hover:bg-white/[0.08] dark:focus:bg-white/[0.10] text-gray-900 dark:text-gray-100 placeholder:text-black/40 dark:placeholder:text-white/35 focus:outline-none focus:border-black/[0.22] dark:focus:border-white/[0.20] transition-all duration-150"
          style={{ outline: "none", caretColor: "var(--app-text)" }}
          spellCheck={false}
          autoFocus={!!searchTerm}
        />
        {searchTerm ? (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-mono tracking-tight px-1.5 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-black/40 dark:text-white/35 bg-black/[0.04] dark:bg-white/[0.05] select-none leading-none">
            ↵ Enter
          </kbd>
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
            className="absolute top-full w-[380px] max-w-[80vw] left-0 -translate-x-1/2 mt-1 z-[9999] max-h-[80vh] min-h-[60vh] overflow-hidden bg-white dark:bg-app-bg border border-app-border rounded-xl shadow-2xl p-1.5"
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
                  <div className="w-[42%] h-full overflow-y-auto no-scrollbar flex-shrink-0">
                    <div className="space-y-1">
                      {displayedSongs.map((song, index) => (
                        <motion.div
                          key={song.path}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: Math.min(index * 0.015, 0.15),
                            duration: 0.15,
                          }}
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
                  <div className="w-[58%] h-full overflow-y-auto overflow-x-auto no-scrollbar flex-1">
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
                          <h3 className="text-ew-sm font-semibold text-app-text-muted mb-2 truncate">
                            {filteredSongs[selectedIndex].title}
                          </h3>
                          <div className="text-ew-xs text-app-text whitespace-pre leading-relaxed">
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
