import React, { useEffect } from "react";
import { useProjectionData } from "./hooks/useProjectionData";
import { SlideContent } from "./components/SlideContent";
import { ProjectionControls } from "./components/ProjectionControls";

interface Slide {
  content: string;
  type: string;
  number?: number;
}

interface SongData {
  title: string;
  content: string;
  slides?: Slide[];
}

interface SongPresentationDisplayProps {
  initialSong?: SongData;
}

const SongPresentationDisplay: React.FC<SongPresentationDisplayProps> = ({
  initialSong,
}) => {
  const {
    slides,
    currentIndex,
    songTitle,
    fontSizeMultiplier,
    backgroundImage,
    fontFamily,
    overlayOpacity,
    isExternalDisplay,
    currentSlide,
    lastProjectedSong,
    increaseFontSize,
    decreaseFontSize,
    goToNext,
    goToPrevious,
    handleSongData,
  } = useProjectionData();

  // Get the slide to display: current slide, or first slide of last projected song if available
  const displaySlide =
    currentSlide ||
    (lastProjectedSong?.slides && lastProjectedSong.slides.length > 0
      ? lastProjectedSong.slides[0]
      : null);

  // Load initial song if provided
  useEffect(() => {
    if (initialSong) {
      handleSongData(initialSong);
    }
  }, [initialSong, handleSongData]);

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black">
      {/* Main slide content */}
      {displaySlide ? (
        <SlideContent
          content={displaySlide.content}
          fontFamily={fontFamily}
          fontSizeMultiplier={fontSizeMultiplier}
          backgroundImage={backgroundImage}
          overlayOpacity={overlayOpacity}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-app-surface dark:bg-black">
          <img
            src="./nosong.png"
            alt="No slide to display"
            className="max-w-md opacity-50"
          />
        </div>
      )}

      {/* Controls overlay (only show if not external display) */}
      <ProjectionControls
        currentIndex={currentIndex}
        totalSlides={slides.length}
        fontSizeMultiplier={fontSizeMultiplier}
        onNext={goToNext}
        onPrevious={goToPrevious}
        onIncreaseFontSize={increaseFontSize}
        onDecreaseFontSize={decreaseFontSize}
        isExternalDisplay={isExternalDisplay}
      />

      {/* Song title overlay (for debugging) */}
      {songTitle && !isExternalDisplay && (
        <div className="absolute top-4 left-4 z-40">
          <div className="bg-black/50 rounded-md px-3 py-2 border border-white/10">
            <p className="text-white text-xs font-mono">{songTitle}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongPresentationDisplay;
