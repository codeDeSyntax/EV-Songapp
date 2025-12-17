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

// Load from localStorage
const loadHistoryFromStorage = (): ProjectionHistoryEntry[] => {
  try {
    const stored = localStorage.getItem("projectionHistory");
    if (stored) {
      const parsed = JSON.parse(stored) as ProjectionHistoryEntry[];
      // Filter out old entries on load
      const now = Date.now();
      return parsed.filter((entry) => now - entry.projectedAt < TWO_WEEKS_MS);
    }
  } catch (error) {
    console.error(
      "Failed to load projection history from localStorage:",
      error
    );
  }
  return [];
};

// Save to localStorage
const saveHistoryToStorage = (history: ProjectionHistoryEntry[]) => {
  try {
    localStorage.setItem("projectionHistory", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save projection history to localStorage:", error);
  }
};

const initialState: ProjectionHistoryState = {
  history: loadHistoryFromStorage(),
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

      // Persist to localStorage
      saveHistoryToStorage(state.history);
    },

    clearProjectionHistory: (state) => {
      state.history = [];
      // Clear from localStorage
      saveHistoryToStorage([]);
    },

    removeOldEntries: (state) => {
      const now = Date.now();
      state.history = state.history.filter(
        (entry) => now - entry.projectedAt < TWO_WEEKS_MS
      );
      // Persist to localStorage
      saveHistoryToStorage(state.history);
    },
  },
});

export const { addProjectionEntry, clearProjectionHistory, removeOldEntries } =
  projectionHistorySlice.actions;

export default projectionHistorySlice.reducer;
