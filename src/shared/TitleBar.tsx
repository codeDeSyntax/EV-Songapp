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
      className="h-6 w-screen  fixed w-100 flex z-50 top-0 bg-white/0 bg-opacity-sm backdrop-blur-sm  items-center justify-between px-2 select-none"
      style={{ WebkitAppRegion: "drag" } as any} // Make the entire title bar draggable
    >
      <div className="flex items-center space-x-2 ml-2">
        {/* Control buttons excluded from dragging */}
        <div
          className="flex items-center space-x-2"
          style={{ WebkitAppRegion: "no-drag" } as any} // Exclude control buttons from dragging
        >
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
            {isHovered === "close" && <X className="text-white z-20 size-3" />}
          </div>
          <div
            onClick={handleMinimize}
            onMouseEnter={() => setIsHovered("minimize")}
            onMouseLeave={() => setIsHovered(null)}
            className="w-4 h-4 rounded-full bg-[#FFBD2E] hover:bg-yellow-600 hover:cursor-pointer flex items-center justify-center"
            // style={{
            //   backgroundColor: `rgba(${Math.floor(
            //     Math.random() * 255
            //   )},${Math.floor(Math.random() * 255)},${Math.floor(
            //     Math.random() * 255
            //   )},1)`,
            // }}
          >
            {isHovered === "minimize" && (
              <Minus className="text-white z-20 size-3" />
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

          <div
            onClick={() => dispatch(setCurrentScreen("Home"))}
            className="w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-600 hover:cursor-pointer flex items-center justify-center"
          >
            <HomeFilled
              className="text-white z-20 size-3"
              color={`rgba(${Math.floor(Math.random() * 255)},${Math.floor(
                Math.random() * 255
              )},${Math.floor(Math.random() * 255)},1)`}
            />
          </div>
          <div
            onClick={setThemeChoice}
            className={`w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-600 hover:cursor-pointer  
              items-center justify-center ${
                currentScreen === "Songs" ? "flex" : "hidden"
              }`}
            title="Mild theme 🟤"
          >
            <SwitchCamera className="text-white z-20 size-3" />
          </div>
          <div
            onClick={() => dispatch(setCurrentScreen("backgrounds"))}
            className={`w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-600 hover:cursor-pointer items-center justify-center flex`}
            title="Presentation backgrounds"
          >
            <GalleryHorizontal className="text-white z-20 size-3" />
          </div>
          <div
            onClick={() => dispatch(setCurrentScreen("Songs"))}
            className={`w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-600 hover:cursor-pointer  
              items-center justify-center ${
                currentScreen === "categorize" ? "flex" : "hidden"
              }`}
            title="back"
          >
            <ArrowLeftFromLine className="text-white z-20 size-3" />
          </div>
          <div
            onClick={() => dispatch(setCurrentScreen("categorize"))}
            className={`w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-600 hover:cursor-pointer items-center justify-center flex`}
            title="Music categories"
          >
            <Group className="text-white z-20 size-3" />
          </div>
          <div
            onClick={() => dispatch(setCurrentScreen("recents"))}
            className={`w-4 h-4 rounded-full bg-amber-600 hover:bg-amber-700 hover:cursor-pointer
              items-center justify-center flex ${
                currentScreen !== "Songs" &&
                currentScreen !== "recents" &&
                "hidden"
              }`}
            title="Recent Songs"
          >
            <Clock className="text-white z-20 size-3" />
          </div>
          <div
            onClick={() => dispatch(setCurrentScreen("userguide"))}
            className={`w-4 h-4 rounded-full bg-gray-500 hover:bg-gray-600 hover:cursor-pointer  
              items-center justify-center flex ${
                currentScreen !== "Songs" && "hidden"
              }`}
            title="User manual"
          >
            <User2Icon className="text-white z-20 size-3" />
          </div>

          {/* New dropdown toggle icon */}
          <div
            onClick={toggleDropdown}
            className="w-4 h-4 rounded-full bg-bgray hover:bg-gray-600 hover:cursor-pointer flex items-center justify-center relative"
          >
            <MoreHorizontal className="text-white z-20 size-3" />

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute top-5 right-0 left-0 bg-white dark:bg-bgray shadow-md rounded-md p-1 z-50 w-32">
                {/* <div
                  className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => {
                    setAndSaveCurrentScreen("hisvoice");
                    setShowDropdown(false);
                  }}
                >
                  <img src="./icon.png" className="h-4 w-4 " />
                  <span className="text-xs text-stone-500 dark:text-gray-600">His voice</span>
                </div> */}
                <div
                  className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => {
                    dispatch(setCurrentScreen("Songs"));
                    setShowDropdown(false);
                  }}
                >
                  <img
                    src="./music2.png"
                    className="h-4 w-4"
                    alt="Music icon"
                  />
                  <span className="text-xs text-stone-500 dark:text-gray-600">
                    Bmusic
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
