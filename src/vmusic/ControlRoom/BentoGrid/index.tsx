import React from "react";
import { SongLibraryPanel } from "./SongLibraryPanel";
import { PreviewPanel } from "./PreviewPanel";
import { BackgroundSelectorPanel } from "./BackgroundSelectorPanel";
import { PrelistPanel } from "./PrelistPanel";
import { QuickActionsCard } from "./QuickActionsCard";
import { FloatingSongEditor } from "./FloatingSongEditor";
import { FloatingNewSongModal } from "./FloatingNewSongModal";
import { useAppDispatch, useAppSelector } from "@/store";
import { SettingsView } from "../components/SettingsView";
import { StatisticsView } from "../components/StatisticsView";
import { AllSongsView } from "./AllSongsView";
import { Song } from "@/types";
import { setRightPanelView } from "@/store/slices/uiSlice";

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
    type: "success" | "error" | "warning" | "info",
  ) => void;
  songs: Song[];
  onSelectSongFromSearch: (song: Song) => void;
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
  songs,
  onSelectSongFromSearch,
}) => {
  const dispatch = useAppDispatch();
  const songRepo = useAppSelector((state) => state.songs.songRepo);
  const showSongEditor = useAppSelector((state) => state.ui.showSongEditor);
  const showNewSongModal = useAppSelector((state) => state.ui.showNewSongModal);
  const rightPanelView = useAppSelector((state) => state.ui.rightPanelView);

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

        {/* Right Side - Dynamic View */}
        <div className="col-span-9 h-full overflow-hidden relative">
          {rightPanelView === "settings" ? (
            <div className="h-full w-full relative rounded-xl overflow-hidden">
              <SettingsView
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </div>
          ) : rightPanelView === "statistics" ? (
            <div className="h-full w-full relative rounded-xl overflow-hidden">
              <StatisticsView isDarkMode={isDarkMode} />
            </div>
          ) : rightPanelView === "allSongs" ? (
            <AllSongsView
              songs={songs}
              onSelectSong={(song) => {
                onSelectSongFromSearch(song);
                dispatch(setRightPanelView("bento"));
              }}
            />
          ) : (
            <div className="h-full gap-2 flex flex-col overflow-hidden ">
              <div className="h-[53vh] grid grid-cols-12 gap-2 overflow-hidden">
                <div className="col-span-8 min-h-[100%]">
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
                <div className="col-span-2 min-h-[100%] overflow-hidden ">
                  <BackgroundSelectorPanel isDarkMode={isDarkMode} />
                </div>
                <div className="col-span-2 min-h-[100%] overflow-hidden">
                  <QuickActionsCard isDarkMode={isDarkMode} />
                </div>
              </div>

              <div className="h-[35vh] grid grid-cols-1 gap-2 overflow-hidden">
                <PrelistPanel isDarkMode={isDarkMode} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Song Editor */}
      {showSongEditor && (
        <FloatingSongEditor addToast={addToast} loadSongs={loadSongs} />
      )}

      {/* Floating New Song Modal */}
      {showNewSongModal && (
        <FloatingNewSongModal addToast={addToast} loadSongs={loadSongs} />
      )}
    </div>
  );
};
