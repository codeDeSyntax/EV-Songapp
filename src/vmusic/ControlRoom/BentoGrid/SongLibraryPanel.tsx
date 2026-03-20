import React, { useState, useEffect } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setCurrentSlide,
  removeSlide,
  setSlides,
  reorderSlides,
  selectDisplaySlides,
  setCurrentDisplayIndex,
} from "@/store/slices/songSlidesSlice";
import { useProjectionState } from "@/hooks/useProjectionState";
import { Trash2 } from "lucide-react";
import { encodeSongData } from "../utils/songFileFormat";
import { NeuralNetworkBackground } from "./NeuralNetworkBackground";
import { DepthSurface } from "@/shared/DepthButton";

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
  const { slides, currentSlideId, songTitle, currentSongId } = useAppSelector(
    (state) => state.songSlides,
  );
  const displaySlides = useAppSelector(selectDisplaySlides);
  const songs = useAppSelector((state) => state.songs.songs);
  const { isActive: isProjectionActive } = useProjectionState();
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // BUG 17 fix: split into two effects.
  // Effect 1 — read localStorage once on mount (no deps = no cycle).
  // The old single effect had [selectedBgSrc] as a dependency, meaning it
  // re-ran every time selectedBgSrc changed, which could trigger more state
  // updates and create a re-render loop.
  useEffect(() => {
    const savedBg = localStorage.getItem("bmusicpresentationbg");
    if (savedBg) setSelectedBgSrc(savedBg);
  }, []); // mount only

  // Effect 2 — event listener, registered once.
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg" && e.newValue) {
        setSelectedBgSrc(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []); // mount only

  // Keyboard navigation for slides when projection is active
  // NOTE: This is disabled because PreviewPanel handles arrow key navigation with display array
  // Keeping this enabled causes conflicts and skips chorus repeats
  // useEffect(() => {
  //   if (!isProjectionActive || slides.length === 0) return;

  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // Only handle if not in an input/textarea
  //     if (
  //       document.activeElement?.tagName.toLowerCase() === "input" ||
  //       document.activeElement?.tagName.toLowerCase() === "textarea"
  //     ) {
  //       return;
  //     }

  //     const currentIndex = slides.findIndex((s) => s.id === currentSlideId);

  //     if (e.key === "ArrowRight" || e.key === "ArrowDown") {
  //       e.preventDefault();
  //       // Go to next slide
  //       if (currentIndex < slides.length - 1) {
  //         const nextSlide = slides[currentIndex + 1];
  //         handleSlideSelect(nextSlide.id);
  //       }
  //     } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
  //       e.preventDefault();
  //       // Go to previous slide
  //       if (currentIndex > 0) {
  //         const prevSlide = slides[currentIndex - 1];
  //         handleSlideSelect(prevSlide.id);
  //       }
  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [isProjectionActive, slides, currentSlideId]);

  const handleDeleteSlide = async () => {
    if (!currentSlideId) {
      onSaveError("No slide selected to delete.");
      return;
    }

    if (slides.length === 1) {
      onSaveError(
        "Cannot delete the last slide. A song must have at least one slide.",
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

        // BUG 16 fix: O(n) counter map instead of O(n²) indexOf-inside-map
        const typeCounters: Record<string, number> = {};
        const renumberedSlides = updatedSlides.map((slide) => {
          typeCounters[slide.type] = (typeCounters[slide.type] || 0) + 1;
          const newNumber = typeCounters[slide.type];
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

        // Get current song to preserve isPrelisted status
        const currentSong = currentSongId
          ? songs.find((s) => s.id === currentSongId)
          : null;
        const isPrelisted = currentSong?.isPrelisted || false;

        const encodedContent = encodeSongData(
          songTitle,
          renumberedSlides,
          isPrelisted,
        );
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
    // Find the FIRST occurrence of this slide in the display array
    const displayIndex = displaySlides.findIndex((s) => s.id === slideId);

    if (displayIndex !== -1) {
      dispatch(setCurrentDisplayIndex(displayIndex));
    } else {
      // Fallback to original behavior if not found in display array
      dispatch(setCurrentSlide(slideId));
    }

    // If projection is active, send slide update to projection window
    if (isProjectionActive) {
      const currentIndex = slides.findIndex((s) => s.id === slideId);
      const currentSlide = slides[currentIndex];

      if (currentSlide) {
        // BUG 12 fix: omit the full slides array — the projection window
        // already has it. Only the index needs to change for navigation.
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
        };

        await window.api.sendToSongProjection(slideData);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
    // Add a slight opacity to the dragged element
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder slides in Redux
    dispatch(reorderSlides({ fromIndex: draggedIndex, toIndex: dropIndex }));

    // Auto-save if song has a title
    if (songTitle) {
      try {
        // Get the updated slides after reordering
        const updatedSlides = [...slides];
        const [movedSlide] = updatedSlides.splice(draggedIndex, 1);
        updatedSlides.splice(dropIndex, 0, movedSlide);

        // BUG 16 fix: O(n) counter map. Pre-count choruses to decide label.
        const chorusTotal = updatedSlides.filter(
          (s) => s.type === "chorus",
        ).length;
        const dropTypeCounters: Record<string, number> = {};
        const renumberedSlides = updatedSlides.map((slide) => {
          dropTypeCounters[slide.type] =
            (dropTypeCounters[slide.type] || 0) + 1;
          const newNumber = dropTypeCounters[slide.type];

          let newLabel: string;
          if (slide.type === "chorus") {
            newLabel = chorusTotal === 1 ? "Chorus" : `Chorus ${newNumber}`;
          } else {
            newLabel = `${
              slide.type.charAt(0).toUpperCase() + slide.type.slice(1)
            } ${newNumber}`;
          }

          return {
            ...slide,
            number: newNumber,
            label: newLabel,
          };
        });

        // Get current song to preserve isPrelisted status
        const currentSong = currentSongId
          ? songs.find((s) => s.id === currentSongId)
          : null;
        const isPrelisted = currentSong?.isPrelisted || false;

        const encodedContent = encodeSongData(
          songTitle,
          renumberedSlides,
          isPrelisted,
        );
        await window.api.saveSong("", songTitle, encodedContent);
        onSaveSuccess(`Slides reordered and saved to "${songTitle}".evsong`);
        loadSongs();
      } catch (error) {
        console.error("Error saving after reorder:", error);
        onSaveError("Slides reordered but failed to save to file.");
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="h-full flex flex-col rounded-md bg-white/50 dark:bg-app-surface relative overflow-hidden">
      {/* Neural Network Canvas Background */}
      <NeuralNetworkBackground isDarkMode={isDarkMode} opacity={0.25} />

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-app-border flex items-center justify-between flex-shrink-0 relative z-10">
        <span className="text-ew-sm font-semibold text-app-text tracking-wide">
          Song Slides
        </span>
        <div className="flex items-center gap-2">
          <span className="text-ew-xs text-app-text-muted tabular-nums">
            {slides.length} {slides.length === 1 ? "slide" : "slides"}
          </span>
          <button
            onClick={handleDeleteSlide}
            disabled={!currentSlideId || slides.length === 1}
            className="h-7 w-7 flex items-center justify-center hover:bg-red-500/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete current slide"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Slides List */}
      <div className="flex-1 px-2 py-2 overflow-y-auto no-scrollbar space-y-1.5 relative z-10">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <img
              src="./no_slides.svg"
              alt="No slides"
              className="w-20 h-20 mb-3 opacity-40"
            />
            <p className="text-ew-sm font-medium text-app-text-muted">
              No slides yet
            </p>
            <p className="text-ew-xs text-app-text-muted mt-1">
              Paste lyrics in the preview panel to create slides
            </p>
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleSlideSelect(slide.id)}
              className={`cursor-grab active:cursor-grabbing rounded-xl overflow-hidden transition-all duration-150 ${
                dragOverIndex === index && draggedIndex !== index
                  ? "ring-2 ring-blue-400 ring-dashed"
                  : currentSlideId === slide.id
                    ? "ring-2 ring-white/70 shadow-lg"
                    : "ring-1 ring-white/10 opacity-75 hover:opacity-100 hover:ring-white/30"
              }`}
              style={{
                opacity: draggedIndex === index ? 0.35 : undefined,
                transform:
                  currentSlideId === slide.id ? "scale(1.015)" : undefined,
              }}
            >
              {/* Card — fixed height mini-preview */}
              <div className="h-[88px] relative">
                {/* Background — Solid, Gradient, Video, or Image */}
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

                {/* Overlay — slightly lighter when selected */}
                <div
                  className={`absolute inset-0 transition-colors ${
                    currentSlideId === slide.id ? "bg-black/25" : "bg-black/45"
                  }`}
                />

                {/* Content row */}
                <div className="relative h-full flex items-stretch px-3 py-2 gap-2.5">
                  {/* Left column: label + type badge */}
                  <div className="flex flex-col justify-between items-start flex-shrink-0 w-[58px]">
                    <span className="text-[10px] font-bold text-white leading-tight drop-shadow">
                      {slide.label}
                    </span>
                    <DepthSurface
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide  ${
                        slide.type === "chorus"
                          ? "bg-yellow-500/75 text-black"
                          : slide.type === "bridge"
                            ? "bg-yellow-500/75 text-black"
                            : "bg-black/60 text-white"
                      }`}
                    >
                      {slide.type}
                    </DepthSurface>
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-white/20 self-stretch flex-shrink-0" />

                  {/* Right column: content preview */}
                  <div className="flex-1 flex items-center overflow-hidden">
                    <p
                      className="text-[11px] text-white/85 leading-relaxed line-clamp-4 whitespace-pre-wrap w-full"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                    >
                      {slide.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
