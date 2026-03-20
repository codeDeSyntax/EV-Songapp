import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Song } from "@/types";

interface UIState {
  showDeleteConfirmModal: boolean;
  songToDelete: Song | null;
  deleteType: "prelist" | "permanent" | null;
  showSettings: boolean;
  showStatistics: boolean;
  rightPanelView: "bento" | "settings" | "statistics" | "allSongs";
  isEditingSlide: boolean;
  showAddSlideDialog: boolean;
  showTitleDialog: boolean;
  showPrelistTitleDialog: boolean;
  showSongEditor: boolean;
  showNewSongModal: boolean;
}

const initialState: UIState = {
  showDeleteConfirmModal: false,
  songToDelete: null,
  deleteType: null,
  showSettings: false,
  showStatistics: false,
  rightPanelView: "bento",
  isEditingSlide: false,
  showAddSlideDialog: false,
  showTitleDialog: false,
  showPrelistTitleDialog: false,
  showSongEditor: false,
  showNewSongModal: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openDeleteConfirmModal: (
      state,
      action: PayloadAction<{ song: Song; type: "prelist" | "permanent" }>,
    ) => {
      state.showDeleteConfirmModal = true;
      state.songToDelete = action.payload.song;
      state.deleteType = action.payload.type;
    },
    closeDeleteConfirmModal: (state) => {
      state.showDeleteConfirmModal = false;
      state.songToDelete = null;
      state.deleteType = null;
    },
    toggleSettings: (state) => {
      const nextShowSettings = !state.showSettings;
      state.showSettings = nextShowSettings;
      if (nextShowSettings) {
        state.showStatistics = false;
        state.rightPanelView = "settings";
      } else if (state.rightPanelView === "settings") {
        state.rightPanelView = "bento";
      }
    },
    toggleStatistics: (state) => {
      const nextShowStatistics = !state.showStatistics;
      state.showStatistics = nextShowStatistics;
      if (nextShowStatistics) {
        state.showSettings = false;
        state.rightPanelView = "statistics";
      } else if (state.rightPanelView === "statistics") {
        state.rightPanelView = "bento";
      }
    },
    toggleAllSongsView: (state) => {
      if (state.rightPanelView === "allSongs") {
        state.rightPanelView = "bento";
      } else {
        state.rightPanelView = "allSongs";
      }
      state.showSettings = false;
      state.showStatistics = false;
    },
    setRightPanelView: (
      state,
      action: PayloadAction<"bento" | "settings" | "statistics" | "allSongs">,
    ) => {
      state.rightPanelView = action.payload;
      state.showSettings = action.payload === "settings";
      state.showStatistics = action.payload === "statistics";
    },
    setIsEditingSlide: (state, action: PayloadAction<boolean>) => {
      state.isEditingSlide = action.payload;
    },
    setShowAddSlideDialog: (state, action: PayloadAction<boolean>) => {
      state.showAddSlideDialog = action.payload;
    },
    setShowTitleDialog: (state, action: PayloadAction<boolean>) => {
      state.showTitleDialog = action.payload;
    },
    setShowPrelistTitleDialog: (state, action: PayloadAction<boolean>) => {
      state.showPrelistTitleDialog = action.payload;
    },
    toggleSongEditor: (state) => {
      state.showSongEditor = !state.showSongEditor;
    },
    toggleNewSongModal: (state) => {
      state.showNewSongModal = !state.showNewSongModal;
    },
  },
});

export const {
  openDeleteConfirmModal,
  closeDeleteConfirmModal,
  toggleSettings,
  toggleStatistics,
  toggleAllSongsView,
  setRightPanelView,
  setIsEditingSlide,
  setShowAddSlideDialog,
  setShowTitleDialog,
  setShowPrelistTitleDialog,
  toggleSongEditor,
  toggleNewSongModal,
} = uiSlice.actions;

export default uiSlice.reducer;
