import React from "react";
import { Music } from "lucide-react";
import { BentoGrid } from "./BentoGrid";
import { Song } from "@/types";

interface ContentAreaProps {
  filteredSongsCount: number;
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  loadSongs: () => void;
  onRequestDelete: () => void;
  deleteSlideRequested: boolean;
  onDeleteSlideComplete: () => void;
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  songs: Song[];
  onSelectSongFromSearch: (song: Song) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  filteredSongsCount,
  isDarkMode,
  toggleDarkMode,
  onSaveSuccess,
  onSaveError,
  loadSongs,
  onRequestDelete,
  deleteSlideRequested,
  onDeleteSlideComplete,
  addToast,
  songs,
  onSelectSongFromSearch,
}) => {
  return (
    <div className="h-[90vh] w-full bg-app-bg">
      <BentoGrid
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
        loadSongs={loadSongs}
        onRequestDelete={onRequestDelete}
        deleteSlideRequested={deleteSlideRequested}
        onDeleteSlideComplete={onDeleteSlideComplete}
        addToast={addToast}
        songs={songs}
        onSelectSongFromSearch={onSelectSongFromSearch}
      />
    </div>
  );
};
