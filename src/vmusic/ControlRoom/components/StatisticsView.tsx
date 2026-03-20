import React, { useMemo } from "react";
import { useAppSelector } from "@/store";
import { Activity, BarChart3, Crown, PieChart } from "lucide-react";

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
  isDarkMode: _isDarkMode,
}) => {
  const songStats = useAppSelector((state) => state.statistics.stats);

  const top10 = useMemo(() => songStats.slice(0, 10), [songStats]);
  const top5 = useMemo(() => songStats.slice(0, 5), [songStats]);
  const totalSongs = songStats.length;
  const totalProjections = useMemo(
    () => songStats.reduce((sum, stat) => sum + stat.count, 0),
    [songStats],
  );
  const avgPerSong =
    totalSongs > 0 ? (totalProjections / totalSongs).toFixed(1) : "0.0";
  const maxCount = top10[0]?.count || 1;
  const topSong = top10[0] ?? null;

  const recencyBuckets = useMemo(() => {
    const now = Date.now();
    const buckets = [
      { label: "24h", songs: 0 },
      { label: "7d", songs: 0 },
      { label: "30d", songs: 0 },
      { label: "90d", songs: 0 },
    ];

    songStats.forEach((entry) => {
      const diff = now - entry.lastProjected;
      if (diff <= 24 * 60 * 60 * 1000) buckets[0].songs += 1;
      else if (diff <= 7 * 24 * 60 * 60 * 1000) buckets[1].songs += 1;
      else if (diff <= 30 * 24 * 60 * 60 * 1000) buckets[2].songs += 1;
      else buckets[3].songs += 1;
    });

    return buckets;
  }, [songStats]);

  const donutSegments = useMemo(() => {
    const top5Total = top5.reduce((sum, item) => sum + item.count, 0);
    const rest = Math.max(0, totalProjections - top5Total);
    const values = [
      ...top5.map((item) => ({
        key: item.songId,
        label: item.songTitle,
        value: item.count,
      })),
      { key: "rest", label: "Others", value: rest },
    ].filter((value) => value.value > 0);

    const palette = [
      "rgba(59, 130, 246, 0.95)",
      "rgba(16, 185, 129, 0.95)",
      "rgba(245, 158, 11, 0.95)",
      "rgba(168, 85, 247, 0.95)",
      "rgba(236, 72, 153, 0.95)",
      "rgba(148, 163, 184, 0.85)",
    ];

    const circumference = 2 * Math.PI * 42;
    let offset = 0;

    return values.map((segment, index) => {
      const pct = segment.value / Math.max(1, totalProjections);
      const length = pct * circumference;
      const entry = {
        ...segment,
        pct,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset,
        color: palette[index % palette.length],
      };
      offset += length;
      return entry;
    });
  }, [top5, totalProjections]);

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
      <div className="h-full flex flex-col overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-app-border bg-transparent">
              <BarChart3 className="w-5 h-5 text-app-accent" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-app-text truncate">
                Song Statistics
              </h2>
              <p className="text-sm text-app-text-muted">
                Chart analytics for projection usage
              </p>
            </div>
          </div>
          <div className="text-sm text-app-text-muted whitespace-nowrap">
            Window: Last 3 months
          </div>
        </div>

        {top10.length > 0 ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2 text-sm text-app-text-muted mb-4 px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="truncate max-w-[300px] sm:max-w-[420px]">
                  Top:{" "}
                  <span className="text-app-text font-semibold">
                    {topSong?.songTitle}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap">
                <span>
                  Songs:{" "}
                  <span className="text-app-text font-semibold">
                    {totalSongs}
                  </span>
                </span>
                <span>
                  Plays:{" "}
                  <span className="text-app-text font-semibold">
                    {totalProjections}
                  </span>
                </span>
                <span>
                  Avg:{" "}
                  <span className="text-app-text font-semibold">
                    {avgPerSong}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-4 overflow-hidden">
              <div className="xl:col-span-8 h-full min-h-0 min-w-0 overflow-hidden border border-app-border/80 rounded-xl bg-transparent p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-app-text flex items-center gap-2">
                    <BarChart3 className="w-4.5 h-4.5 text-app-accent" />
                    Most Sung (Top 10)
                  </h3>
                  <span className="text-sm text-app-text-muted">
                    Normalized scale
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
                  <svg
                    width={760}
                    height={top10.length * 34 + 24}
                    viewBox={`0 0 760 ${top10.length * 34 + 24}`}
                    preserveAspectRatio="xMinYMin meet"
                  >
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <g key={tick}>
                        <line
                          x1={180 + tick * 5.4}
                          y1={8}
                          x2={180 + tick * 5.4}
                          y2={top10.length * 34 + 8}
                          stroke="rgba(148,163,184,0.25)"
                          strokeDasharray="2 4"
                        />
                        <text
                          x={180 + tick * 5.4}
                          y={18}
                          textAnchor="middle"
                          fontSize="11"
                          fill="currentColor"
                          className="text-app-text-muted"
                        >
                          {tick}%
                        </text>
                      </g>
                    ))}

                    {top10.map((stat, index) => {
                      const y = 26 + index * 34;
                      const barWidth = (stat.count / maxCount) * 540;
                      return (
                        <g key={stat.songId}>
                          <text
                            x={6}
                            y={y + 11}
                            fontSize="12"
                            fill="currentColor"
                            className="text-app-text-muted"
                          >
                            #{index + 1}
                          </text>
                          <text
                            x={36}
                            y={y + 11}
                            fontSize="13"
                            fill="currentColor"
                            className="text-app-text"
                          >
                            {stat.songTitle.length > 24
                              ? `${stat.songTitle.slice(0, 24)}...`
                              : stat.songTitle}
                          </text>

                          <rect
                            x={180}
                            y={y}
                            rx={6}
                            ry={6}
                            width={540}
                            height={14}
                            fill="rgba(148,163,184,0.16)"
                          />
                          <rect
                            x={180}
                            y={y}
                            rx={6}
                            ry={6}
                            width={Math.max(6, barWidth)}
                            height={14}
                            fill="rgba(59,130,246,0.85)"
                          />
                          <text
                            x={728}
                            y={y + 11}
                            textAnchor="end"
                            fontSize="12"
                            fill="currentColor"
                            className="text-app-text"
                          >
                            {stat.count}x
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="xl:col-span-4 h-full min-h-0 min-w-0 overflow-hidden flex flex-col gap-4">
                <div className="border border-app-border/80 rounded-xl bg-transparent p-4 min-w-0">
                  <h3 className="text-base font-semibold text-app-text flex items-center gap-2 mb-3">
                    <PieChart className="w-4 h-4 text-app-accent" />
                    Usage Share
                  </h3>

                  <div className="flex items-center gap-3 min-w-0">
                    <svg width="110" height="110" viewBox="0 0 110 110">
                      <circle
                        cx="55"
                        cy="55"
                        r="42"
                        stroke="rgba(148,163,184,0.18)"
                        strokeWidth="14"
                        fill="none"
                      />
                      {donutSegments.map((segment) => (
                        <circle
                          key={segment.key}
                          cx="55"
                          cy="55"
                          r="42"
                          stroke={segment.color}
                          strokeWidth="14"
                          fill="none"
                          strokeDasharray={segment.dashArray}
                          strokeDashoffset={segment.dashOffset}
                          strokeLinecap="butt"
                          transform="rotate(-90 55 55)"
                        />
                      ))}
                    </svg>

                    <div className="flex-1 min-w-0 space-y-2">
                      {donutSegments.slice(0, 4).map((segment) => (
                        <div
                          key={`legend-${segment.key}`}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: segment.color }}
                            />
                            <span className="truncate text-app-text-muted">
                              {segment.label}
                            </span>
                          </div>
                          <span className="text-app-text font-semibold">
                            {(segment.pct * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-app-border/80 rounded-xl bg-transparent p-4 flex-1 min-h-0 min-w-0">
                  <h3 className="text-base font-semibold text-app-text flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-app-accent" />
                    Recency Distribution
                  </h3>

                  <div className="h-[130px] flex items-end gap-3">
                    {recencyBuckets.map((bucket) => {
                      const maxBucket = Math.max(
                        ...recencyBuckets.map((item) => item.songs),
                        1,
                      );
                      const heightPct = (bucket.songs / maxBucket) * 100;

                      return (
                        <div
                          key={bucket.label}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div className="text-sm text-app-text font-semibold">
                            {bucket.songs}
                          </div>
                          <div className="w-full h-[96px] border border-app-border rounded-md flex items-end overflow-hidden bg-transparent">
                            <div
                              className="w-full bg-gradient-to-t from-app-accent to-app-accent/70"
                              style={{ height: `${Math.max(6, heightPct)}%` }}
                            />
                          </div>
                          <div className="text-xs text-app-text-muted">
                            {bucket.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border border-app-border/80 rounded-xl bg-transparent overflow-hidden min-h-0">
              <div className="px-4 py-3 border-b border-app-border text-sm font-semibold text-app-text">
                Full Ranking Table
              </div>
              <div className="max-h-[34vh] overflow-auto no-scrollbar">
                <table className="w-full min-w-[520px] text-sm table-fixed">
                  <thead className="sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm text-app-text-muted">
                    <tr>
                      <th className="w-12 text-left px-3 py-2 font-medium">
                        #
                      </th>
                      <th className="text-left px-3 py-2 font-medium">Song</th>
                      <th className="w-24 text-right px-3 py-2 font-medium">
                        Count
                      </th>
                      <th className="w-32 text-right px-3 py-2 font-medium">
                        Last Sung
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {songStats.map((stat, idx) => (
                      <tr
                        key={`table-${stat.songId}`}
                        className="border-t border-app-border/60 hover:bg-app-hover/20"
                      >
                        <td className="px-3 py-2 text-app-text-muted">
                          {idx + 1}
                        </td>
                        <td
                          className="px-3 py-2 text-app-text truncate max-w-[280px]"
                          title={stat.songTitle}
                        >
                          {stat.songTitle}
                        </td>
                        <td className="px-3 py-2 text-right text-app-text font-semibold">
                          {stat.count}x
                        </td>
                        <td className="px-3 py-2 text-right text-app-text-muted">
                          {formatDate(stat.lastProjected)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-transparent mb-4 border border-app-border">
              <BarChart3 className="w-8 h-8 text-app-text-muted" />
            </div>
            <h3 className="text-base font-medium text-app-text mb-1">
              No Statistics Yet
            </h3>
            <p className="text-sm text-app-text-muted max-w-xs">
              Project songs during service and this screen will render real
              chart analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
