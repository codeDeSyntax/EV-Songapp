// contexts/ThemeContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAppSelector } from "@/store";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize theme state for songs app
    const storedPreference = localStorage.getItem("songsDarkMode");
    if (storedPreference) {
      return storedPreference === "true";
    }
    // Check system preference as fallback
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark || false;
  });

  // Get current screen from Redux store
  const currentScreen = useAppSelector((state) => state.app.currentScreen);

  // Apply theme to document
  useEffect(() => {
    console.log(
      "Songs ThemeProvider: Applying theme - isDarkMode:",
      isDarkMode,
      "currentScreen:",
      currentScreen
    );

    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Store user preference
    localStorage.setItem("songsDarkMode", String(isDarkMode));
  }, [isDarkMode, currentScreen]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    const newMode = !isDarkMode;

    // Update document class
    document.documentElement.classList.toggle("dark", newMode);

    // Store preference
    localStorage.setItem("songsDarkMode", newMode.toString());
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
