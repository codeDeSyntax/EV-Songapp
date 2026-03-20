// components/ThemeToggle.tsx

import React from "react";
import { Sun, Moon, Sunrise } from "lucide-react";
import { useTheme } from "@/Provider/Theme";
import { DepthButton } from "./DepthButton";

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const inactiveTextClass = isDarkMode
    ? "text-white/80 hover:text-white"
    : "text-black/80 hover:text-black";

  return (
    <DepthButton
      onClick={toggleDarkMode}
      sizeClassName="w-6 h-6 rounded-full"
      inactiveClassName={inactiveTextClass}
      inactiveSurfaceClassName="bg-gradient-to-br from-white/20 via-white/15 to-white/10 group-hover:from-white/30 group-hover:via-white/20 group-hover:to-white/15"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? <Sunrise className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </DepthButton>
  );
};
