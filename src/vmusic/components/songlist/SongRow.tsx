import React, { useCallback } from "react";
import { Song } from "@/types";
import { Calendar, Music } from "lucide-react";

interface SongRowProps {
  song: Song;
  onSingleClick: (song: Song) => void;
  onDoubleClick: (song: Song) => void;
  isTable: boolean;
  localTheme: string;
  selectedSong?: Song | null;
}

const SongRow = React.memo(
  ({
    song,
    onSingleClick,
    onDoubleClick,
    isTable,
    localTheme,
    selectedSong,
  }: SongRowProps) => {
    const isSelected = selectedSong?.id === song.id;
    const handleClick = useCallback(
      () => onSingleClick(song),
      [song, onSingleClick]
    );
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick(song);
      },
      [song, onDoubleClick]
    );

    if (isTable) {
      return (
        <tr
          className={`border-b z-0 border-stone-200 shadowinner flex items-center justify-between transition-colors cursor-pointer ${
            isSelected ? "bg-stone-100" : "hover:bg-stone-100"
          }`}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#9a674a",
            borderBottomStyle: "dashed",
          }}
          title={song.path}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <td
            className="px-4 py-2 flex items-center justify-center gap-2 text-stone-600 text-[11px] font-medium"
            style={{ fontFamily: "Georgia" }}
          >
            <img src="./music2.png" className="w-4 h-4" alt="PDF icon" />
            {song.title.charAt(0).toUpperCase() +
              song.title.slice(1).toLowerCase()}
          </td>
          <td className="px-4 py-1 text-stone-800 text-[10px] font-serif">
            {song.dateModified.slice(0, 10)}
          </td>
        </tr>
      );
    }

    // Modern List Item Design - Fixed for proper responsive behavior
    return (
      <div
        className="group pr-2 relative w-full overflow-hidden rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.01] hover:shadow-md"
        style={{
          backgroundColor: isSelected
            ? localTheme === "creamy"
              ? "#faf5e4"
              : "#f8fafc" // Selected background - lighter version of hover
            : localTheme === "creamy"
            ? "#fdf4d0"
            : "#ffffff",
          border: `1px solid ${
            isSelected
              ? localTheme === "creamy"
                ? "#e5d5b7"
                : "#e2e8f0" // Selected border - more prominent
              : localTheme === "creamy"
              ? "#f3e8d0"
              : "#f1f5f9"
          }`,
          maxWidth: "100%", // Ensure it doesn't exceed container width
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
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Subtle gradient overlay - always visible when selected, on hover when not selected */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-amber-50/30 via-transparent to-amber-50/30 transition-opacity duration-300 ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        ></div>

        {/* Content - Fixed layout for responsive behavior */}
        <div className="relative px-3 py-2.5 w-full">
          <div className="flex items-center justify-between w-full min-w-0">
            {/* Left Section - Song Info (flex-1 with min-width-0 for proper truncation) */}
            <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-3">
              {/* Compact Icon */}
              <div className="flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm"
                  style={{
                    background:
                      localTheme === "creamy"
                        ? "linear-gradient(135deg, #48330d 0%, #d97706 100%)"
                        : "linear-gradient(135deg, #faeed1 0%, #fffcef 100%)",
                  }}
                >
                  <img src="./music1.png" className="w-4 h-4" alt="PDF icon" />
                </div>
              </div>

              {/* Song Title - Properly constrained */}
              <div className="flex1 min-w-0">
                <h3
                  className="text-xs font-medium truncate group-hover:text-amber-700 transition-colors leading-tight"
                  style={{
                    fontFamily: "Georgia",
                    color: localTheme === "creamy" ? "#92400e" : "#374151",
                  }}
                  title={song.title + " " + song.dateModified} // Show full title on hover
                >
                  {song.title}
                </h3>
                {/* Compact subtitle */}
                {/* <p className="text-[10px] text-gray-500 truncate mt-0.5" title={song.path}>
                  {song.path.split('\\').pop()?.replace('.txt', '') || 'Unknown'}
                </p> */}
                <span
                  className="text-[10px] font-medium whitespac-nowrap"
                  style={{
                    color: localTheme === "creamy" ? "#a16207" : "#6b7280",
                  }}
                >
                  {new Date(song.dateModified).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent line - always visible when selected, on hover when not selected */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-left ${
            isSelected
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
  }
);

SongRow.displayName = "SongRow";

export default SongRow;
