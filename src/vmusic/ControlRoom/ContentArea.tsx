import React from "react";
import { Music } from "lucide-react";
import { BentoGrid } from "./BentoGrid";

interface ContentAreaProps {
  filteredSongsCount: number;
  isDarkMode: boolean;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  loadSongs: () => void;
  onRequestDelete: () => void;
  deleteSlideRequested: boolean;
  onDeleteSlideComplete: () => void;
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  filteredSongsCount,
  isDarkMode,
  onSaveSuccess,
  onSaveError,
  loadSongs,
  onRequestDelete,
  deleteSlideRequested,
  onDeleteSlideComplete,
  addToast,
}) => {
  return (
    <div className="h-[90vh] w-full bg-app-bg">
      <BentoGrid
        isDarkMode={isDarkMode}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
        loadSongs={loadSongs}
        onRequestDelete={onRequestDelete}
        deleteSlideRequested={deleteSlideRequested}
        onDeleteSlideComplete={onDeleteSlideComplete}
        addToast={addToast}
      />
    </div>
  );
};
