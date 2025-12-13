import React, { useState } from "react";
import { GamyCard } from "../vmusic/shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import { closeDeleteConfirmModal } from "@/store/slices/uiSlice";
import { deleteSongFromState, updateSong } from "@/store/slices/songSlice";
import { parseLyrics } from "../vmusic/ControlRoom/utils/lyricsParser";
import { encodeSongData } from "../vmusic/ControlRoom/utils/songFileFormat";
import { useTheme } from "@/Provider/Theme";

interface DeleteConfirmModalProps {
  addToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  loadSongs: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  addToast,
  loadSongs,
}) => {
  const dispatch = useAppDispatch();
  const { isDarkMode } = useTheme();
  const { showDeleteConfirmModal, songToDelete, deleteType } = useAppSelector(
    (state) => state.ui
  );
  const songs = useAppSelector((state) => state.songs.songs);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!showDeleteConfirmModal || !songToDelete) return null;

  const handleConfirm = async () => {
    if (!songToDelete) return;

    try {
      setIsDeleting(true);

      if (deleteType === "prelist") {
        // Remove from prelist by updating isPrelisted flag
        const slides = songToDelete.slides || [];
        const encodedContent = encodeSongData(
          songToDelete.title,
          slides,
          false
        );

        // Get song directory from any existing song path
        const songRepo = songs[0]?.path
          ? songs[0].path.substring(0, songs[0].path.lastIndexOf("\\"))
          : "";

        await window.api.saveSong(songRepo, songToDelete.title, encodedContent);

        const updatedSong = { ...songToDelete, isPrelisted: false };
        dispatch(updateSong(updatedSong));

        addToast(`"${songToDelete.title}" removed from prelist`, "success");
      } else if (deleteType === "permanent") {
        // Permanently delete the song file
        await window.api.deleteSong(songToDelete.path);
        dispatch(deleteSongFromState(songToDelete.id));
        addToast(`"${songToDelete.title}" deleted permanently`, "success");
      }

      loadSongs();
    } catch (error) {
      console.error("Error in delete operation:", error);
      addToast(
        `Failed to ${
          deleteType === "prelist" ? "remove from prelist" : "delete song"
        }. Please try again.`,
        "error"
      );
    } finally {
      setIsDeleting(false);
      dispatch(closeDeleteConfirmModal());
    }
  };

  const handleCancel = () => {
    dispatch(closeDeleteConfirmModal());
  };

  const modalTitle =
    deleteType === "prelist" ? "Remove from Prelist?" : "Delete Song?";
  const modalMessage =
    deleteType === "prelist"
      ? `Are you sure you want to remove "${songToDelete.title}" from the prelist? The song will still exist in your library.`
      : `Are you sure you want to permanently delete "${songToDelete.title}"? This action cannot be undone.`;
  const confirmButtonText = deleteType === "prelist" ? "Remove" : "Delete";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <GamyCard isDarkMode={isDarkMode} className="p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-app-text mb-2">
          {modalTitle}
        </h3>
        <p className="text-sm text-app-text-muted mb-4">{modalMessage}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Processing..." : confirmButtonText}
          </button>
        </div>
      </GamyCard>
    </div>
  );
};
