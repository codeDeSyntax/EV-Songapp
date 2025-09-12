import React, { useCallback } from "react";
import { Song } from "@/types";
import { Calendar, FileAudio2, Music } from "lucide-react";

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
          className={`border-b z-0 border-stone-200 shadow rounded-md mt-1 flex items-center justify-between transition-colors cursor-pointer ${
            isSelected ? "bg-stone-100" : "hover:bg-stone-100"
          }`}
          // style={{
          //   borderBottomWidth: 1,
          //   borderBottomColor: "#9a674a",
          //   borderBottomStyle: "dashed",
          // }}
          title={song.path}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <td
            className="px-4 py-1  flex items-center justify-center gap-2 text-stone-600 text-[11px] font-medium"
            style={{ fontFamily: "Georgia" }}
          >
            <FileAudio2 className="w-5 h-5 text-primary" />
            {song.title.charAt(0).toUpperCase() +
              song.title.slice(1).toLowerCase()}
          </td>
          <td className="px-4 py-1 text-stone-800 text-[10px] font-serif">
            {song.dateModified.slice(0, 10)}
          </td>
        </tr>
      );
    }

    // Modern List Item Design - Ultra compact version
    return (
      <div
        className="group pr-0.5 relative w-full overflow-hidden rounded transition-all duration-150 cursor-pointer transform hover:scale-[1.002] hover:shadow-sm"
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
          className={`absolute inset-0 bg-gradient-to-r from-amber-50/15 via-transparent to-amber-50/15 transition-opacity duration-150 ${
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        ></div>

        {/* Content - Ultra compact layout */}
        <div className="relative px-1.5 py-1 w-full">
          <div className="flex items-center justify-between w-full min-w-0">
            {/* Left Section - Song Info (flex-1 with min-width-0 for proper truncation) */}
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
              <div className="flex1 min-w-0">
                <h3
                  className="text-xs font-medium truncate group-hover:text-amber-700 transition-colors leading-none"
                  style={{
                    fontFamily: "Georgia",
                    color: localTheme === "creamy" ? "#92400e" : "#374151",
                  }}
                  title={song.title + " " + song.dateModified} // Show full title on hover
                >
                  {song.title}
                </h3>
                {/* Ultra compact subtitle */}
                <span
                  className="text-[10px] font-medium whitespace-nowrap block mt-0.5"
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

        {/* Bottom accent line - thinner */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-px transition-transform duration-150 origin-left ${
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
