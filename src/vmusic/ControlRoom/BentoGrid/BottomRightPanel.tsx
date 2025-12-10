import React from "react";
import { GamyCard } from "../../shared/GamyCard";

interface BottomRightPanelProps {
  isDarkMode: boolean;
}

export const BottomRightPanel: React.FC<BottomRightPanelProps> = ({
  isDarkMode,
}) => {
  return (
    <GamyCard isDarkMode={isDarkMode} className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-app-text-muted text-ew-sm">Panel 4</p>
      </div>
    </GamyCard>
  );
};
