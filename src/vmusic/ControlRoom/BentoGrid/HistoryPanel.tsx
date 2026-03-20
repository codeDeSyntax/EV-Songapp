import React, { useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  clearProjectionHistory,
  removeOldEntries,
} from "@/store/slices/projectionHistorySlice";
import { DepthSurface } from "@/shared/DepthButton";

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
    const interval = setInterval(
      () => {
        dispatch(removeOldEntries());
      },
      60 * 60 * 1000,
    );

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
      <div className="px-3 py-2.5 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-app-text-muted" />
          <span className="text-app-text font-semibold text-ew-sm tracking-wide">
            History
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-[10px] text-app-text-muted hover:text-red-500 transition-colors"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 px-3">
            <img src="./no_files.svg" alt="" className="w-10 h-10 opacity-35" />
            <p className="text-app-text-muted text-[10px]">No history yet</p>
            <p className="text-app-text-muted text-[10px] opacity-60">
              Projected songs appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-app-border/50">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 px-3  hover:bg-app-hover/40 transition-colors"
              >
                <DepthSurface className="text-ew-xs font-medium text-app-text truncate py-1 px-2  leading-tight">
                  {entry.songTitle}
                </DepthSurface>
                {/* dashed line */}
                <div className="flex-1 border-t border-dashed border-app-border mx-3" />
                <span className="text-[10px] text-app-text-muted flex-shrink-0 tabular-nums">
                  {formatRelativeTime(entry.projectedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-app-border flex-shrink-0">
        <span className="text-[10px] text-app-text-muted">
          {history.length} {history.length === 1 ? "entry" : "entries"} ·
          Auto-clears after{" "}
          <span className="font-semibold text-app-text">2 months</span>
        </span>
      </div>
    </div>
  );
};
