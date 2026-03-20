import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Search, Music } from "lucide-react";
import { Song } from "@/types";
import { DepthButton, DepthSurface } from "@/shared/DepthButton";
import { motion, AnimatePresence } from "framer-motion";

interface AllSongsViewProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

// Memoized song item - prevent re-renders on unrelated updates
const SongItem = React.memo<{
  song: Song;
  index: number;
  columnIndex: number;
  itemsPerColumn: number;
  onSelectSong: (song: Song) => void;
}>(({ song, index, columnIndex, itemsPerColumn, onSelectSong }) => (
  <motion.div
    key={song.id}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.15 }}
    onClick={() => onSelectSong(song)}
    className="cursor-pointer bg-transparent border-none w-full text-left px-3 py-1 mt-1 shadow-app-accent dark:shadow-black/50 rounded-md text-sm text-app-text hover:bg-app-hover transition-colors group flex items-center gap-2"
  >
    <motion.div
      className="flex-shrink-0 w-5 h-5 rounded-full bg-app-bg flex items-center justify-center group-hover:bg-app-border group-hover:text-white transition-colors"
      whileHover={{ scale: 1.15 }}
    >
      <span className="text-[10px] font-medium">
        {columnIndex * itemsPerColumn + index + 1}
      </span>
    </motion.div>
    <motion.span
      className="truncate group-hover:font-bold transition-colors"
      whileHover={{ x: 4 }}
    >
      {song.title}
    </motion.span>
    <motion.span className="ml-2 text-xs text-app-text-muted font-semibold">
      {song.language || "English"}
    </motion.span>
  </motion.div>
));

SongItem.displayName = "SongItem";

// Virtual scrolling column - only renders visible items
const VirtualColumn = React.memo<{
  column: Song[];
  columnIndex: number;
  itemsPerColumn: number;
  onSelectSong: (song: Song) => void;
}>(({ column, columnIndex, itemsPerColumn, onSelectSong }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 25 });
  const ITEM_HEIGHT = 32; // approximate height of each song item
  const OVERSCAN = 5; // render 5 items beyond visible area for smoother scrolling

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, clientHeight } = scrollRef.current;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const end = Math.min(
      column.length,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN,
    );

    setVisibleRange({ start, end });
  }, [column.length]);

  const visibleItems = column.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <motion.div
      layout
      className="overflow-y-auto no-scrollbar border-r border-app-border last:border-r-0 pr-1"
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ height: "100%" }}
    >
      <div
        style={{ height: column.length * ITEM_HEIGHT, position: "relative" }}
      >
        <motion.div
          style={{ transform: `translateY(${offsetY}px)` }}
          className="absolute top-0 left-0 right-0"
        >
          {visibleItems.map((song, index) => (
            <SongItem
              key={song.id}
              song={song}
              index={visibleRange.start + index}
              columnIndex={columnIndex}
              itemsPerColumn={itemsPerColumn}
              onSelectSong={onSelectSong}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
});

VirtualColumn.displayName = "VirtualColumn";

export const AllSongsView: React.FC<AllSongsViewProps> = ({
  songs,
  onSelectSong,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("All");

  const filteredSongs = useMemo(() => {
    let filtered = songs.filter((song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (languageFilter !== "All") {
      filtered = filtered.filter(
        (song) => (song.language || "English") === languageFilter,
      );
    }

    return filtered.sort((a, b) => {
      const langA = (a.language || "English").localeCompare(
        b.language || "English",
      );
      if (langA !== 0) return langA;
      return a.title.localeCompare(b.title);
    });
  }, [songs, searchQuery, languageFilter]);

  const columnCount = 4;
  const itemsPerColumn = Math.ceil(filteredSongs.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, index) =>
    filteredSongs.slice(index * itemsPerColumn, (index + 1) * itemsPerColumn),
  );

  return (
    <div className="h-full w-full bg-app-surface dark:bg-black rounded-xl border border-app-border overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-app-border flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-fit">
            <Music className="w-4 h-4 text-app-text-muted" />
            <h3 className="text-sm font-semibold text-app-text">All Songs</h3>
            <motion.span
              className="text-xs text-app-text-muted"
              key={filteredSongs.length}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              ({filteredSongs.length})
            </motion.span>
          </div>

          <DepthButton className="flex- w-60  relative rounded-full p-5">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-transparent border-none border-app-border rounded-md text-app-text placeholder-app-text-muted focus:outline-none "
            />
          </DepthButton>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="h-8 px-2 text-xs rounded-md border border-app-border bg-app-bg text-app-text focus:outline-none"
          >
            <option value="All">All</option>
            <option value="English">English</option>
            <option value="Twi">Twi</option>
            <option value="Ga">Ga</option>
            <option value="Ewe">Ewe</option>
          </select>
        </div>

        <div className="flex-1 p-3 overflow-hidden">
          <AnimatePresence mode="wait">
            {filteredSongs.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex items-center justify-center text-sm text-app-text-muted"
              >
                No songs found
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-4 gap-3 h-full"
              >
                {columns.map((column, columnIndex) => (
                  <VirtualColumn
                    key={columnIndex}
                    column={column}
                    columnIndex={columnIndex}
                    itemsPerColumn={itemsPerColumn}
                    onSelectSong={onSelectSong}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
