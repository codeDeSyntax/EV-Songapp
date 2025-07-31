// components/ThemeToggle.tsx

import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/Provider/Theme";

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    // <motion.button
    //   whileHover={{ scale: 1.05 }}
    //   whileTap={{ scale: 0.95 }}
    //   onClick={toggleDarkMode}
    //   className=" rounded-full bg-gray-200 dark:bg-gray-80 h-5 w-5 flex items-center justify-center shadow-md hover:shadow-lg transition duration-200 ease-in-out"
    //   aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    // >
    //   {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    // </motion.button>
    <div
      onClick={toggleDarkMode}
      className="w-6 h-6 rounded-full flex items-center justify-center group cursor-pointer  hover:bg-gray-50 dark:hover:bg-bgray"
    >
      {isDarkMode ? <Sun size={20} className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"/> : 
      <Moon size={20} className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"/>}
    </div>
  );
};
