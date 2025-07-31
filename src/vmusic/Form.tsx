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
  FileText,
  Calendar,
  Hash,
  Monitor,
} from "lucide-react";
import TitleBar from "../shared/TitleBar";
import ModernSongEditor from "./ModernSongEditor";
import { motion, AnimatePresence } from "framer-motion";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSongRepo } from "@/store/slices/songSlice";
import { setCurrentScreen } from "@/store/slices/appSlice";

interface CreateSong {
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
}

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
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-8 left-1/2 z-50 transform -translate-x-1/2"
    >
      <div
        className={`${bgColor} text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-lg
                     flex items-center gap-3 border border-white/20`}
      >
        {type === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : type === "warning" ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </motion.div>
  );
};

export default function CreateSong() {
  const { selectedSong, loadSongs, changeDirectory } = useSongOperations();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.app.theme);
  const songRepo = useAppSelector((state) => state.songs.songRepo);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

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

  const projectSong = (songData: any) => {
    const updatedSongData = {
      ...songData,
      title: formData.title,
      content: formData.message,
      id: `temp-${Date.now()}`,
      path: `${songRepo}/${formData.title}.txt`,
      dateModified: new Date().toISOString(),
      categories: [],
    };

    window.api.projectSong(updatedSongData);

    window.api.onDisplaySong((songData) => {
      console.log(`Displaying song: ${songData.title}`);
    });
  };

  const validateSongData = (): boolean => {
    if (!songRepo) {
      showNotification("Please select a directory first!", "error");
      return false;
    }
    if (!formData.title.trim()) {
      showNotification("Please enter a song title!", "error");
      return false;
    }
    if (!formData.message.trim()) {
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

  const selectDirectory = async () => {
    const path = await window.api.selectDirectory();
    if (typeof path === "string") {
      dispatch(setSongRepo(path));
    }
  };

  const handleSaveSong = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateSongData()) {
      return;
    }

    try {
      setIsSaving(true);
      const filePath = await window.api.saveSong(
        songRepo,
        formData.title,
        formData.message
      );
      showNotification("Song created successfully! 🎵", "success");
      console.log("Song saved successfully");
      setFormData({ title: "", message: "" });
    } catch (error) {
      console.error("Error saving song:", error);
      showNotification("Failed to save song. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getWordCount = () => {
    const text = formData.message.replace(/<[^>]*>/g, "").trim();
    return text ? text.split(/\s+/).length : 0;
  };

  return (
    <>
      <TitleBar />
      <div className="h-screen pt-24 bg-[#faeed1] no-scrollbar overflow-hidden">
        <AnimatePresence>
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
            />
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-6 h-[100vh] overflow-hidden">
          <div className="flex gap-6 h-[85%]">
            {/* Left Sidebar - Compact */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-96 bg-[#fdf4d0]/80 backdrop-blur-xl rounded-2xl shadow-xl border border-[#e8ddd0]/40 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#fdf4d0] to-[#f9f0d8] p-4 text-[#9a674a] border-b border-[#e8ddd0]/40 shrink-0">
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
                        if (formData.title && formData.message) {
                          projectSong(formData);
                        } else {
                          showNotification(
                            "Please enter title and content before presenting!",
                            "warning"
                          );
                        }
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
                      Create Song
                    </h1>
                    <p className="text-[#9a674a]/60 text-xs">
                      Write new lyrics
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Section - Compact */}
              <div className="flex-1 p-4 overflow-y-auto">
                <form onSubmit={handleSaveSong} className="space-y-4">
                  <div className="space-y-3">
                    {/* Directory Selection */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#9a674a]">
                        <FolderOpen className="w-3 h-3" />
                        Directory
                      </label>
                      <div
                        onClick={selectDirectory}
                        className="w-[90%] px-3 py-2 bg-yellow-400/20 border border-[#e8ddd0] rounded-lg 
                                 hover:bg-[#fdf4d0]/30 transition-all duration-200 text-[#9a674a] text-sm
                                 flex items-center justify-between"
                      >
                        <span className="truncate">
                          {songRepo || "Select folder..."}
                        </span>
                        <FolderOpen className="w-3 h-3 shrink-0" />
                      </div>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#9a674a]">
                        <FileText className="w-3 h-3" />
                        Song Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter song title..."
                        className="w-[90%] px-3 py-2 bg-yellow-300/20 border-none border-[#e8ddd0] rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-[#9a674a]/30 focus:border-[#9a674a]
                                 transition-all duration-200 text-[#9a674a] placeholder-[#9a674a]/40 text-sm"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="bg-[#9a674a]/5 rounded-lg p-3 border border-dashed border-[#9a674a]/20">
                      <div className="space-y-1 text-xs text-[#9a674a]/70">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created:
                          </span>
                          <span className="font-mono">{getCurrentDate()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            Words:
                          </span>
                          <span className="font-mono">{getWordCount()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`w-full py-2.5 bg-[#9a674a] hover:bg-[#8a5739]
                           text-white rounded-lg transition-all duration-300 
                           flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                           font-semibold text-sm uppercase tracking-wide
                           ${
                             isSaving
                               ? "opacity-70 cursor-not-allowed"
                               : "hover:scale-[1.02]"
                           }`}
                  >
                    <Save
                      className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`}
                    />
                    <span>{isSaving ? "Saving..." : "Save Song"}</span>
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Editor Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-[#fdf4d0]/50 backdrop-blur-xl rounded-2xl shadow-xl border-1 border-[#a6795b]/40 overflow-hidden border-dashed"
            >
              <ModernSongEditor formData={formData} setFormData={setFormData} />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
