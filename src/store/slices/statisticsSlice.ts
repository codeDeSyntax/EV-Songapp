import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SongStatisticsEntry {
  songId: string;
  songTitle: string;
  count: number;
  lastProjected: number;
}

interface StatisticsState {
  stats: SongStatisticsEntry[];
}

// 3 months in milliseconds
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

// Load from localStorage and filter to last 3 months
const loadStatsFromStorage = (): SongStatisticsEntry[] => {
  try {
    const stored = localStorage.getItem("songStatistics");
    if (stored) {
      const parsed = JSON.parse(stored) as SongStatisticsEntry[];
      const now = Date.now();
      return parsed.filter(
        (entry) => now - entry.lastProjected < THREE_MONTHS_MS
      );
    }
  } catch (error) {
    console.error("Failed to load song statistics from localStorage:", error);
  }
  return [];
};

// Save to localStorage
const saveStatsToStorage = (stats: SongStatisticsEntry[]) => {
  try {
    localStorage.setItem("songStatistics", JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save song statistics to localStorage:", error);
  }
};

const initialState: StatisticsState = {
  stats: loadStatsFromStorage(),
};

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    recordProjection: (
      state,
      action: PayloadAction<{
        songId: string;
        songTitle: string;
        projectedAt: number;
      }>
    ) => {
      const { songId, songTitle, projectedAt } = action.payload;
      const now = Date.now();
      // Remove entries older than 3 months
      state.stats = state.stats.filter(
        (entry) => now - entry.lastProjected < THREE_MONTHS_MS
      );
      const existing = state.stats.find((s) => s.songId === songId);
      if (existing) {
        existing.count += 1;
        if (projectedAt > existing.lastProjected) {
          existing.lastProjected = projectedAt;
        }
        existing.songTitle = songTitle; // update title if changed
      } else {
        state.stats.push({
          songId,
          songTitle,
          count: 1,
          lastProjected: projectedAt,
        });
      }
      // Sort by count descending
      state.stats.sort((a, b) => b.count - a.count);
      saveStatsToStorage(state.stats);
    },
    clearStatistics: (state) => {
      state.stats = [];
      saveStatsToStorage([]);
    },
    loadStatistics: (state) => {
      state.stats = loadStatsFromStorage();
    },
  },
});

export const { recordProjection, clearStatistics, loadStatistics } =
  statisticsSlice.actions;
export default statisticsSlice.reducer;
