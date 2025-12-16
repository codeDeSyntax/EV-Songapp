import React, { useState } from "react";
import { SongLibraryPanel } from "./SongLibraryPanel";
import { PreviewPanel } from "./PreviewPanel";
import { BackgroundSelectorPanel } from "./BackgroundSelectorPanel";
import { PrelistPanel } from "./PrelistPanel";
import { BottomRightPanel } from "./BottomRightPanel";
import { useAppSelector } from "@/store";

interface BentoGridProps {
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
    type: "success" | "error" | "warning" | "info"
  ) => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  isDarkMode,
  toggleDarkMode,
  onSaveSuccess,
  onSaveError,
  loadSongs,
  onRequestDelete,
  deleteSlideRequested,
  onDeleteSlideComplete,
  addToast,
}) => {
  const songRepo = useAppSelector((state) => state.songs.songRepo);

  return (
    <div className="w-full h-full p-2 overflow-hidden ">
      <div className="grid grid-cols-12 gap-2 h-full">
        {/* Left Tall Panel - Full Height */}
        <div className="col-span-3 h-full overflow-hidden rounded-xl ">
          <SongLibraryPanel
            isDarkMode={isDarkMode}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
            loadSongs={loadSongs}
          />
        </div>

        {/* Right Side - Two Rows */}
        <div className="col-span-9 h-full flex flex-col gap-2 overflow-hidden ">
          {/* Top Row - Preview and Background Selector */}
          <div className="h-[62%]   grid grid-cols-5 gap-2 overflow-hidden">
            <div className="col-span-4  h-full">
              <PreviewPanel
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                songRepo={songRepo}
                onSaveSuccess={onSaveSuccess}
                onSaveError={onSaveError}
                loadSongs={loadSongs}
                onRequestDelete={onRequestDelete}
                deleteSlideRequested={deleteSlideRequested}
                onDeleteSlideComplete={onDeleteSlideComplete}
                addToast={addToast}
              />
            </div>
            <BackgroundSelectorPanel isDarkMode={isDarkMode} />
          </div>

          {/* Bottom Two Equal Panels - Takes 40% height */}
          <div className="h-[38%] grid grid-cols-1 gap-2 overflow-hidden">
            <PrelistPanel isDarkMode={isDarkMode} />
            {/* <BottomRightPanel isDarkMode={isDarkMode} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};
