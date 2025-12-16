import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ProjectionHistoryEntry {
  id: string;
  songId: string;
  songTitle: string;
  projectedAt: number; // timestamp
}

interface ProjectionHistoryState {
  history: ProjectionHistoryEntry[];
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds

const initialState: ProjectionHistoryState = {
  history: [],
};

const projectionHistorySlice = createSlice({
  name: "projectionHistory",
  initialState,
  reducers: {
    addProjectionEntry: (
      state,
      action: PayloadAction<{ songId: string; songTitle: string }>
    ) => {
      const now = Date.now();

      // Remove entries older than 2 weeks
      state.history = state.history.filter(
        (entry) => now - entry.projectedAt < TWO_WEEKS_MS
      );

      // Add new entry
      const newEntry: ProjectionHistoryEntry = {
        id: `${action.payload.songId}-${now}`,
        songId: action.payload.songId,
        songTitle: action.payload.songTitle,
        projectedAt: now,
      };

      state.history.unshift(newEntry); // Add to beginning

      // Keep only unique songs in recent history (remove duplicates)
      const seenSongs = new Set<string>();
      state.history = state.history.filter((entry) => {
        if (seenSongs.has(entry.songId)) {
          return false;
        }
        seenSongs.add(entry.songId);
        return true;
      });
    },

    clearProjectionHistory: (state) => {
      state.history = [];
    },

    removeOldEntries: (state) => {
      const now = Date.now();
      state.history = state.history.filter(
        (entry) => now - entry.projectedAt < TWO_WEEKS_MS
      );
    },
  },
});

export const { addProjectionEntry, clearProjectionHistory, removeOldEntries } =
  projectionHistorySlice.actions;

export default projectionHistorySlice.reducer;
