import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderOpen,
  CheckCircle,
  AlertCircle,
  FileText,
  Monitor,
  Edit3,
  Clock,
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
    <div className="fixed top-4 right-4 z-50">
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
    </div>
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

  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ show: false, message: "", type: "success" });

  // Get local theme
  const [localTheme] = useState(localStorage.getItem("bmusictheme") || "white");

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<FormData>({ title: "", message: "" });

  // Update form data when selected song changes
  useEffect(() => {
    if (selectedSong) {
      const newFormData = {
        title: selectedSong.title,
        message: selectedSong.content,
      };
      setFormData(newFormData);
      lastSavedDataRef.current = newFormData;
      setAutoSaveStatus("idle");
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

  // Auto-save function
  const autoSaveSong = useCallback(async () => {
    if (!selectedSong || !validateSongData()) {
      return;
    }

    // Check if data has actually changed
    const hasChanged =
      formData.title !== lastSavedDataRef.current.title ||
      formData.message !== lastSavedDataRef.current.message;

    if (!hasChanged) {
      return;
    }

    try {
      setAutoSaveStatus("saving");

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

      // Update last saved reference
      lastSavedDataRef.current = { ...formData };

      setAutoSaveStatus("saved");

      // Reset to idle after showing saved status
      setTimeout(() => setAutoSaveStatus("idle"), 2000);

      // Reload songs to reflect changes
      loadSongs();
    } catch (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus("error");
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    }
  }, [formData, selectedSong, songRepo, dispatch, loadSongs]);

  // Debounced auto-save effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if we have a selected song and form data has changed
    if (selectedSong && (formData.title.trim() || formData.message.trim())) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveSong();
      }, 2000); // 2 second debounce
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, autoSaveSong, selectedSong]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        <div
          className={`rounded-full ${
            localTheme === "creamy" ? "bg-[#9a674a]/10" : "bg-blue-50"
          }`}
        >
          <Edit3
            className={`h-12 w-12 ${
              localTheme === "creamy" ? "text-[#9a674a]/60" : "text-blue-400"
            }`}
          />
        </div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          {/* Title Input */}
          <div
            className={` rounded-xl border backdrop-blur-sm  ${
              localTheme === "creamy"
                ? "bg-transparent border-solid border-[#9a674a]/20"
                : "bg-stone-50 border-gray-200/60"
            }`}
          >
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter song title..."
              className={`w-full px-4 py-3  rounded-xl transition-all duration-300 text-sm
                       shadow-sm ${
                         localTheme === "creamy"
                           ? "bg-transparent border-solid border border-[#9a674a] text-[#9a674a] placeholder-[#9a674a]/40"
                           : "bg-white border-solid  border border-gray-200  text-gray-700 placeholder-gray-400 "
                       }`}
            />
          </div>

          {/* Content Textarea */}
          <div
            className={`p-2 rounded-xl border backdrop-blur-sm shadow-sm ${
              localTheme === "creamy"
                ? "bg-transparent border-[#9a674a]/20 "
                : "shadow border-gray-200/60"
            }`}
          >
            <SidebarSongEditor
              content={formData.message}
              onChange={(content) =>
                setFormData({ ...formData, message: content })
              }
            />
          </div>

          {/* Auto-Save Status Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`w-full py-2 rounded-xl transition-all duration-300 
                   flex items-center justify-center gap-3 
                   font-medium text-sm border backdrop-blur-sm ${
                     localTheme === "creamy"
                       ? "bg-transparent border-[#9a674a]/20 text-[#9a674a]"
                       : "bg-gray-50 border-gray-200 text-gray-600"
                   }`}
          >
            {autoSaveStatus === "saving" && (
              <>
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Auto-saving...</span>
              </>
            )}
            {autoSaveStatus === "saved" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">
                  Changes saved automatically
                </span>
              </>
            )}
            {autoSaveStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Auto-save failed</span>
              </>
            )}
            {autoSaveStatus === "idle" && (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Changes will save automatically</span>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SidebarEditForm;
