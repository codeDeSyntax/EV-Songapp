import React from "react";
import { FileMusic, Plus, CogIcon, Group, MonitorSpeaker } from "lucide-react";

interface SidebarTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  localTheme: string;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({
  activeTab,
  setActiveTab,
  localTheme,
}) => {
  const getTabClasses = (tabName: string) => {
    const isActive = activeTab === tabName;
    return `py-2 rounded-md shadow text-[10px] px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
      isActive && localTheme === "creamy"
        ? "bg-vmprim text-white"
        : isActive && localTheme === "white"
        ? "bg-vmprim text-white"
        : "text-stone-600 bg-[#fdf4d0]"
    }`;
  };

  return (
    <div className="px-2 flex-shrink-0">
      <div
        className={`flex space-x-1 ${
          localTheme === "creamy" ? "bg-[#faeed1]" : "bg-[#ececeb]"
        } p-1 rounded-lg`}
      >
        <button
          onClick={() => setActiveTab("Song")}
          className={getTabClasses("Song")}
        >
          <FileMusic className="h-4 w-4" />
          Songs
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={getTabClasses("create")}
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={getTabClasses("settings")}
        >
          <CogIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => setActiveTab("collections")}
          className={getTabClasses("collections")}
        >
          <Group className="h-4 w-4" />
         
        </button>

        <button
          onClick={() => setActiveTab("display")}
          className={getTabClasses("display")}
        >
          <MonitorSpeaker className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SidebarTabs;
