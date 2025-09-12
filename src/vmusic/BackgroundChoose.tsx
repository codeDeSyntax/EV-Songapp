import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, FolderUp, RefreshCw, Monitor } from "lucide-react";
import { Tooltip } from "antd";
import { useAppDispatch } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import TitleBar from "../shared/TitleBar";
import { useTheme } from "@/Provider/Theme";
import BackgroundGrid from "./components/BackgroundGrid";

// Optimized skeleton loader with fewer items for faster rendering
const SkeletonLoader = React.memo(() => {
  const skeletonItems = Array.from({ length: 8 }, (_, i) => i); // Reduced from 12 to 8

  return (
    <div className="relative p-8 w-fit mx-auto">
      <div className="relative grid grid-cols-4 gap-4">
        {skeletonItems.map((index) => (
          <div
            key={index}
            className="relative bg-white shadow-lg rounded-sm overflow-hidden"
            style={{
              width: "160px",
              height: "200px",
              transform: `rotate(${((index % 4) - 2) * 2}deg)`, // Reduced rotation for smoother animation
            }}
          >
            {/* Image skeleton */}
            <div className="w-full h-[140px] bg-gray-200 animate-pulse" />

            {/* Text skeleton */}
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

interface Background {
  name: string;
  src: string;
  category: string;
  isCustom?: boolean;
}

const PresentationBackgroundSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDarkMode } = useTheme();
  const [selectedBackground, setSelectedBackground] =
    useState<Background | null>(null);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [localTheme] = useState(localStorage.getItem("bmusictheme") || "dark");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customImagesPath, setCustomImagesPath] = useState(
    localStorage.getItem("vmusicImageDirectory") || ""
  );

  // Cache for loaded images to prevent re-downloading
  const imageCache = useRef(new Map<string, boolean>());
  const abortController = useRef<AbortController | null>(null);

  // Memoized default backgrounds - these won't change
  const defaultBackgrounds = useMemo<Background[]>(
    () => [
      { name: "Wood Pattern", src: "wood2.jpg", category: "Nature" },
      { name: "Snow Scene", src: "snow1.jpg", category: "Nature" },
      { name: "Wooden Texture", src: "wood6.jpg", category: "Nature" },
      { name: "Pine Pattern", src: "wood7.png", category: "Nature" },
      { name: "Mountain View", src: "pic2.jpg", category: "Landscape" },
      { name: "Abstract Art", src: "wood10.jpg", category: "Abstract" },
      { name: "Vintage Paper", src: "wood11.jpg", category: "Texture" },
    ],
    []
  );

  // Preload critical images for faster display
  const preloadImage = useCallback((src: string): Promise<void> => {
    if (imageCache.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(src, true);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Optimized background loading with better error handling and caching
  const loadBackgrounds = useCallback(async () => {
    // Cancel any existing loading operation
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsLoadingImages(true);

    try {
      // Start with default backgrounds immediately
      setBackgrounds(defaultBackgrounds);

      // Preload default background images in parallel (non-blocking)
      const preloadPromises = defaultBackgrounds.map((bg) =>
        preloadImage(bg.src).catch((err) => {
          console.warn(`Failed to preload ${bg.src}:`, err);
        })
      );

      // Load custom images if path exists
      if (customImagesPath) {
        try {
          console.log(
            "🔍 BackgroundChoose: Loading custom images from:",
            customImagesPath
          );
          const customImages = await window.api.getImages(customImagesPath);
          console.log(
            "🔍 BackgroundChoose: Received custom images:",
            customImages
          );

          if (abortController.current?.signal.aborted) return;

          // Process all custom images at once to avoid multiple re-renders
          const customBackgrounds = customImages.map(
            (src: string, index: number) => {
              if (index < 5) {
                // Only log a few to avoid console spam
                console.log(
                  `🔍 BackgroundChoose: Custom image ${index + 1}:`,
                  src
                );
              }
              return {
                name: `Custom Image ${index + 1}`,
                src,
                category: "Custom",
                isCustom: true,
              };
            }
          );

          console.log(
            `✅ BackgroundChoose: Loaded ${customBackgrounds.length} custom images`
          );

          // Single state update with all backgrounds
          setBackgrounds([...defaultBackgrounds, ...customBackgrounds]);
        } catch (error) {
          console.error("Failed to load custom images:", error);
          // Keep default backgrounds even if custom loading fails
        }
      } else {
        console.log(
          "🔍 BackgroundChoose: No custom images path set, using default backgrounds only"
        );
      }

      // Wait for default image preloading to complete (non-blocking)
      Promise.allSettled(preloadPromises).then(() => {
        console.log("✅ BackgroundChoose: Default backgrounds preloaded");
      });
    } catch (error) {
      console.error("Error in loadBackgrounds:", error);
    } finally {
      setIsLoadingImages(false);
    }
  }, [customImagesPath, defaultBackgrounds, preloadImage]);

  // Load backgrounds with dependency optimization
  useEffect(() => {
    loadBackgrounds();

    // Load saved background from localStorage
    const savedBackgroundSrc = localStorage.getItem("bmusicpresentationbg");
    if (savedBackgroundSrc) {
      // Find the background in our default backgrounds first
      const savedBg = defaultBackgrounds.find(
        (bg) => bg.src === savedBackgroundSrc
      );
      if (savedBg) {
        setSelectedBackground(savedBg);
      } else {
        // If not found in defaults, create a temporary background object
        setSelectedBackground({
          name: "Saved Background",
          src: savedBackgroundSrc,
          category: "Custom",
          isCustom: true,
        });
      }
    }

    // Cleanup function
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadBackgrounds, defaultBackgrounds]);

  // Handle window resize with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 100);
    };

    window.addEventListener("resize", checkMobile);
    checkMobile();
    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  // Optimized background selection handler
  const handleSelectBackground = useCallback((background: Background) => {
    setSelectedBackground(background);
    console.log(
      "💾 BackgroundChoose: Saving background to localStorage:",
      background.src
    );
    console.log("💾 BackgroundChoose: Background name:", background.name);
    console.log(
      "💾 BackgroundChoose: Background category:",
      background.category
    );
    console.log("💾 BackgroundChoose: Is custom:", background.isCustom);
    localStorage.setItem("bmusicpresentationbg", background.src);

    // Verify it was saved correctly
    const savedValue = localStorage.getItem("bmusicpresentationbg");
    console.log("✅ BackgroundChoose: Verified saved value:", savedValue);

    // Trigger storage event manually for same-window updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "bmusicpresentationbg",
        oldValue: null,
        newValue: background.src,
        storageArea: localStorage,
      })
    );
    console.log("📢 BackgroundChoose: Dispatched storage event");
  }, []);

  // Optimized directory upload handler
  const handleUploadBackground = useCallback(async () => {
    try {
      const result = await window.api.selectDirectory();
      if (typeof result === "string" && result) {
        setCustomImagesPath(result);
        localStorage.setItem("vmusicImageDirectory", result);
        // The useEffect will handle reloading with the loading state
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  }, []);

  // Helper function to project current background
  const projectBackground = useCallback(() => {
    if (selectedBackground) {
      // Create a demo song with the selected background
      const demoSong = {
        title: "Background Preview",
        content: `
        <p>Verse 1</p>
<p>Adom bi wo Jesus</p>
<p>ne mu na mensa aka</p>
<p>Adom bi wo Jesus</p>
<p>ne mu na mensa aka</p>
<p>Adom nti na mete ase</p>
<p>Emu na mekeka meho</p>
<p>Emu na, meye m'ade nyinaa</p>


        `,
        id: `background-preview-${Date.now()}`,
        path: "",
        dateModified: new Date().toISOString(),
        categories: [],
        background: selectedBackground.src,
      };

      // Use React-based projection
      window.api.projectSong(demoSong);

      window.api.onDisplaySong((songData) => {
        console.log(
          `Displaying background preview: ${selectedBackground.name}`
        );
      });
    }
  }, [selectedBackground]);

  // Memoized categories calculation for better performance
  const categories = useMemo(() => {
    const uniqueCategories = new Set(backgrounds.map((bg) => bg.category));
    return ["All", ...Array.from(uniqueCategories)];
  }, [backgrounds]);

  // Memoized filtered backgrounds with improved stability for fewer re-renders
  const filteredBackgrounds = useMemo(() => {
    if (selectedCategory === "All") {
      // Apply stable sorting to prevent unnecessary re-renders
      return [...backgrounds].sort((a, b) => {
        // Sort by category then by name for stable ordering
        if (a.category !== b.category)
          return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
    }
    return backgrounds.filter((bg) => bg.category === selectedCategory);
  }, [backgrounds, selectedCategory]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden relative">
      <TitleBar />

      <div className="flex flex-col h-full">
        {/* Main Content Area - Large iPad Simulation */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <div className="p-6 h-full">
            <div className="flex items-center justify-center h-full">
              {/* Large iPad Simulation Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* iPad Frame - Much Larger */}
                <div
                  className="relative rounded-[3rem] p-6 shadow-2xl"
                  style={{
                    width: "900px",
                    height: "650px",
                    backgroundColor: "#1d1c1b", // Dark gray/black
                  }}
                >
                  {/* iPad Screen with Background */}
                  <div
                    className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative"
                    style={{
                      background: selectedBackground
                        ? `url(${selectedBackground.src})`
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      // imageRendering: "crisp-edges",
                    }}
                  >
                    {/* Content Container inside iPad - Fixed Height */}
                    <div className="relative z-10 p-4 h-full flex flex-col max-h-full">
                      {/* Top Navigation Bar - Compact */}
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => dispatch(setCurrentScreen("Songs"))}
                          className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 transition-all text-sm"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span className="font-medium">Back</span>
                        </motion.button>

                        <h1 className="text-lg font-bold text-white drop-shadow-lg text-center">
                          Background Gallery
                        </h1>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleUploadBackground}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary backdrop-blur-md rounded-full text-white hover:bg-yellow-500 transition-all shadow-lg text-sm"
                        >
                          <FolderUp className="w-3 h-3" />
                          <span className="font-medium">Upload</span>
                        </motion.button>
                      </div>

                      {/* Category Pills - Compact */}
                      <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0 flex-wrap">
                        {categories.map((category) => {
                          const getCategoryIcon = (cat: string) => {
                            switch (cat) {
                              case "All":
                                return <Palette className="w-3 h-3" />;
                              case "Nature":
                                return (
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                );
                              case "Landscape":
                                return (
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                );
                              case "Abstract":
                                return (
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                );
                              case "Texture":
                                return (
                                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                );
                              case "Custom":
                                return <FolderUp className="w-3 h-3" />;
                              default:
                                return (
                                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                );
                            }
                          };

                          return (
                            <motion.button
                              key={category}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedCategory(category)}
                              className={`
                                px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium
                                transition-all duration-200 shadow-lg backdrop-blur-md
                                ${
                                  selectedCategory === category
                                    ? "bg-white/90 text-gray-800 shadow-xl"
                                    : "bg-white/20 text-white hover:bg-white/30"
                                }
                              `}
                            >
                              {getCategoryIcon(category)}
                              <span>{category}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Main Content Area - Flex with Overflow Control */}
                      <div className="flex-1 flex gap-4 min-h-0">
                        {/* Background Grid - Glass Panel */}
                        <div className="flex-1 min-w-0">
                          <div className="h-full backdrop-blur-md bg-black/10 rounded-xl border border-white/20 p-4 shadow-xl flex flex-col">
                            <h3 className="text-sm font-semibold text-white mb-3 drop-shadow-lg flex items-center gap-2 flex-shrink-0">
                              <Palette className="w-4 h-4" />
                              Choose Background
                            </h3>
                            <div className="flex-1 overflow-y-auto no-scrollbar rounded-lg">
                              {isLoadingImages ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="aspect-[4/3] bg-white/20 backdrop-blur-sm rounded-lg animate-pulse"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 gap-2">
                                  {filteredBackgrounds.map(
                                    (background, index) => (
                                      <motion.div
                                        key={`${background.src}-${index}`}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() =>
                                          handleSelectBackground(background)
                                        }
                                        className={`
                                        relative aspect-[5/3] rounded-lg overflow-hidden cursor-pointer
                                        transition-all duration-200 shadow-md hover:shadow-lg
                                        ${
                                          selectedBackground?.src ===
                                          background.src
                                            ? "ring-2 ring-yellow-400 shadow-lg"
                                            : "hover:shadow-lg"
                                        }
                                      `}
                                      >
                                        <img
                                          src={background.src}
                                          alt={background.name}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                          onError={(e) => {
                                            const target =
                                              e.target as HTMLImageElement;
                                            target.style.display = "none";
                                          }}
                                        />
                                        {selectedBackground?.src ===
                                          background.src && (
                                          <div className="absolute inset-0 bg-yellow-400/30 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                              <span className="text-black text-xs font-bold">
                                                ✓
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                          <p className="text-white text-xs font-medium truncate drop-shadow-md">
                                            {background.name}
                                          </p>
                                        </div>
                                      </motion.div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls Panel - Glass Style */}
                        <div className="w-60 flex-shrink-0">
                          <div className="h-full backdrop-blur-md bg-black/10 rounded-xl border border-white/20 p-4 shadow-xl flex flex-col">
                            {/* Selected Background Info */}
                            {selectedBackground ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col"
                              >
                                <div className="flex-shrink-0">
                                  <h3 className="text-sm font-bold text-white mb-3 drop-shadow-lg flex items-center gap-2">
                                    <Monitor className="w-4 h-4" />
                                    Selected
                                  </h3>
                                  <div className="backdrop-blur-sm bg-white/10 rounded-lg p-3 border border-white/20 mb-4">
                                    <div className="aspect-video rounded-md overflow-hidden mb-2 shadow-md">
                                      <img
                                        src={selectedBackground.src}
                                        alt={selectedBackground.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <p className="font-medium text-white drop-shadow-md text-sm truncate">
                                      {selectedBackground.name}
                                    </p>
                                    <p className="text-xs text-white/80 drop-shadow-sm">
                                      {selectedBackground.category}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex-1 flex flex-col justify-end space-y-2">
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={projectBackground}
                                    className="w-full p-3 bg-green-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-500 transition-all flex items-center justify-center gap-2 shadow-lg border border-green-400/30 text-sm"
                                  >
                                    <Monitor className="w-4 h-4" />
                                    <span className="font-medium">Project</span>
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedBackground(null)}
                                    className="w-full p-2 text-white backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all font-medium text-sm"
                                  >
                                    Clear
                                  </motion.button>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Monitor className="w-12 h-12 mx-auto mb-3 drop-shadow-lg opacity-60" />
                                  <p className="text-sm font-medium drop-shadow-md">
                                    Select Background
                                  </p>
                                  <p className="text-xs text-white/80 drop-shadow-sm">
                                    Choose from gallery
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                      <div className="w-32 h-1.5 bg-white/50 rounded-full shadow-lg"></div>
                    </div>
                  </div>

                  {/* iPad Physical Details */}
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                    <div
                      className="w-1.5 h-12 rounded-r shadow-inner"
                      style={{ backgroundColor: "#374151" }}
                    ></div>
                  </div>
                  <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                    <div
                      className="w-1.5 h-12 rounded-l shadow-inner"
                      style={{ backgroundColor: "#374151" }}
                    ></div>
                  </div>
                  <div className="absolute top-8 right-2">
                    <div
                      className="w-1.5 h-6 rounded-l shadow-inner"
                      style={{ backgroundColor: "#374151" }}
                    ></div>
                  </div>

                  {/* Camera */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <div
                      className="w-3 h-3 rounded-full shadow-inner"
                      style={{ backgroundColor: "#111827" }}
                    ></div>
                  </div>
                </div>

                {/* Device Label */}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationBackgroundSelector;
