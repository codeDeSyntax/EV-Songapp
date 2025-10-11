import React, { useState, useEffect } from "react";
import {
  Monitor,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MonitorSpeaker,
  Tv,
  ArrowRightLeft,
  Copy,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
// Enhanced API types

interface Display {
  id: number;
  label: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
  touchSupport: string;
  monochrome: boolean;
  accelerometerSupport: string;
  colorSpace: string;
  colorDepth: number;
  depthPerComponent: number;
  size: {
    width: number;
    height: number;
  };
  workAreaSize: {
    width: number;
    height: number;
  };
  internal: boolean;
}

interface DisplayPreferences {
  preferredDisplayId?: number;
  fallbackToLargest: boolean;
  projectionMode?: "extend" | "duplicate";
  lastUpdated: string;
}

interface DisplayTabContentProps {
  localTheme: string;
}

const DisplayTabContent: React.FC<DisplayTabContentProps> = ({
  localTheme,
}) => {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [preferences, setPreferences] = useState<DisplayPreferences>({
    fallbackToLargest: true,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingDisplay, setTestingDisplay] = useState<number | null>(null);

  // Display mode configurations
  const displayModes = [
    {
      key: "extend" as const,
      icon: ArrowRightLeft,
      title: "Extend",
      description: "Separate screens",
      isActive: (preferences as any).projectionMode === "extend",
    },
    {
      key: "duplicate" as const,
      icon: Copy,
      title: "Duplicate",
      description: "Mirror screens (Windows + P)",
      isActive: (preferences as any).projectionMode === "duplicate",
    },
    {
      key: "internal" as const,
      icon: Monitor,
      title: "PC Only",
      description: "Primary screen only",
      isActive: false, // These don't have active states since they're one-time actions
    },
    {
      key: "external" as const,
      icon: Tv,
      title: "External Only",
      description: "Second screen only",
      isActive: false,
    },
  ];

  // Load displays function
  const loadDisplays = async () => {
    await loadDisplayInfo();
  };

  // Load displays and preferences on component mount
  useEffect(() => {
    loadDisplays();
    loadPreferences();
  }, []);

  const loadDisplayInfo = async () => {
    setIsLoading(true);
    try {
      // Use existing display detection API
      if (window.api?.getDisplayInfo) {
        const displayList = await window.api.getDisplayInfo();
        if (displayList?.success && displayList.data) {
          setDisplays(displayList.data.allDisplays || []);
        }
      }
    } catch (error) {
      console.error("Failed to load displays:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const api = window.api as any;
      if (api?.loadDisplayPreferences) {
        const response = await api.loadDisplayPreferences();
        if (response?.success && response.data) {
          setPreferences({
            ...preferences,
            ...response.data,
            projectionMode: response.data.mode || preferences.projectionMode,
            preferredDisplayId:
              response.data.displayId || preferences.preferredDisplayId,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const savePreferences = async (newPrefs: DisplayPreferences) => {
    try {
      const api = window.api as any;
      if (api?.saveDisplayPreferences) {
        const saveData = {
          displayId: newPrefs.preferredDisplayId,
          mode: newPrefs.projectionMode || "extend",
          fallbackToLargest: newPrefs.fallbackToLargest,
          lastUpdated: newPrefs.lastUpdated,
        };

        const response = await api.saveDisplayPreferences(saveData);
        if (response?.success) {
          console.log("✅ Display preferences saved successfully");
        }
      }
      setPreferences(newPrefs);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  const handleDisplaySelect = (displayId: number) => {
    const newPrefs = {
      ...preferences,
      preferredDisplayId: displayId,
      lastUpdated: new Date().toISOString(),
    };
    savePreferences(newPrefs);
  };

  const handleFallbackToggle = () => {
    const newPrefs = {
      ...preferences,
      fallbackToLargest: !preferences.fallbackToLargest,
      lastUpdated: new Date().toISOString(),
    };
    savePreferences(newPrefs);
  };

  const testDisplay = async (displayId: number) => {
    setTestingDisplay(displayId);
    try {
      // Create a simple test song for projection
      const testSong = {
        title: "Display Test",
        content: "🎵 Display Test - East Voice Songs",
        verses: [
          {
            content:
              "This is a display test. If you can see this, the display is working correctly!",
          },
        ],
      };

      // Use existing projection API
      if (window.api?.projectSong) {
        await window.api.projectSong(testSong);
        console.log("✅ Display test completed for display:", displayId);
      } else {
        console.log("Projection API not available");
      }
    } catch (error) {
      console.error("Failed to test display:", error);
    } finally {
      setTimeout(() => setTestingDisplay(null), 3000);
    }
  };

  const resetPreferences = () => {
    const defaultPrefs = {
      fallbackToLargest: true,
      lastUpdated: new Date().toISOString(),
    };
    savePreferences(defaultPrefs);
  };

  const getDisplayType = (display: Display) => {
    if (display.internal) return "Internal";
    return "External";
  };

  const getDisplayResolution = (display: Display) => {
    return `${display.bounds.width} × ${display.bounds.height}`;
  };

  const isPrimaryDisplay = (display: Display) => {
    return display.bounds.x === 0 && display.bounds.y === 0;
  };

  // Handle Windows display mode changes (like Windows + P)
  const handleWindowsDisplayMode = async (
    mode: "extend" | "duplicate" | "internal" | "external"
  ) => {
    setIsLoading(true);
    try {
      console.log(`🖥️ Setting Windows display mode to: ${mode}`);

      const api = window.api as any;
      if (api?.setWindowsDisplayMode) {
        const result = await api.setWindowsDisplayMode(mode);

        if (result?.success) {
          // Update local preferences
          const newPrefs: DisplayPreferences = {
            ...preferences,
            projectionMode: mode === "duplicate" ? "duplicate" : "extend",
            lastUpdated: new Date().toISOString(),
          };
          savePreferences(newPrefs);

          console.log(`✅ Windows display mode set to: ${mode}`);

          // Wait a moment for display change, then reload display info
          setTimeout(() => {
            loadDisplayInfo();
          }, 2000);
        } else {
          console.error(
            `❌ Failed to set display mode: ${result?.error || "Unknown error"}`
          );
        }
      } else {
        console.error("Windows display mode API not available");
      }
    } catch (error) {
      console.error("Failed to set Windows display mode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {testingDisplay && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="p-3 rounded-lg border flex items-center gap-2 text-sm bg-[#faeed1]/50 border-[#e6d3b7] text-[#8b6f3d]"
        >
          <Monitor className="w-4 h-4" />
          Testing display {testingDisplay}...
        </motion.div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h3
          className="text-lg font-semibold flex items-center gap-2"
          style={{ fontFamily: "Georgia" }}
        >
          <MonitorSpeaker className="w-5 h-5" />
          Display Configuration
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed">
          Configure which display to use for song projection. This solves issues
          where projection appears on the wrong screen.
        </p>
        <hr className="h-0 border-[#9a674a]/20" />
      </div>

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-stone-700">
          Available Displays
        </h4>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadDisplays}
          disabled={isLoading}
          className={`px-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs ${
            localTheme === "creamy"
              ? "bg-[#faeed1] border border-[#e6d3b7] text-[#8b6f3d] hover:bg-[#f7e6c4]"
              : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Display List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading displays...
            </div>
          </div>
        ) : displays && displays.length > 0 ? (
          <div className="space-y-2">
            {displays.map((display) => {
              const isSelected = preferences.preferredDisplayId === display.id;
              const isPrimary = isPrimaryDisplay(display);

              return (
                <motion.div
                  key={display.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDisplaySelect(display.id)}
                  className={`px-3 py-1 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? localTheme === "creamy"
                        ? "bg-[#faeed1] border-[#9a674a] border-dashed"
                        : "bg-gray-100 border-gray-300 border-dashed "
                      : localTheme === "creamy"
                      ? "bg-[#fdf4d0] shadow border-[#e6d3b7] hover:border-[#d4c5a9]"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={` rounded-lg ${
                          isSelected
                            ? localTheme === "creamy"
                              ? "0 border border-[#9a674a]"
                              : "bg-[#faeed1]/30 border border-[#9a674a]"
                            : "bg-transparent border border-gray-200"
                        }`}
                      >
                        <img
                          src={isPrimary ? "/laptop.png" : "/flatscreen.png"}
                          alt={isPrimary ? "Laptop" : "External Display"}
                          className="w-14 h-10 object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {isPrimary ? "Main Display" : "External Monitor"}
                          {isPrimary && (
                            <span className="text-xs ml-1 px-1.5 py-0.5 bg-orange-100 text-black rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500">
                          {display.bounds.width} × {display.bounds.height}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-[#9a674a]" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-stone-500 text-sm">
            No display information available. Click refresh to try again.
          </div>
        )}
      </div>

      {/* Windows Display Mode */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-stone-700">
          Windows Display Mode (like Windows + P)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {displayModes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <motion.button
                key={mode.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleWindowsDisplayMode(mode.key)}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  mode.isActive
                    ? localTheme === "creamy"
                      ? "bg-[#faeed1] border-dashed border-[#9a674a]/20 shadow-md"
                      : "bg-gray-200 border-dashed border border-gray-400 shadow-md"
                    : localTheme === "creamy"
                    ? "bg-[#fdf4d0] shadow-md border-[#e6d3b7] hover:border-[#d4c5a9]"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <IconComponent className="w-5 h-5 mb-2 mx-auto" />
                <div className="text-sm font-medium">{mode.title}</div>
                <div className="text-xs text-stone-500">{mode.description}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Apply Button */}
      <motion.button
        whileHover={{ scale: preferences.preferredDisplayId ? 1.02 : 1 }}
        whileTap={{ scale: preferences.preferredDisplayId ? 0.98 : 1 }}
        onClick={async () => {
          if (preferences.preferredDisplayId) {
            // Validate that the display still exists
            const selectedDisplay = displays.find(
              (d) => d.id === preferences.preferredDisplayId
            );
            if (!selectedDisplay) {
              console.warn(
                "Selected display no longer available, please refresh displays"
              );
              await loadDisplays();
              return;
            }

            // Test the display
            testDisplay(preferences.preferredDisplayId);
          }
        }}
        disabled={!preferences.preferredDisplayId || testingDisplay !== null}
        className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          preferences.preferredDisplayId && testingDisplay === null
            ? localTheme === "creamy"
              ? "bg-[#9a674a] text-white hover:bg-[#8a5739] shadow-lg"
              : "bg-[#9a674a] text-white hover:bg-[#8a5739] shadow-lg"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {testingDisplay !== null ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Settings className="w-4 h-4" />
            Apply & Test Configuration
          </>
        )}
      </motion.button>
    </div>
  );
};

export default DisplayTabContent;
