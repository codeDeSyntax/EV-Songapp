import React, { useState } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setSlides,
  setSongTitle,
  setCurrentSongId,
} from "@/store/slices/songSlidesSlice";
import { openDeleteConfirmModal } from "@/store/slices/uiSlice";
import { parseLyrics } from "../utils/lyricsParser";
import { Song } from "@/types";
import { Trash2 } from "lucide-react";
import { HistoryPanel } from "./HistoryPanel";

interface PrelistPanelProps {
  isDarkMode: boolean;
}

export const PrelistPanel: React.FC<PrelistPanelProps> = ({ isDarkMode }) => {
  const dispatch = useAppDispatch();
  const songs = useAppSelector((state) => state.songs.songs);
  const prelistedSongs = songs.filter((song) => song.isPrelisted);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  const handleSongClick = (song: Song) => {
    // Backend now provides decoded slides directly
    const slides = song.slides || [];
    dispatch(setSlides(slides));
    // Set the actual saved title (overrides auto-generated title from setSlides)
    dispatch(setSongTitle(song.title));
    // Track which song is currently loaded
    dispatch(setCurrentSongId(song.id));
    // Ensure selectedSong in Redux is updated (for TitleBar language display)
    dispatch({ type: "songs/setSelectedSong", payload: song });
  };

  const handleDeleteClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    dispatch(openDeleteConfirmModal({ song, type: "prelist" }));
  };

  return (
    <div
      // isDarkMode={isDarkMode}
      className="h-full rounded-2xl flex flex-row gap-2 px-2 py-1 bg-white/50 dark:bg-app-surface"
      style={{
        border: "none",
        // width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <div className="h-full w-full flex flex-row gap-3">
        {/* Left Half - Prelist */}
        <div className="w-[68%] flex  flex-col border-r border-app-border p-2 bg-transparent  rounded-2xl">
          <div className="p-2 border-b border-app-border flex items-center justify-between flex-shrink-0">
            <span className="text-app-text font-semibold text-sm">Prelist</span>
            <span className="text-app-text-muted text-xs">
              {prelistedSongs.length} song
              {prelistedSongs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="f overflow-y-auto  p-2 no-scrollbar flex items-center justify-center">
            {prelistedSongs.length === 0 ? (
              <div className="flex flex-col items-center  justify-center h-full text-center gap-2">
                <img
                  src="./no_files.svg"
                  alt="No songs"
                  className="w-16 h-16 opacity-50"
                />
                <div>
                  <p className="text-app-text-muted text-xs">
                    No songs in prelist
                  </p>
                  <p className="text-app-text-muted text-[10px] mt-1">
                    Click the blue button to add
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {prelistedSongs.map((song) => {
                  const firstSlide = song.slides?.[0];
                  const slideContent =
                    typeof firstSlide === "string"
                      ? firstSlide
                      : firstSlide?.content || "";
                  return (
                    <div
                      key={song.id}
                      onClick={() => handleSongClick(song)}
                      onMouseEnter={() => setHoveredSong(song.id)}
                      onMouseLeave={() => setHoveredSong(null)}
                      className="cursor-pointer bg-app-bg hover:border-blue-500 transition-all rounded-2xl overflow-hidden group relative"
                      style={{
                        border: "1px solid var(--app-border)",
                        aspectRatio: "16/9",
                      }}
                    >
                      {/* Mini Preview Screen */}
                      <div className="w-full h-full bg-black flex items-center justify-center p-2 relative">
                        <div className="text-white text-center text-[10px] leading-tight overflow-hidden">
                          {slideContent.split("\n").slice(0, 4).join("\n")}
                        </div>

                        {/* Delete button overlay */}
                        {hoveredSong === song.id && (
                          <div
                            onClick={(e) => handleDeleteClick(e, song)}
                            className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 rounded p-1 transition-all"
                            title="Remove from prelist"
                          >
                            <Trash2 className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Title bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black p-1.5">
                        <span className="text-[12px] font-medium text-white truncate block">
                          {song.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Half - Projection History */}
        <div className="w-[32%] flex flex-col p-2 bg-app-bg rounded-2xl ">
          <HistoryPanel isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};
