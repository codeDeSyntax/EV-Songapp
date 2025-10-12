import React, { useState, useEffect } from "react";
import { Song } from "../../types";
import { Music, FileMusic, Plus, CogIcon, Group, MonitorSpeaker, Sun } from "lucide-react";
import { motion } from 'framer-motion';
import { MoonFilled } from "@ant-design/icons";

// Import modular components
import SongTabContent from "./components/tabs/SongTabContent";
import SettingsTabContent from "./components/tabs/SettingsTabContent";
import CollectionsTabContent from "./components/tabs/CollectionsTabContent";
import DisplayTabContent from "./components/tabs/DisplayTabContent";

// Import forms
import SidebarCreateForm from "../components/sidebar-forms/SidebarCreateForm";

interface ModularSidebarProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  savedFavorites: Song[];
  setSavedFavorites: (songs: Song[]) => void;
}

const ModularSidebar: React.FC<ModularSidebarProps> = ({
  activeTab,
  setActiveTab,
  savedFavorites,
  setSavedFavorites,
}) => {
  // Add local theme state management
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  // State for collections
  const [newCollectionName, setNewCollectionName] = useState("");

  // Load saved theme on component mount and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("bmusictheme");
    if (savedTheme) {
      setLocalTheme(savedTheme);
    }

    // Listen for localStorage changes (when theme is changed from TitleBar)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "bmusictheme") {
        setLocalTheme(e.detail.newValue);
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, []);

  // Theme toggle function for songs app
  const toggleSongTheme = () => {
    const newTheme = localTheme === "creamy" ? "white" : "creamy";
    setLocalTheme(newTheme);
    localStorage.setItem("bmusictheme", newTheme);

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: "bmusictheme", newValue: newTheme },
      })
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Song":
        return (
          <SongTabContent 
            activeTab={activeTab}
            localTheme={localTheme}
          />
        );

      case "settings":
        return (
          <SettingsTabContent 
            localTheme={localTheme}
          />
        );

      case "collections":
        return (
          <CollectionsTabContent 
            localTheme={localTheme}
            newCollectionName={newCollectionName}
            setNewCollectionName={setNewCollectionName}
          />
        );

      case "create":
        return (
          <div className="h-[85vh] overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <SidebarCreateForm />
            </motion.div>
          </div>
        );

      case "display":
        return <DisplayTabContent localTheme={localTheme} />;

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-72 h-full pt-2 border-1 border-dashed border-primary/20 bg-white/20 backdrop-blur-sm transition-all duration-300 ease-in-out flex flex-col rounded-t-3xl shadow ${
        localTheme === "creamy" ? "bg-[#f1e3ae]" : "bg-white"
      }`}
      style={{
        backgroundColor: localTheme === "creamy" ? "#fdf4d0" : "white",
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between flex-shrink-0">
        <h2 className="font-ThePriest text-[15px] s font-bold text-vmprim border-vmprim flex items-center gap-2"
        style={{
          fontFamily:"ThePriest"
        }}
        >
          <Music className="w-5 h-5 animate-bounce" />
          Soul healing music
          <Music className="w-5 h-5 animate-bounce" />
        </h2>
        <button
          onClick={toggleSongTheme}
          className={`p-2 rounded-full transition-colors ${
            localTheme === "creamy"
              ? "bg-[#9a674a] text-white hover:bg-[#8a564a]"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={`Switch to ${
            localTheme === "creamy" ? "white" : "creamy"
          } theme`}
        >
          <div className="w-4 h-4 rounded-full border-2 border-current bg-[#9a674a]">
            {" "}
            {localTheme === "creamy" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <MoonFilled className="w-4 h-4 text-[#faeed1]" />
            )}
          </div>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="px-2 flex-shrink-0">
        <div
          className={`flex space-x-1 ${
            localTheme === "creamy" ? "bg-[#faeed1]" : "bg-[#ececeb]"
          } p-1 rounded-lg`}
        >
          <button
            onClick={() => setActiveTab("Song")}
            className={`py-2 rounded-md shadow text-[10px] px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === "Song" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "Song" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            <FileMusic className="h-4 w-4" />
            Songs
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`py-2 rounded-md shadow text-[10px] px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === "create" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "create" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            <Plus className="h-4 w-4" />
            {/* Create */}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2 rounded-md shadow text-[10px] px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === "settings" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "settings" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            <CogIcon className="h-4 w-4" />
            {/* Settings */}
          </button>
          <button
            onClick={() => setActiveTab("collections")}
            className={`py-2 rounded-md shadow text-[10px] px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === "collections" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "collections" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            <Group className="h-4 w-4" />
            Collections
          </button>
          <button
            onClick={() => setActiveTab("display")}
            className={`py-2 rounded-md shadow text-[10px] px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === "display" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "display" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            <MonitorSpeaker className="h-4 w-4" />
           
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};

export default ModularSidebar;