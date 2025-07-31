import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Pencil,
  FolderOpen,
  Save,
  Music,
  CheckCircle,
  AlertCircle,
  ArrowLeftCircle,
  Monitor,
  FileText,
  Calendar,
  Clock,
  Folder,
} from "lucide-react";
import TitleBar from "../shared/TitleBar";
import ModernSongEditor from "./ModernSongEditor";
import { motion, AnimatePresence } from "framer-motion";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import {
  setSongRepo,
  setSelectedSong,
  updateSong,
} from "@/store/slices/songSlice";
import { Song } from "@/types";

const Notification = ({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error" | "warning";
}) => {
  const bgColor = {
    success: "bg-[#9a674a]",
    error: "bg-red-500",
    warning: "bg-amber-500",
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-8 left-1/2 z-50"
    >
      <div
        className={`relative flex items-center gap-3 ${bgColor} text-white px-8 py-4 rounded-2xl 
                    shadow-2xl backdrop-blur-lg border border-white/20 overflow-hidden
                    transform hover:scale-105 transition-all duration-300`}
      >
        {/* Animated background shimmer */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                        transform -skew-x-12 animate-shimmer"
        />

        {type === "success" ? (
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
        ) : type === "error" ? (
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
        )}
        <span className="font-semibold text-base tracking-wide relative z-10">
          {message}
        </span>
      </div>
    </motion.div>
  );
};

export default function ModernEditForm() {
  const { selectedSong, loadSongs, changeDirectory } = useSongOperations();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.app.theme);
  const songRepo = useAppSelector((state) => state.songs.songRepo);

  const [formData, setFormData] = useState({
    title: selectedSong?.title || "",
    message: selectedSong?.content || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  // Add shimmer animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(300%) skewX(-12deg); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Helper function to project song
  const projectSong = (songData: any) => {
    const updatedSongData = {
      ...songData,
      title: formData.title,
      content: formData.message,
      id: selectedSong?.id || "",
      path: songData.path || selectedSong?.path || "",
      dateModified: new Date().toISOString(),
      categories: selectedSong?.categories || [],
    };

    localStorage.setItem("selectedSong", JSON.stringify(updatedSongData));
    dispatch(setSelectedSong(updatedSongData));
    window.api.projectSong(updatedSongData);

    window.api.onDisplaySong((songData) => {
      console.log(`Displaying song: ${songData.title}`);
    });
  };

  // Update form data when selected song changes
  useEffect(() => {
    if (selectedSong) {
      setFormData({
        title: selectedSong.title,
        message: selectedSong.content,
      });
    }
  }, [selectedSong]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setNotification({ show: true, message, type });
  };

  const validateSongData = (): boolean => {
    if (!songRepo) {
      showNotification("Please select a directory first!", "error");
      return false;
    }
    if (!formData?.title.trim()) {
      showNotification("Please enter a song title!", "error");
      return false;
    }
    if (!formData?.message.trim()) {
      showNotification("Please add some song content!", "warning");
      return false;
    }
    return true;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveSong = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateSongData()) {
      return;
    }

    try {
      setIsSaving(true);

      const titleChanged = formData.title !== selectedSong?.title;
      const oldFilePath = selectedSong?.path;

      const saveResult = (await window.api.saveSong(
        songRepo,
        formData.title,
        formData.message
      )) as any;

      if (titleChanged && oldFilePath) {
        try {
          await window.api.deleteSong(oldFilePath);
          console.log(`Deleted old file: ${oldFilePath}`);
        } catch (deleteError) {
          console.warn(
            `Could not delete old file: ${oldFilePath}`,
            deleteError
          );
        }
      }

      const newFilePath =
        saveResult?.filePath || `${songRepo}\\${formData.title.trim()}.txt`;
      const updatedSong: Song = {
        ...selectedSong!,
        title: formData.title,
        content: formData.message,
        dateModified: new Date().toISOString(),
        path: newFilePath,
      };

      dispatch(updateSong(updatedSong));
      await loadSongs();
      projectSong(updatedSong);

      showNotification("Song updated successfully! 🎵", "success");
    } catch (error) {
      console.error("Error saving song:", error);
      showNotification("Failed to save song. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-screen min-h-screen bg-[#fdf4d0] overflow-hidden relative"
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#9a674a]/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9a674a]/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-3/4 left-3/4 w-64 h-64 bg-[#9a674a]/8 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <TitleBar />

      <AnimatePresence>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto px-8 h-full relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-7xl mx-auto pt-24 pb-8 h-full"
        >
          <div className="h-[calc(100vh-8rem)] flex gap-2">
            {/* Left Sidebar - Compact & Cream-themed */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-80 bg-[#fdf4d0]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#e8ddd0]/60 
                         overflow-hidden flex flex-col"
            >
              {/* Header - Cream theme */}
              <div className="bg-gradient-to-r from-[#fdf4d0] to-[#f9f0d8] p-4 text-[#9a674a] border-b border-[#e8ddd0]/40">
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeftCircle
                      className="w-5 h-5 cursor-pointer hover:text-[#8a5739] transition-colors"
                      onClick={() => dispatch(setCurrentScreen("Songs"))}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Monitor
                      className="w-5 h-5 cursor-pointer hover:text-[#8a5739] transition-colors"
                      onClick={() => {
                        const updatedSongForProjection = {
                          ...selectedSong,
                          title: formData.title,
                          content: formData.message,
                          path: selectedSong?.path || "",
                        };
                        projectSong(updatedSongForProjection);
                      }}
                    />
                  </motion.div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#9a674a]/10 backdrop-blur-sm">
                    <Music className="w-4 h-4 text-[#9a674a]" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-[#9a674a]">
                      Edit Song
                    </h1>
                    <p className="text-[#9a674a]/60 text-xs">
                      Modify your lyrics
                    </p>
                  </div>
                </div>
              </div>

              {/* Content - Compact */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto thin-scrollbar">
                {/* Song Title Input */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#9a674a] tracking-wide">
                    <FileText className="w-3 h-3" />
                    Song Title
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-[90%] px-3 py-2 rounded-lg border-2 border-[#9a674a]/20 
                             focus:border-[#9a674a] focus:outline-none bg-[#fdf4d0]/90 backdrop-blur-sm
                             text-[#9a674a] placeholder-[#9a674a]/50 transition-all duration-300
                             shadow-inner hover:shadow-lg focus:shadow-xl font-medium text-sm"
                    placeholder="Enter song title..."
                    required
                  />
                </div>

                {/* Song Info - Compact */}
                {selectedSong && (
                  <div className="bg-gradient-to-br from-[#9a674a]/5 to-[#9a674a]/10 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[#9a674a] flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Song Information
                    </h3>

                    <div className="space-y-2 text-xs text-[#9a674a]/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Modified:{" "}
                          {selectedSong.dateModified
                            ? new Date(
                                selectedSong.dateModified
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          Words:{" "}
                          {
                            formData.message
                              .split(" ")
                              .filter((word) => word.trim() !== "").length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Directory Path */}
                {songRepo && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-[#fdf4d0]/50 to-[#f9f0d8]/50 rounded-xl p-4 border border-[#9a674a]/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="w-4 h-4 text-[#9a674a]" />
                      <span className="text-sm font-semibold text-[#9a674a]">
                        Save Location
                      </span>
                    </div>
                    <p className="text-xs text-[#9a674a]/70 font-mono break-all">
                      {songRepo}
                    </p>
                  </motion.div>
                )}

                {/* Save Button */}
                <form onSubmit={handleSaveSong} className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSaving}
                    className={`w-full px-6 py-4 bg-gradient-to-r from-[#9a674a] to-[#8a5739]
                             hover:from-[#8a5739] hover:to-[#7a4629] text-white rounded-xl 
                             transition-all duration-300 flex items-center justify-center gap-3 
                             shadow-lg hover:shadow-2xl text-base font-semibold tracking-wide
                             ${
                               isSaving ? "opacity-70 cursor-not-allowed" : ""
                             }`}
                  >
                    <Save
                      className={`w-5 h-5 ${isSaving ? "animate-spin" : ""}`}
                    />
                    <span>{isSaving ? "Saving..." : "Save Song"}</span>
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Right Main Editor Area */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex-1 bg-[#fdf4d0]/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#e8ddd0]/40 overflow-hidden"
            >
              <ModernSongEditor formData={formData} setFormData={setFormData} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
