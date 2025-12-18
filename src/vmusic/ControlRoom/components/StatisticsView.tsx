import React, { useMemo } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector } from "@/store";
import { BarChart3, TrendingUp, Clock } from "lucide-react";

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
  const projectionHistory = useAppSelector(
    (state) => state.projectionHistory.history
  );

  // Calculate song statistics
  const songStats = useMemo(() => {
    const statsMap = new Map<string, SongStats>();

    projectionHistory.forEach((entry) => {
      const existing = statsMap.get(entry.songId);
      if (existing) {
        existing.count += 1;
        // Update last projected if this entry is more recent
        if (entry.projectedAt > existing.lastProjected) {
          existing.lastProjected = entry.projectedAt;
        }
      } else {
        statsMap.set(entry.songId, {
          songId: entry.songId,
          songTitle: entry.songTitle,
          count: 1,
          lastProjected: entry.projectedAt,
        });
      }
    });

    // Convert to array and sort by count (descending)
    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }, [projectionHistory]);

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
    <div className="absolute inset-0 z-50 overflow-hidden bg-app-surface dark:bg-black rounded-xl">
      <div className="h-full flex flex-col overflow-hidden p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-app-accent/10">
            <BarChart3 className="w-5 h-5 text-app-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-app-text">
              Projection Statistics
            </h2>
            <p className="text-xs text-app-text-muted">
              Most projected songs (last 2 weeks)
            </p>
          </div>
        </div>

        {/* Statistics List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {songStats.length > 0 ? (
            <div className="space-y-2">
              {songStats.map((stat, index) => (
                <GamyCard
                  key={stat.songId}
                  isDarkMode={isDarkMode}
                  className="p-3 hover:bg-app-surface-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-500"
                          : index === 1
                          ? "bg-gray-400/20 text-gray-400"
                          : index === 2
                          ? "bg-orange-500/20 text-orange-500"
                          : "bg-app-bg text-app-text-muted"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-app-text truncate">
                        {stat.songTitle}
                      </h3>
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
                </GamyCard>
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
        {songStats.length > 0 && (
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
        )}
      </div>
    </div>
  );
};
