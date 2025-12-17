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
  const [confirmationPosition, setConfirmationPosition] = useState({
    x: 0,
    y: 0,
  });
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

  // Handle outside clicks for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close main menu if click is outside
      if (
        showMenu &&
        !target.closest(".menu-container") &&
        !target.closest('button[title="Menu"]')
      ) {
        setShowMenu(false);
      }
      // Close confirmation menu if click is outside
      if (showConfirmation && !target.closest(".confirmation-menu")) {
        handleCancelBackground();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu, showConfirmation]);

  // Load saved background
  useEffect(() => {
    const savedBackgroundSrc = localStorage.getItem("bmusicpresentationbg");
    if (savedBackgroundSrc) {
      // Strip any prefixes (solid:, gradient:) for comparison
      const srcWithoutPrefix = savedBackgroundSrc
        .replace(/^solid:/, "")
        .replace(/^gradient:/, "");

      const savedBg = backgrounds.find(
        (bg) => bg.src === savedBackgroundSrc || bg.src === srcWithoutPrefix
      );
      if (savedBg) {
        setSelectedBackground(savedBg);
      }
    }
  }, [backgrounds]);

  const handleSelectBackground = (
    background: Background,
    event: React.MouseEvent
  ) => {
    // Set as pending and show preview only
    setPendingBackground(background);

    // Capture click position for confirmation menu
    const rect = event.currentTarget.getBoundingClientRect();
    setConfirmationPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

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

    // Also dispatch custom event to confirm the background change
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: pendingBackground.src, isPreview: false },
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

  const handleRemoveBackground = () => {
    // Clear saved background from localStorage
    localStorage.removeItem("bmusicpresentationbg");
    setSelectedBackground(null);

    // Dispatch storage event to update all views
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: selectedBackground?.src || null,
        newValue: null,
        storageArea: localStorage,
      })
    );

    // Notify preview panel to clear background
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: "", isPreview: false },
      })
    );

    setShowMenu(false);
  };

  const handleClearAll = () => {
    // Clear saved background from localStorage
    localStorage.removeItem("bmusicpresentationbg");
    setSelectedBackground(null);

    // Clear the custom images directory path
    localStorage.removeItem("vmusicImageDirectory");
    setCustomImagesPath("");
    setBackgrounds([]);

    // Dispatch storage event to update all views
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: selectedBackground?.src || null,
        newValue: null,
        storageArea: localStorage,
      })
    );

    // Notify preview panel to clear background
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: "", isPreview: false },
      })
    );

    setShowMenu(false);
  };

  return (
    <div
      style={{
        border: "none",
        borderRadius: "8px",
      }}
      className="h-full flex flex-col  overflow-hidden py-0 bg-white/50 dark:bg-app-surface"
    >
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10  dark:bg-app-surface px-3 pt-2 pb-2 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <h3 className="text-ew-sm font-medium text-app-text">Backgrounds</h3>
        <div className="flex items-center gap-2 relative">
          <div
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
          </div>

          {/* Dropdown Menu - Fixed */}
          {showMenu && (
            <div
              className="menu-container fixed top-28 right-auto z-[9999] min-w-[160px] mt-2"
              style={{ transform: "translateX(-100%)" }}
            >
              <div className="py-1 rounded-lg shadow-xl border-solid p-2 border bg-app-bg border-app-border">
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
                <div className="h-px my-1 bg-app-border" />
                <button
                  onClick={handleRemoveBackground}
                  className="w-full bg-transparent flex items-center gap-3 px-4 py-1.5 text-ew-sm transition-colors text-orange-500 hover:bg-orange-500/10"
                >
                  <X className="w-4 h-4" />
                  <span>Remove BG</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-full bg-transparent flex items-center gap-3 px-4 py-1.5 text-ew-sm transition-colors text-red-500 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
                <div className="h-px my-1 bg-app-border" />
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full bg-transparent flex items-center gap-3 px-4 py-1.5 text-ew-sm transition-colors text-app-text hover:bg-app-surface-hover"
                >
                  <X className="w-4 h-4" />
                  <span>Close Menu</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Background Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-video rounded  animate-pulse" />
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
          <div className="grid grid-cols-2 gap-3">
            {backgrounds.map((background, index) => {
              const isSelected = selectedBackground?.src === background.src;
              const isPending = pendingBackground?.src === background.src;

              return (
                <div
                  key={`${background.src}-${index}`}
                  onClick={(e) => handleSelectBackground(background, e)}
                  className="cursor-pointer aspect-video"
                >
                  <div
                    className={`overflow-hidden rounded-lg transition-all hover:scale-105 ${
                      isPending
                        ? "ring-2 ring-yellow-500"
                        : isSelected
                        ? "ring-2 ring-app-surface-hover"
                        : ""
                    }`}
                  >
                    <div className="relative aspect-video">
                      {mediaType === "videos" ? (
                        <video
                          src={background.src}
                          className="w-full h-full object-cover rounded-lg"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={background.src}
                          alt={background.name}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                        />
                      )}
                      {isPending && (
                        <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-ew-xs">
                            ?
                          </div>
                        </div>
                      )}
                      {isSelected && !isPending && (
                        <div className="absolute inset-0 bg-app-blue/20 flex items-center justify-center rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-app-blue text-white flex items-center justify-center text-ew-xs">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Menu */}
      {showConfirmation && pendingBackground && (
        <div
          className="confirmation-menu fixed  py-1 rounded-lg shadow-xl border-solid p-2 border bg-app-bg border-app-border min-w-[180px] z-[9999]"
          style={{
            left: `${confirmationPosition.x}px`,
            top: `${confirmationPosition.y}px`,
            transform: "translate(-70%, -50%)",
          }}
        >
          <div>
            <p className="text-ew-sm text-center font-medium text-app-text px-4 py-2 border-b border-app-border mb-1">
              Apply Background?
            </p>
            <button
              onClick={handleApplyBackground}
              className="w-full bg-transparent flex items-center gap-3 px-4 py-2 text-ew-sm transition-colors text-green-950 dark:text-green-500 hover:bg-green-500/10"
            >
              <Check className="w-4 h-4" />
              <span>Apply</span>
            </button>
            <button
              onClick={handleCancelBackground}
              className="w-full bg-transparent flex items-center gap-3 px-4 py-2 text-ew-sm transition-colors text-red-500 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
