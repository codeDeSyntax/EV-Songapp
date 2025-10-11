import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Monitor,
  Plus,
  Folder,
  Clock,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSongRepo } from "@/store/slices/songSlice";
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

const SidebarCreateForm: React.FC = () => {
  const { loadSongs, changeDirectory } = useSongOperations();
  const dispatch = useAppDispatch();
  const songRepo = useAppSelector((state) => state.songs.songRepo);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    message: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  // Get local theme
  const [localTheme] = useState(localStorage.getItem("bmusictheme") || "white");

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

    try {
      setIsSaving(true);
      const filePath = await window.api.saveSong(
        songRepo,
        formData.title,
        formData.message
      );
      showNotification("Song created successfully! 🎵", "success");
      setFormData({ title: "", message: "" });
      // Reload songs to show the new one
      loadSongs();
    } catch (error) {
      console.error("Error saving song:", error);
      showNotification("Failed to save song. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const projectSong = () => {
    if (!formData.title || !formData.message) {
      showNotification(
        "Please enter title and content before presenting!",
        "warning"
      );
      return;
    }

    const songData = {
      title: formData.title,
      content: formData.message,
      id: Date.now().toString(),
      path: "",
      dateModified: new Date().toISOString(),
      categories: [],
    };

    window.api.projectSong(songData);
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
    <div className="h-full flex flex-col font-[garamond] ">
      <AnimatePresence>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}
      </AnimatePresence>

      {/* Header */}

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
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
            className="space-y-2"
          >
            <label
              className={`flex items-center gap-2 text-sm font-semibold ${
                localTheme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Directory
            </label>
            <button
              type="button"
              onClick={selectDirectory}
              className={`w-full px-4 py-2 border-2 rounded-xl transition-all duration-300 text-sm
                       flex items-center justify-between shadow-sm hover:shadow-md ${
                         localTheme === "creamy"
                           ? "shadow-inner  bg-[#9a674a] italic text-white border-[#9a674a]/20 hover:border-[#9a674a]/40  hover:bg-white"
                           : "bg-white border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-blue-50/50"
                       }`}
            >
              <span className="truncate font-medium">
                {songRepo || "Select folder..."}
              </span>
              <FolderOpen className="w-4 h-4 shrink-0" />
            </button>
          </motion.div>

          {/* Title Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <label
              className={`flex items-center gap-2 text-sm font-semibold ${
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
              placeholder="Enter a beautiful song title..."
              className={`w-full px-4 py-3 shadow text-primary bg-[#faeed1] border-none rounded-xl transition-all duration-300 text-sm
                       focus:outline-none hover:shadow-md ${
                         localTheme === "creamy"
                           ? "bg-tr border-[#9a674a]/20 focus:ring-[#9a674a]/20 focus:border-[#9a674a] text-[#9a674a] placeholder-[#9a674a]/40"
                           : "bg-white border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 placeholder-gray-400"
                       }`}
            />
          </motion.div>

          {/* Content Editor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <label
              className={`flex items-center gap-2 text-sm font-semibold ${
                localTheme === "creamy" ? "text-[#9a674a]" : "text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Song Content
            </label>
            <div
              className={`border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                localTheme === "creamy"
                  ? "border-[#9a674a]/20 focus-within:ring-4 focus-within:ring-[#9a674a]/20 focus-within:border-[#9a674a]"
                  : "border-gray-200 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500"
              }`}
              style={{ minHeight: "220px" }}
            >
              <SidebarSongEditor
                content={formData.message}
                onChange={(content) =>
                  setFormData({ ...formData, message: content })
                }
                theme={localTheme === "creamy" ? "creamy" : "white"}
              />
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className={`w-full  py-2 rounded-xl transition-all duration-300 
                   flex items-center justify-center gap-3 shadow-lg hover:shadow-xl
                   font-bold text-sm  tracking-wide ${
                     localTheme === "creamy"
                       ? "border border-primary text-primary bg-transparent border-solid"
                       : " border border-primary text-primary bg-transparent border-solid"
                   } ${
              isSaving
                ? "opacity-70 cursor-not-allowed"
                : "transform hover:translate-y-[-2px]"
            }`}
          >
            <Save className={`w-5 h-5 ${isSaving ? "animate-spin" : ""}`} />
            <span className="">{isSaving ? "Creating..." : "Create Song"}</span>
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default SidebarCreateForm;
