// components/ThemeToggle.tsx

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/Provider/Theme";

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors text-white/80 hover:text-white hover:bg-white/15"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
