import React from "react";
import { GamyCard } from "../../shared/GamyCard";

interface BottomLeftPanelProps {
  isDarkMode: boolean;
}

export const BottomLeftPanel: React.FC<BottomLeftPanelProps> = ({
  isDarkMode,
}) => {
  return (
    <GamyCard isDarkMode={isDarkMode} className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-app-text-muted text-ew-sm">Panel 3</p>
      </div>
    </GamyCard>
  );
};
