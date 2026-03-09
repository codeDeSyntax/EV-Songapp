import React from "react";
import { Repeat } from "lucide-react";
import { Switch } from "antd";

interface ChorusRepetitionCardProps {
  isDarkMode: boolean;
  repeatChorus: boolean;
  onToggle: (value: boolean) => void;
}

export const ChorusRepetitionCard: React.FC<ChorusRepetitionCardProps> = ({
  isDarkMode,
  repeatChorus,
  onToggle,
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
            <Repeat className="w-4 h-4 text-app-text" />
          </div>
          <div>
            <h3 className="text-app-text font-medium text-xs">
              Chorus Repetition
            </h3>
            <p className="text-app-text-muted text-[11px] mt-0.5">
              Repeat chorus after each verse
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-app-text-muted text-[11px]">
          {repeatChorus ? "Enabled" : "Disabled"}
        </span>
        <Switch
          checked={repeatChorus}
          onChange={(v) => onToggle(v)}
          size="small"
        />
      </div>
      <div className="mt-4 pt-3 border-t border-app-border">
        <p className="text-app-text-muted text-[10px] leading-relaxed">
          When enabled, the chorus will automatically appear after each verse
          during projection and navigation. This does not affect the saved song
          file.
        </p>
      </div>
    </div>
  );
};
