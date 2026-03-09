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
import { NeuralNetworkBackground } from "./NeuralNetworkBackground";

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
    <div className="h-full rounded-xl bg-white/50 dark:bg-app-surface relative overflow-hidden flex">
      {/* Neural Network Canvas Background */}
      <NeuralNetworkBackground isDarkMode={isDarkMode} opacity={0.25} />

      <div className="h-full w-full flex relative z-10">
        {/* ── Left: Prelist ── */}
        <div className="flex-1 flex flex-col border-r border-app-border min-w-0">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-app-border flex items-center justify-between flex-shrink-0">
            <span className="text-app-text font-semibold text-ew-sm tracking-wide">
              Prelist
            </span>
            <span className="text-app-text-muted text-ew-xs tabular-nums">
              {prelistedSongs.length}{" "}
              {prelistedSongs.length === 1 ? "song" : "songs"}
            </span>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-2.5">
            {prelistedSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 px-4">
                <img
                  src="./no_files.svg"
                  alt=""
                  className="w-12 h-12 opacity-35"
                />
                <p className="text-app-text-muted text-ew-xs">
                  No songs in prelist
                </p>
                <p className="text-app-text-muted text-[10px]">
                  Use the blue button to add songs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 xl:grid-cols-4">
                {prelistedSongs.map((song) => {
                  const firstSlide = song.slides?.[0];
                  const slideContent =
                    typeof firstSlide === "string"
                      ? firstSlide
                      : firstSlide?.content || "";
                  const isHovered = hoveredSong === song.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => handleSongClick(song)}
                      onMouseEnter={() => setHoveredSong(song.id)}
                      onMouseLeave={() => setHoveredSong(null)}
                      className={`cursor-pointer rounded-xl overflow-hidden relative transition-all duration-150 ring-1 ${
                        isHovered
                          ? "ring-app-accent shadow-lg scale-[1.02]"
                          : "ring-app-border opacity-90 hover:opacity-100"
                      }`}
                      style={{ aspectRatio: "16/9" }}
                    >
                      {/* Mini preview */}
                      <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center p-2">
                        <p
                          className="text-white/75 text-center text-[9px] leading-relaxed whitespace-pre-wrap line-clamp-4"
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
                        >
                          {slideContent.split("\n").slice(0, 5).join("\n")}
                        </p>
                      </div>

                      {/* Bottom title gradient */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-5 pb-1.5 px-2">
                        <span className="text-[10px] font-semibold text-white truncate block leading-tight">
                          {song.title}
                        </span>
                      </div>

                      {/* Delete button — fades in on hover via CSS */}
                      <button
                        onClick={(e) => handleDeleteClick(e, song)}
                        title="Remove from prelist"
                        className={`absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center rounded bg-red-500/90 hover:bg-red-600 transition-all duration-150 ${
                          isHovered
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-75 pointer-events-none"
                        }`}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Projection History ── */}
        <div className="w-[28%] flex-shrink-0 flex flex-col min-w-[160px]">
          <HistoryPanel isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};
