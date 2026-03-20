import React from "react";
import { HistoryPanel } from "./HistoryPanel";
import { QueueFlowPanel } from "./QueueFlowPanel";

interface PrelistPanelProps {
  isDarkMode: boolean;
}

export const PrelistPanel: React.FC<PrelistPanelProps> = ({ isDarkMode }) => {
  return (
    <div className="h-full rounded-xl bg-white/50 dark:bg-app-surface relative overflow-hidden border border-app-border">
      <div className="h-full w-full flex">
        <div className="flex-1 border-r border-app-border">
          <QueueFlowPanel isDarkMode={isDarkMode} />
        </div>

        <div className="w-[32%] min-w-[180px] h-full">
          <HistoryPanel isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};
