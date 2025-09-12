import React from "react";
import { List, Music } from "lucide-react";

interface MobileNavigationProps {
  isMobile: boolean;
  showSongList: boolean;
  theme: string;
  toggleView: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isMobile,
  showSongList,
  theme,
  toggleView,
}) => {
  if (!isMobile) return null;

  return (
    <div
      className="flex justify-center p-2"
      style={{
        backgroundColor: theme === "creamy" ? "#faeed1" : "#f8f9fa",
      }}
    >
      <button
        onClick={toggleView}
        className="flex items-center justify-center px-4 py-2 text-white rounded-full text-sm transition-colors hover:opacity-80"
        style={{
          background:
            theme === "creamy"
              ? "linear-gradient(to right, #d4a574, #c8956f)"
              : "linear-gradient(to right, #9ca3af, #6b7280)",
        }}
      >
        {showSongList ? (
          <span className="flex items-center">
            <List className="mr-1" size={16} /> View Collections
          </span>
        ) : (
          <span className="flex items-center">
            <Music className="mr-1" size={16} /> View Songs
          </span>
        )}
      </button>
    </div>
  );
};

export default MobileNavigation;
