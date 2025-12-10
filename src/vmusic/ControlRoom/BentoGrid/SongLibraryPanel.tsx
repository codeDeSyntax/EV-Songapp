import React, { useState, useEffect } from "react";
import { GamyCard } from "../../shared/GamyCard";
import { useAppSelector, useAppDispatch } from "@/store";
import { setCurrentSlide } from "@/store/slices/songSlidesSlice";

interface SongLibraryPanelProps {
  isDarkMode: boolean;
}

export const SongLibraryPanel: React.FC<SongLibraryPanelProps> = ({
  isDarkMode,
}) => {
  const dispatch = useAppDispatch();
  const { slides, currentSlideId } = useAppSelector(
    (state) => state.songSlides
  );
  const [selectedBgSrc, setSelectedBgSrc] = useState<string>("");

  // Load saved background on mount
  useEffect(() => {
    const savedBg = localStorage.getItem("bmusicpresentationbg");
    if (savedBg) {
      setSelectedBgSrc(savedBg);
    }
  }, []);

  // Listen for background changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bmusicpresentationbg" && e.newValue) {
        setSelectedBgSrc(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSlideSelect = (slideId: string) => {
    dispatch(setCurrentSlide(slideId));
  };
  return (
    <GamyCard
      isDarkMode={isDarkMode}
      blackBackground={true}
      className="h-full flex flex-col bg-app-surface"
      style={{
        border: "none",
        boxShadow: "none",
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-app-border flex items-center justify-between flex-shrink-0">
        <span className="text-ew-sm font-medium text-app-text">
          Song Slides
        </span>
        <p className="text-ew-xs text-app-text-muted mt-1">
          {slides.length} {slides.length === 1 ? "slide" : "slides"}
        </p>
      </div>

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-ew-sm text-app-text-muted">No slides yet</p>
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
                className={`overflow-hidden w-[90%]  m-auto transition-all hover:scale-[1.02] h-24 px-0 py-0 ${
                  currentSlideId === slide.id ? "ring-2 ring-app-blue" : ""
                }`}
              >
                <div
                  className="h-full relative bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: selectedBgSrc
                      ? `url(${selectedBgSrc})`
                      : "none",
                  }}
                >
                  {/* Semi-transparent overlay for readability */}
                  <div className="absolute inset-0 bg-black/30" />

                  {/* Content */}
                  <div className="relative h-full p-2 flex flex-col">
                    {/* Slide Header */}
                    <div className="flex items-center justify-between mb-1 flex-shrink-0">
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {slide.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 font-bold py-0.5 rounded ${
                          slide.type === "chorus"
                            ? "bg-app-blue/80 text-white"
                            : slide.type === "bridge"
                            ? "bg-app-accent/80 text-white"
                            : "bg-gray-700/80 text-white"
                        }`}
                      >
                        {slide.type}
                      </span>
                    </div>

                    {/* Slide Content Preview - Vertical Text */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center">
                      <pre
                        className="text-[12px] text-white leading-tight whitespace-pre-wrap line-clamp-4 font-sans text-center"
                        style={{
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        {slide.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </GamyCard>
            </div>
          ))
        )}
      </div>
    </GamyCard>
  );
};
