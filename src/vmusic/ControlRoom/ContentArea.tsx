import React from "react";
import { Music } from "lucide-react";
import { BentoGrid } from "./BentoGrid";

interface ContentAreaProps {
  filteredSongsCount: number;
  isDarkMode: boolean;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  showTitleDialog: boolean;
  onShowTitleDialog: (show: boolean) => void;
  isEditingSlide: boolean;
  onEditingSlideChange: (editing: boolean) => void;
  showAddSlideDialog: boolean;
  onShowAddSlideDialog: (show: boolean) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  filteredSongsCount,
  isDarkMode,
  onSaveSuccess,
  onSaveError,
  showTitleDialog,
  onShowTitleDialog,
  isEditingSlide,
  onEditingSlideChange,
  showAddSlideDialog,
  onShowAddSlideDialog,
}) => {
  return (
    <div className="h-[88vh] w-full bg-app-bg">
      <BentoGrid
        isDarkMode={isDarkMode}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
        showTitleDialog={showTitleDialog}
        onShowTitleDialog={onShowTitleDialog}
        isEditingSlide={isEditingSlide}
        onEditingSlideChange={onEditingSlideChange}
        showAddSlideDialog={showAddSlideDialog}
        onShowAddSlideDialog={onShowAddSlideDialog}
      />
    </div>
  );
};
