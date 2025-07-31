import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Book,
  ExternalLink,
  Monitor,
  Search,
  ChevronRight,
  ChevronDown,
  Home,
  Settings,
  Users,
  HelpCircle,
} from "lucide-react";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { HomeFilled } from "@ant-design/icons";
import { useAppDispatch } from "@/store";
import { setCurrentScreen, CurrentScreen } from "@/store/slices/appSlice";

// Type definitions
interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface ExpandedGuidesState {
  [key: string]: boolean;
}

const UserGuidePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("presentation");
  const [expandedGuides, setExpandedGuides] = useState<ExpandedGuidesState>({
    internal: true,
    external: false,
  });
  const dispatch = useAppDispatch();
  const setCurrentScreenAction = (screen: CurrentScreen) => dispatch(setCurrentScreen(screen));

  const toggleGuide = (guide: string): void => {
    setExpandedGuides({
      ...expandedGuides,
      [guide]: !expandedGuides[guide],
    });
  };

  const sidebarItems: SidebarItem[] = [
    { id: "presentation", icon: <Monitor size={18} />, label: "Presentation" },
    { id: "settings", icon: <Settings size={18} />, label: "Settings" },
    // { id: "account", icon: <Users size={18} />, label: "Account" },
    { id: "help", icon: <HelpCircle size={18} />, label: "Help & Support" },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-y-scroll no-scrollbar bg-[#faeed1] text-[#9a674a]">
      {/* Sidebar */}
      <motion.div
        className="w-full md:w-64 bg-[#9a674a] text-[#faeed1] p-4 h-full"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-2 mb-8">
          <Book size={24} />
          <h1 className="text-xl font-bold">Application Guide</h1>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search guides..."
            className="w-[80%] border-none bg-[#faeed1]/20 rounded-md py-2 pl-9 pr-4 text-[#faeed1] placeholder-[#faeed1]/60 focus:outline-none focus:ring-2 focus:ring-[#faeed1]/30 text-xs"
          />
          <Search className="absolute left-2 top-2" size={16} />
        </div>

        <nav>
          <ul className="space-y-1">
            <button
                              onClick={() => setCurrentScreenAction("Songs" as CurrentScreen)}
              className={`w-full shadow bg-[#9a674a] text-white flex items-center gap-3 mb-3 space-x-2 p-2 rounded-md transition-colors text-xs}`}
            >
              Home
              <HomeFilled size={18} />
            </button>
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-2 p-2 rounded-md transition-colors text-xs ${
                    activeSection === item.id
                      ? "bg-[#faeed1] text-[#9a674a] font-medium"
                      : "hover:bg-[#faeed1]/10 text-white bg-[#9a674a] font-medium"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="flex-1 p-4 md:p-8 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {activeSection === "presentation" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#9a674a]">
                Presentation Features
              </h2>
              <motion.button
                className="bg-[#9a674a] text-[#faeed1] px-4 py-2 rounded-md text-xs flex items-center space-x-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>View Tutorial</span>
                <ExternalLink size={14} />
              </motion.button>
            </div>

            <p className="text-[#9a674a]/80 mb-8 text-xs">
              Learn how to effectively present your content using our
              comprehensive presentation features. Whether you're presenting
              internally on your device or externally to another screen, all
              procedures are covered
            </p>

            {/* Internal Presentation Guide */}
            <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleGuide("internal")}
                className="w-full flex items-center justify-between bg-[#9a674a]/10 p-4 text-sm font-medium text-[#9a674a]"
              >
                <div className="flex  space-x-2">
                  <Monitor size={18} />
                  <span>Main window Presentation</span>
                </div>
                {expandedGuides.internal ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>

              {expandedGuides.internal && (
                <motion.div
                  className="p-4 text-xs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <p>
                      Internal presentation mode is designed for presenting
                      songs within the main Window
                    </p>

                    <div className="bg-[#faeed1]/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">
                        How to Start an Internal Presentation:
                      </h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>
                          Double click a song within the song list to
                          project(easiest method)
                        </li>
                        <li>
                          Locate the present here button (top right corner)
                        </li>
                        <li>
                          Click the "Present" button in the top-right corner
                        </li>
                      </ol>
                    </div>

                    <div className="bg-[#faeed1]/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">
                        Internal Presentation Controls:
                      </h4>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Use arrow keys to navigate between slides</li>
                        <li>Press 'Esc' to exit the presentation</li>
                        <em>
                          Not all choruses and verses are able to show on one
                          slide.(they contiue in the next slide)
                        </em>
                      </ul>
                    </div>

                    {/* CUSTOMIZABLE SECTION: Add more internal presentation guidelines here */}
                    {/* 
                    <div className="bg-[#faeed1]/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">YOUR CUSTOM SECTION TITLE:</h4>
                      <p>Add your custom content here.</p>
                    </div>
                    */}
                  </div>
                </motion.div>
              )}
            </div>

            {/* External Presentation Guide */}
            <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleGuide("external")}
                className="w-full flex items-center justify-between bg-[#9a674a]/10 p-4 text-sm font-medium text-[#9a674a]"
              >
                <div className="flex  space-x-2">
                  <ExternalLink size={18} />
                  <span>External Presentation</span>
                </div>
                {expandedGuides.external ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>

              {expandedGuides.external && (
                <motion.div
                  className="p-4 text-xs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <p>
                      External presentation mode allows you to share your
                      presentation on external displays
                    </p>

                    <div className="bg-[#faeed1]/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">
                        Setting Up External Presentations:
                      </h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>
                          Connect your device to the external display or
                          projector
                        </li>
                        <li>Click a song in the song list to select</li>

                        <li>
                          Click the "external screen " button in the top-middle
                          corner
                        </li>

                        <li>
                          Select your display configuration (duplicate or
                          extend)
                        </li>
                      </ol>
                    </div>

                    {/* CUSTOMIZABLE SECTION: Add more external presentation guidelines here */}
                    {/* 
                    <div className="bg-[#faeed1]/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">YOUR CUSTOM SECTION TITLE:</h4>
                      <p>Add your custom content here.</p>
                    </div>
                    */}
                  </div>
                </motion.div>
              )}
            </div>

            {/* CUSTOMIZABLE SECTION: Add additional presentation guides here */}

            <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleGuide("customGuide")}
                className="w-full flex i justify-between bg-[#9a674a]/10  text-sm font-medium text-[#9a674a]"
              >
                <div className="flex items-center space-x-2 p-6 text-[12px">
                  {" "}
                  Switching between theme modes is handled by the theme switch,
                  the icon on the title bar
                </div>
                {expandedGuides.customGuide ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            </div>
          </div>
        )}

        {activeSection !== "presentation" && (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#9a674a]/10 mb-4">
                {activeSection === "settings" && (
                  <Settings size={32} className="text-[#9a674a]" />
                )}
                {activeSection === "account" && (
                  <Users size={32} className="text-[#9a674a]" />
                )}
                {activeSection === "help" && (
                  <HelpCircle size={32} className="text-[#9a674a]" />
                )}
              </div>
              <h3 className="text-xl font-medium mb-2 text-[#9a674a]">
                {activeSection === "settings" && "Settings Guide"}
                {activeSection === "account" && "Account Management"}
                {activeSection === "help" && "Help & Support"}
              </h3>
              <p className="text-[#9a674a]/70 max-w-md text-xs">
                This section is under development. Select "Presentation" from
                the sidebar to view our detailed presentation guide.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserGuidePage;
