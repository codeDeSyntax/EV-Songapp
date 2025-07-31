import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/Provider/Theme";

// Add global type declaration for our shared cache
declare global {
  interface Window {
    BackgroundImageCache?: Map<string, boolean>;
  }
}

interface BackgroundThumbnailProps {
  background: {
    name: string;
    src: string;
    category: string;
    isCustom?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  rotation?: number;
  zIndex?: number;
  scale?: number;
  x?: number;
  y?: number;
}

const BackgroundThumbnail: React.FC<BackgroundThumbnailProps> = React.memo(
  ({
    background,
    isSelected,
    onSelect,
    rotation = 0,
    zIndex = 1,
    scale = 1,
    x = 0,
    y = 0,
  }) => {
    const { isDarkMode } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Use static cache shared between all components to prevent duplicate loading
    const imageCache = React.useMemo(() => {
      // Use global cache if it exists, or create a new one
      if (!window.BackgroundImageCache) {
        window.BackgroundImageCache = new Map<string, boolean>();
      }
      return window.BackgroundImageCache;
    }, []);

    // Check cache immediately
    const isCached = React.useMemo(() => {
      return imageCache.has(background.src);
    }, [imageCache, background.src]);

    // Optimized image loading with error handling and caching
    const handleImageLoad = useCallback(() => {
      setIsLoading(false);
      setImageLoaded(true);
      setError(false);
      // Update the cache
      imageCache.set(background.src, true);
    }, [background.src, imageCache]);

    const handleImageError = useCallback(() => {
      setIsLoading(false);
      setError(true);
      setImageLoaded(false);
      console.warn(`Failed to load background image: ${background.src}`);
    }, [background.src]);

    // Improved image loading with caching and deduplication
    useEffect(() => {
      // Only load if not already cached
      if (imageCache.has(background.src)) {
        setIsLoading(false);
        setImageLoaded(true);
        return;
      }

      const img = imgRef.current;
      if (!img) return;

      // Preload the image for better UX
      const imageLoader = new Image();
      imageLoader.onload = () => {
        imageCache.set(background.src, true);
        handleImageLoad();
      };
      imageLoader.onerror = handleImageError;
      imageLoader.src = background.src;

      return () => {
        imageLoader.onload = null;
        imageLoader.onerror = null;
      };
    }, [background.src, handleImageLoad, handleImageError]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale,
          x,
          y,
          rotate: rotation,
          zIndex: isSelected ? 10 : zIndex,
        }}
        whileHover={{
          scale: scale * 1.05, // Reduced from 1.1 to 1.05 for smoother animation
          zIndex: 10,
          transition: { duration: 0.15 }, // Faster transition
        }}
        className="absolute"
        style={{
          transformOrigin: "center center",
          cursor: "pointer",
          width: "160px",
          height: "200px",
          willChange: "transform", // Optimize for animations
        }}
        onClick={onSelect}
      >
        {/* Polaroid-style card */}
        <div
          className={`
          relative w-full h-full 
          bg-white 
          shadow-lg rounded-sm 
          overflow-hidden
          transition-shadow duration-200
          ${isSelected ? "ring-2 ring-purple-500 shadow-purple-500/20" : ""}
          shadow-gray-300/50
        `}
        >
          {/* Image container */}
          <div className="w-full h-[140px] relative overflow-hidden bg-gray-100">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}

            <img
              ref={imgRef}
              src={background.src}
              alt={background.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{
                opacity: imageLoaded ? 1 : 0,
              }}
              loading="lazy" // Native lazy loading
              decoding="async" // Async image decoding
            />

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-2">
                  <span className="text-xs text-gray-500 block">
                    Failed to load
                  </span>
                  <span className="text-xs text-gray-400 mt-1 block truncate max-w-[120px]">
                    {background.name}
                  </span>
                </div>
              </div>
            )}

            {/* Selected indicator overlay */}
            {isSelected && (
              <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-500 rounded-sm">
                <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="p-3 text-center">
            <h3 className="text-sm font-medium text-gray-800 truncate">
              {background.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {background.category}
              {background.isCustom && " • Custom"}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
);

export default BackgroundThumbnail;
