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

interface PrelistPanelProps {
  isDarkMode: boolean;
}

export const PrelistPanel: React.FC<PrelistPanelProps> = ({ isDarkMode }) => {
  const dispatch = useAppDispatch();
  const songs = useAppSelector((state) => state.songs.songs);
  const prelistedSongs = songs.filter((song) => song.isPrelisted);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  const handleSongClick = (song: Song) => {
    const parsed = parseLyrics(song.content);
    dispatch(setSlides(parsed.slides));
    // Set the actual saved title (overrides auto-generated title from setSlides)
    dispatch(setSongTitle(song.title));
    // Track which song is currently loaded
    dispatch(setCurrentSongId(song.id));
  };

  const handleDeleteClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    dispatch(openDeleteConfirmModal({ song, type: "prelist" }));
  };

  return (
    <GamyCard
      isDarkMode={isDarkMode}
      // transparent={true}
      className="h-full flex flex-col px-2 py-1"
    >
      <div className="p-2 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <span className="text-app-text font-semibold">Prelist</span>
        <p className="text-app-text-muted text-xs mt-1">
          {prelistedSongs.length} song{prelistedSongs.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {prelistedSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <img
              src="./no_files.svg"
              alt="No songs"
              className="w-20 h-20 opacity-50"
            />
            <div>
              <p className="text-app-text-muted text-sm">No songs in prelist</p>
              <p className="text-app-text-muted text-xs mt-2">
                Click the blue button to add current song
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {prelistedSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => handleSongClick(song)}
                onMouseEnter={() => setHoveredSong(song.id)}
                onMouseLeave={() => setHoveredSong(null)}
              >
                <GamyCard
                  isDarkMode={isDarkMode}
                  className="cursor-pointer rounded-sm h-8 px-2 py-1 border-none hover:bg-app-surface-hover transition-colors"
                  style={{
                    borderRadius: "10px",
                    border: "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-ew-sm font-medium text-app-text truncate block">
                        {song.title}
                      </span>
                    </div>
                    {hoveredSong === song.id && (
                      <div
                        onClick={(e) => handleDeleteClick(e, song)}
                        className=" dark:bg-app-bg  hover:bg-red-500/20 rounded transition-colors"
                        title="Remove from prelist"
                      >
                        <Trash2 className=" h-3 w-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </GamyCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </GamyCard>
  );
};
