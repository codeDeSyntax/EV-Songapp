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
import { strandPresets } from "@/vmusic/ControlRoom/components/SettingsCards/colorStrandPresets";
import { decodeSongData } from "@/vmusic/ControlRoom/utils/songFileFormat";
import { InstrumentCluster } from "@/vmusic/components/InstrumentCluster";
import CreamMeshBackground from "@/vmusic/components/CreamMeshBackground";

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

  // Helper to extract a random verse from a Song object
  function getRandomVerseFromSong(song: Song): string {
    if (!song?.content) return "";
    try {
      const songData = decodeSongData(song.content);
      if (Array.isArray(songData.slides) && songData.slides.length > 0) {
        const slide =
          songData.slides[Math.floor(Math.random() * songData.slides.length)];
        if (slide?.content) return slide.content;
      }
      return songData.title || "";
    } catch {
      return "";
    }
  }

  // Select a random song and verse when songs change
  useEffect(() => {
    console.log("Songs state:", songs);
    if (songs && songs.length > 0) {
      console.log("Initial random selection - Songs available:", songs.length);
      const newSong = songs[Math.floor(Math.random() * songs.length)];
      console.log("Selected song:", newSong?.title);

      let extractedVerse = getRandomVerseFromSong(newSong);
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

        let extractedVerse = getRandomVerseFromSong(newSong);
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

  // Choose a gradient for theme (could be dynamic based on theme, here using Holy Gold)
  const themeGradient =
    strandPresets.find((p) => p.name === "Holy Gold")?.gradient ||
    strandPresets[0].gradient;

  // Custom brown art pattern for backgrounds
  const brownArtPattern = `
  repeating-linear-gradient(135deg, #f3e8d0 0px, #f3e8d0 12px, #c8b08e 12px, #c8b08e 24px),
  linear-gradient(120deg, #d2b48c 0%, #bfa27a 100%),
  radial-gradient(circle at 20% 80%, #8b5c2a 0%, transparent 60%),
  radial-gradient(circle at 80% 20%, #e6c29c 0%, transparent 70%)
`;

  return (
    <div className="w-screen h-full overflow-hidden bg-gradient-to-br from-[#faeed1] via-[#f3e8d0] to-[#ede0c7] relative font-[garamond]">
      {/* Cream mesh/grid SVG background */}
      <CreamMeshBackground />
      {/* Mesh/blurred cream accents */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-1/4 top-1/4 w-40 h-40 bg-gradient-to-br from-[#faeed1]/40 to-[#ede0c7]/20 rounded-full blur-2xl animate-pulse"></div>
        <div
          className="absolute right-1/4 bottom-1/4 w-56 h-56 bg-gradient-to-br from-[#f3e8d0]/30 to-[#faeed1]/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

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

      {/* Main content container */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex w-full flex-col items-center justify-center text-center ">
            {/* Centerpiece: Musical Instrument Cluster */}
            <div className="relative w-full flex items-center justify-center">
              <InstrumentCluster />
            </div>
            {/* Headline and description */}
            <div className="max-w-3xl">
              <div className="space-y-2">
                <p className="text-lg lg:text-xl text-[#9a674a] leading-relaxed">
                  Welcome to{" "}
                  <span className="font-bold text-[#c77c5d]">Zion Music</span>
                </p>
                <p className="text-sm lg:text-base text-[#8c6e63] leading-relaxed font-ThePriest">
                  Let me listen to what kind of music you're playing on your
                  radio. Let me see what kind of pictures you got in your house.
                  I'll tell you what you're made out of.
                </p>
              </div>
              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-2">
                <div className="inline-flex items-center gap-2 bg-[#faeed1]/60 backdrop-blur border border-[#9a674a]/30 rounded-full px-2.5 py-1">
                  <span className="text-xs text-[#9a674a]">
                    Live Projection
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#faeed1]/60 backdrop-blur border border-[#9a674a]/30 rounded-full px-2.5 py-1">
                  <span className="text-xs text-[#9a674a]">Song Library</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#faeed1]/60 backdrop-blur border border-[#9a674a]/30 rounded-full px-2.5 py-1">
                  <span className="text-xs text-[#9a674a]">
                    Easy Presentation
                  </span>
                </div>
              </div>
              {/* CTA Button */}
              <div className="space-y-2">
                <button
                  onClick={navigateToSongs}
                  className="group relative cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-[#c77c5d] to-[#9a674a] hover:from-[#9a674a] hover:to-[#c77c5d] text-white font-medium py-2.5 px-5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10 text-sm">Get started</span>
                  <svg
                    className="relative z-10 w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
