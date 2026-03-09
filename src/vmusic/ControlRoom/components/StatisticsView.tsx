import React, { useMemo } from "react";
import { useAppSelector } from "@/store";
import { BarChart3, TrendingUp, Clock, Crown } from "lucide-react";

interface StatisticsViewProps {
  isDarkMode: boolean;
}

interface SongStats {
  songId: string;
  songTitle: string;
  count: number;
  lastProjected: number;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  isDarkMode,
}) => {
  // Use persistent statistics
  const songStats = useAppSelector((state) => state.statistics.stats);
  const top10 = songStats.slice(0, 10);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-white dark:bg-black rounded-xl">
      <div className="h-full flex flex-col overflow-hidden p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-app-accent/10">
            <BarChart3 className="w-5 h-5 text-app-accent" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-app-text">
              Songs Statistics
            </h2>
            <p className="text-xs text-app-text-muted">
              Most projected songs (all time)
            </p>
          </div>
        </div>

        {/* Top Song Banner */}
        {top10.length > 0 && (
          <div className="relative flex items-center justify-between bg-gradient-to-r from-blue-400/20 to-app-accent/10 rounded-xl px-4 py-3 mb-4 border border-blue-300/30 shadow-sm">
            <div className="flex items-center gap-2">
              <Crown className="w-7 h-7 text-blue-500 drop-shadow" />
              <div>
                <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide">
                  Top Song
                </div>
                <div className="text-lg font-bold text-app-text truncate max-w-[200px]">
                  {top10[0].songTitle}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-blue-700 font-bold text-base">
                {top10[0].count}x
              </span>
              <span className="text-xs text-app-text-muted">
                {formatDate(top10[0].lastProjected)}
              </span>
            </div>
          </div>
        )}

        {/* Statistics List (Top 10) */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {top10.length > 1 ? (
            <div className="divide-y divide-app-border gap-2 ">
              {top10.slice(1).map((stat, index) => (
                <div
                  key={stat.songId}
                  className="mt-1 bg-gradient-to-tr from-[#e9e9e9] dark:from-app-surface to-transparent flex items-center gap-4 py-3 px-2 hover:bg-app-surface-hover transition-colors rounded-lg"
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm flex-shrink-0 bg-app-surface text-app-text-muted">
                    {index + 2}
                  </div>
                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-app-text truncate">
                      {stat.songTitle}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-app-text-muted">
                        <TrendingUp className="w-3 h-3" />
                        <span>
                          {stat.count} {stat.count === 1 ? "time" : "times"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-app-text-muted">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(stat.lastProjected)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Count Badge */}
                  <div className="flex items-center justify-center px-3 py-1 rounded-full bg-app-accent/20 text-app-accent font-semibold text-xs flex-shrink-0">
                    {stat.count}x
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-app-bg mb-4">
                <BarChart3 className="w-8 h-8 text-app-text-muted" />
              </div>
              <h3 className="text-sm font-medium text-app-text mb-1">
                No Statistics Yet
              </h3>
              <p className="text-xs text-app-text-muted max-w-xs">
                Project some songs to see statistics about your most frequently
                used songs
              </p>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {/* {top10.length > 0 && (
          <div className="mt-4 pt-3 border-t border-app-border">
            <div className="flex items-center justify-between text-xs text-app-text-muted">
              <span>
                Total Songs Projected: <strong>{songStats.length}</strong>
              </span>
              <span>
                Total Projections:{" "}
                <strong>
                  {songStats.reduce((sum, stat) => sum + stat.count, 0)}
                </strong>
              </span>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};
