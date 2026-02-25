import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Song } from "@/types";

interface UIState {
  showDeleteConfirmModal: boolean;
  songToDelete: Song | null;
  deleteType: "prelist" | "permanent" | null;
  showSettings: boolean;
  showStatistics: boolean;
  isEditingSlide: boolean;
  showAddSlideDialog: boolean;
  showTitleDialog: boolean;
  showPrelistTitleDialog: boolean;
  showSongEditor: boolean;
}

const initialState: UIState = {
  showDeleteConfirmModal: false,
  songToDelete: null,
  deleteType: null,
  showSettings: false,
  showStatistics: false,
  isEditingSlide: false,
  showAddSlideDialog: false,
  showTitleDialog: false,
  showPrelistTitleDialog: false,
  showSongEditor: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openDeleteConfirmModal: (
      state,
      action: PayloadAction<{ song: Song; type: "prelist" | "permanent" }>
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
      state.showSettings = !state.showSettings;
    },
    toggleStatistics: (state) => {
      state.showStatistics = !state.showStatistics;
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
  },
});

export const {
  openDeleteConfirmModal,
  closeDeleteConfirmModal,
  toggleSettings,
  toggleStatistics,
  setIsEditingSlide,
  setShowAddSlideDialog,
  setShowTitleDialog,
  setShowPrelistTitleDialog,
  toggleSongEditor,
} = uiSlice.actions;

export default uiSlice.reducer;
