import React, { useState, useEffect } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setCurrentSlide,
  removeSlide,
  setSlides,
} from "@/store/slices/songSlidesSlice";
import { useProjectionState } from "@/hooks/useProjectionState";
import { Trash2 } from "lucide-react";
import { encodeSongData } from "../utils/songFileFormat";

interface SongLibraryPanelProps {
  isDarkMode: boolean;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
  loadSongs: () => void;
}

export const SongLibraryPanel: React.FC<SongLibraryPanelProps> = ({
  isDarkMode,
  onSaveSuccess,
  onSaveError,
  loadSongs,
}) => {
  const dispatch = useAppDispatch();
  const { slides, currentSlideId, songTitle } = useAppSelector(
    (state) => state.songSlides
  );
  const { isActive: isProjectionActive } = useProjectionState();
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");

  // Detect background type
  const backgroundType = React.useMemo(() => {
    if (selectedBgSrc.startsWith("solid:")) {
      return "solid";
    }
    if (selectedBgSrc.startsWith("gradient:")) {
      return "gradient";
    }
    if (
      selectedBgSrc.endsWith(".mp4") ||
      selectedBgSrc.endsWith(".webm") ||
      selectedBgSrc.endsWith(".mov")
    ) {
      return "video";
    }
    return "image";
  }, [selectedBgSrc]);

  // Extract background value
  const backgroundValue = React.useMemo(() => {
    if (backgroundType === "solid") {
      return selectedBgSrc.replace("solid:", "");
    }
    if (backgroundType === "gradient") {
      return selectedBgSrc.replace("gradient:", "");
    }
    return selectedBgSrc;
  }, [selectedBgSrc, backgroundType]);

  // Check if background is a video (legacy support)
  const isVideoBg = React.useMemo(() => {
    return backgroundType === "video";
  }, [backgroundType]);

  // Load saved background on mount and poll for changes
  useEffect(() => {
    const updateBackground = () => {
      const savedBg = localStorage.getItem("bmusicpresentationbg");
      if (savedBg && savedBg !== selectedBgSrc) {
        setSelectedBgSrc(savedBg);
      }
    };

    // Initial load
    updateBackground();

    // Poll for changes every 100ms to catch immediate updates
    const interval = setInterval(updateBackground, 100);

    // Also listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg" && e.newValue) {
        setSelectedBgSrc(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [selectedBgSrc]);

  // Keyboard navigation for slides when projection is active
  useEffect(() => {
    if (!isProjectionActive || slides.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      if (
        document.activeElement?.tagName.toLowerCase() === "input" ||
        document.activeElement?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const currentIndex = slides.findIndex((s) => s.id === currentSlideId);

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        // Go to next slide
        if (currentIndex < slides.length - 1) {
          const nextSlide = slides[currentIndex + 1];
          handleSlideSelect(nextSlide.id);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        // Go to previous slide
        if (currentIndex > 0) {
          const prevSlide = slides[currentIndex - 1];
          handleSlideSelect(prevSlide.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProjectionActive, slides, currentSlideId]);

  const handleDeleteSlide = async () => {
    if (!currentSlideId) {
      onSaveError("No slide selected to delete.");
      return;
    }

    if (slides.length === 1) {
      onSaveError(
        "Cannot delete the last slide. A song must have at least one slide."
      );
      return;
    }

    // Remove slide from Redux state
    dispatch(removeSlide(currentSlideId));

    // Auto-save to file if we have a title
    if (songTitle) {
      try {
        // Filter out the deleted slide
        const updatedSlides = slides.filter((s) => s.id !== currentSlideId);

        // Renumber slides by type
        const renumberedSlides = updatedSlides.map((slide) => {
          // Count how many slides of the same type come before this one
          const sameTypeBefore = updatedSlides
            .slice(0, updatedSlides.indexOf(slide))
            .filter((s) => s.type === slide.type).length;

          const newNumber = sameTypeBefore + 1;

          return {
            ...slide,
            number: newNumber,
            label: `${
              slide.type.charAt(0).toUpperCase() + slide.type.slice(1)
            } ${newNumber}`,
          };
        });

        // Update Redux state with renumbered slides
        dispatch(setSlides(renumberedSlides));

        const encodedContent = encodeSongData(songTitle, renumberedSlides);
        await window.api.saveSong("", songTitle, encodedContent);
        onSaveSuccess(`Slide deleted and saved to "${songTitle}".evsong`);
        // Reload songs to refresh the list
        loadSongs();
      } catch (error) {
        console.error("Error saving after delete:", error);
        onSaveError("Slide deleted but failed to save to file.");
      }
    }
  };

  const handleSlideSelect = async (slideId: string) => {
    dispatch(setCurrentSlide(slideId));

    // If projection is active, send slide update to projection window
    if (isProjectionActive) {
      const currentIndex = slides.findIndex((s) => s.id === slideId);
      const currentSlide = slides[currentIndex];

      if (currentSlide) {
        const slideData = {
          type: "SLIDE_UPDATE",
          slide: {
            content: currentSlide.content,
            type: currentSlide.type,
            number: currentSlide.number,
          },
          songTitle: songTitle || "Untitled Song",
          currentIndex,
          totalSlides: slides.length,
          backgroundColor: "#000000",
          slides: slides.map((slide) => ({
            content: slide.content,
            type: slide.type,
            number: slide.number,
          })),
        };

        await window.api.sendToSongProjection(slideData);
      }
    }
  };
  return (
    <div
      className="h-full flex flex-col rounded-md bg-white/50 dark:bg-black  px-0 py-0"
      style={{
        border: "none",
        boxShadow: "none",
      }}
    >
      {/* Header */}
      <div className="p-3  border-b border-app-border flex items-center justify-between flex-shrink-0">
        <span className="text-ew-sm font-medium text-app-text">
          Song Slides
        </span>
        <div className="flex items-center gap-2">
          <p className="text-ew-xs text-app-text-muted">
            {slides.length} {slides.length === 1 ? "slide" : "slides"}
          </p>
          <button
            onClick={handleDeleteSlide}
            disabled={!currentSlideId || slides.length === 1}
            className="h-8 w-8  hover:bg-red-500/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete current slide"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Slides List */}
      <div className="flex-1 p-2  overflow-y-auto no-scrollbar pb-20 space-y-2 ">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gp text-center px-4">
            <img
              src="./no_slides.svg"
              alt="No slides"
              className="w-24 h-24 mb-4 opacity-50"
            />
            <p className="text-ew-sm font-medium text-app-text-muted">
              No slides yet
            </p>
            <p className="text-ew-xs text-app-text-muted mt-2">
              Paste lyrics in the preview panel to create slides
            </p>
          </div>
        ) : (
          slides.map((slide) => (
            <div
              key={slide.id}
              onClick={() => handleSlideSelect(slide.id)}
              className="cursor-pointer "
            >
              <GamyCard
                isDarkMode={isDarkMode}
                className={`overflow-hidden w-[90%] rounded-2xl  m-auto transition-all hover:scale-[1.02] h-24 px-0 py-0 ${
                  currentSlideId === slide.id
                    ? "ring-2 ring-app-text-muted"
                    : ""
                }`}
                style={{
                  borderRadius: "20px",
                }}
              >
                <div className="h-full relative px-2">
                  {/* Background - Solid, Gradient, Video or Image */}
                  {selectedBgSrc &&
                    (backgroundType === "video" ? (
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src={backgroundValue}
                        muted
                        playsInline
                      />
                    ) : backgroundType === "solid" ? (
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: backgroundValue }}
                      />
                    ) : backgroundType === "gradient" ? (
                      <div
                        className="absolute inset-0"
                        style={{ background: backgroundValue }}
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${backgroundValue})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    ))}

                  {/* Semi-transparent overlay for readability */}
                  <div className="absolute inset-0 bg-black/30 " />

                  {/* Content */}
                  <div className="relative h-[90%] p-2 flex  items-start justify-between overflow-hidden mb-4">
                    {/* Slide Header */}
                    <div className=" p-2 gap-2 top-0 left-0 flex flex-col items-center justify-between mb-1 flex-shrink-0">
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {slide.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 font-bold py-0.5 rounded ${
                          slide.type === "chorus"
                            ? "bg-app-blue/80 text-white"
                            : slide.type === "bridge"
                            ? "bg-app-accent/80 text-white"
                            : "bg-black text-white"
                        }`}
                      >
                        {slide.type}
                      </span>
                    </div>

                    {/* Slide Content Preview - Vertical Text */}
                    <div className="flex-1 overflow-hidden flex items-start justify-start ">
                      <span
                        className="text-[12px] text-white/70 dark:text-white leading-tight whitespace-pre-wrap line-clamp-5 font-sans text-left"
                        style={{
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        {slide.content}
                      </span>
                    </div>
                  </div>
                </div>
              </GamyCard>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
