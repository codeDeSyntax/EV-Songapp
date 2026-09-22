// components/ThemeToggle.tsx

import React from "react";
import { Sun, Moon, Sunrise } from "lucide-react";
import { useTheme } from "@/Provider/Theme";
import { DepthButton } from "./DepthButton";

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const sw = isDarkMode ? 3.5 : 2.5;

  return (
    <button
      onClick={toggleDarkMode}
      className="relative hover:z-10 w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-hover-bg)]"
      style={{ color: 'var(--tb-icon)' }}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sunrise size={28} className="w-[28px] h-[28px]" strokeWidth={sw} />
      ) : (
        <Moon size={28} className="w-[28px] h-[28px]" strokeWidth={sw} />
      )}
    </button>
  );
};
