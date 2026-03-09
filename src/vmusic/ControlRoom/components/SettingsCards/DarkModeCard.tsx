import React from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "antd";

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

        {/* antd Switch */}
        <Switch checked={isDarkMode} onChange={onToggleDarkMode} size="small" />
      </div>
    </div>
  );
};
