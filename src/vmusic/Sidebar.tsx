import {
  Music,
  Settings,
  History,
  Grid,
  List,
  Check,
  ChevronDown,
  Monitor,
  ExternalLink,
  FileMusic,
  CogIcon,
  Group,
  Wallpaper,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { FolderOpen } from "lucide-react";
import { useSongOperations } from "@/features/songs/hooks/useSongOperations";
import { motion } from "framer-motion";
import { DeleteColumnOutlined, MoonFilled } from "@ant-design/icons";
import { Song, Collection } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import { setSongRepo } from "@/store/slices/songSlice";
import { Tooltip } from "antd";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
}

interface SideBarProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  savedFavorites: Song[];
  setSavedFavorites: (songs: Song[]) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Access local theme from parent component instead of Redux
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const displayValue = selectedOption?.label || value;

  return (
    <div className="relative " ref={dropdownRef}>
      {label && (
        <label
          className="text-sm font-thin  mb-1 block "
          style={{ fontFamily: "Georgia" }}
        >
          {label}
        </label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 rounded-lg ${
          localTheme === "creamy" ? "bg-vmprim/20 " : "bg-gray-50"
        } text-[12px] border border-stone-200 flex items-center justify-between hover:bg-white/60 transition-colors`}
        style={{ fontFamily: label === "Font Family" ? value : undefined }}
      >
        <span>{displayValue as string}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute z-40 w-full mt-1 flex flex-col items-center gap-1  ${
            localTheme === "creamy" ? "bg-yellow-800" : "bg-white"
          } rounded-lg shadow-lg border border-stone-200 py-1 max-h-48 overflow-y-auto no-scrollbar`}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-[90%] px-3 py-2 text-left  text-[12px   hover:[#9a674a]/40 hover:text-black  transition-colors ${
                (option.value || option) === value
                  ? "bg-white/20 text-orange-400"
                  : localTheme === "creamy"
                  ? "bg-vmprim/20 text-white"
                  : "bg-gray-50 border text-stone-500"
              }`}
              style={{
                fontFamily: label === "Font Family" ? option.value : undefined,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = React.memo(({ activeTab, setActiveTab }: SideBarProps) => {
  const { selectedSong } = useSongOperations();
  const dispatch = useAppDispatch();

  // Remove local functions, use Redux actions instead
  const selectsongDir = async () => {
    const path = await window.api.selectDirectory();
    if (typeof path === "string") {
      dispatch(setSongRepo(path)); // Use Redux action
    }
  };
  const setSelectedHymnBackground = (bg: string) =>
    localStorage.setItem("bmusicpresentationbg", bg);

  // Add local theme state management
  const [localTheme, setLocalTheme] = useState(
    localStorage.getItem("bmusictheme") || "white"
  );

  // Theme toggle function for songs app
  const toggleSongTheme = () => {
    const newTheme = localTheme === "creamy" ? "white" : "creamy";
    setLocalTheme(newTheme);
    localStorage.setItem("bmusictheme", newTheme);

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: "bmusictheme", newValue: newTheme },
      })
    );
  };

  const [fontSize, setFontSize] = useState(
    localStorage.getItem("bmusicfontSize") || "1.5"
  );
  const [fontFamily, setFontFamily] = useState(
    localStorage.getItem("bmusicfontFamily") || "'Georgia', serif"
  );
  const [displayCount, setDisplayCount] = useState(
    localStorage.getItem("bmusicdisplayCount") || "6"
  );
  const [layout, setLayout] = useState(
    localStorage.getItem("bmusiclayout") || "table"
  );
  const [selectedBg, setSelectedBg] = useState(
    localStorage.getItem("selectedBg") || "bg1"
  );
  const [imagesPath, setImagePath] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [isLoadingCustomImages, setIsLoadingCustomImages] = useState(false);

  // Load saved theme on component mount and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("bmusictheme");
    if (savedTheme) {
      setLocalTheme(savedTheme);
    }

    // Listen for localStorage changes (when theme is changed from TitleBar)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === "bmusictheme") {
        setLocalTheme(e.detail.newValue);
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, []);

  const backgroundOptions = [
    {
      id: "bg1",
      name: "Classic Theme",
      thumbnail: "./blue.jpg",
      gradient: "bg-gradient-to-r from-amber-50 to-amber-100",
    },
    {
      id: "bg2",
      name: "Midnight Jazz",
      thumbnail: "./pic2.jpg",
      gradient: "bg-gradient-to-r from-blue-900 to-purple-900",
    },
    {
      id: "bg3",
      name: "Sunset Vibes",
      thumbnail: "./wood7.png",
      gradient: "bg-gradient-to-r from-orange-200 to-rose-200",
    },
    {
      id: "bg4",
      name: "Forest Calm",
      thumbnail: "./wood9.png",
      gradient: "bg-gradient-to-r from-green-100 to-emerald-100",
    },
  ];

  const fontSizeOptions = [
    { value: "0.3", label: "xxs" },
    { value: "0.9", label: "xs" },
    { value: "1.4", label: "Small" },
    { value: "1.5", label: "Medium" },
    { value: "1.7", label: "Large" },
  ];

  const fontFamilyOptions = [
    { value: "'Bitter Thin', serif", label: "Bitter Thin" },
    { value: "'Arial Black', serif", label: "Arial" },
    { value: "'Oswald ExtraLight', serif", label: "Oswald ExtraLight" },
    { value: "'Haettenschweiler', sans-serif", label: "Haettenschweiler" },
    { value: "'Impact', sans-serif", label: "Impact" },
    { value: "'Alumini Sans Black', serif", label: "Alumini Sans Black" },
    { value: "'LTFuzz', serif", label: "LTFuzz" },
    { value: "'Milkyway DEMO'", label: "Milkyway" },
  ];

  const selectImagesPath = async () => {
    const path = await window.api.selectDirectory();
    if (typeof path === "string") {
      localStorage.setItem("bmusicimages", path);
      dispatch(setCurrentScreen("backgrounds"));
      // Load custom images after setting the path
      fetchCustomImages();
    }
  };

  const fetchCustomImages = async () => {
    const customImagesPath = localStorage.getItem("bmusicimages");
    if (!customImagesPath) return;

    try {
      setIsLoadingCustomImages(true);
      const images = await window.api.getImages(customImagesPath);
      // Get only the first 5 images for sidebar display
      setCustomImages(images.slice(0, 7));
    } catch (error) {
      console.error("Error loading custom images:", error);
    } finally {
      setIsLoadingCustomImages(false);
    }
  };

  // Load custom images on component mount
  useEffect(() => {
    fetchCustomImages();
  }, []);

  const selectPresentationBackground = (imagepath: string) => {
    setSelectedBg(imagepath);
    setSelectedHymnBackground(imagepath);
    localStorage.setItem("bmusicpresentationbg", imagepath);
  };

  useEffect(() => {
    const savedCollections = localStorage.getItem("bmusiccollections");
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    } else {
      // Sample collections if none exist
      const sampleCollections: Collection[] = [
        {
          id: "c1",
          name: "Wedding Songs",
          songIds: [],
          dateCreated: new Date().toISOString(),
        },
        {
          id: "c2",
          name: "Favorites",
          songIds: [],
          dateCreated: new Date().toISOString(),
        },
        {
          id: "c3",
          name: "Prayer Songs",
          songIds: [],
          dateCreated: new Date().toISOString(),
        },
      ];
      setCollections(sampleCollections);
      localStorage.setItem(
        "bmusiccollections",
        JSON.stringify(sampleCollections)
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bmusicfontFamily", fontFamily);
    localStorage.setItem("bmusicdisplayCount", displayCount);
    localStorage.setItem("bmusiclayout", layout);
    localStorage.setItem("selectedBg", selectedBg);
    localStorage.setItem("bmusicfontSize", fontSize);
  }, [fontSize, fontFamily, displayCount, layout, selectedBg]);

  const renderContent = () => {
    switch (activeTab) {
      case "Song":
        return (
          <div className="flex items-start flex-col px-3">
            {/* <h3 className="text-lg text-left font-ThePriest underline text-stone-600 font-semibold overflow-hidden mb-1">
              {selectedSong?.title}
            </h3> */}
            {/* clean song content with dangerously html*/}
            {/* dangerously rendered  html to clean code */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 * 0.1 }}
              className="relative w-full overflow-hidden "
            >
              <div className="relative w-full h-[85vh] rounded-lg shadow-lg overflow-hidden">
                {/* Fixed scroll background image - completely static */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={`./${
                      localTheme === "creamy"
                        ? "creampaper.jpg"
                        : "whitescroll.png"
                    }`}
                    alt="Scroll background"
                    className="w-full h-full object-cover object-center"
                    style={{ position: "sticky", top: 0 }}
                  />
                </div>

                {/* Fixed positioned text overlay that doesn't move with scroll */}
                <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
                  <div className="w-[90%] h-[80%] relative pointer-events-auto">
                    {/* Scrollable text content with proper boundaries */}
                     <h3 className="text-lg text-left font-ThePriest underline text-stone-600 font-semibold overflow-hidden mb-1">
              {selectedSong?.title}
            </h3>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedSong?.content || "",
                      }}
                      className={`overflow-y-scroll no-scrollbar h-full w-full text-left text-[10px] px-3 leading-relaxed ${
                        !selectedSong && "hidden"
                      }`}
                      style={{
                        color: localTheme === "creamy" ? "#654321" : "#2D1810",
                        backgroundColor: "transparent",
                        textShadow: "none",
                        lineHeight: "1.6",
                        fontFamily: "'Georgia', serif",
                        fontWeight: "500",
                        maxHeight: "100%",
                        overflowWrap: "break-word",
                        wordWrap: "break-word",
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* <p>{selectedSong?.content}</p> */}
            {!selectedSong?.content && (
              <img src="./nosong.png" alt="" className="h-40" />
            )}
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 ">
            <div className="space-y-4 ">
              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: "Georgia" }}
              >
                Display Settings
              </h3>

              <CustomDropdown
                label="Font Size"
                value={fontSize}
                onChange={setFontSize}
                options={fontSizeOptions}
              />

              <CustomDropdown
                label="Font Family"
                value={fontFamily}
                onChange={setFontFamily}
                options={fontFamilyOptions}
              />

              <div className="flex items-center gap-2 ">
                <Tooltip title="Select songs Directory">
                  <div
                    onClick={selectsongDir}
                    className="w-4 h-4 p-4 cursor-pointer  bg-white/50  text-vmborder-vmprim text-[12px] rounded-full
                               transition-all duration-300 flex items-center justify-center gap-2
                               focus:outline-none group"
                    style={{
                      borderWidth: 1,
                      borderColor:
                        localTheme === "creamy" ? "#9a674a" : "#3e3e3e",
                      borderStyle: "dashed",
                      color: localTheme === "creamy" ? "#9a674a" : "#3e3e3e",
                    }}
                  >
                    <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {/* <span>Songs directory </span> */}
                  </div>
                </Tooltip>
                <Tooltip title="selected path for image backgrounds">
                  <div
                    onClick={() => selectImagesPath()}
                    className="w-4 h-4 cursor-pointer rounded-full p-4  bg-white/50 border-2 border-vmprim/20
                               hover:border-vmprim text-vmborder-vmprim text-[12px] 
                               transition-all duration-300 flex items-center justify-center gap-2
                               focus:outline-none group"
                    style={{
                      borderWidth: 1,
                      borderColor:
                        localTheme === "creamy" ? "#9a674a" : "#3e3e3e",
                      borderStyle: "dashed",
                      color: localTheme === "creamy" ? "#9a674a" : "#3e3e3e",
                    }}
                  >
                    <Wallpaper className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {/* <span>Presentation background path </span> */}
                  </div>
                </Tooltip>

                <Tooltip title="Refresh custom images">
                  <div
                    onClick={fetchCustomImages}
                    className="w-4 h-4 cursor-pointer rounded-full p-4  bg-white/50 border-2 border-vmprim/20
                               hover:border-vmprim text-vmborder-vmprim text-[12px] 
                               transition-all duration-300 flex items-center justify-center gap-2
                               focus:outline-none group"
                    style={{
                      borderWidth: 1,
                      borderColor:
                        localTheme === "creamy" ? "#9a674a" : "#3e3e3e",
                      borderStyle: "dashed",
                      color: localTheme === "creamy" ? "#9a674a" : "#3e3e3e",
                    }}
                  >
                    <RefreshCw
                      className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                        isLoadingCustomImages ? "animate-spin" : ""
                      }`}
                    />
                  </div>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Custom Backgrounds
                </label>

                {/* Modern loading state */}
                {isLoadingCustomImages && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative">
                      {/* Main spinner */}
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-vmprim/20 border-t-vmprim"></div>

                      {/* Inner pulse */}
                      <div className="absolute inset-2 bg-vmprim/20 rounded-full animate-pulse"></div>
                    </div>

                    {/* Loading text */}
                    <motion.p
                      className="text-xs text-stone-500 mt-3 opacity-75"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Loading backgrounds...
                    </motion.p>

                    {/* Animated dots */}
                    <div className="flex space-x-1 mt-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 bg-vmprim rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom images in a simple grid layout */}
                {!isLoadingCustomImages && customImages.length > 0 && (
                  <div className="py-4">
                    <div className="grid grid-cols-4 gap-3 justify-center">
                      {customImages.map((imageSrc, index) => {
                        const isSelected = selectedBg === imageSrc;

                        return (
                          <motion.div
                            key={index}
                            onClick={() =>
                              selectPresentationBackground(imageSrc)
                            }
                            className="cursor-pointer transition-all duration-300 flex justify-center"
                            whileHover={{
                              scale: 1.1,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: index * 0.1,
                              type: "spring",
                              stiffness: 300,
                            }}
                          >
                            <div className="relative group">
                              {/* Main circular image container */}
                              <div
                                className={`w-16 h-16 bg-cover bg-center rounded-full overflow-hidden border-3 transition-all duration-300 ${
                                  isSelected
                                    ? "border-vmprim border-solid shadow-2xl shadow-vmprim/50 ring-2 ring-vmprim/30"
                                    : "border-dashed border-white/70 hover:border-white shadow-lg"
                                } backdrop-blur-sm`}
                                style={{
                                  backgroundImage: `url(${imageSrc})`,
                                  boxShadow: isSelected
                                    ? "0 20px 40px -12px rgba(154, 103, 74, 0.6), 0 8px 16px -4px rgba(154, 103, 74, 0.4)"
                                    : "0 8px 25px -8px rgba(0, 0, 0, 0.3)",
                                }}
                              >
                                {/* Gradient overlay for depth */}
                                <div
                                  className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 transition-opacity duration-300 ${
                                    isSelected
                                      ? "opacity-0"
                                      : "opacity-60 group-hover:opacity-30"
                                  }`}
                                />

                                {/* Selection indicator */}
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      delay: 0.2,
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 20,
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-vmprim rounded-full flex items-center justify-center border-3 border-white shadow-xl"
                                  >
                                    <Check className="w-3 h-3 text-white font-bold" />
                                  </motion.div>
                                )}

                                {/* Hover glow ring */}
                                <div
                                  className={`absolute -inset-1 rounded-full bg-gradient-to-r from-vmprim/20 via-vmprim/10 to-vmprim/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm`}
                                />
                              </div>

                              {/* Pulsing glow effect for selected item */}
                              {isSelected && (
                                <div className="absolute inset-0 rounded-full bg-vmprim/30 blur-lg -z-10 animate-pulse" />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Bottom info */}
                    <div className="text-center mt-3">
                      <span className="text-xs text-stone-400 opacity-75 inline-flex items-center gap-1">
                        <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                        {customImages.length} custom backgrounds
                      </span>
                    </div>
                  </div>
                )}

                {/* Enhanced no custom images message */}
                {!isLoadingCustomImages && customImages.length === 0 && (
                  <motion.div
                    className="text-center py-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="relative inline-block">
                      {/* Icon with animated border */}
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center relative overflow-hidden">
                        <Wallpaper className="w-6 h-6 text-stone-400" />

                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full animate-pulse" />
                      </div>
                    </div>

                    <motion.p
                      className="text-sm text-stone-500 font-medium mb-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      No custom images found
                    </motion.p>

                    <motion.p
                      className="text-xs text-stone-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Select a directory to load your backgrounds
                    </motion.p>

                    {/* Decorative elements */}
                    <div className="flex justify-center space-x-1 mt-3 opacity-30">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 bg-stone-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Default backgrounds fallback with circular modern styling */}
                {!isLoadingCustomImages && customImages.length === 0 && (
                  <div className="relative py-4">
                    <div className="flex flex-wrap justify-center gap-4">
                      {backgroundOptions.map((bg, index) => (
                        <motion.button
                          key={bg.id}
                          onClick={() =>
                            selectPresentationBackground(bg.thumbnail)
                          }
                          className={`relative group transition-all duration-300`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: index * 0.15,
                            type: "spring",
                            stiffness: 300,
                          }}
                          whileHover={{
                            scale: 1.15,
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className="flex flex-col items-center">
                            {/* Circular image */}
                            <div
                              className={`w-16 h-16 bg-cover bg-center rounded-full overflow-hidden border-3 border-dashed transition-all duration-300 ${
                                selectedBg === bg.thumbnail
                                  ? "border-vmprim border-solid shadow-2xl shadow-vmprim/40 ring-2 ring-vmprim/30"
                                  : localTheme === "creamy"
                                  ? "border-[#9a674a]/50 hover:border-[#9a674a] shadow-lg"
                                  : "border-stone-400 hover:border-stone-500 shadow-lg"
                              }`}
                              style={{
                                backgroundImage: `url(${bg.thumbnail})`,
                                boxShadow:
                                  selectedBg === bg.thumbnail
                                    ? "0 20px 40px -12px rgba(154, 103, 74, 0.4)"
                                    : "0 8px 25px -8px rgba(0, 0, 0, 0.2)",
                              }}
                            >
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 group-hover:to-black/10 transition-all duration-300 opacity-60 group-hover:opacity-20" />

                              {selectedBg === bg.thumbnail && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-vmprim rounded-full flex items-center justify-center border-3 border-white shadow-xl"
                                >
                                  <Check className="w-3 h-3 text-white font-bold" />
                                </motion.div>
                              )}

                              {/* Hover glow */}
                              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-vmprim/20 via-vmprim/10 to-vmprim/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm" />
                            </div>

                            {/* Label */}
                            <span className="text-xs mt-2 block text-center truncate opacity-75 group-hover:opacity-100 transition-opacity font-medium">
                              {bg.name}
                            </span>
                          </div>

                          {/* Selected glow effect */}
                          {selectedBg === bg.thumbnail && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-vmprim/30 blur-lg -z-10 animate-pulse" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "collections":
        return (
          <div className="space-y-2">
            {collections.length === 0 && (
              <img src="./nosong.png" alt="" className="h-40" />
            )}

            {collections.map((collection, index) => (
              <div
                key={index}
                className={`px-3 ${
                  localTheme === "creamy" ? "bg-[#faeed1] " : "bg-white/90"
                } shadow rounded-lg backdrop-blur-sm transition-all hover:bg-white/40`}
              >
                <div className="flex flex-col justify-between items-start">
                  <div className=" w-full">
                    <h4
                      className="font-bolder text-[#9a674a] flex items-center gap-3  text-[14px]"
                      style={{ fontFamily: "garamond" }}
                    >
                      {collection.name}{" "}
                      <span>
                        <ExternalLink
                          className="h-4 w-4 text-vmborder-vmprim hover:scale-105 hover:cursor-pointer"
                          onClick={() => setCurrentScreen("categorize")}
                        />
                      </span>
                    </h4>
                    <div className="flex items-center justify-between w-full">
                      <p className="text-sm text-stone-600">
                        {collection.songIds.length} songs
                      </p>
                      {collection.name === "Wedding" && (
                        <img
                          src="./flower.png"
                          className="w-20 h-10"
                          alt="flower"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-72 h-full pt-2 border-r border-stone-300 bg-white/20 backdrop-blur-sm transition-all duration-300 ease-in-out flex flex-col shadow ${
        localTheme === "creamy" ? "bg-[#f1e3ae]" : "bg-white/20"
      }`}
      style={{
        backgroundColor: localTheme === "creamy" ? "#fdf4d0" : "white",
      }}
    >
      <div className="p-4 flex items-center justify-between flex-shrink-0">
        <h2 className="font-ThePriest text-[15px] s font-bold text-vmprim border-vmprim flex items-center gap-2">
          <Music className="w-5 h-5 animate-bounce" />
          Soul healing music
          <Music className="w-5 h-5 animate-bounce" />
        </h2>
        <button
          onClick={toggleSongTheme}
          className={`p-2 rounded-full transition-colors ${
            localTheme === "creamy"
              ? "bg-[#9a674a] text-white hover:bg-[#8a564a]"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={`Switch to ${
            localTheme === "creamy" ? "white" : "creamy"
          } theme`}
        >
          <div className="w-4 h-4 rounded-full border-2 border-current bg-[#9a674a]">
            {" "}
            {localTheme === "creamy" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <MoonFilled className="w-4 h-4 text-[#faeed1]" />
            )}
          </div>
        </button>
      </div>

      <div className="px-2 flex-shrink-0">
        <div
          className={`flex space-x-2 ${
            localTheme === "creamy" ? "bg-[#faeed1]" : "bg-[#ececeb]"
          } p-1 rounded-lg`}
        >
          <button
            onClick={() => setActiveTab("Song")}
            className={` py-2 rounded-md text-[12px] px-2 font-medium transition-colors flex items-center justify-center ${
              activeTab === "Song" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "Song" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            Song <FileMusic className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={` py-2 rounded-md text-[12px] px-2  font-medium transition-colors flex items-center justify-center ${
              activeTab === "settings" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "settings" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            Settings <CogIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab("collections")}
            className={`flex-1 py-2 rounded-md text-[12px] px-2 font-medium transition-colors flex items-center justify-center ${
              activeTab === "collections" && localTheme === "creamy"
                ? "bg-vmprim text-white"
                : activeTab === "collections" && localTheme === "white"
                ? "bg-vmprim text-white"
                : "text-stone-600 bg-[#fdf4d0]"
            }`}
          >
            collections <Group className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
});

export default Sidebar;
