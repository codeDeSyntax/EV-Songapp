import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import { decodeSongData } from "@/vmusic/ControlRoom/utils/songFileFormat";
import { InstrumentCluster } from "@/vmusic/components/InstrumentCluster";
import HomeBackgroundPattern from "@/vmusic/components/HomeBackgroundPattern";

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
  });
};

// Array of gospel verses
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
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [randomVerse, setRandomVerse] = useState("");

  const dispatch = useAppDispatch();
  const songs = useAppSelector((state) => state.songs.songs);

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
    if (songs && songs.length > 0) {
      const newSong = songs[Math.floor(Math.random() * songs.length)];

      let extractedVerse = getRandomVerseFromSong(newSong);
      if (!extractedVerse) {
        extractedVerse = verses[Math.floor(Math.random() * verses.length)];
      }

      setRandomVerse(extractedVerse.trim());
    } else {
      // Set initial verse even if no songs
      setRandomVerse(verses[Math.floor(Math.random() * verses.length)].trim());
    }
  }, [songs]);

  // Change random song and verse every 5 seconds
  useEffect(() => {
    if (songs && songs.length > 0) {
      const interval = setInterval(() => {
        const newSong = songs[Math.floor(Math.random() * songs.length)];

        let extractedVerse = getRandomVerseFromSong(newSong);
        if (!extractedVerse) {
          extractedVerse = verses[Math.floor(Math.random() * verses.length)];
        }

        setRandomVerse(extractedVerse.trim());
      }, 60000); // Changed to 1 minute (60,000 milliseconds)

      return () => clearInterval(interval);
    } else {
      // Even if no songs, still change verses
      const interval = setInterval(() => {
        const newVerse = verses[Math.floor(Math.random() * verses.length)];
        setRandomVerse(newVerse.trim());
      }, 60000); // Changed to 1 minute

      return () => clearInterval(interval);
    }
  }, [songs]); // Removed verses from dependency array

  // Navigate to screens with memoized callbacks
  const navigateToSongs = useCallback(() => {
    dispatch(setCurrentScreen("Songs"));
  }, [dispatch]);

  const navigateToGuide = useCallback(() => {
    dispatch(setCurrentScreen("userguide"));
  }, [dispatch]);

  return (
    <div className="w-screen h-full overflow-hidden relative bg-app-bg text-app-text">
      {/* Modern soundwave & geometric matrix background */}
      <HomeBackgroundPattern />

      {/* Loading indicator */}
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-app-bg/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-app-text text-base animate-pulse">
            Loading...
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className="relative z-10 h-full flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-5xl"
        >
          <div className="flex flex-col items-center justify-center text-center gap-1 lg:gap-2">
            <div className="relative w-full flex items-center justify-center -my-2 lg:-my-4">
              <InstrumentCluster />
            </div>

            <div className="max-w-2xl mt-2 space-y-3">
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-app-text leading-tight">
                Welcome to <span className="text-app-accent font-extrabold">Zion Music</span>
              </h1>
              <p className="text-base lg:text-lg text-app-text-muted italic leading-relaxed font-normal max-w-xl mx-auto px-4">
                "Let me listen to what kind of music you're playing on your
                radio. Let me see what kind of pictures you got in your house.
                I'll tell you what you're made out of."
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={navigateToSongs}
                className="group relative cursor-pointer inline-flex items-center gap-2.5 bg-app-accent hover:bg-app-accent/90 text-white font-medium py-2.5 px-7 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border border-black/10 dark:border-white/10"
              >
                <span className="relative z-10 text-sm font-semibold tracking-wide">Open Workspace</span>
                <svg
                  className="relative z-10 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
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
              </button>

              <button
                onClick={navigateToGuide}
                className="cursor-pointer inline-flex items-center gap-1.5 bg-app-surface/60 hover:bg-app-surface text-app-text font-medium py-2.5 px-5 rounded-full shadow-sm hover:shadow transition-all duration-200 border border-app-border text-sm"
              >
                <span>User Guide</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
