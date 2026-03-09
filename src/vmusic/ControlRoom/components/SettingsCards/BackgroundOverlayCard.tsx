import React from "react";

interface BackgroundOverlayCardProps {
  isDarkMode: boolean;
  localOpacity: number;
  selectedBgSrc: string;
  onOpacityChange: (value: number) => void;
}

export const BackgroundOverlayCard: React.FC<BackgroundOverlayCardProps> = ({
  isDarkMode,
  localOpacity,
  selectedBgSrc,
  onOpacityChange,
}) => {
  return (
    <div
      className="rounded-2xl p-4 flex-shrink-0 w-80 flex flex-col no-scrollbar h-full"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(0, 0, 0, 0.03)",
        border: `1px solid ${
          isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
        }`,
      }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <h3 className="text-app-text font-medium text-xs">
            Background Overlay
          </h3>
          <p className="text-app-text-muted text-[11px] mt-0.5">
            Adjust darkness level
          </p>
        </div>
        <div
          className="px-2 py-0.5 rounded-md text-[11px] font-medium text-app-text"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {localOpacity}%
        </div>
      </div>

      {/* Custom Slider */}
      <div className="relative w-full flex-shrink-0">
        <input
          type="range"
          min="0"
          max="100"
          value={localOpacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-full h-5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-app-accent focus:ring-offset-1"
          style={{
            background: `linear-gradient(to right, var(--app-accent) 0%, var(--app-accent) ${localOpacity}%, ${
              isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(250, 238, 209.1)"
            } ${localOpacity}%, ${
              isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(250, 238, 209, 1)"
            } 100%)`,
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${isDarkMode ? "#faeed1" : "#fff"};
            cursor: pointer;
            border: 2px solid var(--app-accent);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${isDarkMode ? "#faeed1" : "#fff"};
            cursor: pointer;
            border: 2px solid var(--app-accent);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>

      <div className="flex justify-between mt-1.5 text-[11px] text-app-text-muted flex-shrink-0">
        <span>Light</span>
        <span>Dark</span>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg overflow-hidden mt-2.5 flex-1 min-h-0"
        style={{
          border: `1px solid ${
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
          }`,
        }}
      >
        <div className="relative h-full">
          {/* Background - Video, Image, Solid, or Gradient */}
          {selectedBgSrc ? (
            selectedBgSrc.startsWith("solid:") ? (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: selectedBgSrc.replace("solid:", ""),
                }}
              />
            ) : selectedBgSrc.startsWith("gradient:") ? (
              <div
                className="absolute inset-0"
                style={{
                  background: selectedBgSrc.replace("gradient:", ""),
                }}
              />
            ) : selectedBgSrc.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={selectedBgSrc}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
              />
            ) : (
              <img
                src={selectedBgSrc}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
          )}

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-200"
            style={{ opacity: localOpacity / 100 }}
          />

          {/* Preview Text */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <p className="text-white text-xs font-medium drop-shadow-lg">
              Preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
