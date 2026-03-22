import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FolderUp, Menu, Image, Video, Check, X } from "lucide-react";
import { DepthSurface } from "@/shared/DepthButton";

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
    null,
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationPosition, setConfirmationPosition] = useState({
    x: 0,
    y: 0,
  });
  const [customImagesPath, setCustomImagesPath] = useState(
    localStorage.getItem("vmusicImageDirectory") || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("images");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuTriggerRef = useRef<HTMLDivElement | null>(null);

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
            }),
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
        !target.closest('div[title="Menu"]')
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
        (bg) => bg.src === savedBackgroundSrc || bg.src === srcWithoutPrefix,
      );
      if (savedBg) {
        setSelectedBackground(savedBg);
      }
    }
  }, [backgrounds]);

  const updateMenuPosition = useCallback(() => {
    if (!menuTriggerRef.current) return;

    const rect = menuTriggerRef.current.getBoundingClientRect();
    const menuWidth = 188;
    const margin = 8;

    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin,
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 140 - margin);

    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    updateMenuPosition();
    const handleReposition = () => updateMenuPosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showMenu, updateMenuPosition]);

  const handleSelectBackground = (
    background: Background,
    event: React.MouseEvent,
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
      }),
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
      }),
    );

    // Also dispatch custom event to confirm the background change
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: pendingBackground.src, isPreview: false },
      }),
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
      }),
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
      }),
    );

    // Notify preview panel to clear background
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: "", isPreview: false },
      }),
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
      }),
    );

    // Notify preview panel to clear background
    window.dispatchEvent(
      new CustomEvent("preview-background-change", {
        detail: { src: "", isPreview: false },
      }),
    );

    setShowMenu(false);
  };

  return (
    <DepthSurface className="h-full flex flex-col overflow-hidden rounded-lg ">
      {/* Header */}
      <div className="px-3 pt-2.5  border-b border-app-border flex flex-col items-center justify-between flex-shrink-0 gap-2">
        <div className="flex  items-center gap-2">
          <span className="text-ew-sm font-semibold text-app-text whitespace-nowrap">
            Backgrounds
          </span>
          {backgrounds.length > 0 && (
            <span className="text-[10px] text-app-text-muted tabular-nums bg-app-bg border border-app-border px-1.5 py-0.5 rounded-full leading-none">
              {backgrounds.length}
            </span>
          )}
        </div>

        <div className="flex items-center w-full gap-1.5 flex-shrk-0">
          {/* Images / Videos icon toggle */}
          <div className="flex gap-0.5 p-0.5 rounded-md bg-black/[0.04] dark:bg-white/5">
            <div
              onClick={() => setMediaType("images")}
              title="Images"
              className={`cursor-pointer flex items-center justify-center w-6 h-5 rounded transition-all ${
                mediaType === "images"
                  ? "text-app-text bg-app-accent shadow-sm"
                  : "text-app-text-muted hover:text-app-text"
              }`}
            >
              <Image className="w-3 h-3" />
            </div>
            <div
              onClick={() => setMediaType("videos")}
              title="Videos"
              className={`cursor-pointer flex items-center justify-center w-6 h-5 rounded transition-all ${
                mediaType === "videos"
                  ? "text-app-text bg-app-accent shadow-sm"
                  : "text-app-text-muted hover:text-app-text"
              }`}
            >
              <Video className="w-3 h-3" />
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <div
              ref={menuTriggerRef}
              onClick={() => setShowMenu(!showMenu)}
              title="Menu"
              className="cursor-pointer p-1.5 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-hover transition-colors"
            >
              <Menu className="w-4 h-4" />
            </div>

            {showMenu &&
              createPortal(
                <div
                  className="menu-container fixed z-[99999] min-w-[172px]"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                  <DepthSurface
                    className="p-1.5 rounded-xl shadow-xl"
                    surfaceClassName="bg-gradient-to-br from-app-bg via-app-surface to-app-bg border border-app-border"
                  >
                    <div
                      onClick={() => {
                        handleUploadDirectory();
                        setShowMenu(false);
                      }}
                      className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-app-text hover:bg-app-surface-hover transition-colors"
                    >
                      <FolderUp className="w-3.5 h-3.5 flex-shrink-0" />
                      Choose Directory
                    </div>
                    <div className="h-px my-1 bg-app-border/60" />
                    <div
                      onClick={handleRemoveBackground}
                      className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-orange-500 hover:bg-orange-500/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 flex-shrink-0" />
                      Remove Background
                    </div>
                    <div
                      onClick={handleClearAll}
                      className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 flex-shrink-0" />
                      Clear All
                    </div>
                  </DepthSurface>
                </div>,
                document.body,
              )}
          </div>
        </div>
      </div>

      {/* Background Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-lg bg-app-surface-hover animate-pulse"
              />
            ))}
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 select-none">
            <img
              src="./no_files.svg"
              alt="No files"
              className="w-16 h-16 mb-2 opacity-40"
            />
            <p className="text-[11px] font-medium text-app-text-muted">
              {customImagesPath
                ? `No ${mediaType} found`
                : "No directory selected"}
            </p>
            <p className="text-[10px] text-app-text-muted/70">
              {customImagesPath
                ? `Add ${mediaType} to the selected folder`
                : "Use the menu to choose a directory"}
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
                  onClick={(e) => handleSelectBackground(background, e)}
                  className={`relative cursor-pointer aspect-video rounded-lg overflow-hidden transition-all duration-200 group ${
                    isPending
                      ? "ring-2 ring-amber-400 shadow-md"
                      : isSelected
                        ? "ring-2 ring-app-accent shadow-md"
                        : "ring-1 ring-app-border/60 hover:ring-app-border hover:shadow-sm"
                  }`}
                >
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
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}

                  {/* Name label — slides up on hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 pointer-events-none">
                    <p className="text-white text-[10px] font-medium truncate leading-tight">
                      {background.name}
                    </p>
                  </div>

                  {/* Pending badge */}
                  {isPending && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-md">
                      <span className="text-[9px] font-bold leading-none">
                        ?
                      </span>
                    </div>
                  )}

                  {/* Selected badge */}
                  {isSelected && !isPending && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-app-accent text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && pendingBackground && (
        <div
          className="confirmation-menu fixed z-[9999] w-44 rounded-xl shadow-xl border bg-app-bg border-app-border overflow-hidden"
          style={{
            left: `${confirmationPosition.x}px`,
            top: `${confirmationPosition.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <p className="text-[11px] font-semibold text-app-text text-center px-4 pt-3 pb-2">
            Apply this background?
          </p>
          <div className="px-2 pb-2 flex flex-col gap-1">
            <div
              onClick={handleApplyBackground}
              className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white bg-app-accent hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </div>
            <div
              onClick={handleCancelBackground}
              className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-app-text-muted hover:bg-app-surface-hover transition-colors"
            >
              Cancel
            </div>
          </div>
        </div>
      )}
    </DepthSurface>
  );
};
