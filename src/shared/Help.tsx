import React, { useState } from "react";
import {
  HelpCircle,
  X,
  Music,
  Book,
  Presentation,
  Home,
  Monitor,
  Keyboard,
  Image,
  Save,
  FolderOpen,
  ArrowLeftRight,
} from "lucide-react";

interface ShortcutItem {
  key: string;
  description: string;
}

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  items: ShortcutItem[];
}

const Help: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHelp = () => {
    setIsOpen(!isOpen);
  };

  const helpData: HelpSection[] = [
    {
      title: "Song List Navigation",
      icon: <Music className="h-4 w-4" />,
      items: [
        {
          key: "Enter",
          description: "Present the selected song in another window",
        },
        {
          key: '"Present here" icon',
          description: "Present the song in the same window",
        },
      ],
    },
    {
      title: "Presentation Controls",
      icon: <Monitor className="h-4 w-4" />,
      items: [{ key: "ESC", description: "Exit presentation" }],
    },
    {
      title: "Background Settings",
      icon: <Image className="h-4 w-4" />,
      items: [
        {
          key: "Choose directory",
          description:
            "Select a folder from your device to use your backgrounds (uses only five images)",
        },
        { key: "Default", description: "Use app default backgrounds" },
      ],
    },
    {
      title: "File Management",
      icon: <Save className="h-4 w-4" />,
      items: [
        {
          key: "Save location",
          description:
            "New songs are saved on your device (requires you to choose a path)",
        },
      ],
    },
    {
      title: "Presentation Master",
      icon: <Presentation className="h-4 w-4" />,
      items: [
        { key: "CTRL + P", description: "Toggle on Presentation master" },
        { key: "Menu", description: "Check out shortcuts in the menu" },
      ],
    },
    {
      title: "General Shortcuts",
      icon: <Keyboard className="h-4 w-4" />,
      items: [
        { key: "CTRL + H", description: "Navigate to Home" },
        { key: "CTRL + S", description: "Navigate to Songs" },
      ],
    },
  ];

  return (
    <>
      <div
        onClick={toggleHelp}
        className="w-6 h-6 rounded-full flex items-center justify-center group cursor-pointer  hover:bg-gray-50 dark:hover:bg-bgray"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </div>

      {/* Full Screen Help Modal */}
      {isOpen && (
        <div className="absolute left-0 top-0 h-screen w-screen  bg-white dark:bg-ltgray  overflow-y-auto no-scrollbar transition-all duration-200">
          <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <HelpCircle
                  size={20}
                  className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"
                />
                <span>Help Center</span>
              </h1>
              <button
                onClick={toggleHelp}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close help"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Help Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-gray-50 dark:bg-bgray/20 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all hover:shadow-sm dark:hover:shadow-gray-800/10">
                <img
                  src="./something-lost.png"
                  className="w-full h-32 object-cover"
                  alt="Help Center"
                />
                <div className="p-4">
                  <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Help Center
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Find answers to your questions and learn how to use the app
                    effectively.
                  </p>
                </div>
              </div>
              {helpData.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="bg-gray-50 dark:bg-bgray/20 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all hover:shadow-sm dark:hover:shadow-gray-800/10"
                >
                  <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/50">
                      {React.cloneElement(section.icon as React.ReactElement, {
                        className:
                          "h-4 w-4 text-purple-500 dark:text-purple-400",
                      })}
                    </div>
                    <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h2>
                  </div>
                  <div className="p-3 sm:p-4">
                    <ul className="space-y-2.5">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <span className="inline-block bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800 dark:text-gray-200 mr-1.5 mb-1">
                              {item.key}
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Access Section */}
            <div className="mt-8 bg-gray-50 dark:bg-bgray/20 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-purple-500" />
                Quick Access
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: <Home className="h-4 w-4" />,
                    label: "Home",
                    shortcut: "CTRL + H",
                  },
                  {
                    icon: <Music className="h-4 w-4" />,
                    label: "Songs",
                    shortcut: "CTRL + S",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-ltgray rounded-md border border-gray-200 dark:border-gray-800 p-2.5 flex flex-col items-center text-center hover:shadow-xs dark:hover:shadow-gray-800/10 transition-all cursor-pointer"
                  >
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-1.5 rounded-md mb-1.5">
                      {React.cloneElement(item.icon as React.ReactElement, {
                        className:
                          "h-4 w-4 text-purple-500 dark:text-purple-400",
                      })}
                    </div>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {item.label}
                    </span>
                    <span className="text-[0.65rem] text-gray-500 dark:text-gray-500 mt-0.5">
                      {item.shortcut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Help;
