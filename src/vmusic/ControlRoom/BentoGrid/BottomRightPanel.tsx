import React, { useState, useEffect } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector } from "@/store";
import { Settings, Eye, Type, Image, Monitor, Palette } from "lucide-react";

interface BottomRightPanelProps {
  isDarkMode: boolean;
}

export const BottomRightPanel: React.FC<BottomRightPanelProps> = ({
  isDarkMode,
}) => {
  const projection = useAppSelector((state) => state.projection);
  const [currentBg, setCurrentBg] = useState<string>("");

  // Load current background from localStorage (same as PreviewPanel)
  useEffect(() => {
    const updateBg = () => {
      const savedBg = localStorage.getItem("bmusicpresentationbg");
      if (savedBg) {
        setCurrentBg(savedBg);
      }
    };

    updateBg();
    const interval = setInterval(updateBg, 500);
    return () => clearInterval(interval);
  }, []);

  // Determine background type from current background
  const getBackgroundType = () => {
    const bg = currentBg || projection.backgroundImage;
    if (!bg || bg === "") return "None";
    if (bg.startsWith("solid:")) return "Solid";
    if (bg.startsWith("gradient:")) return "Gradient";
    if (bg.endsWith(".mp4") || bg.endsWith(".webm") || bg.endsWith(".mov"))
      return "Video";
    return "Image";
  };

  const getBackgroundName = () => {
    const bg = currentBg || projection.backgroundImage;
    if (!bg || bg === "") return "None";
    if (bg.startsWith("solid:")) {
      return bg.replace("solid:", "").toUpperCase();
    }
    if (bg.startsWith("gradient:")) {
      const gradientValue = bg.replace("gradient:", "");
      // Try to extract color info from gradient
      const colors = gradientValue.match(/#[0-9A-Fa-f]{6}/g);
      if (colors && colors.length > 0) {
        return colors.length > 1
          ? `${colors[0]} → ${colors[colors.length - 1]}`
          : colors[0];
      }
      return "Gradient";
    }
    // Extract filename from path
    const fileName = bg.split("/").pop()?.split(".")[0] || "Unknown";
    return fileName.charAt(0).toUpperCase() + fileName.slice(1);
  };

  const getBackgroundValue = () => {
    const bg = currentBg || projection.backgroundImage;
    if (!bg || bg === "") return "";
    if (bg.startsWith("solid:")) {
      return bg.replace("solid:", "");
    }
    if (bg.startsWith("gradient:")) {
      return bg.replace("gradient:", "");
    }
    return bg;
  };

  const renderBackgroundPreview = () => {
    const bg = currentBg || projection.backgroundImage;
    const type = getBackgroundType();
    const value = getBackgroundValue();

    if (type === "None") {
      return null;
    }

    if (type === "Solid") {
      return (
        <div
          className="w-12 h-8 rounded border border-app-border"
          style={{ backgroundColor: value }}
        />
      );
    }

    if (type === "Gradient") {
      return (
        <div
          className="w-12 h-8 rounded border border-app-border"
          style={{ background: value }}
        />
      );
    }

    if (type === "Video") {
      return (
        <div className="w-12 h-8 rounded border border-app-border bg-black flex items-center justify-center overflow-hidden">
          <video
            src={value}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
          />
        </div>
      );
    }

    if (type === "Image") {
      return (
        <div className="w-12 h-8 rounded border border-app-border bg-black flex items-center justify-center overflow-hidden">
          <img
            src={value}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return null;
  };

  const settingItems = [
    {
      icon: Palette,
      label: "Background",
      items: [
        {
          key: "Type",
          value: getBackgroundType(),
        },
        {
          key: "Name",
          value: getBackgroundName(),
        },
        {
          key: "Overlay",
          value: `${Math.round(projection.backgroundOverlayOpacity * 100)}%`,
        },
      ],
    },
    {
      icon: Type,
      label: "Font",
      items: [
        {
          key: "Size",
          value: `${Math.round(projection.fontSizeMultiplier * 100)}%`,
        },
        {
          key: "Family",
          value: projection.fontFamily
            .split(",")[0]
            .replace(/['"]/g, "")
            .substring(0, 15),
        },
      ],
    },
    {
      icon: Monitor,
      label: "Display",
      items: [
        {
          key: "Mode",
          value: projection.isExternalDisplay ? "External" : "Internal",
        },
      ],
    },
  ];

  return (
    <GamyCard isDarkMode={isDarkMode} className="h-full flex flex-col p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-app-border">
        <Settings className="w-4 h-4 text-app-blue" />
        <h3 className="text-sm font-semibold text-app-text">
          Projection Settings
        </h3>
      </div>

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2.5">
        {/* Background Card - Spans 2 columns (full width) */}
        <div className="col-span-2 p-3 rounded-xl bg-app-surface hover:bg-app-surface-hover transition-all duration-200 border border-app-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-app-blue flex-shrink-0" />
            <span className="text-xs font-semibold text-app-text">
              Background
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {renderBackgroundPreview()}
            {settingItems[0].items.map((subItem, subIndex) => {
              const bgType = getBackgroundType();
              // Hide "Name" field for Image, Video, or Gradient (show thumbnail only)
              if (subItem.key === "Name" && (bgType === "Image" || bgType === "Video" || bgType === "Gradient")) {
                return null;
              }
              return (
                <div key={subIndex} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-app-text-muted">
                    {subItem.key}:
                  </span>
                  <span className="text-xs font-semibold text-app-text">
                    {subItem.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Font Card - Takes 1 column */}
        <div className="col-span-1 p-3 rounded-xl bg-app-surface hover:bg-app-surface-hover transition-all duration-200 border border-app-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-4 h-4 text-app-blue flex-shrink-0" />
            <span className="text-xs font-semibold text-app-text">Font</span>
          </div>
          <div className="flex flex-col gap-2">
            {settingItems[1].items.map((subItem, subIndex) => (
              <div key={subIndex} className="flex items-center gap-1.5">
                <span className="text-[10px] text-app-text-muted">
                  {subItem.key}:
                </span>
                <span className="text-xs font-semibold text-app-text truncate">
                  {subItem.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Display Card - Takes 1 column */}
        <div className="col-span-1 p-3 rounded-xl bg-app-surface hover:bg-app-surface-hover transition-all duration-200 border border-app-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-4 h-4 text-app-blue flex-shrink-0" />
            <span className="text-xs font-semibold text-app-text">Display</span>
          </div>
          <div className="flex flex-col gap-2">
            {settingItems[2].items.map((subItem, subIndex) => (
              <div key={subIndex} className="flex items-center gap-1.5">
                <span className="text-[10px] text-app-text-muted">
                  {subItem.key}:
                </span>
                <span className="text-xs font-semibold text-app-text">
                  {subItem.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GamyCard>
  );
};
