import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, Plus, Minus, Square, X, Music, Book } from "lucide-react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setCurrentScreen,
  minimizeApp,
  maximizeApp,
  closeApp,
} from "@/store/slices/appSlice";

// Define types in a separate file and import them to reduce parsing time
interface Song {
  title: string;
  path: string;
  content: string;
  message?: string;
  dateModified: string;
}

// Preload image to ensure it's cached
const preloadImages = () => {
  const imagesToPreload = ["./wood6.jpg", "./grandp1.png", "./wheat1.png"];
  imagesToPreload.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

// Button component for window controls
interface WindowControlButtonProps {
  type: "close" | "minimize" | "maximize";
  onClick: () => void;
  isHovered: string | null;
  setIsHovered: (type: string | null) => void;
}

const WindowControlButton: React.FC<WindowControlButtonProps> = ({
  type,
  onClick,
  isHovered,
  setIsHovered,
}) => {
  const colors = {
    close: {
      bg: "bg-[#FF5F57]",
      hover: "hover:bg-red-600",
      icon: <X className="absolute text-white w-3 h-3" />,
    },
    minimize: {
      bg: "bg-[#FFBD2E]",
      hover: "hover:bg-yellow-600",
      icon: <Minus className="absolute text-white w-3 h-3" />,
    },
    maximize: {
      bg: "bg-[#28CA41]",
      hover: "hover:bg-green-600",
      icon: <Square className="absolute text-white w-3 h-3" />,
    },
  };

  const { bg, hover, icon } = colors[type];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(type)}
      onMouseLeave={() => setIsHovered(null)}
      className={`w-4 h-4 rounded-full ${bg} ${hover} hover:cursor-pointer flex items-center justify-center relative`}
    >
      {isHovered === type && icon}
    </div>
  );
};

// Array of country gospel verses - moved outside component to prevent recreation
const verses = [
  "Amazing grace! How sweet the sound, That saved a wretch like me!",
  "I once was lost, but now am found, Was blind, but now I see.",
  "Will the circle be unbroken, By and by, Lord, by and by",
  "In the sweet by and by, We shall meet on that beautiful shore",
  "I'll fly away, Oh Glory, I'll fly away",
  "When we've been there ten thousand years, Bright shining as the sun",
  "There's power in the blood, power in the blood",
  "Standing on the promises of Christ my King",
  "Blessed assurance, Jesus is mine! Oh, what a foretaste of glory divine!",
];

const WorkspaceSelector = () => {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [randomSong, setRandomSong] = useState<Song | null>(null);
  const [randomVerse, setRandomVerse] = useState("");

  const dispatch = useAppDispatch();
  const songs = useAppSelector((state) => state.songs.songs);

  // Debug: Log songs whenever component renders
  console.log("Component render - Songs:", songs, "Length:", songs?.length);

  // Preload images on component mount
  useEffect(() => {
    preloadImages();

    // Set images as loaded after a short delay
    const timer = setTimeout(() => {
      setImagesLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Select a random song and verse when songs change
  useEffect(() => {
    console.log("Songs state:", songs);
    if (songs && songs.length > 0) {
      console.log("Initial random selection - Songs available:", songs.length);
      const newSong = songs[Math.floor(Math.random() * songs.length)];
      console.log("Selected song:", newSong?.title);

      // Extract a verse from the selected song content
      let extractedVerse = "";
      if (newSong?.content) {
        // Split by lines and find verse lines (avoiding section headers)
        const lines = newSong.content.split("\n").filter(
          (line) =>
            line.trim() &&
            !line.toLowerCase().includes("verse") &&
            !line.toLowerCase().includes("chorus") &&
            !line.toLowerCase().includes("bridge") &&
            !line.toLowerCase().includes("pre-chorus") &&
            line.length > 20 // Ensure it's a substantial line
        );
        if (lines.length > 0) {
          extractedVerse =
            lines[Math.floor(Math.random() * lines.length)].trim();
        }
      }

      // Fallback to hardcoded verses if no content found
      if (!extractedVerse) {
        extractedVerse = verses[Math.floor(Math.random() * verses.length)];
      }

      console.log("Selected verse:", extractedVerse);
      setRandomSong(newSong);
      setRandomVerse(extractedVerse.trim());
    } else {
      console.log("No songs available");
      // Set initial verse even if no songs
      setRandomVerse(verses[Math.floor(Math.random() * verses.length)].trim());
    }
  }, [songs]);

  // Change random song and verse every 5 seconds
  useEffect(() => {
    if (songs && songs.length > 0) {
      console.log("Setting up interval for random changes");
      const interval = setInterval(() => {
        console.log("Changing random song and verse");
        const newSong = songs[Math.floor(Math.random() * songs.length)];
        console.log("New song:", newSong?.title);

        // Extract a verse from the selected song content
        let extractedVerse = "";
        if (newSong?.content) {
          // Split by lines and find verse lines (avoiding section headers)
          const lines = newSong.content.split("\n").filter(
            (line) =>
              line.trim() &&
              !line.toLowerCase().includes("verse") &&
              !line.toLowerCase().includes("chorus") &&
              !line.toLowerCase().includes("bridge") &&
              !line.toLowerCase().includes("pre-chorus") &&
              line.length > 20 // Ensure it's a substantial line
          );
          if (lines.length > 0) {
            extractedVerse =
              lines[Math.floor(Math.random() * lines.length)].trim();
          }
        }

        // Fallback to hardcoded verses if no content found
        if (!extractedVerse) {
          extractedVerse = verses[Math.floor(Math.random() * verses.length)];
        }

        console.log("New verse:", extractedVerse);
        setRandomSong(newSong);
        setRandomVerse(extractedVerse.trim());
      }, 60000); // Changed to 1 minute (60,000 milliseconds)

      return () => {
        console.log("Clearing interval");
        clearInterval(interval);
      };
    } else {
      // Even if no songs, still change verses
      console.log("Setting up verse-only interval");
      const interval = setInterval(() => {
        console.log("Changing random verse only");
        const newVerse = verses[Math.floor(Math.random() * verses.length)];
        console.log("New verse:", newVerse);
        setRandomVerse(newVerse.trim());
      }, 60000); // Changed to 1 minute

      return () => clearInterval(interval);
    }
  }, [songs]); // Removed verses from dependency array

  // Memoize event handlers to prevent unnecessary re-renders
  const handleMinimize = useCallback(() => {
    dispatch(minimizeApp());
  }, [dispatch]);

  const handleMaximize = useCallback(() => {
    dispatch(maximizeApp());
  }, [dispatch]);

  const handleClose = useCallback(() => {
    dispatch(closeApp());
  }, [dispatch]);

  // Navigate to screens with memoized callbacks
  const navigateToSongs = useCallback(() => {
    dispatch(setCurrentScreen("Songs"));
  }, [dispatch]);

  // Use will-change to optimize GPU rendering
  const willChangeStyle = { willChange: "transform, opacity" };

  // Colors for country gospel theme
  const colors = {
    hdColor: "bg-[#694a3f]",
    hdButton: "bg-[#c77c5d]",
    accent: "bg-[#8f6b5e]",
  };

  return (
    <div className="w-screen h-full overflow-hidden bg-gradient-to-br from-[#faeed1] via-[#f3e8d0] to-[#ede0c7] relative font-[garamond]">
      {/* Window controls - top left */}
      <div className="absolute top-4 left-4 z-50">
        <div className="flex items-center space-x-2">
          <WindowControlButton
            type="close"
            onClick={handleClose}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
          <WindowControlButton
            type="minimize"
            onClick={handleMinimize}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
          <WindowControlButton
            type="maximize"
            onClick={handleMaximize}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-[#9a674a]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-[#faeed1] font-[garamond] text-lg animate-pulse">
            Loading...
          </div>
        </div>
      )}

      {/* Receipt Container - Horizontal Layout */}
      <div className="h-full flex items-center justify-center p-6">
        <div
          className="max-w-6xl w-full mx-auto bg-[#faeed1] relative shadow-2xl"
          style={{
            clipPath:
              "polygon(0 0, 97% 0, 100% 2%, 97% 4%, 100% 6%, 97% 8%, 100% 10%, 97% 12%, 100% 14%, 97% 16%, 100% 18%, 97% 20%, 100% 22%, 97% 24%, 100% 26%, 97% 28%, 100% 30%, 97% 32%, 100% 34%, 97% 36%, 100% 38%, 97% 40%, 100% 42%, 97% 44%, 100% 46%, 97% 48%, 100% 50%, 97% 52%, 100% 54%, 97% 56%, 100% 58%, 97% 60%, 100% 62%, 97% 64%, 100% 66%, 97% 68%, 100% 70%, 97% 72%, 100% 74%, 97% 76%, 100% 78%, 97% 80%, 100% 82%, 97% 84%, 100% 86%, 97% 88%, 100% 90%, 97% 92%, 100% 94%, 97% 96%, 100% 98%, 97% 100%, 0 100%)",
          }}
        >
          {/* Receipt Paper Texture */}
          <div
            className="absolute inset-0 opacity-10 bg-repeat"
            style={{
              backgroundImage: `repeating-linear-gradient(
                   90deg,
                   transparent,
                   transparent 8px,
                   rgba(154, 103, 74, 0.1) 8px,
                   rgba(154, 103, 74, 0.1) 10px
                 )`,
            }}
          ></div>

          {/* Receipt Content - Horizontal Grid */}
          <div className="relative p-8 grid grid-cols-12 gap-6 items-start">
            {/* Left Section - Header & Welcome (3 columns) */}
            <div className="col-span-3 space-y-4">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-dashed border-[#9a674a]/40 pb-4">
                <div className="flex items-center justify-center mb-2">
                  <img
                    src="./evsongsicon.png"
                    alt="Piano Icon"
                    className="w-12 h-12 opacity-90 mr-2"
                  />
                </div>
                <h1 className="text-xl font-bold text-[#9a674a] font-[garamond] tracking-wider">
                  ZION MUSIC
                </h1>
                <p className="text-[14px] text-[#8c6e63] font-[garamond] uppercase tracking-widest">
                  ═══ COLLECTION ═══
                </p>
                <p className="text-[14px] text-[#8c6e63]/80 font-[garamond] mt-1">
                  Est. 2024
                </p>
              </div>

              {/* Welcome Message */}
              <div className="text-center">
                <p className="text-sm text-[#8c6e63] font-[garamond] mb-2">
                  Welcome to your
                </p>
                <p className="text-sm text-[#8c6e63] font-[garamond] mb-2">
                  music collection
                </p>
                <div className="border-t border-b border-dashed border-[#9a674a]/30 py-2">
                  <p className="text-[14px] text-[#8c6e63]/80 font-[garamond] leading-relaxed">
                    Wonderful hymns &
                    <br />
                    healing songs
                  </p>
                </div>
              </div>

              {/* Decorative Wheat Image */}
              <div className="flex justify-center pt-2">
                <img
                  src="./wheat1.png"
                  alt="Wheat decoration"
                  className="w-16 h-16 rounded-full border border-[#9a674a]/30 opacity-70"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Middle Section - Two Cards (6 columns) */}
            <div className="col-span-6 space-y-4">
              {/* Browse Songs Item */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-[#f3e8d0] border-2 border-dashed border-[#9a674a]/40 rounded-none p-4 cursor-pointer hover:bg-[#ede0c7] transition-all duration-300"
                onClick={navigateToSongs}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#9a674a] rounded flex items-center justify-center">
                      <Music className="w-4 h-4 text-[#faeed1]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#9a674a] font-[garamond] uppercase">
                        BROWSE SONGS COLLECTION
                      </h3>
                      <p className="text-[14px] text-[#8c6e63] font-[garamond]">
                        {songs?.length || 0} hymns available for worship
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] text-[#9a674a] font-[garamond] font-bold">
                      CLICK →
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-dotted border-[#9a674a]/30">
                  <p className="text-[14px] text-[#8c6e63] font-[garamond]">
                    Access your complete collection of spiritual songs and hymns
                  </p>
                </div>
              </motion.div>

              {/* Daily Inspiration Item */}
              <motion.div
                className="bg-[#ede0c7] border-2 border-dashed border-white rounded-none p-4 relative overflow-hidden"
                style={{
                  backgroundImage: "url('./wood6.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  // backgroundBlendMode: "multiply"
                }}
              >
                {/* Wood overlay for better text readability */}
                <div className="absolute inset-0 bg-[#ede0c7]/40 backdrop"></div>

                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#8c6e63] rounded flex items-center justify-center">
                      <Book className="w-4 h-4 text-[#faeed1]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-[garamond] uppercase">
                        Random Song verse
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] text-white font-[garamond] font-bold">
                      ♪ LIVE
                    </div>
                  </div>
                </div>

                <div className="relative z-10 border-t border-dotted border-white pt-3 h-20 flex flex-col justify-between">
                  <motion.div
                    key={`verse-${randomVerse}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-[16px] text-white font-[garamond] italic leading-relaxed mb-2 flex-1 overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html: `${randomVerse.trim()}`,
                    }}
                  />
                  <motion.div
                    key={`song-title-${randomSong?.title || "default"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-[14px] text-white font-[garamond] font-semibold"
                  >
                    — {randomSong?.title || "Song Title"}
                  </motion.div>
                </div>
              </motion.div>

              {/* Get Started Section */}
              <div className="border-t-2 border-dashed border-[#9a674a]/40 pt-4">
                <div className="text-center">
                  <p className="text-[14px] text-[#8c6e63] font-[garamond] mb-2">
                    ═══════════════════════════════════════
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={navigateToSongs}
                    className="bg-[#9a674a] text-[#faeed1] px-8 py-2 font-[garamond] text-sm font-bold uppercase tracking-wider hover:bg-[#8c6e63] transition-all duration-300 border-2 border-dashed border-[#9a674a]"
                  >
                    ★ Go to songs ★
                  </motion.button>
                  <p className="text-[14px] text-[#8c6e63] font-[garamond] mt-2">
                    ═══════════════════════════════════════
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Portrait & Footer (3 columns) */}
            <div className="col-span-3 space-y-4 text-center">
              {/* Main Portrait Image */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src="./grandp1.png"
                    alt="Vintage portrait"
                    className="w-24 h-24 rounded-full border-2 border-[#9a674a]/30 shadow-md opacity-80"
                    loading="lazy"
                  />
                  {/* Decorative corner elements */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#9a674a]/40 border-dashed"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#9a674a]/40 border-dashed"></div>
                </div>
              </div>

              {/* Receipt ID & Info */}
              <div className="border border-dashed border-[#9a674a]/30 p-3">
                <p className="text-[14px] text-[#8c6e63] font-[garamond] font-bold">
                  RECEIPT #2024
                </p>
                <p className="text-[14px] text-[#8c6e63]/60 font-[garamond]">
                  ZION MUSIC COLLECTION
                </p>
                <p className="text-[14px] text-[#8c6e63]/60 font-[garamond]">
                  BLESSED MUSIC COLLECTION
                </p>
              </div>

              {/* Quote Attribution */}
              <div className="text-[15px] text-[#8c6e63] font-[garamond] leading-tight border-t border-dashed border-[#9a674a]/30 pt-3">
                <p className="italic">"Let me listen to what kind of music</p>
                <p className="italic">you're playing on your radio, and I'll</p>
                <p className="italic">
                  tell you what kind of a person you are."
                </p>
                <p className="mt-2 text-[10px]">
                  — Making The Valley Full Of Ditches
                </p>
                <p className="text-[10px]">(William Branham, 56-0728)</p>
              </div>

              {/* Final Thank You */}
              <div
                className="text-[14px] text-[#8c6e63]/40 font-[garamond] border-t border-dashed border-[#9a674a]/30 pt-2 relative p-3 rounded overflow-hidden"
                style={{
                  backgroundImage: "url('./wood6.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundBlendMode: "multiply",
                }}
              >
                {/* Wood overlay for better text readability */}
                <div className="absolute inset-0 bg-[#faeed1]/30 text-white"></div>

                <div className="relative z-10 text-white">
                  <p>The Lord bless </p>
                  <p>your heart greatly</p>
                  <p>═══════════════</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
