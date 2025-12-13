import React from "react";
import { Moon, Sun } from "lucide-react";

interface DarkModeCardProps {
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

export const DarkModeCard: React.FC<DarkModeCardProps> = ({
  isDarkMode,
  onToggleDarkMode,
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            {isDarkMode ? (
              <Moon className="w-4 h-4 text-app-text" />
            ) : (
              <Sun className="w-4 h-4 text-app-text" />
            )}
          </div>
          <div>
            <h3 className="text-app-text font-medium text-xs">Dark Mode</h3>
            <p className="text-app-text-muted text-[11px] mt-0.5">
              Toggle theme
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-app-text-muted text-[11px]">
          {isDarkMode ? "Dark theme active" : "Light theme active"}
        </span>

        {/* Custom Toggle Switch */}
        <button
          onClick={onToggleDarkMode}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-app-accent"
          style={{
            backgroundColor: isDarkMode ? "var(--app-accent)" : "#faeed1",
          }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-app-text-muted dark:bg-[#848484] transition-transform duration-200 shadow-sm"
            style={{
              transform: isDarkMode ? "translateX(18px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>
    </div>
  );
};
