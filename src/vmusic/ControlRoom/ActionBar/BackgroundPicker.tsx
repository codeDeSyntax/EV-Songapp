import React, { useState, useEffect, useCallback } from "react";
import { FolderUp, RefreshCw } from "lucide-react";
import { GamyCard } from "../../shared/GamyCard";

interface Background {
  name: string;
  src: string;
  category: string;
  isCustom?: boolean;
}

interface BackgroundPickerProps {
  isDarkMode: boolean;
}

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  isDarkMode,
}) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [selectedBackground, setSelectedBackground] =
    useState<Background | null>(null);
  const [customImagesPath, setCustomImagesPath] = useState(
    localStorage.getItem("vmusicImageDirectory") || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load backgrounds
  const loadBackgrounds = useCallback(async () => {
    setIsLoading(true);
    try {
      if (customImagesPath) {
        try {
          const imageFiles = await window.api.getImages(customImagesPath);
          const customBackgrounds: Background[] = imageFiles.map(
            (src: string, index: number) => ({
              name: `Custom ${index + 1}`,
              src,
              category: "Custom",
              isCustom: true,
            })
          );
          setBackgrounds(customBackgrounds);
        } catch (error) {
          console.error("Failed to load custom images:", error);
          setBackgrounds([]);
        }
      } else {
        setBackgrounds([]);
      }
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      setBackgrounds([]);
    } finally {
      setIsLoading(false);
    }
  }, [customImagesPath]);

  // Load backgrounds on mount
  useEffect(() => {
    loadBackgrounds();
  }, [loadBackgrounds]);

  // Load saved background
  useEffect(() => {
    const savedBackgroundSrc = localStorage.getItem("bmusicpresentationbg");
    if (savedBackgroundSrc) {
      const savedBg = backgrounds.find((bg) => bg.src === savedBackgroundSrc);
      if (savedBg) {
        setSelectedBackground(savedBg);
      }
    }
  }, [backgrounds]);

  const handleSelectBackground = (background: Background) => {
    setSelectedBackground(background);
    localStorage.setItem("bmusicpresentationbg", background.src);

    // Dispatch storage event for updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: null,
        newValue: background.src,
        storageArea: localStorage,
      })
    );
  };

  const handleUploadDirectory = async () => {
    try {
      const result = await window.api.selectDirectory();
      if (typeof result === "string" && result) {
        setCustomImagesPath(result);
        localStorage.setItem("vmusicImageDirectory", result);
        loadBackgrounds();
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  return (
    <div className="w-32 h-full border-l border-app-border flex flex-col bg-app-surface backdrop-blur-md shadow-lg">
      {/* Header */}
      <div className="p-2 border-b border-app-border flex items-center  gap-2 flex-shrink-0">
        <GamyCard
          isDarkMode={isDarkMode}
          
          className="p-0 h-8 w-8  overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          style={{ border: "none",boxShadow:"none" }}
        >
          <button
            onClick={handleUploadDirectory}
            title="Choose Directory"
            className="p-1.5 bg-transparent text-app-text transition-colors w-full h-full"
          >
            <FolderUp className="w-4 h-4" />
          </button>
        </GamyCard>
        <GamyCard
          isDarkMode={isDarkMode}
          className="p-0 h-8 w-8 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          style={{ border: "none",boxShadow:"none" }}
        >
          <button
            onClick={loadBackgrounds}
            title="Refresh"
            className="p-1.5 bg-transparent text-app-text transition-colors w-full h-full"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </GamyCard>
      </div>

      {/* Scrollable Background List */}
      <div className="fle overflow-y-auto grid grid-cols-2  no-scrollbar p-2 space-y-2 min-h-0">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded bg-app-surface animate-pulse"
            />
          ))
        ) : backgrounds.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-ew-2xs text-app-text-muted">No images</p>
            <p className="text-ew-2xs text-app-text-muted mt-1">Click folder</p>
          </div>
        ) : (
          backgrounds.map((background, index) => (
            <div
              key={`${background.src}-${index}`}
              onClick={() => handleSelectBackground(background)}
              className="cursor-pointer"
            >
              <GamyCard
                isDarkMode={isDarkMode}
                className={`p-0 overflow-hidden transition-all ${
                  selectedBackground?.src === background.src
                    ? "ring-2 ring-app-blue"
                    : ""
                }`}
              >
                <div className="relative aspect-video">
                  <img
                    src={background.src}
                    alt={background.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedBackground?.src === background.src && (
                    <div className="absolute inset-0 bg-app-blue/20 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-app-blue text-white flex items-center justify-center text-ew-2xs">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              </GamyCard>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
