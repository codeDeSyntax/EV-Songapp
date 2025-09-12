import { useState } from "react";
import {
  ArrowLeftFromLine,
  Clock,
  GalleryHorizontal,
  GalleryThumbnails,
  Group,
  Minus,
  Square,
  SwitchCamera,
  User2Icon,
  X,
  MoreHorizontal,
  Settings,
  FileText,
} from "lucide-react";
import { HomeFilled } from "@ant-design/icons";
import { Switch } from "antd";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setCurrentScreen,
  setTheme,
  minimizeApp,
  maximizeApp,
  closeApp,
} from "@/store/slices/appSlice";
import { ThemeToggle } from "./ThemeToggler";
import { current } from "@reduxjs/toolkit";

const TitleBar = () => {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const currentScreen = useAppSelector((state) => state.app.currentScreen);
  const theme = useAppSelector((state) => state.app.theme);

  // Hide title bar for presentation screens
  const shouldHideTitleBar = window.location.hash.includes(
    "presentation-display"
  );

  // Don't render title bar if it should be hidden
  if (shouldHideTitleBar) {
    return null;
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("bmusictheme");
    if (savedTheme) {
      dispatch(setTheme(savedTheme as any));
    }
  }, [dispatch]);

  // function to set theme choice for songs app
  const setThemeChoice = () => {
    const currentSongTheme = localStorage.getItem("bmusictheme") || "white";
    const newTheme = currentSongTheme === "creamy" ? "white" : "creamy";

    // Update localStorage
    localStorage.setItem("bmusictheme", newTheme);

    // Dispatch custom event to notify other components of the change
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: "bmusictheme", newValue: newTheme },
      })
    );
  };

  const randombgs = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(
    Math.random() * 255
  )},${Math.floor(Math.random() * 255)},0.6)`;

  const handleMinimize = () => {
    dispatch(minimizeApp());
  };

  const handleMaximize = () => {
    dispatch(maximizeApp());
  };

  const handleClose = () => {
    dispatch(closeApp());
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div
      className="h-6 w-full  fixed flex z-50 top-0 m-auto bg-opacity-sm backdrop-blur-sm  items-center justify-center px-2 select-none"
      style={{ WebkitAppRegion: "drag" } as any} // Make the entire title bar draggable
    >
      <div className="flex w-full  items-center justify-between space-x-2 ">
        {/* Control buttons excluded from dragging */}
        <div
          className="flex items-center justify-between w-full m-auto  space-x-2"
          style={{ WebkitAppRegion: "no-drag" } as any} // Exclude control buttons from dragging
        >
          <div className="flex items-center justify-center gap-2">
            <div
              onClick={handleClose}
              onMouseEnter={() => setIsHovered("close")}
              onMouseLeave={() => setIsHovered(null)}
              className="w-4 h-4 rounded-full bg-[#FF5F57] hover:bg-red-600 hover:cursor-pointer flex items-center justify-center"
              // style={{
              //   backgroundColor: `rgba(${Math.floor(
              //     Math.random() * 255
              //   )},${Math.floor(Math.random() * 255)},${Math.floor(
              //     Math.random() * 255
              //   )},1)`,
              // }}
            >
              {isHovered === "close" && (
                <X className="text-white z-20 size-6" />
              )}
            </div>
            <div
              onClick={handleMinimize}
              onMouseEnter={() => setIsHovered("minimize")}
              onMouseLeave={() => setIsHovered(null)}
              className="w-4 h-4 text-white rounded-full bg-[#FFBD2E] hover:bg-yellow-600 hover:cursor-pointer flex items-center justify-center hover:text-white"
              // style={{
              //   backgroundColor: `rgba(${Math.floor(
              //     Math.random() * 255
              //   )},${Math.floor(Math.random() * 255)},${Math.floor(
              //     Math.random() * 255
              //   )},1)`,
              // }}
            >
              {isHovered === "minimize" && (
                <Minus className="text-white z-20 size-6" />
              )}
            </div>
            <div
              onClick={handleMaximize}
              onMouseEnter={() => setIsHovered("maximize")}
              onMouseLeave={() => setIsHovered(null)}
              className="w-4 h-4 rounded-full bg-[#28CA41] hover:bg-green-600 hover:cursor-pointer flex items-center justify-center"
              // style={{
              //   backgroundColor: `rgba(${Math.floor(
              //     Math.random() * 255
              //   )},${Math.floor(Math.random() * 255)},${Math.floor(
              //     Math.random() * 255
              //   )},1)`,
              // }}
            >
              {isHovered === "maximize" && (
                <Square className="text-white z-20 size-3" />
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <div
                onClick={() => dispatch(setCurrentScreen("Home"))}
                className={`w-4 h-4 rounded-full  hover:scale-105 hover:cursor-pointer flex items-center justify-center 
                 ${currentScreen === "Songs" ? "bg-primary/20" : "hidden"}
                `}
              >
                <HomeFilled
                  className="text-primary z-20 size-6"
                  color={`rgba(${Math.floor(Math.random() * 255)},${Math.floor(
                    Math.random() * 255
                  )},${Math.floor(Math.random() * 255)},1)`}
                />
              </div>
              <div
                onClick={setThemeChoice}
                className={`w-4 h-4 rounded-full  hover:scale-105 hover:cursor-pointer  
              items-center justify-center ${
                currentScreen === "Songs" || currentScreen === "categorize" ? "flex" : "hidden"
              }`}
                title="Mild theme 🟤"
              >
                <SwitchCamera className="text-primary z-20 size-3" />
              </div>
              <div
                onClick={() => dispatch(setCurrentScreen("backgrounds"))}
                className={`w-4 h-4 rounded-full hover:scale-105 hover:cursor-pointer items-center justify-center flex relative ${
                  currentScreen === "backgrounds" ? "bg-primary/10" : ""
                }`}
                title="Presentation backgrounds"
              >
                <GalleryHorizontal className="text-primary z-20 size-6" />
                {currentScreen === "backgrounds" && (
                  <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"></div>
                )}
              </div>
              <div
                onClick={() => dispatch(setCurrentScreen("Songs"))}
                className={`w-4 h-4 rounded-full hover:scale-105 hover:cursor-pointer relative
              items-center justify-center ${
                currentScreen === "categorize" ? "flex" : "hidden"
              }`}
                title="back"
              >
                <ArrowLeftFromLine className="text-primary z-20 size-6" />
              </div>
              <div
                onClick={() => dispatch(setCurrentScreen("categorize"))}
                className={`w-4 h-4 rounded-full hover:scale-105 hover:cursor-pointer items-center justify-center flex relative ${
                  currentScreen === "categorize" ? "bg-primary/10" : ""
                }`}
                title="Music categories"
              >
                <Group className="text-primary z-20 size-6" />
                {currentScreen === "categorize" && (
                  <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"></div>
                )}
              </div>
              <div
                onClick={() => dispatch(setCurrentScreen("recents"))}
                className={`w-4 h-4 rounded-full hover:bg-amber-700 hover:cursor-pointer
              items-center justify-center flex relative ${
                currentScreen !== "Songs" &&
                currentScreen !== "recents" &&
                "hidden"
              } ${currentScreen === "recents" ? "bg-primary/10" : ""}`}
                title="Recent Songs"
              >
                <Clock className="text-primary z-20 size-6" />
                {currentScreen === "recents" && (
                  <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"></div>
                )}
              </div>
              <div
                onClick={() => dispatch(setCurrentScreen("userguide"))}
                className={`w-4 h-4 rounded-full hover:scale-105 hover:cursor-pointer  
              items-center justify-center flex relative ${
                currentScreen !== "Songs" && "hidden"
              } ${currentScreen === "userguide" ? "bg-primary/10" : ""}`}
                title="User manual"
              >
                <User2Icon className="text-primary z-20 size-6" />
                {currentScreen === "userguide" && (
                  <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
          </div>

          <img
            src="./evsongsicon.png"
            alt="Description"
            className="w-4 h-4 animate-bounce"
          />
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
