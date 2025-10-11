import React, { useState, useEffect } from "react";
import { FolderOpen, Wallpaper, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from "antd";
import { useAppDispatch } from "../../../../store";
import { setSongRepo } from "../../../../store/slices/songSlice";
import { setCurrentScreen } from "../../../../store/slices/appSlice";
import CustomDropdown from "../shared/CustomDropdown";

interface SettingsTabContentProps {
  localTheme: string;
}

const SettingsTabContent: React.FC<SettingsTabContentProps> = ({
  localTheme,
}) => {
  const dispatch = useAppDispatch();

  const [fontSize, setFontSize] = useState(
    localStorage.getItem("bmusicfontSize") || "1.5"
  );
  const [fontFamily, setFontFamily] = useState(
    localStorage.getItem("bmusicfontFamily") || "'Georgia', serif"
  );
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [isLoadingCustomImages, setIsLoadingCustomImages] = useState(false);
  const [selectedBg, setSelectedBg] = useState(
    localStorage.getItem("selectedBg") || "bg1"
  );

  const selectsongDir = async () => {
    const path = await window.api.selectDirectory();
    if (typeof path === "string") {
      dispatch(setSongRepo(path)); // Use Redux action
    }
  };

  const setSelectedHymnBackground = (bg: string) =>
    localStorage.setItem("bmusicpresentationbg", bg);

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
      thumbnail: "pic2.jpg",
      gradient: "bg-gradient-to-r from-blue-900 to-purple-900",
    },
    {
      id: "bg3",
      name: "Sunset Vibes",
      thumbnail: "wood7.png",
      gradient: "bg-gradient-to-r from-orange-200 to-rose-200",
    },
    {
      id: "bg4",
      name: "Forest Calm",
      thumbnail: "wood9.png",
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
    localStorage.setItem("bmusicfontFamily", fontFamily);
    localStorage.setItem("selectedBg", selectedBg);
    localStorage.setItem("bmusicfontSize", fontSize);
  }, [fontSize, fontFamily, selectedBg]);

  return (
    <div className="space-y-6" style={{ fontFamily: '"Crimson Pro", serif' }}>
      <div className="space-y-4 ">
        <h3 className="text-lg font-semibold" style={{ fontFamily: "Georgia" }}>
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

        <div className="flex items-center gap-3">
          <Tooltip title="Select songs Directory">
            <motion.div
              onClick={selectsongDir}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden cursor-pointer rounded-full h-10 w-10 flex items-center justify-center   transition-all duration-300 group shadow-md hover:shadow-lg"
              style={{
                background:
                  localTheme === "creamy"
                    ? "linear-gradient(135deg, #faeed1 0%, #f7e6c4 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                borderWidth: 1,
                borderColor: localTheme === "creamy" ? "#e6d3b7" : "#e2e8f0",
                borderStyle: "solid",
              }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 opacity-40 group-hover:opacity-20 transition-opacity duration-300" />

              <FolderOpen
                className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform"
                style={{
                  color: localTheme === "creamy" ? "#8b6f3d" : "#64748b",
                }}
              />
            </motion.div>
          </Tooltip>

          <Tooltip title="Select path for image backgrounds">
            <motion.div
              onClick={() => selectImagesPath()}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden cursor-pointer rounded-full h-10 w-10 flex items-center justify-center   transition-all duration-300 group shadow-md hover:shadow-lg"
              style={{
                background:
                  localTheme === "creamy"
                    ? "linear-gradient(135deg, #faeed1 0%, #f7e6c4 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                borderWidth: 1,
                borderColor: localTheme === "creamy" ? "#e6d3b7" : "#e2e8f0",
                borderStyle: "solid",
              }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 opacity-40 group-hover:opacity-20 transition-opacity duration-300" />

              <Wallpaper
                className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform"
                style={{
                  color: localTheme === "creamy" ? "#8b6f3d" : "#64748b",
                }}
              />
            </motion.div>
          </Tooltip>

          <Tooltip title="Refresh custom images">
            <motion.div
              onClick={fetchCustomImages}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden cursor-pointer rounded-full h-10 w-10 flex items-center justify-center   transition-all duration-300 group shadow-md hover:shadow-lg"
              style={{
                background:
                  localTheme === "creamy"
                    ? "linear-gradient(135deg, #faeed1 0%, #f7e6c4 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                borderWidth: 1,
                borderColor: localTheme === "creamy" ? "#e6d3b7" : "#e2e8f0",
                borderStyle: "solid",
              }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 opacity-40 group-hover:opacity-20 transition-opacity duration-300" />

              <RefreshCw
                className={`w-4 h-4 relative z-10 group-hover:scale-110 transition-transform ${
                  isLoadingCustomImages ? "animate-spin" : ""
                }`}
                style={{
                  color: localTheme === "creamy" ? "#8b6f3d" : "#64748b",
                }}
              />
            </motion.div>
          </Tooltip>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Backgrounds</label>

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
                      onClick={() => selectPresentationBackground(imageSrc)}
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
                          }}
                        >
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
                              ✓
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
                    onClick={() => selectPresentationBackground(bg.thumbnail)}
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
                        }}
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 " />

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
                            ✓
                          </motion.div>
                        )}
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
};

export default SettingsTabContent;
