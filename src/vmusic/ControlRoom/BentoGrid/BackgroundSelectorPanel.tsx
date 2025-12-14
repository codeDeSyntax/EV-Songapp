import React, { useState, useEffect, useCallback } from "react";
import {
  FolderUp,
  RefreshCw,
  Menu,
  Image,
  Video,
  Check,
  X,
} from "lucide-react";
import { GamyCard } from "../../shared/GamyCard";

interface Background {
  name: string;
  src: string;
  category: string;
  isCustom?: boolean;
}

type MediaType = "images" | "videos";

interface BackgroundSelectorPanelProps {
  isDarkMode: boolean;
}

export const BackgroundSelectorPanel: React.FC<
  BackgroundSelectorPanelProps
> = ({ isDarkMode }) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [selectedBackground, setSelectedBackground] =
    useState<Background | null>(null);
  const [pendingBackground, setPendingBackground] = useState<Background | null>(
    null
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customImagesPath, setCustomImagesPath] = useState(
    localStorage.getItem("vmusicImageDirectory") || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("images");

  // Default public videos
  const defaultVideos: Background[] = [
    {
      name: "Blue Particles",
      src: "./blue_particle.mp4",
      category: "Default",
    },
    {
      name: "Water Glass",
      src: "./waterglass.mp4",
      category: "Default",
    },
    {
      name: "Welcome Video",
      src: "./welcomvid1.mp4",
      category: "Default",
    },
  ];

  // Load backgrounds
  const loadBackgrounds = useCallback(async () => {
    setIsLoading(true);
    try {
      if (mediaType === "videos") {
        // Show default videos from public folder
        setBackgrounds(defaultVideos);
      } else if (customImagesPath) {
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
  }, [customImagesPath, mediaType]);

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
    // Set as pending and show preview only
    setPendingBackground(background);

    // Dispatch to preview panel only (temporary preview)
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: background.src, isPreview: true },
      })
    );

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleApplyBackground = () => {
    if (!pendingBackground) return;

    setSelectedBackground(pendingBackground);
    localStorage.setItem("bmusicpresentationbg", pendingBackground.src);

    // Dispatch storage event for updates to all views
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: null,
        newValue: pendingBackground.src,
        storageArea: localStorage,
      })
    );

    setShowConfirmation(false);
    setPendingBackground(null);
  };

  const handleCancelBackground = () => {
    // Revert preview to current selected background (or empty)
    const revertSrc = selectedBackground ? selectedBackground.src : "";
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: revertSrc, isPreview: false, isCancel: true },
      })
    );

    setShowConfirmation(false);
    setPendingBackground(null);
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
        <div className="flex items-center gap-2 relative">
          <GamyCard
            isDarkMode={isDarkMode}
            transparent={true}
            className="px-0 py-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            style={{ border: "none" }}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Menu"
              className="p-1.5 bg-transparent text-app-text transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </GamyCard>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-10 right-0 z-50 min-w-[160px] py-4 ">
              <div className="py-1 rounded-lg shadow-xl border-solid p-2 border bg-app-surface border-app-border">
                <button
                  onClick={() => {
                    setMediaType("images");
                    setShowMenu(false);
                  }}
                  className={`w-full bg-transparent flex items-center gap-3 px-4 py-1.5 text-ew-sm transition-colors text-app-text ${
                    mediaType === "images"
                      ? "bg-app-accent"
                      : "hover:bg-app-surface-hover"
                  }`}
                >
                  <Image className="w-4 h-4" />
                  <span>Images</span>
                </button>
                <button
                  onClick={() => {
                    setMediaType("videos");
                    setShowMenu(false);
                  }}
                  className={`w-full bg-transparent flex items-center gap-3 px-4 py-1.5 text-ew-sm transition-colors text-app-text ${
                    mediaType === "videos"
                      ? "bg-app-accent"
                      : "hover:bg-app-surface-hover"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Videos</span>
                </button>
                <div className="h-px my-1 bg-app-border" />
                <button
                  onClick={() => {
                    handleUploadDirectory();
                    setShowMenu(false);
                  }}
                  className="w-full bg-transparent flex items-center gap-3 px-4 py-1.5 text-ew-sm transition-colors text-app-text hover:bg-app-surface-hover"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Choose </span>
                </button>
              </div>
            </div>
          )}
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
            <img
              src="./no_files.svg"
              alt="No files"
              className="w-20 h-20 mb-4 opacity-50"
            />
            <p className="text-ew-sm text-app-text-muted">
              {customImagesPath
                ? `No ${mediaType} found`
                : "No directory selected"}
            </p>
            <p className="text-ew-xs text-app-text-muted mt-1">
              {customImagesPath
                ? `Add ${mediaType} to the selected folder`
                : "Click menu icon to choose directory"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {backgrounds.map((background, index) => {
              const isSelected = selectedBackground?.src === background.src;
              const isPending = pendingBackground?.src === background.src;

              return (
                <div
                  key={`${background.src}-${index}`}
                  onClick={() => handleSelectBackground(background)}
                  className="cursor-pointer"
                >
                  <GamyCard
                    isDarkMode={isDarkMode}
                    className={`px-0 py-0 overflow-hidden transition-all hover:scale-105 ${
                      isPending
                        ? "ring-2 ring-yellow-500"
                        : isSelected
                        ? "ring-2 ring-app-surface-hover"
                        : ""
                    }`}
                    style={{
                      border: "none",
                      boxShadow: "none",
                    }}
                  >
                    <div className="relative aspect-video">
                      {mediaType === "videos" ? (
                        <video
                          src={background.src}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={background.src}
                          alt={background.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {isPending && (
                        <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-ew-xs">
                            ?
                          </div>
                        </div>
                      )}
                      {isSelected && !isPending && (
                        <div className="absolute inset-0 bg-app-blue/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-app-blue text-white flex items-center justify-center text-ew-xs">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                  </GamyCard>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && pendingBackground && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-app-surface dark:bg-black border border-app-border rounded-lg p-6 max-w-xs w-full mx-4 shadow-2xl">
            <div className="space-y-4">
              <p className="text-sm text-center font-medium text-app-text mb-2">
                Apply Background?
              </p>

              <div className="flex gap-3 justify-center">
                <GamyCard
                  isDarkMode={isDarkMode}
                  className="px-0 py-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    border: "none",
                    boxShadow: "none",
                    borderRadius: "none",
                  }}
                >
                  <button
                    onClick={handleCancelBackground}
                    className="p-2  bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </GamyCard>
                <GamyCard
                  isDarkMode={isDarkMode}
                  className="px-0 py-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    border: "none",
                    boxShadow: "none",
                    borderRadius: "none",
                  }}
                >
                  <button
                    onClick={handleApplyBackground}
                    className="p-2  bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-all"
                    title="Apply"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </GamyCard>
              </div>
            </div>
          </div>
        </div>
      )}
    </GamyCard>
  );
};
