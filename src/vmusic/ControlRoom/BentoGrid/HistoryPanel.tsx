import React, { useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  clearProjectionHistory,
  removeOldEntries,
} from "@/store/slices/projectionHistorySlice";

interface HistoryPanelProps {
  isDarkMode: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isDarkMode }) => {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state) => state.projectionHistory.history);

  // Clean up old entries on mount and periodically
  useEffect(() => {
    dispatch(removeOldEntries());

    // Clean up every hour
    const interval = setInterval(() => {
      dispatch(removeOldEntries());
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleClearHistory = () => {
    if (window.confirm("Clear all projection history?")) {
      dispatch(clearProjectionHistory());
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-app-text-muted" />
          <span className="text-app-text font-semibold text-sm">
            Song History
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-app-text-muted hover:text-red-500 transition-colors flex items-center gap-1"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* History List */}
      <div className="fle h-[11.5rem] overflow-y-auto p-2 no-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <img
              src="./no_files.svg"
              alt="No songs"
              className="w-16 h-16 opacity-50"
            />
            <div>
              <p className="text-app-text-muted text-xs">
                No projection history
              </p>
              <p className="text-app-text-muted text-[10px] mt-1">
                Songs you project will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-app-surface dark:bg-app-surface border border-app-border rounded-full px-2 py-1.5 hover:bg-app-hover transition-colors relative overflow-visible "
              >
                {/* Time badge absolutely positioned */}
                <span
                  className="absolute -top-2 right-7 translate-x-1/2 bg-white/50 dark:bg-black font-bold border border-app-border text-[10px] text-app-text-muted px-2 py-0.5 rounded-full shadow z-10"
                  style={{ minWidth: "60px", textAlign: "center" }}
                >
                  {formatRelativeTime(entry.projectedAt)}
                </span>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-app-text truncate flex-1">
                    {entry.songTitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="  border-t border-app-border flex-shrink-0 bg-blue-950 dark:bg-blue-950 px-2 absolute bottom-4  rounded-full">
        <span className="text-[12px] text-white underline dark:text-blue-400 text-center">
          {history.length} {history.length === 1 ? "song" : "songs"} •
          Auto-deletes after{" "}
          <span className="font-bold text-white dark:text-white">2 weeks</span>
        </span>
      </div>
    </div>
  );
};
