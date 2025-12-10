import React, { useState, useEffect, useCallback } from "react";
import { FolderUp, RefreshCw } from "lucide-react";
import { GamyCard } from "../../shared/GamyCard";

interface Background {
  name: string;
  src: string;
  category: string;
  isCustom?: boolean;
}

interface BackgroundSelectorPanelProps {
  isDarkMode: boolean;
}

export const BackgroundSelectorPanel: React.FC<
  BackgroundSelectorPanelProps
> = ({ isDarkMode }) => {
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
    <GamyCard
      isDarkMode={isDarkMode}
      blackBackground={true}
      style={{
        border: "none",
      }}
      className="h-full px-1 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <h3 className="text-ew-sm font-medium text-app-text">Backgrounds</h3>
        <div className="flex items-center gap-2">
          <GamyCard
            isDarkMode={isDarkMode}
            className="p-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            style={{ border: "none" }}
          >
            <button
              onClick={handleUploadDirectory}
              title="Choose Directory"
              className="p-1.5 bg-transparent text-app-text transition-colors"
            >
              <FolderUp className="w-3.5 h-3.5" />
            </button>
          </GamyCard>
          <GamyCard
            isDarkMode={isDarkMode}
            className="p-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            style={{ border: "none" }}
          >
            <button
              onClick={loadBackgrounds}
              title="Refresh"
              className="p-1.5 bg-transparent text-app-text transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </GamyCard>
        </div>
      </div>

      {/* Background Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded bg-app-surface animate-pulse"
              />
            ))}
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-ew-sm text-app-text-muted">No images loaded</p>
            <p className="text-ew-xs text-app-text-muted mt-1">
              Click folder icon to select directory
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {backgrounds.map((background, index) => (
              <div
                key={`${background.src}-${index}`}
                onClick={() => handleSelectBackground(background)}
                className="cursor-pointer"
              >
                <GamyCard
                  isDarkMode={isDarkMode}
                  className={`px-0 py-0 overflow-hidden transition-all hover:scale-105 ${
                    selectedBackground?.src === background.src
                      ? "ring-2 ring-app-surface-hover"
                      : ""
                  }`}
                  style={{
                    border: "none",
                    boxShadow: "none",
                  }}
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
                        <div className="w-6 h-6 rounded-full bg-app-blue text-white flex items-center justify-center text-ew-xs">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                </GamyCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </GamyCard>
  );
};
