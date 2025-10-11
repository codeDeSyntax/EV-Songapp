import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Monitor,
  Edit3,
  Clock,
  Folder,
  Hash,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSongRepo,
  setSelectedSong,
  updateSong,
} from "@/store/slices/songSlice";
import { Song } from "@/types";
import SidebarSongEditor from "./SidebarSongEditor";

interface FormData {
  title: string;
  message: string;
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
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-4 right-4 z-50"
    >
      <div
        className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-lg
                     flex items-center gap-2 border border-white/20 text-sm`}
      >
        {type === "success" ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

const SidebarEditForm: React.FC = () => {
  const { selectedSong, loadSongs, changeDirectory } = useSongOperations();
  const dispatch = useAppDispatch();
  const songRepo = useAppSelector((state) => state.songs.songRepo);

  const [formData, setFormData] = useState<FormData>({
    title: selectedSong?.title || "",
    message: selectedSong?.content || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  // Get local theme
  const [localTheme] = useState(localStorage.getItem("bmusictheme") || "white");

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

  const selectDirectory = async () => {
    const path = await window.api.selectDirectory();
    if (typeof path === "string") {
      dispatch(setSongRepo(path));
    }
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

    if (!selectedSong) {
      showNotification("No song selected to edit!", "error");
      return;
    }

    try {
      setIsSaving(true);

      const titleChanged = formData.title !== selectedSong.title;
      const oldFilePath = selectedSong.path;

      await window.api.saveSong(songRepo, formData.title, formData.message);

      // If title changed, delete the old file
      if (titleChanged && oldFilePath) {
        try {
          await window.api.deleteSong(oldFilePath);
        } catch (error) {
          console.warn("Could not delete old file:", error);
        }
      }

      // Update the song in Redux store
      const updatedSong: Song = {
        ...selectedSong,
        title: formData.title,
        content: formData.message,
        path: selectedSong.path,
        dateModified: new Date().toISOString(),
        size: selectedSong.size,
      };

      dispatch(updateSong(updatedSong));
      dispatch(setSelectedSong(updatedSong));

      showNotification("Song updated successfully! ✨", "success");

      // Reload songs to reflect changes
      loadSongs();
    } catch (error) {
      console.error("Error saving song:", error);
      showNotification(
        "Failed to save song changes. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const projectSong = () => {
    if (!formData.title || !formData.message || !selectedSong) {
      showNotification(
        "Please enter title and content before presenting!",
        "warning"
      );
      return;
    }

    const songData: Song = {
      ...selectedSong,
      id: selectedSong.id || Date.now().toString(),
      title: formData.title,
      content: formData.message,
      dateModified: new Date().toISOString(),
      size: selectedSong.size,
    };

    localStorage.setItem("selectedSong", JSON.stringify(songData));
    dispatch(setSelectedSong(songData));
    window.api.projectSong(songData);
  };

  const getLastModified = () => {
    if (!selectedSong?.dateModified) return "Unknown";
    return new Date(selectedSong.dateModified).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWordCount = () => {
    const text = formData.message.replace(/<[^>]*>/g, "").trim();
    return text ? text.split(/\s+/).length : 0;
  };

  if (!selectedSong) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 ">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-full ${
            localTheme === "creamy" ? "bg-[#9a674a]/10" : "bg-blue-50"
          }`}
        >
          <Edit3
            className={`h-12 w-12 ${
              localTheme === "creamy" ? "text-[#9a674a]/60" : "text-blue-400"
            }`}
          />
        </motion.div>
        <h3
          className={`text-lg font-bold mt-4 mb-2 ${
            localTheme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
          }`}
        >
          No Song Selected
        </h3>
        <p
          className={`text-sm max-w-xs ${
            localTheme === "creamy" ? "text-[#9a674a]/60" : "text-gray-500"
          }`}
        >
          Please select a song from the main list to edit it
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col ">
      <AnimatePresence>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar ">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSaveSong}
          className="space-y-5"
        >
          {/* Directory Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={` rounded-xl border backdrop-blur-sm shadow-sm ${
              localTheme === "creamy"
                ? " border-[#9a674a]/20 bg-transparent"
                : " border-gray-200/60"
            }`}
          >
            <label
              className={`flex items-center gap-2 text-sm mb-3 ${
                localTheme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Directory
            </label>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={selectDirectory}
              className={`w-full px-4 py-2 border-2 rounded-xl italic transition-all duration-300 text-sm
                       flex items-center justify-between shadow-sm hover:shadow-md ${
                         localTheme === "creamy"
                           ? " bg-primary text-white shadow focus:ring-[#9a674a]/30"
                           : "bg-white border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-blue-50/50 focus:ring-blue-500/30"
                       } focus:outline-none focus:ring-2`}
            >
              <span className="truncate">{songRepo || "Select folder..."}</span>
              <FolderOpen className="w-4 h-4 shrink-0" />
            </motion.button>
          </motion.div>

          {/* Title Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={` rounded-xl border backdrop-blur-sm shadow-sm ${
              localTheme === "creamy"
                ? "bg-transparent border-[#9a674a]/20"
                : "bg-stone-50 border-gray-200/60"
            }`}
          >
            <label
              className={`flex items-center gap-2 text-sm mb-3 ${
                localTheme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Song Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter song title..."
              className={`w-full px-4 py-3 outline-none  border-none rounded-xl transition-all duration-300 text-sm
                       shadow-sm ${
                         localTheme === "creamy"
                           ? "bg-[#faeed1] border-none text-[#9a674a] placeholder-[#9a674a]/40"
                           : "bg-white border-gray-200 focus:border-blue-500 text-gray-700 placeholder-gray-400 focus:shadow-md"
                       }`}
            />
          </motion.div>

          {/* Content Textarea */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-2 rounded-xl border backdrop-blur-sm shadow-sm ${
              localTheme === "creamy"
                ? "bg-transparent border-[#9a674a]/20 "
                : "shadow border-gray-200/60"
            }`}
          >
            <label
              className={`flex items-center gap-2 text-sm mb-3 ${
                localTheme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Song Content
            </label>
            <SidebarSongEditor
              content={formData.message}
              onChange={(content) =>
                setFormData({ ...formData, message: content })
              }
            />
          </motion.div>

          {/* Save Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
            type="submit"
            disabled={isSaving}
            className={`w-full py-2 rounded-xl transition-all duration-300 
                   flex items-center justify-center gap-3 shadow-lg hover:shadow-xl
                   font-medium text-sm border backdrop-blur-sm ${
                     localTheme === "creamy"
                       ? "bg-transparent border-primary border-solid  text-primary border-[#9a674a]/30"
                       : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-600/30"
                   } ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <Save className={`w-5 h-5 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "Updating..." : "Update Song"}</span>
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default SidebarEditForm;
